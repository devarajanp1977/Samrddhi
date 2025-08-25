#!/bin/bash

# Alpaca Paper Trading Setup Script
# Based on official Alpaca documentation: https://docs.alpaca.markets/docs/paper-trading

echo "🚀 Setting up Alpaca Paper Trading Integration"
echo "=============================================="
echo "📖 Based on official Alpaca documentation"
echo

# Check if .env.paper exists
if [ -f ".env.paper" ]; then
    echo "📁 Found existing .env.paper file"
    echo
    echo "Current configuration:"
    grep -E "^ALPACA_API_KEY|^ALPACA_SECRET_KEY|^ENVIRONMENT" .env.paper | sed 's/=.*/=***hidden***/'
    echo
    read -p "Do you want to update the configuration? (y/N): " update_config
    if [[ ! $update_config =~ ^[Yy]$ ]]; then
        echo "Using existing configuration."
        exit 0
    fi
fi

echo "📝 How to get your Alpaca Paper Trading credentials:"
echo "   🌍 GLOBAL ACCESS: Anyone worldwide can create a Paper Only Account!"
echo "   1. Go to https://app.alpaca.markets/"
echo "   2. Click 'Sign Up' and create a free account with your email"
echo "   3. Select 'Paper Trading Only' if prompted (no real money needed)"
echo "   4. Once logged in, navigate to 'Paper Trading' section"
echo "   5. Go to 'API Keys' tab and generate new keys"
echo "   6. ⚠️  IMPORTANT: These are DIFFERENT from live trading keys!"
echo
echo "💡 Your paper account starts with $100,000 virtual money"
echo "📊 You get real-time IEX market data for free"
echo

echo "🔑 Enter your Alpaca Paper Trading credentials:"
echo

read -p "Paper Trading API Key: " api_key
echo
read -s -p "Paper Trading Secret Key: " secret_key
echo
echo

# Validate inputs
if [ -z "$api_key" ] || [ -z "$secret_key" ]; then
    echo "❌ Error: Both API Key and Secret Key are required"
    exit 1
fi

# Create .env.paper file with official Alpaca environment variables
cat > .env.paper << EOF
# Alpaca Paper Trading Configuration
# Official Documentation: https://docs.alpaca.markets/docs/paper-trading
# Generated on $(date)

# Your Alpaca Paper Trading API Credentials
ALPACA_API_KEY=$api_key
ALPACA_SECRET_KEY=$secret_key

# Official Alpaca Paper Trading Endpoints (DO NOT CHANGE)
APCA_API_BASE_URL=https://paper-api.alpaca.markets
ALPACA_BASE_URL=https://paper-api.alpaca.markets
ALPACA_DATA_URL=https://data.alpaca.markets

# Environment Configuration
ENVIRONMENT=paper
LOG_LEVEL=INFO
EOF

echo "✅ Configuration saved to .env.paper"
echo
echo "🧪 Testing connection with Alpaca Paper Trading API..."

# Test the configuration by connecting to Alpaca
python -c "
import os
from dotenv import load_dotenv
import alpaca_trade_api as tradeapi

load_dotenv('.env.paper')
api_key = os.getenv('ALPACA_API_KEY')
secret_key = os.getenv('ALPACA_SECRET_KEY')
base_url = os.getenv('APCA_API_BASE_URL', 'https://paper-api.alpaca.markets')

print(f'🔗 Connecting to: {base_url}')
try:
    api = tradeapi.REST(api_key, secret_key, base_url, api_version='v2')
    account = api.get_account()
    print(f'✅ Paper Trading connection successful!')
    print(f'🏦 Account ID: {account.id}')
    print(f'💰 Virtual Buying Power: \${float(account.buying_power):,.2f}')
    print(f'📈 Virtual Portfolio Value: \${float(account.portfolio_value):,.2f}')
    print(f'💵 Virtual Cash: \${float(account.cash):,.2f}')
    print(f'📊 Account Status: {account.status}')
    print(f'🎯 Paper Trading: {\"paper-api\" in base_url}')
except Exception as e:
    print(f'❌ Connection failed: {e}')
    print('🔍 Please check:')
    print('   • Your credentials are correct')
    print('   • You are using PAPER TRADING keys (not live trading)')
    print('   • Your internet connection is working')
    print('   • The keys have proper permissions')
    exit(1)
"

echo
echo "🎯 Next steps:"
echo "   1. Restart the Alpaca Integration Service:"
echo "      pkill -f alpaca-integration"
echo "      python main.py"
echo "   2. The service will run on http://localhost:8200"
echo "   3. Your trading platform will now use real paper trading!"
echo "   4. Check status: curl http://localhost:8200/health"
echo
echo "📋 What you get with Paper Trading:"
echo "   ✅ Real-time IEX market data"
echo "   ✅ $100,000 virtual starting balance"
echo "   ✅ All trading features simulated"
echo "   ✅ Pattern Day Trader rules enforced"
echo "   ✅ No real money at risk"
echo
echo "⚠️  Important reminders:"
echo "   🔒 Keep your API keys secure and never share them"
echo "   📝 This is PAPER TRADING - no real money involved"
echo "   � You can reset your paper account anytime from the Alpaca dashboard"
echo "   📚 Read more: https://docs.alpaca.markets/docs/paper-trading"
