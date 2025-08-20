"""
Samrddhi Risk Management Service - Database Integrated Version  
Monitors and manages trading risks with PostgreSQL backend
"""

import logging
import os
import sys
from datetime import datetime
from typing import Optional

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
