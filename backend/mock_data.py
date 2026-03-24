import random
from datetime import datetime, timedelta, timezone

# Simple arrays to generate realistic names
FIRST_NAMES = ["Emma", "Liam", "Olivia", "Noah", "Ava",
               "William", "Sophia", "James", "Isabella", "Oliver"]
LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones",
              "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"]


def generate_user_session():
    """Generates a realistic user session document."""
    first = random.choice(FIRST_NAMES)
    last = random.choice(LAST_NAMES)
    age = random.randint(18, 65)

    # Simulate a login time that happened sometime today
    now = datetime.now(timezone.utc)
    login_time = now - timedelta(minutes=random.randint(10, 1440))

    # Simulate how long they were logged in (10 minutes to 8 hours)
    duration_minutes = random.randint(10, 480)
    logout_time = login_time + timedelta(minutes=duration_minutes)

    # Calculate hours to 2 decimal places
    hours_logged_in = round(duration_minutes / 60, 2)

    return {
        "user_id": f"u_{random.randint(1000, 9999)}",
        "name": f"{first} {last}",
        "username": f"{first.lower()[0]}{last.lower()}_{random.randint(10, 99)}",
        "age": age,
        "login_timestamp": login_time,
        "logout_timestamp": logout_time,
        "hours_logged_in": hours_logged_in,
        "created_at": now  # When this record was actually sent to the DB
    }
