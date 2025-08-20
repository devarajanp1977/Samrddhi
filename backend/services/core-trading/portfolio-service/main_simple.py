"""
Portfolio Service - Simplified Version
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Portfolio Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "portfolio-service"}

@app.get("/portfolio")
async def get_portfolio():
    return {
        "account_value": 125000.0,
        "cash_balance": 45000.0,
        "positions_count": 3,
        "total_return": 25000.0,
        "total_return_percent": 25.0
    }

@app.get("/positions")
async def get_positions():
    return [
        {
            "symbol": "AAPL",
            "quantity": 100,
            "avg_price": 175.50,
            "current_price": 182.25,
            "unrealized_pnl": 675.0
        },
        {
            "symbol": "TSLA", 
            "quantity": 50,
            "avg_price": 245.80,
            "current_price": 238.90,
            "unrealized_pnl": -345.0
        }
    ]

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8100, reload=True)
