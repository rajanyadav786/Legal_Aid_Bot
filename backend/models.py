from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime


# ─────────────────────────────────────────────────────────────────────────────
# Auth / User Models
# ─────────────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    email: str
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    is_admin: bool
    created_at: datetime


class TokenData(BaseModel):
    user_id: str
    email: str
    is_admin: bool


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ─────────────────────────────────────────────────────────────────────────────
# Chat History Models
# ─────────────────────────────────────────────────────────────────────────────

class ChatMessageDoc(BaseModel):
    role: str           # "user" | "assistant"
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ChatSessionCreate(BaseModel):
    category_id: str
    category_label: str


class ChatSessionOut(BaseModel):
    id: str
    user_id: str
    category_id: str
    category_label: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0


class AddMessageRequest(BaseModel):
    role: str
    content: str


# ─────────────────────────────────────────────────────────────────────────────
# Legal Category Models
# ─────────────────────────────────────────────────────────────────────────────

class QuickPrompt(BaseModel):
    text: str


class LegalCategoryCreate(BaseModel):
    id: str = Field(..., min_length=2, max_length=40)
    label: str
    shortLabel: str
    icon: str = "scales"
    color: str = "#e8922f"
    description: str
    systemContext: str = ""
    quickPrompts: List[str] = []
    order: int = 999


class LegalCategoryUpdate(BaseModel):
    label: Optional[str] = None
    shortLabel: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None
    systemContext: Optional[str] = None
    quickPrompts: Optional[List[str]] = None
    order: Optional[int] = None


class LegalCategoryOut(BaseModel):
    id: str
    label: str
    shortLabel: str
    icon: str
    color: str
    description: str
    systemContext: str
    quickPrompts: List[str]
    order: int

# ─────────────────────────────────────────────────────────────────────────────
# User Dashboard Models
# ─────────────────────────────────────────────────────────────────────────────

class BookmarkCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    link: Optional[str] = ""

class BookmarkOut(BaseModel):
    id: str
    user_id: str
    title: str
    description: str
    link: str
    created_at: datetime

class ProcedureStep(BaseModel):
    title: str
    completed: bool = False

class ProcedureCreate(BaseModel):
    title: str
    status: str = "in_progress"
    steps: List[ProcedureStep] = []

class ProcedureUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    steps: Optional[List[ProcedureStep]] = None

class ProcedureOut(BaseModel):
    id: str
    user_id: str
    title: str
    status: str
    steps: List[ProcedureStep]
    created_at: datetime
    updated_at: datetime

# ─────────────────────────────────────────────────────────────────────────────
# Forum Models
# ─────────────────────────────────────────────────────────────────────────────

class ForumPostCreate(BaseModel):
    title: str
    content: str
    tags: List[str] = []

class ForumPostOut(BaseModel):
    id: str
    user_id: str
    author_name: str
    title: str
    content: str
    tags: List[str]
    created_at: datetime
    comments_count: int = 0

class ForumCommentCreate(BaseModel):
    content: str

class ForumCommentOut(BaseModel):
    id: str
    post_id: str
    user_id: str
    author_name: str
    content: str
    created_at: datetime
