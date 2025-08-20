"""
Database models and utilities for Samrddhi
"""

import os
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from enum import Enum

from sqlalchemy import create_engine, Column, String, Float, Integer, DateTime, Boolean, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.dialects.postgresql import UUID
import uuid

from .utils import get_environment_config

# Base class for all models
Base = declarative_base()

# Configuration
config = get_environment_config()
env = os.getenv('SAMRDDHI_ENV', 'dev')

# Database URL
postgres_host = config.get('POSTGRES_HOST', 'localhost')
postgres_port = config.get('POSTGRES_PORT', '5432')
postgres_db = config.get('POSTGRES_DB', f'samrddhi_{env}')
postgres_user = config.get('POSTGRES_USER', f'samrddhi_{env}')
postgres_password = config.get('POSTGRES_PASSWORD', f'{env}_password_2024')

DATABASE_URL = f"postgresql://{postgres_user}:{postgres_password}@{postgres_host}:{postgres_port}/{postgres_db}"

# Create engine and session
engine = create_engine(DATABASE_URL, echo=(env == 'dev'))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Session:
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Enums
class OrderStatus(str, Enum):
    PENDING = "pending"
    SUBMITTED = "submitted"
    FILLED = "filled"
    PARTIALLY_FILLED = "partially_filled"
    CANCELLED = "cancelled"
    REJECTED = "rejected"


