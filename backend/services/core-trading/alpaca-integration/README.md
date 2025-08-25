# Alpaca Trading Integration (Demo / Paper / Live)

Migrated to official `alpaca-py` SDK implementing core Trading API functionality.

## Modes

1. Demo (default fallback)
   - Triggered when keys missing OR live requested without explicit enable flag.
   - Returns mock structures, never calls Alpaca.
2. Paper
   - Requires paper API keys.
   - Real-time simulated fills, real market data (subject to plan limits).
3. Live (opt‑in, safety gated)
   - Requires: `TRADING_ENV=live`, `ENABLE_LIVE_TRADING=true`, live keys.
   - Otherwise request downgrades to Demo for safety.

Environment file precedence: `TRADING_ENV` -> `ENVIRONMENT` -> `paper`. Optional `.env.paper`, `.env.live` (never commit with secrets).

## Setup Instructions

### Step 1: Get Alpaca Paper Trading Credentials

1. Visit [Alpaca Markets](https://app.alpaca.markets/)
2. Create a free account
3. Navigate to **Paper Trading** section
4. Go to **API Keys** tab
5. Generate new API keys
6. Keep these credentials secure!

### Step 2: Configure the Service

#### Option A: Automatic Setup (Recommended)
```bash
cd /home/dev/Samrddhi/backend/services/core-trading/alpaca-integration
./setup_paper_trading.sh
```

#### Option B: Manual Setup
1. Copy the environment template:
   ```bash
   cp .env.paper .env.paper.local
   ```

2. Edit `.env.paper.local` and add your credentials:
   ```env
   ALPACA_API_KEY=your_actual_api_key_here
   ALPACA_SECRET_KEY=your_actual_secret_key_here
   ALPACA_BASE_URL=https://paper-api.alpaca.markets
   ALPACA_DATA_URL=https://data.alpaca.markets
   ENVIRONMENT=paper
   LOG_LEVEL=INFO
   ```

3. Rename the file:
   ```bash
   mv .env.paper.local .env.paper
   ```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Start the Service
```bash
python main.py
```

The service will start on `http://localhost:8200`

## API Endpoints

### Health
- `GET /health` – service + environment status.

### Account
- `GET /account` – equity, buying power, flags (PDT, trading_blocked, etc.).

### Assets
- `GET /assets?asset_class=US_EQUITY&status=ACTIVE`
- `GET /assets/{symbol}` – tradability check.

### Positions
- `GET /positions` – all open positions.
- `GET /positions/{symbol}` – single position.

### Orders
- `POST /orders` – submit (supports: market, limit, stop, stop_limit, trailing_stop; order classes BRACKET/OTO/OCO via `order_class`).
   Optional fields: `qty` OR `notional`, `limit_price`, `stop_price`, `trail_price`, `trail_percent`, `take_profit_limit_price`, `stop_loss_stop_price`, `stop_loss_limit_price`.
- `GET /orders` – list (query params: status, limit).
- `GET /orders/{order_id}` – single order detail.
- `DELETE /orders/{order_id}` – cancel one.
- `DELETE /orders` – cancel all.

### Market Data (basic)
- `GET /market-data/{symbol}` – latest quote + recent minute bars (30). Demo returns mock.

### Candidates
- `GET /candidates` – simple screen of tradable + shortable assets (limited subset) else empty in demo.

## Security & Safety Notes

⚠️ **Important Security Guidelines:**

1. Never commit `.env.paper` or `.env.live` (with secrets) – keep only `*.example`.
2. Live mode is disabled unless `ENABLE_LIVE_TRADING=true`.
3. Provide only one of `qty` OR `notional` per order.
4. Use unique `client_order_id` (add to payload) for idempotent strategies (supported by Alpaca, not yet exposed server-side here—extendable).
5. Capture `X-Request-ID` for support (add proxy logic if needed at gateway).

## Testing the Integration

### 1. Check Service Status
```bash
curl http://localhost:8200/health
```

### 2. Verify Account Connection
```bash
curl http://localhost:8200/account
```

### 3. Test Market Data
```bash
curl http://localhost:8200/market-data/AAPL
```

## Frontend Integration

Existing dashboard endpoints can consume these routes through the API gateway. Add UI gating for `mode` (demo/paper_trading/live_trading) from `/health` or `/account`.

## Troubleshooting

### Service Won't Start
1. Check your `.env.paper` file exists and has correct credentials
2. Verify internet connection
3. Check if port 8200 is available

### "Demo Mode" Instead of Paper/Paper requested
1. Verify keys present & correct.
2. Confirm `TRADING_ENV` and (for live) `ENABLE_LIVE_TRADING=true`.
3. Inspect logs for authentication errors.

### No Trading Candidates
- In Demo Mode: This is normal, frontend shows mock data
- In Paper Trading Mode: Check your Alpaca account status and permissions

## Development

### Adding New Endpoints
1. Add endpoint function to `main.py`
2. Handle both demo and paper trading modes
3. Add proper error handling
4. Update this README

### Testing Changes
```bash
python main.py  # auto selects environment
```

## Support

For issues:
1. Check the service logs
2. Verify your Alpaca account status
3. Ensure API keys have proper permissions
4. Review Alpaca API documentation

---

Live trading only enabled intentionally; defaults remain safe.
