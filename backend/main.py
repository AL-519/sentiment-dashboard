from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
from datetime import datetime, timedelta
import random

app = FastAPI(title="Analytics Engine API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGO_URL = "mongodb://localhost:27017"
client = AsyncIOMotorClient(MONGO_URL)
db = client.analytics_db
collection = db.users


# ==========================================
# 1. THE DATA SEEDER
# ==========================================
@app.get("/api/seed")
async def seed_database():
    await collection.delete_many({})

    users = []
    start_date = datetime(2022, 1, 1)

    for i in range(250):
        days_offset = random.randint(0, 4 * 365)
        date_created = start_date + timedelta(days=days_offset)

        activities = []
        for _ in range(random.randint(10, 50)):
            session_offset = random.randint(
                0, (datetime.now() - date_created).days)
            session_date = date_created + \
                timedelta(days=session_offset, hours=random.randint(0, 23))

            activities.append({
                f"session_{random.randint(1000, 9999)}": {
                    "login": session_date.isoformat(),
                    "duration": round(random.uniform(0.1, 4.0), 1)
                }
            })

        users.append({
            "name": f"User_{i}",
            "age": random.randint(16, 75),
            "date_created": date_created.isoformat(),
            "activities": activities,
            "total_activity": round(sum([list(a.values())[0]["duration"] for a in activities]), 1)
        })

    await collection.insert_many(users)
    return {"status": "success", "message": "Inserted 250 users into MongoDB."}


# ==========================================
# 2. RAW HISTORY ENDPOINT
# ==========================================
@app.get("/api/history")
async def get_historical_data(
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None)
):
    query = {}
    if start or end:
        query["date_created"] = {}
        if start:
            query["date_created"]["$gte"] = start
        if end:
            query["date_created"]["$lte"] = end

    cursor = collection.find(query).sort("date_created", 1)
    documents = await cursor.to_list(length=None)

    for doc in documents:
        doc["_id"] = str(doc["_id"])

    return documents


# ==========================================
# 3. LIVE AGGREGATION ENGINE (Fixed Math)
# ==========================================
@app.get("/api/analytics/live")
async def get_live_analytics(
    metric: str = Query("total_activity"),
    interval: str = Query("month"),
    start: Optional[str] = None,
    end: Optional[str] = None
):
    cursor = collection.find({})
    users = await cursor.to_list(length=None)

    # Step 1: Extract every session tagged with User ID
    all_sessions = []
    for user in users:
        uid = str(user.get("_id", ""))
        age = user.get("age", 0)
        activities = user.get("activities", [])

        for act_wrapper in activities:
            for key, session in act_wrapper.items():
                if isinstance(session, dict) and "login" in session:
                    try:
                        login_str = session["login"]
                        if login_str.endswith('Z'):
                            login_str = login_str[:-1] + '+00:00'
                        dt = datetime.fromisoformat(
                            login_str).replace(tzinfo=None)

                        all_sessions.append({
                            "user_id": uid,
                            "timestamp": dt,
                            "duration": session.get("duration", 0),
                            "age": age
                        })
                    except Exception:
                        continue

    # Step 2: Filter by Range
    if start:
        start_dt = datetime.fromisoformat(start).replace(tzinfo=None)
        all_sessions = [s for s in all_sessions if s["timestamp"] >= start_dt]
    if end:
        end_dt = datetime.fromisoformat(end).replace(tzinfo=None)
        all_sessions = [s for s in all_sessions if s["timestamp"] <= end_dt]

    # Step 3: Math Helper - True DAILY averages per unique user
    def calculate_average(bucket):
        if not bucket:
            return 0.0

        if metric == "age":
            unique_users = {s["user_id"]: s["age"] for s in bucket}
            return round(sum(unique_users.values()) / len(unique_users), 1)
        else:
            # 🛠️ THE FIX: Group by User AND Exact Date to get Daily Totals
            daily_totals = {}
            for s in bucket:
                date_str = s["timestamp"].date().isoformat()
                key = f"{s['user_id']}_{date_str}"
                daily_totals[key] = daily_totals.get(key, 0) + s["duration"]

            # 🛠️ Average those daily totals. (Capped at 24 just in case seed data overlaps)
            valid_totals = [min(24.0, val) for val in daily_totals.values()]
            return round(sum(valid_totals) / len(valid_totals), 1)

    final_data = []

    # Step 4: Group into specific Time Intervals
    if interval == "year":
        for y in ["2022", "2023", "2024", "2025", "2026"]:
            bucket = [s for s in all_sessions if str(s["timestamp"].year) == y]
            final_data.append({"time": y, "value": calculate_average(bucket)})

    elif interval == "month":
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        for idx, m in enumerate(months):
            bucket = [s for s in all_sessions if s["timestamp"].month == idx + 1]
            final_data.append({"time": m, "value": calculate_average(bucket)})

    elif interval == "day":
        for i in range(1, 32):
            bucket = [s for s in all_sessions if s["timestamp"].day == i]
            final_data.append(
                {"time": str(i), "value": calculate_average(bucket)})

    elif interval == "hour":
        for i in range(24):
            label = f"{12 if i == 0 else (i if i <= 12 else i - 12)} {'AM' if i < 12 else 'PM'}"
            bucket = [s for s in all_sessions if s["timestamp"].hour == i]
            final_data.append(
                {"time": label, "value": calculate_average(bucket)})

    return final_data
