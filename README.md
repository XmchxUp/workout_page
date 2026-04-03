# Workout Page

[中文文档](./README_CN.md)

A personal strength training dashboard that turns your [Hevy](https://hevy.com) workout history into a rich analytics site.

**Currently supported data source: Hevy only.**

## Live Demo

> Replace this with your own deployed URL after setup.

---

## Features

| Panel | Description |
|---|---|
| Session calendar | Year heatmap + spiral view of training frequency |
| Session table | Full workout log with expandable exercise detail |
| Achievements | 60+ badges — streaks, volume milestones, PRs, special days |
| Muscle coverage | Hexagon radar chart with balance score (S/A/B/C) |
| Muscle distribution | Donut chart breakdown by muscle group |
| PR wall | All-time personal records across every exercise |
| 1RM tracker | Estimated one-rep max (Epley formula) over time |
| E1RM compare | Side-by-side strength progression across exercises |
| Training load | ATL/CTL/TSB fitness–fatigue–form curves |
| Readiness score | Recovery estimate based on recent load |
| Training heartbeat | Session timeline with volume and intensity |
| Highlight reel | Top sets and PRs from recent training |
| Volume landmarks | MEV/MAV/MRV milestones per muscle group |
| Fatigue curve | Set-by-set performance within sessions |
| Comparison panel | Period-over-period (month / quarter / year) |
| Vs. myself | Self-comparison across selected time windows |
| Exercise co-matrix | Which exercises appear together most often |
| Session advisor | AI-style next-session suggestions |
| Workout Wrapped | Annual year-in-review summary |

---

## Quick Start (local)

### Prerequisites

- Node.js ≥ 20
- pnpm (`npm install -g pnpm`)
- Python 3.11+ (only needed for data sync)

### 1. Fork or clone this repo

```bash
git clone https://github.com/YOUR_USERNAME/workout_page.git
cd workout_page
```

### 2. Export your Hevy data

Choose the method that matches your Hevy account type:

#### Method A — Hevy Pro / Developer API key

1. Go to [hevy.com/settings](https://hevy.com/settings) → scroll to **Developer** section → copy your API key.
2. Run:

```bash
pip install requests
python scripts/hevy_api_sync.py YOUR_API_KEY \
  --output src/static/workouts.json \
  --tz-offset 8          # change to your UTC offset, e.g. 0 for UTC, -5 for EST
```

This fetches all your workouts and writes `src/static/workouts.json`.

For incremental updates (only new workouts since the last run):

```bash
python scripts/hevy_api_sync.py YOUR_API_KEY \
  --output src/static/workouts.json \
  --incremental \
  --tz-offset 8
```

#### Method B — Hevy Free tier (browser automation)

Free-tier accounts can export a CSV from [hevy.com/settings?export](https://hevy.com/settings?export). This script automates that flow with a headless browser.

```bash
pip install requests playwright
playwright install chromium --with-deps

python scripts/hevy_web_export.py YOUR_EMAIL YOUR_PASSWORD \
  --output src/static/workouts.json \
  --tz-offset 8
```

#### Method C — Manual CSV export

1. Open [hevy.com/settings?export](https://hevy.com/settings?export) in your browser.
2. Click **Export Workout Data** — a CSV file will download.
3. Convert it to JSON:

```bash
python scripts/workout_sync.py \
  --input ~/Downloads/hevy_workouts.csv \
  --output src/static/workouts.json \
  --tz-offset 8
```

### 3. Start the dev server

```bash
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Configuration

### Language

Open `src/components/workout/WorkoutUI.tsx` and change line 3:

```ts
export const IS_CHINESE = false;   // true = Chinese labels, false = English
```

Exercise names are translated via `src/utils/exerciseTranslations.ts`. You can add or override entries in the `EXERCISE_CN` map there.

### Timezone offset

All sync scripts accept `--tz-offset HOURS`. This shifts UTC timestamps from the Hevy API to your local time before writing them to `workouts.json`. For example:

| Location | Value |
|---|---|
| UTC+8 (Beijing, Singapore) | `--tz-offset 8` |
| UTC+9 (Tokyo) | `--tz-offset 9` |
| UTC+1 (London summer) | `--tz-offset 1` |
| UTC-5 (New York winter) | `--tz-offset -5` |

### Site title, logo, and links

Edit `src/static/site-metadata.ts`:

```ts
const data = {
  siteTitle: 'Workout Page',           // browser tab title
  siteUrl: '/',                        // base URL
  logo: 'https://...',                 // avatar image URL
  description: 'My workout dashboard',
  navLinks: [],                        // add nav links if needed
};
```

---

## Automated sync with GitHub Actions

The included workflow (`.github/workflows/sync.yml`) syncs your Hevy data and redeploys the site every day at 01:00 UTC.

### Setup

#### 1. Enable GitHub Pages

In your repo: **Settings → Pages → Source → GitHub Actions**.

#### 2. Add secrets

Go to **Settings → Secrets and variables → Actions → New repository secret**.

**If you have Hevy Pro / API access:**

| Secret name | Value |
|---|---|
| `HEVY_API_KEY` | Your API key from hevy.com/settings |

**If you use the free tier:**

| Secret name | Value |
|---|---|
| `HEVY_EMAIL` | Your Hevy account email |
| `HEVY_PASSWORD` | Your Hevy account password |

> Only set one of the two groups. If `HEVY_API_KEY` is present, it takes priority and the free-tier step is skipped.

#### 3. Adjust the timezone offset

Open `.github/workflows/sync.yml` and change `--tz-offset 8` in both sync steps to match your timezone.

#### 4. Trigger the first run

Go to **Actions → Sync & Deploy → Run workflow**.

After the workflow completes, your site will be live at `https://YOUR_USERNAME.github.io/workout_page/`.

---

## Project structure

```
workout_page/
├── scripts/
│   ├── hevy_api_sync.py      # Hevy Pro/API → workouts.json
│   ├── hevy_web_export.py    # Hevy free tier CSV export → workouts.json
│   └── workout_sync.py       # Parse Hevy CSV → workouts.json
├── src/
│   ├── components/
│   │   ├── workout/          # 19 dashboard panel components
│   │   ├── WorkoutCalendar/  # Heatmap + spiral calendar
│   │   ├── WorkoutTable/     # Session log table
│   │   ├── Header/           # Nav bar with theme toggle
│   │   └── Layout/           # Page wrapper
│   ├── hooks/
│   │   ├── useWorkouts.ts    # Load and expose workouts.json
│   │   └── useTheme.ts       # Dark / light theme
│   ├── pages/
│   │   └── workouts.tsx      # Main page
│   ├── static/
│   │   └── workouts.json     # Your workout data (generated by scripts)
│   ├── types/
│   │   └── workout.ts        # TypeScript type definitions
│   └── utils/
│       ├── workoutCalcs.ts       # E1RM, streaks, volume, PRs, etc.
│       ├── workoutMuscles.ts     # Muscle group mapping and radar data
│       └── exerciseTranslations.ts  # EN ↔ ZH exercise name dictionary
├── .github/workflows/sync.yml   # Daily sync + deploy workflow
├── requirements.txt             # Python dependencies (requests)
└── package.json
```

---

## Data format reference

`src/static/workouts.json` is an array of `WorkoutSession` objects. You normally never edit this by hand — the sync scripts generate it. For reference:

```ts
interface WorkoutSession {
  id: string;                  // 12-char hash, auto-generated
  title: string;               // e.g. "Push Day"
  start_time: string;          // "YYYY-MM-DDTHH:MM:SS"
  end_time: string;
  duration_seconds: number;
  description: string;
  source: "hevy";
  exercises: WorkoutExercise[];
  total_volume_kg: number;
  total_sets: number;
  exercise_count: number;
}

interface WorkoutExercise {
  name: string;                // e.g. "Bench Press (Barbell)"
  notes: string;
  sets: WorkoutSet[];
}

interface WorkoutSet {
  index: number;
  type: "normal" | "warmup" | "dropset" | "failure";
  weight_kg?: number;
  reps?: number;
  distance_km?: number;
  duration_seconds?: number;
  rpe?: number;
}
```

---

## Tech stack

| Layer | Library |
|---|---|
| UI framework | React 18 + TypeScript |
| Build tool | Vite 7 |
| Charts | Recharts 2 |
| Styling | Tailwind CSS 4 |
| Routing | React Router 6 |
| Data sync | Python 3.11 + requests / playwright |

---

## License

MIT
