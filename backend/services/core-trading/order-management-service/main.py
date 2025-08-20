"""
Samrddhi Order Management Service - Database Integrated Version
Handles trade order execution and management with PostgreSQL backend
"""

import asyncio
import logging
import os
import sys
from datetime import datetime
from typing import Dict, Any, List, Optional
from decimal import Decimal

import uvicorn
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import httpx

# Add path to shared modules
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))

from shared.database import get_db, Order as OrderModel, Portfolio, User

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Samrddhi Order Management Service",
    description="Trade order execution and management service",
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

# Data models for API requests
class OrderRequest(BaseModel):
    symbol: str
    quantity: float
    order_type: str  # 'market', 'limit', 'stop'
    side: str  # 'buy', 'sell'
    price: Optional[float] = None
    stop_price: Optional[float] = None

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "order-management-service"}

@app.get("/orders")
async def get_orders(db: Session = Depends(get_db)):
    """Get all orders for the demo user"""
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
        orders = db.query(OrderModel).filter(OrderModel.portfolio_id == portfolio.id).all()
        
        return [
            {
                "id": order.id,
                "symbol": order.symbol,
                "quantity": order.quantity,
                "filled_quantity": order.filled_quantity,
                "remaining_quantity": order.quantity - order.filled_quantity,
                "order_type": order.order_type,
                "side": order.side,
                "price": order.price,
                "status": order.status,
                "portfolio_id": order.portfolio_id,
                "created_at": order.created_at,
                "updated_at": order.updated_at,
                "average_fill_price": order.average_fill_price,
                "time_in_force": order.time_in_force
            }
            for order in orders
        ]
    except Exception as e:
        logger.error(f"Error fetching orders: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/orders/{order_id}")
async def get_order(order_id: str, db: Session = Depends(get_db)):
    """Get a specific order"""
    try:
        order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        return {
            "id": order.id,
            "symbol": order.symbol,
            "quantity": order.quantity,
            "filled_quantity": order.filled_quantity,
            "remaining_quantity": order.quantity - order.filled_quantity,
            "order_type": order.order_type,
            "side": order.side,
            "price": order.price,
            "status": order.status,
            "portfolio_id": order.portfolio_id,
            "created_at": order.created_at,
            "updated_at": order.updated_at,
            "average_fill_price": order.average_fill_price,
            "time_in_force": order.time_in_force
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching order {order_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/orders")
async def create_order(order_request: OrderRequest, db: Session = Depends(get_db)):
    """Create a new trading order"""
    try:
        # Get demo user and portfolio
        demo_user = db.query(User).filter(User.username == "demo").first()
        if not demo_user:
            raise HTTPException(status_code=404, detail="Demo user not found")
        
        portfolio = db.query(Portfolio).filter(Portfolio.user_id == demo_user.id).first()
        if not portfolio:
            raise HTTPException(status_code=404, detail="Demo portfolio not found")
        
        # Create new order
        new_order = OrderModel(
            portfolio_id=portfolio.id,
            symbol=order_request.symbol,
            quantity=order_request.quantity,
            side=order_request.side,
            price=order_request.price or 0.0,
            order_type=order_request.order_type,
            status="pending",
            filled_quantity=0.0,
            average_fill_price=0.0,
            time_in_force="GTC"
        )
        
        db.add(new_order)
        db.commit()
        db.refresh(new_order)
        
        # Simulate order processing
        asyncio.create_task(process_order(new_order.id))
        
        logger.info(f"Created order {new_order.id} for {order_request.symbol}")
        
        return {
            "id": new_order.id,
            "symbol": new_order.symbol,
            "quantity": new_order.quantity,
            "filled_quantity": new_order.filled_quantity,
            "remaining_quantity": new_order.quantity - new_order.filled_quantity,
            "order_type": new_order.order_type,
            "side": new_order.side,
            "price": new_order.price,
            "status": new_order.status,
            "portfolio_id": new_order.portfolio_id,
            "created_at": new_order.created_at,
            "updated_at": new_order.updated_at,
            "average_fill_price": new_order.average_fill_price,
            "time_in_force": new_order.time_in_force
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating order: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def process_order(order_id: str):
    """Simulate order processing with database update"""
    await asyncio.sleep(1)  # Simulate processing delay
    
    try:
        # Create a new session for this async task
        from shared.database.connection import SessionLocal
        db = SessionLocal()
        
        order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
        if order:
            order.status = "filled"
            order.filled_quantity = order.quantity
            order.average_fill_price = order.price
            db.commit()
            logger.info(f"Order {order_id} filled")
        
        db.close()
    except Exception as e:
        logger.error(f"Error processing order {order_id}: {e}")

@app.put("/orders/{order_id}/cancel")
async def cancel_order(order_id: str, db: Session = Depends(get_db)):
    """Cancel an order"""
    try:
        order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        if order.status == "filled":
            raise HTTPException(status_code=400, detail="Cannot cancel filled order")
        
        order.status = "cancelled"
        db.commit()
        
        logger.info(f"Order {order_id} cancelled")
        return {"message": f"Order {order_id} cancelled"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling order {order_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/orders/status/{status}")
async def get_orders_by_status(status: str, db: Session = Depends(get_db)):
    """Get orders by status for the demo user"""
    try:
        # Get demo user
        demo_user = db.query(User).filter(User.username == "demo").first()
        if not demo_user:
            return []
        
        # Get demo user's portfolio  
        portfolio = db.query(Portfolio).filter(Portfolio.user_id == demo_user.id).first()
        if not portfolio:
            return []
        
        # Get orders with specified status
        orders = db.query(OrderModel).filter(
            OrderModel.portfolio_id == portfolio.id,
            OrderModel.status == status
        ).all()
        
        return [
            {
                "id": order.id,
                "symbol": order.symbol,
                "quantity": order.quantity,
                "filled_quantity": order.filled_quantity,
                "remaining_quantity": order.quantity - order.filled_quantity,
                "order_type": order.order_type,
                "side": order.side,
                "price": order.price,
                "status": order.status,
                "portfolio_id": order.portfolio_id,
                "created_at": order.created_at,
                "updated_at": order.updated_at,
                "average_fill_price": order.average_fill_price,
                "time_in_force": order.time_in_force
            }
            for order in orders
        ]
    except Exception as e:
        logger.error(f"Error fetching orders by status {status}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8160)),
        reload=True
    )
