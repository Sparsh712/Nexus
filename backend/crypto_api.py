from fastapi import APIRouter, HTTPException, Query
import requests
import pandas as pd
import numpy as np
import json
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/crypto", tags=["Crypto"])
BINANCE_BASE = "https://api.binance.com/api/v3"

# Map to maintain frontend compatibility (ID -> Binance Symbol)
COIN_MAPPING = {
    "bitcoin": "BTCUSDT",
    "ethereum": "ETHUSDT",
    "solana": "SOLUSDT",
    "binancecoin": "BNBUSDT",
    "ripple": "XRPUSDT",
    "cardano": "ADAUSDT",
    "dogecoin": "DOGEUSDT",
    "avalanche-2": "AVAXUSDT",
    "tron": "TRXUSDT",
    "polkadot": "DOTUSDT",
    "polygon": "MATICUSDT",
    "chainlink": "LINKUSDT",
    "shiba-inu": "SHIBUSDT",
    "litecoin": "LTCUSDT",
    "bitcoin-cash": "BCHUSDT",
    "stellar": "XLMUSDT",
    "algorand": "ALGOUSDT",
    "cosmos": "ATOMUSDT",
    "uniswap": "UNIUSDT"
}

# Reverse map for listing
SYMBOL_TO_ID = {v: k for k, v in COIN_MAPPING.items()}

# Display names for search matching
COIN_NAMES = {
    "BTCUSDT": "Bitcoin",
    "ETHUSDT": "Ethereum",
    "SOLUSDT": "Solana",
    "BNBUSDT": "Binance Coin BNB",
    "XRPUSDT": "Ripple XRP",
    "ADAUSDT": "Cardano ADA",
    "DOGEUSDT": "Dogecoin DOGE",
    "AVAXUSDT": "Avalanche AVAX",
    "TRXUSDT": "Tron TRX",
    "DOTUSDT": "Polkadot DOT",
    "MATICUSDT": "Polygon Matic",
    "LINKUSDT": "Chainlink LINK",
    "SHIBUSDT": "Shiba Inu SHIB",
    "LTCUSDT": "Litecoin LTC",
    "BCHUSDT": "Bitcoin Cash BCH",
    "XLMUSDT": "Stellar XLM",
    "ALGOUSDT": "Algorand ALGO",
    "ATOMUSDT": "Cosmos ATOM",
    "UNIUSDT": "Uniswap UNI"
}


def fetch_binance_ticker_24hr(symbols=None):
    """
    Fetch 24hr stats from Binance.
    If symbols (list) is provided, fetches specific tickers (lighter).
    If symbols is None, fetches ALL tickers (heavy).
    """
    try:
        if symbols:
            # Binance allows symbols param like ["BTCUSDT","ETHUSDT"]
            # But the GET param expects: ?symbols=["BTCUSDT","ETHUSDT"]
            # We need to construct the JSON string format for the query param
            symbols_json = json.dumps(symbols).replace(" ", "")
            url = f"{BINANCE_BASE}/ticker/24hr?symbols={symbols_json}"
        else:
            url = f"{BINANCE_BASE}/ticker/24hr"
            
        r = requests.get(url, timeout=10)
        if r.ok:
            return r.json()
        else:
            logger.error(f"Binance API Error: {r.status_code} {r.text}")
    except Exception as e:
        logger.error(f"Error fetching Binance tickers: {e}")
    return []

def fetch_binance_klines(symbol, interval="1d", limit=365):
    """Fetch candlestick data (klines) from Binance"""
    try:
        url = f"{BINANCE_BASE}/klines?symbol={symbol}&interval={interval}&limit={limit}"
        r = requests.get(url, timeout=10)
        if r.ok:
            return r.json()
        else:
             logger.error(f"Binance Kline Error for {symbol}: {r.status_code}")
    except Exception as e:
        logger.error(f"Error fetching Binance klines for {symbol}: {e}")
    return []

def format_coin_from_ticker(t):
    """Helper to transform Binance ticker to our App format"""
    symbol = t['symbol']
    base_asset = symbol.replace('USDT', '')
    coin_id = SYMBOL_TO_ID.get(symbol, base_asset.lower())
    # Use mapped display name, fall back to base_asset
    display_name = COIN_NAMES.get(symbol, base_asset)
    
    return {
        "id": coin_id,
        "symbol": base_asset,
        "name": display_name,
        "image": f"https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@master/128/color/{base_asset.lower()}.png",
        "current_price": float(t['lastPrice']),
        "market_cap": float(t['quoteVolume']) * 10, # Proxy
        "market_cap_rank": 0, # Calculated later
        "price_change_percentage_24h": float(t['priceChangePercent']),
        "total_volume": float(t['quoteVolume']) # Add volume
    }

