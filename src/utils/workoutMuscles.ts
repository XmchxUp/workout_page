// ─────────────────────────────────────────────────────────────────────────────
// Muscle group mapping utilities
// ─────────────────────────────────────────────────────────────────────────────

export const MUSCLE_PATTERNS: Array<{ muscle: string; patterns: string[] }> = [
  { muscle: 'chest',      patterns: ['bench press','chest fly','pec deck','cable crossover','crossover','push up','pushup','俯卧撑','chest press','chest dip','incline press','decline press'] },
  { muscle: 'back',       patterns: ['row','lat pulldown','lat pull','pull up','chin up','pullup','deadlift','face pull','pullover'] },
  { muscle: 'shoulders',  patterns: ['shoulder press','lateral raise','front raise','arnold press','overhead press','upright row','shrug','military press','rear delt','reverse fly','face pull'] },
  { muscle: 'biceps',     patterns: ['bicep curl','biceps curl','hammer curl','preacher curl','concentration curl','barbell curl','ez bar bicep'] },
  { muscle: 'triceps',    patterns: ['tricep','pushdown','skull crusher','skullcrusher','close grip','bench dip','overhead ext','rope push'] },
  { muscle: 'abs',        patterns: ['crunch','plank','leg raise','sit up','ab wheel','hanging leg','lying leg raise','torso rotation','rotation','russian twist','woodchop'] },
  { muscle: 'quads',      patterns: ['squat','leg press','leg extension','lunge','hack squat','step up'] },
  { muscle: 'hamstrings', patterns: ['leg curl','romanian','rdl','nordic','hamstring'] },
  { muscle: 'glutes',     patterns: ['hip thrust','glute bridge','hip extension','hip abduction','abduction','臀'] },
  { muscle: 'calves',     patterns: ['calf raise','seated calf'] },
];

export const MUSCLE_LABELS_CN: Record<string, string> = {
  chest:'胸部', back:'背部', shoulders:'肩部', biceps:'二头',
  triceps:'三头', abs:'腹部', quads:'大腿前', hamstrings:'大腿后',
  glutes:'臀部', calves:'小腿',
};

export const MUSCLE_CHART_COLORS: Record<string, string> = {
  back:       'var(--wo-series-2)',
  chest:      'var(--wo-series-4)',
  quads:      'var(--wo-series-1)',
  shoulders:  'var(--wo-series-3)',
  biceps:     'var(--wo-series-6)',
  triceps:    'var(--wo-series-5)',
  hamstrings: 'var(--wo-series-7)',
  glutes:     'var(--wo-series-8)',
  abs:        'var(--wo-series-5)',
  calves:     'var(--wo-series-6)',
};

export const PUSH_MUSCLES  = ['chest', 'shoulders', 'triceps'];
export const PULL_MUSCLES  = ['back',  'biceps'];
export const LEGS_MUSCLES  = ['quads', 'hamstrings', 'glutes', 'calves'];
export const CORE_MUSCLES  = ['abs'];

export const getExerciseMuscles = (name: string): string[] => {
  const n = name.toLowerCase();
  const muscles: string[] = [];
  for (const { muscle, patterns } of MUSCLE_PATTERNS) {
    if (patterns.some((p) => n.includes(p) || name.includes(p))) muscles.push(muscle);
  }
  return muscles;
};

// ─────────────────────────────────────────────────────────────────────────────
// Hexagram axes — 6 muscle groups for the radar chart
// ─────────────────────────────────────────────────────────────────────────────
export const HEXA_AXES = [
  { key: 'back',      label: '背部',  muscles: ['back'],                              color: 'var(--wo-series-2)' },
  { key: 'shoulders', label: '肩部',  muscles: ['shoulders'],                         color: 'var(--wo-series-3)' },
  { key: 'chest',     label: '胸部',  muscles: ['chest'],                             color: 'var(--wo-series-4)' },
  { key: 'core',      label: '核心',  muscles: ['abs'],                               color: 'var(--wo-series-5)' },
  { key: 'legs',      label: '腿部',  muscles: ['quads','hamstrings','glutes','calves'], color: 'var(--wo-series-1)' },
  { key: 'arms',      label: '手臂',  muscles: ['biceps','triceps'],                  color: 'var(--wo-series-6)' },
] as const;

export type HexaKey = typeof HEXA_AXES[number]['key'];
