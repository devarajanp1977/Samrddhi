"""
Samrddhi Risk Management Service - Database Integrated Version
Monitors and manages trading risks with PostgreSQL backend
"""

import asyncio
import logging
import os
import sys
from datetime import datetime
from typing import Dict, Any, List, Optional
from decimal import Decimal

import uvicorn
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

# Add path to shared modules
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))

from shared.database import get_db, RiskMetrics, Alert, Portfolio, User

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Samrddhi Risk Management Service",
    description="Trading risk monitoring and management service",
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

# Request models for API
class TradeRiskCheck(BaseModel):
    symbol: str
    quantity: float
    price: float
    side: str  # 'buy' or 'sell'

# Remove in-memory storage and demo data - now using database

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "risk-management-service"}

@app.get("/risk-metrics")
async def get_risk_metrics(db: Session = Depends(get_db)):
    """Get risk metrics for the demo portfolio"""
    try:
        # Get demo user and portfolio
        demo_user = db.query(User).filter(User.username == "demo").first()
        if not demo_user:
            return {"error": "Demo user not found"}
        
        portfolio = db.query(Portfolio).filter(Portfolio.user_id == demo_user.id).first()
        if not portfolio:
            return {"error": "Demo portfolio not found"}
        
        # Get risk metrics for the portfolio
        risk_metrics = db.query(RiskMetrics).filter(RiskMetrics.portfolio_id == portfolio.id).first()
        
        if not risk_metrics:
            # Return default risk metrics if none exist
            return {
                "portfolio_id": portfolio.id,
                "var_1d": -1000.0,
                "var_5d": -2500.0,
                "sharpe_ratio": 1.2,
                "max_drawdown": -0.05,
                "beta": 0.8,
                "exposure": 25000.0,
                "concentration_risk": 0.15,
                "calculated_at": datetime.now()
            }
        
        return {
            "id": risk_metrics.id,
            "portfolio_id": risk_metrics.portfolio_id,
            "var_1d": risk_metrics.var_1d,
            "var_5d": risk_metrics.var_5d,
            "sharpe_ratio": risk_metrics.sharpe_ratio,
            "max_drawdown": risk_metrics.max_drawdown,
            "beta": risk_metrics.beta,
            "exposure": risk_metrics.exposure,
            "concentration_risk": risk_metrics.concentration_risk,
            "calculated_at": risk_metrics.calculated_at
        }
    except Exception as e:
        logger.error(f"Error fetching risk metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/risk-alerts")
async def get_risk_alerts(db: Session = Depends(get_db)):
    """Get risk alerts for the demo portfolio"""
    try:
        # Get demo user and portfolio
        demo_user = db.query(User).filter(User.username == "demo").first()
        if not demo_user:
            return []
        
        portfolio = db.query(Portfolio).filter(Portfolio.user_id == demo_user.id).first()
        if not portfolio:
            return []
        
        # Get alerts for the portfolio
        alerts = db.query(Alert).filter(
            Alert.portfolio_id == portfolio.id,
            Alert.alert_type == "risk"
        ).order_by(Alert.created_at.desc()).limit(10).all()
        
        return [
            {
                "id": alert.id,
                "portfolio_id": alert.portfolio_id,
                "alert_type": alert.alert_type,
                "severity": alert.severity,
                "title": alert.title,
                "message": alert.message,
                "is_read": alert.is_read,
                "created_at": alert.created_at,
                "acknowledged_at": alert.acknowledged_at
            }
            for alert in alerts
        ]
    except Exception as e:
        logger.error(f"Error fetching risk alerts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/check-trade-risk")
async def check_trade_risk(trade: TradeRiskCheck, db: Session = Depends(get_db)):
    """Check if a proposed trade meets risk requirements"""
    try:
        # Get demo user and portfolio
        demo_user = db.query(User).filter(User.username == "demo").first()
        if not demo_user:
            raise HTTPException(status_code=404, detail="Demo user not found")
        
        portfolio = db.query(Portfolio).filter(Portfolio.user_id == demo_user.id).first()
        if not portfolio:
            raise HTTPException(status_code=404, detail="Demo portfolio not found")
        
        # Simple risk checks
        trade_value = trade.quantity * trade.price
        
        # Check position size limit (simplified)
        if trade_value > 50000.0:  # Max position size
            # Create risk alert
            alert = Alert(
                portfolio_id=portfolio.id,
                alert_type="risk",
                severity="high",
                title="Position Size Warning",
                message=f"Trade value ${trade_value:,.2f} exceeds position size limit of $50,000",
                is_read=False
            )
            db.add(alert)
            db.commit()
            
            return {
                "approved": False,
                "reason": "Position size limit exceeded",
                "alert_id": alert.id
            }
        
        # Check leverage/exposure (simplified)
        if trade_value > portfolio.cash_balance * 2:  # Max 2x leverage
            # Create risk alert
            alert = Alert(
                portfolio_id=portfolio.id,
                alert_type="risk",
                severity="medium",
                title="Leverage Warning",
                message=f"Trade would exceed 2x leverage limit",
                is_read=False
            )
            db.add(alert)
            db.commit()
            
            return {
                "approved": False,
                "reason": "Leverage limit exceeded",
                "alert_id": alert.id
            }
        
        return {
            "approved": True,
            "reason": "Trade approved",
            "risk_score": 0.25  # Low risk
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking trade risk: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8180)),
        reload=True
    )

