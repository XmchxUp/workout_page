# Workouts Color Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the workouts dashboard light and dark color system around warm neutrals and a terracotta accent without changing layout, behavior, or data flow.

**Architecture:** Keep the existing theme architecture intact by redefining CSS variables in `src/styles/index.css` and routing remaining hardcoded accents through those variables. Favor token expansion over component rewrites so the whole page inherits the new look through the current `data-theme` switch. Because this repo has no automated test runner for UI styling, verification is build-based plus targeted manual theme inspection.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind v4 utilities, global CSS variables, Recharts

---

## File structure

### Core theme source

- Modify: `src/styles/index.css`
  - Own the full warm-neutral + terracotta token system for `:root`, `prefers-color-scheme`, `[data-theme='dark']`, and `[data-theme='light']`
  - Add reusable derived tokens for accent alpha fills, tinted shadows, modal backdrops, and focus rings so inline `rgba(99,102,241,...)` values can disappear from components

### Shared UI wrappers

- Modify: `src/components/workout/WorkoutUI.tsx`
  - Rewire shared card hover shadows, tooltip surfaces, and section-label accents to the new tokens
- Modify: `src/components/workout/ExpandableCard.tsx`
  - Rewire card hover, expand button, and modal shadow/backdrop styling to the new token set

### Page-level accent cleanup

- Modify: `src/pages/workouts.tsx`
  - Replace page-local indigo, amber, pink, cyan, orange, green, and red literals with theme tokens
  - Normalize PR modal, filter chips, trend lines, highlight pills, and accent gradients

### Component-level accent cleanup

- Modify: `src/components/workout/AchievementsPanel.tsx`
  - Normalize achievement palette resolution without rewriting the achievement metadata list
- Modify: `src/components/workout/WorkoutWrapped.tsx`
  - Convert the year-summary modal from neon purple/gold to the new editorial theme
- Modify: `src/components/workout/HighlightReel.tsx`
  - Replace threshold-based hardcoded accent colors with tokens
- Modify: `src/components/workout/SessionAdvisor.tsx`
  - Convert indigo and red advice chips to token-backed semantic surfaces
- Modify: `src/components/workout/MuscleRecovery.tsx`
  - Replace hardcoded recovery colors and gradients with semantic tokens
- Modify: `src/components/workout/MuscleDistributionPanel.tsx`
  - Remove indigo literals from ratio summaries and category bars
- Modify: `src/components/workout/VsMyselfPanel.tsx`
  - Replace active-state indigo fills and borders with accent tokens
- Modify: `src/components/workout/FatigueCurve.tsx`
  - Route area, line, and threshold colors through the new chart palette
- Modify: `src/components/workout/TrainingHeartbeat.tsx`
  - Convert grid and pulse colors to token-backed accent shades
- Modify: `src/components/workout/MuscleHexPanel.tsx`
  - Recolor SVG gradient, outline, nodes, and active chips with terracotta ramp tokens
- Modify: `src/components/workout/ComparisonPanel.tsx`
  - Replace indigo legend and bar fills with chart tokens
- Modify: `src/components/workout/ExerciseCoMatrix.tsx`
  - Replace cell outlines and self-cell fills with accent tokens
- Modify: `src/components/workout/VolumeLandmarks.tsx`
  - Move body-part colors and zone markers to muted brand/semantic tokens
- Modify: `src/components/workout/ReadinessScore.tsx`
  - Replace gold stop colors with warning-token gradients where meaning is cautionary, accent-token gradients otherwise
- Modify: `src/components/WorkoutCalendar/SpiralCalendar.tsx`
  - Replace today-stroke amber literal with warning or accent token depending on visual outcome

### Verification

- Use existing scripts only:
  - `pnpm build`
  - `pnpm exec eslint src --ext .ts,.tsx --max-warnings=0`

## Task 1: Rebuild the global theme token system

**Files:**
- Modify: `src/styles/index.css`

- [ ] **Step 1: Replace the cool indigo-first token blocks with warm-neutral and terracotta values**

Use this token direction in all four theme blocks (`:root`, `@media (prefers-color-scheme: light)`, `[data-theme='dark']`, `[data-theme='light']`):

