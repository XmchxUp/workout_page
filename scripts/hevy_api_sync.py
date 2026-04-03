"""
Hevy API sync — fetches workout data from the official Hevy REST API
and outputs src/static/workouts.json in the same format as workout_sync.py.

API key: obtain from https://hevy.com/settings (Developer section)

Usage:
    python3 run_page/hevy_api_sync.py YOUR_API_KEY
    python3 run_page/hevy_api_sync.py YOUR_API_KEY --output src/static/workouts.json
    python3 run_page/hevy_api_sync.py YOUR_API_KEY --incremental  # only fetch new workouts
"""

import argparse
import hashlib
import json
import os
import time
from datetime import datetime, timedelta, timezone
from typing import Optional

try:
    import requests
except ImportError:
    raise SystemExit("requests not installed. Run: pip install requests")

HEVY_API_BASE = "https://api.hevyapp.com/v1"
PAGE_SIZE = 10  # Hevy API max per page


# ---------------------------------------------------------------------------
# Hevy API client
# ---------------------------------------------------------------------------

class HevyClient:
    def __init__(self, api_key: str):
        self.session = requests.Session()
        self.session.headers.update({
            "api-key": api_key,
            "Accept": "application/json",
        })

    def get_workouts_page(self, page: int) -> dict:
        url = f"{HEVY_API_BASE}/workouts"
        resp = self.session.get(url, params={"page": page, "pageSize": PAGE_SIZE})
        resp.raise_for_status()
        return resp.json()

    def get_all_workouts(self, since: Optional[str] = None) -> list[dict]:
        """
        Fetch all workouts, optionally only those updated after `since` (ISO 8601).
        Returns raw Hevy API workout objects.
        """
        all_workouts: list[dict] = []
        page = 1

        print("Fetching workouts from Hevy API...")

        while True:
            data = self.get_workouts_page(page)
            workouts = data.get("workouts", [])
            page_count = data.get("page_count", 1)

            if not workouts:
                break

            if since:
                # Filter by updated_at; stop early if we hit old data (sorted newest first)
                new_workouts = [
                    w for w in workouts
                    if w.get("updated_at", "") >= since
                ]
                all_workouts.extend(new_workouts)
                if len(new_workouts) < len(workouts):
                    print(f"  Reached already-synced workouts at page {page}, stopping.")
                    break
            else:
                all_workouts.extend(workouts)

            print(f"  Fetched page {page}/{page_count} ({len(all_workouts)} workouts so far)")

            if page >= page_count:
                break
            page += 1
            time.sleep(0.3)  # be polite to the API

        return all_workouts


# ---------------------------------------------------------------------------
# Converter: Hevy API format → our WorkoutSession format
# ---------------------------------------------------------------------------

def _make_session_id(hevy_id: str) -> str:
    return hashlib.md5(hevy_id.encode()).hexdigest()[:12]


def _normalize_time(iso_str: str, tz_offset: int = 0) -> str:
    """Normalize various ISO 8601 variants to 'YYYY-MM-DDTHH:MM:SS' with optional offset."""
    try:
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        if dt.tzinfo:
            dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
        if tz_offset:
            dt += timedelta(hours=tz_offset)
        return dt.strftime("%Y-%m-%dT%H:%M:%S")
    except (ValueError, AttributeError):
        return iso_str[:19]  # fallback: just truncate


