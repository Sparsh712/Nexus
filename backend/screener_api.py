"""
Screener API endpoints for NEXUS
Provides stock screening with real-time data from yfinance
"""
from fastapi import APIRouter
import yfinance as yf
from typing import Optional
from datetime import datetime
import concurrent.futures

router = APIRouter()

# Complete list of NIFTY 50 + popular stocks with sectors
STOCKS_DATA = [
    # NIFTY 50 Components
    {"symbol": "RELIANCE.NS", "name": "Reliance Industries", "sector": "Energy"},
    {"symbol": "TCS.NS", "name": "Tata Consultancy Services", "sector": "Technology"},
    {"symbol": "HDFCBANK.NS", "name": "HDFC Bank", "sector": "Banking"},
    {"symbol": "INFY.NS", "name": "Infosys", "sector": "Technology"},
    {"symbol": "ICICIBANK.NS", "name": "ICICI Bank", "sector": "Banking"},
    {"symbol": "HINDUNILVR.NS", "name": "Hindustan Unilever", "sector": "FMCG"},
    {"symbol": "SBIN.NS", "name": "State Bank of India", "sector": "Banking"},
    {"symbol": "BHARTIARTL.NS", "name": "Bharti Airtel", "sector": "Telecom"},
    {"symbol": "ITC.NS", "name": "ITC Limited", "sector": "FMCG"},
    {"symbol": "KOTAKBANK.NS", "name": "Kotak Mahindra Bank", "sector": "Banking"},
    {"symbol": "LT.NS", "name": "Larsen & Toubro", "sector": "Infrastructure"},
    {"symbol": "AXISBANK.NS", "name": "Axis Bank", "sector": "Banking"},
    {"symbol": "BAJFINANCE.NS", "name": "Bajaj Finance", "sector": "Finance"},
    {"symbol": "MARUTI.NS", "name": "Maruti Suzuki", "sector": "Automobile"},
    {"symbol": "HCLTECH.NS", "name": "HCL Technologies", "sector": "Technology"},
    {"symbol": "SUNPHARMA.NS", "name": "Sun Pharmaceutical", "sector": "Pharma"},
    {"symbol": "TITAN.NS", "name": "Titan Company", "sector": "Consumer"},
    {"symbol": "WIPRO.NS", "name": "Wipro", "sector": "Technology"},
    {"symbol": "TATAMOTORS.NS", "name": "Tata Motors", "sector": "Automobile"},
    {"symbol": "ONGC.NS", "name": "Oil & Natural Gas Corp", "sector": "Energy"},
    {"symbol": "NTPC.NS", "name": "NTPC Limited", "sector": "Energy"},
    {"symbol": "POWERGRID.NS", "name": "Power Grid Corp", "sector": "Energy"},
    {"symbol": "JSWSTEEL.NS", "name": "JSW Steel", "sector": "Metals"},
    {"symbol": "TATASTEEL.NS", "name": "Tata Steel", "sector": "Metals"},
    {"symbol": "TECHM.NS", "name": "Tech Mahindra", "sector": "Technology"},
    {"symbol": "HINDALCO.NS", "name": "Hindalco Industries", "sector": "Metals"},
    {"symbol": "COALINDIA.NS", "name": "Coal India", "sector": "Energy"},
    {"symbol": "DRREDDY.NS", "name": "Dr. Reddy's Labs", "sector": "Pharma"},
    {"symbol": "CIPLA.NS", "name": "Cipla", "sector": "Pharma"},
    {"symbol": "APOLLOHOSP.NS", "name": "Apollo Hospitals", "sector": "Healthcare"},
    {"symbol": "ASIANPAINT.NS", "name": "Asian Paints", "sector": "Consumer"},
    {"symbol": "ULTRACEMCO.NS", "name": "UltraTech Cement", "sector": "Cement"},
    {"symbol": "NESTLEIND.NS", "name": "Nestle India", "sector": "FMCG"},
    {"symbol": "DIVISLAB.NS", "name": "Divi's Laboratories", "sector": "Pharma"},
    {"symbol": "BRITANNIA.NS", "name": "Britannia Industries", "sector": "FMCG"},
    {"symbol": "BAJAJFINSV.NS", "name": "Bajaj Finserv", "sector": "Finance"},
    {"symbol": "EICHERMOT.NS", "name": "Eicher Motors", "sector": "Automobile"},
    {"symbol": "INDUSINDBK.NS", "name": "IndusInd Bank", "sector": "Banking"},
    {"symbol": "BPCL.NS", "name": "Bharat Petroleum", "sector": "Energy"},
    {"symbol": "TATACONSUM.NS", "name": "Tata Consumer Products", "sector": "FMCG"},
    {"symbol": "HEROMOTOCO.NS", "name": "Hero MotoCorp", "sector": "Automobile"},
    {"symbol": "GRASIM.NS", "name": "Grasim Industries", "sector": "Cement"},
    {"symbol": "ADANIENT.NS", "name": "Adani Enterprises", "sector": "Conglomerate"},
    {"symbol": "ADANIPORTS.NS", "name": "Adani Ports", "sector": "Infrastructure"},
    {"symbol": "M&M.NS", "name": "Mahindra & Mahindra", "sector": "Automobile"},
    {"symbol": "SBILIFE.NS", "name": "SBI Life Insurance", "sector": "Insurance"},
    {"symbol": "HDFCLIFE.NS", "name": "HDFC Life Insurance", "sector": "Insurance"},
    {"symbol": "BAJAJ-AUTO.NS", "name": "Bajaj Auto", "sector": "Automobile"},
    {"symbol": "SHREECEM.NS", "name": "Shree Cement", "sector": "Cement"},
    # Additional Popular Stocks
    {"symbol": "VEDL.NS", "name": "Vedanta Limited", "sector": "Metals"},
    {"symbol": "ZOMATO.NS", "name": "Zomato", "sector": "Technology"},
    {"symbol": "PAYTM.NS", "name": "Paytm", "sector": "Technology"},
    {"symbol": "NYKAA.NS", "name": "FSN E-Commerce (Nykaa)", "sector": "Consumer"},
    {"symbol": "PNB.NS", "name": "Punjab National Bank", "sector": "Banking"},
    {"symbol": "BANKBARODA.NS", "name": "Bank of Baroda", "sector": "Banking"},
    {"symbol": "IOC.NS", "name": "Indian Oil Corporation", "sector": "Energy"},
    {"symbol": "GAIL.NS", "name": "GAIL India", "sector": "Energy"},
    {"symbol": "TATAPOWER.NS", "name": "Tata Power", "sector": "Energy"},
    {"symbol": "ADANIGREEN.NS", "name": "Adani Green Energy", "sector": "Energy"},
    {"symbol": "JINDALSTEL.NS", "name": "Jindal Steel & Power", "sector": "Metals"},
    {"symbol": "IRCTC.NS", "name": "IRCTC", "sector": "Travel"},
    {"symbol": "HAL.NS", "name": "Hindustan Aeronautics", "sector": "Defence"},
    {"symbol": "BEL.NS", "name": "Bharat Electronics", "sector": "Defence"},
    {"symbol": "DLF.NS", "name": "DLF Limited", "sector": "Real Estate"},
    {"symbol": "GODREJCP.NS", "name": "Godrej Consumer Products", "sector": "FMCG"},
]


