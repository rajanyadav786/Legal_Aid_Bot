from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
from bson import ObjectId

from database import get_db
from auth import get_current_user
from models import (
    UserOut, ForumPostCreate, ForumPostOut,
    ForumCommentCreate, ForumCommentOut
)

router = APIRouter()

# ─────────────────────────────────────────────────────────────────────────────
# Forum Posts
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/posts", response_model=List[ForumPostOut])
async def get_posts():
    db = get_db()
    docs = await db.posts.find().sort("created_at", -1).to_list(length=100)
    return [
        ForumPostOut(
            id=str(d["_id"]),
            user_id=d["user_id"],
            author_name=d["author_name"],
            title=d["title"],
            content=d["content"],
            tags=d.get("tags", []),
            created_at=d["created_at"],
            comments_count=d.get("comments_count", 0),
        ) for d in docs
    ]

@router.post("/posts", response_model=ForumPostOut, status_code=201)
async def create_post(body: ForumPostCreate, current_user: UserOut = Depends(get_current_user)):
    db = get_db()
    doc = {
        "user_id": current_user.id,
        "author_name": current_user.name,
        "title": body.title,
        "content": body.content,
        "tags": body.tags,
        "created_at": datetime.utcnow(),
        "comments_count": 0,
    }
    res = await db.posts.insert_one(doc)
    doc["_id"] = res.inserted_id
    return ForumPostOut(
        id=str(doc["_id"]),
        user_id=doc["user_id"],
        author_name=doc["author_name"],
        title=doc["title"],
        content=doc["content"],
        tags=doc["tags"],
        created_at=doc["created_at"],
        comments_count=doc["comments_count"],
    )

# ─────────────────────────────────────────────────────────────────────────────
# Forum Comments
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/posts/{post_id}/comments", response_model=List[ForumCommentOut])
async def get_comments(post_id: str):
    db = get_db()
    try:
        docs = await db.comments.find({"post_id": post_id}).sort("created_at", 1).to_list(length=100)
        return [
            ForumCommentOut(
                id=str(d["_id"]),
                post_id=d["post_id"],
                user_id=d["user_id"],
                author_name=d["author_name"],
                content=d["content"],
                created_at=d["created_at"],
            ) for d in docs
        ]
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid post ID")

@router.post("/posts/{post_id}/comments", response_model=ForumCommentOut, status_code=201)
async def create_comment(post_id: str, body: ForumCommentCreate, current_user: UserOut = Depends(get_current_user)):
    db = get_db()
    try:
        # Verify post exists
        post = await db.posts.find_one({"_id": ObjectId(post_id)})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
            
        doc = {
            "post_id": post_id,
            "user_id": current_user.id,
            "author_name": current_user.name,
            "content": body.content,
            "created_at": datetime.utcnow(),
        }
        res = await db.comments.insert_one(doc)
        doc["_id"] = res.inserted_id
        
        # Increment comment count
        await db.posts.update_one({"_id": ObjectId(post_id)}, {"$inc": {"comments_count": 1}})
        
        return ForumCommentOut(
            id=str(doc["_id"]),
            post_id=doc["post_id"],
            user_id=doc["user_id"],
            author_name=doc["author_name"],
            content=doc["content"],
            created_at=doc["created_at"],
        )
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=400, detail="Invalid post ID")
