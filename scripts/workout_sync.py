"""
Workout data parser and sync utility.

Supports multiple fitness app export formats:
- Hevy (CSV)
- Strong (CSV) — stub for future
- Generic (JSON)

Usage:
    python3 run_page/workout_sync.py --input workouts.csv --source hevy
    python3 run_page/workout_sync.py --input workouts.csv  # auto-detect
"""

import argparse
import csv
import hashlib
import json
import os
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import Optional


# ---------------------------------------------------------------------------
# Abstract data model
# ---------------------------------------------------------------------------

def _parse_optional_float(value: str) -> Optional[float]:
    try:
        return float(value) if value.strip() != "" else None
    except (ValueError, AttributeError):
        return None


def _parse_optional_int(value: str) -> Optional[int]:
    try:
        return int(value) if value.strip() != "" else None
    except (ValueError, AttributeError):
        return None


class BaseWorkoutParser(ABC):
    """Abstract base class for workout data parsers."""

    @abstractmethod
    def parse(self, filepath: str) -> list[dict]:
        """Parse a file and return a list of aggregated workout sessions."""
        ...

    def _make_session_id(self, title: str, start_time: str) -> str:
        raw = f"{title}|{start_time}"
        return hashlib.md5(raw.encode()).hexdigest()[:12]

    def _format_duration(self, seconds: int) -> str:
        h = seconds // 3600
        m = (seconds % 3600) // 60
        s = seconds % 60
        return f"{h:02d}:{m:02d}:{s:02d}"


# ---------------------------------------------------------------------------
# Hevy CSV parser
# ---------------------------------------------------------------------------

