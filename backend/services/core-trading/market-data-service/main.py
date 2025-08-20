"""
Market Data Service
Real-time and historical market data ingestion and distribution
"""

import asyncio
import os
import logging
import json
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone, timedelta
from contextlib import asynccontextmanager

import uvicorn
import websockets
import aiohttp
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.responses import JSONResponse
import robin_stocks as rs
import redis.asyncio as redis
from pydantic import BaseModel
import pandas as pd
import numpy as np

# Add parent directories to path
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '../../../..'))

from backend.shared.utils import setup_logging, get_environment_config, RateLimiter, sanitize_symbol
from backend.shared.monitoring import MetricsCollector, HealthChecker, performance_profiler

# Environment setup
ENV = os.getenv('SAMRDDHI_ENV', 'dev')
config = get_environment_config(ENV)
logger = setup_logging(f"market-data-service-{ENV}", ENV)

# Models
class MarketDataPoint(BaseModel):
    symbol: str
    timestamp: datetime
    price: float
    volume: int
    bid: Optional[float] = None
    ask: Optional[float] = None
    bid_size: Optional[int] = None
    ask_size: Optional[int] = None

class OHLCV(BaseModel):
    symbol: str
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int
    vwap: Optional[float] = None

class TechnicalIndicators(BaseModel):
    symbol: str
    timestamp: datetime
    sma_20: Optional[float] = None
    sma_50: Optional[float] = None
    ema_12: Optional[float] = None
    ema_26: Optional[float] = None
    rsi: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    bb_upper: Optional[float] = None
    bb_middle: Optional[float] = None
    bb_lower: Optional[float] = None
    atr: Optional[float] = None

# Global variables
redis_client: Optional[redis.Redis] = None
metrics_collector: MetricsCollector = None
health_checker: HealthChecker = None
robinhood_client = None
websocket_connections: Dict[str, List[WebSocket]] = {}
active_subscriptions: set = set()
market_data_cache: Dict[str, Dict] = {}
rate_limiter = RateLimiter(max_calls=300, time_window=300)  # 300 calls per 5 minutes

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global redis_client, metrics_collector, health_checker, robinhood_client
    
    # Startup
    logger.info(f"Starting Market Data Service - Environment: {ENV}")
    
    # Initialize Redis
    try:
        redis_client = redis.from_url(
            f"redis://{config['REDIS_HOST']}:{config['REDIS_PORT']}/{config['REDIS_DB']}"
        )
        await redis_client.ping()
        logger.info("Redis connection established")
    except Exception as e:
        logger.error(f"Redis connection failed: {e}")
        redis_client = None
    
    # Initialize Robinhood client
    try:
        rh_username = config.get('RH_USERNAME')
        rh_password = config.get('RH_PASSWORD')
        
        if rh_username and rh_password:
            robinhood_client = rs
            # Login to Robinhood (in production, handle 2FA properly)
            rs.login(rh_username, rh_password)
            logger.info("Robinhood client initialized")
        else:
            logger.warning("Robinhood credentials not configured")
    except Exception as e:
        logger.error(f"Robinhood client initialization failed: {e}")
        robinhood_client = None
    
    # Initialize metrics and health checker
    metrics_collector = MetricsCollector("market-data-service")
    health_checker = HealthChecker("market-data-service")
    
    # Add health checks
    health_checker.add_check("redis", check_redis_health)
    health_checker.add_check("robinhood", check_robinhood_health)
    
    # Start background tasks
    asyncio.create_task(market_data_update_task())
    asyncio.create_task(websocket_heartbeat_task())
    asyncio.create_task(cache_cleanup_task())
    
    yield
    
    # Shutdown
    if redis_client:
        await redis_client.close()
    logger.info("Market Data Service shutdown complete")

# Create FastAPI app
app = FastAPI(
    title="Market Data Service",
    description="Real-time and historical market data",
    version="1.0.0",
    lifespan=lifespan
)

# Health check functions
async def check_redis_health():
    """Check Redis connectivity"""
    if not redis_client:
        return False
    try:
        await redis_client.ping()
        return True
    except Exception:
        return False

async def check_robinhood_health():
    """Check Robinhood API connectivity"""
    if not robinhood_client:
        return False
    try:
        # Simple test call
        rs.get_quotes("AAPL")
        return True
    except Exception:
        return False

