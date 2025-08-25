# 🎯 Alpaca Paper Trading Integration - Official Setup

## ✅ Implementation Status
**COMPLETED** - Your Samrddhi trading platform now supports official Alpaca Paper Trading integration based on [Alpaca's official documentation](https://docs.alpaca.markets/docs/paper-trading).

## 🌍 Global Availability
✅ **Anyone worldwide can create an Alpaca Paper Only Account with just an email address**
✅ **No real money or US residency required**
✅ **Free real-time IEX market data included**

## 📋 Current Setup

### Demo Mode (Currently Active)
- **Status**: ✅ Running on http://localhost:8200
- **Account Balance**: $100,000 (matching Alpaca's default)
- **Data Source**: Mock data for development
- **Health Check**: `curl http://localhost:8200/health` → `"mode": "demo"`

### Paper Trading Mode (Ready to Activate)
- **Setup**: Run `./setup_paper_trading.sh`
- **Requirements**: Alpaca Paper Trading API keys
- **Features**: Real market data, simulated trading, $100k starting balance

## 🚀 Activate Paper Trading

### Step 1: Get Your Credentials
1. Visit **https://app.alpaca.markets/**
2. **Sign Up** with your email (no credit card needed)
3. Select **"Paper Trading Only"** if prompted
4. Navigate to **"Paper Trading"** → **"API Keys"**
5. Generate new keys ⚠️ **Different from live trading keys!**

### Step 2: Auto Setup (Recommended)
```bash
cd /home/dev/Samrddhi/backend/services/core-trading/alpaca-integration
./setup_paper_trading.sh
```

### Step 3: Manual Setup (Alternative)
```bash
# Edit the configuration file
nano .env.paper

# Replace these values:
ALPACA_API_KEY=your_actual_paper_key
ALPACA_SECRET_KEY=your_actual_paper_secret
```

### Step 4: Restart Service
```bash
# Stop current service
pkill -f alpaca-integration

# Start with paper trading
python main.py
```

### Step 5: Verify Paper Trading
```bash
# Check mode changed from "demo" to "paper_trading"
curl http://localhost:8200/health | jq .mode

# View your real paper trading account
curl http://localhost:8200/account | jq .
```

## 📊 What Changes With Paper Trading

| Feature | Demo Mode | Paper Trading Mode |
|---------|-----------|-------------------|
| **Account Data** | Mock $100k | Real paper account |
| **Market Data** | Static/Mock | Real-time IEX data |
| **Trading Candidates** | Mock stocks | Real tradable assets |
| **Orders** | Simulated | Real paper orders |
| **Account Balance** | Fixed $100k | Dynamic based on trades |
| **Risk** | None | None (still virtual money) |

## 🔧 Technical Implementation

### Environment Variables (Official Alpaca Standards)
```bash
ALPACA_API_KEY=your_paper_key
ALPACA_SECRET_KEY=your_paper_secret
APCA_API_BASE_URL=https://paper-api.alpaca.markets  # Official Alpaca env var
ALPACA_BASE_URL=https://paper-api.alpaca.markets    # Backup/compatibility
ALPACA_DATA_URL=https://data.alpaca.markets         # Market data endpoint
```

### Service Endpoints
- **Health**: `GET /health` - Service status and mode
- **Account**: `GET /account` - Account information and balances  
- **Candidates**: `GET /candidates` - Trading candidates (real assets in paper mode)
- **Market Data**: `GET /market-data/{symbol}` - Real-time quotes
- **Positions**: `GET /positions` - Current holdings

### Frontend Integration
- **AlpacaTestPage**: Tests service connectivity and shows account status
- **CandidatesWatchlist**: Displays trading candidates in table format
- **Automatic Fallback**: Uses mock data when service returns empty responses

## 📈 Alpaca Paper Trading Features

### ✅ What You Get
- **$100,000 starting balance** (Alpaca default)
- **Real-time IEX market data** (free for Paper Only accounts)
- **Full trading simulation** including:
  - Market orders, limit orders, stop orders
  - Day trading and swing trading
  - Short selling simulation
  - Margin trading simulation
  - Pattern Day Trader rule enforcement

### ⚠️ Paper Trading Limitations (Per Alpaca Docs)
- **No market impact** simulation
- **No order queue position** simulation  
- **No price slippage** from latency
- **No dividends** simulation
- **No borrow fees** (coming soon)
- **No order fill emails**

### 🔄 Account Management
- **Reset Balance**: Use Alpaca dashboard to create/delete paper accounts
- **Multiple Accounts**: Can create multiple paper accounts
- **API Key Management**: Generate new keys for each account

## 🧪 Testing Your Setup

### Health Check
```bash
curl -s http://localhost:8200/health | jq .
# Expected: {"status": "healthy", "mode": "paper_trading", ...}
```

### Account Information
```bash
curl -s http://localhost:8200/account | jq .
# Expected: Real account data with your paper trading balance
```

### Trading Candidates
```bash
curl -s http://localhost:8200/candidates | jq .
# Expected: Array of real tradable assets from Alpaca
```

## 🔐 Security & Best Practices

### ✅ Security Features
- **Paper Trading Only**: Hardcoded to use paper endpoints
- **Environment Variables**: Credentials stored securely
- **No Live Trading**: Cannot accidentally use live trading
- **Credential Validation**: Connection tested during setup

### 📋 Best Practices
1. **Keep Keys Secure**: Never share or commit API keys
2. **Regular Rotation**: Change keys periodically
3. **Separate Environments**: Different keys for different environments
4. **Monitor Usage**: Check Alpaca dashboard for API usage

## 📚 Additional Resources

- **Alpaca Documentation**: https://docs.alpaca.markets/docs/paper-trading
- **API Reference**: https://docs.alpaca.markets/reference
- **Alpaca Dashboard**: https://app.alpaca.markets/paper/dashboard
- **Community Forum**: https://forum.alpaca.markets/

## 🎉 Ready to Trade!

Your platform is now fully prepared for Alpaca Paper Trading. You can:

1. **Develop algorithms** using real market data
2. **Test strategies** with simulated trading
3. **Monitor performance** through the Alpaca dashboard
4. **Scale up** to live trading when ready (separate integration)

**Happy Paper Trading! 📈🚀**

---
*Implementation based on Alpaca's official documentation and best practices*