# In-memory storage for demo
risk_alerts: Dict[str, RiskAlert] = {}
risk_metrics: Dict[str, RiskMetrics] = {}
risk_limits: Dict[str, RiskLimits] = {}
alert_counter = 1000

# Initialize some demo data
def init_demo_data():
    # Demo risk metrics
    risk_metrics["demo_account"] = RiskMetrics(
        account_id="demo_account",
        total_exposure=150000.0,
        max_drawdown=-0.12,
        var_95=-5000.0,
        sharpe_ratio=1.25,
        beta=0.85,
        current_leverage=2.1,
        max_leverage=3.0,
        margin_utilization=0.65
    )
    
    # Demo risk limits
    risk_limits["demo_account"] = RiskLimits(
        account_id="demo_account",
        max_position_size=50000.0,
        max_daily_loss=-5000.0,
        max_leverage=3.0,
        concentration_limit=0.25
    )

init_demo_data()

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "risk-management-service"}

@app.get("/risk-metrics/{account_id}", response_model=RiskMetrics)
async def get_risk_metrics(account_id: str):
    """Get risk metrics for an account"""
    if account_id not in risk_metrics:
        # Return default metrics
        return RiskMetrics(
            account_id=account_id,
            total_exposure=0.0,
            max_drawdown=0.0,
            var_95=0.0,
            sharpe_ratio=0.0,
            beta=0.0,
            current_leverage=0.0,
            max_leverage=3.0,
            margin_utilization=0.0
        )
    return risk_metrics[account_id]

@app.get("/risk-limits/{account_id}", response_model=RiskLimits)
async def get_risk_limits(account_id: str):
    """Get risk limits for an account"""
    if account_id not in risk_limits:
        # Return default limits
        return RiskLimits(
            account_id=account_id,
            max_position_size=100000.0,
            max_daily_loss=-10000.0,
            max_leverage=3.0,
            concentration_limit=0.3
        )
    return risk_limits[account_id]

@app.put("/risk-limits/{account_id}")
async def update_risk_limits(account_id: str, limits: RiskLimits):
    """Update risk limits for an account"""
    risk_limits[account_id] = limits
    logger.info(f"Updated risk limits for account {account_id}")
    return {"message": f"Risk limits updated for account {account_id}"}

@app.get("/risk-alerts", response_model=List[RiskAlert])
async def get_risk_alerts(account_id: Optional[str] = None, severity: Optional[str] = None):
    """Get risk alerts, optionally filtered by account or severity"""
    alerts = list(risk_alerts.values())
    
    if account_id:
        alerts = [alert for alert in alerts if alert.account_id == account_id]
    
    if severity:
        alerts = [alert for alert in alerts if alert.severity == severity]
    
    return sorted(alerts, key=lambda x: x.created_at, reverse=True)

@app.post("/risk-check")
async def check_trade_risk(
    account_id: str, 
    symbol: str, 
    quantity: float, 
    price: float, 
    side: str
):
    """Check if a trade passes risk requirements"""
    global alert_counter
    
    trade_value = abs(quantity * price)
    
    # Get risk limits
    limits = await get_risk_limits(account_id)
    
    # Check position size limit
    if trade_value > limits.max_position_size:
        alert_id = f"RISK_{alert_counter:06d}"
        alert_counter += 1
        
        alert = RiskAlert(
            id=alert_id,
            account_id=account_id,
            alert_type="position_size_exceeded",
            severity="high",
            message=f"Trade value ${trade_value:,.2f} exceeds max position size ${limits.max_position_size:,.2f}",
            symbol=symbol,
            current_value=trade_value,
            threshold=limits.max_position_size,
            created_at=datetime.now()
        )
        
        risk_alerts[alert_id] = alert
        
        return {
            "approved": False,
            "reason": "Position size limit exceeded",
            "alert_id": alert_id
        }
    
    # Check leverage limit (simplified)
    current_metrics = await get_risk_metrics(account_id)
    if current_metrics.current_leverage > limits.max_leverage:
        alert_id = f"RISK_{alert_counter:06d}"
        alert_counter += 1
        
        alert = RiskAlert(
            id=alert_id,
            account_id=account_id,
            alert_type="leverage_exceeded",
            severity="high",
            message=f"Current leverage {current_metrics.current_leverage:.2f} exceeds limit {limits.max_leverage:.2f}",
            symbol=symbol,
            current_value=current_metrics.current_leverage,
            threshold=limits.max_leverage,
            created_at=datetime.now()
        )
        
        risk_alerts[alert_id] = alert
        
        return {
            "approved": False,
            "reason": "Leverage limit exceeded",
            "alert_id": alert_id
        }
    
    return {
        "approved": True,
        "reason": "Trade approved",
        "risk_score": 0.25  # Low risk
    }

@app.post("/calculate-metrics/{account_id}")
async def calculate_risk_metrics(account_id: str):
    """Recalculate risk metrics for an account"""
    # In a real implementation, this would calculate actual metrics
    # from portfolio data, trading history, etc.
    
    # For demo, just update timestamp and add some variation
    import random
    
    if account_id in risk_metrics:
        metrics = risk_metrics[account_id]
        # Add some random variation to simulate real-time updates
        metrics.current_leverage *= (1 + random.uniform(-0.1, 0.1))
        metrics.margin_utilization *= (1 + random.uniform(-0.1, 0.1))
        metrics.total_exposure *= (1 + random.uniform(-0.05, 0.05))
    
    logger.info(f"Recalculated risk metrics for account {account_id}")
    return {"message": f"Risk metrics recalculated for account {account_id}"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8180)),
        reload=True
    )