# Background tasks
async def market_data_update_task():
    """Periodically update market data for active subscriptions"""
    while True:
        try:
            if active_subscriptions and rate_limiter.can_make_call():
                await update_subscribed_symbols()
            await asyncio.sleep(1)  # Update every second during market hours
        except Exception as e:
            logger.error(f"Market data update error: {e}")
            await asyncio.sleep(5)

async def websocket_heartbeat_task():
    """Send heartbeat to all websocket connections"""
    while True:
        try:
            await send_heartbeat()
            await asyncio.sleep(30)  # Heartbeat every 30 seconds
        except Exception as e:
            logger.error(f"Websocket heartbeat error: {e}")
            await asyncio.sleep(30)

async def cache_cleanup_task():
    """Clean up old cache entries"""
    while True:
        try:
            await cleanup_cache()
            await asyncio.sleep(300)  # Cleanup every 5 minutes
        except Exception as e:
            logger.error(f"Cache cleanup error: {e}")
            await asyncio.sleep(300)

async def update_subscribed_symbols():
    """Update market data for all subscribed symbols"""
    if not robinhood_client or not active_subscriptions:
        return
    
    performance_profiler.start_profile("market_data_update")
    
    try:
        # Get quotes for all subscribed symbols
        symbols_list = list(active_subscriptions)
        quotes = rs.get_quotes(symbols_list)
        
        for quote in quotes:
            if not quote:
                continue
            
            symbol = quote.get('symbol', '').upper()
            if symbol not in active_subscriptions:
                continue
            
            # Create market data point
            market_data = {
                'symbol': symbol,
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'price': float(quote.get('last_trade_price', 0)),
                'bid': float(quote.get('bid_price', 0)) if quote.get('bid_price') else None,
                'ask': float(quote.get('ask_price', 0)) if quote.get('ask_price') else None,
                'bid_size': int(quote.get('bid_size', 0)) if quote.get('bid_size') else None,
                'ask_size': int(quote.get('ask_size', 0)) if quote.get('ask_size') else None,
                'volume': int(quote.get('volume', 0)),
                'previous_close': float(quote.get('previous_close', 0))
            }
            
            # Cache the data
            market_data_cache[symbol] = market_data
            
            # Store in Redis
            if redis_client:
                await redis_client.setex(
                    f"market_data:{symbol}",
                    60,  # 1 minute expiry
                    json.dumps(market_data, default=str)
                )
            
            # Send to websocket subscribers
            await broadcast_market_data(symbol, market_data)
        
    except Exception as e:
        logger.error(f"Error updating market data: {e}")
    finally:
        performance_profiler.end_profile("market_data_update")

async def broadcast_market_data(symbol: str, data: Dict[str, Any]):
    """Broadcast market data to websocket subscribers"""
    if symbol not in websocket_connections:
        return
    
    message = {
        'type': 'market_data',
        'data': data
    }
    
    # Send to all connections for this symbol
    disconnected_connections = []
    for websocket in websocket_connections[symbol]:
        try:
            await websocket.send_json(message)
        except Exception:
            disconnected_connections.append(websocket)
    
    # Clean up disconnected connections
    for ws in disconnected_connections:
        websocket_connections[symbol].remove(ws)
    
    if not websocket_connections[symbol]:
        del websocket_connections[symbol]
        active_subscriptions.discard(symbol)

async def send_heartbeat():
    """Send heartbeat to all websocket connections"""
    message = {
        'type': 'heartbeat',
        'timestamp': datetime.now(timezone.utc).isoformat()
    }
    
    for symbol, connections in websocket_connections.items():
        disconnected_connections = []
        for websocket in connections:
            try:
                await websocket.send_json(message)
            except Exception:
                disconnected_connections.append(websocket)
        
        # Clean up disconnected connections
        for ws in disconnected_connections:
            connections.remove(ws)

async def cleanup_cache():
    """Clean up old cache entries"""
    current_time = datetime.now(timezone.utc)
    expired_symbols = []
    
    for symbol, data in market_data_cache.items():
        try:
            data_time = datetime.fromisoformat(data['timestamp'].replace('Z', '+00:00'))
            if (current_time - data_time).total_seconds() > 300:  # 5 minutes old
                expired_symbols.append(symbol)
        except Exception:
            expired_symbols.append(symbol)
    
    for symbol in expired_symbols:
        market_data_cache.pop(symbol, None)