```css
:root {
  --font-sans: 'IBM Plex Sans', sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;

  --wo-accent-rgb: 199, 121, 82;
  --wo-positive-rgb: 93, 124, 98;
  --wo-negative-rgb: 168, 88, 76;
  --wo-warning-rgb: 159, 117, 73;
  --wo-shadow-rgb: 36, 20, 13;

  --wc-empty: rgba(255, 248, 242, 0.06);
  --wc-l1: #6b3f2e;
  --wc-l2: #82503a;
  --wc-l3: #9f6044;
  --wc-l4: #e4a27b;
  --wc-today: rgba(var(--wo-accent-rgb), 0.55);
  --wc-hover: rgba(var(--wo-accent-rgb), 0.16);

  --wt-border: rgba(255, 248, 242, 0.08);
  --wt-hover: rgba(var(--wo-accent-rgb), 0.08);
  --wt-chip-bg: rgba(var(--wo-accent-rgb), 0.12);
  --wt-detail-bg: rgba(16, 10, 8, 0.28);
  --wt-icon: rgba(242, 231, 222, 0.32);
  --wt-pr-color: #e4a27b;
  --wt-pr-bg: rgba(var(--wo-accent-rgb), 0.15);

  --wo-card-bg: rgba(255, 248, 242, 0.035);
  --wo-card-border: rgba(255, 248, 242, 0.08);
  --wo-card-hover: rgba(255, 248, 242, 0.055);
  --wo-section-line: rgba(255, 248, 242, 0.08);

  --wo-chart-a: #c77952;
  --wo-chart-b: #9f6044;
  --wo-chart-c: #6b3f2e;
  --wo-series-1: #e4a27b;
  --wo-series-2: #c77952;
  --wo-series-3: #b36d4b;
  --wo-series-4: #9f6044;
  --wo-series-5: #82503a;
  --wo-series-6: #6b3f2e;
  --wo-series-7: #5b372b;
  --wo-series-8: #d9b6a1;

  --wo-positive: rgb(var(--wo-positive-rgb));
  --wo-positive-bg: rgba(var(--wo-positive-rgb), 0.14);
  --wo-negative: rgb(var(--wo-negative-rgb));
  --wo-negative-bg: rgba(var(--wo-negative-rgb), 0.14);
  --wo-warning: rgb(var(--wo-warning-rgb));
  --wo-warning-bg: rgba(var(--wo-warning-rgb), 0.14);

  --wo-fitness: #c77952;
  --wo-fatigue: rgb(var(--wo-negative-rgb));
  --wo-form: rgb(var(--wo-positive-rgb));
  --wo-grid: rgba(255, 248, 242, 0.08);
  --wo-axis-text: rgba(242, 231, 222, 0.36);

  --color-brand: #c77952;
  --color-bg: #171311;
  --color-tx: #f2e7de;
  --color-hr: rgba(255, 248, 242, 0.1);
  --color-run-row-hover-background: rgba(255, 248, 242, 0.05);
}
```

Use the light-theme equivalents below for the `light` blocks:

