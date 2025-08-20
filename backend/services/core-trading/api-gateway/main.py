"""
Samrddhi API Gateway
Central entry point for all microservices
"""

import asyncio
import logging
import os
from typing import Dict, Any, Optional

import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import httpx

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment
ENV = os.getenv("ENVIRONMENT", "development")

# Configuration
config = {
    "CORS_ORIGINS": ["http://localhost:3000", "http://localhost:3001"],
    "REDIS_URL": "redis://localhost:6379",
    "SERVICES": {
        "portfolio": "http://localhost:8100",
        "market-data": "http://localhost:8140", 
        "order-management": "http://localhost:8160",
        "risk-management": "http://localhost:8180",
        "signal-detection": "http://localhost:8200"
    }
}

app = FastAPI(
    title="Samrddhi API Gateway",
    description="Central API Gateway for Samrddhi Trading Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.get('CORS_ORIGINS', ["http://localhost:3000"]),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

# HTTP client for service communication
http_client = httpx.AsyncClient(timeout=30.0)

# Health check models
class HealthResponse(BaseModel):
    status: str
    timestamp: str
    services: Dict[str, Any]
    environment: str

class ServiceStatus(BaseModel):
    name: str
    status: str
    url: str
    response_time: Optional[float] = None

@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Samrddhi API Gateway starting up...")
    logger.info(f"Environment: {ENV}")
    logger.info("API Gateway is ready!")

@app.on_event("shutdown") 
async def shutdown_event():
    await http_client.aclose()
    logger.info("API Gateway shutting down...")

@app.get("/")
async def root():
    return {
        "message": "Welcome to Samrddhi Trading Platform API Gateway",
        "docs": "/docs",
        "health": "/health",
        "environment": ENV
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Comprehensive health check for all services"""
    import time
    from datetime import datetime
    
    services_status = {}
    
    # Check each service
    for service_name, service_url in config["SERVICES"].items():
        try:
            start_time = time.time()
            response = await http_client.get(f"{service_url}/health", timeout=5.0)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                services_status[service_name] = {
                    "status": "healthy",
                    "url": service_url,
                    "response_time": round(response_time * 1000, 2)  # ms
                }
            else:
                services_status[service_name] = {
                    "status": "unhealthy",
                    "url": service_url,
                    "response_time": round(response_time * 1000, 2)
                }
        except Exception as e:
            services_status[service_name] = {
                "status": "unavailable",
                "url": service_url,
                "error": str(e)
            }
    
    # Determine overall status
    overall_status = "healthy"
    if any(service["status"] == "unhealthy" for service in services_status.values()):
        overall_status = "degraded"
    elif any(service["status"] == "unavailable" for service in services_status.values()):
        overall_status = "unhealthy"
    
    return HealthResponse(
        status=overall_status,
        timestamp=datetime.now().isoformat(),
        services=services_status,
        environment=ENV
    )

# Portfolio Service Proxy
@app.get("/api/portfolio/{path:path}")
async def proxy_portfolio_get(path: str, request: Request):
    return await proxy_request("portfolio", "GET", path, request)

@app.post("/api/portfolio/{path:path}")
async def proxy_portfolio_post(path: str, request: Request):
    return await proxy_request("portfolio", "POST", path, request)

@app.put("/api/portfolio/{path:path}")
async def proxy_portfolio_put(path: str, request: Request):
    return await proxy_request("portfolio", "PUT", path, request)

# Market Data Service Proxy
@app.get("/api/market-data/{path:path}")
async def proxy_market_data_get(path: str, request: Request):
    return await proxy_request("market-data", "GET", path, request)

# Order Management Service Proxy
@app.get("/api/orders/{path:path}")
async def proxy_orders_get(path: str, request: Request):
    return await proxy_request("order-management", "GET", path, request)

@app.post("/api/orders/{path:path}")
async def proxy_orders_post(path: str, request: Request):
    return await proxy_request("order-management", "POST", path, request)

@app.put("/api/orders/{path:path}")
async def proxy_orders_put(path: str, request: Request):
    return await proxy_request("order-management", "PUT", path, request)

# Risk Management Service Proxy
@app.get("/api/risk/{path:path}")
async def proxy_risk_get(path: str, request: Request):
    return await proxy_request("risk-management", "GET", path, request)

@app.post("/api/risk/{path:path}")
async def proxy_risk_post(path: str, request: Request):
    return await proxy_request("risk-management", "POST", path, request)

# Signal Detection Service Proxy
@app.get("/api/signals/{path:path}")
async def proxy_signals_get(path: str, request: Request):
    return await proxy_request("signal-detection", "GET", path, request)

@app.post("/api/signals/{path:path}")
async def proxy_signals_post(path: str, request: Request):
    return await proxy_request("signal-detection", "POST", path, request)

async def proxy_request(service_name: str, method: str, path: str, request: Request):
    """Proxy requests to backend services"""
    service_url = config["SERVICES"].get(service_name)
    if not service_url:
        raise HTTPException(status_code=404, detail=f"Service {service_name} not found")
    
    # Build target URL
    query_params = str(request.url.query)
    target_url = f"{service_url}/{path}"
    if query_params:
        target_url += f"?{query_params}"
    
    try:
        # Get request body if present
        body = None
        if method in ["POST", "PUT", "PATCH"]:
            body = await request.body()
        
        # Forward the request
        response = await http_client.request(
            method=method,
            url=target_url,
            content=body,
            headers={k: v for k, v in request.headers.items() 
                    if k.lower() not in ['host', 'content-length']},
            timeout=30.0
        )
        
        # Return the response
        return JSONResponse(
            content=response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text,
            status_code=response.status_code,
            headers={k: v for k, v in response.headers.items() 
                    if k.lower() not in ['content-length', 'transfer-encoding']}
        )
        
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail=f"Service {service_name} timeout")
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Service {service_name} unavailable: {str(e)}")
    except Exception as e:
        logger.error(f"Proxy error for {service_name}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True,
        log_level="info"
    )
