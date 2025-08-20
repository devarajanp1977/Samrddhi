"""
Market Data Service - Database Integrated Version
Real-time and historical market data with PostgreSQL backend
"""

import asyncio
import logging
import random
import sys
import os
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta

import uvicorn
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

# Add path to shared modules
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))

from shared.database import get_db, MarketData, TradingSignal

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Models
class MarketDataPoint(BaseModel):
    symbol: str
    price: float
    volume: int
    timestamp: datetime
    change: float
    change_percent: float

class HistoricalData(BaseModel):
    symbol: str
    data: List[Dict[str, Any]]
    period: str

# Global state
market_data_cache: Dict[str, MarketDataPoint] = {}
active_connections: List[WebSocket] = []

# Sample symbols for simulation
SYMBOLS = ["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA", "NVDA", "META", "NFLX", "AMD", "INTC"]

# Initialize FastAPI app
app = FastAPI(
    title="Market Data Service",
    description="Real-time and historical market data simulation",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Utility functions
def generate_mock_price(symbol: str, base_price: Optional[float] = None) -> MarketDataPoint:
    """Generate mock market data for a symbol"""
    if base_price is None:
        base_prices = {
            "AAPL": 150.0, "GOOGL": 2800.0, "MSFT": 300.0, "AMZN": 3000.0,
            "TSLA": 200.0, "NVDA": 450.0, "META": 250.0, "NFLX": 400.0,
            "AMD": 100.0, "INTC": 50.0
        }
        base_price = base_prices.get(symbol, 100.0)
    
    # Generate small random changes
    change_percent = random.uniform(-2.0, 2.0)
    change = base_price * (change_percent / 100)
    new_price = base_price + change
    
    return MarketDataPoint(
        symbol=symbol,
        price=round(new_price, 2),
        volume=random.randint(10000, 1000000),
        timestamp=datetime.now(),
        change=round(change, 2),
        change_percent=round(change_percent, 2)
    )

async def broadcast_market_data():
    """Broadcast real-time market data to all connected WebSocket clients"""
    while True:
        try:
            # Generate market data for all symbols
            for symbol in SYMBOLS:
                market_data = generate_mock_price(symbol)
                market_data_cache[symbol] = market_data
                
                # Broadcast to all connected clients
                if active_connections:
                    message = {
                        "type": "market_data",
                        "data": market_data.model_dump()
                    }
                    disconnected = []
                    for connection in active_connections:
                        try:
                            await connection.send_json(message)
                        except:
                            disconnected.append(connection)
                    
                    # Remove disconnected clients
                    for conn in disconnected:
                        if conn in active_connections:
                            active_connections.remove(conn)
            
            # Wait before next update
            await asyncio.sleep(1)  # Update every second
            
        except Exception as e:
            logger.error(f"Error in market data broadcast: {e}")
            await asyncio.sleep(5)

# API Routes
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "market-data-service",
        "timestamp": datetime.now().isoformat(),
        "active_connections": len(active_connections),
        "tracked_symbols": len(market_data_cache)
    }

@app.get("/market-data/{symbol}")
async def get_market_data(symbol: str):
    """Get current market data for a symbol"""
    symbol = symbol.upper()
    
    if symbol in market_data_cache:
        return {
            "success": True,
            "data": market_data_cache[symbol].model_dump()
        }
    
    # Generate fresh data if not in cache
    market_data = generate_mock_price(symbol)
    market_data_cache[symbol] = market_data
    
    return {
        "success": True,
        "data": market_data.model_dump()
    }

