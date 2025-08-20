# SAMRDDHI Trading Platform - Service Health Check
# Usage: ./scripts/health-check.sh

echo "🏥 SAMRDDHI Platform Health Check"
echo "================================="
echo "Timestamp: $(date)"
echo ""

# Function to check service health
check_service_health() {
    local name=$1
    local url=$2
    local expected_port=$3
    
    printf "%-25s" "$name:"
    
    # Check if port is listening
    if ! nc -z localhost "$expected_port" 2>/dev/null; then
        echo "❌ Port $expected_port not listening"
        return 1
    fi
    
    # Check HTTP health endpoint
    local response=$(curl -s -w "%{http_code}" "$url" 2>/dev/null)
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        echo "✅ Healthy (HTTP $http_code)"
        return 0
    else
        echo "⚠️  HTTP $http_code"
        return 1
    fi
}

# Check all services
echo "🔧 Backend Services:"
echo "-------------------"
check_service_health "API Gateway" "http://localhost:8000/health" "8000"
check_service_health "Portfolio Service" "http://localhost:8100/health" "8100"
check_service_health "Market Data Service" "http://localhost:8140/health" "8140"
check_service_health "Order Management" "http://localhost:8160/health" "8160"
check_service_health "Risk Management" "http://localhost:8180/health" "8180"
check_service_health "Signal Detection" "http://localhost:8200/health" "8200"

echo ""
echo "🎨 Frontend Service:"
echo "-------------------"
check_service_health "React Frontend" "http://localhost:3000" "3000"

echo ""
echo "📊 System Resources:"
echo "-------------------"

# Memory usage
echo "Memory Usage:"
ps aux --sort=-%mem | grep -E "(python.*main\.py|npm.*start)" | head -10 | while read line; do
    echo "  $(echo "$line" | awk '{printf "%-20s %s%%\n", $11, $4}')"
done

echo ""
echo "💾 Disk Usage:"
df -h /home/dev/Samrddhi | tail -1 | awk '{printf "  Project Directory: %s used of %s (%s full)\n", $3, $2, $5}'

echo ""
echo "🔌 Network Ports:"
echo "----------------"
echo "Active ports for this application:"
netstat -tlnp 2>/dev/null | grep -E ":(3000|8000|81[0-9][0-9])" | while read line; do
    port=$(echo "$line" | awk '{print $4}' | cut -d: -f2)
    echo "  Port $port: LISTENING"
done

echo ""
echo "📈 Performance Check:"
echo "--------------------"

# API Gateway response time
if nc -z localhost 8000 2>/dev/null; then
    response_time=$(curl -s -w "%{time_total}" -o /dev/null http://localhost:8000/health)
    echo "  API Gateway Response Time: ${response_time}s"
else
    echo "  API Gateway: Not responding"
fi

# Check service integration
echo ""
echo "🔗 Service Integration:"
echo "----------------------"
if nc -z localhost 8000 2>/dev/null; then
    echo "  Testing API Gateway → Service routing..."
    
    # Test a few endpoints through the gateway
    curl -s "http://localhost:8000/health" | grep -q "status" && echo "    ✅ Health endpoint working"
    
else
    echo "    ❌ API Gateway not available for integration test"
fi

echo ""
echo "==================================="
echo "Health check complete - $(date)"

# Summary
healthy_count=$(netstat -tlnp 2>/dev/null | grep -E ":(3000|8000|81[0-9][0-9])" | wc -l)
expected_count=7  # 6 backend + 1 frontend

if [ "$healthy_count" -eq "$expected_count" ]; then
    echo "🟢 Overall Status: HEALTHY ($healthy_count/$expected_count services running)"
elif [ "$healthy_count" -gt 4 ]; then
    echo "🟡 Overall Status: DEGRADED ($healthy_count/$expected_count services running)"
else
    echo "🔴 Overall Status: UNHEALTHY ($healthy_count/$expected_count services running)"
fi
