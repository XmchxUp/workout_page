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
  back:       '#6366f1', chest:      '#a855f7', quads:      '#ec4899',
  shoulders:  '#f97316', biceps:     '#3b82f6', triceps:    '#10b981',
  hamstrings: '#f59e0b', glutes:     '#ef4444', abs:        '#06b6d4',
  calves:     '#84cc16',
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
  { key: 'back',      label: '背部',  muscles: ['back'],                              color: '#6366f1' },
  { key: 'shoulders', label: '肩部',  muscles: ['shoulders'],                         color: '#f97316' },
  { key: 'chest',     label: '胸部',  muscles: ['chest'],                             color: '#a855f7' },
  { key: 'core',      label: '核心',  muscles: ['abs'],                               color: '#06b6d4' },
  { key: 'legs',      label: '腿部',  muscles: ['quads','hamstrings','glutes','calves'], color: '#ec4899' },
  { key: 'arms',      label: '手臂',  muscles: ['biceps','triceps'],                  color: '#3b82f6' },
] as const;

export type HexaKey = typeof HEXA_AXES[number]['key'];
