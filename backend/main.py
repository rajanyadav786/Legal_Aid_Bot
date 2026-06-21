import os
import json
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Response, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from bson import ObjectId
import httpx
import google.generativeai as genai
from dotenv import load_dotenv

from database import connect_db, close_db, get_db
from models import (
    UserCreate, UserLogin, UserOut, Token,
    ChatSessionCreate, ChatSessionOut, AddMessageRequest,
    LegalCategoryCreate, LegalCategoryUpdate, LegalCategoryOut,
)
from auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, get_current_admin, seed_admin_user,
)
import dashboard
import forum

load_dotenv()

app = FastAPI(title="Legal Aid Chatbot API")

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── AI Config ────────────────────────────────────────────────────────────────
PROMPT_FILE = os.path.join(os.path.dirname(__file__), "prompt_instructions.md")
with open(PROMPT_FILE, "r") as f:
    SYSTEM_PROMPT = f.read()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODELS = {
    "gemma": "google/gemma-7b-it",
    "minimax": "minimax/minimax-abab6.5",
    "qwen": "qwen/qwen-2-72b-instruct",
}

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")

# ─── Default categories seed data ─────────────────────────────────────────────
DEFAULT_CATEGORIES = [
    {"id": "general", "label": "General Legal Aid", "shortLabel": "General", "icon": "scales",
     "color": "#e8922f", "description": "Ask any legal question — rights, procedures, or guidance",
     "systemContext": "", "quickPrompts": [
         "What are my fundamental rights as an Indian citizen?",
         "How do I file an RTI application?",
         "What is the process to get a legal aid lawyer for free?",
     ], "order": 1},
    {"id": "labor", "label": "Labour & Employment", "shortLabel": "Labour", "icon": "briefcase",
     "color": "#4ea8de", "description": "Wages, workplace disputes, wrongful termination, POSH",
     "systemContext": "The user is asking about labour and employment law. Focus on: Minimum Wages Act 1948, Payment of Wages Act 1936, Industrial Disputes Act 1947, Factories Act 1948, POSH Act 2013, Employee Provident Fund, ESI Act, Contract Labour Act, Shops & Establishments Act, Maternity Benefit Act, Equal Remuneration Act, and the four new Labour Codes. Include relevant sections and practical steps.",
     "quickPrompts": [
         "My employer hasn't paid my salary for 2 months. What can I do?",
         "How do I file a complaint about workplace harassment?",
         "Am I entitled to gratuity after 4 years of service?",
     ], "order": 2},
    {"id": "property", "label": "Property & Land", "shortLabel": "Property", "icon": "home",
     "color": "#56c596", "description": "Land disputes, tenant rights, property registration",
     "systemContext": "The user is asking about property and land law. Focus on: Transfer of Property Act 1882, Registration Act 1908, Indian Stamp Act, Rent Control Acts, RERA 2016, Land Acquisition Act 2013, Specific Relief Act, state-specific tenancy laws, mutation process, property succession, encumbrance certificates, and dispute resolution.",
     "quickPrompts": [
         "My landlord is illegally trying to evict me. What are my rights?",
         "How do I check if a property has a clear title?",
         "What is the process for property mutation after inheritance?",
     ], "order": 3},
    {"id": "family", "label": "Family & Domestic", "shortLabel": "Family", "icon": "family",
     "color": "#e07b9d", "description": "Divorce, custody, domestic violence, maintenance",
     "systemContext": "The user is asking about family and domestic law. Focus on: Hindu Marriage Act 1955, Special Marriage Act 1954, Muslim Personal Law, Christian Marriage Act, Protection of Women from Domestic Violence Act 2005, Hindu Succession Act, Guardians and Wards Act 1890, Maintenance under CrPC Section 125 / BNSS Section 144, Dowry Prohibition Act 1961, Child custody principles, adoption laws, and family court procedures.",
     "quickPrompts": [
         "How can I file for domestic violence protection?",
         "What is the process for mutual consent divorce?",
         "Am I entitled to maintenance from my husband during separation?",
     ], "order": 4},
    {"id": "criminal", "label": "Criminal Law", "shortLabel": "Criminal", "icon": "shield",
     "color": "#e05252", "description": "FIR, bail, arrest rights, criminal complaints",
     "systemContext": "The user is asking about criminal law. Focus on: Bharatiya Nyaya Sanhita (BNS) 2023, Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023, Bharatiya Sakshya Adhiniyam (BSA) 2023, FIR filing procedure, Zero FIR, arrest rights under Article 22, bail provisions, anticipatory bail, cognizable vs non-cognizable offences, police station complaint process, and victim rights.",
     "quickPrompts": [
         "The police refused to file my FIR. What can I do?",
         "What are my rights if I am arrested?",
         "How do I apply for anticipatory bail?",
     ], "order": 5},
    {"id": "consumer", "label": "Consumer Rights", "shortLabel": "Consumer", "icon": "receipt",
     "color": "#c084fc", "description": "Product complaints, service deficiency, refund disputes",
     "systemContext": "The user is asking about consumer protection. Focus on: Consumer Protection Act 2019, Consumer Disputes Redressal Commissions, e-filing of consumer complaints, types of relief available, product liability provisions, misleading advertisements, unfair trade practices, Central Consumer Protection Authority (CCPA), rules for e-commerce complaints, mediation under the Act, and time limits for filing.",
     "quickPrompts": [
         "An online seller refused my refund. How do I file a complaint?",
         "How do I file a consumer complaint in the district forum?",
         "Can I claim compensation for medical negligence?",
     ], "order": 6},
    {"id": "women", "label": "Women & Child", "shortLabel": "Women", "icon": "heart",
     "color": "#f472b6", "description": "Women safety, child protection, POCSO, dowry",
     "systemContext": "The user is asking about women and child protection laws. Focus on: POCSO Act 2012, Juvenile Justice Act 2015, Dowry Prohibition Act 1961, POSH Act 2013, Section 354/376 BNS, Acid attack provisions, Maternity Benefit Act, Women's helpline 181, Child helpline 1098, National/State Commission for Women, One Stop Centres, child marriage laws, child labour prohibition, right to education, and adoption procedures.",
     "quickPrompts": [
         "How do I report a POCSO case?",
         "What protection is available for acid attack victims?",
         "How to register a dowry harassment complaint?",
     ], "order": 7},
    {"id": "cyber", "label": "Cyber Crime", "shortLabel": "Cyber", "icon": "globe",
     "color": "#38bdf8", "description": "Online fraud, identity theft, cyberbullying, data privacy",
     "systemContext": "The user is asking about cyber crime and IT law. Focus on: Information Technology Act 2000, BNS provisions on cyber fraud, National Cyber Crime Reporting Portal (cybercrime.gov.in), local cyber crime cell procedures, UPI/banking fraud reporting (RBI circular on liability), identity theft, phishing, social media harassment, revenge porn laws, data protection under IT Rules 2011, Digital Personal Data Protection Act 2023.",
     "quickPrompts": [
         "I was scammed through a fake UPI payment. What should I do?",
         "How do I report online harassment or cyberbullying?",
         "Someone created a fake account with my photos. How to take action?",
     ], "order": 8},
]


