import os
import random
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

app = FastAPI(title="Sentiment Analytics API")

# Allow Next.js frontend to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# DATABASE CONFIGURATION
# ---------------------------------------------------------
# 🛠️ Change this URI later when moving to cloud (e.g., MongoDB Atlas)
MONGO_URL = "mongodb://localhost:27017"

# Connect to the local MongoDB instance
client = AsyncIOMotorClient(MONGO_URL)
db = client.sentiment_db       # Database name
collection = db.comments       # Collection name

# ---------------------------------------------------------
# API ENDPOINTS
# ---------------------------------------------------------


@app.get("/api/posts")
async def get_posts():
    """Returns a list of unique post IDs."""
    # Using MongoDB's distinct function is blazing fast for large datasets
    post_ids = await collection.distinct("post_id")
    # Filter out any null or empty values just in case
    clean_ids = [pid for pid in post_ids if pid]
    return {"post_ids": clean_ids}


@app.get("/api/platforms")
async def get_platforms(post_id: str):
    """Returns available platforms for a specific post."""
    # Find all distinct platforms specifically for this post_id
    platforms = await collection.distinct("platform", {"post_id": post_id})
    return {"platforms": platforms}


@app.get("/api/analytics")
async def get_analytics(
    post_id: str,
    platform: List[str] = Query(...)
):
    """Fetches and mathematically aggregates sentiment data for the frontend."""

    # 1. Query only the exact comments we need, sorted by time directly in the DB
    cursor = collection.find({
        "post_id": post_id,
        "platform": {"$in": platform}
    }).sort("published_at", 1)  # 1 means ascending (oldest to newest)

    comments = await cursor.to_list(length=None)  # Fetch all matches

    # --- 1. AGGREGATE SENTIMENT (For Bar, Pie, Funnel, Column) ---
    sentiment_types = ["Positive", "Neutral", "Negative"]
    aggregate_sentiment = []

    for sent in sentiment_types:
        entry = {"sentiment": sent, "count": 0}
        for p in platform:
            # Count comments for this specific platform and sentiment
            p_count = len([c for c in comments if c.get(
                "sentiment") == sent and c.get("platform") == p])
            entry[p] = p_count
            entry["count"] += p_count
        aggregate_sentiment.append(entry)

    # --- 2. TIME SERIES CUMULATIVE MATH (For Live Line Chart) ---
    time_series = []
    running_scores = {p: 0 for p in platform}

    # 🛠️ FIX: Inject a starting baseline so Recharts can draw lines for single-comment posts
    if comments:
        initial_point = {"time": "Start"}
        for plat in platform:
            initial_point[plat] = 0
        time_series.append(initial_point)

    for comment in comments:
        p = comment.get("platform")
        sent = comment.get("sentiment")

        if sent == "Positive":
            running_scores[p] += 1
        elif sent == "Negative":
            running_scores[p] -= 1

        point = {"time": comment.get("published_at")}
        for plat in platform:
            point[plat] = running_scores[plat]

        time_series.append(point)

    # --- 3. SCATTER PLOT DENSITY (For Scatter Chart) ---
    scatter_plot = []
    for idx, comment in enumerate(comments):
        scatter_plot.append({
            "time": comment.get("published_at"),
            "value": platform.index(comment.get("platform")) + 1,
            "platform": comment.get("platform"),
            # Replace with real likes/replies if your DB has them
            "volume": random.randint(50, 200)
        })

    return {
        "aggregate_sentiment": aggregate_sentiment,
        "time_series": time_series,
        "scatter_plot": scatter_plot
    }
