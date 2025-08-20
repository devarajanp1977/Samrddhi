"""
Portfolio Service
Manages portfolio positions, P&L tracking, and portfolio analytics
"""

import asyncio
import os
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone, timedelta
import random

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Samrddhi Portfolio Service",
    description="Portfolio management and tracking service",
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

# Models
class PortfolioStatus(BaseModel):
    account_value: float
    cash_balance: float
    buying_power: float
    positions_count: int
    day_trades_remaining: int
    total_return: float
    total_return_percent: float
    daily_pnl: float
    daily_pnl_percent: float
    max_drawdown: float
    risk_score: float

class PositionInfo(BaseModel):
    symbol: str
    quantity: float
    avg_price: float
    current_price: float
    market_value: float
    unrealized_pnl: float
    unrealized_pnl_percent: float
    day_pnl: float
    day_pnl_percent: float
    side: str  # 'long' or 'short'

class TradeHistory(BaseModel):
    id: str
    symbol: str
    quantity: float
    price: float
    side: str  # 'buy' or 'sell'
    timestamp: datetime
    commission: float
    trade_type: str  # 'market', 'limit', etc.

class PortfolioMetrics(BaseModel):
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    avg_win: float
    avg_loss: float
    profit_factor: float
    max_consecutive_wins: int
    max_consecutive_losses: int
    sharpe_ratio: float
    sortino_ratio: float
    max_drawdown: float
    recovery_factor: float

# In-memory storage for demo
portfolio_data = {
    "demo_account": {
        "account_value": 125000.0,
        "cash_balance": 45000.0,
        "initial_value": 100000.0,
        "positions": {
            "AAPL": {
                "symbol": "AAPL",
                "quantity": 100,
                "avg_price": 175.50,
                "current_price": 182.25,
                "side": "long"
            },
            "TSLA": {
                "symbol": "TSLA",
                "quantity": 50,
                "avg_price": 245.80,
                "current_price": 238.90,
                "side": "long"
            },
            "SPY": {
                "symbol": "SPY",
                "quantity": 75,
                "avg_price": 440.20,
                "current_price": 445.15,
                "side": "long"
            }
        },
        "trades": []
    }
}

trade_counter = 1000

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "portfolio-service"}

@app.get("/portfolio", response_model=PortfolioStatus)
async def get_portfolio_status(account_id: str = "demo_account"):
    """Get current portfolio status"""
    if account_id not in portfolio_data:
        raise HTTPException(status_code=404, detail="Account not found")
    
    account = portfolio_data[account_id]
    
    # Calculate portfolio metrics
    total_market_value = 0
    daily_pnl = 0
    
    for position in account["positions"].values():
        market_value = position["quantity"] * position["current_price"]
        cost_basis = position["quantity"] * position["avg_price"]
        total_market_value += market_value
        
        # Simulate daily P&L
        daily_change = random.uniform(-0.05, 0.05)  # -5% to +5%
        daily_pnl += market_value * daily_change
    
    account_value = account["cash_balance"] + total_market_value
    total_return = account_value - account["initial_value"]
    total_return_percent = (total_return / account["initial_value"]) * 100
    
    return PortfolioStatus(
        account_value=account_value,
        cash_balance=account["cash_balance"],
        buying_power=account["cash_balance"] * 2,  # 2:1 margin
        positions_count=len(account["positions"]),
        day_trades_remaining=3,
        total_return=total_return,
        total_return_percent=total_return_percent,
        daily_pnl=daily_pnl,
        daily_pnl_percent=(daily_pnl / account_value) * 100,
        max_drawdown=-0.08,  # -8%
        risk_score=0.35  # Moderate risk
    )

