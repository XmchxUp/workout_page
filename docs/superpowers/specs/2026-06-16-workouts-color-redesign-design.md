# Workouts color redesign

Date: 2026-06-16
Status: approved in conversation, pending final spec review

## Context

The current workouts dashboard already has a centralized theme system in [src/styles/index.css](/Users/ultraman/workspace/foss/workout_page/src/styles/index.css:1), with `data-theme` switching between light and dark modes. Most panels, charts, badges, and hover states read from shared CSS variables, but the visual identity is still anchored to a cool indigo / violet palette with several competing accent colors.

That creates three design problems:

1. The page reads like a generic neon analytics dashboard instead of a deliberate training journal.
2. Accent usage is too broad. Indigo, cyan, pink, amber, green, and red all compete for attention.
3. Light and dark modes are structurally paired, but they do not feel like the same brand translated across two surfaces.

## Goal

Redesign the full workouts color system for both light and dark themes so the page feels restrained, editorial, and premium.

Approved direction:

- Mood: restrained and high-end, closer to an editorial training log than a neon dashboard
- Base palette: warm grays / stone neutrals
- Primary accent: terracotta
- Chart approach: default to terracotta ramps, reserve semantic breakout colors only for true positive / negative / warning meaning

## Non-goals

- No component architecture rewrite
- No layout redesign
- No typography overhaul in this task
- No change to data logic, chart logic, or page information architecture
- No dependency additions

## Existing implementation constraints

- Stack: Vite + React + Tailwind v4 utilities + global CSS variables
- Theme switching already works through `useTheme` and the `data-theme` attribute
- Most reusable surfaces already consume tokens such as `--wo-card-bg`, `--wo-card-border`, `--wc-l1` through `--wc-l4`, and chart color variables
- Some components still contain hardcoded accent colors inline and will need targeted cleanup

## Design decision

### 1. Theme token strategy

Rebuild the palette at the token layer first, preserving existing token names where practical so the component tree can inherit the redesign without behavioral changes.

Dark theme target:

- Background: deep graphite brown instead of pure black
- Text: warm off-white / pale linen
- Cards: translucent warm overlays, not cold gray glass
- Borders and dividers: low-contrast warm brown-gray lines

Light theme target:

- Background: paper-like warm stone / linen surface
- Text: cocoa / espresso brown instead of cool near-black
- Cards: soft ivory / milk-glass surfaces
- Borders and dividers: faint warm neutral separators

Accent target:

- `terracotta` becomes the single shared brand accent for active controls, section emphasis, badges, chart highlights, heatmap emphasis, and focus accents
- Both themes must feel like the same system under different light conditions, not two separate designs

### 2. Heatmap and activity ramp

The current `--wc-l1` to `--wc-l4` indigo progression will be replaced with a terracotta intensity ramp.

Purpose:

- calendar heatmaps
- active chips
- emphasized counts
- primary trend lines and bars
- card hover border tinting

Expected behavior:

- empty states stay subdued and neutral
- increasing activity moves through darker / richer terracotta steps
- the highest emphasis state remains readable in both themes without becoming neon

### 3. Chart color strategy

Default chart behavior should move from multi-accent categorization to a restrained single-family system.

Rules:

- Standard data series use terracotta ramps first
- Secondary comparison series use opacity or a darker / lighter terracotta step before introducing a different hue
- Only explicit semantic meaning may use reserved semantic colors

Reserved semantic colors:

- positive: muted sage green
- negative: softened brick red
- warning: ochre / brown-amber

This applies to:

- chart series tokens such as `--wo-chart-a`, `--wo-chart-b`, `--wo-chart-c`
- generic series tokens such as `--wo-series-1` through `--wo-series-8`
- training-specific semantic tokens such as `--wo-fitness`, `--wo-fatigue`, `--wo-form`

Where semantic meaning is not essential, these tokens should be collapsed toward the terracotta family instead of remaining visually independent.

### 4. Surface and interaction strategy

This redesign is not only a token swap. The way color lands on surfaces must also be normalized.

Card surfaces:

- keep the current layered / translucent behavior
- remove the cool neon glow feeling
- move to warm overlays and brown-tinted shadows

Borders and dividers:

- warm neutral separators
- enough contrast to preserve information grouping
- no crisp cold white borders

Interactive states:

- hover: small lift in perceived brightness and border tint, not a glow effect
- active: slight compression / emphasis using the same terracotta family
- focus: visible terracotta ring with restrained opacity
- selected chips and toggles: use the same accent logic as the broader theme

