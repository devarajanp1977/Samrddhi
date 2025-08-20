#!/bin/bash
# SAMRDDHI Platform Startup Script
# Usage: ./scripts/start-all-services.sh

echo "🚀 Starting SAMRDDHI Trading Platform Services..."
echo "======================================================"

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "❌ Virtual environment not found. Please run setup first."
    exit 1
fi

# Activate virtual environment
source .venv/bin/activate
echo "✅ Python virtual environment activated"

# Function to start a service in background
start_service() {
    local service_name=$1
    local service_path=$2
    local port=$3
    
    echo "🔄 Starting $service_name..."
    cd "$service_path"
    nohup python main.py > "../../logs/${service_name}.log" 2>&1 &
    local pid=$!
    echo "$pid" > "../../logs/${service_name}.pid"
    echo "✅ $service_name started (PID: $pid, Port: $port)"
    cd - > /dev/null
}

# Create logs directory if it doesn't exist
mkdir -p logs

# Start backend services
echo ""
echo "🔧 Starting Backend Services..."
echo "--------------------------------"

start_service "api-gateway" "backend/services/core-trading/api-gateway" "8000"
sleep 2

start_service "portfolio-service" "backend/services/core-trading/portfolio-service" "8100"
sleep 2

start_service "market-data-service" "backend/services/core-trading/market-data-service" "8140"
sleep 2

start_service "order-management-service" "backend/services/core-trading/order-management-service" "8160"
sleep 2

start_service "risk-management-service" "backend/services/core-trading/risk-management-service" "8180"
sleep 2

start_service "signal-detection-service" "backend/services/core-trading/signal-detection-service" "8200"
sleep 3

# Check service health
echo ""
echo "🔍 Checking Service Health..."
echo "-----------------------------"

check_service() {
    local name=$1
    local url=$2
    
    if curl -s "$url" > /dev/null 2>&1; then
        echo "✅ $name is healthy"
    else
        echo "❌ $name is not responding"
    fi
}

check_service "API Gateway" "http://localhost:8000/health"
check_service "Portfolio Service" "http://localhost:8100/health"
check_service "Market Data Service" "http://localhost:8140/health"
check_service "Order Management" "http://localhost:8160/health"
check_service "Risk Management" "http://localhost:8180/health"
check_service "Signal Detection" "http://localhost:8200/health"

# Start frontend (interactive)
echo ""
echo "🎨 Starting Frontend Development Server..."
echo "-----------------------------------------"
echo "Note: Frontend will start in interactive mode"
echo "Press Ctrl+C to stop the frontend server when done"
echo ""

cd frontend
npm start

echo ""
echo "🏁 Platform startup complete!"
echo "=============================="
echo "Frontend: http://localhost:3000"
echo "API Docs: http://localhost:8000/docs"
echo "Health Check: http://localhost:8000/health"
echo ""
echo "Logs are available in ./logs/ directory"
echo "Use './scripts/stop-all-services.sh' to stop all services"
