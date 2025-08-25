"""Alpaca Integration Service (Demo / Paper / Live)

Implements core Trading API surfaces using the official `alpaca-py` SDK:
 - Account       (/account)
 - Assets        (/assets, /assets/{symbol})
 - Positions     (/positions, /positions/{symbol})
 - Orders        (POST /orders, GET /orders, /orders/{id}, cancel endpoints)
 - Market Data   (basic latest quote & recent minute bars)
 - Health        (/health)
 - Candidates    (example asset screener)

Safety:
 - Live trading only if TRADING_ENV=live AND ENABLE_LIVE_TRADING=true AND live keys present.
 - Otherwise falls back to paper or demo (no network calls if keys absent).

Environment selection order: TRADING_ENV -> ENVIRONMENT -> 'paper'.
Optional local env files: .env.paper / .env.live (never commit populated secrets).

This refactor migrates from deprecated `alpaca-trade-api` to modern `alpaca-py`.
"""

import asyncio
import json
import logging
import os
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from threading import Lock
from base64 import urlsafe_b64decode, urlsafe_b64encode

try:
    from cryptography.fernet import Fernet  # type: ignore
    encryption_available = True
except Exception:  # noqa: BLE001
    encryption_available = False

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Path, Header
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import uvicorn

try:  # Lazy import so demo mode can run without dependency at build time
    from alpaca.trading.client import TradingClient
    from alpaca.trading.requests import (
        MarketOrderRequest,
        LimitOrderRequest,
        StopLimitOrderRequest,
        StopOrderRequest,
        TrailingStopOrderRequest,
        GetOrdersRequest,
        GetAssetsRequest,
    TakeProfitRequest,
    StopLossRequest,
    )
    from alpaca.trading.enums import (
        OrderSide,
        TimeInForce,
        OrderClass,
        AssetClass,
        QueryOrderStatus,
    )
    from alpaca.data.historical import StockHistoricalDataClient
    from alpaca.data.requests import StockLatestQuoteRequest, StockBarsRequest
    from alpaca.data.timeframe import TimeFrame
    alpaca_py_available = True
except Exception:  # noqa: BLE001
    alpaca_py_available = False

###########################################################################
###########################################################################
# Environment & Keys
###########################################################################
trading_env = (os.getenv("TRADING_ENV") or os.getenv("ENVIRONMENT") or "paper").lower()
if trading_env not in {"paper", "live"}:
    trading_env = "paper"

env_file = f".env.{trading_env}"
if os.path.exists(env_file):
    load_dotenv(env_file)
elif trading_env == "paper" and os.path.exists(".env.paper"):
    load_dotenv(".env.paper")

enable_live = os.getenv("ENABLE_LIVE_TRADING", "false").lower() == "true"

# Configure logging
log_level = os.getenv("LOG_LEVEL", "INFO")
logging.basicConfig(level=getattr(logging, log_level))
logger = logging.getLogger(__name__)

