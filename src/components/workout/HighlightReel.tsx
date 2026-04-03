import { useMemo, useState } from 'react';
import { WorkoutSession } from '@/types/workout';
import { calcE1RM, WORKING_SET_TYPES } from '@/utils/workoutCalcs';
import { translateExercise } from '@/utils/exerciseTranslations';
import { IS_CHINESE } from './WorkoutUI';

type Highlight = {
  id: string;
  date: string;
  icon: string;
  title: string;
  desc: string;
  color: string;
  importance: number; // 1-3, for sizing
};

const buildHighlights = (workouts: WorkoutSession[]): Highlight[] => {
  const sorted = [...workouts].sort((a, b) => a.start_time.localeCompare(b.start_time));
  const highlights: Highlight[] = [];

  if (sorted.length === 0) return [];

  // First session
  const first = sorted[0];
  highlights.push({
    id: 'first',
    date: first.start_time.slice(0, 10),
    icon: '🎯',
    title: IS_CHINESE ? '健身生涯第一步' : 'First Workout',
    desc: IS_CHINESE ? `完成了第一次训练 - ${first.title}` : `Started with ${first.title}`,
    color: '#34d399',
    importance: 3,
  });

  // Session count milestones
  [10, 25, 50, 100, 200, 365, 500].forEach((n) => {
    if (sorted.length >= n) {
      const w = sorted[n - 1];
      highlights.push({
        id: `s${n}`,
        date: w.start_time.slice(0, 10),
        icon: n >= 365 ? '🏆' : n >= 100 ? '💎' : '🎉',
        title: IS_CHINESE ? `第 ${n} 次训练` : `${n}th Workout`,
        desc: IS_CHINESE ? `完成了第 ${n} 次训练 - ${w.title}` : `Milestone: ${n} sessions`,
        color: n >= 365 ? '#ffcc00' : n >= 100 ? '#a855f7' : '#6366f1',
        importance: n >= 100 ? 3 : n >= 50 ? 2 : 1,
      });
    }
  });

  // Cumulative volume milestones
  let cumVol = 0;
  const volMilestones = [10000, 50000, 100000, 250000, 500000, 1000000];
  let nextMilestoneIdx = 0;
  for (const w of sorted) {
    cumVol += w.total_volume_kg;
    while (nextMilestoneIdx < volMilestones.length && cumVol >= volMilestones[nextMilestoneIdx]) {
      const m = volMilestones[nextMilestoneIdx];
      highlights.push({
        id: `v${m}`,
        date: w.start_time.slice(0, 10),
        icon: '📦',
        title: IS_CHINESE ? `累计出力 ${(m / 1000).toFixed(0)}t` : `${(m / 1000).toFixed(0)}t Total Volume`,
        desc: IS_CHINESE
          ? `累计总出力突破 ${m.toLocaleString()} kg`
          : `Reached ${m.toLocaleString()} kg total volume`,
        color: m >= 500000 ? '#ffcc00' : m >= 100000 ? '#a855f7' : '#f59e0b',
        importance: m >= 100000 ? 3 : 2,
      });
      nextMilestoneIdx++;
    }
  }

  // All-time e1RM milestones
  let maxE1RM = 0;
  const e1rmMilestones = [60, 80, 100, 120, 140, 150, 180, 200];
  const hitMilestones = new Set<number>();
  for (const w of sorted) {
    for (const ex of w.exercises) {
      for (const s of ex.sets) {
        if (!WORKING_SET_TYPES.has(s.type) || !s.weight_kg || !s.reps) continue;
        const e1rm = calcE1RM(s.weight_kg, s.reps);
        if (e1rm > maxE1RM) {
          for (const m of e1rmMilestones) {
            if (!hitMilestones.has(m) && e1rm >= m) {
              hitMilestones.add(m);
              highlights.push({
                id: `e${m}`,
                date: w.start_time.slice(0, 10),
                icon: m >= 150 ? '🦁' : '💪',
                title: IS_CHINESE ? `e1RM 突破 ${m}kg` : `e1RM ${m}kg`,
                desc: IS_CHINESE
                  ? `${translateExercise(ex.name)} 推算最大力量达到 ${m}kg`
                  : `${ex.name} estimated 1RM hit ${m}kg`,
                color: m >= 150 ? '#ef4444' : m >= 100 ? '#f97316' : '#f59e0b',
                importance: m >= 150 ? 3 : m >= 100 ? 2 : 1,
              });
            }
          }
          maxE1RM = Math.max(maxE1RM, e1rm);
        }
      }
    }
  }

  // Longest single session
  const longestSession = sorted.reduce(
    (a, b) => (a.duration_seconds > b.duration_seconds ? a : b),
    sorted[0],
  );
  if (longestSession.duration_seconds >= 3600) {
    highlights.push({
      id: 'longest',
      date: longestSession.start_time.slice(0, 10),
      icon: '⏱',
      title: IS_CHINESE ? '最长训练' : 'Longest Session',
      desc: IS_CHINESE
        ? `历史最长训练 ${Math.round(longestSession.duration_seconds / 60)} 分钟`
        : `Longest session: ${Math.round(longestSession.duration_seconds / 60)} min`,
      color: '#06b6d4',
      importance: 2,
    });
  }

  // Best single session volume
  const bestVol = sorted.reduce(
    (a, b) => (a.total_volume_kg > b.total_volume_kg ? a : b),
    sorted[0],
  );
  if (bestVol.total_volume_kg > 0) {
    highlights.push({
      id: 'bestvol',
      date: bestVol.start_time.slice(0, 10),
      icon: '🌟',
      title: IS_CHINESE ? '单次出力之最' : 'Best Single Session',
      desc: IS_CHINESE
        ? `单次训练出力 ${bestVol.total_volume_kg.toLocaleString()} kg`
        : `${bestVol.total_volume_kg.toLocaleString()} kg in one session`,
      color: '#818cf8',
      importance: 3,
    });
  }

  // Streak milestones
  ([7, 14, 21, 30] as const).forEach((days) => {
    let maxStreak = 0,
      cur = 1;
    let streakEndDate = '';
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1].start_time.slice(0, 10);
      const curr = sorted[i].start_time.slice(0, 10);
      const diff = (new Date(curr).getTime() - new Date(prev).getTime()) / 86400000;
      if (diff <= 1) {
        cur++;
        if (cur > maxStreak) {
          maxStreak = cur;
          streakEndDate = curr;
        }
      } else {
        cur = 1;
      }
    }
    if (maxStreak >= days && streakEndDate) {
      highlights.push({
        id: `streak${days}`,
        date: streakEndDate,
        icon: days >= 30 ? '🔥' : '⚡',
        title: IS_CHINESE ? `${days}天连续训练` : `${days}-day Streak`,
        desc: IS_CHINESE
          ? `达成连续训练${days}天的里程碑`
          : `Achieved ${days} consecutive training days`,
        color: days >= 30 ? '#f97316' : '#fbbf24',
        importance: days >= 21 ? 3 : 2,
      });
    }
  });

  // Sort by date descending, deduplicate by id
  const seen = new Set<string>();
  return highlights
    .filter((h) => {
      if (seen.has(h.id)) return false;
      seen.add(h.id);
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
};

const HighlightReel = ({ workouts }: { workouts: WorkoutSession[] }) => {
  const [showAll, setShowAll] = useState(false);
  const highlights = useMemo(() => buildHighlights(workouts), [workouts]);
  const visible = showAll ? highlights : highlights.slice(0, 8);

  if (highlights.length === 0) {
    return (
      <div style={{ opacity: 0.4, textAlign: 'center', padding: 24, fontSize: 13 }}>
        {IS_CHINESE ? '暂无训练高光时刻' : 'No highlights yet'}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-semibold uppercase tracking-[0.1em] opacity-40">
          {IS_CHINESE ? '训练高光时刻' : 'Highlight Reel'}
        </div>
        <span style={{ fontSize: 11, opacity: 0.35 }}>{highlights.length} 个里程碑</span>
      </div>

      <div className="relative">
        {/* Timeline vertical line */}
        <div
          style={{
            position: 'absolute',
            left: 15,
            top: 0,
            bottom: 0,
            width: 1,
            background: 'rgba(128,128,128,0.12)',
          }}
        />

        <div className="space-y-3">
          {visible.map((h, idx) => (
            <div
              key={h.id}
              className="flex gap-3 items-start"
              style={{ animation: `slideUp 0.4s ease ${idx * 0.05}s both` }}
            >
              {/* Icon dot */}
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  flexShrink: 0,
                  zIndex: 1,
                  background: `${h.color}20`,
                  border: `2px solid ${h.color}50`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: h.importance === 3 ? 16 : 13,
                }}
              >
                {h.icon}
              </div>
              {/* Content */}
              <div
                style={{
                  flex: 1,
                  paddingBottom: 12,
                  borderBottom:
                    idx < visible.length - 1 ? '1px solid rgba(128,128,128,0.07)' : 'none',
                }}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    style={{
                      fontSize: h.importance === 3 ? 13 : 12,
                      fontWeight: h.importance === 3 ? 600 : 500,
                      color: h.color,
                    }}
                  >
                    {h.title}
                  </span>
                  {h.importance === 3 && (
                    <span
                      style={{
                        fontSize: 8,
                        padding: '1px 5px',
                        borderRadius: 99,
                        background: h.color + '20',
                        color: h.color,
                        fontWeight: 700,
                      }}
                    >
                      ★
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, opacity: 0.55 }}>{h.desc}</div>
                <div style={{ fontSize: 10, opacity: 0.3, marginTop: 2 }}>{h.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {highlights.length > 8 && (
        <button
          onClick={() => setShowAll((s) => !s)}
          style={{
            marginTop: 12,
            width: '100%',
            padding: '7px 0',
            borderRadius: 10,
            background: 'rgba(128,128,128,0.05)',
            border: '1px solid rgba(128,128,128,0.1)',
            cursor: 'pointer',
            fontSize: 12,
            opacity: 0.55,
            color: 'inherit',
          }}
        >
          {showAll ? '▲ 收起' : `▼ 展开全部 (${highlights.length - 8} 个更多)`}
        </button>
      )}
    </div>
  );
};

export default HighlightReel;
