"""
MongoDB Storage Module for Simulator
Provides persistent storage for all simulator data using MongoDB.
"""

import json
import datetime
import logging
import os
from pymongo import MongoClient
from urllib.parse import quote_plus
from dotenv import load_dotenv

# SSL certificates for cloud deployments
try:
    import certifi
    SSL_CA = certifi.where()
except ImportError:
    SSL_CA = None

logger = logging.getLogger(__name__)
load_dotenv()

# MongoDB connection
client = None
db = None

# Collection references
col_balance = None
col_holdings = None
col_orders = None
col_watchlist = None
col_pending_orders = None
col_short_positions = None
col_snapshots = None
col_stop_orders = None
col_achievements = None
col_price_alerts = None

INITIAL_CASH = 1000000.0


def _normalize_mongodb_uri(uri: str | None) -> str | None:
    """Normalize URI and reject template placeholders before connecting."""
    if not uri:
        return None

    cleaned = uri.strip().strip('"').strip("'")
    if not cleaned:
        return None

    if '<' in cleaned or '>' in cleaned or 'your_mongodb_connection_string' in cleaned:
        return None

    if cleaned.startswith('mongodb+srv://') and '@' in cleaned:
        prefix, rest = cleaned.split('://', 1)
        credentials, host_part = rest.split('@', 1)
        if ':' in credentials:
            username, password = credentials.split(':', 1)
            encoded_password = quote_plus(password)
            cleaned = f"{prefix}://{username}:{encoded_password}@{host_part}"

    return cleaned


def init_db(uri: str | None = None) -> bool:
    """Initialize MongoDB connection and collections."""
    global client, db, col_balance, col_holdings, col_orders, col_watchlist
    global col_pending_orders, col_short_positions, col_snapshots, col_stop_orders
    global col_achievements, col_price_alerts

    uri = _normalize_mongodb_uri(uri or os.getenv('MONGODB_URI'))
    allow_invalid_certs = os.getenv('MONGODB_TLS_ALLOW_INVALID_CERTS', 'false').lower() in {'1', 'true', 'yes', 'on'}
    if not uri:
        logger.warning("MONGODB_URI missing/invalid template value: simulator will run with in-memory fallback.")
        return False

    try:
        client_options = {
            'serverSelectionTimeoutMS': int(os.getenv('MONGODB_SERVER_SELECTION_TIMEOUT_MS', '8000')),
            'connectTimeoutMS': int(os.getenv('MONGODB_CONNECT_TIMEOUT_MS', '10000')),
            'socketTimeoutMS': int(os.getenv('MONGODB_SOCKET_TIMEOUT_MS', '10000')),
            'tlsAllowInvalidCertificates': allow_invalid_certs,
            'retryWrites': True,
            'appname': 'nexus-backend-simulator',
        }

        # Use certifi SSL certs if available.
        if SSL_CA:
            client_options['tlsCAFile'] = SSL_CA
            client = MongoClient(uri, **client_options)
        else:
            client_options['tls'] = True
            client = MongoClient(uri, **client_options)

        # Trigger server selection immediately and fail fast on startup.
        client.admin.command('ping')
        db = client.nexus_simulator

        # Initialize collections
        col_balance = db.sim_balance
        col_holdings = db.sim_holdings
        col_orders = db.sim_orders
        col_watchlist = db.sim_watchlist
        col_pending_orders = db.sim_pending_orders
        col_short_positions = db.sim_short_positions
        col_snapshots = db.sim_snapshots
        col_stop_orders = db.sim_stop_orders
        col_achievements = db.sim_achievements
        col_price_alerts = db.sim_price_alerts

        # Create indexes
        col_balance.create_index("user_id", unique=True)
        col_holdings.create_index([("user_id", 1), ("symbol", 1)], unique=True)
        col_orders.create_index("user_id")
        col_watchlist.create_index([("user_id", 1), ("symbol", 1)], unique=True)
        col_pending_orders.create_index("user_id")
        col_short_positions.create_index([("user_id", 1), ("symbol", 1)], unique=True)
        col_snapshots.create_index("user_id")
        col_stop_orders.create_index("user_id")
        col_achievements.create_index([("user_id", 1), ("achievement_id", 1)], unique=True)
        col_price_alerts.create_index("user_id")

        logger.info("MongoDB simulator database initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Simulator MongoDB unavailable, in-memory fallback enabled: {str(e)}")
        client = None
        db = None
        col_balance = None
        col_holdings = None
        col_orders = None
        col_watchlist = None
        col_pending_orders = None
        col_short_positions = None
        col_snapshots = None
        col_stop_orders = None
        col_achievements = None
        col_price_alerts = None
        return False


