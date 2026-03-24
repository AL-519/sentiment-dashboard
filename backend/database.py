from motor.motor_asyncio import AsyncIOMotorClient

# When you are ready for production, you just change this one line.
MONGO_URL = "mongodb://localhost:27017"

# Initialize the client
client = AsyncIOMotorClient(MONGO_URL)

# Select the database and collection
db = client.telemetry_db
collection = db.user_sessions  # Changed name to reflect the new data
