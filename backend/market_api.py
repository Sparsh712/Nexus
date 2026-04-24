"""
Market API endpoints for NEXUS
Provides market indices, movers (gainers/losers), and market status
"""
from fastapi import APIRouter
import yfinance as yf
from datetime import datetime
import pytz

router = APIRouter()

# Indian market indices
INDICES = {
    "^NSEI": "NIFTY 50",
    "^BSESN": "SENSEX",
    "^NSEBANK": "NIFTY BANK",
    "^CNXIT": "NIFTY IT"
}

# NIFTY 50 stocks for movers calculation
NIFTY50_STOCKS = [
    "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
    "HINDUNILVR.NS", "SBIN.NS", "BHARTIARTL.NS", "ITC.NS", "KOTAKBANK.NS",
    "LT.NS", "AXISBANK.NS", "BAJFINANCE.NS", "ASIANPAINT.NS", "MARUTI.NS",
    "HCLTECH.NS", "SUNPHARMA.NS", "TITAN.NS", "WIPRO.NS", "ULTRACEMCO.NS",
    "ONGC.NS", "NTPC.NS", "POWERGRID.NS", "TATAMOTORS.NS", "JSWSTEEL.NS",
    "TATASTEEL.NS", "ADANIENT.NS", "ADANIPORTS.NS", "M&M.NS", "BAJAJFINSV.NS",
    "TECHM.NS", "HINDALCO.NS", "COALINDIA.NS", "DIVISLAB.NS", "DRREDDY.NS",
    "NESTLEIND.NS", "GRASIM.NS", "CIPLA.NS", "EICHERMOT.NS", "APOLLOHOSP.NS",
    "BRITANNIA.NS", "HEROMOTOCO.NS", "INDUSINDBK.NS", "BPCL.NS", "TATACONSUM.NS",
    "SBILIFE.NS", "HDFCLIFE.NS", "UPL.NS", "BAJAJ-AUTO.NS", "SHREECEM.NS"
]


def is_market_open():
    """Check if Indian stock market is open"""
    ist = pytz.timezone('Asia/Kolkata')
    now = datetime.now(ist)
    
    # Check if weekday (Monday=0 to Friday=4)
    if now.weekday() > 4:
        return False
    
    # Market hours: 9:15 AM to 3:30 PM IST
    market_open = now.replace(hour=9, minute=15, second=0, microsecond=0)
    market_close = now.replace(hour=15, minute=30, second=0, microsecond=0)
    
    return market_open <= now <= market_close


@router.get("/api/market/status")
def get_market_status():
    """Get current market status"""
    ist = pytz.timezone('Asia/Kolkata')
    now = datetime.now(ist)
    
    is_open = is_market_open()
    
    # Calculate next open/close time
    if is_open:
        next_event = "closes"
        next_time = now.replace(hour=15, minute=30, second=0, microsecond=0)
    else:
        next_event = "opens"
        # If after hours or weekend, calculate next opening
        if now.weekday() > 4 or now.hour >= 15:
            days_until_monday = (7 - now.weekday()) % 7
            if days_until_monday == 0:
                days_until_monday = 7 if now.weekday() > 4 else 1
            next_time = (now + timedelta(days=days_until_monday)).replace(
                hour=9, minute=15, second=0, microsecond=0
            )
        else:
            next_time = now.replace(hour=9, minute=15, second=0, microsecond=0)
    
    return {
        "isOpen": is_open,
        "currentTime": now.isoformat(),
        "nextEvent": next_event,
        "nextEventTime": next_time.isoformat() if 'next_time' in dir() else None
    }


@router.get("/api/market/indices")
def get_market_indices():
    """Get major market indices data"""
    indices_data = []
    
    for symbol, name in INDICES.items():
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.fast_info
            hist = ticker.history(period="5d")  # Get 5 days data for weekends
            
            if len(hist) >= 2:
                current_price = hist['Close'].iloc[-1]
                prev_close = hist['Close'].iloc[-2]
                change = current_price - prev_close
                change_percent = (change / prev_close) * 100
            elif len(hist) == 1:
                current_price = hist['Close'].iloc[-1]
                change = 0
                change_percent = 0
            else:
                continue
            
            indices_data.append({
                "symbol": symbol,
                "name": name,
                "price": round(current_price, 2),
                "change": round(change, 2),
                "changePercent": round(change_percent, 2)
            })
        except Exception as e:
            print(f"Error fetching {symbol}: {e}")
            continue
    
    return indices_data


@router.get("/api/market/movers")
def get_market_movers():
    """Get top gainers and losers from NIFTY 50"""
    stocks_data = []
    
    # Fetch data for a subset of stocks (to reduce API calls)
    sample_stocks = NIFTY50_STOCKS[:25]  # First 25 stocks
    
    for symbol in sample_stocks:
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period="5d")  # Get 5 days data for weekends
            
            if len(hist) < 2:
                continue
            
            current_price = hist['Close'].iloc[-1]
            prev_close = hist['Close'].iloc[-2]
            change = current_price - prev_close
            change_percent = (change / prev_close) * 100
            
            # Get company name
            try:
                info = ticker.info
                name = info.get('shortName', symbol.replace('.NS', ''))
            except:
                name = symbol.replace('.NS', '')
            
            stocks_data.append({
                "symbol": symbol,
                "name": name,
                "price": round(current_price, 2),
                "change": round(change, 2),
                "changePercent": round(change_percent, 2)
            })
        except Exception as e:
            print(f"Error fetching {symbol}: {e}")
            continue
    
    # Sort by change percent
    stocks_data.sort(key=lambda x: x['changePercent'], reverse=True)
    
    # Top 5 gainers and top 5 losers
    gainers = [s for s in stocks_data if s['changePercent'] > 0][:5]
    losers = [s for s in stocks_data if s['changePercent'] < 0]
    losers.sort(key=lambda x: x['changePercent'])
    losers = losers[:5]
    
    return {
        "gainers": gainers,
        "losers": losers,
        "timestamp": datetime.now().isoformat()
    }


@router.get("/api/market/trending")
def get_trending_stocks():
    """Get trending/most active stocks"""
    trending = []
    
    # Sample of popular stocks
    popular = ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "TATAMOTORS.NS"]
    
    for symbol in popular:
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period="1d")
            
            if len(hist) == 0:
                continue
            
            volume = hist['Volume'].iloc[-1]
            current_price = hist['Close'].iloc[-1]
            
            trending.append({
                "symbol": symbol,
                "name": symbol.replace('.NS', ''),
                "price": round(current_price, 2),
                "volume": int(volume)
            })
        except Exception as e:
            continue
    
    # Sort by volume
    trending.sort(key=lambda x: x['volume'], reverse=True)
    
    return trending
