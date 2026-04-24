from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import pandas as pd
import numpy as np
import yfinance as yf
import requests
from typing import List, Optional

router = APIRouter(prefix="/api/stock", tags=["Stock"])

class StockProfile(BaseModel):
    symbol: str
    longName: Optional[str] = None
    sector: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    summary: Optional[str] = None
    marketCap: Optional[float] = None

class StockQuote(BaseModel):
    symbol: str
    price: Optional[float]
    open: Optional[float]
    dayHigh: Optional[float]
    dayLow: Optional[float]
    previousClose: Optional[float]
    currency: Optional[str]
    marketCap: Optional[float]
    volume: Optional[int]

class HistoryRow(BaseModel):
    date: str
    open: Optional[float]
    high: Optional[float]
    low: Optional[float]
    close: Optional[float]
    volume: Optional[int]
    returns: Optional[float] = None
    ma20: Optional[float] = None
    ma50: Optional[float] = None

class NewsItem(BaseModel):
    title: str
    publisher: Optional[str] = None
    link: str
    datetime: str

def normalize_symbol(symbol: str) -> str:
    """Normalize stock symbol - add .NS suffix for Indian stocks if missing"""
    symbol = symbol.strip().upper()
    # Index symbols (like ^NSEI, ^BSESN) start with ^ - don't modify these
    if symbol.startswith('^'):
        return symbol
    # If already has exchange suffix, return as is
    if symbol.endswith('.NS') or symbol.endswith('.BO'):
        return symbol
    # For symbols without suffix, assume NSE (most common)
    return f"{symbol}.NS"

def get_yf_ticker(symbol: str) -> yf.Ticker:
    # Normalize symbol first
    symbol = normalize_symbol(symbol)
    # Create fresh ticker instance each time to avoid stale cache
    ticker = yf.Ticker(symbol)
    # Clear any internal cache by creating new instance
    return ticker

def get_fresh_price(symbol: str) -> dict:
    """Get the freshest possible price by using fast_info and direct API call"""
    symbol = normalize_symbol(symbol)
    try:
        # Method 1: Try using yfinance's fast_info (less cached)
        ticker = yf.Ticker(symbol)
        fast = ticker.fast_info
        if fast and hasattr(fast, 'last_price') and fast.last_price:
            return {
                "price": fast.last_price,
                "previous_close": fast.previous_close if hasattr(fast, 'previous_close') else None,
                "market_cap": fast.market_cap if hasattr(fast, 'market_cap') else None,
            }
    except:
        pass
    
    try:
        # Method 2: Direct Yahoo Finance API call (bypasses yfinance cache)
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        params = {'interval': '1m', 'range': '1d'}
        response = requests.get(url, headers=headers, params=params, timeout=5)
        data = response.json()
        
        result = data.get('chart', {}).get('result', [])
        if result:
            meta = result[0].get('meta', {})
            return {
                "price": meta.get('regularMarketPrice'),
                "previous_close": meta.get('previousClose'),
                "market_cap": None,  # Not available in chart API
            }
    except Exception as e:
        print(f"Error fetching fresh price: {e}")
    
    return None

def get_history_df(symbol: str, period="1y", interval="1d") -> pd.DataFrame:
    hist = get_yf_ticker(symbol).history(period=period, interval=interval)
    if hist.empty:
        raise Exception(f"No historical data found for {symbol}")
    hist = hist.reset_index()
    hist['returns'] = hist['Close'].pct_change()
    hist['ma20'] = hist['Close'].rolling(window=20).mean()
    hist['ma50'] = hist['Close'].rolling(window=50).mean()
    return hist

@router.get("/search")
async def search_stock(symbol: str = Query(..., description="e.g. TCS.NS")):
    try:
        stock = get_yf_ticker(symbol)
        info = stock.info
        found = bool(info and 'regularMarketPrice' in info)
        return {
            "found": found,
            "symbol": symbol,
            "longName": info.get("longName"),
            "exchange": info.get("exchange"),
            "sector": info.get("sector"),
            "industry": info.get("industry"),
        }
    except Exception:
        return {"found": False}