```css
--wo-accent-rgb: 166, 95, 66;
--wo-positive-rgb: 93, 124, 98;
--wo-negative-rgb: 168, 88, 76;
--wo-warning-rgb: 159, 117, 73;
--wo-shadow-rgb: 95, 59, 38;

--wc-empty: rgba(72, 41, 28, 0.08);
--wc-l1: #d9b6a1;
--wc-l2: #cf9d81;
--wc-l3: #c28663;
--wc-l4: #9d573b;
--wt-border: rgba(72, 41, 28, 0.08);
--wt-hover: rgba(var(--wo-accent-rgb), 0.06);
--wt-chip-bg: rgba(var(--wo-accent-rgb), 0.1);
--wt-detail-bg: rgba(166, 95, 66, 0.05);
--wt-icon: rgba(61, 42, 32, 0.32);
--wt-pr-color: #9d573b;
--wt-pr-bg: rgba(var(--wo-accent-rgb), 0.12);
--wo-card-bg: rgba(255, 255, 255, 0.58);
--wo-card-border: rgba(72, 41, 28, 0.08);
--wo-card-hover: rgba(255, 255, 255, 0.72);
--wo-section-line: rgba(72, 41, 28, 0.1);
--wo-chart-a: #a65f42;
--wo-chart-b: #b47153;
--wo-chart-c: #cf9d81;
--wo-series-1: #9d573b;
--wo-series-2: #a65f42;
--wo-series-3: #b47153;
--wo-series-4: #c28663;
--wo-series-5: #cf9d81;
--wo-series-6: #d9b6a1;
--wo-series-7: #6e4b3c;
--wo-series-8: #ead7cb;
--wo-fitness: #a65f42;
--wo-fatigue: rgb(var(--wo-negative-rgb));
--wo-form: rgb(var(--wo-positive-rgb));
--wo-grid: rgba(72, 41, 28, 0.08);
--wo-axis-text: rgba(61, 42, 32, 0.42);
--color-brand: #a65f42;
--color-bg: #f3ece4;
--color-tx: #3d2a20;
--color-hr: rgba(72, 41, 28, 0.1);
--color-run-row-hover-background: rgba(72, 41, 28, 0.04);
```

- [ ] **Step 2: Add reusable derived tokens for alpha fills, shadows, focus, and backdrops**

Add these derived tokens in each theme block so components can stop hardcoding indigo RGBA strings:

```css
--wo-accent-soft-bg: rgba(var(--wo-accent-rgb), 0.12);
--wo-accent-soft-bg-strong: rgba(var(--wo-accent-rgb), 0.2);
--wo-accent-soft-border: rgba(var(--wo-accent-rgb), 0.28);
--wo-accent-line-soft: rgba(var(--wo-accent-rgb), 0.4);
--wo-accent-line-strong: rgba(var(--wo-accent-rgb), 0.72);
--wo-accent-glow: 0 18px 40px rgba(var(--wo-shadow-rgb), 0.28);
--wo-card-shadow-hover: 0 12px 28px rgba(var(--wo-shadow-rgb), 0.24);
--wo-modal-shadow: 0 24px 60px rgba(var(--wo-shadow-rgb), 0.4);
--wo-popover-shadow: 0 10px 28px rgba(var(--wo-shadow-rgb), 0.22);
--wo-modal-backdrop: rgba(14, 10, 8, 0.82);
--wo-focus-ring: 0 0 0 3px rgba(var(--wo-accent-rgb), 0.18);
--color-background: var(--wo-card-bg);
```

For the light theme, keep the same token names but use a lighter modal backdrop:

```css
--wo-modal-backdrop: rgba(61, 42, 32, 0.38);
```

- [ ] **Step 3: Keep base/body transitions and add scroll/focus quality-of-life rules**

Append these base rules near the existing `@layer base` section:

```css
@layer base {
  html {
    scroll-behavior: smooth;
  }

  body {
    background-color: var(--color-bg);
    color: var(--color-tx);
    transition:
      background-color 0.2s ease,
      color 0.2s ease;
  }

  :focus-visible {
    outline: none;
    box-shadow: var(--wo-focus-ring);
  }
}
```

- [ ] **Step 4: Run a build after the token rewrite**

Run: `pnpm build`

Expected: Vite completes successfully with a final line similar to `✓ built in ...`

- [ ] **Step 5: Commit the token rewrite**

```bash
git add src/styles/index.css
git commit -m "style: redefine workouts theme tokens"
```

## Task 2: Rewire shared cards, tooltips, and modal wrappers to the new tokens

**Files:**
- Modify: `src/components/workout/WorkoutUI.tsx`
- Modify: `src/components/workout/ExpandableCard.tsx`

- [ ] **Step 1: Update `WorkoutUI.tsx` shared tooltip and card hover surfaces**

Use this exact replacement pattern:

```tsx
export const TOOLTIP_STYLE: React.CSSProperties = {
  background: 'var(--wo-card-bg)',
  border: '1px solid var(--wt-border)',
  borderRadius: 8,
  fontSize: 11,
  boxShadow: 'var(--wo-popover-shadow)',
  padding: '6px 10px',
};
```