# ==================== BALANCE OPERATIONS ====================

def get_balance(user_id: str) -> float:
    """Get user's cash balance."""
    if col_balance is None:
        return INITIAL_CASH
    doc = col_balance.find_one({"user_id": user_id})
    return doc["cash_balance"] if doc else INITIAL_CASH


def set_balance(user_id: str, balance: float):
    """Set user's cash balance."""
    if col_balance is None:
        return
    col_balance.update_one(
        {"user_id": user_id},
        {"$set": {"cash_balance": balance, "updated_at": datetime.datetime.utcnow()}},
        upsert=True
    )


# ==================== HOLDINGS OPERATIONS ====================

def get_holdings(user_id: str) -> list:
    """Get user's holdings."""
    if col_holdings is None:
        return []
    docs = col_holdings.find({"user_id": user_id})
    return [{"symbol": d["symbol"], "quantity": d["quantity"], "avg_price": d["avg_price"]} for d in docs]


def get_holding(user_id: str, symbol: str) -> dict:
    """Get a specific holding."""
    if col_holdings is None:
        return None
    doc = col_holdings.find_one({"user_id": user_id, "symbol": symbol})
    if doc:
        return {"symbol": doc["symbol"], "quantity": doc["quantity"], "avg_price": doc["avg_price"]}
    return None


def upsert_holding(user_id: str, symbol: str, quantity: int, avg_price: float):
    """Insert or update a holding."""
    if col_holdings is None:
        return
    col_holdings.update_one(
        {"user_id": user_id, "symbol": symbol},
        {"$set": {"quantity": quantity, "avg_price": avg_price}},
        upsert=True
    )


def delete_holding(user_id: str, symbol: str):
    """Delete a holding (when quantity reaches zero)."""
    if col_holdings is None:
        return
    col_holdings.delete_one({"user_id": user_id, "symbol": symbol})


# ==================== ORDERS OPERATIONS ====================

def add_order(user_id: str, order: dict):
    """Add an order to history."""
    if col_orders is None:
        return
    order_doc = {
        "user_id": user_id,
        "order_type": order.get("type", ""),
        "symbol": order.get("symbol", ""),
        "quantity": order.get("quantity", 0),
        "execution_price": order.get("execution_price"),
        "fees": order.get("fees"),
        "total_cost": order.get("total_cost"),
        "total_value": order.get("total_value"),
        "realized_pnl": order.get("realized_pnl"),
        "limit_price": order.get("limit_price"),
        "stop_price": order.get("stop_price"),
        "order_data": order,
        "timestamp": order.get("timestamp", datetime.datetime.utcnow().isoformat())
    }
    col_orders.insert_one(order_doc)


def get_orders(user_id: str, limit: int = 100) -> list:
    """Get user's order history."""
    if col_orders is None:
        return []
    docs = col_orders.find({"user_id": user_id}).sort("timestamp", -1).limit(limit)
    orders = []
    for d in docs:
        order = d.get("order_data", {})
        order["timestamp"] = d.get("timestamp")
        orders.append(order)
    return orders


# ==================== WATCHLIST OPERATIONS ====================

def get_watchlist(user_id: str) -> list:
    """Get user's watchlist symbols."""
    if col_watchlist is None:
        return []
    docs = col_watchlist.find({"user_id": user_id})
    return [d["symbol"] for d in docs]


def add_to_watchlist(user_id: str, symbol: str):
    """Add symbol to watchlist."""
    if col_watchlist is None:
        return
    try:
        col_watchlist.insert_one({
            "user_id": user_id,
            "symbol": symbol,
            "added_at": datetime.datetime.utcnow()
        })
    except Exception:
        pass  # Already exists


def remove_from_watchlist(user_id: str, symbol: str):
    """Remove symbol from watchlist."""
    if col_watchlist is None:
        return
    col_watchlist.delete_one({"user_id": user_id, "symbol": symbol})


# ==================== PENDING ORDERS OPERATIONS ====================