# ─── Startup / Shutdown ────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    await connect_db()
    db = get_db()
    await seed_admin_user(db)
    # Seed categories if collection is empty
    count = await db.categories.count_documents({})
    if count == 0:
        await db.categories.insert_many(DEFAULT_CATEGORIES)
        print(f"✅ Seeded {len(DEFAULT_CATEGORIES)} default legal categories")


@app.on_event("shutdown")
async def shutdown():
    await close_db()


# ─── Include Routers ──────────────────────────────────────────────────────────
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(forum.router, prefix="/api/forum", tags=["Forum"])

# ─────────────────────────────────────────────────────────────────────────────
# AUTH ROUTES
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/api/auth/register", response_model=Token, status_code=201)
async def register(body: UserCreate):
    db = get_db()
    existing = await db.users.find_one({"email": body.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_doc = {
        "name": body.name,
        "email": body.email.lower(),
        "password_hash": hash_password(body.password),
        "is_admin": False,
        "created_at": datetime.utcnow(),
    }
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    user_out = UserOut(
        id=str(result.inserted_id),
        name=user_doc["name"],
        email=user_doc["email"],
        is_admin=False,
        created_at=user_doc["created_at"],
    )
    token = create_access_token({"user_id": str(result.inserted_id), "email": user_doc["email"], "is_admin": False})
    return Token(access_token=token, user=user_out)


@app.post("/api/auth/login", response_model=Token)
async def login(body: UserLogin):
    db = get_db()
    user_doc = await db.users.find_one({"email": body.email.lower()})
    if not user_doc or not verify_password(body.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_out = UserOut(
        id=str(user_doc["_id"]),
        name=user_doc["name"],
        email=user_doc["email"],
        is_admin=user_doc.get("is_admin", False),
        created_at=user_doc["created_at"],
    )
    token = create_access_token({
        "user_id": str(user_doc["_id"]),
        "email": user_doc["email"],
        "is_admin": user_doc.get("is_admin", False),
    })
    return Token(access_token=token, user=user_out)


@app.get("/api/auth/me", response_model=UserOut)
async def me(current_user: UserOut = Depends(get_current_user)):
    return current_user


# ─────────────────────────────────────────────────────────────────────────────
# LEGAL CATEGORIES ROUTES
# ─────────────────────────────────────────────────────────────────────────────

def cat_doc_to_out(doc) -> LegalCategoryOut:
    return LegalCategoryOut(
        id=doc["id"],
        label=doc["label"],
        shortLabel=doc["shortLabel"],
        icon=doc.get("icon", "scales"),
        color=doc.get("color", "#e8922f"),
        description=doc.get("description", ""),
        systemContext=doc.get("systemContext", ""),
        quickPrompts=doc.get("quickPrompts", []),
        order=doc.get("order", 999),
    )


@app.get("/api/categories", response_model=List[LegalCategoryOut])
async def get_categories():
    db = get_db()
    docs = await db.categories.find().sort("order", 1).to_list(length=100)
    return [cat_doc_to_out(d) for d in docs]


@app.post("/api/categories", response_model=LegalCategoryOut, status_code=201)
async def create_category(body: LegalCategoryCreate, _: UserOut = Depends(get_current_admin)):
    db = get_db()
    existing = await db.categories.find_one({"id": body.id})
    if existing:
        raise HTTPException(status_code=400, detail=f"Category id '{body.id}' already exists")
    doc = body.model_dump()
    await db.categories.insert_one(doc)
    return cat_doc_to_out(doc)


@app.put("/api/categories/{category_id}", response_model=LegalCategoryOut)
async def update_category(category_id: str, body: LegalCategoryUpdate, _: UserOut = Depends(get_current_admin)):
    db = get_db()
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.categories.update_one({"id": category_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    doc = await db.categories.find_one({"id": category_id})
    return cat_doc_to_out(doc)


@app.delete("/api/categories/{category_id}", status_code=204)
async def delete_category(category_id: str, _: UserOut = Depends(get_current_admin)):
    db = get_db()
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return Response(status_code=204)


# ─────────────────────────────────────────────────────────────────────────────
# CHAT HISTORY ROUTES
# ─────────────────────────────────────────────────────────────────────────────

def session_doc_to_out(doc) -> ChatSessionOut:
    return ChatSessionOut(
        id=str(doc["_id"]),
        user_id=doc["user_id"],
        category_id=doc["category_id"],
        category_label=doc["category_label"],
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
        message_count=doc.get("message_count", 0),
    )


@app.post("/api/history/sessions", response_model=ChatSessionOut, status_code=201)
async def create_session(body: ChatSessionCreate, current_user: UserOut = Depends(get_current_user)):
    db = get_db()
    now = datetime.utcnow()
    doc = {
        "user_id": current_user.id,
        "category_id": body.category_id,
        "category_label": body.category_label,
        "created_at": now,
        "updated_at": now,
        "message_count": 0,
    }
    result = await db.sessions.insert_one(doc)
    doc["_id"] = result.inserted_id
    return session_doc_to_out(doc)


@app.get("/api/history/sessions", response_model=List[ChatSessionOut])
async def get_sessions(current_user: UserOut = Depends(get_current_user)):
    db = get_db()
    docs = await db.sessions.find({"user_id": current_user.id}).sort("updated_at", -1).to_list(length=50)
    return [session_doc_to_out(d) for d in docs]


@app.get("/api/history/sessions/{session_id}/messages")
async def get_session_messages(session_id: str, current_user: UserOut = Depends(get_current_user)):
    db = get_db()
    try:
        session = await db.sessions.find_one({"_id": ObjectId(session_id), "user_id": current_user.id})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session id")
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    messages = await db.messages.find({"session_id": session_id}).sort("timestamp", 1).to_list(length=500)
    return [{"role": m["role"], "content": m["content"], "timestamp": m["timestamp"].isoformat()} for m in messages]


@app.post("/api/history/sessions/{session_id}/messages", status_code=201)
async def add_message(session_id: str, body: AddMessageRequest, current_user: UserOut = Depends(get_current_user)):
    db = get_db()
    try:
        session = await db.sessions.find_one({"_id": ObjectId(session_id), "user_id": current_user.id})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session id")
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    now = datetime.utcnow()
    await db.messages.insert_one({
        "session_id": session_id,
        "role": body.role,
        "content": body.content,
        "timestamp": now,
    })
    await db.sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {"updated_at": now}, "$inc": {"message_count": 1}},
    )
    return {"ok": True}


@app.delete("/api/history/sessions/{session_id}", status_code=204)
async def delete_session(session_id: str, current_user: UserOut = Depends(get_current_user)):
    db = get_db()
    try:
        result = await db.sessions.delete_one({"_id": ObjectId(session_id), "user_id": current_user.id})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session id")
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    await db.messages.delete_many({"session_id": session_id})
    return Response(status_code=204)


# ─────────────────────────────────────────────────────────────────────────────
# ADMIN — USERS MANAGEMENT
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/admin/users")
async def admin_get_users(_: UserOut = Depends(get_current_admin)):
    db = get_db()
    docs = await db.users.find().sort("created_at", -1).to_list(length=200)
    return [
        {
            "id": str(d["_id"]),
            "name": d["name"],
            "email": d["email"],
            "is_admin": d.get("is_admin", False),
            "created_at": d["created_at"].isoformat(),
        }
        for d in docs
    ]


@app.patch("/api/admin/users/{user_id}/toggle-admin")
async def admin_toggle_admin(user_id: str, current_user: UserOut = Depends(get_current_admin)):
    db = get_db()
    try:
        user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user id")
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    if str(user_doc["_id"]) == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot change your own admin status")
    new_status = not user_doc.get("is_admin", False)
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"is_admin": new_status}})
    return {"is_admin": new_status}