And replace the card hover handlers with:

```tsx
onMouseEnter={(e) => {
  (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--wo-card-shadow-hover)';
  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--wc-l2)';
}}
onMouseLeave={(e) => {
  (e.currentTarget as HTMLDivElement).style.boxShadow = '';
  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--wo-card-border)';
}}
```

- [ ] **Step 2: Update `ExpandableCard.tsx` hover shadow, expand button, and modal shell**

Apply these targeted replacements:

```tsx
onMouseEnter={(e) => {
  (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--wo-card-shadow-hover)';
  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--wc-l2)';
}}
```

```tsx
style={{
  position: 'absolute',
  top: 8,
  right: 8,
  zIndex: 1,
  width: 24,
  height: 24,
  borderRadius: 6,
  background: 'var(--wo-card-hover)',
  border: '1px solid var(--wo-card-border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  opacity: 0,
  transition: 'opacity 0.15s',
  fontSize: 11,
  color: 'currentColor',
}}
```

```tsx
style={{ background: 'var(--wo-modal-backdrop)', backdropFilter: 'blur(8px)' }}
```

```tsx
style={{
  background: 'var(--wo-card-bg)',
  border: '1px solid var(--wo-card-border)',
  boxShadow: 'var(--wo-modal-shadow)',
}}
```

- [ ] **Step 3: Run lint after shared-surface rewiring**

Run: `pnpm exec eslint src/components/workout/WorkoutUI.tsx src/components/workout/ExpandableCard.tsx --ext .ts,.tsx --max-warnings=0`

Expected: command exits `0` with no lint errors

- [ ] **Step 4: Commit the shared-surface cleanup**

```bash
git add src/components/workout/WorkoutUI.tsx src/components/workout/ExpandableCard.tsx
git commit -m "style: align shared workout surfaces with new palette"
```

## Task 3: Replace page-level hardcoded accents in `workouts.tsx`

**Files:**
- Modify: `src/pages/workouts.tsx`

- [ ] **Step 1: Add local token-backed helper constants near the top of `workouts.tsx`**

Add these constants once so the file can stop repeating hardcoded RGBA strings:

```tsx
const ACCENT_SOFT_BG = 'var(--wo-accent-soft-bg)';
const ACCENT_SOFT_BG_STRONG = 'var(--wo-accent-soft-bg-strong)';
const ACCENT_SOFT_BORDER = 'var(--wo-accent-soft-border)';
const ACCENT_LINE_SOFT = 'var(--wo-accent-line-soft)';
const ACCENT_LINE_STRONG = 'var(--wo-accent-line-strong)';
```

- [ ] **Step 2: Replace page-level indigo/amber literals with the helper tokens and semantic tokens**

Use these exact replacements as the baseline:

```tsx
<div className="text-sm font-bold leading-tight" style={{ color: warn ? 'var(--wo-warning)' : undefined }}>
  {val}
</div>
```

```tsx
style={selected === name ? { background: ACCENT_SOFT_BG, borderRadius: 8 } : {}}
```

```tsx
<span
  className="text-xs px-1.5 py-0.5 rounded shrink-0"
  style={{ background: ACCENT_SOFT_BG, color: 'var(--wc-l3)' }}
>
```

```tsx
<Line yAxisId="e" type="monotone" dataKey="predicted" stroke="var(--wo-accent-line-strong)" strokeWidth={1.5} />
```

```tsx
if (r < 0.15) return 'rgba(var(--wo-accent-rgb), 0.22)';
if (r < 0.35) return 'rgba(var(--wo-accent-rgb), 0.4)';
if (r < 0.6) return 'rgba(var(--wo-accent-rgb), 0.58)';
if (r < 0.82) return 'rgba(var(--wo-accent-rgb), 0.76)';
return 'rgba(var(--wo-accent-rgb), 0.92)';
```

```tsx
background:
  'linear-gradient(90deg, rgba(var(--wo-accent-rgb), 0.24), rgba(var(--wo-accent-rgb), 0.42), rgba(var(--wo-accent-rgb), 0.6), rgba(var(--wo-accent-rgb), 0.78), rgba(var(--wo-accent-rgb), 0.94))',
```

