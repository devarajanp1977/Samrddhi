"""
Samrddhi Signal Detection Service
Detects trading signals and opportunities
"""

import asyncio
import logging
import os
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import random

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Samrddhi Signal Detection Service", 
    description="Trading signal detection and analysis service",
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

# Data models
class TradingSignal(BaseModel):
    id: str
    symbol: str
    signal_type: str  # 'buy', 'sell', 'hold'
    strategy: str
    confidence: float  # 0.0 to 1.0
    price_target: Optional[float] = None
    stop_loss: Optional[float] = None
    timeframe: str
    indicators: Dict[str, Any]
    created_at: datetime
    expires_at: Optional[datetime] = None

class SignalStrategy(BaseModel):
    name: str
    description: str
    timeframe: str
    enabled: bool
    parameters: Dict[str, Any]

class MarketAnalysis(BaseModel):
    symbol: str
    trend: str  # 'bullish', 'bearish', 'neutral'
    momentum: float  # -1.0 to 1.0
    volatility: float
    support_levels: List[float]
    resistance_levels: List[float]
    rsi: float
    macd: Dict[str, float]
    bollinger_bands: Dict[str, float]
    analysis_time: datetime

# In-memory storage for demo
signals_db: Dict[str, TradingSignal] = {}
strategies_db: Dict[str, SignalStrategy] = {}
signal_counter = 1000

# Initialize demo strategies
def init_demo_strategies():
    strategies_db["rsi_oversold"] = SignalStrategy(
        name="RSI Oversold",
        description="Buy signal when RSI < 30",
        timeframe="1h",
        enabled=True,
        parameters={"rsi_threshold": 30, "volume_confirm": True}
    )
    
    strategies_db["macd_crossover"] = SignalStrategy(
        name="MACD Crossover",
        description="Buy/Sell on MACD line crossover",
        timeframe="4h",
        enabled=True,
        parameters={"fast_period": 12, "slow_period": 26, "signal_period": 9}
    )
    
    strategies_db["bollinger_squeeze"] = SignalStrategy(
        name="Bollinger Bands Squeeze",
        description="Signal when price breaks out of tight Bollinger Bands",
        timeframe="1d",
        enabled=True,
        parameters={"period": 20, "std_dev": 2}
    )

init_demo_strategies()

def generate_mock_signal(symbol: str) -> TradingSignal:
    """Generate a mock trading signal"""
    global signal_counter
    
    signal_id = f"SIG_{signal_counter:06d}"
    signal_counter += 1
    
    strategies = list(strategies_db.keys())
    strategy = random.choice(strategies)
    signal_types = ["buy", "sell", "hold"]
    signal_type = random.choice(signal_types)
    
    # Generate mock price and levels
    base_price = random.uniform(100, 1000)
    
    return TradingSignal(
        id=signal_id,
        symbol=symbol,
        signal_type=signal_type,
        strategy=strategy,
        confidence=random.uniform(0.6, 0.95),
        price_target=base_price * random.uniform(1.02, 1.15) if signal_type == "buy" else base_price * random.uniform(0.85, 0.98),
        stop_loss=base_price * random.uniform(0.92, 0.98) if signal_type == "buy" else base_price * random.uniform(1.02, 1.08),
        timeframe=random.choice(["5m", "15m", "1h", "4h", "1d"]),
        indicators={
            "rsi": random.uniform(20, 80),
            "macd": random.uniform(-2, 2),
            "bb_position": random.uniform(0, 1),
            "volume_ratio": random.uniform(0.5, 2.0)
        },
        created_at=datetime.now(),
        expires_at=datetime.now() + timedelta(hours=random.randint(1, 24))
    )

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "signal-detection-service"}

@app.get("/signals", response_model=List[TradingSignal])
async def get_signals(
    symbol: Optional[str] = None,
    signal_type: Optional[str] = None,
    strategy: Optional[str] = None,
    active_only: bool = True
):
    """Get trading signals with optional filters"""
    signals = list(signals_db.values())
    
    if symbol:
        signals = [s for s in signals if s.symbol == symbol]
    
    if signal_type:
        signals = [s for s in signals if s.signal_type == signal_type]
    
    if strategy:
        signals = [s for s in signals if s.strategy == strategy]
    
    if active_only:
        now = datetime.now()
        signals = [s for s in signals if not s.expires_at or s.expires_at > now]
    
    return sorted(signals, key=lambda x: x.created_at, reverse=True)