def get_pending_orders(user_id: str) -> list:
    """Get pending limit orders."""
    if col_pending_orders is None:
        return []
    docs = col_pending_orders.find({"user_id": user_id, "status": "PENDING"})
    result = []
    for d in docs:
        result.append({
            "id": str(d.get("_id")),
            "user_id": d.get("user_id"),
            "symbol": d.get("symbol"),
            "quantity": d.get("quantity"),
            "limit_price": d.get("limit_price"),
            "order_type": d.get("order_type"),
            "status": d.get("status"),
            "created_at": d.get("created_at")
        })
    return result


def add_pending_order(user_id: str, order_id: str, symbol: str, quantity: int, limit_price: float, order_type: str):
    """Add a pending limit order."""
    if col_pending_orders is None:
        return
    col_pending_orders.insert_one({
        "order_id": order_id,
        "user_id": user_id,
        "symbol": symbol,
        "quantity": quantity,
        "limit_price": limit_price,
        "order_type": order_type,
        "status": "PENDING",
        "created_at": datetime.datetime.utcnow()
    })


def remove_pending_order(order_id: str):
    """Remove a pending order."""
    if col_pending_orders is None:
        return
    from bson.objectid import ObjectId
    try:
        col_pending_orders.delete_one({"_id": ObjectId(order_id)})
    except Exception:
        col_pending_orders.delete_one({"order_id": order_id})


def update_pending_order_status(order_id: str, status: str):
    """Update pending order status."""
    if col_pending_orders is None:
        return
    from bson.objectid import ObjectId
    try:
        col_pending_orders.update_one({"_id": ObjectId(order_id)}, {"$set": {"status": status}})
    except Exception:
        col_pending_orders.update_one({"order_id": order_id}, {"$set": {"status": status}})


# ==================== SHORT POSITIONS OPERATIONS ====================

def get_short_positions(user_id: str) -> list:
    """Get user's short positions."""
    if col_short_positions is None:
        return []
    docs = col_short_positions.find({"user_id": user_id})
    return [{"symbol": d["symbol"], "quantity": d["quantity"], "entry_price": d["entry_price"]} for d in docs]


def get_short_position(user_id: str, symbol: str) -> dict:
    """Get a specific short position."""
    if col_short_positions is None:
        return None
    doc = col_short_positions.find_one({"user_id": user_id, "symbol": symbol})
    if doc:
        return {"symbol": doc["symbol"], "quantity": doc["quantity"], "entry_price": doc["entry_price"]}
    return None


def upsert_short_position(user_id: str, symbol: str, quantity: int, entry_price: float):
    """Insert or update a short position."""
    if col_short_positions is None:
        return
    col_short_positions.update_one(
        {"user_id": user_id, "symbol": symbol},
        {"$set": {"quantity": quantity, "entry_price": entry_price}},
        upsert=True
    )


def delete_short_position(user_id: str, symbol: str):
    """Delete a short position."""
    if col_short_positions is None:
        return
    col_short_positions.delete_one({"user_id": user_id, "symbol": symbol})


# ==================== SNAPSHOTS OPERATIONS ====================

def add_snapshot(user_id: str, value: float):
    """Add a portfolio snapshot."""
    if col_snapshots is None:
        return
    col_snapshots.insert_one({
        "user_id": user_id,
        "value": value,
        "timestamp": datetime.datetime.utcnow()
    })
    # Keep only last 30 snapshots per user
    all_snaps = list(col_snapshots.find({"user_id": user_id}).sort("timestamp", -1))
    if len(all_snaps) > 30:
        ids_to_delete = [s["_id"] for s in all_snaps[30:]]
        col_snapshots.delete_many({"_id": {"$in": ids_to_delete}})


def get_snapshots(user_id: str) -> list:
    """Get portfolio snapshots."""
    if col_snapshots is None:
        return []
    docs = col_snapshots.find({"user_id": user_id}).sort("timestamp", 1)
    return [{"value": d["value"], "timestamp": d["timestamp"].isoformat() if hasattr(d["timestamp"], 'isoformat') else str(d["timestamp"])} for d in docs]


# ==================== STOP ORDERS OPERATIONS ====================

def get_stop_orders(user_id: str) -> list:
    """Get active stop orders."""
    if col_stop_orders is None:
        return []
    docs = col_stop_orders.find({"user_id": user_id, "status": "ACTIVE"})
    result = []
    for d in docs:
        result.append({
            "id": str(d.get("_id")),
            "user_id": d.get("user_id"),
            "symbol": d.get("symbol"),
            "quantity": d.get("quantity"),
            "stop_price": d.get("stop_price"),
            "order_type": d.get("order_type"),
            "trailing_percent": d.get("trailing_percent"),
            "status": d.get("status"),
            "entry_price": d.get("entry_price"),
            "created_at": d.get("created_at")
        })
    return result