```tsx
<span className="text-xs font-medium tabular-nums mt-0.5" style={{ color: trend > 0 ? 'var(--wo-positive)' : 'var(--wo-negative)' }}>
  {trend > 0 ? `+${trend}` : trend}
</span>
```

- [ ] **Step 3: Re-theme the PR modal and section accent gradients**

Use these exact replacements inside the PR overlay and section separators:

```tsx
style={{
  border: '1px solid var(--wo-accent-soft-border)',
  boxShadow: 'var(--wo-modal-shadow)',
}}
```

```tsx
<h2
  className="text-2xl font-extrabold mb-1"
  style={{ color: 'var(--wt-pr-color)', textShadow: '0 0 18px rgba(var(--wo-accent-rgb), 0.2)' }}
>
```

```tsx
style={{ background: ACCENT_SOFT_BG, border: '1px solid var(--wo-accent-soft-border)' }}
```

```tsx
style={{ background: 'rgba(var(--wo-accent-rgb), 0.86)', color: '#fffaf6' }}
```

```tsx
<div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(var(--wo-accent-rgb), 0.35), transparent)' }} />
```

- [ ] **Step 4: Re-run lint and build on the page file**

Run: `pnpm exec eslint src/pages/workouts.tsx --ext .ts,.tsx --max-warnings=0 && pnpm build`

Expected: eslint exits `0`, then Vite build completes successfully

- [ ] **Step 5: Commit the page-level cleanup**

```bash
git add src/pages/workouts.tsx
git commit -m "style: retheme workouts page accents"
```

## Task 4: Normalize component-level hardcoded accent colors

**Files:**
- Modify: `src/components/workout/AchievementsPanel.tsx`
- Modify: `src/components/workout/WorkoutWrapped.tsx`
- Modify: `src/components/workout/HighlightReel.tsx`
- Modify: `src/components/workout/SessionAdvisor.tsx`
- Modify: `src/components/workout/MuscleRecovery.tsx`
- Modify: `src/components/workout/MuscleDistributionPanel.tsx`
- Modify: `src/components/workout/VsMyselfPanel.tsx`
- Modify: `src/components/workout/FatigueCurve.tsx`
- Modify: `src/components/workout/TrainingHeartbeat.tsx`
- Modify: `src/components/workout/MuscleHexPanel.tsx`
- Modify: `src/components/workout/ComparisonPanel.tsx`
- Modify: `src/components/workout/ExerciseCoMatrix.tsx`
- Modify: `src/components/workout/VolumeLandmarks.tsx`
- Modify: `src/components/workout/ReadinessScore.tsx`
- Modify: `src/components/WorkoutCalendar/SpiralCalendar.tsx`

- [ ] **Step 1: Add a resolver in `AchievementsPanel.tsx` so the metadata list can stay intact**

Add this helper near the achievement metadata so old hex strings map into the new palette:

```tsx
const ACHIEVEMENT_COLOR_MAP: Record<string, string> = {
  '#6366f1': 'var(--wo-series-2)',
  '#4f46e5': 'var(--wo-series-3)',
  '#a855f7': 'var(--wo-series-4)',
  '#c084fc': 'var(--wo-series-5)',
  '#38bdf8': 'var(--wo-series-6)',
  '#2dd4bf': 'var(--wo-positive)',
  '#f472b6': 'var(--wo-series-8)',
  '#f59e0b': 'var(--wo-warning)',
  '#ffcc00': 'var(--wt-pr-color)',
};

const resolveAchievementColor = (color: string) =>
  ACHIEVEMENT_COLOR_MAP[color.toLowerCase()] ?? 'var(--color-brand)';
```

Then update every render site that currently uses the raw `color` field:

```tsx
const resolvedColor = resolveAchievementColor(color);
```

```tsx
style={{ color: unlocked ? resolvedColor : undefined }}
```

```tsx
style={{ width: `${progPct}%`, background: resolvedColor }}
```

Also replace the progress-bar gradient with:

