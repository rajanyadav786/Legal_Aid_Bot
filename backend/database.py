import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "legalaidbot")

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[MONGODB_DB_NAME]
    print(f"[OK] Connected to MongoDB: {MONGODB_URI} / {MONGODB_DB_NAME}")


async def close_db():
    global client
    if client:
        client.close()
        print("[CLOSED] MongoDB connection closed")


def get_db():
    return db
