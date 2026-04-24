from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from pathlib import Path

from mf_api import router as mf_router
from stock_api import router as stock_router
from portfolio_mongodb import router as portfolio_router, init_db as init_portfolio_db
from crypto_api import router as crypto_router
from video_game_api import router as simulator_router, init_db as init_simulator_db
from share_api import router as share_router
from market_api import router as market_router
from news_api import router as news_router
from screener_api import router as screener_router

# Load environment variables for backend and local root app.
BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(BACKEND_DIR / '.env', override=False)
load_dotenv(BACKEND_DIR.parent / '.env.local', override=False)

app = FastAPI(title="Combined Stock + Mutual Fund + Crypto API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(mf_router)
app.include_router(stock_router)
app.include_router(portfolio_router)
app.include_router(crypto_router)
app.include_router(simulator_router)
app.include_router(share_router)
app.include_router(market_router)
app.include_router(news_router)
app.include_router(screener_router)   
@app.get("/")
def root():
    return {"message": "Stock, Mutual Fund and Crypto unified API is running!"}


@app.on_event("startup")
def startup_event():
    # Initialize MongoDB for all modules
    uri = os.getenv("MONGODB_URI")

    # Initialize portfolio MongoDB
    portfolio_ready = init_portfolio_db(uri)

    # Initialize simulator MongoDB
    simulator_ready = init_simulator_db(uri)

    if not portfolio_ready or not simulator_ready:
        raise RuntimeError("MongoDB initialization failed. Backend requires MongoDB.")