@app.get("/positions", response_model=List[PositionInfo])
async def get_positions(account_id: str = "demo_account"):
    """Get all current positions"""
    if account_id not in portfolio_data:
        raise HTTPException(status_code=404, detail="Account not found")
    
    positions = []
    for symbol, pos_data in portfolio_data[account_id]["positions"].items():
        market_value = pos_data["quantity"] * pos_data["current_price"]
        cost_basis = pos_data["quantity"] * pos_data["avg_price"]
        unrealized_pnl = market_value - cost_basis
        unrealized_pnl_percent = (unrealized_pnl / cost_basis) * 100
        
        # Simulate daily P&L
        daily_change = random.uniform(-0.03, 0.03)
        day_pnl = market_value * daily_change
        day_pnl_percent = daily_change * 100
        
        position = PositionInfo(
            symbol=symbol,
            quantity=pos_data["quantity"],
            avg_price=pos_data["avg_price"],
            current_price=pos_data["current_price"],
            market_value=market_value,
            unrealized_pnl=unrealized_pnl,
            unrealized_pnl_percent=unrealized_pnl_percent,
            day_pnl=day_pnl,
            day_pnl_percent=day_pnl_percent,
            side=pos_data["side"]
        )
        positions.append(position)
    
    return positions

@app.get("/positions/{symbol}", response_model=PositionInfo)
async def get_position(symbol: str, account_id: str = "demo_account"):
    """Get a specific position"""
    if account_id not in portfolio_data:
        raise HTTPException(status_code=404, detail="Account not found")
    
    if symbol not in portfolio_data[account_id]["positions"]:
        raise HTTPException(status_code=404, detail="Position not found")
    
    pos_data = portfolio_data[account_id]["positions"][symbol]
    market_value = pos_data["quantity"] * pos_data["current_price"]
    cost_basis = pos_data["quantity"] * pos_data["avg_price"]
    unrealized_pnl = market_value - cost_basis
    unrealized_pnl_percent = (unrealized_pnl / cost_basis) * 100
    
    # Simulate daily P&L
    daily_change = random.uniform(-0.03, 0.03)
    day_pnl = market_value * daily_change
    day_pnl_percent = daily_change * 100
    
    return PositionInfo(
        symbol=symbol,
        quantity=pos_data["quantity"],
        avg_price=pos_data["avg_price"],
        current_price=pos_data["current_price"],
        market_value=market_value,
        unrealized_pnl=unrealized_pnl,
        unrealized_pnl_percent=unrealized_pnl_percent,
        day_pnl=day_pnl,
        day_pnl_percent=day_pnl_percent,
        side=pos_data["side"]
    )

@app.get("/trades", response_model=List[TradeHistory])
async def get_trade_history(account_id: str = "demo_account", limit: int = 50):
    """Get trade history"""
    if account_id not in portfolio_data:
        raise HTTPException(status_code=404, detail="Account not found")
    
    # Generate some mock trade history
    trades = []
    symbols = ["AAPL", "TSLA", "SPY", "MSFT", "GOOGL"]
    
    for i in range(min(limit, 20)):
        global trade_counter
        trade_id = f"TRD_{trade_counter:06d}"
        trade_counter += 1
        
        trade = TradeHistory(
            id=trade_id,
            symbol=random.choice(symbols),
            quantity=random.randint(10, 200),
            price=random.uniform(100, 500),
            side=random.choice(["buy", "sell"]),
            timestamp=datetime.now() - timedelta(days=random.randint(0, 30)),
            commission=random.uniform(0.5, 5.0),
            trade_type=random.choice(["market", "limit", "stop"])
        )
        trades.append(trade)
    
    return sorted(trades, key=lambda x: x.timestamp, reverse=True)

@app.get("/metrics", response_model=PortfolioMetrics)
async def get_portfolio_metrics(account_id: str = "demo_account"):
    """Get portfolio performance metrics"""
    # Mock metrics data
    return PortfolioMetrics(
        total_trades=145,
        winning_trades=89,
        losing_trades=56,
        win_rate=0.614,
        avg_win=245.50,
        avg_loss=-156.75,
        profit_factor=1.38,
        max_consecutive_wins=7,
        max_consecutive_losses=4,
        sharpe_ratio=1.25,
        sortino_ratio=1.67,
        max_drawdown=-0.12,
        recovery_factor=2.1
    )

