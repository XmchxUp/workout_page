import { useMemo } from 'react';
import { WorkoutSession } from '@/types/workout';
import { getExerciseMuscles, HEXA_AXES } from '@/utils/workoutMuscles';
import { WORKING_SET_TYPES } from '@/utils/workoutCalcs';

const IS_CHINESE = true;

const GROUP_ICONS: Record<string, string> = {
  chest: '💓', back: '🦅', shoulders: '🏔️', arms: '💪', legs: '🦵', core: '⚡',
};

// Recovery hours based on working set count — more reliable than raw volume
// (volume varies 10× between exercises/individuals; sets are consistent)
const recoveryHoursFromSets = (sets: number): number => {
  if (sets >= 12) return 72;
  if (sets >= 8)  return 60;
  if (sets >= 4)  return 48;
  return 36;
};

const MuscleRecovery = ({ workouts }: { workouts: WorkoutSession[] }) => {
  const recovery = useMemo(() => {
    // Compute `now` inside memo — avoids invalidating cache on every render
    const now = Date.now();

    return HEXA_AXES.map((group) => {
      // Find all sessions that involved this muscle group, sorted newest first
      const relevantSessions = workouts
        .filter((w) => {
          const sessionMuscles = new Set(w.exercises.flatMap((ex) => getExerciseMuscles(ex.name)));
          return group.muscles.some((m) => sessionMuscles.has(m));
        })
        .sort((a, b) => b.start_time.localeCompare(a.start_time));

      if (relevantSessions.length === 0) {
        return {
          ...group, icon: GROUP_ICONS[group.key] ?? '•',
          pct: 100, hoursAgo: null, status: 'never' as const, hoursLeft: 0, effectiveSets: 0,
        };
      }

      const lastDate = new Date(relevantSessions[0].start_time);
      const hoursAgo = (now - lastDate.getTime()) / 3600000;

      // Accumulate effective sets across recent sessions with exponential time decay:
      // effectiveSets = Σ (sets_in_session × 0.5^(hours_ago / 24))
      // This means a session from 24h ago counts half as much, 48h ago counts 25%, etc.
      // Sessions older than 4 days (96h) contribute negligibly and are ignored.
      let effectiveSets = 0;
      for (const w of relevantSessions) {
        const sessionHoursAgo = (now - new Date(w.start_time).getTime()) / 3600000;
        if (sessionHoursAgo > 96) break; // sorted by recency, so we can break early

        const decayFactor = Math.pow(0.5, sessionHoursAgo / 24);
        let sessionSets = 0;
        w.exercises.forEach((ex) => {
          const muscles = getExerciseMuscles(ex.name);
          if (group.muscles.some((gm) => muscles.includes(gm))) {
            sessionSets += ex.sets.filter((s) => WORKING_SET_TYPES.has(s.type)).length;
          }
        });
        effectiveSets += sessionSets * decayFactor;
      }

      const recoveryHours = recoveryHoursFromSets(Math.round(effectiveSets));
      const pct = Math.min(100, Math.round((hoursAgo / recoveryHours) * 100));
      const hoursLeft = Math.max(0, Math.round(recoveryHours - hoursAgo));

      return {
        ...group,
        icon: GROUP_ICONS[group.key] ?? '•',
        pct,
        hoursAgo: Math.round(hoursAgo),
        status: pct >= 95 ? 'ready' as const : pct >= 60 ? 'partial' as const : 'rest' as const,
        hoursLeft,
        effectiveSets: Math.round(effectiveSets),
      };
    });
  }, [workouts]);

  const statusColor = (s: string) =>
    s === 'ready' ? '#22c55e' : s === 'partial' ? '#f59e0b' : '#ef4444';

  const statusLabel = (s: string) =>
    s === 'ready'   ? (IS_CHINESE ? '✓ 可以训练' : '✓ Ready') :
    s === 'never'   ? (IS_CHINESE ? '从未训练'   : 'Never')   :
    s === 'partial' ? (IS_CHINESE ? '部分恢复'   : 'Partial') :
                      (IS_CHINESE ? '需要休息'   : 'Rest');

  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.1em] opacity-40 mb-3">
        {IS_CHINESE ? '肌肉恢复状态' : 'Muscle Recovery'}
      </div>
      <div className="space-y-3">
        {recovery.map((r) => (
          <div key={r.key}>
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5 text-sm">
                <span>{r.icon}</span>
                <span style={{ opacity: 0.8, fontWeight: 500 }}>
                  {IS_CHINESE ? r.label : r.key}
                </span>
                {r.effectiveSets > 0 && (
                  <span style={{ fontSize: 10, opacity: 0.28 }}>·{r.effectiveSets}组</span>
                )}
              </span>
              <div className="flex items-center gap-2">
                {r.hoursAgo !== null && (
                  <span style={{ fontSize: 10, opacity: 0.4 }}>
                    {r.hoursAgo < 24
                      ? `${r.hoursAgo}h${IS_CHINESE ? '前' : ' ago'}`
                      : `${Math.round(r.hoursAgo / 24)}d${IS_CHINESE ? '前' : ' ago'}`}
                  </span>
                )}
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 99,
                  background: statusColor(r.status) + '20', color: statusColor(r.status),
                }}>
                  {r.status === 'ready' || r.status === 'never'
                    ? statusLabel(r.status)
                    : `${r.hoursLeft}h${IS_CHINESE ? '后恢复' : ' left'}`}
                </span>
              </div>
            </div>
            <div style={{ height: 5, borderRadius: 99, background: 'rgba(128,128,128,0.12)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 99,
                width: `${r.pct}%`,
                background: r.status === 'ready'
                  ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                  : r.status === 'partial'
                  ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                  : 'linear-gradient(90deg, #ef4444, #f87171)',
                transition: 'width 1s ease',
              }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10, opacity: 0.3, marginTop: 12, textAlign: 'right' }}>
        {IS_CHINESE
          ? '基于有效组数（含时间衰减）估算 · 仅供参考'
          : 'Based on set count with time decay · Estimate only'}
      </div>
    </div>
  );
};

export default MuscleRecovery;
