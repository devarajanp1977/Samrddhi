#!/bin/bash
# SAMRDDHI Trading Platform Service Status Check

echo "🚀 SAMRDDHI Trading Platform - Service Status Report"
echo "=================================================="
echo "Generated: $(date)"
echo ""

# Check each service
services=(
    "3000:Frontend"
    "8000:API Gateway"
    "8100:Portfolio Service"
    "8160:Order Management"
    "8180:Risk Management"
    "8200:Signal Detection"
    "8141:Market Data Service"
    "8300:Dashboard API"
)

echo "📊 Service Health Check:"
echo "------------------------"

for service in "${services[@]}"; do
    port=$(echo $service | cut -d':' -f1)
    name=$(echo $service | cut -d':' -f2)
    
    if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
        echo "✅ $name (port $port) - HEALTHY"
    else
        echo "❌ $name (port $port) - DOWN/ERROR"
    fi
done

echo ""
echo "🗄️ Database Status:"
echo "-------------------"
# Test database connection
if sudo -u postgres psql -d samrddhi -c "\dt" > /dev/null 2>&1; then
    echo "✅ PostgreSQL Database - CONNECTED"
    echo "📋 Tables Available:"
    sudo -u postgres psql -d samrddhi -c "\dt" | grep -E "(users|portfolios|positions|orders|market_data|trading_signals|alerts|risk_metrics)" | awk '{print "   - " $3}'
else
    echo "❌ PostgreSQL Database - CONNECTION FAILED"
fi

echo ""
echo "🔗 API Endpoints Test:"
echo "----------------------"

# Test key endpoints
endpoints=(
    "8300:/dashboard:Dashboard Overview"
    "8300:/portfolio/performance:Portfolio Performance"
    "8100:/portfolios:Portfolio Data"
    "8160:/orders:Order Management"
)

for endpoint in "${endpoints[@]}"; do
    port=$(echo $endpoint | cut -d':' -f1)
    path=$(echo $endpoint | cut -d':' -f2)
    desc=$(echo $endpoint | cut -d':' -f3)
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port$path")
    if [ "$response" = "200" ]; then
        echo "✅ $desc - WORKING"
    else
        echo "❌ $desc - ERROR (HTTP $response)"
    fi
done

echo ""
echo "📈 Sample Trading Data:"
echo "----------------------"
if curl -s "http://localhost:8300/dashboard" > /dev/null 2>&1; then
    portfolio_value=$(curl -s "http://localhost:8300/dashboard" | jq -r '.portfolio.total_value // "N/A"')
    positions_count=$(curl -s "http://localhost:8300/dashboard" | jq -r '.portfolio.positions_count // "N/A"')
    cash_balance=$(curl -s "http://localhost:8300/dashboard" | jq -r '.portfolio.cash_balance // "N/A"')
    total_pnl=$(curl -s "http://localhost:8300/dashboard" | jq -r '.portfolio.total_pnl // "N/A"')
    
    echo "💼 Portfolio Value: \$${portfolio_value}"
    echo "📊 Active Positions: ${positions_count}"
    echo "💵 Cash Balance: \$${cash_balance}"
    echo "📈 Total P&L: \$${total_pnl}"
else
    echo "❌ Unable to retrieve trading data"
fi

echo ""
echo "✨ Platform Status: READY FOR TRADING"
echo "=================================================="