# --- Routes ---

@router.get("/coins")
async def get_coins(search: str = ""):
    # If search is specific, we might want to fetch all or search locally
    # For now, fetching all relevant USDT pairs is better than nothing, 
    # but let's try to be efficient.
    
    full_list = fetch_binance_ticker_24hr() # Still need full list for broad search
    if not full_list:
        return []

    valid_tickers = [
        t for t in full_list 
        if t['symbol'].endswith('USDT') 
        and float(t['quoteVolume']) > 1000000 
    ]
    
    # Sort by volume
    valid_tickers.sort(key=lambda x: float(x['quoteVolume']), reverse=True)
    
    coins = []
    for i, t in enumerate(valid_tickers[:100]): # Return top 100 max
        symbol = t['symbol']
        base_asset = symbol.replace('USDT', '')
        
        if search:
            q = search.upper()
            # Get display name for this coin to match against
            coin_name = COIN_NAMES.get(symbol, base_asset).upper()
            if q not in symbol and q not in base_asset and q not in coin_name:
                continue
        
        coin = format_coin_from_ticker(t)
        coin['market_cap_rank'] = i + 1
        coins.append(coin)
            
    return coins

@router.get("/coin-details/{coin_id}")
async def get_coin_details(coin_id: str):
    # Resolve Binance Symbol
    symbol = COIN_MAPPING.get(coin_id, f"{coin_id.upper()}USDT")
    
    try:
        # Use single ticker endpoint directly
        url = f"{BINANCE_BASE}/ticker/24hr?symbol={symbol}"
        r = requests.get(url, timeout=5)
        
        if not r.ok:
            # Fallback for ID matching if map missed
            symbol = f"{coin_id.upper()}USDT"
            url = f"{BINANCE_BASE}/ticker/24hr?symbol={symbol}"
            r = requests.get(url, timeout=5)
            if not r.ok:
                 logger.error(f"Coin {coin_id} not found on Binance")
                 raise HTTPException(status_code=404, detail="Coin not found on Binance")
        
        t = r.json()
        base_asset = symbol.replace('USDT', '')
        
        # Build complete detail response
        return {
            "id": coin_id,
            "symbol": base_asset,
            "name": base_asset,
            "description": f"Real-time market data for {base_asset} provided by Binance.",
            "image": f"https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@master/128/color/{base_asset.lower()}.png",
            "current_price": float(t['lastPrice']),
            "market_cap": float(t['quoteVolume']) * 100, 
            "circulating_supply": float(t['volume']),
            "total_volume": float(t['quoteVolume']),
            "ath": float(t['highPrice']),
            "atl": float(t['lowPrice']),
            "high_24h": float(t['highPrice']),
            "low_24h": float(t['lowPrice']),
            "price_change_percentage_24h": float(t['priceChangePercent']),
            "price_change_percentage_1y": 0.0,
        }
    except Exception as e:
         logger.error(f"Error fetching details for {coin_id}: {e}")
         raise HTTPException(status_code=500, detail="Error fetching coin details")

@router.get("/historical-price/{coin_id}")
async def get_historical_price(coin_id: str, days: int = 365):
    symbol = COIN_MAPPING.get(coin_id, f"{coin_id.upper()}USDT")
    
    interval = "1d"
    limit = days
    if days <= 1:
        interval = "5m" 
        limit = 288 
    elif days <= 7:
        interval = "1h"
        limit = 168
        
    klines = fetch_binance_klines(symbol, interval, limit)
    if not klines:
        return []
        
    data = []
    for k in klines:
        data.append({
            "date": pd.to_datetime(k[0], unit='ms').strftime("%Y-%m-%d"),
            "price": float(k[4])
        })
    return data

@router.get("/performance-heatmap/{coin_id}")
async def get_performance_heatmap(coin_id: str):
    data = await get_historical_price(coin_id, days=365)
    if not data:
        return []
        
    df = pd.DataFrame(data)
    df["dayChange"] = df["price"].pct_change().fillna(0)
    df["date_obj"] = pd.to_datetime(df["date"])
    df["month"] = df["date_obj"].dt.month
    
    heatmap = df.groupby("month")["dayChange"].mean().reset_index()
    heatmap["month"] = heatmap["month"].astype(str)
    return heatmap.to_dict(orient="records")