```tsx
background: 'linear-gradient(90deg, var(--wo-series-3), var(--wo-series-2), var(--wt-pr-color))',
```

- [ ] **Step 2: Re-theme `WorkoutWrapped.tsx`, `HighlightReel.tsx`, and `SessionAdvisor.tsx`**

Use these exact replacements:

```tsx
background: 'linear-gradient(160deg, #1b1512 0%, #2a211d 52%, #171311 100%)',
border: '1px solid var(--wo-card-border)',
boxShadow: 'var(--wo-modal-shadow)',
```

```tsx
background: 'radial-gradient(circle, rgba(var(--wo-accent-rgb), 0.14) 0%, transparent 70%)',
```

```tsx
background: 'radial-gradient(circle, rgba(var(--wo-warning-rgb), 0.12) 0%, transparent 70%)',
```

```tsx
background: 'linear-gradient(135deg, var(--wt-pr-color), var(--wo-series-2))',
```

```tsx
color: n >= 365 ? 'var(--wt-pr-color)' : n >= 100 ? 'var(--wo-series-4)' : 'var(--wo-series-2)',
```

```tsx
style={{
  background: isDeload ? 'var(--wo-negative-bg)' : 'var(--wo-accent-soft-bg)',
  border: `1px solid ${isDeload ? 'var(--wo-negative)' : 'var(--wo-accent-soft-border)'}`,
}}
```

- [ ] **Step 3: Re-theme semantic status panels in `MuscleRecovery.tsx`, `MuscleDistributionPanel.tsx`, and `VsMyselfPanel.tsx`**

Apply these replacements:

```tsx
const readinessColor = (s: 'ready' | 'partial' | 'rest') =>
  s === 'ready' ? 'var(--wo-positive)' : s === 'partial' ? 'var(--wo-warning)' : 'var(--wo-negative)';
```

```tsx
background: period === p ? 'var(--wo-accent-soft-bg-strong)' : 'rgba(128,128,128,0.1)',
border: period === p ? '1px solid var(--wo-accent-soft-border)' : '1px solid transparent',
```

```tsx
{ lbl: IS_CHINESE ? '拉(Pull)' : 'Pull', val: balance.pull, color: 'var(--wo-series-2)' },
```

```tsx
style={{ background: 'var(--wo-accent-soft-bg)', border: '1px solid var(--wo-accent-soft-border)' }}
```

- [ ] **Step 4: Re-theme chart and SVG panels in `FatigueCurve.tsx`, `TrainingHeartbeat.tsx`, `MuscleHexPanel.tsx`, `ComparisonPanel.tsx`, `ExerciseCoMatrix.tsx`, `VolumeLandmarks.tsx`, `ReadinessScore.tsx`, and `SpiralCalendar.tsx`**

Use the following exact replacements as the baseline:

```tsx
<stop offset="5%" stopColor="var(--wo-chart-a)" stopOpacity={0.24} />
<stop offset="95%" stopColor="var(--wo-chart-a)" stopOpacity={0.03} />
```

```tsx
<ReferenceLine y={85} stroke="rgba(var(--wo-warning-rgb), 0.32)" strokeDasharray="3 3" />
```

```tsx
<Area type="monotone" dataKey="avg" stroke="var(--wo-chart-a)" strokeWidth={2} fill="url(#fatGrad)" dot={{ r: 3, fill: 'var(--wo-chart-a)' }} />
```

```tsx
stroke="rgba(var(--wo-accent-rgb), 0.35)" strokeWidth="1" strokeDasharray="3 2"
```

```tsx
background: isSelf ? 'var(--wo-accent-soft-bg)' : heatColor(ratio),
outline: isHovered ? '2px solid var(--wo-accent-line-strong)' : undefined,
```

```tsx
chest: { label: 'Chest', labelCN: '胸部', mev: 8, mavLo: 12, mavHi: 20, mrv: 22, color: 'var(--wo-series-2)' },
quads: { label: 'Quads', labelCN: '股四', mev: 8, mavLo: 12, mavHi: 18, mrv: 20, color: 'var(--wo-warning)' },
```

```tsx
stroke={isToday ? 'var(--wo-warning)' : 'none'}
```