app = FastAPI(title="Alpaca Integration Service", version="1.1.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

###########################################################################
# Key selection logic (separate vars for clarity & security layering)
###########################################################################

if trading_env == "live":
    key = os.getenv("ALPACA_LIVE_API_KEY")
    secret = os.getenv("ALPACA_LIVE_SECRET_KEY")
    base_url = os.getenv("ALPACA_LIVE_BASE_URL", "https://api.alpaca.markets")
else:
    key = os.getenv("ALPACA_PAPER_API_KEY") or os.getenv("ALPACA_API_KEY")
    secret = os.getenv("ALPACA_PAPER_SECRET_KEY") or os.getenv("ALPACA_SECRET_KEY")
    base_url = os.getenv("ALPACA_PAPER_BASE_URL", "https://paper-api.alpaca.markets")

effective_env = trading_env
if trading_env == "live" and not enable_live:
    logging.warning("Live env requested without ENABLE_LIVE_TRADING=true -> DEMO mode")
    effective_env = "demo"

is_demo_mode = not (key and secret) or effective_env == "demo" or not alpaca_py_available

trading_client: Optional["TradingClient"] = None
data_client: Optional["StockHistoricalDataClient"] = None
client_lock = Lock()
def _initialize_clients(current_env: str, api_key: Optional[str], api_secret: Optional[str]):
    """(Re)initialize trading & data clients safely."""
    global trading_client, data_client, is_demo_mode, effective_env, key, secret  # noqa: PLW0603
    with client_lock:
        key = api_key
        secret = api_secret
        target_env = current_env if current_env in {"paper", "live"} else "paper"
        eff_env = target_env
        if target_env == "live" and not enable_live:
            logging.warning("Live env requested without ENABLE_LIVE_TRADING=true -> DEMO mode")
            eff_env = "demo"
        demo = not (key and secret) or eff_env == "demo" or not alpaca_py_available
        if demo:
            trading_client = None
            data_client = None
            is_demo_mode = True
            effective_env = eff_env
            logging.info(f"Alpaca DEMO mode (requested={target_env} effective={eff_env} avail={alpaca_py_available})")
            return
        try:
            tc = TradingClient(key, secret, paper=eff_env != "live")
            dc = StockHistoricalDataClient(key, secret)
            _ = tc.get_account()
            trading_client = tc
            data_client = dc
            is_demo_mode = False
            effective_env = eff_env
            logging.info(f"Alpaca mode {effective_env.upper()} (paper={effective_env != 'live'}) initialized")
        except Exception as e:  # noqa: BLE001
            logging.error(f"Initialization failed: {e}; falling back to DEMO mode")
            trading_client = None
            data_client = None
            is_demo_mode = True
            effective_env = "demo"

_initialize_clients(trading_env, key, secret)

###########################################################################
# Utility helpers
###########################################################################

# WebSocket connection manager for simple real-time updates
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        for connection in self.active_connections.copy():
            try:
                await connection.send_text(json.dumps(message))
            except:
                self.disconnect(connection)

manager = ConnectionManager()

@app.get("/health")
async def health():
    if is_demo_mode or not trading_client:
        return {
            "status": "healthy",
            "service": "alpaca-integration",
            "requested_env": trading_env,
            "effective_env": effective_env,
            "mode": "demo",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    try:
        acct = trading_client.get_account()
        return {
            "status": "healthy",
            "service": "alpaca-integration",
            "requested_env": trading_env,
            "effective_env": effective_env,
            "mode": "live_trading" if effective_env == "live" else "paper_trading",
            "account_status": str(acct.status),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:  # noqa: BLE001
        return {
            "status": "unhealthy",
            "service": "alpaca-integration",
            "requested_env": trading_env,
            "effective_env": effective_env,
            "mode": "error",
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

###########################################################################
# Dynamic Credential Injection
###########################################################################

class CredentialPayload(BaseModel):
    environment: str = "paper"
    api_key: str
    secret_key: str
    persist: bool = False
    encrypt: bool = True


@app.post("/credentials")
async def inject_credentials(payload: CredentialPayload, x_admin_token: Optional[str] = Header(default=None, alias="X-Admin-Token")):
    admin_token = os.getenv("ALPACA_ADMIN_TOKEN")
    if admin_token and admin_token != x_admin_token:
        raise HTTPException(status_code=401, detail="Invalid admin token")
    env_lower = payload.environment.lower()
    if env_lower == "live" and not enable_live:
        raise HTTPException(status_code=400, detail="Live trading not enabled (ENABLE_LIVE_TRADING)")
    _initialize_clients(env_lower, payload.api_key.strip(), payload.secret_key.strip())
    persisted = False
    if payload.persist:
        fname = f".env.{env_lower}"
        try:
            to_store_key = payload.api_key
            to_store_secret = payload.secret_key
            if payload.encrypt and encryption_available:
                # Derive / load master key
                master = os.getenv("ALPACA_CRED_MASTER_KEY")
                if not master:
                    master = Fernet.generate_key().decode()
                    logging.warning("Generated ephemeral master key (set ALPACA_CRED_MASTER_KEY to persist decryption capability)")
                try:
                    fernet = Fernet(master.encode())
                except Exception:  # noqa: BLE001
                    # Fallback generate valid key if malformed
                    master = Fernet.generate_key().decode()
                    fernet = Fernet(master.encode())
                enc_key = fernet.encrypt(payload.api_key.encode()).decode()
                enc_secret = fernet.encrypt(payload.secret_key.encode()).decode()
                to_store_key = f"ENC::{enc_key}"
                to_store_secret = f"ENC::{enc_secret}"
            with open(fname, "w", encoding="utf-8") as f:
                if env_lower == "live":
                    f.write(
                        f"ALPACA_LIVE_API_KEY={to_store_key}\nALPACA_LIVE_SECRET_KEY={to_store_secret}\nTRADING_ENV=live\n"
                    )
                else:
                    f.write(
                        f"ALPACA_PAPER_API_KEY={to_store_key}\nALPACA_PAPER_SECRET_KEY={to_store_secret}\nTRADING_ENV=paper\n"
                    )
            persisted = True
        except Exception as e:  # noqa: BLE001
            logging.error(f"Failed to persist credentials: {e}")
    mode = "live_trading" if effective_env == "live" and not is_demo_mode else ("paper_trading" if not is_demo_mode else "demo")
    return {"status": "ok", "persisted": persisted, "effective_env": effective_env, "mode": mode, "demo": is_demo_mode}

@app.get("/account")
async def account():
    if is_demo_mode or not trading_client:
        return {
            "account_id": "demo_account",
            "status": "ACTIVE",
            "buying_power": 100000.0,
            "cash": 100000.0,
            "portfolio_value": 100000.0,
            "equity": 100000.0,
            "day_trade_count": 0,
            "pattern_day_trader": False,
            "trading_blocked": False,
            "shorting_enabled": True,
            "mode": effective_env,
        }
    try:
        acct = trading_client.get_account()
        return {
            "account_id": str(acct.id),
            "status": str(acct.status),
            "buying_power": float(acct.buying_power),
            "cash": float(acct.cash),
            "portfolio_value": float(acct.portfolio_value),
            "equity": float(acct.equity),
            "day_trade_count": int(getattr(acct, "daytrade_count", 0)),
            "pattern_day_trader": bool(getattr(acct, "pattern_day_trader", False)),
            "trading_blocked": bool(getattr(acct, "trading_blocked", False)),
            "shorting_enabled": bool(getattr(acct, "shorting_enabled", True)),
            "mode": "live_trading" if effective_env == "live" else "paper_trading",
        }
    except Exception as e:  # noqa: BLE001
        logger.error(f"Account fetch error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/positions")
async def get_positions():
    if is_demo_mode or not trading_client:
        return []
    try:
        positions = trading_client.get_all_positions()
        return [
            {
                "symbol": p.symbol,
                "qty": float(p.qty),
                "avg_entry_price": float(p.avg_entry_price),
                "market_value": float(p.market_value),
                "cost_basis": float(p.cost_basis),
                "unrealized_pl": float(p.unrealized_pl),
                "unrealized_plpc": float(p.unrealized_plpc),
                "current_price": float(p.current_price),
                "change_today": float(getattr(p, "change_today", 0)),
            }
            for p in positions
        ]
    except Exception as e:  # noqa: BLE001
        logger.error(f"Error getting positions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/positions/{symbol}")
async def get_position(symbol: str = Path(..., description="Ticker symbol")):
    if is_demo_mode or not trading_client:
        raise HTTPException(status_code=404, detail="Not found in demo")
    try:
        p = trading_client.get_open_position(symbol)
        return {
            "symbol": p.symbol,
            "qty": float(p.qty),
            "avg_entry_price": float(p.avg_entry_price),
            "market_value": float(p.market_value),
            "cost_basis": float(p.cost_basis),
            "unrealized_pl": float(p.unrealized_pl),
            "unrealized_plpc": float(p.unrealized_plpc),
            "current_price": float(p.current_price),
            "change_today": float(getattr(p, "change_today", 0)),
        }
    except Exception as e:  # noqa: BLE001
        logger.error(f"Error getting position {symbol}: {e}")
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/market-data/{symbol}")
async def get_market_data(symbol: str):
    if is_demo_mode or not data_client:
        # Return mock structure
        now = datetime.now(timezone.utc).isoformat()
        return {
            "symbol": symbol.upper(),
            "quote": {
                "bid_price": 100.0,
                "bid_size": 1,
                "ask_price": 100.2,
                "ask_size": 1,
                "timestamp": now,
            },
            "bars": [],
        }
    try:
        quote_req = StockLatestQuoteRequest(symbol_or_symbols=symbol)
        quote_resp = data_client.get_stock_latest_quote(quote_req)
        q = quote_resp[symbol]
        bars_req = StockBarsRequest(symbol_or_symbols=symbol, timeframe=TimeFrame.Minute, limit=30)
        bars_resp = data_client.get_stock_bars(bars_req)
        bars = bars_resp[symbol]
        return {
            "symbol": symbol.upper(),
            "quote": {
                "bid_price": float(q.bid_price or 0),
                "bid_size": int(q.bid_size or 0),
                "ask_price": float(q.ask_price or 0),
                "ask_size": int(q.ask_size or 0),
                "timestamp": q.timestamp.isoformat() if q.timestamp else None,
            },
            "bars": [
                {
                    "timestamp": b.timestamp.isoformat(),
                    "open": float(b.open),
                    "high": float(b.high),
                    "low": float(b.low),
                    "close": float(b.close),
                    "volume": int(b.volume),
                }
                for b in bars
            ],
        }
    except Exception as e:  # noqa: BLE001
        logger.error(f"Error getting market data for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/orders")
async def place_order(order_data: dict):
    if is_demo_mode or not trading_client:
        return {"order_id": "demo", "status": "accepted", "symbol": order_data.get("symbol"), "qty": order_data.get("qty")}
    try:
        side = OrderSide.BUY if order_data.get("side", "buy").lower() == "buy" else OrderSide.SELL
        tif = TimeInForce[order_data.get("time_in_force", "DAY").upper()]
        order_type = order_data.get("type", "market").lower()
        order_class = order_data.get("order_class")
        take_profit_limit = order_data.get("take_profit_limit_price")
        stop_loss_stop = order_data.get("stop_loss_stop_price")
        stop_loss_limit = order_data.get("stop_loss_limit_price")

        if order_data.get("qty") and order_data.get("notional"):
            raise HTTPException(status_code=400, detail="Specify either qty OR notional, not both")

        req = None
        if order_type == "market":
            req = MarketOrderRequest(
                symbol=order_data["symbol"],
                qty=order_data.get("qty"),
                notional=order_data.get("notional"),
                side=side,
                time_in_force=tif,
                order_class=OrderClass[order_class.upper()] if order_class else None,
                take_profit=TakeProfitRequest(limit_price=take_profit_limit) if take_profit_limit else None,
                stop_loss=StopLossRequest(stop_price=stop_loss_stop, limit_price=stop_loss_limit) if stop_loss_stop else None,
            )
        elif order_type == "limit":
            req = LimitOrderRequest(
                symbol=order_data["symbol"],
                qty=order_data.get("qty"),
                notional=order_data.get("notional"),
                side=side,
                time_in_force=tif,
                limit_price=order_data.get("limit_price"),
                order_class=OrderClass[order_class.upper()] if order_class else None,
                take_profit=TakeProfitRequest(limit_price=take_profit_limit) if take_profit_limit else None,
                stop_loss=StopLossRequest(stop_price=stop_loss_stop, limit_price=stop_loss_limit) if stop_loss_stop else None,
            )
        elif order_type == "stop":
            req = StopOrderRequest(
                symbol=order_data["symbol"],
                qty=order_data.get("qty"),
                side=side,
                time_in_force=tif,
                stop_price=order_data.get("stop_price"),
            )
        elif order_type == "stop_limit":
            req = StopLimitOrderRequest(
                symbol=order_data["symbol"],
                qty=order_data.get("qty"),
                side=side,
                time_in_force=tif,
                limit_price=order_data.get("limit_price"),
                stop_price=order_data.get("stop_price"),
            )
        elif order_type == "trailing_stop":
            req = TrailingStopOrderRequest(
                symbol=order_data["symbol"],
                qty=order_data.get("qty"),
                side=side,
                time_in_force=tif,
                trail_price=order_data.get("trail_price"),
                trail_percent=order_data.get("trail_percent"),
            )
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported order type {order_type}")

        order = trading_client.submit_order(order_data=req)
        return {
            "order_id": order.id,
            "symbol": order.symbol,
            "qty": float(order.qty),
            "filled_qty": float(order.filled_qty or 0),
            "side": order.side,
            "type": order.type,
            "status": order.status,
            "submitted_at": order.submitted_at.isoformat() if order.submitted_at else None,
        }
    except HTTPException:
        raise
    except Exception as e:  # noqa: BLE001
        logger.error(f"Error placing order: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/orders")
async def get_orders(status: str = "all", limit: int = 50):
    if is_demo_mode or not trading_client:
        return []
    try:
        status_enum = QueryOrderStatus[status.upper()] if status != "all" else None
        req = GetOrdersRequest(status=status_enum, limit=limit, nested=True) if status_enum else GetOrdersRequest(limit=limit, nested=True)
        orders = trading_client.get_orders(filter=req)
        return [
            {
                "order_id": o.id,
                "symbol": o.symbol,
                "qty": float(o.qty or 0),
                "filled_qty": float(o.filled_qty or 0),
                "side": o.side,
                "type": o.type,
                "status": o.status,
                "submitted_at": o.submitted_at.isoformat() if o.submitted_at else None,
                "filled_at": o.filled_at.isoformat() if o.filled_at else None,
                "filled_avg_price": float(o.filled_avg_price or 0),
            }
            for o in orders
        ]
    except Exception as e:  # noqa: BLE001
        logger.error(f"Error getting orders: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/orders/{order_id}")
async def get_order(order_id: str):
    if is_demo_mode or not trading_client:
        raise HTTPException(status_code=404, detail="Not found in demo")
    try:
        o = trading_client.get_order_by_id(order_id)
        return {
            "order_id": o.id,
            "symbol": o.symbol,
            "qty": float(o.qty or 0),
            "filled_qty": float(o.filled_qty or 0),
            "side": o.side,
            "type": o.type,
            "status": o.status,
            "submitted_at": o.submitted_at.isoformat() if o.submitted_at else None,
            "filled_at": o.filled_at.isoformat() if o.filled_at else None,
            "filled_avg_price": float(o.filled_avg_price or 0),
            "client_order_id": o.client_order_id,
        }
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=404, detail=str(e))

@app.delete("/orders/{order_id}")
async def cancel_order(order_id: str):
    if is_demo_mode or not trading_client:
        return {"order_id": order_id, "status": "canceled"}
    try:
        trading_client.cancel_order_by_id(order_id)
        return {"order_id": order_id, "status": "canceled"}
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=404, detail=str(e))

@app.delete("/orders")
async def cancel_all_orders():
    if is_demo_mode or not trading_client:
        return {"status": "canceled", "count": 0}
    try:
        trading_client.cancel_orders()
        return {"status": "canceled"}
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/assets")
async def get_assets(asset_class: str = "US_EQUITY", status: str = "ACTIVE"):
    if is_demo_mode or not trading_client:
        return []
    try:
        req = GetAssetsRequest(asset_class=AssetClass[asset_class.upper()], status=status.lower())
        assets = trading_client.get_all_assets(req)
        return [
            {
                "symbol": a.symbol,
                "name": a.name,
                "exchange": a.exchange,
                "class": a.asset_class,
                "tradable": a.tradable,
                "marginable": a.marginable,
                "shortable": a.shortable,
                "fractionable": a.fractionable,
            }
            for a in assets
        ]
    except Exception as e:  # noqa: BLE001
        logger.error(f"Error getting assets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/assets/{symbol}")
async def get_asset(symbol: str):
    if is_demo_mode or not trading_client:
        return {"symbol": symbol.upper(), "tradable": True}
    try:
        a = trading_client.get_asset(symbol)
        return {
            "symbol": a.symbol,
            "name": a.name,
            "exchange": a.exchange,
            "class": a.asset_class,
            "tradable": a.tradable,
            "marginable": a.marginable,
            "shortable": a.shortable,
            "fractionable": a.fractionable,
        }
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/candidates")
async def get_trading_candidates():
    if is_demo_mode or not trading_client:
        return []
    try:
        req = GetAssetsRequest(asset_class=AssetClass.US_EQUITY, status="active")
        assets = trading_client.get_all_assets(req)
        candidates = [
            {
                "symbol": a.symbol,
                "name": a.name,
                "exchange": a.exchange,
                "tradable": a.tradable,
                "shortable": a.shortable,
            }
            for a in assets if a.tradable and a.shortable
        ]
        return candidates[:25]
    except Exception as e:  # noqa: BLE001
        logger.error(f"Failed to get candidates: {e}")
        return []

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket for real-time updates"""
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo back for now - can be enhanced for real-time data streaming
            await websocket.send_text(f"Echo: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Background task for market data streaming
async def stream_market_data():
    """Background task to stream market data"""
    while True:
        try:
            if not is_demo_mode and trading_client:
                account = trading_client.get_account()
                payload = {
                    "timestamp": datetime.now().isoformat(),
                    "account_status": str(account.status),
                    "buying_power": float(account.buying_power),
                    "portfolio_value": float(account.portfolio_value),
                    "mode": "live_trading" if effective_env == "live" else "paper_trading",
                }
            else:
                payload = {
                    "timestamp": datetime.now().isoformat(),
                    "account_status": "ACTIVE",
                    "buying_power": 100000.0,
                    "portfolio_value": 100000.0,
                    "mode": "demo"
                }
            await manager.broadcast(payload)
            
            await asyncio.sleep(30)  # Update every 30 seconds
        except Exception as e:
            logger.error(f"Error in market data stream: {e}")
            await asyncio.sleep(60)

@app.on_event("startup")
async def startup_event():
    """Start background tasks"""
    logger.info("Startup event: Alpaca Integration Service")
    logger.info(f"Configured base URL: {base_url} | Effective Env: {effective_env}")
    
    # Start background market data streaming
    asyncio.create_task(stream_market_data())

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8200,
        log_level="info"
    )