@app.post("/positions")
async def update_position(symbol: str, quantity: float, price: float, account_id: str = "demo_account"):
    """Update or create a position"""
    if account_id not in portfolio_data:
        portfolio_data[account_id] = {
            "account_value": 100000.0,
            "cash_balance": 50000.0,
            "initial_value": 100000.0,
            "positions": {},
            "trades": []
        }
    
    account = portfolio_data[account_id]
    
    if symbol in account["positions"]:
        # Update existing position
        existing = account["positions"][symbol]
        total_quantity = existing["quantity"] + quantity
        total_cost = (existing["quantity"] * existing["avg_price"]) + (quantity * price)
        
        if total_quantity == 0:
            # Close position
            del account["positions"][symbol]
        else:
            account["positions"][symbol] = {
                "symbol": symbol,
                "quantity": total_quantity,
                "avg_price": total_cost / total_quantity,
                "current_price": price,
                "side": "long" if total_quantity > 0 else "short"
            }
    else:
        # Create new position
        account["positions"][symbol] = {
            "symbol": symbol,
            "quantity": quantity,
            "avg_price": price,
            "current_price": price,
            "side": "long" if quantity > 0 else "short"
        }
    
    # Update cash balance
    account["cash_balance"] -= (quantity * price)
    
    return {"message": f"Position updated for {symbol}"}

@app.put("/positions/{symbol}/price")
async def update_position_price(symbol: str, price: float, account_id: str = "demo_account"):
    """Update the current price of a position"""
    if account_id not in portfolio_data:
        raise HTTPException(status_code=404, detail="Account not found")
    
    if symbol not in portfolio_data[account_id]["positions"]:
        raise HTTPException(status_code=404, detail="Position not found")
    
    portfolio_data[account_id]["positions"][symbol]["current_price"] = price
    
    return {"message": f"Price updated for {symbol} to ${price:.2f}"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8100)),
        reload=True
    )
    quantity: float
    average_price: float
    current_price: float
    market_value: float
    unrealized_pnl: float
    unrealized_pnl_percent: float
    stop_loss_price: Optional[float]
    take_profit_price: Optional[float]
    entry_time: datetime
    hold_time_minutes: int

class PortfolioSummary(BaseModel):
    portfolio: PortfolioStatus
    positions: List[PositionInfo]
    recent_trades: List[Dict[str, Any]]
    allocation: Dict[str, float]

# Global variables
redis_client: Optional[redis.Redis] = None
metrics_collector: MetricsCollector = None
health_checker: HealthChecker = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global redis_client, metrics_collector, health_checker
    
    # Startup
    logger.info(f"Starting Portfolio Service - Environment: {ENV}")
    
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
    
    # Initialize metrics and health checker
    metrics_collector = MetricsCollector("portfolio-service")
    health_checker = HealthChecker("portfolio-service")
    
    # Add health checks
    health_checker.add_check("database", check_database_health)
    health_checker.add_check("redis", check_redis_health)
    
    # Start background tasks
    asyncio.create_task(portfolio_update_task())
    asyncio.create_task(risk_calculation_task())
    
    yield
    
    # Shutdown
    if redis_client:
        await redis_client.close()
    logger.info("Portfolio Service shutdown complete")

# Create FastAPI app
app = FastAPI(
    title="Portfolio Service",
    description="Manages portfolio positions and analytics",
    version="1.0.0",
    lifespan=lifespan
)

# Health check functions
async def check_database_health():
    """Check database connectivity"""
    try:
        db = next(get_db())
        db.execute("SELECT 1")
        return True
    except Exception:
        return False

async def check_redis_health():
    """Check Redis connectivity"""
    if not redis_client:
        return False
    try:
        await redis_client.ping()
        return True
    except Exception:
        return False

# Background tasks
async def portfolio_update_task():
    """Periodically update portfolio values"""
    while True:
        try:
            await update_all_portfolios()
            await asyncio.sleep(30)  # Update every 30 seconds
        except Exception as e:
            logger.error(f"Portfolio update task error: {e}")
            await asyncio.sleep(60)

