#!/usr/bin/env python3
"""
Database initialization script for SAMRDDHI platform
Creates all tables and sets up initial data
"""

import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from shared.database import create_tables, test_connection, SessionLocal
from shared.database.models import Portfolio, User
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def initialize_database():
    """Initialize the database with tables and initial data"""
    
    logger.info("Starting database initialization...")
    
    # Test connection first
    if not test_connection():
        logger.error("Database connection failed. Exiting.")
        return False
    
    # Create all tables
    try:
        create_tables()
        logger.info("All database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create tables: {e}")
        return False
    
    # Create initial data
    try:
        db = SessionLocal()
        
        # Check if we already have initial data
        existing_user = db.query(User).first()
        if existing_user:
            logger.info("Database already has initial data")
            db.close()
            return True
        
        # Create a demo user
        demo_user = User(
            username="demo",
            email="demo@samrddhi.com",
            full_name="Demo User",
            hashed_password="demo_password_hash",  # In real app, this would be properly hashed
            is_active=True,
            is_verified=True
        )
        db.add(demo_user)
        db.commit()
        
        # Create a demo portfolio
        demo_portfolio = Portfolio(
            user_id=demo_user.id,
            name="Demo Portfolio",
            total_value=100000.0,
            cash_balance=50000.0,
            total_pnl=0.0,
            total_pnl_percent=0.0
        )
        db.add(demo_portfolio)
        db.commit()
        
        db.close()
        logger.info("Initial demo data created successfully")
        
    except Exception as e:
        logger.error(f"Failed to create initial data: {e}")
        return False
    
    logger.info("Database initialization completed successfully!")
    return True

if __name__ == "__main__":
    success = initialize_database()
    if not success:
        sys.exit(1)
    print("✅ Database initialization completed successfully!")
