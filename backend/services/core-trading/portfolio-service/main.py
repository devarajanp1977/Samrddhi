"""
Portfolio Service - Database Integrated Version
"""

import sys
import os
from typing import List
from datetime import datetime

# Add path to shared modules
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))

import uvicorn
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from shared.database import get_db, Portfolio, Position, Order, User

app = FastAPI(title="Portfolio Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "portfolio-service"}

@app.get("/portfolio")
async def get_portfolio(db: Session = Depends(get_db)):
    """Get the demo user's portfolio"""
    try:
        # Get demo user
        demo_user = db.query(User).filter(User.username == "demo").first()
        if not demo_user:
            raise HTTPException(status_code=404, detail="Demo user not found")
        
        # Get demo user's portfolio
        portfolio = db.query(Portfolio).filter(Portfolio.user_id == demo_user.id).first()
        if not portfolio:
            raise HTTPException(status_code=404, detail="Portfolio not found")
        
        # Get positions count
        positions_count = db.query(Position).filter(Position.portfolio_id == portfolio.id).count()
        
        return {
            "id": portfolio.id,
            "name": portfolio.name,
            "account_value": portfolio.total_value,
            "cash_balance": portfolio.cash_balance,
            "positions_count": positions_count,
            "total_return": portfolio.total_pnl,
            "total_return_percent": portfolio.total_pnl_percent,
            "created_at": portfolio.created_at,
            "updated_at": portfolio.updated_at
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/positions")
async def get_positions(db: Session = Depends(get_db)):
    """Get positions for the demo portfolio"""
    try:
        # Get demo user
        demo_user = db.query(User).filter(User.username == "demo").first()
        if not demo_user:
            # Return empty list if no demo user
            return []
        
        # Get demo user's portfolio
        portfolio = db.query(Portfolio).filter(Portfolio.user_id == demo_user.id).first()
        if not portfolio:
            # Return empty list if no portfolio
            return []
        
        # Get all positions for the portfolio
        positions = db.query(Position).filter(Position.portfolio_id == portfolio.id).all()
        
        return [
            {
                "id": position.id,
                "symbol": position.symbol,
                "quantity": position.quantity,
                "average_price": position.average_price,
                "current_price": position.current_price,
                "market_value": position.market_value,
                "total_cost": position.total_cost,
                "unrealized_pnl": position.unrealized_pnl,
                "unrealized_pnl_percent": position.unrealized_pnl_percent,
                "side": position.side,
                "open_date": position.open_date,
                "last_updated": position.last_updated
            }
            for position in positions
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/orders")
async def get_orders(db: Session = Depends(get_db)):
    """Get orders for the demo portfolio"""
    try:
        # Get demo user
        demo_user = db.query(User).filter(User.username == "demo").first()
        if not demo_user:
            return []
        
        # Get demo user's portfolio  
        portfolio = db.query(Portfolio).filter(Portfolio.user_id == demo_user.id).first()
        if not portfolio:
            return []
        
        # Get orders for the portfolio
        orders = db.query(Order).filter(Order.portfolio_id == portfolio.id).all()
        
        return [
            {
                "id": order.id,
                "symbol": order.symbol,
                "order_type": order.order_type,
                "side": order.side,
                "quantity": order.quantity,
                "price": order.price,
                "status": order.status,
                "created_at": order.created_at,
                "filled_quantity": order.filled_quantity,
                "average_fill_price": order.average_fill_price,
                "portfolio_id": order.portfolio_id,
                "time_in_force": order.time_in_force,
                "expires_at": order.expires_at
            }
            for order in orders
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/metrics")
async def get_metrics(db: Session = Depends(get_db)):
    """Get portfolio metrics for the demo user"""
    try:
        # Get demo user
        demo_user = db.query(User).filter(User.username == "demo").first()
        if not demo_user:
            # Return default metrics if no demo user
            return {
                "total_value": 0,
                "cash_balance": 0,
                "total_pnl": 0,
                "total_pnl_percent": 0,
                "positions_count": 0
            }
        
        # Get demo user's portfolio
        portfolio = db.query(Portfolio).filter(Portfolio.user_id == demo_user.id).first()
        if not portfolio:
            # Return default metrics if no portfolio
            return {
                "total_value": 0,
                "cash_balance": 0,
                "total_pnl": 0,
                "total_pnl_percent": 0,
                "positions_count": 0
            }
        
        # Count positions
        positions_count = db.query(Position).filter(Position.portfolio_id == portfolio.id).count()
        
        return {
            "total_value": portfolio.total_value,
            "cash_balance": portfolio.cash_balance,
            "total_pnl": portfolio.total_pnl,
            "total_pnl_percent": portfolio.total_pnl_percent,
            "positions_count": positions_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8100, reload=True)