def convert_workout(raw: dict, tz_offset: int = 0) -> dict:
    """Convert a single Hevy API workout object to our WorkoutSession format."""
    start_iso = _normalize_time(raw.get("start_time", ""), tz_offset)
    end_iso = _normalize_time(raw.get("end_time", ""), tz_offset)

    # Duration
    duration_seconds = 0
    try:
        start_dt = datetime.fromisoformat(raw["start_time"].replace("Z", "+00:00"))
        end_dt = datetime.fromisoformat(raw["end_time"].replace("Z", "+00:00"))
        duration_seconds = int((end_dt - start_dt).total_seconds())
    except (KeyError, ValueError):
        pass

    exercises = []
    total_volume_kg = 0.0
    total_sets = 0

    for ex in raw.get("exercises", []):
        sets = []
        for s in ex.get("sets", []):
            set_entry: dict = {
                "index": s.get("index", 0),
                "type": s.get("set_type", "normal"),
            }
            if s.get("weight_kg") is not None:
                set_entry["weight_kg"] = s["weight_kg"]
            if s.get("reps") is not None:
                set_entry["reps"] = s["reps"]
            if s.get("distance_meters") is not None:
                set_entry["distance_km"] = round(s["distance_meters"] / 1000, 4)
            if s.get("duration_seconds") is not None:
                set_entry["duration_seconds"] = s["duration_seconds"]
            if s.get("rpe") is not None:
                set_entry["rpe"] = s["rpe"]

            sets.append(set_entry)

            # Accumulate volume for normal/dropset/failure sets
            if s.get("set_type") in ("normal", "dropset", "failure"):
                w = s.get("weight_kg") or 0
                r = s.get("reps") or 0
                total_volume_kg += w * r
                total_sets += 1

        exercises.append({
            "name": ex.get("title", "Unknown"),
            "notes": ex.get("notes", ""),
            "sets": sets,
        })

    return {
        "id": _make_session_id(raw.get("id", raw.get("title", "") + start_iso)),
        "title": raw.get("title", "Workout"),
        "start_time": start_iso,
        "end_time": end_iso,
        "duration_seconds": duration_seconds,
        "description": raw.get("description", ""),
        "source": "hevy",
        "exercises": exercises,
        "total_volume_kg": round(total_volume_kg, 2),
        "total_sets": total_sets,
        "exercise_count": len(exercises),
    }


# ---------------------------------------------------------------------------
# Incremental merge
# ---------------------------------------------------------------------------

def merge_workouts(existing: list[dict], new_sessions: list[dict]) -> list[dict]:
    """Merge new sessions into existing list, deduplicating by id."""
    existing_ids = {w["id"] for w in existing}
    added = 0
    for session in new_sessions:
        if session["id"] not in existing_ids:
            existing.append(session)
            existing_ids.add(session["id"])
            added += 1

    existing.sort(key=lambda w: w["start_time"], reverse=True)
    print(f"Added {added} new workout(s). Total: {len(existing)}")
    return existing


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Sync workouts from Hevy API")
    parser.add_argument("api_key", help="Hevy API key (from hevy.com/settings)")
    parser.add_argument(
        "--output",
        default="src/static/workouts.json",
        help="Output JSON path (default: src/static/workouts.json)",
    )
    parser.add_argument(
        "--incremental",
        action="store_true",
        help="Only fetch workouts newer than the most recent in the output file",
    )
    parser.add_argument(
        "--tz-offset",
        type=int,
        default=8,
        metavar="HOURS",
        help="Hours to add to UTC timestamps (default: 8 for UTC+8)",
    )
    args = parser.parse_args()

    client = HevyClient(args.api_key)

    # Determine since date for incremental mode
    since: Optional[str] = None
    existing: list[dict] = []

    if args.incremental and os.path.exists(args.output):
        with open(args.output, encoding="utf-8") as f:
            existing = json.load(f)
        if existing:
            # Most recent start_time in our data
            most_recent = max(w["start_time"] for w in existing)
            since = most_recent
            print(f"Incremental mode: fetching workouts after {since}")

    raw_workouts = client.get_all_workouts(since=since)
    new_sessions = [convert_workout(w, tz_offset=args.tz_offset) for w in raw_workouts]

    if args.incremental and existing:
        final = merge_workouts(existing, new_sessions)
    else:
        final = sorted(new_sessions, key=lambda w: w["start_time"], reverse=True)
        print(f"Full sync: {len(final)} workouts")

    os.makedirs(os.path.dirname(args.output) or ".", exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(final, f, ensure_ascii=False, indent=2)

    print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()