Special emphasis states:

- PR states
- completed goal states
- active filters
- highlighted badges

These should all align with the terracotta accent system instead of using unrelated gold, indigo, cyan, or pink highlights.

## Token groups to update

The implementation should primarily update the following groups in [src/styles/index.css](/Users/ultraman/workspace/foss/workout_page/src/styles/index.css:1):

- `--wc-empty`, `--wc-l1`, `--wc-l2`, `--wc-l3`, `--wc-l4`, `--wc-today`, `--wc-hover`
- `--wt-border`, `--wt-hover`, `--wt-chip-bg`, `--wt-detail-bg`, `--wt-icon`, `--wt-pr-color`, `--wt-pr-bg`
- `--wo-card-bg`, `--wo-card-border`, `--wo-card-hover`, `--wo-section-line`
- `--wo-chart-a`, `--wo-chart-b`, `--wo-chart-c`
- `--wo-series-1` through `--wo-series-8`
- `--wo-positive`, `--wo-positive-bg`, `--wo-negative`, `--wo-negative-bg`, `--wo-warning`, `--wo-warning-bg`
- `--wo-fitness`, `--wo-fatigue`, `--wo-form`, `--wo-grid`, `--wo-axis-text`
- `--color-brand`, `--color-bg`, `--color-tx`, `--color-hr`, `--color-run-row-hover-background`

## Hardcoded color cleanup

The implementation must also replace visible hardcoded colors that would otherwise break the new system.

Known categories already visible in the codebase:

- indigo inline backgrounds and borders used in pills / highlights
- amber / gold accents used for PR and trophy states
- cyan and pink section line gradients
- Tailwind hardcoded `text-green-*`, `text-red-*`, `text-orange-*` classes for semantic states
- hardcoded `rgba(99,102,241,...)` blocks and similar cool indigo overlays

Cleanup rule:

- if a hardcoded color expresses theme identity, replace it with a token
- if a hardcoded color expresses semantic meaning, either keep it only if it already matches the new semantic palette or migrate it to a semantic token

## Files in scope

Primary file:

- [src/styles/index.css](/Users/ultraman/workspace/foss/workout_page/src/styles/index.css:1)

Likely supporting files with hardcoded accent cleanup:

- [src/pages/workouts.tsx](/Users/ultraman/workspace/foss/workout_page/src/pages/workouts.tsx:1)
- [src/components/workout/WorkoutUI.tsx](/Users/ultraman/workspace/foss/workout_page/src/components/workout/WorkoutUI.tsx:1)
- [src/components/workout/ExpandableCard.tsx](/Users/ultraman/workspace/foss/workout_page/src/components/workout/ExpandableCard.tsx:1)
- any other workout panel component containing inline indigo / amber / pink / cyan values

## Implementation approach

1. Redefine the light and dark theme variables in `src/styles/index.css`.
2. Normalize shared surface styling to warm borders, warm overlays, and tinted shadows.
3. Replace remaining hardcoded identity colors in the workouts page and panel components with tokens.
4. Preserve semantic readability for positive / negative / warning states.
5. Validate that light and dark mode still switch correctly and that charts remain readable.

## Validation

Required checks:

1. Build the project successfully.
2. Manually inspect both `data-theme='dark'` and `data-theme='light'`.
3. Verify these UI areas:
   - calendar heatmap
   - cards and section headers
   - badges and active filters
   - PR modal / trophy / highlighted achievement states
   - chart series contrast
   - positive / negative / warning readability
4. Confirm there are no leftover visually dominant cool-theme accents unless they carry explicit semantic meaning.

## Risks

- Over-collapsing chart colors can reduce data separation in dense panels.
- Terracotta can become muddy if contrast is too low in dark mode.
- Light theme can lose crispness if warm neutrals are too low-contrast.

Mitigation:

- keep semantic breakout colors for meaning-heavy states
- use depth, opacity, and tone steps before introducing new hues
- test the busiest chart panels after token replacement

## Acceptance criteria

- The page no longer reads as an indigo / neon dashboard.
- Light and dark modes feel like the same brand rendered on different surfaces.
- Terracotta is the dominant highlight color across interactions and data emphasis.
- Charts are calmer overall, with semantic colors used sparingly and intentionally.
- Existing functionality and theme switching continue to work without component rewrites.
