from fastapi import FastAPI, WebSocket, Query
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from typing import Optional
from datetime import datetime

# Import from our new local files
from database import collection
from mock_data import generate_user_session

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "User Analytics Backend is running!"}

# --- Historical Data Endpoint ---


@app.get("/api/history")
async def get_historical_data(
    start: Optional[str] = Query(None, description="Start time in ISO format"),
    end: Optional[str] = Query(None, description="End time in ISO format"),
    limit: int = Query(100, description="Max records to return")
):
    query = {}

    if start or end:
        query["created_at"] = {}
        if start:
            query["created_at"]["$gte"] = datetime.fromisoformat(
                start.replace("Z", "+00:00"))
        if end:
            query["created_at"]["$lte"] = datetime.fromisoformat(
                end.replace("Z", "+00:00"))

    # Fetch records, sort by newest first
    cursor = collection.find(query).sort("created_at", -1).limit(limit)
    documents = await cursor.to_list(length=limit)

    # Clean up the MongoDB ObjectID so it can be sent via JSON
    for doc in documents:
        doc["_id"] = str(doc["_id"])

    return documents

# --- Live Data WebSocket ---


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Generate the complex user session
            session_data = generate_user_session()

            # Save to MongoDB
            await collection.insert_one(session_data.copy())

            # Remove the un-serializable _id before sending to frontend
            if "_id" in session_data:
                del session_data["_id"]

            # Convert datetimes to strings for JSON
            session_data["login_timestamp"] = session_data["login_timestamp"].isoformat()
            session_data["logout_timestamp"] = session_data["logout_timestamp"].isoformat(
            )
            session_data["created_at"] = session_data["created_at"].isoformat()

            # Send to React
            await websocket.send_json(session_data)

            # Wait 1.5 seconds before generating the next user
            await asyncio.sleep(1.5)

    except Exception as e:
        print(f"Connection closed: {e}")