@app.delete("/api/admin/users/{user_id}", status_code=204)
async def admin_delete_user(user_id: str, current_user: UserOut = Depends(get_current_admin)):
    db = get_db()
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    try:
        result = await db.users.delete_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user id")
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return Response(status_code=204)


@app.get("/api/admin/sessions")
async def admin_get_sessions(_: UserOut = Depends(get_current_admin)):
    db = get_db()
    docs = await db.sessions.find().sort("updated_at", -1).to_list(length=200)
    return [
        {
            "id": str(d["_id"]),
            "user_id": d["user_id"],
            "category_id": d["category_id"],
            "category_label": d["category_label"],
            "message_count": d.get("message_count", 0),
            "created_at": d["created_at"].isoformat(),
            "updated_at": d["updated_at"].isoformat(),
        }
        for d in docs
    ]


# ─────────────────────────────────────────────────────────────────────────────
# CHAT ROUTE
# ─────────────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    model: str = "gemini-3-flash-preview"
    systemContext: str = ""
    session_id: Optional[str] = None


class TTSRequest(BaseModel):
    text: str


@app.post("/api/chat")
async def chat(request: ChatRequest):
    if not request.message:
        raise HTTPException(status_code=400, detail="Message is required")

    model_choice = request.model.lower()
    full_system = SYSTEM_PROMPT
    if request.systemContext:
        full_system += f"\n\n{request.systemContext}"

    try:
        if model_choice == "gemini-3-flash-preview":
            if not GEMINI_API_KEY:
                raise HTTPException(status_code=500, detail="Gemini API Key not configured")
            model = genai.GenerativeModel(model_name=model_choice, system_instruction=full_system)
            response = await model.generate_content_async(request.message)
            return {"response": response.text}

        elif model_choice in OPENROUTER_MODELS:
            if not OPENROUTER_API_KEY:
                raise HTTPException(status_code=500, detail="OpenRouter API Key not configured")
            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                }
                data = {
                    "model": OPENROUTER_MODELS[model_choice],
                    "messages": [
                        {"role": "system", "content": full_system},
                        {"role": "user", "content": request.message},
                    ],
                }
                res = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers=headers,
                    json=data,
                    timeout=30.0,
                )
                if res.status_code != 200:
                    raise HTTPException(status_code=res.status_code, detail=f"OpenRouter Error: {res.text}")
                return {"response": res.json()["choices"][0]["message"]["content"]}

        else:
            raise HTTPException(status_code=400, detail=f"Unsupported model: {model_choice}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/tts")
async def tts(request: TTSRequest):
    if not ELEVENLABS_API_KEY:
        raise HTTPException(status_code=500, detail="ElevenLabs API Key not configured")

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
    }
    data = {
        "text": request.text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        res = await client.post(url, headers=headers, json=data)
        if res.status_code != 200:
            raise HTTPException(status_code=res.status_code, detail=f"ElevenLabs Error: {res.text}")
        return Response(content=res.content, media_type="audio/mpeg")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