- [ ] **Step 5: Run lint on the full modified component set**

Run:

```bash
pnpm exec eslint \
  src/components/workout/AchievementsPanel.tsx \
  src/components/workout/WorkoutWrapped.tsx \
  src/components/workout/HighlightReel.tsx \
  src/components/workout/SessionAdvisor.tsx \
  src/components/workout/MuscleRecovery.tsx \
  src/components/workout/MuscleDistributionPanel.tsx \
  src/components/workout/VsMyselfPanel.tsx \
  src/components/workout/FatigueCurve.tsx \
  src/components/workout/TrainingHeartbeat.tsx \
  src/components/workout/MuscleHexPanel.tsx \
  src/components/workout/ComparisonPanel.tsx \
  src/components/workout/ExerciseCoMatrix.tsx \
  src/components/workout/VolumeLandmarks.tsx \
  src/components/workout/ReadinessScore.tsx \
  src/components/WorkoutCalendar/SpiralCalendar.tsx \
  --ext .ts,.tsx --max-warnings=0
```

Expected: command exits `0` with no lint errors

- [ ] **Step 6: Commit the component-level cleanup**

```bash
git add \
  src/components/workout/AchievementsPanel.tsx \
  src/components/workout/WorkoutWrapped.tsx \
  src/components/workout/HighlightReel.tsx \
  src/components/workout/SessionAdvisor.tsx \
  src/components/workout/MuscleRecovery.tsx \
  src/components/workout/MuscleDistributionPanel.tsx \
  src/components/workout/VsMyselfPanel.tsx \
  src/components/workout/FatigueCurve.tsx \
  src/components/workout/TrainingHeartbeat.tsx \
  src/components/workout/MuscleHexPanel.tsx \
  src/components/workout/ComparisonPanel.tsx \
  src/components/workout/ExerciseCoMatrix.tsx \
  src/components/workout/VolumeLandmarks.tsx \
  src/components/workout/ReadinessScore.tsx \
  src/components/WorkoutCalendar/SpiralCalendar.tsx
git commit -m "style: normalize workout component accent colors"
```

## Task 5: Final verification and regression sweep

**Files:**
- Modify: none
- Verify: `src/styles/index.css`
- Verify: `src/pages/workouts.tsx`
- Verify: `src/components/workout/*.tsx`
- Verify: `src/components/WorkoutCalendar/SpiralCalendar.tsx`

- [ ] **Step 1: Run the full repo checks used for this styling task**

Run:

```bash
pnpm exec eslint src --ext .ts,.tsx --max-warnings=0
pnpm build
```

Expected:

- eslint exits `0`
- Vite build completes successfully

- [ ] **Step 2: Manually inspect dark theme**

Open the app and verify all of the following in `data-theme='dark'`:

```text
- calendar heatmap uses terracotta ramp, not indigo
- cards use warm tinted surfaces and brown-tinted shadows
- active chips and pills use terracotta accent
- PR modal no longer mixes purple shell + gold headline
- positive / negative / warning states remain distinct
- busy charts still separate primary vs secondary series clearly
```

- [ ] **Step 3: Manually inspect light theme**

Open the app and verify all of the following in `data-theme='light'`:

```text
- page background reads as warm paper, not cool white
- card borders and dividers stay visible without becoming harsh
- terracotta remains the dominant accent across filters, badges, and chart highlights
- warning and negative states stay readable on pale surfaces
- no leftover indigo / cyan / pink accents dominate the page
```

- [ ] **Step 4: Search for leftover cool-theme literals before closing**

Run:

```bash
rg -n "99,102,241|129,140,248|165,180,252|245,158,11|252,211,77|45,212,191|244,114,182|56,189,248|192,132,252|#6366f1|#4f46e5|#4338ca|#a5b4fc|#f59e0b|#fcd34d|#2dd4bf|#f472b6|#38bdf8|#c084fc" src/pages src/components
```

Expected: either no matches, or only intentional semantic exceptions that are immediately reviewed and accepted

- [ ] **Step 5: Commit the final verification pass**

```bash
git add -A
git commit -m "chore: verify workouts color redesign"
```
