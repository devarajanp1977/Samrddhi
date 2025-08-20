#!/bin/bash
# SAMRDDHI Platform Shutdown Script  
# Usage: ./scripts/stop-all-services.sh

echo "🛑 Stopping SAMRDDHI Trading Platform Services..."
echo "================================================="

# Function to stop a service by PID file
stop_service() {
    local service_name=$1
    local pid_file="logs/${service_name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo "🔄 Stopping $service_name (PID: $pid)..."
            kill "$pid"
            sleep 2
            
            # Force kill if still running
            if ps -p "$pid" > /dev/null 2>&1; then
                echo "⚡ Force stopping $service_name..."
                kill -9 "$pid"
            fi
            
            echo "✅ $service_name stopped"
        else
            echo "⚠️  $service_name was not running"
        fi
        
        rm -f "$pid_file"
    else
        echo "❓ No PID file found for $service_name"
    fi
}

# Stop all services by name pattern (fallback method)
stop_by_pattern() {
    echo ""
    echo "🔍 Stopping any remaining Python services..."
    echo "--------------------------------------------"
    
    # Kill any remaining FastAPI/uvicorn processes
    pkill -f "uvicorn.*main:app" 2>/dev/null && echo "✅ Stopped uvicorn processes"
    pkill -f "python.*main.py" 2>/dev/null && echo "✅ Stopped Python services"
    
    # Kill specific processes by port if they exist
    local ports=("8000" "8100" "8140" "8160" "8180" "8200")
    for port in "${ports[@]}"; do
        local pid=$(lsof -t -i:$port 2>/dev/null)
        if [ -n "$pid" ]; then
            echo "🔄 Stopping process on port $port (PID: $pid)..."
            kill "$pid" 2>/dev/null
        fi
    done
}

# Stop services using PID files
echo "🔧 Stopping Backend Services..."
echo "-------------------------------"

stop_service "signal-detection-service"
stop_service "risk-management-service"
stop_service "order-management-service"
stop_service "market-data-service"
stop_service "portfolio-service"
stop_service "api-gateway"

# Fallback method to ensure all processes are stopped
stop_by_pattern

# Stop frontend if running
echo ""
echo "🎨 Stopping Frontend..."
echo "----------------------"
pkill -f "npm.*start" 2>/dev/null && echo "✅ Frontend stopped" || echo "⚠️  Frontend was not running"

# Clean up
echo ""
echo "🧹 Cleaning Up..."
echo "----------------"

# Remove any remaining PID files
rm -f logs/*.pid 2>/dev/null && echo "✅ Cleaned up PID files"

# Show final status
echo ""
echo "🔍 Final Status Check..."
echo "-----------------------"

if pgrep -f "python.*main.py" > /dev/null; then
    echo "⚠️  Some Python services may still be running:"
    pgrep -f "python.*main.py" | while read pid; do
        ps -p "$pid" -o pid,command --no-headers
    done
    echo ""
    echo "💡 You may need to manually kill these processes:"
    echo "   pkill -f 'python.*main.py'"
else
    echo "✅ All Python services stopped successfully"
fi

if pgrep -f "npm.*start" > /dev/null; then
    echo "⚠️  Frontend may still be running"
    echo "💡 Stop it manually with: pkill -f 'npm.*start'"
else
    echo "✅ Frontend stopped successfully"
fi

echo ""
echo "🏁 Platform shutdown complete!"
echo "=============================="
echo ""
echo "💡 Quick commands for next startup:"
echo "   ./scripts/start-all-services.sh    # Start all services"
echo "   curl http://localhost:8000/health  # Check health when running"
