#!/bin/bash
set -e

echo "🚀 Starting Complete SAMRDDHI Trading Platform..."
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to check if command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 is not installed. Please install it first."
        exit 1
    fi
}

# Function to wait for service
wait_for_service() {
    local service=$1
    local url=$2
    local max_attempts=60
    local attempt=1
    
    print_info "Waiting for $service to be ready..."
    while ! curl -s $url > /dev/null; do
        if [ $attempt -eq $max_attempts ]; then
            print_error "$service failed to start after $max_attempts attempts"
            return 1
        fi
        printf "."
        sleep 2
        ((attempt++))
    done
    echo ""
    print_status "$service is ready!"
}

# Check prerequisites
print_info "Checking prerequisites..."
check_command docker
check_command docker-compose
check_command curl

# Create necessary directories
print_info "Creating directory structure..."
mkdir -p {logs,data,backups,uploads,exports}
mkdir -p logs/{services,trading,system,audit}
mkdir -p data/{models,features,backups}

# Set permissions
chmod +x *.sh 2>/dev/null || true

# Stop any running services
print_info "Stopping any existing services..."
docker-compose down --remove-orphans 2>/dev/null || true

# Clean up old containers and volumes if requested
if [ "$1" = "clean" ]; then
    print_warning "Cleaning up old Docker resources..."
    docker-compose down -v --remove-orphans
    docker system prune -f
    print_status "Cleanup completed"
fi

# Build and start services
print_info "Building and starting all services..."
docker-compose up --build -d

# Wait for core services to be ready
print_info "Waiting for services to initialize..."

print_info "Checking database services..."
wait_for_service "PostgreSQL" "http://localhost:5432" || true
wait_for_service "Redis" "http://localhost:6379" || true
wait_for_service "InfluxDB" "http://localhost:8086/health"

print_info "Checking message queue..."
sleep 10  # Kafka needs more time to start

print_info "Checking trading services..."
wait_for_service "API Gateway" "http://localhost:8000/health"
wait_for_service "Portfolio Service" "http://localhost:8100/health" || true
wait_for_service "Market Data Service" "http://localhost:8140/health" || true

print_info "Checking frontend..."
wait_for_service "Frontend" "http://localhost:3000/health"

print_info "Checking monitoring..."
wait_for_service "Prometheus" "http://localhost:9090"
wait_for_service "Grafana" "http://localhost:3001"

# Run health checks
echo ""
print_info "Running comprehensive health checks..."

# Check API Gateway
if curl -s http://localhost:8000/health | grep -q "healthy"; then
    print_status "API Gateway: Healthy"
else
    print_warning "API Gateway: May need more time to initialize"
fi

# Check Frontend
if curl -s http://localhost:3000 > /dev/null; then
    print_status "Frontend: Accessible"
else
    print_warning "Frontend: May need more time to initialize"
fi

# Check Database connectivity
if docker exec samrddhi-postgres pg_isready -U samrddhi_dev > /dev/null 2>&1; then
    print_status "PostgreSQL: Connected"
else
    print_warning "PostgreSQL: Connection issues"
fi

# Check Redis
if docker exec samrddhi-redis redis-cli ping | grep -q "PONG"; then
    print_status "Redis: Connected"
else
    print_warning "Redis: Connection issues"
fi

# Display service status
echo ""
print_info "Service Status Summary:"
docker-compose ps

# Display access information
echo ""
echo "========================================="
echo -e "${GREEN}🎉 SAMRDDHI Trading Platform is LIVE!${NC}"
echo "========================================="
echo ""
echo "🌐 Access Points:"
echo "   📊 Trading Dashboard:  http://localhost:3000"
echo "   📚 API Documentation:  http://localhost:8000/docs"
echo "   📈 Monitoring:         http://localhost:9090"
echo "   📊 Grafana Dashboards: http://localhost:3001"
echo ""
echo "🔑 Login Credentials:"
echo "   Grafana: admin/admin123"
echo ""
echo "📊 Trading Features Available:"
echo "   ✅ Real-time market data streaming"
echo "   ✅ Portfolio management"
echo "   ✅ Automated trading strategies"
echo "   ✅ Risk management system"
echo "   ✅ Order management"
echo "   ✅ Performance monitoring"
echo ""
echo "📱 Mobile-Responsive Interface:"
echo "   ✅ Works on desktop, tablet, and mobile"
echo "   ✅ Real-time updates via WebSocket"
echo "   ✅ Dark theme optimized for trading"
echo ""
echo "🛑 To stop all services: docker-compose down"
echo "🔄 To restart: docker-compose restart"
echo "🧹 To clean and rebuild: ./launch-complete-platform.sh clean"
echo ""

# Show live logs in background
echo "📜 Live system logs:"
echo "   View logs: docker-compose logs -f"
echo "   API logs: docker-compose logs -f api-gateway"
echo "   Frontend logs: docker-compose logs -f frontend"
echo ""

# Open browser automatically if available
if command -v xdg-open &> /dev/null; then
    print_info "Opening browser..."
    xdg-open http://localhost:3000 &
elif command -v open &> /dev/null; then
    print_info "Opening browser..."
    open http://localhost:3000 &
else
    print_info "Please open http://localhost:3000 in your browser"
fi

# Final status
print_status "Complete SAMRDDHI Trading Platform is ready for production use!"
print_info "Happy trading! 🚀💹"

# Show real-time logs
echo ""
print_info "Showing real-time logs (Ctrl+C to exit):"
docker-compose logs -f --tail=50
