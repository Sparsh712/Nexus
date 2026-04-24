from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import secrets
import datetime
import json
import logging
import portfolio_mongodb as portfolio_store

router = APIRouter(prefix="/api/share", tags=["Share"])
logger = logging.getLogger(__name__)

def _get_collections():
    if portfolio_store.collection is None or portfolio_store.db is None:
        raise HTTPException(status_code=503, detail="Database is unavailable")
    return portfolio_store.collection, portfolio_store.db.shared_portfolios


class ShareResponse(BaseModel):
    share_id: str
    share_url: str
    created_at: str


@router.post("/create/{user_id}")
async def create_share_link(user_id: str):
    """
    Create a shareable link for the user's current portfolio.
    Returns a relative URL path (not localhost) for sharing.
    """
    try:
        portfolio_items_col, shared_col = _get_collections()
        items = list(portfolio_items_col.find({"user_id": user_id}))
        
        if not items:
            raise HTTPException(status_code=400, detail="No items in portfolio to share")

        normalized_items = [
            {
                "id": str(item.get("_id")),
                "symbol": item.get("symbol"),
                "name": item.get("name"),
                "item_type": item.get("item_type"),
                "added_at": item.get("added_at"),
            }
            for item in items
        ]
        
        # Create snapshot with timestamp
        snapshot = {
            "user_id": user_id,
            "items": normalized_items,
            "snapshot_time": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "total_items": len(normalized_items)
        }
        
        # Generate unique share ID (8 chars for compact URLs)
        share_id = secrets.token_urlsafe(8)
        created_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        # Store in MongoDB
        shared_col.insert_one(
            {
                "share_id": share_id,
                "user_id": user_id,
                "snapshot_data": json.dumps(snapshot),
                "created_at": created_at,
                "views": 0,
            }
        )
        shared_col.create_index("share_id", unique=True)
        shared_col.create_index("user_id")
        
        # Return RELATIVE URL path - frontend will construct full URL based on current domain
        return {
            "share_id": share_id,
            "share_url": f"/share/{share_id}",  # Relative path, not localhost!
            "created_at": created_at,
            "items_count": len(normalized_items),
            "message": "Portfolio snapshot created! Share this link with others."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating share link: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create share link: {str(e)}")


@router.get("/{share_id}")
async def get_shared_portfolio(share_id: str):
    """
    Get a shared portfolio by its share_id.
    This is a PUBLIC endpoint - no authentication required.
    """
    try:
        _, shared_col = _get_collections()
        row = shared_col.find_one({"share_id": share_id})

        if row is None:
            raise HTTPException(status_code=404, detail="Shared portfolio not found or expired")

        # Increment view count
        shared_col.update_one({"share_id": share_id}, {"$inc": {"views": 1}})

        snapshot = json.loads(row["snapshot_data"])

        return {
            "share_id": share_id,
            "created_at": row["created_at"],
            "views": row["views"] + 1,
            "portfolio": snapshot
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching shared portfolio: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch portfolio: {str(e)}")


@router.get("/list/{user_id}")
async def list_user_shares(user_id: str):
    """List all share links created by a user"""
    try:
        _, shared_col = _get_collections()
        rows = list(shared_col.find({"user_id": user_id}, {"_id": 0, "share_id": 1, "created_at": 1, "views": 1}).sort("created_at", -1))
        shares = [dict(row) for row in rows]

        return {"shares": shares}
        
    except Exception as e:
        logger.error(f"Error listing shares: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list shares: {str(e)}")


@router.delete("/{user_id}/{share_id}")
async def delete_share_link(user_id: str, share_id: str):
    """Delete a share link (only by owner)"""
    try:
        _, shared_col = _get_collections()

        # Verify ownership
        row = shared_col.find_one({"share_id": share_id})

        if row is None:
            raise HTTPException(status_code=404, detail="Share link not found")

        if row["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this share")

        shared_col.delete_one({"share_id": share_id})

        return {"message": "Share link deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting share: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete: {str(e)}")
