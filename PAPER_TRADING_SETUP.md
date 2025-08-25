# 🚀 Quick Start: Alpaca Paper Trading Setup

## Current Status: ✅ Demo Mode Active

Your platform is currently running in **Demo Mode** with mock data. To enable **real Alpaca Paper Trading**, follow these steps:

## Step-by-Step Setup

### 1. 📋 Get Your Alpaca Paper Trading Credentials

1. **Create Account**: Go to [Alpaca Markets](https://app.alpaca.markets/) and create a free account
2. **Access Paper Trading**: Once logged in, navigate to the "Paper Trading" section
3. **Generate API Keys**: 
   - Click on "API Keys" tab
   - Generate new keys specifically for Paper Trading
   - **Important**: These are different from live trading keys!

### 2. 🔧 Configure the Service

**Option A: Automatic Setup (Recommended)**
```bash
cd /home/dev/Samrddhi/backend/services/core-trading/alpaca-integration
./setup_paper_trading.sh
```

**Option B: Manual Setup**
```bash
# Edit the environment file
nano /home/dev/Samrddhi/backend/services/core-trading/alpaca-integration/.env.paper

# Replace these values:
ALPACA_API_KEY=your_actual_paper_trading_api_key
ALPACA_SECRET_KEY=your_actual_paper_trading_secret_key
```

### 3. 🔄 Restart the Service

```bash
# Stop current service
pkill -f "alpaca-integration"

# Start with paper trading
cd /home/dev/Samrddhi/backend/services/core-trading/alpaca-integration
/home/dev/Samrddhi/.venv/bin/python main.py
```

### 4. ✅ Verify Paper Trading Mode

Check that the service switched to paper trading:
```bash
curl http://localhost:8200/health
# Should show "mode": "paper_trading" instead of "demo"

curl http://localhost:8200/account
# Should show your real paper trading account balance
```

## 🆚 Demo vs Paper Trading Comparison

| Feature | Demo Mode | Paper Trading Mode |
|---------|-----------|-------------------|
| Market Data | ❌ Mock/Static | ✅ Real-time |
| Account Info | ❌ Fake ($100k) | ✅ Real paper account |
| Orders | ❌ Simulated | ✅ Real paper orders |
| Trading Candidates | ❌ Mock data | ✅ Real market assets |
| Risk | ❌ None | ❌ None (paper money) |

## 🔍 Current Service Status

You can check your current mode anytime:
```bash
curl http://localhost:8200/health | jq .mode
```

## 🔐 Security Reminders

- ✅ **Paper Trading Only**: Never use live trading credentials
- ✅ **Keep Keys Safe**: Don't share or commit your API keys
- ✅ **Regular Rotation**: Change your keys periodically
- ✅ **Environment Files**: Keep `.env.paper` in `.gitignore`

## 🎯 What Happens When You Switch?

1. **Trading Candidates**: Will show real stocks from Alpaca instead of mock data
2. **Account Data**: Will display your actual paper trading account balance
3. **Market Data**: Will use real-time market feeds
4. **Orders**: Will place actual paper trades (no real money)

## 🛟 Need Help?

- **Setup Script**: Run `./setup_paper_trading.sh` for guided setup
- **Service Logs**: Check `alpaca.log` for any errors
- **Health Check**: Use `curl http://localhost:8200/health`

---

**Ready to switch to paper trading? Just run the setup script!** 🎉
