"""
Comprehensive Trading Dashboard API
Provides a unified view of portfolio, market data, orders, and risk metrics
"""

import logging
import os
import sys
from datetime import datetime
from typing import Optional

import uvicorn
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# Add path to shared modules
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from shared.database import get_db, Portfolio, Position, Order, MarketData, TradingSignal, Alert, RiskMetrics, User

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SAMRDDHI Trading Dashboard API",
    description="Comprehensive trading platform dashboard with unified data access",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "service": "trading-dashboard-api",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/dashboard")
async def get_complete_dashboard(db: Session = Depends(get_db)):
    """Get complete trading dashboard with all relevant data"""
    try:
        # Get demo user and portfolio
        demo_user = db.query(User).filter(User.username == "demo").first()
        if not demo_user:
            raise HTTPException(status_code=404, detail="Demo user not found")
        
        portfolio = db.query(Portfolio).filter(Portfolio.user_id == demo_user.id).first()
        if not portfolio:
            raise HTTPException(status_code=404, detail="Demo portfolio not found")
        
        # Portfolio Summary
        positions_count = db.query(Position).filter(Position.portfolio_id == portfolio.id).count()
        total_positions_value = sum([pos.market_value for pos in 
                                   db.query(Position).filter(Position.portfolio_id == portfolio.id).all()])
        
        # Recent Orders
        recent_orders = db.query(Order).filter(
            Order.portfolio_id == portfolio.id
        ).order_by(Order.created_at.desc()).limit(5).all()
        
        # Market Data (latest for portfolio symbols)
        portfolio_symbols = [pos.symbol for pos in 
                           db.query(Position).filter(Position.portfolio_id == portfolio.id).all()]
        market_data = []
        for symbol in portfolio_symbols:
            latest_data = db.query(MarketData).filter(
                MarketData.symbol == symbol
            ).order_by(MarketData.timestamp.desc()).first()
            if latest_data:
                market_data.append({
                    "symbol": latest_data.symbol,
                    "close_price": latest_data.close_price,
                    "high_price": latest_data.high_price,
                    "low_price": latest_data.low_price,
                    "volume": latest_data.volume,
                    "timestamp": latest_data.timestamp
                })
        
        # Trading Signals
        recent_signals = db.query(TradingSignal).order_by(
            TradingSignal.created_at.desc()
        ).limit(5).all()
        
        # Risk Alerts
        recent_alerts = db.query(Alert).filter(
            Alert.portfolio_id == portfolio.id
        ).order_by(Alert.created_at.desc()).limit(3).all()
        
        # Risk Metrics
        risk_metrics = db.query(RiskMetrics).filter(
            RiskMetrics.portfolio_id == portfolio.id
        ).first()
        
        return {
            "timestamp": datetime.now().isoformat(),
            "portfolio": {
                "id": portfolio.id,
                "name": portfolio.name,
                "total_value": portfolio.total_value,
                "cash_balance": portfolio.cash_balance,
                "total_pnl": portfolio.total_pnl,
                "total_pnl_percent": portfolio.total_pnl_percent,
                "positions_count": positions_count,
                "positions_value": total_positions_value
            },
            "recent_orders": [
                {
                    "id": order.id,
                    "symbol": order.symbol,
                    "side": order.side,
                    "quantity": order.quantity,
                    "price": order.price,
                    "status": order.status,
                    "created_at": order.created_at
                } for order in recent_orders
            ],
            "market_data": market_data,
            "trading_signals": [
                {
                    "symbol": signal.symbol,
                    "signal_type": signal.signal_type,
                    "strategy": signal.strategy,
                    "confidence": signal.confidence,
                    "price_target": signal.price_target,
                    "created_at": signal.created_at
                } for signal in recent_signals
            ],
            "risk_alerts": [
                {
                    "id": alert.id,
                    "severity": alert.severity,
                    "title": alert.title,
                    "message": alert.message,
                    "created_at": alert.created_at
                } for alert in recent_alerts
            ],
            "risk_metrics": {
                "var_1d": risk_metrics.var_1d if risk_metrics else -1000.0,
                "var_5d": risk_metrics.var_5d if risk_metrics else -2500.0,
                "sharpe_ratio": risk_metrics.sharpe_ratio if risk_metrics else 1.2,
                "max_drawdown": risk_metrics.max_drawdown if risk_metrics else -0.05,
                "beta": risk_metrics.beta if risk_metrics else 0.8,
                "exposure": risk_metrics.exposure if risk_metrics else total_positions_value
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching dashboard data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/portfolio/performance")
async def get_portfolio_performance(db: Session = Depends(get_db)):
    """Get detailed portfolio performance metrics"""
    try:
        demo_user = db.query(User).filter(User.username == "demo").first()
        if not demo_user:
            raise HTTPException(status_code=404, detail="Demo user not found")
        
        portfolio = db.query(Portfolio).filter(Portfolio.user_id == demo_user.id).first()
        if not portfolio:
            raise HTTPException(status_code=404, detail="Demo portfolio not found")
        
        # Get all positions
        positions = db.query(Position).filter(Position.portfolio_id == portfolio.id).all()
        
        # Calculate performance metrics
        total_cost = sum([pos.total_cost for pos in positions])
        total_market_value = sum([pos.market_value for pos in positions])
        total_unrealized_pnl = sum([pos.unrealized_pnl for pos in positions])
        
        # Position breakdown
        position_breakdown = [
            {
                "symbol": pos.symbol,
                "quantity": pos.quantity,
                "average_price": pos.average_price,
                "current_price": pos.current_price,
                "market_value": pos.market_value,
                "unrealized_pnl": pos.unrealized_pnl,
                "unrealized_pnl_percent": pos.unrealized_pnl_percent,
                "weight": (pos.market_value / total_market_value * 100) if total_market_value > 0 else 0
            } for pos in positions
        ]
        
        return {
            "portfolio_id": portfolio.id,
            "total_value": portfolio.total_value,
            "cash_balance": portfolio.cash_balance,
            "invested_amount": total_cost,
            "market_value": total_market_value,
            "total_pnl": total_unrealized_pnl,
            "total_return_percent": (total_unrealized_pnl / total_cost * 100) if total_cost > 0 else 0,
            "cash_percentage": (portfolio.cash_balance / portfolio.total_value * 100) if portfolio.total_value > 0 else 0,
            "invested_percentage": (total_market_value / portfolio.total_value * 100) if portfolio.total_value > 0 else 0,
            "positions": position_breakdown,
            "diversification_score": len(positions) * 20 if len(positions) <= 5 else 100  # Simple diversification metric
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching portfolio performance: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8300)),
        reload=True
    )