class HevyParser(BaseWorkoutParser):
    """
    Parser for Hevy app CSV exports.

    CSV columns:
        title, start_time, end_time, description,
        exercise_title, superset_id, exercise_notes,
        set_index, set_type, weight_kg, reps,
        distance_km, duration_seconds, rpe
    """

    def __init__(self, tz_offset: int = 0):
        self.tz_offset = tz_offset

    DATE_FORMATS = [
        "%d %b %Y, %H:%M",   # "9 Mar 2026, 20:12"
        "%Y-%m-%d %H:%M:%S",  # ISO fallback
        "%Y-%m-%dT%H:%M:%S",
    ]

    def _parse_datetime(self, value: str) -> Optional[datetime]:
        for fmt in self.DATE_FORMATS:
            try:
                return datetime.strptime(value.strip(), fmt)
            except ValueError:
                continue
        return None

    def _to_iso(self, value: str) -> str:
        dt = self._parse_datetime(value)
        if dt:
            if self.tz_offset:
                dt += timedelta(hours=self.tz_offset)
            return dt.strftime("%Y-%m-%dT%H:%M:%S")
        return value

    def parse(self, filepath: str) -> list[dict]:
        # Group rows by (title, start_time) to get sessions
        sessions_raw: dict[tuple, dict] = {}

        with open(filepath, encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                key = (row["title"], row["start_time"])

                if key not in sessions_raw:
                    sessions_raw[key] = {
                        "title": row["title"],
                        "start_time": row["start_time"],
                        "end_time": row["end_time"],
                        "description": row.get("description", ""),
                        "rows": [],
                    }
                sessions_raw[key]["rows"].append(row)

        sessions: list[dict] = []
        for session_data in sessions_raw.values():
            session = self._build_session(session_data)
            sessions.append(session)

        # Sort newest first
        sessions.sort(key=lambda s: s["start_time"], reverse=True)
        return sessions

    def _build_session(self, session_data: dict) -> dict:
        title = session_data["title"]
        start_iso = self._to_iso(session_data["start_time"])
        end_iso = self._to_iso(session_data["end_time"])

        # Compute duration
        start_dt = self._parse_datetime(session_data["start_time"])
        end_dt = self._parse_datetime(session_data["end_time"])
        duration_seconds = 0
        if start_dt and end_dt:
            duration_seconds = int((end_dt - start_dt).total_seconds())

        # Group rows by exercise
        exercises_map: dict[str, dict] = {}
        exercise_order: list[str] = []

        for row in session_data["rows"]:
            ex_name = row["exercise_title"]
            if ex_name not in exercises_map:
                exercises_map[ex_name] = {
                    "name": ex_name,
                    "notes": row.get("exercise_notes", ""),
                    "sets": [],
                }
                exercise_order.append(ex_name)

            weight_kg = _parse_optional_float(row.get("weight_kg", ""))
            reps = _parse_optional_int(row.get("reps", ""))
            distance_km = _parse_optional_float(row.get("distance_km", ""))
            duration_secs = _parse_optional_int(row.get("duration_seconds", ""))
            rpe = _parse_optional_float(row.get("rpe", ""))

            set_entry: dict = {
                "index": _parse_optional_int(row.get("set_index", "")) or 0,
                "type": row.get("set_type", "normal"),
            }
            if weight_kg is not None:
                set_entry["weight_kg"] = weight_kg
            if reps is not None:
                set_entry["reps"] = reps
            if distance_km is not None:
                set_entry["distance_km"] = distance_km
            if duration_secs is not None:
                set_entry["duration_seconds"] = duration_secs
            if rpe is not None:
                set_entry["rpe"] = rpe

            exercises_map[ex_name]["sets"].append(set_entry)

        exercises = [exercises_map[name] for name in exercise_order]

        # Compute summary metrics
        total_volume_kg = 0.0
        total_sets = 0
        for ex in exercises:
            for s in ex["sets"]:
                if s.get("type") in ("normal", "dropset", "failure"):
                    w = s.get("weight_kg") or 0
                    r = s.get("reps") or 0
                    total_volume_kg += w * r
                    total_sets += 1

        return {
            "id": self._make_session_id(title, session_data["start_time"]),
            "title": title,
            "start_time": start_iso,
            "end_time": end_iso,
            "duration_seconds": duration_seconds,
            "description": session_data["description"],
            "source": "hevy",
            "exercises": exercises,
            "total_volume_kg": round(total_volume_kg, 2),
            "total_sets": total_sets,
            "exercise_count": len(exercises),
        }


# ---------------------------------------------------------------------------
# Strong CSV parser (stub — extend as needed)
# ---------------------------------------------------------------------------

class StrongParser(BaseWorkoutParser):
    """
    Parser for Strong app CSV exports.

    Strong CSV columns (typical):
        Date, Workout Name, Exercise Name, Set Order,
        Weight (kg), Reps, RPE, Notes, Duration
    """

    def parse(self, filepath: str) -> list[dict]:
        sessions_raw: dict[tuple, dict] = {}

        with open(filepath, encoding="utf-8-sig") as f:
            reader = csv.DictReader(f, delimiter=";")
            for row in reader:
                # Strong uses "Date" and "Workout Name" as session keys
                key = (row.get("Workout Name", ""), row.get("Date", ""))
                if key not in sessions_raw:
                    sessions_raw[key] = {
                        "title": row.get("Workout Name", "Workout"),
                        "start_time": row.get("Date", ""),
                        "end_time": row.get("Date", ""),
                        "description": row.get("Notes", ""),
                        "rows": [],
                    }
                sessions_raw[key]["rows"].append(row)

        sessions: list[dict] = []
        for session_data in sessions_raw.values():
            session = self._build_session(session_data)
            sessions.append(session)

        sessions.sort(key=lambda s: s["start_time"], reverse=True)
        return sessions

    def _build_session(self, session_data: dict) -> dict:
        title = session_data["title"]
        start_iso = session_data["start_time"]
        exercises_map: dict[str, dict] = {}
        exercise_order: list[str] = []

        for row in session_data["rows"]:
            ex_name = row.get("Exercise Name", "Unknown")
            if ex_name not in exercises_map:
                exercises_map[ex_name] = {"name": ex_name, "notes": "", "sets": []}
                exercise_order.append(ex_name)

            weight_kg = _parse_optional_float(row.get("Weight (kg)", ""))
            reps = _parse_optional_int(row.get("Reps", ""))
            rpe = _parse_optional_float(row.get("RPE", ""))

            set_entry: dict = {
                "index": _parse_optional_int(row.get("Set Order", "")) or 0,
                "type": "normal",
            }
            if weight_kg is not None:
                set_entry["weight_kg"] = weight_kg
            if reps is not None:
                set_entry["reps"] = reps
            if rpe is not None:
                set_entry["rpe"] = rpe

            exercises_map[ex_name]["sets"].append(set_entry)

        exercises = [exercises_map[name] for name in exercise_order]
        total_volume_kg = sum(
            (s.get("weight_kg") or 0) * (s.get("reps") or 0)
            for ex in exercises
            for s in ex["sets"]
        )
        total_sets = sum(len(ex["sets"]) for ex in exercises)

        return {
            "id": self._make_session_id(title, start_iso),
            "title": title,
            "start_time": start_iso,
            "end_time": start_iso,
            "duration_seconds": 0,
            "description": session_data["description"],
            "source": "strong",
            "exercises": exercises,
            "total_volume_kg": round(total_volume_kg, 2),
            "total_sets": total_sets,
            "exercise_count": len(exercises),
        }


# ---------------------------------------------------------------------------
# Auto-detection
# ---------------------------------------------------------------------------

def detect_format(filepath: str) -> str:
    """Guess the workout app format from CSV header."""
    with open(filepath, encoding="utf-8-sig") as f:
        header = f.readline().strip().lower()

    if "exercise_title" in header and "set_type" in header:
        return "hevy"
    if "workout name" in header and "set order" in header:
        return "strong"
    return "hevy"  # default


PARSERS: dict[str, type[BaseWorkoutParser]] = {
    "hevy": HevyParser,
    "strong": StrongParser,
}


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Parse workout data and export JSON")
    parser.add_argument(
        "--input",
        default="workouts.csv",
        help="Path to the workout CSV file (default: workouts.csv)",
    )
    parser.add_argument(
        "--output",
        default="src/static/workouts.json",
        help="Output JSON path (default: src/static/workouts.json)",
    )
    parser.add_argument(
        "--source",
        choices=list(PARSERS.keys()),
        default=None,
        help="Workout app format (auto-detected if omitted)",
    )
    parser.add_argument(
        "--tz-offset",
        type=int,
        default=0,
        metavar="HOURS",
        help="Hours to add to parsed timestamps (e.g. 8 for UTC→UTC+8, default: 0)",
    )
    args = parser.parse_args()

    if not os.path.exists(args.input):
        print(f"Error: input file '{args.input}' not found")
        raise SystemExit(1)

    source = args.source or detect_format(args.input)
    print(f"Detected/using format: {source}")

    parser_cls = PARSERS[source]
    workout_parser = parser_cls(tz_offset=args.tz_offset) if source == "hevy" else parser_cls()
    sessions = workout_parser.parse(args.input)
    print(f"Parsed {len(sessions)} workout sessions")

    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(sessions, f, ensure_ascii=False, indent=2)

    print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()