def calculate_technical_indicators(symbol: str, historical_data: List[Dict]) -> TechnicalIndicators:
    """Calculate technical indicators from historical data"""
    if len(historical_data) < 50:
        return TechnicalIndicators(symbol=symbol, timestamp=datetime.now(timezone.utc))
    
    # Convert to DataFrame for easier calculation
    df = pd.DataFrame(historical_data)
    df['close'] = df['close'].astype(float)
    df['high'] = df['high'].astype(float)
    df['low'] = df['low'].astype(float)
    df['volume'] = df['volume'].astype(int)
    
    # Calculate indicators
    indicators = TechnicalIndicators(
        symbol=symbol,
        timestamp=datetime.now(timezone.utc)
    )
    
    try:
        # Simple Moving Averages
        if len(df) >= 20:
            indicators.sma_20 = df['close'].rolling(20).mean().iloc[-1]
        if len(df) >= 50:
            indicators.sma_50 = df['close'].rolling(50).mean().iloc[-1]
        
        # Exponential Moving Averages
        if len(df) >= 12:
            indicators.ema_12 = df['close'].ewm(span=12).mean().iloc[-1]
        if len(df) >= 26:
            indicators.ema_26 = df['close'].ewm(span=26).mean().iloc[-1]
        
        # RSI
        if len(df) >= 14:
            delta = df['close'].diff()
            gain = (delta.where(delta > 0, 0)).rolling(14).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
            rs = gain / loss
            indicators.rsi = 100 - (100 / (1 + rs.iloc[-1]))
        
        # MACD
        if indicators.ema_12 and indicators.ema_26:
            indicators.macd = indicators.ema_12 - indicators.ema_26
            # MACD Signal line (9-period EMA of MACD)
            if len(df) >= 35:  # Need enough data for MACD signal
                macd_line = df['close'].ewm(span=12).mean() - df['close'].ewm(span=26).mean()
                indicators.macd_signal = macd_line.ewm(span=9).mean().iloc[-1]
        
        # Bollinger Bands
        if len(df) >= 20:
            sma_20 = df['close'].rolling(20).mean()
            std_20 = df['close'].rolling(20).std()
            indicators.bb_upper = (sma_20 + (std_20 * 2)).iloc[-1]
            indicators.bb_middle = sma_20.iloc[-1]
            indicators.bb_lower = (sma_20 - (std_20 * 2)).iloc[-1]
        
        # ATR (Average True Range)
        if len(df) >= 14:
            high_low = df['high'] - df['low']
            high_close = np.abs(df['high'] - df['close'].shift())
            low_close = np.abs(df['low'] - df['close'].shift())
            
            tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
            indicators.atr = tr.rolling(14).mean().iloc[-1]
        
    except Exception as e:
        logger.error(f"Error calculating indicators for {symbol}: {e}")
    
    return indicators

# API Routes
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return await health_checker.run_checks()

@app.get("/quote/{symbol}")
async def get_quote(symbol: str):
    """Get current quote for a symbol"""
    try:
        symbol = sanitize_symbol(symbol)
        
        # Check cache first
        if symbol in market_data_cache:
            cache_time = datetime.fromisoformat(market_data_cache[symbol]['timestamp'].replace('Z', '+00:00'))
            if (datetime.now(timezone.utc) - cache_time).total_seconds() < 30:  # Use cache if less than 30 seconds old
                return market_data_cache[symbol]
        
        # Check Redis cache
        if redis_client:
            cached_data = await redis_client.get(f"market_data:{symbol}")
            if cached_data:
                return json.loads(cached_data)
        
        # Get fresh data from Robinhood
        if not robinhood_client or not rate_limiter.can_make_call():
            raise HTTPException(status_code=503, detail="Market data service unavailable")
        
        quote = rs.get_quotes(symbol)[0] if rs.get_quotes(symbol) else None
        if not quote:
            raise HTTPException(status_code=404, detail="Symbol not found")
        
        market_data = {
            'symbol': symbol,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'price': float(quote.get('last_trade_price', 0)),
            'bid': float(quote.get('bid_price', 0)) if quote.get('bid_price') else None,
            'ask': float(quote.get('ask_price', 0)) if quote.get('ask_price') else None,
            'volume': int(quote.get('volume', 0)),
            'previous_close': float(quote.get('previous_close', 0)),
            'change': float(quote.get('last_trade_price', 0)) - float(quote.get('previous_close', 0)),
            'change_percent': ((float(quote.get('last_trade_price', 0)) - float(quote.get('previous_close', 0))) / float(quote.get('previous_close', 1))) * 100
        }
        
        # Cache the data
        market_data_cache[symbol] = market_data
        if redis_client:
            await redis_client.setex(
                f"market_data:{symbol}",
                60,
                json.dumps(market_data, default=str)
            )
        
        return market_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting quote for {symbol}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/historical/{symbol}")
