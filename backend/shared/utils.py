"""
Shared utilities for Samrddhi services
"""

import os
import yaml
from typing import Dict, Any, Optional
from datetime import datetime, timezone
import logging


def get_environment_config(env: str = None) -> Dict[str, Any]:
    """Get environment configuration"""
    if env is None:
        env = os.getenv('SAMRDDHI_ENV', 'dev')
    
    config = {}
    env_file = f".env.{env}"
    
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    if '=' in line:
                        key, value = line.split('=', 1)
                        # Convert string representations of lists/bools
                        if value.lower() in ('true', 'false'):
                            config[key] = value.lower() == 'true'
                        elif value.startswith('[') and value.endswith(']'):
                            # Simple list parsing
                            config[key] = [v.strip().strip('"\'') for v in value[1:-1].split(',')]
                        else:
                            config[key] = value
    
    return config


def setup_logging(service_name: str, env: str = None) -> logging.Logger:
    """Setup logging for a service"""
    if env is None:
        env = os.getenv('SAMRDDHI_ENV', 'dev')
    
    log_level = logging.DEBUG if env == 'dev' else logging.INFO if env == 'test' else logging.WARNING
    
    # Create logger
    logger = logging.getLogger(service_name)
    logger.setLevel(log_level)
    
    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # File handler
    log_dir = f"logs/services"
    os.makedirs(log_dir, exist_ok=True)
    
    file_handler = logging.FileHandler(f"{log_dir}/{service_name}.log")
    file_handler.setLevel(log_level)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    
    return logger


def get_current_market_time() -> datetime:
    """Get current market time (Eastern Time)"""
    # For now, using UTC. In production, should convert to Eastern Time
    return datetime.now(timezone.utc)


def is_market_hours() -> bool:
    """Check if current time is within market hours"""
    current_time = get_current_market_time()
    
    # Market hours: 9:30 AM - 4:00 PM ET (Monday-Friday)
    # For simplicity, using UTC times. In production, should use proper timezone handling
    weekday = current_time.weekday()  # 0 = Monday, 6 = Sunday
    hour = current_time.hour
    
    # Weekend
    if weekday >= 5:  # Saturday or Sunday
        return False
    
    # Weekday market hours (approximate UTC conversion)
    # This is simplified - in production should handle holidays and DST properly
    if 13 <= hour < 21:  # Approximate EST market hours in UTC
        return True
    
    return False


def calculate_position_size(
    account_value: float,
    stock_price: float,
    risk_percent: float,
    stop_distance: float,
    volatility_adjustment: float = 1.0,
    correlation_factor: float = 1.0
) -> int:
    """
    Calculate intelligent position size
    
    Args:
        account_value: Total account value
        stock_price: Current stock price
        risk_percent: Risk percentage (e.g., 0.01 for 1%)
        stop_distance: Distance to stop loss in dollars
        volatility_adjustment: Adjustment factor based on volatility (1.0 = normal)
        correlation_factor: Adjustment factor based on portfolio correlation
    
    Returns:
        Number of shares to buy
    """
    if stop_distance <= 0:
        return 0
    
    # Risk amount in dollars
    risk_amount = account_value * risk_percent
    
    # Adjust for volatility and correlation
    adjusted_risk_amount = risk_amount / (volatility_adjustment * correlation_factor)
    
    # Calculate position size
    position_value = adjusted_risk_amount / stop_distance * stock_price
    shares = int(position_value / stock_price)
    
    # Ensure we don't exceed risk limits
    max_shares = int((account_value * 0.2) / stock_price)  # Max 20% in single position
    
    return min(shares, max_shares)


def validate_trading_hours(allow_extended: bool = False) -> bool:
    """Validate if trading is allowed at current time"""
    if allow_extended:
        # Extended hours: 4:00 AM - 8:00 PM ET
        current_time = get_current_market_time()
        weekday = current_time.weekday()
        hour = current_time.hour
        
        if weekday >= 5:  # Weekend
            return False
        
        if 8 <= hour < 24:  # Extended hours in UTC (approximate)
            return True
    else:
        return is_market_hours()
    
    return False


class RateLimiter:
    """Simple rate limiter for API calls"""
    
    def __init__(self, max_calls: int, time_window: int):
        self.max_calls = max_calls
        self.time_window = time_window
        self.calls = []
    
    def can_make_call(self) -> bool:
        """Check if a call can be made within rate limits"""
        now = datetime.now(timezone.utc)
        
        # Remove old calls outside time window
        cutoff = now.timestamp() - self.time_window
        self.calls = [call_time for call_time in self.calls if call_time > cutoff]
        
        # Check if under limit
        if len(self.calls) < self.max_calls:
            self.calls.append(now.timestamp())
            return True
        
        return False
    
    def time_until_next_call(self) -> float:
        """Get seconds until next call is allowed"""
        if not self.calls:
            return 0
        
        oldest_call = min(self.calls)
        now = datetime.now(timezone.utc).timestamp()
        
        return max(0, self.time_window - (now - oldest_call))


def sanitize_symbol(symbol: str) -> str:
    """Sanitize stock symbol"""
    return symbol.upper().strip()[:10]  # Max 10 characters, uppercase


def format_currency(amount: float, currency: str = "USD") -> str:
    """Format currency amount"""
    if currency == "USD":
        return f"${amount:,.2f}"
    return f"{amount:,.2f} {currency}"


def format_percentage(value: float, decimal_places: int = 2) -> str:
    """Format percentage"""
    return f"{value:.{decimal_places}f}%"


def load_yaml_config(file_path: str) -> Dict[str, Any]:
    """Load YAML configuration file"""
    try:
        with open(file_path, 'r') as f:
            return yaml.safe_load(f)
    except Exception as e:
        logging.error(f"Failed to load YAML config {file_path}: {e}")
        return {}


def save_yaml_config(data: Dict[str, Any], file_path: str) -> bool:
    """Save data to YAML configuration file"""
    try:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, 'w') as f:
            yaml.safe_dump(data, f, default_flow_style=False)
        return True
    except Exception as e:
        logging.error(f"Failed to save YAML config {file_path}: {e}")
        return False
