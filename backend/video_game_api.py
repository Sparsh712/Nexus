from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import datetime
from pymongo import MongoClient
import os
from dotenv import load_dotenv
import logging
from stock_api import get_stock_quote
import simulator_mongodb as mongo_db

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# MongoDB connection (reusing pattern from portfolio_mongodb.py)
client = None
db = None
collection_balance = None
collection_holdings = None

# In-Memory Fallback
mock_balance = {}
mock_holdings = {}
mock_order_history = {}  # {user_id: [order_records]}
mock_watchlist = {}  # {user_id: [symbols]}
mock_pending_orders = {}  # {user_id: [pending_limit_orders]}
mock_short_positions = {}  # {user_id: [{symbol, qty, entry_price}]}
mock_portfolio_snapshots = {}  # {user_id: [{timestamp, value}]}
mock_stop_orders = {}  # {user_id: [stop_loss_orders]}
mock_achievements = {}  # {user_id: [earned_achievement_ids]}
mock_price_alerts = {}  # {user_id: [{symbol, target_price, direction, triggered}]}

# Achievement Definitions
ACHIEVEMENTS = {
    "first_trade": {"name": "First Trade", "icon": "🎯", "desc": "Complete your first trade"},
    "diversified": {"name": "Diversified", "icon": "📊", "desc": "Hold 3+ different stocks"},
    "profit_1k": {"name": "₹1K Profit", "icon": "💰", "desc": "Earn ₹1,000 in realized profits"},
    "profit_10k": {"name": "₹10K Profit", "icon": "💎", "desc": "Earn ₹10,000 in realized profits"},
    "trade_10": {"name": "Active Trader", "icon": "📈", "desc": "Complete 10 trades"},
    "trade_50": {"name": "Power Trader", "icon": "🚀", "desc": "Complete 50 trades"},
    "short_master": {"name": "Short Master", "icon": "📉", "desc": "Profit from a short position"},
    "stop_loss_saved": {"name": "Risk Manager", "icon": "🛡️", "desc": "Have a stop-loss trigger"},
    "watchlist_5": {"name": "Market Watcher", "icon": "👁️", "desc": "Add 5 stocks to watchlist"},
}

def init_db(uri: str | None = None) -> bool:
    global client, db, collection_balance, collection_holdings
    ready = mongo_db.init_db(uri)
    if not ready:
        logger.error("Simulator MongoDB initialization failed")
        return False

    client = mongo_db.client
    db = mongo_db.db
    collection_balance = mongo_db.col_balance
    collection_holdings = mongo_db.col_holdings
    logger.info("Using MongoDB storage for Simulator")
    return True

router = APIRouter(prefix="/api/simulator", tags=["Simulator"])

# Constants
INITIAL_CASH = 1000000.0  # ₹10 Lakhs
TAX_RATE = 0.001  # 0.1% STT/Brokerage
SLIPPAGE_FACTOR = 0.0005  # 0.05% slippage simulation
MIN_LIQUIDITY_VOLUME = 1000  # Minimum daily volume for liquidity check

# Models
class TradeRequest(BaseModel):
    user_id: str
    symbol: str
    quantity: int
    price: float  # estimated price from frontend
    order_type: str = "market"  # "market" or "limit"
    limit_price: Optional[float] = None

class LimitOrderRequest(BaseModel):
    user_id: str
    symbol: str
    quantity: int
    limit_price: float
    order_type: str  # "buy" or "sell"

class WatchlistRequest(BaseModel):
    user_id: str
    symbol: str

class StopOrderRequest(BaseModel):
    user_id: str
    symbol: str
    quantity: int
    stop_price: float
    order_type: str = "stop_loss"  # "stop_loss", "trailing_stop"
    trailing_percent: Optional[float] = None

class PortfolioSummary(BaseModel):
    cash_balance: float
    total_invested_value: float
    total_current_value: float
    unrealized_pnl: float
    holdings: List[dict]

class PerformanceStats(BaseModel):
    total_return_pct: float
    win_rate: float
    total_trades: int
    profitable_trades: int
    best_trade_pnl: float
    worst_trade_pnl: float


# Helper: Simulate Slippage (price moves slightly against you)
import random
def apply_slippage(price: float, is_buy: bool) -> float:
    slip = price * SLIPPAGE_FACTOR * random.uniform(0.5, 1.5)
    return price + slip if is_buy else price - slip

# Helper: Check Liquidity (mock - in real world would check order book)
async def check_liquidity(symbol: str, quantity: int) -> dict:
    try:
        quote = await get_stock_quote(symbol)
        volume = quote.volume or 100000
        
        # Mock constraint: Can't buy more than 1% of daily volume
        # If volume is 0 or missing, default to high liquidity for sim smoothness
        if volume > 0 and quantity > volume * 0.01:
            return {"ok": False, "reason": f"Order size ({quantity}) exceeds 1% of daily volume ({int(volume * 0.01)})"}
        return {"ok": True, "volume": volume}
    except Exception as e:
        logger.warning(f"Liquidity check failed for {symbol}: {e}")
        return {"ok": True, "volume": 100000}  # Default pass if check fails

