# Workout Page

[中文文档](./README_CN.md)

A personal strength training dashboard that turns your [Hevy](https://hevy.com) workout history into analytics: training calendar, PR tracking, muscle maps, load curves, achievements, and a yearly Wrapped.

Demo: https://xmchxup.github.io/workout_page/

## Quick start

Requires Node.js 20+, pnpm, and Python 3.11+ (for data sync only).

### 1. Clone

```bash
git clone https://github.com/YOUR_USERNAME/workout_page.git
cd workout_page
```

### 2. Export your Hevy data

Pick the method that matches your account. All three write `src/static/workouts.json`.

**Hevy Pro or API key.** Copy the key from the Developer section at [hevy.com/settings](https://hevy.com/settings), then run:

```bash
pip install -r requirements.txt
python scripts/hevy_api_sync.py YOUR_API_KEY --output src/static/workouts.json --tz-offset 8
```

Add `--incremental` on later runs to fetch only new workouts.

**Hevy free tier.** This automates the CSV export at [hevy.com/settings?export](https://hevy.com/settings?export) with a headless browser:

```bash
pip install -r requirements.txt
playwright install chromium --with-deps
python scripts/hevy_web_export.py YOUR_EMAIL YOUR_PASSWORD --output src/static/workouts.json --tz-offset 8
```

**Manual CSV export.** Download the CSV from [hevy.com/settings?export](https://hevy.com/settings?export), then convert it:

```bash
python scripts/workout_sync.py --input ~/Downloads/hevy_workouts.csv --output src/static/workouts.json --tz-offset 8
```

`--tz-offset` shifts UTC timestamps to your local time (`8` for Beijing, `9` for Tokyo, `-5` for New York winter time). `workout_sync.py` auto-detects Hevy and Strong CSV formats; pass `--source hevy` or `--source strong` to skip detection.

### 3. Run

```bash
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173). Other scripts: `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm preview`.

## Configuration

Language: set `IS_CHINESE` in `src/components/workout/WorkoutUI.tsx`. Exercise name translations live in the `EXERCISE_CN` map in `src/utils/exerciseTranslations.ts`.

Site title, logo, and description: edit `src/static/site-metadata.ts`.

## Auto sync

`.github/workflows/sync.yml` syncs Hevy data and redeploys the site daily at 01:00 UTC via GitHub Pages (no `gh-pages` branch needed).

1. In repo Settings, set Pages source to GitHub Actions.
2. In Settings, Actions, General, grant Workflow permissions for read and write.
3. Add secrets: `HEVY_API_KEY` for Pro or API access, else `HEVY_EMAIL` plus `HEVY_PASSWORD` for the free tier. If `HEVY_API_KEY` exists, the free-tier step is skipped.
4. Change `--tz-offset 8` in the workflow to your timezone.
5. Run the workflow once from Actions, Sync and Deploy.

The site goes live at `https://YOUR_USERNAME.github.io/workout_page/`.

## License

MIT
