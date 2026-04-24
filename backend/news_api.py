"""
News API endpoints for NEXUS
Provides aggregated financial news from various sources
"""
from fastapi import APIRouter
from datetime import datetime
from dateutil import parser as date_parser
import feedparser
from typing import List, Dict

router = APIRouter()

# RSS Feed sources for financial news
NEWS_SOURCES = [
    {
        "name": "Economic Times - Markets",
        "url": "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
        "category": "markets"
    },
    {
        "name": "MoneyControl",
        "url": "https://www.moneycontrol.com/rss/latestnews.xml",
        "category": "general"
    },
    {
        "name": "Mint",
        "url": "https://www.livemint.com/rss/news",
        "category": "general"
    }
]


def parse_date(date_str: str) -> datetime:
    """Parse various date formats from RSS feeds"""
    if not date_str:
        return datetime.min
    try:
        # Use dateutil parser to handle various formats
        return date_parser.parse(date_str)
    except Exception:
        try:
            # Try common RSS date format
            return datetime.strptime(date_str, "%a, %d %b %Y %H:%M:%S %z")
        except Exception:
            try:
                return datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%S")
            except Exception:
                return datetime.min


def format_date(dt: datetime) -> str:
    """Format date for display"""
    try:
        return dt.strftime("%d/%m/%Y")
    except Exception:
        return ""


def fetch_rss_feed(source: Dict) -> List[Dict]:
    """Fetch and parse RSS feed from a source"""
    news_items = []
    try:
        feed = feedparser.parse(source["url"])
        
        for entry in feed.entries[:8]:  # Get top 8 from each source
            # Parse the published date
            published_str = entry.get("published", entry.get("pubDate", ""))
            published_dt = parse_date(published_str)
            
            # Skip very old news (older than 30 days)
            if published_dt != datetime.min:
                days_old = (datetime.now(published_dt.tzinfo if published_dt.tzinfo else None) - published_dt).days
                if hasattr(published_dt, 'tzinfo') and published_dt.tzinfo:
                    days_old = (datetime.now(published_dt.tzinfo) - published_dt).days
                else:
                    days_old = (datetime.now() - published_dt).days
                
                # Skip news older than 30 days
                if days_old > 30:
                    continue
            
            news_items.append({
                "title": entry.get("title", ""),
                "summary": entry.get("summary", entry.get("description", ""))[:200] + "...",
                "source": source["name"],
                "category": source["category"],
                "url": entry.get("link", ""),
                "timestamp": published_dt.isoformat() if published_dt != datetime.min else datetime.now().isoformat(),
                "published_date": format_date(published_dt) if published_dt != datetime.min else format_date(datetime.now()),
                "_sort_date": published_dt  # For sorting
            })
    except Exception as e:
        print(f"Error fetching {source['name']}: {e}")
    
    return news_items


# Fallback news data (will be given today's date)
def get_fallback_news():
    now = datetime.now()
    return [
        {
            "title": "Markets Rally on Strong Economic Data",
            "summary": "Indian stock markets saw significant gains as manufacturing PMI beats expectations, signaling strong economic recovery.",
            "source": "Economic Times",
            "category": "markets",
            "url": "https://economictimes.indiatimes.com/markets",
            "timestamp": now.isoformat(),
            "published_date": format_date(now),
            "_sort_date": now
        },
        {
            "title": "RBI Maintains Repo Rate Amid Inflation Concerns",
            "summary": "The Reserve Bank of India keeps benchmark interest rate unchanged, citing need to monitor inflation trajectory.",
            "source": "Mint",
            "category": "economy",
            "url": "https://www.livemint.com/economy",
            "timestamp": now.isoformat(),
            "published_date": format_date(now),
            "_sort_date": now
        },
        {
            "title": "IT Sector Leads Market Gains",
            "summary": "Technology stocks outperform broader markets with strong quarterly results from major IT companies.",
            "source": "MoneyControl",
            "category": "stocks",
            "url": "https://www.moneycontrol.com/news/business/markets",
            "timestamp": now.isoformat(),
            "published_date": format_date(now),
            "_sort_date": now
        }
    ]


@router.get("/api/news/latest")
def get_latest_news(category: str = None, limit: int = 12):
    """Get latest financial news - sorted by date (newest first)"""
    all_news = []
    
    # Try to fetch from RSS feeds
    for source in NEWS_SOURCES:
        try:
            items = fetch_rss_feed(source)
            all_news.extend(items)
        except Exception as e:
            print(f"RSS fetch failed for {source['name']}: {e}")
    
    # If no news fetched, use fallback
    if not all_news:
        all_news = get_fallback_news()
    
    # Filter by category if specified
    if category and category != "all":
        all_news = [n for n in all_news if n.get("category") == category]
    
    # Sort by actual datetime (newest first) - this is the key fix!
    all_news.sort(key=lambda x: x.get("_sort_date", datetime.min), reverse=True)
    
    # Remove internal sort field and limit results
    result = []
    for item in all_news[:limit]:
        item_copy = {k: v for k, v in item.items() if not k.startswith("_")}
        result.append(item_copy)
    
    return result


@router.get("/api/news/categories")
def get_news_categories():
    """Get available news categories"""
    return [
        {"id": "all", "name": "All News"},
        {"id": "markets", "name": "Markets"},
        {"id": "stocks", "name": "Stocks"},
        {"id": "crypto", "name": "Cryptocurrency"},
        {"id": "economy", "name": "Economy"},
        {"id": "global", "name": "Global Markets"}
    ]