class OrderType(str, Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP_LOSS = "stop_loss"
    STOP_LIMIT = "stop_limit"
    TRAILING_STOP = "trailing_stop"


class PositionSide(str, Enum):
    LONG = "long"
    SHORT = "short"


class SignalType(str, Enum):
    BUY = "buy"
    SELL = "sell"
    HOLD = "hold"


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


# Core Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(100), nullable=False)
    role = Column(String(20), default="user")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    last_login = Column(DateTime(timezone=True), nullable=True)
    settings = Column(JSON, default=dict)


class Portfolio(Base):
    __tablename__ = "portfolios"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    account_value = Column(Float, nullable=False)
    cash_balance = Column(Float, nullable=False)
    buying_power = Column(Float, nullable=False)
    day_trades_remaining = Column(Integer, default=3)
    total_return = Column(Float, default=0.0)
    total_return_percent = Column(Float, default=0.0)
    daily_pnl = Column(Float, default=0.0)
    daily_pnl_percent = Column(Float, default=0.0)
    max_drawdown = Column(Float, default=0.0)
    sharpe_ratio = Column(Float, nullable=True)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    metadata = Column(JSON, default=dict)


class Position(Base):
    __tablename__ = "positions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    symbol = Column(String(10), nullable=False, index=True)
    side = Column(String(10), nullable=False)  # long/short
    quantity = Column(Float, nullable=False)
    average_price = Column(Float, nullable=False)
    current_price = Column(Float, nullable=False)
    market_value = Column(Float, nullable=False)
    unrealized_pnl = Column(Float, default=0.0)
    unrealized_pnl_percent = Column(Float, default=0.0)
    stop_loss_price = Column(Float, nullable=True)
    take_profit_price = Column(Float, nullable=True)
    entry_time = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    metadata = Column(JSON, default=dict)


class Order(Base):
    __tablename__ = "orders"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    symbol = Column(String(10), nullable=False, index=True)
    order_type = Column(String(20), nullable=False)
    side = Column(String(10), nullable=False)  # buy/sell
    quantity = Column(Float, nullable=False)
    price = Column(Float, nullable=True)  # None for market orders
    stop_price = Column(Float, nullable=True)
    filled_quantity = Column(Float, default=0.0)
    filled_price = Column(Float, nullable=True)
    status = Column(String(20), default=OrderStatus.PENDING)
    broker_order_id = Column(String(100), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    executed_at = Column(DateTime(timezone=True), nullable=True)
    metadata = Column(JSON, default=dict)


class Trade(Base):
    __tablename__ = "trades"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    symbol = Column(String(10), nullable=False, index=True)
    buy_order_id = Column(UUID(as_uuid=True), nullable=True)
    sell_order_id = Column(UUID(as_uuid=True), nullable=True)
    quantity = Column(Float, nullable=False)
    entry_price = Column(Float, nullable=False)
    exit_price = Column(Float, nullable=True)
    realized_pnl = Column(Float, nullable=True)
    realized_pnl_percent = Column(Float, nullable=True)
    commission = Column(Float, default=0.0)
    entry_time = Column(DateTime(timezone=True), nullable=False)
    exit_time = Column(DateTime(timezone=True), nullable=True)
    hold_time_minutes = Column(Integer, nullable=True)
    strategy_name = Column(String(50), nullable=True)
    is_day_trade = Column(Boolean, default=False)
    metadata = Column(JSON, default=dict)


class Signal(Base):
    __tablename__ = "signals"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    symbol = Column(String(10), nullable=False, index=True)
    signal_type = Column(String(10), nullable=False)  # buy/sell/hold
    confidence = Column(Float, nullable=False)  # 0.0 to 1.0
    target_price = Column(Float, nullable=True)
    stop_loss_price = Column(Float, nullable=True)
    expected_return = Column(Float, nullable=True)
    risk_level = Column(String(20), default=RiskLevel.MEDIUM)
    strategy_name = Column(String(50), nullable=False)
    indicators = Column(JSON, default=dict)
    market_data = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)
    metadata = Column(JSON, default=dict)


class RiskMetrics(Base):
    __tablename__ = "risk_metrics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    portfolio_value = Column(Float, nullable=False)
    daily_var = Column(Float, nullable=False)  # Value at Risk
    portfolio_beta = Column(Float, nullable=True)
    concentration_risk = Column(Float, nullable=False)
    correlation_risk = Column(Float, nullable=False)
    volatility = Column(Float, nullable=False)
    max_drawdown = Column(Float, nullable=False)
    current_drawdown = Column(Float, nullable=False)
    risk_score = Column(Float, nullable=False)  # 0-100
    warnings = Column(JSON, default=list)
    calculated_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class MarketData(Base):
    __tablename__ = "market_data"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    symbol = Column(String(10), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    open_price = Column(Float, nullable=False)
    high_price = Column(Float, nullable=False)
    low_price = Column(Float, nullable=False)
    close_price = Column(Float, nullable=False)
    volume = Column(Integer, nullable=False)
    vwap = Column(Float, nullable=True)
    bid_price = Column(Float, nullable=True)
    ask_price = Column(Float, nullable=True)
    bid_size = Column(Integer, nullable=True)
    ask_size = Column(Integer, nullable=True)
    spread = Column(Float, nullable=True)
    indicators = Column(JSON, default=dict)  # Technical indicators
    metadata = Column(JSON, default=dict)


class MLModel(Base):
    __tablename__ = "ml_models"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    version = Column(String(20), nullable=False)
    model_type = Column(String(50), nullable=False)  # classification, regression, etc.
    strategy_name = Column(String(50), nullable=False)
    features = Column(JSON, default=list)
    parameters = Column(JSON, default=dict)
    metrics = Column(JSON, default=dict)  # accuracy, precision, etc.
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    trained_at = Column(DateTime(timezone=True), nullable=True)
    last_prediction_at = Column(DateTime(timezone=True), nullable=True)
    metadata = Column(JSON, default=dict)


class SystemEvent(Base):
    __tablename__ = "system_events"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_type = Column(String(50), nullable=False, index=True)
    severity = Column(String(20), nullable=False)  # info, warning, error, critical
    message = Column(Text, nullable=False)
    service_name = Column(String(50), nullable=False)
    user_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    details = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    metadata = Column(JSON, default=dict)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(String(100), nullable=True)
    old_values = Column(JSON, default=dict)
    new_values = Column(JSON, default=dict)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    metadata = Column(JSON, default=dict)


def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)


def drop_tables():
    """Drop all database tables"""
    Base.metadata.drop_all(bind=engine)


if __name__ == "__main__":
    create_tables()
    print("Database tables created successfully!")
