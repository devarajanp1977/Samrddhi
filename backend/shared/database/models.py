"""
Database models for SAMRDDHI trading platform
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .connection import Base
import uuid

class Portfolio(Base):
    __tablename__ = "portfolios"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False)  # Will be used when auth is implemented
    name = Column(String, nullable=False)
    total_value = Column(Float, default=0.0)
    cash_balance = Column(Float, default=0.0)
    total_pnl = Column(Float, default=0.0)
    total_pnl_percent = Column(Float, default=0.0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    positions = relationship("Position", back_populates="portfolio")

class Position(Base):
    __tablename__ = "positions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    portfolio_id = Column(String, ForeignKey("portfolios.id"), nullable=False)
    symbol = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    average_price = Column(Float, nullable=False)
    current_price = Column(Float, nullable=False)
    market_value = Column(Float, nullable=False)
    total_cost = Column(Float, nullable=False)
    unrealized_pnl = Column(Float, nullable=False)
    unrealized_pnl_percent = Column(Float, nullable=False)
    side = Column(String, nullable=False)  # 'long' or 'short'
    open_date = Column(DateTime, server_default=func.now())
    last_updated = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    portfolio = relationship("Portfolio", back_populates="positions")

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    portfolio_id = Column(String, ForeignKey("portfolios.id"), nullable=False)
    symbol = Column(String, nullable=False)
    side = Column(String, nullable=False)  # 'buy' or 'sell'
    quantity = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    order_type = Column(String, nullable=False)  # 'market', 'limit', 'stop', 'stop_limit'
    time_in_force = Column(String, default="GTC")  # 'GTC', 'GTD', 'IOC', 'FOK'
    status = Column(String, default="pending")  # 'pending', 'filled', 'cancelled', 'rejected', 'partially_filled'
    filled_quantity = Column(Float, default=0.0)
    average_fill_price = Column(Float, default=0.0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    expires_at = Column(DateTime, nullable=True)

class MarketData(Base):
    __tablename__ = "market_data"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    symbol = Column(String, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    open_price = Column(Float, nullable=False)
    high_price = Column(Float, nullable=False)
    low_price = Column(Float, nullable=False)
    close_price = Column(Float, nullable=False)
    volume = Column(Integer, nullable=False)
    vwap = Column(Float, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

class TradingSignal(Base):
    __tablename__ = "trading_signals"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    symbol = Column(String, nullable=False)
    signal_type = Column(String, nullable=False)  # 'buy', 'sell', 'hold'
    strategy = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)  # 0.0 to 1.0
    price_target = Column(Float, nullable=True)
    stop_loss = Column(Float, nullable=True)
    timeframe = Column(String, nullable=False)
    indicators = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    expires_at = Column(DateTime, nullable=True)

class RiskMetrics(Base):
    __tablename__ = "risk_metrics"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    portfolio_id = Column(String, ForeignKey("portfolios.id"), nullable=False)
    var_1d = Column(Float, nullable=False)  # 1-day Value at Risk
    var_5d = Column(Float, nullable=False)  # 5-day Value at Risk
    sharpe_ratio = Column(Float, nullable=False)
    max_drawdown = Column(Float, nullable=False)
    beta = Column(Float, nullable=False)
    exposure = Column(Float, nullable=False)
    concentration_risk = Column(Float, nullable=False)
    calculated_at = Column(DateTime, server_default=func.now())

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    portfolio_id = Column(String, ForeignKey("portfolios.id"), nullable=True)
    alert_type = Column(String, nullable=False)  # 'risk', 'price', 'signal', 'system'
    severity = Column(String, nullable=False)  # 'low', 'medium', 'high', 'critical'
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    acknowledged_at = Column(DateTime, nullable=True)

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