async def risk_calculation_task():
    """Periodically calculate risk metrics"""
    while True:
        try:
            await calculate_all_risk_metrics()
            await asyncio.sleep(300)  # Update every 5 minutes
        except Exception as e:
            logger.error(f"Risk calculation task error: {e}")
            await asyncio.sleep(300)

async def update_all_portfolios():
    """Update all portfolio values with current market data"""
    db = next(get_db())
    try:
        portfolios = db.query(Portfolio).all()
        for portfolio in portfolios:
            await update_portfolio_value(portfolio.user_id, db)
    except Exception as e:
        logger.error(f"Error updating portfolios: {e}")
    finally:
        db.close()

async def update_portfolio_value(user_id: str, db: Session):
    """Update portfolio value for a specific user"""
    try:
        # Get user's positions
        positions = db.query(Position).filter(Position.user_id == user_id).all()
        
        total_market_value = 0.0
        total_unrealized_pnl = 0.0
        
        for position in positions:
            # Get current market price (this would integrate with market data service)
            current_price = await get_current_price(position.symbol)
            if current_price:
                position.current_price = current_price
                position.market_value = position.quantity * current_price
                position.unrealized_pnl = (current_price - position.average_price) * position.quantity
                position.unrealized_pnl_percent = (position.unrealized_pnl / (position.average_price * position.quantity)) * 100
                
                total_market_value += position.market_value
                total_unrealized_pnl += position.unrealized_pnl
        
        # Update portfolio
        portfolio = db.query(Portfolio).filter(Portfolio.user_id == user_id).first()
        if portfolio:
            portfolio.account_value = portfolio.cash_balance + total_market_value
            portfolio.daily_pnl = total_unrealized_pnl  # Simplified calculation
            if portfolio.account_value > 0:
                portfolio.daily_pnl_percent = (portfolio.daily_pnl / portfolio.account_value) * 100
        
        db.commit()
        
        # Update metrics
        if metrics_collector:
            metrics_collector.update_portfolio_metrics(
                portfolio.account_value,
                len(positions),
                portfolio.daily_pnl
            )
        
    except Exception as e:
        logger.error(f"Error updating portfolio for user {user_id}: {e}")
        db.rollback()

async def get_current_price(symbol: str) -> Optional[float]:
    """Get current market price for a symbol"""
    try:
        # This would call the market data service
        # For now, return a mock price
        return 100.0  # Mock price
    except Exception as e:
        logger.error(f"Error getting price for {symbol}: {e}")
        return None

async def calculate_all_risk_metrics():
    """Calculate risk metrics for all portfolios"""
    db = next(get_db())
    try:
        portfolios = db.query(Portfolio).all()
        for portfolio in portfolios:
            await calculate_risk_metrics(portfolio.user_id, db)
    except Exception as e:
        logger.error(f"Error calculating risk metrics: {e}")
    finally:
        db.close()

async def calculate_risk_metrics(user_id: str, db: Session):
    """Calculate risk metrics for a specific user"""
    try:
        portfolio = db.query(Portfolio).filter(Portfolio.user_id == user_id).first()
        if not portfolio:
            return
        
        positions = db.query(Position).filter(Position.user_id == user_id).all()
        
        # Calculate basic risk metrics
        concentration_risk = 0.0
        if positions and portfolio.account_value > 0:
            max_position_value = max(pos.market_value for pos in positions)
            concentration_risk = (max_position_value / portfolio.account_value) * 100
        
        # Calculate portfolio volatility (simplified)
        volatility = await calculate_portfolio_volatility(user_id, db)
        
        # Calculate risk score (0-100)
        risk_score = calculate_risk_score(concentration_risk, volatility, portfolio.max_drawdown)
        
        # Store risk metrics
        risk_metrics = RiskMetrics(
            user_id=user_id,
            portfolio_value=portfolio.account_value,
            daily_var=portfolio.account_value * 0.02,  # Simplified VaR
            concentration_risk=concentration_risk,
            correlation_risk=0.0,  # Would calculate actual correlation
            volatility=volatility,
            max_drawdown=portfolio.max_drawdown,
            current_drawdown=min(0, portfolio.daily_pnl_percent),
            risk_score=risk_score,
            warnings=[]
        )
        
        # Remove old risk metrics (keep only latest)
        db.query(RiskMetrics).filter(RiskMetrics.user_id == user_id).delete()
        db.add(risk_metrics)
        db.commit()
        
        # Update metrics
        if metrics_collector:
            metrics_collector.update_risk_metrics(risk_score, portfolio.max_drawdown, volatility)
        
    except Exception as e:
        logger.error(f"Error calculating risk metrics for user {user_id}: {e}")
        db.rollback()

