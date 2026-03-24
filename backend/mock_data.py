import random
from datetime import datetime, timedelta


def generate_bulk_users(count=250):
    users = []
    now = datetime.utcnow()
    five_years_ago = now - timedelta(days=5*365)

    for i in range(count):
        # 1. Account Metadata
        # Random account creation date within last 5 years
        created_at = five_years_ago + timedelta(
            seconds=random.randint(
                0, int((now - five_years_ago).total_seconds()))
        )

        age = random.randint(10, 90)
        location = random.choice(
            ["New York", "London", "Tokyo", "Berlin", "Mumbai", "Sydney"])
        device = random.choice(["Mobile", "Desktop", "Tablet"])

        # 2. Generate Activities
        activities = []
        total_time = 0.0
        # Each user has between 1 and 10 login sessions
        num_sessions = random.randint(1, 10)

        for j in range(num_sessions):
            # Session duration between 0.1 and 15 hours
            duration = round(random.uniform(0.1, 15.0), 2)

            # Login must be after account creation
            login_delta = random.randint(
                0, int((now - created_at).total_seconds()))
            login_time = created_at + timedelta(seconds=login_delta)
            logout_time = login_time + timedelta(hours=duration)

            activities.append({
                f"activity{j}": {
                    "login": login_time,
                    "logout": logout_time,
                    "duration": duration
                }
            })
            total_time += duration

        users.append({
            "user_id": f"user_{1000 + i}",
            "age": age,
            "location": location,
            "device": device,
            "date_created": created_at,
            "total_activity": round(total_time, 2),
            "activities": activities
        })

    return users
