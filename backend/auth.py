import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
import bcrypt
from dotenv import load_dotenv

from database import get_db
from models import TokenData, UserOut

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_DAYS = int(os.getenv("JWT_EXPIRE_DAYS", "7"))

bearer_scheme = HTTPBearer(auto_error=False)


# ─── Password Helpers ────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    salt = bcrypt.gensalt()
    hashed_bytes = bcrypt.hashpw(plain.encode('utf-8'), salt)
    return hashed_bytes.decode('utf-8')


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
    except ValueError:
        return False


# ─── JWT Helpers ─────────────────────────────────────────────────────────────

def create_access_token(data: dict) -> str:
    payload = data.copy()
    expire = datetime.utcnow() + timedelta(days=JWT_EXPIRE_DAYS)
    payload.update({"exp": expire})
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[TokenData]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return TokenData(
            user_id=payload["user_id"],
            email=payload["email"],
            is_admin=payload.get("is_admin", False),
        )
    except JWTError:
        return None


# ─── FastAPI Dependencies ─────────────────────────────────────────────────────

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> UserOut:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    token_data = decode_access_token(credentials.credentials)
    if not token_data:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    db = get_db()
    from bson import ObjectId
    user_doc = await db.users.find_one({"_id": ObjectId(token_data.user_id)})
    if not user_doc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return UserOut(
        id=str(user_doc["_id"]),
        name=user_doc["name"],
        email=user_doc["email"],
        is_admin=user_doc.get("is_admin", False),
        created_at=user_doc["created_at"],
    )


async def get_current_admin(current_user: UserOut = Depends(get_current_user)) -> UserOut:
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user


# ─── Seed Admin User on Startup ───────────────────────────────────────────────

async def seed_admin_user(db):
    admin_email = os.getenv("ADMIN_EMAIL", "admin@legalaidbot.com")
    admin_password = os.getenv("ADMIN_PASSWORD", "Admin@123")
    admin_name = os.getenv("ADMIN_NAME", "Administrator")

    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "name": admin_name,
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "is_admin": True,
            "created_at": datetime.utcnow(),
        })
        print(f"Admin user seeded: {admin_email}")
    else:
        print(f"!Admin user already exists: {admin_email}")