@app.get("/market-data/{symbol}/latest")
async def get_latest_market_data(symbol: str, db: Session = Depends(get_db)):
    """Get latest market data from database"""
    try:
        symbol = symbol.upper()
        latest_data = db.query(MarketData).filter(
            MarketData.symbol == symbol
        ).order_by(MarketData.timestamp.desc()).first()
        
        if not latest_data:
            raise HTTPException(status_code=404, detail=f"No market data found for {symbol}")
        
        return {
            "success": True,
            "data": {
                "symbol": latest_data.symbol,
                "open_price": latest_data.open_price,
                "high_price": latest_data.high_price,
                "low_price": latest_data.low_price,
                "close_price": latest_data.close_price,
                "volume": latest_data.volume,
                "vwap": latest_data.vwap,
                "timestamp": latest_data.timestamp
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching market data for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/trading-signals")
async def get_trading_signals(db: Session = Depends(get_db)):
    """Get all trading signals from database"""
    try:
        signals = db.query(TradingSignal).order_by(TradingSignal.created_at.desc()).limit(20).all()
        
        return {
            "success": True,
            "data": [
                {
                    "id": signal.id,
                    "symbol": signal.symbol,
                    "signal_type": signal.signal_type,
                    "strategy": signal.strategy,
                    "confidence": signal.confidence,
                    "price_target": signal.price_target,
                    "stop_loss": signal.stop_loss,
                    "timeframe": signal.timeframe,
                    "indicators": signal.indicators,
                    "generated_at": signal.created_at
                }
                for signal in signals
            ]
        }
    except Exception as e:
        logger.error(f"Error fetching trading signals: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/market-data")
async def get_all_market_data():
    """Get current market data for all tracked symbols"""
    if not market_data_cache:
        # Initialize with mock data
        for symbol in SYMBOLS:
            market_data_cache[symbol] = generate_mock_price(symbol)
    
    return {
        "success": True,
        "data": {symbol: data.model_dump() for symbol, data in market_data_cache.items()}
    }

@app.get("/historical-data/{symbol}")
async def get_historical_data(symbol: str, period: str = "1d"):
    """Get historical data for a symbol"""
    symbol = symbol.upper()
    
    # Generate mock historical data
    periods = {
        "1d": 24,    # 24 hours
        "1w": 7,     # 7 days
        "1m": 30,    # 30 days
        "3m": 90,    # 90 days
        "1y": 365    # 365 days
    }
    
    data_points = periods.get(period, 24)
    historical_data = []
    
    base_price = 100.0
    if symbol in market_data_cache:
        base_price = market_data_cache[symbol].price
    
    # Generate historical data points
    for i in range(data_points):
        timestamp = datetime.now() - timedelta(hours=data_points - i)
        price_variation = random.uniform(-0.05, 0.05)  # 5% variation
        price = base_price * (1 + price_variation)
        
        historical_data.append({
            "timestamp": timestamp.isoformat(),
            "open": round(price * 0.999, 2),
            "high": round(price * 1.002, 2),
            "low": round(price * 0.998, 2),
            "close": round(price, 2),
            "volume": random.randint(10000, 100000)
        })
    
    return {
        "success": True,
        "data": HistoricalData(
            symbol=symbol,
            data=historical_data,
            period=period
        ).model_dump()
    }

@app.websocket("/ws/market-data")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time market data"""
    await websocket.accept()
    active_connections.append(websocket)
    logger.info(f"New WebSocket connection. Total: {len(active_connections)}")
    
    try:
        # Send initial data
        initial_data = {
            "type": "connection_established",
            "message": "Connected to market data stream",
            "symbols": SYMBOLS
        }
        await websocket.send_json(initial_data)
        
        # Keep connection alive
        while True:
            # Wait for client messages (ping/pong)
            try:
                message = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                # Echo back any received messages
                await websocket.send_json({"type": "echo", "message": message})
            except asyncio.TimeoutError:
                # Send ping to keep connection alive
                await websocket.send_json({"type": "ping"})
                
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        if websocket in active_connections:
            active_connections.remove(websocket)
        logger.info(f"WebSocket connection closed. Total: {len(active_connections)}")

@app.on_event("startup")
async def startup_event():
    """Initialize service on startup"""
    logger.info("Starting Market Data Service...")
    
    # Initialize market data cache
    for symbol in SYMBOLS:
        market_data_cache[symbol] = generate_mock_price(symbol)
    
    # Start background task for market data updates
    asyncio.create_task(broadcast_market_data())
    
    logger.info(f"Market Data Service started successfully on port 8140")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down Market Data Service...")
    
    # Close all WebSocket connections
    for connection in active_connections:
        try:
            await connection.close()
        except:
            pass
    
    logger.info("Market Data Service shutdown complete")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8141,
        reload=False
    )