@router.get("/search-stocks")
async def search_stocks(q: str = Query(..., description="Search query for stocks")):
    """Search for stocks by name or symbol using Yahoo Finance API"""
    try:
        url = "https://query2.finance.yahoo.com/v1/finance/search"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        params = {
            'q': q,
            'quotesCount': 20,
            'newsCount': 0,
            'enableFuzzyQuery': 'true',
            'quotesQueryId': 'tss_match_phrase_query',
            'multiQuoteQueryId': 'multi_quote_single_token_query',
            'region': 'IN'
        }
        
        response = requests.get(url, headers=headers, params=params)
        data = response.json()
        
        quotes = data.get('quotes', [])
        results = []
        
        for quote in quotes:
            quote_type = quote.get('quoteType', '')
            # Filter for EQUITY only - exclude ETF, MUTUALFUND
            if quote_type not in ['EQUITY']:
                continue
            
            symbol = quote.get('symbol', '')
            name = quote.get('longname') or quote.get('shortname') or symbol
            
            # Exclude ETFs and Mutual Fund-like products by name
            name_lower = name.lower()
            if any(keyword in name_lower for keyword in ['etf', 'fund', 'mutual', 'index', 'nifty', 'sensex', 'gold', 'silver', 'liquid']):
                continue
            
            # Only include Indian stocks (ending in .NS or .BO) for simulator compatibility
            is_indian = symbol.endswith('.NS') or symbol.endswith('.BO')
            if not is_indian:
                continue
            
            results.append({
                "symbol": symbol,
                "name": name,
                "exchange": quote.get('exchange'),
                "is_indian": is_indian
            })
        
        return results[:15]

    except Exception as e:
        print(f"Error in search_stocks: {e}")
        return []

@router.get("/fast-quote/{symbol}")
def get_fast_quote(symbol: str):
    """
    Get a fast stock quote using fast_info and chart API.
    Returns comprehensive data for the stock detail modal.
    """
    symbol = normalize_symbol(symbol)
    try:
        ticker = yf.Ticker(symbol)
        fast = ticker.fast_info
        
        if fast and hasattr(fast, 'last_price') and fast.last_price:
            price = fast.last_price
            prev = fast.previous_close if hasattr(fast, 'previous_close') else None
            change = round(price - prev, 2) if prev else None
            change_pct = round(((price - prev) / prev) * 100, 2) if prev else None
            
            # Get additional info (P/E, EPS, Beta, Dividend) - slightly slower but needed
            info = {}
            try:
                info = ticker.info
            except:
                pass
            
            return {
                "symbol": symbol,
                "price": price,
                "previousClose": prev,
                "dayChange": change,
                "dayChangePercent": change_pct,
                "marketCap": fast.market_cap if hasattr(fast, 'market_cap') else None,
                "dayHigh": fast.day_high if hasattr(fast, 'day_high') else None,
                "dayLow": fast.day_low if hasattr(fast, 'day_low') else None,
                "open": fast.open if hasattr(fast, 'open') else None,
                "fiftyTwoWeekHigh": fast.year_high if hasattr(fast, 'year_high') else None,
                "fiftyTwoWeekLow": fast.year_low if hasattr(fast, 'year_low') else None,
                "fiftyDayAverage": fast.fifty_day_average if hasattr(fast, 'fifty_day_average') else None,
                "twoHundredDayAverage": fast.two_hundred_day_average if hasattr(fast, 'two_hundred_day_average') else None,
                "volume": int(fast.last_volume) if hasattr(fast, 'last_volume') and fast.last_volume else None,
                "avgVolume": int(fast.ten_day_average_volume) if hasattr(fast, 'ten_day_average_volume') and fast.ten_day_average_volume else None,
                # From ticker.info
                "peRatio": info.get('trailingPE') or info.get('forwardPE'),
                "eps": info.get('trailingEps'),
                "dividendYield": info.get('dividendYield'),
                "beta": info.get('beta'),
            }
        
        # Fallback to chart API if fast_info fails
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
        headers = {'User-Agent': 'Mozilla/5.0'}
        params = {'interval': '1m', 'range': '1d'}
        response = requests.get(url, headers=headers, params=params, timeout=5)
        data = response.json()
        
        result = data.get('chart', {}).get('result', [])
        if result:
            meta = result[0].get('meta', {})
            price = meta.get('regularMarketPrice')
            prev = meta.get('previousClose')
            return {
                "symbol": symbol,
                "price": price,
                "previousClose": prev,
                "dayChange": round(price - prev, 2) if price and prev else None,
                "dayChangePercent": round(((price - prev) / prev) * 100, 2) if price and prev else None,
                "marketCap": None,
                "dayHigh": meta.get('regularMarketDayHigh'),
                "dayLow": meta.get('regularMarketDayLow'),
                "open": meta.get('regularMarketOpen'),
                "fiftyTwoWeekHigh": meta.get('fiftyTwoWeekHigh'),
                "fiftyTwoWeekLow": meta.get('fiftyTwoWeekLow'),
            }
        
        return {"symbol": symbol, "price": None, "error": "Could not fetch price"}
    except Exception as e:
        return {"symbol": symbol, "price": None, "error": str(e)}

