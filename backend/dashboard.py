from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
from bson import ObjectId

from database import get_db
from auth import get_current_user
from models import (
    UserOut, BookmarkCreate, BookmarkOut,
    ProcedureCreate, ProcedureUpdate, ProcedureOut
)

router = APIRouter()

# ─────────────────────────────────────────────────────────────────────────────
# Bookmarks Routes
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/bookmarks", response_model=List[BookmarkOut])
async def get_bookmarks(current_user: UserOut = Depends(get_current_user)):
    db = get_db()
    docs = await db.bookmarks.find({"user_id": current_user.id}).sort("created_at", -1).to_list(length=100)
    return [
        BookmarkOut(
            id=str(d["_id"]),
            user_id=d["user_id"],
            title=d["title"],
            description=d.get("description", ""),
            link=d.get("link", ""),
            created_at=d["created_at"],
        ) for d in docs
    ]

@router.post("/bookmarks", response_model=BookmarkOut, status_code=201)
async def create_bookmark(body: BookmarkCreate, current_user: UserOut = Depends(get_current_user)):
    db = get_db()
    doc = {
        "user_id": current_user.id,
        "title": body.title,
        "description": body.description,
        "link": body.link,
        "created_at": datetime.utcnow(),
    }
    res = await db.bookmarks.insert_one(doc)
    doc["_id"] = res.inserted_id
    return BookmarkOut(
        id=str(doc["_id"]),
        user_id=doc["user_id"],
        title=doc["title"],
        description=doc["description"],
        link=doc["link"],
        created_at=doc["created_at"],
    )

@router.delete("/bookmarks/{bookmark_id}", status_code=204)
async def delete_bookmark(bookmark_id: str, current_user: UserOut = Depends(get_current_user)):
    db = get_db()
    try:
        res = await db.bookmarks.delete_one({"_id": ObjectId(bookmark_id), "user_id": current_user.id})
        if res.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Bookmark not found")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid bookmark ID")

# ─────────────────────────────────────────────────────────────────────────────
# Procedures Routes
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/procedures", response_model=List[ProcedureOut])
async def get_procedures(current_user: UserOut = Depends(get_current_user)):
    db = get_db()
    docs = await db.procedures.find({"user_id": current_user.id}).sort("updated_at", -1).to_list(length=100)
    return [
        ProcedureOut(
            id=str(d["_id"]),
            user_id=d["user_id"],
            title=d["title"],
            status=d.get("status", "in_progress"),
            steps=d.get("steps", []),
            created_at=d["created_at"],
            updated_at=d["updated_at"],
        ) for d in docs
    ]

@router.post("/procedures", response_model=ProcedureOut, status_code=201)
async def create_procedure(body: ProcedureCreate, current_user: UserOut = Depends(get_current_user)):
    db = get_db()
    doc = {
        "user_id": current_user.id,
        "title": body.title,
        "status": body.status,
        "steps": [s.model_dump() for s in body.steps],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    res = await db.procedures.insert_one(doc)
    doc["_id"] = res.inserted_id
    return ProcedureOut(
        id=str(doc["_id"]),
        user_id=doc["user_id"],
        title=doc["title"],
        status=doc["status"],
        steps=doc["steps"],
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
    )

@router.put("/procedures/{procedure_id}", response_model=ProcedureOut)
async def update_procedure(procedure_id: str, body: ProcedureUpdate, current_user: UserOut = Depends(get_current_user)):
    db = get_db()
    update_data = {"updated_at": datetime.utcnow()}
    if body.title is not None: update_data["title"] = body.title
    if body.status is not None: update_data["status"] = body.status
    if body.steps is not None: update_data["steps"] = [s.model_dump() for s in body.steps]
    
    try:
        res = await db.procedures.update_one(
            {"_id": ObjectId(procedure_id), "user_id": current_user.id},
            {"$set": update_data}
        )
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="Procedure not found")
        doc = await db.procedures.find_one({"_id": ObjectId(procedure_id)})
        return ProcedureOut(
            id=str(doc["_id"]),
            user_id=doc["user_id"],
            title=doc["title"],
            status=doc["status"],
            steps=doc["steps"],
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
        )
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=400, detail="Invalid procedure ID")

@router.delete("/procedures/{procedure_id}", status_code=204)
async def delete_procedure(procedure_id: str, current_user: UserOut = Depends(get_current_user)):
    db = get_db()
    try:
        res = await db.procedures.delete_one({"_id": ObjectId(procedure_id), "user_id": current_user.id})
        if res.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Procedure not found")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid procedure ID")