async def calculate_portfolio_volatility(user_id: str, db: Session) -> float:
    """Calculate portfolio volatility"""
    # This would use historical returns to calculate actual volatility
    # For now, return a mock value
    return 0.15  # 15% volatility

def calculate_risk_score(concentration_risk: float, volatility: float, max_drawdown: float) -> float:
    """Calculate overall risk score (0-100)"""
    # Weighted risk score calculation
    concentration_weight = 0.4
    volatility_weight = 0.4
    drawdown_weight = 0.2
    
    # Normalize each component to 0-100 scale
    concentration_score = min(100, concentration_risk * 2)  # 50% concentration = 100 risk
    volatility_score = min(100, volatility * 500)  # 20% volatility = 100 risk
    drawdown_score = min(100, abs(max_drawdown) * 10)  # 10% drawdown = 100 risk
    
    risk_score = (
        concentration_score * concentration_weight +
        volatility_score * volatility_weight +
        drawdown_score * drawdown_weight
    )
    
    return min(100, max(0, risk_score))

# API Routes
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return await health_checker.run_checks()

@app.get("/portfolio/{user_id}", response_model=PortfolioSummary)
async def get_portfolio(
    user_id: str,
    db: Session = Depends(get_db),
    auth: AuthManager = Depends(get_auth_manager)
):
    """Get complete portfolio information"""
    try:
        # Get portfolio
        portfolio = db.query(Portfolio).filter(Portfolio.user_id == user_id).first()
        if not portfolio:
            raise HTTPException(status_code=404, detail="Portfolio not found")
        
        # Get positions
        positions = db.query(Position).filter(Position.user_id == user_id).all()
        
        # Get recent trades
        recent_trades = db.query(Trade).filter(
            and_(Trade.user_id == user_id, Trade.exit_time.isnot(None))
        ).order_by(Trade.exit_time.desc()).limit(10).all()
        
        # Calculate allocation
        allocation = {}
        if portfolio.account_value > 0:
            for position in positions:
                allocation[position.symbol] = (position.market_value / portfolio.account_value) * 100
        
        # Format response
        portfolio_status = PortfolioStatus(
            account_value=portfolio.account_value,
            cash_balance=portfolio.cash_balance,
            buying_power=portfolio.buying_power,
            positions_count=len(positions),
            day_trades_remaining=portfolio.day_trades_remaining,
            total_return=portfolio.total_return,
            total_return_percent=portfolio.total_return_percent,
            daily_pnl=portfolio.daily_pnl,
            daily_pnl_percent=portfolio.daily_pnl_percent,
            max_drawdown=portfolio.max_drawdown,
            risk_score=0.0  # Would get from risk metrics
        )
        
        position_infos = []
        for pos in positions:
            hold_time = (datetime.now(timezone.utc) - pos.entry_time).total_seconds() / 60
            position_infos.append(PositionInfo(
                symbol=pos.symbol,
                quantity=pos.quantity,
                average_price=pos.average_price,
                current_price=pos.current_price,
                market_value=pos.market_value,
                unrealized_pnl=pos.unrealized_pnl,
                unrealized_pnl_percent=pos.unrealized_pnl_percent,
                stop_loss_price=pos.stop_loss_price,
                take_profit_price=pos.take_profit_price,
                entry_time=pos.entry_time,
                hold_time_minutes=int(hold_time)
            ))
        
        trade_dicts = [
            {
                "symbol": trade.symbol,
                "quantity": trade.quantity,
                "entry_price": trade.entry_price,
                "exit_price": trade.exit_price,
                "realized_pnl": trade.realized_pnl,
                "realized_pnl_percent": trade.realized_pnl_percent,
                "exit_time": trade.exit_time,
                "is_day_trade": trade.is_day_trade
            }
            for trade in recent_trades
        ]
        
        return PortfolioSummary(
            portfolio=portfolio_status,
            positions=position_infos,
            recent_trades=trade_dicts,
            allocation=allocation
        )
        
    except Exception as e:
        logger.error(f"Error getting portfolio: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/positions/{user_id}")