@router.get("/profile/{symbol}", response_model=StockProfile)
async def get_stock_profile(symbol: str):
    try:
        info = get_yf_ticker(symbol).info
        return StockProfile(
            symbol=symbol,
            longName=info.get("longName"),
            sector=info.get("sector"),
            industry=info.get("industry"),
            website=info.get("website"),
            summary=info.get("longBusinessSummary", ""),
            marketCap=info.get("marketCap"),
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Error: {e}")

@router.get("/quote/{symbol}", response_model=StockQuote)
async def get_stock_quote(symbol: str):
    try:
        # Try to get fresh price first (bypasses cache)
        fresh = get_fresh_price(symbol)
        info = get_yf_ticker(symbol).info
        
        # Use fresh price if available, otherwise fall back to info
        price = fresh.get("price") if fresh else info.get("regularMarketPrice")
        
        return StockQuote(
            symbol=symbol,
            price=price,
            open=info.get("regularMarketOpen"),
            dayHigh=info.get("dayHigh"),
            dayLow=info.get("dayLow"),
            previousClose=fresh.get("previous_close") if fresh else info.get("regularMarketPreviousClose"),
            currency=info.get("currency"),
            marketCap=info.get("marketCap"),
            volume=info.get("regularMarketVolume"),
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Error: {e}")

@router.get("/extended-quote/{symbol}")
async def get_extended_quote(symbol: str):
    """Get extended stock quote including 52-week high/low, P/E ratio, etc."""
    try:
        # Get fresh price first
        fresh = get_fresh_price(symbol)
        info = get_yf_ticker(symbol).info
        
        # Use fresh price if available
        price = fresh.get("price") if fresh else info.get("regularMarketPrice")
        prev_close = fresh.get("previous_close") if fresh else info.get("regularMarketPreviousClose")
        
        return {
            "symbol": symbol,
            "price": price,
            "previousClose": prev_close,
            "open": info.get("regularMarketOpen"),
            "dayHigh": info.get("dayHigh"),
            "dayLow": info.get("dayLow"),
            "fiftyTwoWeekHigh": info.get("fiftyTwoWeekHigh"),
            "fiftyTwoWeekLow": info.get("fiftyTwoWeekLow"),
            "fiftyDayAverage": info.get("fiftyDayAverage"),
            "twoHundredDayAverage": info.get("twoHundredDayAverage"),
            "marketCap": info.get("marketCap"),
            "volume": info.get("regularMarketVolume"),
            "avgVolume": info.get("averageVolume"),
            "peRatio": info.get("trailingPE"),
            "forwardPE": info.get("forwardPE"),
            "eps": info.get("trailingEps"),
            "dividendYield": info.get("dividendYield"),
            "beta": info.get("beta"),
            "sector": info.get("sector"),
            "industry": info.get("industry"),
            "longName": info.get("longName"),
            "currency": info.get("currency"),
            # Calculate % from 52-week high/low using fresh price
            "percentFrom52WeekHigh": round(((price - info.get("fiftyTwoWeekHigh", 0)) / info.get("fiftyTwoWeekHigh", 1)) * 100, 2) if info.get("fiftyTwoWeekHigh") and price else None,
            "percentFrom52WeekLow": round(((price - info.get("fiftyTwoWeekLow", 0)) / info.get("fiftyTwoWeekLow", 1)) * 100, 2) if info.get("fiftyTwoWeekLow") and price else None,
            # Day change using fresh price
            "dayChange": round(price - prev_close, 2) if prev_close and price else None,
            "dayChangePercent": round(((price - prev_close) / prev_close) * 100, 2) if prev_close and price else None,
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Error: {e}")


@router.get("/history/{symbol}", response_model=List[HistoryRow])
async def get_stock_history(
    symbol: str,
    period: str = "1y",
    interval: str = "1d",
    include_returns: bool = True
):
    try:
        hist = get_history_df(symbol, period, interval)
        hist['date'] = pd.to_datetime(hist['Date']).dt.strftime('%Y-%m-%d')
        rows = []
        for _, r in hist.iterrows():
            row = {
                "date": r["date"],
                "open": r.get("Open"),
                "high": r.get("High"),
                "low": r.get("Low"),
                "close": r.get("Close"),
                "volume": r.get("Volume"),
                "ma20": float(r["ma20"]) if not np.isnan(r["ma20"]) else None,
                "ma50": float(r["ma50"]) if not np.isnan(r["ma50"]) else None
            }
            if include_returns:
                row["returns"] = float(r["returns"]) if not np.isnan(r["returns"]) else None
            rows.append(row)
        return rows
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Error: {e}")

@router.get("/risk-volatility/{symbol}")
async def get_stock_risk(symbol: str, period: str="1y", interval: str="1d"):
    try:
        hist = get_history_df(symbol, period, interval)
        annualized_volatility = hist["returns"].std() * (252 ** 0.5)
        annualized_return = (hist["returns"].mean() + 1) ** 252 - 1
        risk_free_rate = 0.06
        sharpe_ratio = ((annualized_return - risk_free_rate) / annualized_volatility) if annualized_volatility > 0 else 0
        returns_list = [
            {"date": row["Date"].strftime("%Y-%m-%d"), "returns": float(row["returns"])}
            for _, row in hist.iterrows() if not np.isnan(row["returns"])
        ]
        return {
            "annualized_volatility": float(annualized_volatility),
            "annualized_return": float(annualized_return),
            "sharpe_ratio": float(sharpe_ratio),
            "returns": returns_list,
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Error: {e}")

@router.get("/monte-carlo-prediction/{symbol}")
async def get_stock_monte_carlo(
    symbol: str, num_simulations: int = 1000, days: int = 252
):
    try:
        hist = get_history_df(symbol, period="2y", interval="1d")
        mu = hist["returns"].mean()
        sigma = hist["returns"].std()
        last_price = float(hist["Close"].iloc[-1])
        simulations = np.zeros((num_simulations, days))
        simulations[:, 0] = last_price
        for t in range(1, days):
            random_returns = np.random.normal(mu, sigma, num_simulations)
            simulations[:, t] = simulations[:, t - 1] * (1 + random_returns)
        expected_price = float(np.mean(simulations[:, -1]))
        prob_positive = float(np.mean(simulations[:, -1] > last_price)) * 100
        percentile_5 = float(np.percentile(simulations[:, -1], 5))
        percentile_95 = float(np.percentile(simulations[:, -1], 95))
        return {
            "expected_price": expected_price,
            "probability_positive_return": prob_positive,
            "lower_bound_5th_percentile": percentile_5,
            "upper_bound_95th_percentile": percentile_95,
            "last_price": last_price,
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Error: {e}")
    
@router.get("/list")
async def list_stocks():
    stocks = [
        {"symbol": "TCS.NS", "longName": "Tata Consultancy Services"},
        {"symbol": "INFY.NS", "longName": "Infosys Ltd"},
        {"symbol": "RELIANCE.NS", "longName": "Reliance Industries"},
        {"symbol": "HDFCBANK.NS", "longName": "HDFC Bank"},
        {"symbol": "SBIN.NS", "longName": "State Bank of India"},
        {"symbol": "ICICIBANK.NS", "longName": "ICICI Bank"},
        {"symbol": "HINDUNILVR.NS", "longName": "Hindustan Unilever"},
        {"symbol": "MARUTI.NS", "longName": "Maruti Suzuki"},
        {"symbol": "BAJFINANCE.NS", "longName": "Bajaj Finance"},
        {"symbol": "KOTAKBANK.NS", "longName": "Kotak Mahindra Bank"},
    ]
    return stocks


@router.get("/news/{symbol}", response_model=List[NewsItem])
async def get_stock_news(symbol: str, limit: int = 8):
    try:
        stock = yf.Ticker(symbol)
        news = getattr(stock, "news", [])
        news_items = []
        for i, n in enumerate(news[:limit]):
            title = n.get("title", "")
            publisher = n.get("publisher", "")
            link = n.get("link", "")
            ts = n.get("providerPublishTime", None)
            if ts:
                dt_txt = pd.to_datetime(ts, unit="s").strftime('%Y-%m-%d %H:%M:%S')
            else:
                dt_txt = ""
            news_items.append(NewsItem(
                title=title, publisher=publisher, link=link, datetime=dt_txt
            ))
        return news_items
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Error: {e}")