def add_stop_order(user_id: str, symbol: str, quantity: int, stop_price: float, order_type: str,
                   trailing_percent: float = None, entry_price: float = None) -> str:
    """Add a stop order and return the ID."""
    if col_stop_orders is None:
        return ""
    result = col_stop_orders.insert_one({
        "user_id": user_id,
        "symbol": symbol,
        "quantity": quantity,
        "stop_price": stop_price,
        "order_type": order_type,
        "trailing_percent": trailing_percent,
        "status": "ACTIVE",
        "entry_price": entry_price,
        "created_at": datetime.datetime.utcnow()
    })
    return str(result.inserted_id)


def delete_stop_order(user_id: str, order_id: str):
    """Delete a stop order."""
    if col_stop_orders is None:
        return
    from bson.objectid import ObjectId
    try:
        col_stop_orders.delete_one({"user_id": user_id, "_id": ObjectId(order_id)})
    except Exception:
        pass


def update_stop_order_status(order_id: str, status: str):
    """Update stop order status."""
    if col_stop_orders is None:
        return
    from bson.objectid import ObjectId
    try:
        col_stop_orders.update_one({"_id": ObjectId(order_id)}, {"$set": {"status": status}})
    except Exception:
        pass


# ==================== ACHIEVEMENTS OPERATIONS ====================

def get_achievements(user_id: str) -> list:
    """Get earned achievement IDs."""
    if col_achievements is None:
        return []
    docs = col_achievements.find({"user_id": user_id})
    return [d["achievement_id"] for d in docs]


def add_achievement(user_id: str, achievement_id: str):
    """Add an earned achievement."""
    if col_achievements is None:
        return
    try:
        col_achievements.insert_one({
            "user_id": user_id,
            "achievement_id": achievement_id,
            "earned_at": datetime.datetime.utcnow()
        })
    except Exception:
        pass  # Already earned


# ==================== PRICE ALERTS OPERATIONS ====================

def get_price_alerts(user_id: str) -> list:
    """Get price alerts."""
    if col_price_alerts is None:
        return []
    docs = col_price_alerts.find({"user_id": user_id})
    result = []
    for d in docs:
        result.append({
            "id": str(d.get("_id")),
            "symbol": d.get("symbol"),
            "target_price": d.get("target_price"),
            "direction": d.get("direction"),
            "triggered": d.get("triggered", 0),
            "created_at": d.get("created_at")
        })
    return result


def add_price_alert(user_id: str, symbol: str, target_price: float, direction: str) -> str:
    """Add a price alert and return the ID."""
    if col_price_alerts is None:
        return ""
    result = col_price_alerts.insert_one({
        "user_id": user_id,
        "symbol": symbol,
        "target_price": target_price,
        "direction": direction,
        "triggered": 0,
        "created_at": datetime.datetime.utcnow()
    })
    return str(result.inserted_id)


def delete_price_alert(user_id: str, alert_id: str):
    """Delete a price alert."""
    if col_price_alerts is None:
        return
    from bson.objectid import ObjectId
    try:
        col_price_alerts.delete_one({"user_id": user_id, "_id": ObjectId(alert_id)})
    except Exception:
        pass


# ==================== RESET OPERATIONS ====================

def reset_user_data(user_id: str):
    """Reset all simulator data for a user."""
    if db is None:
        return

    # Reset balance to initial
    col_balance.update_one(
        {"user_id": user_id},
        {"$set": {"cash_balance": INITIAL_CASH, "updated_at": datetime.datetime.utcnow()}},
        upsert=True
    )

    # Delete all user-specific data
    col_holdings.delete_many({"user_id": user_id})
    col_orders.delete_many({"user_id": user_id})
    col_watchlist.delete_many({"user_id": user_id})
    col_pending_orders.delete_many({"user_id": user_id})
    col_short_positions.delete_many({"user_id": user_id})
    col_snapshots.delete_many({"user_id": user_id})
    col_stop_orders.delete_many({"user_id": user_id})
    col_achievements.delete_many({"user_id": user_id})
    col_price_alerts.delete_many({"user_id": user_id})
