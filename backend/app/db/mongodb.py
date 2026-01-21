from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from typing import Optional

class MongoDB:
    
    client: Optional[AsyncIOMotorClient] = None
    
    @classmethod
    async def connect_db(cls):
        cls.client = AsyncIOMotorClient(settings.MONGODB_URL)
        
        # Test the connection
        try:
            await cls.client.admin.command('ping')
            print(f"✅ Connected to MongoDB at {settings.MONGODB_URL}")
        except Exception as e:
            print(f"❌ Failed to connect to MongoDB: {e}")
            raise
    
    @classmethod
    async def close_db(cls):
        if cls.client:
            cls.client.close()
            print("❌ Closed MongoDB connection")
    
    @classmethod
    def get_db(cls):
        if cls.client is None:
            raise Exception("Database not connected. Call connect_db() first.")
        return cls.client[settings.DATABASE_NAME]

# Create global instance
db = MongoDB()