# Helper: Record Order to History
def record_order(user_id: str, order: dict):
    order["timestamp"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    # Use simulator storage
    mongo_db.add_order(user_id, order)
    # Also keep in memory for quick access during current session
    if user_id not in mock_order_history:
        mock_order_history[user_id] = []
    mock_order_history[user_id].insert(0, order)
    mock_order_history[user_id] = mock_order_history[user_id][:100]

# Helper: Record Portfolio Snapshot (for charts)
def record_snapshot(user_id: str, value: float):
    # Use simulator storage
    mongo_db.add_snapshot(user_id, value)
    # Also keep in memory for quick access
    if user_id not in mock_portfolio_snapshots:
        mock_portfolio_snapshots[user_id] = []
    mock_portfolio_snapshots[user_id].append({
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "value": value
    })
    mock_portfolio_snapshots[user_id] = mock_portfolio_snapshots[user_id][-30:]

# Helper: Market Hours Check (BYPASSED - Simulator allows trading anytime for practice)
def is_market_open() -> bool:
    # For a simulator, we allow trading 24/7 so users can practice anytime.
    # Especially for Crypto which is 24/7.
    return True
    
    # Real-world logic (disabled for simulator):
    # IST = UTC + 5:30
    # utc_now = datetime.datetime.now(datetime.timezone.utc)
    # ist_now = utc_now + datetime.timedelta(hours=5, minutes=30)
    # if ist_now.weekday() > 4:  # Mon(0) - Fri(4)
    #     return False
    # current_time = ist_now.time()
    # market_open = datetime.time(9, 15)
    # market_close = datetime.time(15, 30)
    # return market_open <= current_time <= market_close

@router.post("/reset/{user_id}")
async def reset_simulator(user_id: str):
    # Primary simulator storage mode - Reset all simulator data
    if collection_balance is None:
        mongo_db.reset_user_data(user_id)
        # Clear in-memory caches
        mock_balance[user_id] = INITIAL_CASH
        mock_holdings[user_id] = []
        mock_order_history[user_id] = []
        mock_watchlist[user_id] = []
        mock_pending_orders[user_id] = []
        mock_short_positions[user_id] = []
        mock_portfolio_snapshots[user_id] = []
        mock_stop_orders[user_id] = []
        mock_achievements[user_id] = []
        mock_price_alerts[user_id] = []
        return {"message": "Simulator fully reset", "balance": INITIAL_CASH}
    
    # DB MODE (MongoDB)
    collection_balance.update_one(
        {"user_id": user_id},
        {"$set": {"cash_balance": INITIAL_CASH, "updated_at": datetime.datetime.utcnow()}},
        upsert=True
    )
    collection_holdings.delete_many({"user_id": user_id})
    return {"message": "Simulator account reset successfully", "balance": INITIAL_CASH}

@router.get("/portfolio/{user_id}", response_model=PortfolioSummary)
async def get_portfolio(user_id: str):
    # Primary simulator storage mode
    if collection_balance is None:
        # Load from storage if not in memory cache (persistence on restart)
        if user_id not in mock_balance:
            mock_balance[user_id] = mongo_db.get_balance(user_id)
        if user_id not in mock_holdings or not mock_holdings[user_id]:
            mock_holdings[user_id] = mongo_db.get_holdings(user_id)
        
        cash = mock_balance.get(user_id, INITIAL_CASH)
        holdings = mock_holdings.get(user_id, [])
        
        total_invested = 0.0
        total_current = 0.0
        portfolio_holdings = []
        
        for h in holdings:
            qty = h["quantity"]
            avg_price = h["avg_price"]
            symbol = h["symbol"]
            
            # Fetch Price
            try:
                quote = await get_stock_quote(symbol)
                current_price = quote.price if quote.price else avg_price
            except Exception as e:
                logger.error(f"Error fetching quote for {symbol}: {e}")
                current_price = avg_price
                
            invested_val = qty * avg_price
            current_val = qty * current_price
            
            total_invested += invested_val
            total_current += current_val
            
            portfolio_holdings.append({
                "symbol": symbol,
                "quantity": qty,
                "avg_price": avg_price,
                "current_price": current_price,
                "invested_value": invested_val,
                "current_value": current_val,
                "pnl": current_val - invested_val,
                "pnl_percent": ((current_val - invested_val) / invested_val * 100) if invested_val > 0 else 0
            })
            
        return {
            "cash_balance": cash,
            "total_invested_value": total_invested,
            "total_current_value": total_current,
            "unrealized_pnl": total_current - total_invested,
            "holdings": portfolio_holdings
        }

    # DB MODE
    bal_doc = collection_balance.find_one({"user_id": user_id})
    cash = bal_doc["cash_balance"] if bal_doc else INITIAL_CASH

    holdings_cursor = collection_holdings.find({"user_id": user_id})
    holdings_list = list(holdings_cursor)
    
    # (Reuse logic for processing holdings - duplicated for safety to avoid messing with indentation of existing code blocks too much)
    # Ideally refactor shared logic, but for direct edit:
    
    total_invested = 0.0
    total_current = 0.0
    portfolio_holdings = []
    
    for h in holdings_list:
        qty = h["quantity"]
        avg_price = h["avg_price"]
        symbol = h["symbol"]
        
        try:
            quote = await get_stock_quote(symbol)
            current_price = quote.price if quote.price else avg_price
        except Exception as e:
            logger.error(f"Error fetching quote for {symbol}: {e}")
            current_price = avg_price 
        
        invested_val = qty * avg_price
        current_val = qty * current_price
        
        total_invested += invested_val
        total_current += current_val
        
        portfolio_holdings.append({
            "symbol": symbol,
            "quantity": qty,
            "avg_price": avg_price,
            "current_price": current_price,
            "invested_value": invested_val,
            "current_value": current_val,
            "pnl": current_val - invested_val,
            "pnl_percent": ((current_val - invested_val) / invested_val * 100) if invested_val > 0 else 0
        })

    return {
        "cash_balance": cash,
        "total_invested_value": total_invested,
        "total_current_value": total_current,
        "unrealized_pnl": total_current - total_invested,
        "holdings": portfolio_holdings
    }

@router.post("/buy")
async def buy_stock(trade: TradeRequest):
    # Check Market Hours
    if not is_market_open():
        raise HTTPException(status_code=400, detail="Market is Closed. Trading hours: 09:15 AM - 03:30 PM IST (Mon-Fri).")

    # Liquidity Check
    liquidity = await check_liquidity(trade.symbol, trade.quantity)
    if not liquidity["ok"]:
        raise HTTPException(status_code=400, detail=liquidity["reason"])

    # Real-time Price Check with Slippage (Market Order)
    try:
        quote = await get_stock_quote(trade.symbol)
        base_price = quote.price
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch price for {trade.symbol}: {e}")

    if not base_price:
        raise HTTPException(status_code=400, detail="Failed to fetch real-time price for execution.")
    
    execution_price = apply_slippage(base_price, is_buy=True)

    # Transaction Costs
    gross_amount = trade.quantity * execution_price
    fees = gross_amount * TAX_RATE
    total_cost = gross_amount + fees

    # Primary simulator storage mode
    if collection_balance is None:
        # Load from storage if not cached
        if trade.user_id not in mock_balance:
            mock_balance[trade.user_id] = mongo_db.get_balance(trade.user_id)
        if trade.user_id not in mock_holdings:
            mock_holdings[trade.user_id] = mongo_db.get_holdings(trade.user_id)
            
        cash = mock_balance.get(trade.user_id, INITIAL_CASH)
        if cash < total_cost:
            raise HTTPException(status_code=400, detail=f"Insufficient funds. Cost: ₹{total_cost:,.2f} (incl. ₹{fees:,.2f} fees)")
            
        # Update Balance
        new_balance = cash - total_cost
        mock_balance[trade.user_id] = new_balance
        mongo_db.set_balance(trade.user_id, new_balance)
        
        # Update Holdings
        user_holdings = mock_holdings.get(trade.user_id, [])
        existing = next((h for h in user_holdings if h["symbol"] == trade.symbol), None)
        
        # Weighted Average Price Calculation - exclude fees for P&L tracking
        cost_basis_adjustment = gross_amount 
        
        if existing:
            new_qty = existing["quantity"] + trade.quantity
            total_cost_old = existing["quantity"] * existing["avg_price"]
            new_avg_price = (total_cost_old + cost_basis_adjustment) / new_qty
            existing["quantity"] = new_qty
            existing["avg_price"] = new_avg_price
            mongo_db.upsert_holding(trade.user_id, trade.symbol, new_qty, new_avg_price)
        else:
            new_avg_price = cost_basis_adjustment / trade.quantity
            user_holdings.append({
                "symbol": trade.symbol,
                "quantity": trade.quantity,
                "avg_price": new_avg_price
            })
            mock_holdings[trade.user_id] = user_holdings
            mongo_db.upsert_holding(trade.user_id, trade.symbol, trade.quantity, new_avg_price)
        
        # Record order to history
        record_order(trade.user_id, {
            "type": "BUY",
            "symbol": trade.symbol,
            "quantity": trade.quantity,
            "execution_price": execution_price,
            "fees": fees,
            "total_cost": total_cost,
            "net_worth": new_balance + sum(h["quantity"] * execution_price if h["symbol"] == trade.symbol else h["quantity"] * h["avg_price"] for h in user_holdings) 
        })
        
        # Record portfolio snapshot - use execution_price for just-traded stock
        portfolio_value = mock_balance[trade.user_id] + sum(
            h["quantity"] * (execution_price if h["symbol"] == trade.symbol else h["avg_price"]) 
            for h in user_holdings
        )
        record_snapshot(trade.user_id, portfolio_value)
            
        return {
            "message": "Buy executed", 
            "new_balance": mock_balance[trade.user_id],
            "execution_price": execution_price,
            "fees": fees,
            "slippage": execution_price - base_price
        }

    # DB MODE
    bal_doc = collection_balance.find_one({"user_id": trade.user_id})
    cash = bal_doc["cash_balance"] if bal_doc else INITIAL_CASH
    
    if cash < total_cost:
        raise HTTPException(status_code=400, detail=f"Insufficient funds. Cost: ₹{total_cost:,.2f}")
    
    new_cash = cash - total_cost
    collection_balance.update_one(
        {"user_id": trade.user_id},
        {"$set": {"cash_balance": new_cash, "updated_at": datetime.datetime.utcnow()}},
        upsert=True
    )
    
    holding = collection_holdings.find_one({"user_id": trade.user_id, "symbol": trade.symbol})
    cost_basis_adjustment = gross_amount

    if holding:
        new_qty = holding["quantity"] + trade.quantity
        total_cost_old = holding["quantity"] * holding["avg_price"]
        new_avg_price = (total_cost_old + cost_basis_adjustment) / new_qty
        
        collection_holdings.update_one(
            {"_id": holding["_id"]},
            {"$set": {"quantity": new_qty, "avg_price": new_avg_price}}
        )
    else:
        collection_holdings.insert_one({
            "user_id": trade.user_id,
            "symbol": trade.symbol,
            "quantity": trade.quantity,
            "avg_price": cost_basis_adjustment / trade.quantity
        })
        
    return {
        "message": "Buy order executed", 
        "new_balance": new_cash,
        "execution_price": execution_price,
        "fees": fees
    }

@router.post("/sell")
async def sell_stock(trade: TradeRequest):
    # Check Market Hours
    if not is_market_open():
        raise HTTPException(status_code=400, detail="Market is Closed. Trading hours: 09:15 AM - 03:30 PM IST (Mon-Fri).")

    # Real-time Price Check (Market Order)
    try:
        quote = await get_stock_quote(trade.symbol)
        execution_price = quote.price
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch price for {trade.symbol}: {e}")

    if not execution_price:
        raise HTTPException(status_code=400, detail="Failed to fetch real-time price for execution.")

    # Transaction Costs (0.1% STT/Brokerage Simulation)
    TAX_RATE = 0.001
    gross_amount = trade.quantity * execution_price
    fees = gross_amount * TAX_RATE
    revenue_net = gross_amount - fees

    # Primary simulator storage mode
    if collection_balance is None:
        # Load from storage if not cached
        if trade.user_id not in mock_balance:
            mock_balance[trade.user_id] = mongo_db.get_balance(trade.user_id)
        if trade.user_id not in mock_holdings:
            mock_holdings[trade.user_id] = mongo_db.get_holdings(trade.user_id)
            
        user_holdings = mock_holdings.get(trade.user_id, [])
        existing = next((h for h in user_holdings if h["symbol"] == trade.symbol), None)
        
        if not existing or existing["quantity"] < trade.quantity:
             raise HTTPException(status_code=400, detail="Insufficient holdings")
             
        # Update Balance
        new_balance = mock_balance.get(trade.user_id, INITIAL_CASH) + revenue_net
        mock_balance[trade.user_id] = new_balance
        mongo_db.set_balance(trade.user_id, new_balance)

        # Calculate P&L
        cost_basis = existing["avg_price"] * trade.quantity
        realized_pnl = revenue_net - cost_basis
        
        # Update Holdings
        existing["quantity"] -= trade.quantity
        if existing["quantity"] == 0:
            user_holdings.remove(existing)
            mongo_db.delete_holding(trade.user_id, trade.symbol)
        else:
            mongo_db.upsert_holding(trade.user_id, trade.symbol, existing["quantity"], existing["avg_price"])
            
        # Record order
        record_order(trade.user_id, {
            "type": "SELL",
            "symbol": trade.symbol,
            "quantity": trade.quantity,
            "execution_price": execution_price,
            "fees": fees,
            "realized_pnl": realized_pnl,
            "total_value": revenue_net
        })

        # Record portfolio snapshot - use execution_price for just-traded stock
        portfolio_value = mock_balance[trade.user_id] + sum(
            h["quantity"] * (execution_price if h["symbol"] == trade.symbol else h["avg_price"]) 
            for h in user_holdings
        )
        record_snapshot(trade.user_id, portfolio_value)
            
        return {
            "message": "Sell executed", 
            "new_balance": mock_balance[trade.user_id],
            "execution_price": execution_price,
            "fees": fees,
            "realized_pnl": realized_pnl
        }

    # DB MODE
    holding = collection_holdings.find_one({"user_id": trade.user_id, "symbol": trade.symbol})
    if not holding or holding["quantity"] < trade.quantity:
        raise HTTPException(status_code=400, detail="Insufficient holdings")
    
    new_qty = holding["quantity"] - trade.quantity
    if new_qty == 0:
        collection_holdings.delete_one({"_id": holding["_id"]})
    else:
        collection_holdings.update_one(
            {"_id": holding["_id"]},
            {"$set": {"quantity": new_qty}}
        )
        
    bal_doc = collection_balance.find_one({"user_id": trade.user_id})
    cash = bal_doc["cash_balance"] if bal_doc else INITIAL_CASH
    
    new_cash = cash + revenue_net
    collection_balance.update_one(
        {"user_id": trade.user_id},
        {"$set": {"cash_balance": new_cash, "updated_at": datetime.datetime.utcnow()}},
        upsert=True
    )

    # Calculate P&L (DB Mode)
    cost_basis = holding["avg_price"] * trade.quantity
    realized_pnl = revenue_net - cost_basis

    # TODO: Implement record_order for DB mode (create collection_orders)
    # For now, we only support In-Memory history fully in this snippets context
    
    return {
        "message": "Sell order executed", 
        "new_balance": new_cash,
        "execution_price": execution_price,
        "fees": fees,
        "realized_pnl": realized_pnl
    }

# ==================== ORDER HISTORY ====================
@router.get("/orders/{user_id}")
async def get_order_history(user_id: str):
    """Get all past orders for a user"""
    # Load from storage if not in memory
    if user_id not in mock_order_history or not mock_order_history[user_id]:
        mock_order_history[user_id] = mongo_db.get_orders(user_id)
    orders = mock_order_history.get(user_id, [])
    return {"orders": orders, "total": len(orders)}

# ==================== PERFORMANCE STATS ====================
@router.get("/performance/{user_id}")
async def get_performance_stats(user_id: str):
    """Calculate performance metrics from order history"""
    # Load from storage if not in memory
    if user_id not in mock_order_history or not mock_order_history[user_id]:
        mock_order_history[user_id] = mongo_db.get_orders(user_id)
    orders = mock_order_history.get(user_id, [])
    
    if not orders:
        return {
            "total_return_pct": 0,
            "win_rate": 0,
            "total_trades": 0,
            "profitable_trades": 0,
            "best_trade_pnl": 0,
            "worst_trade_pnl": 0
        }
    
    # Calculate stats from sell orders (realized P&L)
    sell_orders = [o for o in orders if o.get("type") == "SELL"]
    pnls = [o.get("realized_pnl", 0) for o in sell_orders]
    
    profitable = len([p for p in pnls if p > 0])
    total_trades = len(sell_orders)
    
    return {
        "total_return_pct": sum(pnls) / INITIAL_CASH * 100 if pnls else 0,
        "win_rate": (profitable / total_trades * 100) if total_trades > 0 else 0,
        "total_trades": total_trades,
        "profitable_trades": profitable,
        "best_trade_pnl": max(pnls) if pnls else 0,
        "worst_trade_pnl": min(pnls) if pnls else 0
    }

# ==================== WATCHLIST ====================
@router.get("/watchlist/{user_id}")
async def get_watchlist(user_id: str):
    """Get user's watchlist with live prices"""
    # Load from storage if not in memory
    if user_id not in mock_watchlist or not mock_watchlist[user_id]:
        mock_watchlist[user_id] = mongo_db.get_watchlist(user_id)
    symbols = mock_watchlist.get(user_id, [])
    watchlist_data = []
    
    for symbol in symbols:
        try:
            quote = await get_stock_quote(symbol)
            watchlist_data.append({
                "symbol": symbol,
                "price": quote.price,
                "change": getattr(quote, 'change', 0),
                "change_pct": getattr(quote, 'change_pct', 0)
            })
        except:
            watchlist_data.append({"symbol": symbol, "price": 0, "change": 0, "change_pct": 0})
    
    return {"watchlist": watchlist_data}

@router.post("/watchlist/add")
async def add_to_watchlist(req: WatchlistRequest):
    """Add a stock to watchlist"""
    if req.user_id not in mock_watchlist:
        mock_watchlist[req.user_id] = mongo_db.get_watchlist(req.user_id)
    
    if req.symbol not in mock_watchlist[req.user_id]:
        mock_watchlist[req.user_id].append(req.symbol)
        mongo_db.add_to_watchlist(req.user_id, req.symbol)
    
    return {"message": f"{req.symbol} added to watchlist", "watchlist": mock_watchlist[req.user_id]}

@router.post("/watchlist/remove")
async def remove_from_watchlist(req: WatchlistRequest):
    """Remove a stock from watchlist"""
    if req.user_id not in mock_watchlist:
        mock_watchlist[req.user_id] = mongo_db.get_watchlist(req.user_id)
    if req.user_id in mock_watchlist and req.symbol in mock_watchlist[req.user_id]:
        mock_watchlist[req.user_id].remove(req.symbol)
        mongo_db.remove_from_watchlist(req.user_id, req.symbol)
    
    return {"message": f"{req.symbol} removed from watchlist", "watchlist": mock_watchlist.get(req.user_id, [])}

# ==================== LIMIT ORDERS ====================
@router.get("/pending-orders/{user_id}")
async def get_pending_orders(user_id: str):
    """Get all pending limit orders"""
    # Load from storage if not cached
    if user_id not in mock_pending_orders or not mock_pending_orders[user_id]:
        mock_pending_orders[user_id] = mongo_db.get_pending_orders(user_id)
    orders = mock_pending_orders.get(user_id, [])
    return {"pending_orders": orders}

@router.post("/limit-order")
async def place_limit_order(order: LimitOrderRequest):
    """Place a limit order (will execute when price is reached)"""
    if order.user_id not in mock_pending_orders:
        mock_pending_orders[order.user_id] = []
    
    pending_order = {
        "id": len(mock_pending_orders[order.user_id]) + 1,
        "symbol": order.symbol,
        "quantity": order.quantity,
        "limit_price": order.limit_price,
        "order_type": order.order_type,
        "status": "PENDING",
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    
    mock_pending_orders[order.user_id].append(pending_order)
    
    return {"message": f"Limit order placed for {order.symbol}", "order": pending_order}

@router.delete("/limit-order/{user_id}/{order_id}")
async def cancel_limit_order(user_id: str, order_id: int):
    """Cancel a pending limit order"""
    if user_id in mock_pending_orders:
        mock_pending_orders[user_id] = [o for o in mock_pending_orders[user_id] if o["id"] != order_id]
    
    return {"message": f"Order {order_id} cancelled"}

# ==================== SHORT SELLING ====================
@router.get("/shorts/{user_id}")
async def get_short_positions(user_id: str):
    """Get all short positions"""
    # Load from storage if not cached
    if user_id not in mock_short_positions or not mock_short_positions[user_id]:
        mock_short_positions[user_id] = mongo_db.get_short_positions(user_id)
    positions = mock_short_positions.get(user_id, [])
    
    # Calculate current P&L for each short
    enriched_positions = []
    for pos in positions:
        try:
            quote = await get_stock_quote(pos["symbol"])
            current_price = quote.price
            # Short P&L: Entry price - Current price (profit when price goes down)
            pnl = (pos["entry_price"] - current_price) * pos["quantity"]
            pnl_pct = (pos["entry_price"] - current_price) / pos["entry_price"] * 100
            enriched_positions.append({
                **pos,
                "current_price": current_price,
                "pnl": pnl,
                "pnl_pct": pnl_pct
            })
        except:
            enriched_positions.append(pos)
    
    return {"short_positions": enriched_positions}

@router.post("/short")
async def short_stock(trade: TradeRequest):
    """Open a short position (borrow and sell)"""
    if not is_market_open():
        raise HTTPException(status_code=400, detail="Market is Closed.")
    
    # Get current price
    try:
        quote = await get_stock_quote(trade.symbol)
        execution_price = apply_slippage(quote.price, is_buy=False)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch price for {trade.symbol}: {e}")
    
    # Add proceeds to balance (you get cash when you short)
    fees = execution_price * trade.quantity * TAX_RATE
    proceeds = execution_price * trade.quantity - fees
    
    # Load from storage if not cached
    if trade.user_id not in mock_short_positions:
        mock_short_positions[trade.user_id] = mongo_db.get_short_positions(trade.user_id)
    if trade.user_id not in mock_balance:
        mock_balance[trade.user_id] = mongo_db.get_balance(trade.user_id)
    
    # Check if already have a short in this symbol
    existing = next((p for p in mock_short_positions[trade.user_id] if p["symbol"] == trade.symbol), None)
    
    if existing:
        # Average down the short
        total_qty = existing["quantity"] + trade.quantity
        weighted_price = (existing["entry_price"] * existing["quantity"] + execution_price * trade.quantity) / total_qty
        existing["quantity"] = total_qty
        existing["entry_price"] = weighted_price
        mongo_db.upsert_short_position(trade.user_id, trade.symbol, total_qty, weighted_price)
    else:
        mock_short_positions[trade.user_id].append({
            "symbol": trade.symbol,
            "quantity": trade.quantity,
            "entry_price": execution_price
        })
        mongo_db.upsert_short_position(trade.user_id, trade.symbol, trade.quantity, execution_price)
    
    new_balance = mock_balance.get(trade.user_id, INITIAL_CASH) + proceeds
    mock_balance[trade.user_id] = new_balance
    mongo_db.set_balance(trade.user_id, new_balance)
    
    # Record order
    record_order(trade.user_id, {
        "type": "SHORT",
        "symbol": trade.symbol,
        "quantity": trade.quantity,
        "execution_price": execution_price,
        "fees": fees
    })
    
    return {
        "message": f"Short position opened for {trade.symbol}",
        "execution_price": execution_price,
        "proceeds": proceeds,
        "fees": fees,
        "new_balance": mock_balance[trade.user_id]
    }

@router.post("/cover")
async def cover_short(trade: TradeRequest):
    """Close a short position (buy back shares)"""
    if not is_market_open():
        raise HTTPException(status_code=400, detail="Market is Closed.")
    
    # Load from storage if not cached
    if trade.user_id not in mock_short_positions:
        mock_short_positions[trade.user_id] = mongo_db.get_short_positions(trade.user_id)
    if trade.user_id not in mock_balance:
        mock_balance[trade.user_id] = mongo_db.get_balance(trade.user_id)
    
    positions = mock_short_positions.get(trade.user_id, [])
    existing = next((p for p in positions if p["symbol"] == trade.symbol), None)
    
    if not existing or existing["quantity"] < trade.quantity:
        raise HTTPException(status_code=400, detail="Insufficient short position to cover")
    
    # Get current price
    try:
        quote = await get_stock_quote(trade.symbol)
        execution_price = apply_slippage(quote.price, is_buy=True) # Cover is a buy-back
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch price for {trade.symbol}: {e}")
    
    # Calculate cost to cover
    fees = execution_price * trade.quantity * TAX_RATE
    cost = execution_price * trade.quantity + fees
    
    # Calculate P&L
    realized_pnl = (existing["entry_price"] - execution_price) * trade.quantity - fees
    
    # Deduct from balance
    cash = mock_balance.get(trade.user_id, INITIAL_CASH)
    if cash < cost:
        raise HTTPException(status_code=400, detail=f"Insufficient funds to cover. Need ₹{cost:,.2f}")
    
    new_balance = cash - cost
    mock_balance[trade.user_id] = new_balance
    mongo_db.set_balance(trade.user_id, new_balance)
    
    # Update short position
    existing["quantity"] -= trade.quantity
    if existing["quantity"] == 0:
        positions.remove(existing)
        mongo_db.delete_short_position(trade.user_id, trade.symbol)
    else:
        mongo_db.upsert_short_position(trade.user_id, trade.symbol, existing["quantity"], existing["entry_price"])
    
    # Record order
    record_order(trade.user_id, {
        "type": "COVER",
        "symbol": trade.symbol,
        "quantity": trade.quantity,
        "execution_price": execution_price,
        "fees": fees,
        "realized_pnl": realized_pnl
    })
    
    return {
        "message": f"Short position covered for {trade.symbol}",
        "execution_price": execution_price,
        "realized_pnl": realized_pnl,
        "fees": fees,
        "new_balance": mock_balance[trade.user_id]
    }

# ==================== PORTFOLIO SNAPSHOTS (for charts) ====================
@router.get("/snapshots/{user_id}")
async def get_portfolio_snapshots(user_id: str):
    """Get portfolio value history for charts"""
    # Load from storage if not in memory
    if user_id not in mock_portfolio_snapshots or not mock_portfolio_snapshots[user_id]:
        mock_portfolio_snapshots[user_id] = mongo_db.get_snapshots(user_id)
    snapshots = mock_portfolio_snapshots.get(user_id, [])
    return {"snapshots": snapshots}

# ==================== STOP-LOSS ORDERS ====================
@router.get("/stop-orders/{user_id}")
async def get_stop_orders(user_id: str):
    """Get all active stop-loss orders"""
    # Load from storage if not in memory
    if user_id not in mock_stop_orders or not mock_stop_orders[user_id]:
        mock_stop_orders[user_id] = mongo_db.get_stop_orders(user_id)
    orders = mock_stop_orders.get(user_id, [])
    
    # Enrich with current price and status
    enriched = []
    for order in orders:
        try:
            quote = await get_stock_quote(order["symbol"])
            current_price = quote.price
            
            # Check if stop should trigger
            triggered = current_price <= order["stop_price"]
            
            enriched.append({
                **order,
                "current_price": current_price,
                "triggered": triggered,
                "distance_pct": ((current_price - order["stop_price"]) / current_price) * 100
            })
        except:
            enriched.append(order)
    
    return {"stop_orders": enriched}

@router.post("/stop-order")
async def create_stop_order(order: StopOrderRequest):
    """Create a new stop-loss order"""
    # Load from storage if not cached
    if order.user_id not in mock_stop_orders:
        mock_stop_orders[order.user_id] = mongo_db.get_stop_orders(order.user_id)
    if order.user_id not in mock_holdings:
        mock_holdings[order.user_id] = mongo_db.get_holdings(order.user_id)
    
    # Check if user has the holdings
    user_holdings = mock_holdings.get(order.user_id, [])
    holding = next((h for h in user_holdings if h["symbol"] == order.symbol), None)
    
    if not holding or holding["quantity"] < order.quantity:
        raise HTTPException(status_code=400, detail="Insufficient holdings to create stop-loss order")
    
    # Get current price
    quote = await get_stock_quote(order.symbol)
    current_price = quote.price
    
    if order.stop_price >= current_price:
        raise HTTPException(status_code=400, detail=f"Stop price (₹{order.stop_price}) must be below current price (₹{current_price:.2f})")
    
    # Add to storage and get ID
    order_id = mongo_db.add_stop_order(
        order.user_id, order.symbol, order.quantity, order.stop_price,
        order.order_type, order.trailing_percent, current_price
    )
    
    stop_order = {
        "id": order_id,
        "symbol": order.symbol,
        "quantity": order.quantity,
        "stop_price": order.stop_price,
        "order_type": order.order_type,
        "trailing_percent": order.trailing_percent,
        "status": "ACTIVE",
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "entry_price": current_price
    }
    
    mock_stop_orders[order.user_id].append(stop_order)
    
    return {
        "message": f"Stop-loss order created for {order.symbol}",
        "order": stop_order
    }

@router.delete("/stop-order/{user_id}/{order_id}")
async def cancel_stop_order(user_id: str, order_id: int):
    """Cancel a stop-loss order"""
    if user_id not in mock_stop_orders:
        mock_stop_orders[user_id] = mongo_db.get_stop_orders(user_id)
    if user_id in mock_stop_orders:
        mock_stop_orders[user_id] = [o for o in mock_stop_orders[user_id] if o["id"] != order_id]
    mongo_db.delete_stop_order(user_id, order_id)
    
    return {"message": f"Stop-loss order {order_id} cancelled"}

@router.post("/trigger-stops/{user_id}")
async def trigger_stop_orders(user_id: str):
    """Check and execute triggered stop-loss orders (called by frontend on refresh)"""
    # Load stop orders from storage if not in memory
    if user_id not in mock_stop_orders or not mock_stop_orders[user_id]:
        mock_stop_orders[user_id] = mongo_db.get_stop_orders(user_id)
    
    # Load holdings from storage if not in memory
    if user_id not in mock_holdings or not mock_holdings[user_id]:
        mock_holdings[user_id] = mongo_db.get_holdings(user_id)
    
    # Load balance from storage if not in memory
    if user_id not in mock_balance:
        mock_balance[user_id] = mongo_db.get_balance(user_id)
    
    orders = mock_stop_orders.get(user_id, [])
    triggered_orders = []
    
    for order in orders[:]:  # Copy list to modify during iteration
        try:
            quote = await get_stock_quote(order["symbol"])
            current_price = quote.price
            
            if current_price <= order["stop_price"] and order.get("status") == "ACTIVE":
                # Get fresh holdings reference
                user_holdings = mock_holdings.get(user_id, [])
                holding = next((h for h in user_holdings if h["symbol"] == order["symbol"]), None)
                
                logger.info(f"Stop triggered for {order['symbol']}: price {current_price} <= stop {order['stop_price']}")
                logger.info(f"Holding found: {holding}")
                
                if holding and holding["quantity"] >= order["quantity"]:
                    # Execute sell
                    fees = current_price * order["quantity"] * TAX_RATE
                    revenue = current_price * order["quantity"] - fees
                    
                    # Calculate realized P&L
                    cost_basis = holding["avg_price"] * order["quantity"]
                    realized_pnl = revenue - cost_basis
                    
                    # Update holding
                    holding["quantity"] -= order["quantity"]
                    if holding["quantity"] == 0:
                        user_holdings.remove(holding)
                        mongo_db.delete_holding(user_id, order["symbol"])
                    else:
                        mongo_db.upsert_holding(user_id, order["symbol"], holding["quantity"], holding["avg_price"])
                    
                    # Update balance
                    new_balance = mock_balance.get(user_id, INITIAL_CASH) + revenue
                    mock_balance[user_id] = new_balance
                    mongo_db.set_balance(user_id, new_balance)
                    
                    # Record order
                    record_order(user_id, {
                        "type": "STOP-LOSS",
                        "symbol": order["symbol"],
                        "quantity": order["quantity"],
                        "execution_price": current_price,
                        "stop_price": order["stop_price"],
                        "fees": fees,
                        "realized_pnl": realized_pnl
                    })
                    
                    # Update order status and remove from active
                    order["status"] = "EXECUTED"
                    orders.remove(order)
                    mongo_db.delete_stop_order(user_id, order["id"])
                    
                    triggered_orders.append({
                        **order,
                        "execution_price": current_price,
                        "revenue": revenue,
                        "realized_pnl": realized_pnl
                    })
                    
                    logger.info(f"Stop-loss executed: sold {order['quantity']} {order['symbol']} @ {current_price}")
                else:
                    logger.warning(f"Stop triggered but insufficient holdings: need {order['quantity']}, have {holding['quantity'] if holding else 0}")
        except Exception as e:
            logger.error(f"Error checking stop order: {e}")
    
    return {"triggered": triggered_orders, "remaining": len(orders)}

# ==================== LIMIT ORDERS (PENDING) ====================
class LimitOrder(BaseModel):
    user_id: str
    symbol: str
    quantity: int
    order_type: str  # 'buy' or 'sell'
    limit_price: float

@router.get("/pending-orders/{user_id}")
async def get_pending_limit_orders(user_id: str):
    """Get all pending limit orders for a user"""
    orders = mock_pending_orders.get(user_id, [])
    return {"pending_orders": orders}

@router.post("/limit-order")
async def place_limit_order(order: LimitOrder):
    """Place a new limit order that executes when target price is reached"""
    if order.user_id not in mock_pending_orders:
        mock_pending_orders[order.user_id] = []
    
    new_order = {
        "id": f"LO_{order.user_id}_{len(mock_pending_orders[order.user_id])}_{datetime.datetime.now().timestamp()}",
        "symbol": order.symbol,
        "quantity": order.quantity,
        "order_type": order.order_type,
        "limit_price": order.limit_price,
        "status": "PENDING",
        "created_at": datetime.datetime.now().isoformat()
    }
    
    mock_pending_orders[order.user_id].append(new_order)
    
    return {"message": "Limit order placed", "order": new_order}

@router.delete("/limit-order/{user_id}/{order_id}")
async def cancel_limit_order(user_id: str, order_id: str):
    """Cancel a pending limit order"""
    orders = mock_pending_orders.get(user_id, [])
    order_to_remove = next((o for o in orders if o["id"] == order_id), None)
    
    if not order_to_remove:
        raise HTTPException(status_code=404, detail="Order not found")
    
    orders.remove(order_to_remove)
    return {"message": "Order cancelled", "order_id": order_id}

@router.get("/check-limit-orders/{user_id}")
async def check_limit_orders(user_id: str):
    """Check pending limit orders and execute any that meet the price condition"""
    pending = mock_pending_orders.get(user_id, [])
    executed = []
    
    for order in pending[:]:  # Iterate over copy to allow removal
        try:
            # Get current price
            quote = await get_stock_quote(order["symbol"])
            if not quote:
                continue
            
            current_price = quote.price
            if not current_price:
                continue
            
            limit_price = order["limit_price"]
            order_type = order["order_type"]
            
            should_execute = False
            
            # For buy orders: execute when current price <= limit price
            if order_type == "buy" and current_price <= limit_price:
                should_execute = True
            # For sell orders: execute when current price >= limit price
            elif order_type == "sell" and current_price >= limit_price:
                should_execute = True
            
            if should_execute:
                # Execute the order
                quantity = order["quantity"]
                fees = current_price * quantity * TAX_RATE
                
                if order_type == "buy":
                    total_cost = current_price * quantity + fees
                    
                    # Check balance
                    balance = mock_balance.get(user_id, INITIAL_CASH)
                    if balance >= total_cost:
                        # Deduct balance
                        mock_balance[user_id] = balance - total_cost
                        
                        # Add to holdings
                        if user_id not in mock_holdings:
                            mock_holdings[user_id] = []
                        user_holdings = mock_holdings[user_id]
                        existing = next((h for h in user_holdings if h["symbol"] == order["symbol"]), None)
                        
                        if existing:
                            new_qty = existing["quantity"] + quantity
                            total_cost_old = existing["quantity"] * existing["avg_price"]
                            new_avg_price = (total_cost_old + total_cost) / new_qty
                            existing["quantity"] = new_qty
                            existing["avg_price"] = new_avg_price
                            existing["current_price"] = current_price
                        else:
                            user_holdings.append({
                                "symbol": order["symbol"],
                                "quantity": quantity,
                                "avg_price": total_cost / quantity,
                                "current_price": current_price
                            })
                        
                        # Record order
                        record_order(user_id, {
                            "type": "LIMIT-BUY",
                            "symbol": order["symbol"],
                            "quantity": quantity,
                            "execution_price": current_price,
                            "limit_price": limit_price,
                            "fees": fees
                        })
                        
                        order["status"] = "EXECUTED"
                        executed.append(order)
                        pending.remove(order)
                
                elif order_type == "sell":
                    # Check holdings
                    user_holdings = mock_holdings.get(user_id, [])
                    holding = next((h for h in user_holdings if h["symbol"] == order["symbol"]), None)
                    
                    if holding and holding["quantity"] >= quantity:
                        revenue = current_price * quantity - fees
                        mock_balance[user_id] = mock_balance.get(user_id, INITIAL_CASH) + revenue
                        
                        # Calculate P&L
                        cost_basis = holding["avg_price"] * quantity
                        realized_pnl = revenue - cost_basis
                        
                        holding["quantity"] -= quantity
                        holding["current_price"] = current_price # Update price
                        if holding["quantity"] == 0:
                            user_holdings.remove(holding)
                        
                        # Record order
                        record_order(user_id, {
                            "type": "LIMIT-SELL",
                            "symbol": order["symbol"],
                            "quantity": quantity,
                            "execution_price": current_price,
                            "limit_price": limit_price,
                            "fees": fees,
                            "realized_pnl": realized_pnl
                        })
                        
                        order["status"] = "EXECUTED"
                        executed.append(order)
                        pending.remove(order)
                        
        except Exception as e:
            logger.error(f"Error checking limit order: {e}")
            continue
            
    # Record snapshot if any orders executed
    if executed:
        current_bal = mock_balance.get(user_id, INITIAL_CASH)
        user_holdings = mock_holdings.get(user_id, [])
        holdings_val = sum(h["quantity"] * h.get("current_price", h["avg_price"]) for h in user_holdings)
        record_snapshot(user_id, current_bal + holdings_val)
    
    return {
        "executed": executed,
        "pending_count": len(pending),
        "message": f"Executed {len(executed)} limit order(s)"
    }

# ==================== ACHIEVEMENTS ====================
def check_achievements(user_id: str) -> list:
    """Check and award achievements based on user activity"""
    # Load from storage if not cached
    if user_id not in mock_achievements:
        mock_achievements[user_id] = mongo_db.get_achievements(user_id)
    if user_id not in mock_order_history:
        mock_order_history[user_id] = mongo_db.get_orders(user_id)
    if user_id not in mock_holdings:
        mock_holdings[user_id] = mongo_db.get_holdings(user_id)
    if user_id not in mock_watchlist:
        mock_watchlist[user_id] = mongo_db.get_watchlist(user_id)
    
    earned = mock_achievements.get(user_id, [])
    new_achievements = []
    
    orders = mock_order_history.get(user_id, [])
    holdings = mock_holdings.get(user_id, [])
    watchlist = mock_watchlist.get(user_id, [])
    
    # First Trade
    if "first_trade" not in earned and len(orders) >= 1:
        new_achievements.append("first_trade")
    
    # Diversified (3+ stocks)
    if "diversified" not in earned and len(holdings) >= 3:
        new_achievements.append("diversified")
    
    # Trade milestones
    if "trade_10" not in earned and len(orders) >= 10:
        new_achievements.append("trade_10")
    if "trade_50" not in earned and len(orders) >= 50:
        new_achievements.append("trade_50")
    
    # Profit milestones
    sell_orders = [o for o in orders if o.get("type") in ["SELL", "COVER"]]
    total_profit = sum(o.get("realized_pnl", 0) for o in sell_orders if o.get("realized_pnl", 0) > 0)
    if "profit_1k" not in earned and total_profit >= 1000:
        new_achievements.append("profit_1k")
    if "profit_10k" not in earned and total_profit >= 10000:
        new_achievements.append("profit_10k")
    
    # Short Master (profitable short)
    cover_orders = [o for o in orders if o.get("type") == "COVER" and o.get("realized_pnl", 0) > 0]
    if "short_master" not in earned and len(cover_orders) > 0:
        new_achievements.append("short_master")
    
    # Watchlist
    if "watchlist_5" not in earned and len(watchlist) >= 5:
        new_achievements.append("watchlist_5")
    
    # Stop loss triggered
    stop_orders = [o for o in orders if o.get("type") == "STOP-LOSS"]
    if "stop_loss_saved" not in earned and len(stop_orders) > 0:
        new_achievements.append("stop_loss_saved")
    
    # Add new achievements
    if new_achievements:
        if user_id not in mock_achievements:
            mock_achievements[user_id] = []
        mock_achievements[user_id].extend(new_achievements)
        # Persist to storage
        for ach_id in new_achievements:
            mongo_db.add_achievement(user_id, ach_id)
    
    return new_achievements

@router.get("/achievements/{user_id}")
async def get_achievements(user_id: str):
    """Get all achievements with earned status"""
    # Check for new achievements
    new = check_achievements(user_id)
    earned = mock_achievements.get(user_id, [])
    
    result = []
    for aid, adata in ACHIEVEMENTS.items():
        result.append({
            "id": aid,
            "name": adata["name"],
            "icon": adata["icon"],
            "description": adata["desc"],
            "earned": aid in earned
        })
    
    return {
        "achievements": result,
        "total_earned": len(earned),
        "total_available": len(ACHIEVEMENTS),
        "new_achievements": new
    }

# ==================== PRICE ALERTS ====================
class PriceAlertRequest(BaseModel):
    user_id: str
    symbol: str
    target_price: float
    direction: str  # "above" or "below"

@router.get("/alerts/{user_id}")
async def get_price_alerts(user_id: str):
    """Get all price alerts with current status"""
    # Load from storage if not cached
    if user_id not in mock_price_alerts or not mock_price_alerts[user_id]:
        mock_price_alerts[user_id] = mongo_db.get_price_alerts(user_id)
    alerts = mock_price_alerts.get(user_id, [])
    
    # Enrich with current prices
    enriched = []
    for alert in alerts:
        try:
            quote = await get_stock_quote(alert["symbol"])
            current = quote.price
            
            # Check if triggered
            triggered = (alert["direction"] == "above" and current >= alert["target_price"]) or \
                       (alert["direction"] == "below" and current <= alert["target_price"])
            
            enriched.append({
                **alert,
                "current_price": current,
                "triggered": triggered,
                "distance_pct": abs((current - alert["target_price"]) / current) * 100
            })
        except:
            enriched.append(alert)
    
    return {"alerts": enriched}

@router.post("/alert")
async def create_price_alert(alert: PriceAlertRequest):
    """Create a new price alert"""
    # Load from storage if not cached
    if alert.user_id not in mock_price_alerts:
        mock_price_alerts[alert.user_id] = mongo_db.get_price_alerts(alert.user_id)
    
    # Get current price
    try:
        quote = await get_stock_quote(alert.symbol)
        current = quote.price
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch price for {alert.symbol}: {e}")
    
    # Add to storage and get ID
    alert_id = mongo_db.add_price_alert(alert.user_id, alert.symbol, alert.target_price, alert.direction)
    
    new_alert = {
        "id": alert_id,
        "symbol": alert.symbol,
        "target_price": alert.target_price,
        "direction": alert.direction,
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "triggered": False
    }
    
    mock_price_alerts[alert.user_id].append(new_alert)
    
    return {
        "message": f"Alert created: {alert.symbol} {alert.direction} ₹{alert.target_price}",
        "alert": new_alert,
        "current_price": current
    }

@router.delete("/alert/{user_id}/{alert_id}")
async def delete_price_alert(user_id: str, alert_id: int):
    """Delete a price alert"""
    if user_id not in mock_price_alerts:
        mock_price_alerts[user_id] = mongo_db.get_price_alerts(user_id)
    if user_id in mock_price_alerts:
        mock_price_alerts[user_id] = [a for a in mock_price_alerts[user_id] if a["id"] != alert_id]
    mongo_db.delete_price_alert(user_id, alert_id)
    return {"message": f"Alert {alert_id} deleted"}

