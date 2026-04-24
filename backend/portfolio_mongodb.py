from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import datetime
from pymongo import MongoClient
import os
from urllib.parse import quote_plus
from dotenv import load_dotenv
import logging

# SSL certificates for cloud deployments
try:
    import certifi
    SSL_CA = certifi.where()
except ImportError:
    SSL_CA = None

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Defer MongoDB initialization to an explicit function so importing this
# module doesn't try to connect during app startup (which can fail when
# MongoDB isn't available). Call `init_db()` from the FastAPI startup event.
client = None
db = None
collection = None


def _normalize_mongodb_uri(uri: str | None) -> str | None:
    """Normalize URI and reject template placeholders before connecting."""
    if not uri:
        return None

    cleaned = uri.strip().strip('"').strip("'")
    if not cleaned:
        return None

    # Common local template mistakes.
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

def init_db(uri: str | None = None, create_indexes: bool = True) -> bool:
    """Initialize MongoDB client and collection.

    Returns True if connection was established, False otherwise.
    """
    global client, db, collection

    uri = _normalize_mongodb_uri(uri or os.getenv('MONGODB_URI'))
    allow_invalid_certs = os.getenv('MONGODB_TLS_ALLOW_INVALID_CERTS', 'false').lower() in {'1', 'true', 'yes', 'on'}
    if not uri:
        logger.error("MONGODB_URI missing or invalid for portfolio initialization.")
        return False

    try:
        client_options = {
            'serverSelectionTimeoutMS': int(os.getenv('MONGODB_SERVER_SELECTION_TIMEOUT_MS', '8000')),
            'connectTimeoutMS': int(os.getenv('MONGODB_CONNECT_TIMEOUT_MS', '10000')),
            'socketTimeoutMS': int(os.getenv('MONGODB_SOCKET_TIMEOUT_MS', '10000')),
            'tlsAllowInvalidCertificates': allow_invalid_certs,
            'retryWrites': True,
            'appname': 'nexus-backend-portfolio',
        }

        # Use certifi SSL certs if available.
        if SSL_CA:
            client_options['tlsCAFile'] = SSL_CA
            client = MongoClient(uri, **client_options)
        else:
            client_options['tls'] = True
            client = MongoClient(uri, **client_options)

        # Fail fast on startup.
        client.admin.command('ping')
        db = client.portfolio_db
        collection = db.portfolio_items

        if create_indexes:
            collection.create_index([("user_id", 1), ("symbol", 1)], unique=True)

        logger.info("MongoDB connection established successfully")
        return True
    except Exception as e:
        logger.error(f"Portfolio MongoDB unavailable: {str(e)}")
        client = None
        collection = None
        return False

router = APIRouter()

# Pydantic models
class PortfolioItem(BaseModel):
    symbol: str
    name: str
    item_type: str = "stock"  # "stock" or "mutual_fund"

class PortfolioItemResponse(BaseModel):
    id: str  # MongoDB uses string IDs
    symbol: str
    name: str
    item_type: str
    added_at: str

@router.post("/api/portfolio/add/{user_id}", response_model=PortfolioItemResponse)
async def add_to_portfolio(user_id: str, item: PortfolioItem):
    logger.info(f"Attempting to add item to portfolio for user {user_id}: {item}")
    if collection is None:
        raise HTTPException(status_code=503, detail="Portfolio database is unavailable")

    try:
        # Check if item already exists
        existing_item = collection.find_one({
            "user_id": user_id,
            "symbol": item.symbol
        })
        
        if existing_item:
            logger.warning(f"Item {item.symbol} already exists in portfolio for user {user_id}")
            raise HTTPException(status_code=400, detail="Item already in portfolio")
        
        # Add new item
        new_item = {
            "user_id": user_id,
            "symbol": item.symbol,
            "name": item.name,
            "item_type": item.item_type,
            "added_at": datetime.datetime.utcnow().isoformat()
        }
        
        result = collection.insert_one(new_item)
        
        # Get the inserted item
        inserted_item = collection.find_one({"_id": result.inserted_id})
        
        if not inserted_item:
            logger.error(f"Failed to retrieve inserted item with id {result.inserted_id}")
            raise HTTPException(status_code=500, detail="Failed to retrieve inserted item")
        
        return PortfolioItemResponse(
            id=str(inserted_item["_id"]),
            symbol=inserted_item["symbol"],
            name=inserted_item["name"],
            item_type=inserted_item["item_type"],
            added_at=inserted_item["added_at"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding item to portfolio: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/portfolio/{user_id}", response_model=List[PortfolioItemResponse])
async def get_portfolio(user_id: str):
    logger.info(f"Fetching portfolio for user {user_id}")
    try:
        if collection is None:
            raise HTTPException(status_code=503, detail="Portfolio database is unavailable")

        items = list(collection.find({"user_id": user_id}))
        
        return [
            PortfolioItemResponse(
                id=str(item["_id"]),
                symbol=item["symbol"],
                name=item["name"],
                item_type=item["item_type"],
                added_at=item["added_at"]
            )
            for item in items
        ]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching portfolio: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/api/portfolio/{user_id}/{item_id}")
async def remove_from_portfolio(user_id: str, item_id: str):
    logger.info(f"Attempting to remove item {item_id} for user {user_id}")
    try:
        if collection is None:
            raise HTTPException(status_code=503, detail="Portfolio database is unavailable")

        from bson.objectid import ObjectId
        
        # Convert string ID to MongoDB ObjectId
        try:
            obj_id = ObjectId(item_id)
        except:
            raise HTTPException(status_code=400, detail="Invalid item ID format")
        
        # Check if item exists and belongs to user
        result = collection.delete_one({
            "_id": obj_id,
            "user_id": user_id
        })
        
        if result.deleted_count == 0:
            logger.warning(f"Item {item_id} not found in portfolio for user {user_id}")
            raise HTTPException(status_code=404, detail="Item not found in portfolio")
        
        logger.info(f"Successfully removed item {item_id}")
        return {"message": "Item removed successfully"}
    except Exception as e:
        logger.error(f"Error removing item from portfolio: {str(e)}")
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=str(e))