async def get_historical_data(
    symbol: str,
    interval: str = "day",
    span: str = "month",
    bounds: str = "regular"
):
    """Get historical data for a symbol"""
    try:
        symbol = sanitize_symbol(symbol)
        
        if not robinhood_client or not rate_limiter.can_make_call():
            raise HTTPException(status_code=503, detail="Market data service unavailable")
        
        # Get historical data from Robinhood
        historical_data = rs.get_historicals(symbol, interval=interval, span=span, bounds=bounds)
        
        if not historical_data:
            raise HTTPException(status_code=404, detail="No historical data found")
        
        # Format the data
        formatted_data = []
        for data_point in historical_data:
            formatted_data.append({
                'timestamp': data_point['begins_at'],
                'open': float(data_point['open_price']),
                'high': float(data_point['high_price']),
                'low': float(data_point['low_price']),
                'close': float(data_point['close_price']),
                'volume': int(data_point['volume'])
            })
        
        return {
            'symbol': symbol,
            'interval': interval,
            'span': span,
            'data': formatted_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting historical data for {symbol}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/indicators/{symbol}")
async def get_technical_indicators(symbol: str):
    """Get technical indicators for a symbol"""
    try:
        symbol = sanitize_symbol(symbol)
        
        # Get historical data for indicator calculation
        historical_data = await get_historical_data(symbol, interval="day", span="3month")
        
        if not historical_data or not historical_data['data']:
            raise HTTPException(status_code=404, detail="Insufficient historical data")
        
        # Calculate indicators
        indicators = calculate_technical_indicators(symbol, historical_data['data'])
        
        return indicators.dict()
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating indicators for {symbol}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/search/{query}")
async def search_symbols(query: str):
    """Search for symbols"""
    try:
        if not robinhood_client or not rate_limiter.can_make_call():
            raise HTTPException(status_code=503, detail="Market data service unavailable")
        
        # Search using Robinhood
        results = rs.find_instrument_data(query)
        
        formatted_results = []
        for result in results:
            formatted_results.append({
                'symbol': result.get('symbol'),
                'name': result.get('name'),
                'type': result.get('type'),
                'tradeable': result.get('tradeable', False)
            })
        
        return {'query': query, 'results': formatted_results}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching symbols: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.websocket("/ws/{symbol}")
async def websocket_endpoint(websocket: WebSocket, symbol: str):
    """WebSocket endpoint for real-time market data"""
    symbol = sanitize_symbol(symbol)
    await websocket.accept()
    
    # Add to active connections
    if symbol not in websocket_connections:
        websocket_connections[symbol] = []
    websocket_connections[symbol].append(websocket)
    active_subscriptions.add(symbol)
    
    try:
        # Send initial data
        if symbol in market_data_cache:
            await websocket.send_json({
                'type': 'market_data',
                'data': market_data_cache[symbol]
            })
        
        # Keep connection alive
        while True:
            await websocket.receive_text()  # Wait for client messages
            
    except WebSocketDisconnect:
        # Remove from connections
        if symbol in websocket_connections:
            websocket_connections[symbol].remove(websocket)
            if not websocket_connections[symbol]:
                del websocket_connections[symbol]
                active_subscriptions.discard(symbol)
    except Exception as e:
        logger.error(f"WebSocket error for {symbol}: {e}")

@app.get("/metrics")
async def get_metrics():
    """Get Prometheus metrics"""
    if metrics_collector:
        return JSONResponse(
            content=metrics_collector.get_metrics(),
            media_type="text/plain"
        )
    return {"error": "Metrics not available"}

if __name__ == "__main__":
    # Determine port based on environment
    port = 8140 if ENV == 'dev' else 8141 if ENV == 'test' else 8142
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=(ENV == 'dev'),
        log_level="info" if ENV == 'prod' else "debug"
    )