def fetch_stock_data(stock_info):
    """Fetch data for a single stock"""
    try:
        ticker = yf.Ticker(stock_info["symbol"])
        fast = ticker.fast_info
        
        if not fast or not hasattr(fast, 'last_price') or not fast.last_price:
            return None
        
        price = fast.last_price
        prev = fast.previous_close if hasattr(fast, 'previous_close') else None
        change = price - prev if prev else 0
        change_pct = (change / prev * 100) if prev else 0
        
        market_cap = (fast.market_cap / 10000000) if hasattr(fast, 'market_cap') and fast.market_cap else 0
        week_high = fast.year_high if hasattr(fast, 'year_high') else price
        week_low = fast.year_low if hasattr(fast, 'year_low') else price
        
        # Get P/E ratio
        pe = 0
        try:
            info = ticker.info
            pe = info.get('trailingPE') or info.get('forwardPE') or 0
        except:
            pass
        
        return {
            "symbol": stock_info["symbol"].replace(".NS", ""),
            "name": stock_info["name"],
            "sector": stock_info["sector"],
            "price": round(price, 2),
            "change": round(change, 2),
            "changePercent": round(change_pct, 2),
            "marketCap": round(market_cap, 2),
            "pe": round(pe, 1) if pe else 0,
            "weekHigh52": round(week_high, 2) if week_high else 0,
            "weekLow52": round(week_low, 2) if week_low else 0
        }
    except Exception as e:
        print(f"Error fetching {stock_info['symbol']}: {e}")
        return None


@router.get("/api/screener/stocks")
def get_screener_stocks(
    sector: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_change: Optional[float] = None,
    max_change: Optional[float] = None
):
    """Get stocks with real-time prices for screening - parallel fetch for speed"""
    stocks_result = []
    
    # Use ThreadPoolExecutor for parallel fetching
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        future_to_stock = {executor.submit(fetch_stock_data, stock): stock for stock in STOCKS_DATA}
        
        for future in concurrent.futures.as_completed(future_to_stock):
            result = future.result()
            if result:
                # Apply filters
                if sector and sector != "All" and result.get("sector") != sector:
                    continue
                if min_price is not None and result["price"] < min_price:
                    continue
                if max_price is not None and result["price"] > max_price:
                    continue
                if min_change is not None and result["changePercent"] < min_change:
                    continue
                if max_change is not None and result["changePercent"] > max_change:
                    continue
                
                stocks_result.append(result)
    
    # Sort by market cap by default
    stocks_result.sort(key=lambda x: x.get("marketCap", 0), reverse=True)
    
    return {
        "stocks": stocks_result,
        "count": len(stocks_result),
        "total": len(STOCKS_DATA),
        "timestamp": datetime.now().isoformat()
    }


@router.get("/api/screener/sectors")
def get_sectors():
    """Get list of available sectors"""
    sectors = list(set(s["sector"] for s in STOCKS_DATA))
    sectors.sort()
    return ["All"] + sectors