async def get_positions(
    user_id: str,
    db: Session = Depends(get_db),
    auth: AuthManager = Depends(get_auth_manager)
):
    """Get user positions"""
    try:
        positions = db.query(Position).filter(Position.user_id == user_id).all()
        return [
            {
                "symbol": pos.symbol,
                "quantity": pos.quantity,
                "average_price": pos.average_price,
                "current_price": pos.current_price,
                "market_value": pos.market_value,
                "unrealized_pnl": pos.unrealized_pnl,
                "unrealized_pnl_percent": pos.unrealized_pnl_percent,
                "entry_time": pos.entry_time
            }
            for pos in positions
        ]
    except Exception as e:
        logger.error(f"Error getting positions: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/risk-metrics/{user_id}")
async def get_risk_metrics(
    user_id: str,
    db: Session = Depends(get_db),
    auth: AuthManager = Depends(get_auth_manager)
):
    """Get risk metrics for user"""
    try:
        risk_metrics = db.query(RiskMetrics).filter(
            RiskMetrics.user_id == user_id
        ).order_by(RiskMetrics.calculated_at.desc()).first()
        
        if not risk_metrics:
            raise HTTPException(status_code=404, detail="Risk metrics not found")
        
        return {
            "portfolio_value": risk_metrics.portfolio_value,
            "daily_var": risk_metrics.daily_var,
            "concentration_risk": risk_metrics.concentration_risk,
            "volatility": risk_metrics.volatility,
            "max_drawdown": risk_metrics.max_drawdown,
            "current_drawdown": risk_metrics.current_drawdown,
            "risk_score": risk_metrics.risk_score,
            "warnings": risk_metrics.warnings,
            "calculated_at": risk_metrics.calculated_at
        }
        
    except Exception as e:
        logger.error(f"Error getting risk metrics: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/position/{user_id}")
async def create_or_update_position(
    user_id: str,
    position_data: dict,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    auth: AuthManager = Depends(get_auth_manager)
):
    """Create or update a position"""
    try:
        symbol = position_data.get("symbol")
        quantity = position_data.get("quantity")
        price = position_data.get("price")
        
        if not all([symbol, quantity, price]):
            raise HTTPException(status_code=400, detail="Missing required fields")
        
        # Check if position exists
        existing_position = db.query(Position).filter(
            and_(Position.user_id == user_id, Position.symbol == symbol)
        ).first()
        
        if existing_position:
            # Update existing position
            total_cost = (existing_position.quantity * existing_position.average_price) + (quantity * price)
            total_quantity = existing_position.quantity + quantity
            
            if total_quantity <= 0:
                # Position closed
                db.delete(existing_position)
            else:
                existing_position.quantity = total_quantity
                existing_position.average_price = total_cost / total_quantity
                existing_position.updated_at = datetime.now(timezone.utc)
        else:
            # Create new position
            new_position = Position(
                user_id=user_id,
                symbol=symbol,
                side="long",  # Assuming long positions for now
                quantity=quantity,
                average_price=price,
                current_price=price,
                market_value=quantity * price,
                entry_time=datetime.now(timezone.utc)
            )
            db.add(new_position)
        
        db.commit()
        
        # Schedule portfolio update
        background_tasks.add_task(update_portfolio_value, user_id, db)
        
        return {"message": "Position updated successfully"}
        
    except Exception as e:
        logger.error(f"Error updating position: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")

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
    port = 8100 if ENV == 'dev' else 8101 if ENV == 'test' else 8102
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=(ENV == 'dev'),
        log_level="info" if ENV == 'prod' else "debug"
    )
