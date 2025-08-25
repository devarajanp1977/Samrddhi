#!/bin/bash

echo "🚀 Starting SAMRDDHI Trading Platform (Native Mode)..."
echo "========================================================"

# Allow passing desired trading environment (paper|live) as first arg
REQ_ENV_ARG="$1"
if [ -n "$REQ_ENV_ARG" ]; then
    export TRADING_ENV="$REQ_ENV_ARG"
fi

# Default if still unset
export TRADING_ENV="${TRADING_ENV:-paper}"

echo "Alpaca TRADING_ENV requested: $TRADING_ENV"
if [ "$TRADING_ENV" = "live" ]; then
    if [ "$ENABLE_LIVE_TRADING" != "true" ]; then
        echo "⚠️  ENABLE_LIVE_TRADING=true not set – Alpaca service will run in DEMO fallback (no orders sent)."
    else
        echo "✅ Live trading flag acknowledged (ENABLE_LIVE_TRADING=true)."
    fi
fi

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "❌ Virtual environment not found. Please run setup first."
    exit 1
fi

# Activate virtual environment
print_info "Activating Python virtual environment..."
source .venv/bin/activate

# Kill any existing Python processes on our ports
print_info "Cleaning up existing services..."
pkill -f "uvicorn.*8000" 2>/dev/null || true
pkill -f "uvicorn.*81" 2>/dev/null || true
pkill -f "uvicorn.*82" 2>/dev/null || true
pkill -f "npm.*start" 2>/dev/null || true

sleep 2

print_info "Starting backend services..."

# Start API Gateway (Port 8000)
cd backend/services/core-trading/api-gateway
python main.py &
API_GATEWAY_PID=$!
print_status "API Gateway started (PID: $API_GATEWAY_PID)"

# Start Portfolio Service (Port 8100)
cd ../portfolio-service
python main.py &
PORTFOLIO_PID=$!
print_status "Portfolio Service started (PID: $PORTFOLIO_PID)"

# Start Alpaca Integration (Port 8200) with environment awareness
cd ../alpaca-integration
echo "Starting Alpaca Integration (TRADING_ENV=$TRADING_ENV) ..."
python main.py &
ALPACA_PID=$!
print_status "Alpaca Integration started (PID: $ALPACA_PID, env: $TRADING_ENV)"

# Start Market Data Service (Port 8141)
cd ../market-data-service
python main.py &
MARKET_DATA_PID=$!
print_status "Market Data Service started (PID: $MARKET_DATA_PID)"

# Start Order Management Service (Port 8160)
cd ../order-management-service
python main.py &
ORDER_MGMT_PID=$!
print_status "Order Management started (PID: $ORDER_MGMT_PID)"

# Start Risk Management Service (Port 8180)
cd ../risk-management-service
python main.py &
RISK_MGMT_PID=$!
print_status "Risk Management started (PID: $RISK_MGMT_PID)"

# Return to project root
cd ../../../../

print_info "Starting frontend..."
# Start React Frontend (Port 3000)
cd frontend
npm start &
FRONTEND_PID=$!
print_status "Frontend started (PID: $FRONTEND_PID)"

cd ..

print_info "Waiting for services to initialize..."
sleep 5

# Test API Gateway health
print_info "Testing API Gateway..."
if curl -s http://localhost:8000/health > /dev/null; then
    print_status "API Gateway is responding"
else
    echo "❌ API Gateway not responding"
fi

print_status "All services started successfully!"
echo ""
echo "📊 Access Points:"
echo "   • Trading Dashboard: http://localhost:3000"
echo "   • API Gateway: http://localhost:8000/docs"
echo "   • Alpaca Test Page: http://localhost:3000/alpaca-test"
echo ""
echo "🔧 Service Health: http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop all services"

# Store PIDs for cleanup
echo "$API_GATEWAY_PID $PORTFOLIO_PID $ALPACA_PID $MARKET_DATA_PID $ORDER_MGMT_PID $RISK_MGMT_PID $FRONTEND_PID" > .service_pids

# Wait for Ctrl+C
trap 'echo ""; echo "🛑 Stopping all services..."; kill $(cat .service_pids 2>/dev/null) 2>/dev/null; rm -f .service_pids; exit 0' INT

# Keep script running
wait