@app.get("/signals/{signal_id}", response_model=TradingSignal)
async def get_signal(signal_id: str):
    """Get a specific signal"""
    if signal_id not in signals_db:
        raise HTTPException(status_code=404, detail="Signal not found")
    return signals_db[signal_id]

@app.post("/signals/scan/{symbol}")
async def scan_symbol(symbol: str):
    """Scan a symbol for trading signals"""
    # Generate 1-3 signals for the symbol
    num_signals = random.randint(1, 3)
    new_signals = []
    
    for _ in range(num_signals):
        signal = generate_mock_signal(symbol)
        signals_db[signal.id] = signal
        new_signals.append(signal)
    
    logger.info(f"Generated {num_signals} signals for {symbol}")
    return {
        "symbol": symbol,
        "signals_generated": num_signals,
        "signals": new_signals
    }

@app.get("/analysis/{symbol}", response_model=MarketAnalysis)
async def get_market_analysis(symbol: str):
    """Get detailed market analysis for a symbol"""
    # Generate mock analysis data
    base_price = random.uniform(100, 1000)
    
    analysis = MarketAnalysis(
        symbol=symbol,
        trend=random.choice(["bullish", "bearish", "neutral"]),
        momentum=random.uniform(-1.0, 1.0),
        volatility=random.uniform(0.1, 0.5),
        support_levels=[
            base_price * random.uniform(0.85, 0.95),
            base_price * random.uniform(0.75, 0.85),
            base_price * random.uniform(0.65, 0.75)
        ],
        resistance_levels=[
            base_price * random.uniform(1.05, 1.15),
            base_price * random.uniform(1.15, 1.25),
            base_price * random.uniform(1.25, 1.35)
        ],
        rsi=random.uniform(20, 80),
        macd={
            "macd": random.uniform(-2, 2),
            "signal": random.uniform(-2, 2),
            "histogram": random.uniform(-1, 1)
        },
        bollinger_bands={
            "upper": base_price * random.uniform(1.02, 1.05),
            "middle": base_price,
            "lower": base_price * random.uniform(0.95, 0.98)
        },
        analysis_time=datetime.now()
    )
    
    return analysis

@app.get("/strategies", response_model=List[SignalStrategy])
async def get_strategies():
    """Get all available signal strategies"""
    return list(strategies_db.values())

@app.put("/strategies/{strategy_name}")
async def update_strategy(strategy_name: str, strategy: SignalStrategy):
    """Update a signal strategy"""
    strategies_db[strategy_name] = strategy
    logger.info(f"Updated strategy {strategy_name}")
    return {"message": f"Strategy {strategy_name} updated"}

@app.post("/strategies/{strategy_name}/toggle")
async def toggle_strategy(strategy_name: str):
    """Enable/disable a strategy"""
    if strategy_name not in strategies_db:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    strategy = strategies_db[strategy_name]
    strategy.enabled = not strategy.enabled
    
    status = "enabled" if strategy.enabled else "disabled"
    logger.info(f"Strategy {strategy_name} {status}")
    
    return {
        "strategy": strategy_name,
        "enabled": strategy.enabled,
        "message": f"Strategy {strategy_name} {status}"
    }

@app.post("/signals/backtest")
async def backtest_strategy(
    strategy_name: str,
    symbol: str,
    start_date: str,
    end_date: str
):
    """Backtest a strategy (mock implementation)"""
    if strategy_name not in strategies_db:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    # Mock backtest results
    total_trades = random.randint(50, 200)
    winning_trades = random.randint(int(total_trades * 0.4), int(total_trades * 0.7))
    
    results = {
        "strategy": strategy_name,
        "symbol": symbol,
        "period": f"{start_date} to {end_date}",
        "total_trades": total_trades,
        "winning_trades": winning_trades,
        "win_rate": winning_trades / total_trades,
        "total_return": random.uniform(-0.2, 0.5),
        "max_drawdown": random.uniform(-0.15, -0.05),
        "sharpe_ratio": random.uniform(0.5, 2.5),
        "profit_factor": random.uniform(0.8, 2.2)
    }
    
    return results

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8200)),
        reload=False  # Disabled for stability
    )