@router.get("/risk-volatility/{coin_id}")
async def get_risk_volatility(coin_id: str):
    data = await get_historical_price(coin_id, days=365)
    if not data:
        return {}
        
    df = pd.DataFrame(data)
    df["returns"] = df["price"].pct_change()
    df.dropna(subset=["returns"], inplace=True)
    
    if df.empty:
         return {}
         
    annualized_volatility = df["returns"].std() * (252**0.5)
    annualized_return = (df["returns"].mean() + 1) ** 252 - 1
    sharpe = (annualized_return - 0.06) / annualized_volatility if annualized_volatility > 0 else 0
    
    return {
        "annualized_volatility": float(annualized_volatility),
        "annualized_return": float(annualized_return),
        "sharpe_ratio": float(sharpe),
        "returns": [{"date": r["date"], "returns": r["returns"]} for _, r in df.iterrows()]
    }

@router.get("/monte-carlo-prediction/{coin_id}")
async def monte_carlo_prediction(coin_id: str):
    data = await get_historical_price(coin_id, days=365)
    if not data or len(data) < 50:
         return {}
         
    df = pd.DataFrame(data)
    df["returns"] = df["price"].pct_change().dropna()
    
    mu = df["returns"].mean()
    sigma = df["returns"].std()
    last_price = df["price"].iloc[-1]
    
    days_pred = 252
    num_sims = 1000
    
    simulations = np.zeros((num_sims, days_pred))
    simulations[:, 0] = last_price
    
    for t in range(1, days_pred):
        rand = np.random.normal(mu, sigma, num_sims)
        simulations[:, t] = simulations[:, t-1] * (1 + rand)
        
    expected = float(np.mean(simulations[:, -1]))
    
    # Select 5 random paths for visualization
    selected_indices = np.random.choice(num_sims, 5, replace=False)
    selected_paths = []
    
    for i, idx in enumerate(selected_indices):
        path_data = []
        for t in range(days_pred):
            path_data.append({
                "day": t, 
                "value": float(simulations[idx, t])
            })
        selected_paths.append({
            "name": f"Sim {i+1}",
            "data": path_data
        })
        
    # Historical data for chart context
    historical_chart = []
    for i, d in enumerate(data):
        historical_chart.append({
            "day": i - len(data), # Negative days for historical
            "value": d["price"]
        })

    return {
        "expected_price": expected,
        "probability_positive_return": float(np.mean(simulations[:, -1] > last_price)) * 100,
        "lower_bound_5th_percentile": float(np.percentile(simulations[:, -1], 5)),
        "upper_bound_95th_percentile": float(np.percentile(simulations[:, -1], 95)),
        "last_price": last_price,
        "simulation_paths": selected_paths,
        "historical_predicted": historical_chart
    }

@router.get("/famous")
async def get_famous_coins():
    """Fetch specialized list of famous coins efficiently"""
    # Use specific list of symbols for speed and reliability
    famous_symbols = list(COIN_MAPPING.values())
    
    # Split into chunks if needed, but ~20 symbols is fine for one URL
    raw = fetch_binance_ticker_24hr(symbols=famous_symbols)
    
    coins = []
    errors = 0
    
    if not raw:
        # Emergency fallback if batched fetch fails? 
        # For now, just return empty, but logging will show why
        return []
        
    for i, t in enumerate(raw):
        try:
            coin = format_coin_from_ticker(t)
            coin['market_cap_rank'] = i + 1
            coins.append(coin)
        except Exception as e:
            logger.error(f"Error formatting famous coin: {e}")
            
    # Sort by volume again to ensure 'famous' feeling
    coins.sort(key=lambda x: x.get('total_volume', 0), reverse=True)
    return coins[:10]

@router.get("/compare-prices")
async def compare_prices(coin_ids: str, days: int = 365):
    ids = [c.strip() for c in coin_ids.split(",")]
    comparison_data = {}
    
    for cid in ids:
        data = await get_historical_price(cid, days)
        if data:
            df = pd.DataFrame(data)
            comparison_data[cid] = df.set_index("date")["price"]
            
    if comparison_data:
        combined = pd.concat(comparison_data.values(), axis=1, keys=comparison_data.keys()).reset_index()
        combined.columns = ["date"] + [f"{k}_price" for k in comparison_data.keys()]
        return combined.fillna(0).to_dict(orient="records")
    return []