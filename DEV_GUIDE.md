# SAMRDDHI Trading Platform - Development Guide
*Last Updated: August 19, 2025*

## 🏗️ **Development Environment Setup**

### Prerequisites Met ✅
- Python 3.12+ with virtual environment at `/home/dev/Samrddhi/.venv/`
- Node.js 18+ for React frontend
- VS Code with Python and TypeScript extensions
- All required packages installed via pip and npm

### Project Structure Overview
```
Samrddhi/
├── 📱 frontend/               # React + TypeScript SPA
├── 🔧 backend/services/       # Python FastAPI microservices  
├── 🐳 infrastructure/         # Docker, monitoring configs
├── 📋 *.md                   # Documentation files
└── 🔧 Configuration files    # Package.json, requirements.txt, etc.
```

## 🚀 **Service Architecture**

### Microservices Topology
```
Frontend (3000) ←→ API Gateway (8000) ←→ {
    Portfolio Service (8100)
    Market Data Service (8140) 
    Order Management (8160)
    Risk Management (8180)
    Signal Detection (8200)
}
```

### Service Communication Flow
1. **Frontend** → API Gateway → Individual Services
2. **WebSocket streams** for real-time data updates
3. **REST APIs** for standard CRUD operations
4. **Health checks** for service monitoring

## 🛠️ **Development Workflows**

### Starting Development Session
```bash
# Navigate to project root
cd /home/dev/Samrddhi

# Activate Python virtual environment  
source .venv/bin/activate

# Start all backend services (use separate terminals)
./scripts/start-all-services.sh  # (create this script)

# Start frontend development server
cd frontend && npm start
```

### Making Code Changes

#### Backend Service Changes
1. **Edit Python files** in `/backend/services/core-trading/[service-name]/`
2. **Services auto-reload** thanks to `uvicorn --reload` 
3. **Test endpoints** via http://localhost:[port]/docs
4. **Check logs** in respective terminal windows

#### Frontend Changes  
1. **Edit TypeScript/React files** in `/frontend/src/`
2. **Hot reload** updates browser automatically
3. **Check TypeScript errors** in VS Code or terminal
4. **Test UI changes** at http://localhost:3000

### Debugging Services
```bash
# Check which services are running
ps aux | grep "python.*main.py" | grep -v grep

# Test individual service health
curl http://localhost:8000/health  # API Gateway
curl http://localhost:8100/health  # Portfolio  
curl http://localhost:8140/health  # Market Data
# ... etc for other services

# Kill problematic service
pkill -f "[service-name]"

# Restart service
cd backend/services/core-trading/[service-name] && python main.py
```

## 📁 **File Organization**

### Backend Services Structure
```
backend/services/core-trading/[service-name]/
├── main.py              # FastAPI application entry point
├── requirements.txt     # Python dependencies  
├── Dockerfile          # Container configuration
└── [additional files]   # Service-specific modules
```

### Frontend Structure
```
frontend/src/
├── components/         # React components
│   ├── dashboard/     # Dashboard-specific components
│   └── layout/        # Layout components (Header, Sidebar)
├── services/          # API communication layer
├── store/             # Redux store and slices
├── types/             # TypeScript type definitions
├── hooks/             # Custom React hooks
└── styles/            # CSS and theme files
```

## 🔧 **Configuration Management**

### Environment Variables
- **Development**: Services use localhost URLs and ports
- **Production**: Configure via environment variables
- **API URLs**: Defined in frontend/.env and backend configs

### Port Allocation
| Service | Development Port | Production Port |
|---------|------------------|-----------------|
| Frontend | 3000 | 80/443 |
| API Gateway | 8000 | 8000 |
| Portfolio | 8100 | 8100 |
| Market Data | 8140 | 8140 |
| Order Management | 8160 | 8160 |
| Risk Management | 8180 | 8180 |  
| Signal Detection | 8200 | 8200 |

## 🐛 **Common Issues & Solutions**

### Service Won't Start
```bash
# Check if port is already in use
lsof -i :[port]

# Kill process using port
pkill -f "uvicorn.*[port]"

# Check Python environment
which python  # Should show .venv path
pip list | grep fastapi  # Verify FastAPI installed
```

### Frontend Build Issues
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run type-check

# Clear browser cache and restart dev server
```

### Service Communication Issues
```bash
# Test API Gateway routing
curl http://localhost:8000/health

# Test individual services directly  
curl http://localhost:8100/health

# Check CORS configuration in FastAPI services
# Ensure allow_origins=["*"] for development
```

## 📊 **Development Best Practices**

### Code Standards
- **Python**: Follow PEP 8, use type hints, async/await patterns
- **TypeScript**: Strict type checking, interface definitions for all data
- **API Design**: RESTful endpoints, consistent error responses
- **Git**: Descriptive commit messages, feature branches

### Testing Strategy
- **Unit Tests**: Test individual functions and methods
- **Integration Tests**: Test API endpoints and service communication  
- **End-to-End Tests**: Test complete user workflows
- **Load Tests**: Test system performance under load

### Performance Guidelines
- **Database Queries**: Use indexes, limit result sets
- **API Responses**: Paginate large datasets
- **WebSocket Connections**: Implement connection pooling
- **Caching**: Cache frequently accessed data
- **Monitoring**: Log performance metrics

## 🔄 **Daily Development Routine**

### Morning Startup (5 minutes)
1. Pull latest changes from git
2. Start all services with health checks
3. Verify frontend loads correctly  
4. Check for any overnight issues in logs

### During Development  
1. Make small, focused changes
2. Test changes immediately
3. Use service documentation at `/docs` endpoints
4. Monitor terminal outputs for errors

### End of Day (5 minutes)
1. Commit and push changes
2. Update documentation if needed
3. Stop services or leave running for next day
4. Update status in CURRENT_STATUS.md

## 🎯 **Feature Development Flow**

### Adding New Functionality
1. **Plan**: Define requirements and API contracts
2. **Backend**: Implement service endpoints with FastAPI
3. **Frontend**: Create React components and integrate APIs  
4. **Test**: Verify functionality end-to-end
5. **Document**: Update API docs and user guides

### Example: Adding New Trading Feature
```bash
# 1. Add backend endpoint
cd backend/services/core-trading/order-management-service
# Edit main.py to add new endpoint

# 2. Add frontend integration  
cd frontend/src/services
# Edit api.ts to add new API call

# 3. Add UI component
cd frontend/src/components  
# Create new component or edit existing

# 4. Test integration
# Use browser dev tools and API docs to verify
```

## 📈 **Performance Monitoring**

### Development Metrics to Watch
- **API Response Times**: Should be < 100ms for simple endpoints
- **WebSocket Connection Stability**: Monitor connection drops
- **Memory Usage**: Python services should stay under 100MB each
- **CPU Usage**: Should be minimal during idle periods

### Monitoring Commands
```bash
# Check memory usage
ps aux --sort=-%mem | grep python | head -10

# Monitor API response times  
time curl http://localhost:8000/health

# Check WebSocket connections
netstat -an | grep :3000
```

---

**Remember**: This is a development environment optimized for rapid iteration. For production deployment, additional security, monitoring, and scaling considerations will be needed.

**Next Steps**: Focus on stabilizing services, adding real data sources, and implementing user authentication.
