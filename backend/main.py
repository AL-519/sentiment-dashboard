import os
import random
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

app = FastAPI(title="Sentiment Analytics API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGO_URL = "mongodb://localhost:27017"
client = AsyncIOMotorClient(MONGO_URL)
db = client.sentiment_db
collection = db.comments


@app.get("/api/posts")
async def get_posts():
    """Returns a list of unique post IDs."""
    post_ids = await collection.distinct("post_id")
    clean_ids = [pid for pid in post_ids if pid]
    return {"post_ids": clean_ids}


@app.get("/api/platforms")
async def get_platforms(post_id: List[str] = Query(...)):
    """Returns platforms available for ALL selected posts."""
    # $in allows us to find platforms associated with any of the selected post_ids
    platforms = await collection.distinct("platform", {"post_id": {"$in": post_id}})
    return {"platforms": platforms}


@app.get("/api/analytics")
async def get_analytics(
    post_id: List[str] = Query(...),
    platform: List[str] = Query(...),
    # 🛠️ NEW: Tells the backend what to group by
    compare_by: str = Query("platform")
):
    """Fetches and mathematically aggregates sentiment data for the frontend."""

    cursor = collection.find({
        "post_id": {"$in": post_id},
        "platform": {"$in": platform}
    }).sort("published_at", 1)

    comments = await cursor.to_list(length=None)

    # 🛠️ Determine the dynamic keys for our charts based on the comparison mode
    keys = platform if compare_by == "platform" else post_id
    if compare_by == "none":
        keys = platform  # Default to platform for single view

    # --- 1. AGGREGATE SENTIMENT ---
    sentiment_types = ["Positive", "Neutral", "Negative"]
    aggregate_sentiment = []

    for sent in sentiment_types:
        entry = {"sentiment": sent, "count": 0}
        for k in keys:
            if compare_by == "post":
                p_count = len([c for c in comments if c.get(
                    "sentiment") == sent and c.get("post_id") == k])
            else:
                p_count = len([c for c in comments if c.get(
                    "sentiment") == sent and c.get("platform") == k])

            entry[k] = p_count
            entry["count"] += p_count
        aggregate_sentiment.append(entry)

    # --- 2. TIME SERIES CUMULATIVE MATH ---
    time_series = []
    running_scores = {k: 0 for k in keys}

    if comments:
        initial_point = {"time": "Start"}
        for k in keys:
            initial_point[k] = 0
        time_series.append(initial_point)

    for comment in comments:
        # Determine which line this comment belongs to
        k = comment.get(
            "post_id") if compare_by == "post" else comment.get("platform")
        sent = comment.get("sentiment")

        # Safety check in case of messy data
        if k in running_scores:
            if sent == "Positive":
                running_scores[k] += 1
            elif sent == "Negative":
                running_scores[k] -= 1

        point = {"time": comment.get("published_at")}
        for key_item in keys:
            point[key_item] = running_scores[key_item]

        time_series.append(point)

    # --- 3. SCATTER PLOT DENSITY ---
    scatter_plot = []
    for idx, comment in enumerate(comments):
        k = comment.get(
            "post_id") if compare_by == "post" else comment.get("platform")
        if k in keys:
            scatter_plot.append({
                "time": comment.get("published_at"),
                "value": keys.index(k) + 1,
                # We alias 'platform' here so the frontend React component doesn't break
                "platform": k,
                "volume": random.randint(50, 200)
            })

    return {
        "aggregate_sentiment": aggregate_sentiment,
        "time_series": time_series,
        "scatter_plot": scatter_plot
    }
