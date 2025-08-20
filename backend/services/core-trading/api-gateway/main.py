"""
Samrddhi API Gateway
Central entry point for all microservices
"""

import asyncio
import logging
import os
from typing import Dict, Any, Optional
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, HTTPException, Request, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
import httpx
import redis.asyncio as redis
from pydantic import BaseModel

from samrddhi.shared.auth import AuthManager
from samrddhi.shared.monitoring import MetricsCollector
from samrddhi.shared.utils import get_environment_config

# Metrics
REQUEST_COUNT = Counter('api_gateway_requests_total', 'Total API requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('api_gateway_request_duration_seconds', 'Request duration')

# Environment
ENV = os.getenv('SAMRDDHI_ENV', 'dev')
config = get_environment_config(ENV)

# Redis connection
redis_client: Optional[redis.Redis] = None

# Service registry
SERVICE_REGISTRY = {
    'portfolio': f"http://localhost:{8100 + (0 if ENV == 'dev' else 1 if ENV == 'test' else 2)}",
    'signal-detection': f"http://localhost:{8110 + (0 if ENV == 'dev' else 1 if ENV == 'test' else 2)}",
    'order-management': f"http://localhost:{8120 + (0 if ENV == 'dev' else 1 if ENV == 'test' else 2)}",
    'risk-management': f"http://localhost:{8130 + (0 if ENV == 'dev' else 1 if ENV == 'test' else 2)}",
    'market-data': f"http://localhost:{8140 + (0 if ENV == 'dev' else 1 if ENV == 'test' else 2)}",
    'auth': f"http://localhost:{8150 + (0 if ENV == 'dev' else 1 if ENV == 'test' else 2)}",
    'ml-strategy': f"http://localhost:{8160 + (0 if ENV == 'dev' else 1 if ENV == 'test' else 2)}",
    'backtesting': f"http://localhost:{8170 + (0 if ENV == 'dev' else 1 if ENV == 'test' else 2)}",
    'reporting': f"http://localhost:{8180 + (0 if ENV == 'dev' else 1 if ENV == 'test' else 2)}",
}

# Models
class HealthStatus(BaseModel):
    status: str
    environment: str
    version: str
    timestamp: str
    services: Dict[str, Any]

class ServiceRequest(BaseModel):
    service: str
    method: str
    path: str
    data: Optional[Dict[str, Any]] = None
    headers: Optional[Dict[str, str]] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global redis_client
    
    # Startup
    logging.info(f"Starting Samrddhi API Gateway - Environment: {ENV}")
    
    # Initialize Redis
    try:
        redis_client = redis.from_url(
            f"redis://{config['REDIS_HOST']}:{config['REDIS_PORT']}/{config['REDIS_DB']}"
        )
        await redis_client.ping()
        logging.info("Redis connection established")
    except Exception as e:
        logging.error(f"Redis connection failed: {e}")
    
    # Initialize metrics collector
    metrics = MetricsCollector()
    app.state.metrics = metrics
    
    # Register services
    for service_name, service_url in SERVICE_REGISTRY.items():
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{service_url}/health", timeout=5.0)
                if response.status_code == 200:
                    logging.info(f"Service {service_name} is healthy")
                else:
                    logging.warning(f"Service {service_name} health check failed")
        except Exception as e:
            logging.warning(f"Service {service_name} is not available: {e}")
    
    yield
    
    # Shutdown
    if redis_client:
        await redis_client.close()
    logging.info("API Gateway shutdown complete")

# Create FastAPI app
app = FastAPI(
    title="Samrddhi API Gateway",
    description="Central API Gateway for Samrddhi Automated Trading Platform",
    version="1.0.0",
    lifespan=lifespan
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.get('CORS_ORIGINS', ["http://localhost:3000"]),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Security
security = HTTPBearer()
auth_manager = AuthManager()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Validate JWT token and return user info"""
    try:
        user_info = await auth_manager.validate_token(credentials.credentials)
        return user_info
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    """Collect metrics for all requests"""
    start_time = asyncio.get_event_loop().time()
    
    response = await call_next(request)
    
    duration = asyncio.get_event_loop().time() - start_time
    
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    REQUEST_DURATION.observe(duration)
    
    return response

@app.get("/health", response_model=HealthStatus)
async def health_check():
    """Comprehensive health check"""
    from datetime import datetime
    
    services_health = {}
    
    # Check each registered service
    for service_name, service_url in SERVICE_REGISTRY.items():
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{service_url}/health", timeout=2.0)
                services_health[service_name] = {
                    "status": "healthy" if response.status_code == 200 else "unhealthy",
                    "response_time": response.elapsed.total_seconds(),
                    "url": service_url
                }
        except Exception as e:
            services_health[service_name] = {
                "status": "unhealthy",
                "error": str(e),
                "url": service_url
            }
    
    # Check Redis
    redis_status = "healthy"
    if redis_client:
        try:
            await redis_client.ping()
        except Exception:
            redis_status = "unhealthy"
    else:
        redis_status = "not_connected"
    
    return HealthStatus(
        status="healthy",
        environment=ENV,
        version="1.0.0",
        timestamp=datetime.utcnow().isoformat(),
        services={
            **services_health,
            "redis": {"status": redis_status}
        }
    )

@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return JSONResponse(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )

@app.post("/api/v1/proxy")
async def proxy_request(
    request: ServiceRequest,
    user: dict = Depends(get_current_user)
):
    """Proxy requests to microservices"""
    
    if request.service not in SERVICE_REGISTRY:
        raise HTTPException(
            status_code=404,
            detail=f"Service '{request.service}' not found"
        )
    
    service_url = SERVICE_REGISTRY[request.service]
    full_url = f"{service_url}{request.path}"
    
    # Add user context to headers
    headers = request.headers or {}
    headers["X-User-ID"] = user.get("user_id", "")
    headers["X-User-Role"] = user.get("role", "user")
    
    try:
        async with httpx.AsyncClient() as client:
            if request.method.upper() == "GET":
                response = await client.get(full_url, headers=headers, timeout=30.0)
            elif request.method.upper() == "POST":
                response = await client.post(
                    full_url, 
                    json=request.data,
                    headers=headers,
                    timeout=30.0
                )
            elif request.method.upper() == "PUT":
                response = await client.put(
                    full_url,
                    json=request.data,
                    headers=headers,
                    timeout=30.0
                )
            elif request.method.upper() == "DELETE":
                response = await client.delete(full_url, headers=headers, timeout=30.0)
            else:
                raise HTTPException(
                    status_code=405,
                    detail=f"Method {request.method} not allowed"
                )
            
            return JSONResponse(
                content=response.json() if response.text else {},
                status_code=response.status_code
            )
            
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Service request timed out"
        )
    except Exception as e:
        logging.error(f"Proxy request failed: {e}")
        raise HTTPException(
            status_code=502,
            detail="Service request failed"
        )

# Trading API endpoints
@app.get("/api/v1/portfolio")
async def get_portfolio(user: dict = Depends(get_current_user)):
    """Get current portfolio status"""
    request = ServiceRequest(
        service="portfolio",
        method="GET",
        path="/portfolio"
    )
    return await proxy_request(request, user)

@app.get("/api/v1/positions")
async def get_positions(user: dict = Depends(get_current_user)):
    """Get current positions"""
    request = ServiceRequest(
        service="portfolio",
        method="GET", 
        path="/positions"
    )
    return await proxy_request(request, user)

@app.get("/api/v1/signals")
async def get_signals(user: dict = Depends(get_current_user)):
    """Get current trading signals"""
    request = ServiceRequest(
        service="signal-detection",
        method="GET",
        path="/signals"
    )
    return await proxy_request(request, user)

@app.post("/api/v1/orders")
async def create_order(order_data: dict, user: dict = Depends(get_current_user)):
    """Create a new order"""
    request = ServiceRequest(
        service="order-management",
        method="POST",
        path="/orders",
        data=order_data
    )
    return await proxy_request(request, user)

@app.get("/api/v1/orders")
async def get_orders(user: dict = Depends(get_current_user)):
    """Get order history"""
    request = ServiceRequest(
        service="order-management",
        method="GET",
        path="/orders"
    )
    return await proxy_request(request, user)

@app.get("/api/v1/risk")
async def get_risk_metrics(user: dict = Depends(get_current_user)):
    """Get risk metrics"""
    request = ServiceRequest(
        service="risk-management",
        method="GET",
        path="/risk"
    )
    return await proxy_request(request, user)

@app.get("/api/v1/market-data/{symbol}")
async def get_market_data(symbol: str, user: dict = Depends(get_current_user)):
    """Get market data for symbol"""
    request = ServiceRequest(
        service="market-data",
        method="GET",
        path=f"/market-data/{symbol}"
    )
    return await proxy_request(request, user)

@app.post("/api/v1/auth/login")
async def login(login_data: dict):
    """User login"""
    request = ServiceRequest(
        service="auth",
        method="POST",
        path="/login",
        data=login_data
    )
    # Auth endpoint doesn't need user validation
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SERVICE_REGISTRY['auth']}/login",
                json=login_data,
                timeout=30.0
            )
            return JSONResponse(
                content=response.json() if response.text else {},
                status_code=response.status_code
            )
    except Exception as e:
        logging.error(f"Login request failed: {e}")
        raise HTTPException(
            status_code=502,
            detail="Authentication service unavailable"
        )

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "timestamp": str(asyncio.get_event_loop().time()),
            "path": request.url.path
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logging.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "timestamp": str(asyncio.get_event_loop().time()),
            "path": request.url.path
        }
    )

if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(
        level=logging.INFO if ENV == 'prod' else logging.DEBUG,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Determine port based on environment
    port = 8000 if ENV == 'dev' else 8001 if ENV == 'test' else 8002
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=(ENV == 'dev'),
        log_level="info" if ENV == 'prod' else "debug"
    )
