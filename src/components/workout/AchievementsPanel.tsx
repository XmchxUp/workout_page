import { useState, useMemo } from 'react';
import type { WorkoutSession } from '@/types/workout';
import { calcStreak, calcE1RM, WARMUP_NAMES, WORKING_SET_TYPES } from '@/utils/workoutCalcs';
import { getExerciseMuscles, HEXA_AXES } from '@/utils/workoutMuscles';
import { IS_CHINESE } from './WorkoutUI';

// ─────────────────────────────────────────────────────────────────────────────
// Achievement meta type
// ─────────────────────────────────────────────────────────────────────────────
export type AchievMeta = {
  sessionCount: number; longestStreak: number; consecutiveWeeks: number; maxWeekStreak3: number;
  totalVolume: number; maxSingleVol: number; maxE1RM: number; maxSingleSetWeight: number;
  exerciseCount: number; muscleCount: number; prCount: number;
  maxDuration: number; maxSetsInSession: number; maxExercisesInSession: number;
  maxRepsInSession: number; maxRepsInSet: number;
  totalSets: number; totalReps: number; totalDurationSec: number;
  earliestHour: number; latestHour: number; has5am: boolean; hasMidnight: boolean;
  morningCount: number; noonCount: number; eveningCount: number; nightCount: number;
  weekendSessions: number; mondayCount: number; fridayCount: number;
  trainedEveryDayOfWeek: boolean; maxWeekSessions: number; maxMonthSessions: number;
  trainedMonthsCount: number; trainedYearsCount: number;
  hasDoubleDay: boolean; hasTripleDay: boolean;
  pushSessions: number; pullSessions: number; legSessions: number;
  coreSessions: number; shoulderSessions: number; armSessions: number;
  maxDayGap: number; hasComeback14: boolean; hasComeback30: boolean;
  newYearSession: boolean; christmasSession: boolean;
  weeksWith3plus: number; monthsWith10plus: number; maxMonthStreak10: number;
  chestVolume: number; backVolume: number; legVolume: number;
  springSession: boolean; summerSession: boolean; fallSession: boolean; winterSession: boolean;
  janSessions: number;
};

export const calcAchievMeta = (workouts: WorkoutSession[]): AchievMeta => {
  const zero: AchievMeta = {
    sessionCount:0, longestStreak:0, consecutiveWeeks:0, maxWeekStreak3:0,
    totalVolume:0, maxSingleVol:0, maxE1RM:0, maxSingleSetWeight:0,
    exerciseCount:0, muscleCount:0, prCount:0,
    maxDuration:0, maxSetsInSession:0, maxExercisesInSession:0,
    maxRepsInSession:0, maxRepsInSet:0, totalSets:0, totalReps:0, totalDurationSec:0,
    earliestHour:24, latestHour:0, has5am:false, hasMidnight:false,
    morningCount:0, noonCount:0, eveningCount:0, nightCount:0,
    weekendSessions:0, mondayCount:0, fridayCount:0,
    trainedEveryDayOfWeek:false, maxWeekSessions:0, maxMonthSessions:0,
    trainedMonthsCount:0, trainedYearsCount:0,
    hasDoubleDay:false, hasTripleDay:false,
    pushSessions:0, pullSessions:0, legSessions:0,
    coreSessions:0, shoulderSessions:0, armSessions:0,
    maxDayGap:0, hasComeback14:false, hasComeback30:false,
    newYearSession:false, christmasSession:false,
    weeksWith3plus:0, monthsWith10plus:0, maxMonthStreak10:0,
    chestVolume:0, backVolume:0, legVolume:0,
    springSession:false, summerSession:false, fallSession:false, winterSession:false,
    janSessions:0,
  };
  if (workouts.length === 0) return zero;

  const { longest } = calcStreak(workouts);
  const sorted = [...workouts].sort((a, b) => a.start_time.localeCompare(b.start_time));

  let totalVolume=0, maxSingleVol=0, totalSets=0, totalReps=0, totalDurationSec=0;
  let maxDuration=0, maxSetsInSession=0, maxExercisesInSession=0, maxRepsInSession=0;
  let maxE1RM=0, maxSingleSetWeight=0, maxRepsInSet=0;
  let morningCount=0, noonCount=0, eveningCount=0, nightCount=0;
  let weekendSessions=0, mondayCount=0, fridayCount=0;
  let pushSessions=0, pullSessions=0, legSessions=0, coreSessions=0, shoulderSessions=0, armSessions=0;
  let chestVolume=0, backVolume=0, legVolume=0;
  let has5am=false, hasMidnight=false;
  let newYearSession=false, christmasSession=false;
  let janSessions=0;
  let springSession=false, summerSession=false, fallSession=false, winterSession=false;

  const exNames = new Set<string>();
  const muscleSet = new Set<string>();
  const dowSet = new Set<number>();
  const dayMap: Record<string,number> = {};
  const monthMap: Record<string,number> = {};
  const weekMap: Record<string,number> = {};
  const yearSet = new Set<string>();
  const monthSet = new Set<string>();
  const prMapW: Record<string,number> = {};
  let prCount = 0;

  const PUSH_M = new Set(['chest','shoulders','triceps']);
  const PULL_M = new Set(['back','biceps']);
  const LEG_M  = new Set(['quads','hamstrings','glutes','calves']);
  const CORE_M = new Set(['abs']);
  const SHLDR_M = new Set(['shoulders']);
  const ARM_M  = new Set(['biceps','triceps']);

  sorted.forEach((w) => {
    const d = w.start_time.slice(0, 10);
    const dt = new Date(w.start_time);
    const hour = dt.getHours();
    const dow  = dt.getDay();
    const mo   = dt.getMonth() + 1; // 1-12
    const mmdd = d.slice(5);
    const month = d.slice(0, 7);
    const year  = d.slice(0, 4);
    const startOfYear = new Date(dt.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((dt.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    const weekKey = `${year}-${String(weekNum).padStart(2,'0')}`;

    totalVolume += w.total_volume_kg;
    maxSingleVol = Math.max(maxSingleVol, w.total_volume_kg);
    totalDurationSec += w.duration_seconds;
    maxDuration = Math.max(maxDuration, w.duration_seconds);
    dayMap[d]   = (dayMap[d]   || 0) + 1;
    monthMap[month] = (monthMap[month] || 0) + 1;
    weekMap[weekKey] = (weekMap[weekKey] || 0) + 1;
    yearSet.add(year); monthSet.add(month); dowSet.add(dow);

    if (hour < 5)  hasMidnight = true;
    if (hour <= 5) has5am = true;
    if (hour >= 5  && hour < 10) morningCount++;
    if (hour >= 11 && hour < 14) noonCount++;
    if (hour >= 17 && hour < 22) eveningCount++;
    if (hour >= 22) nightCount++;
    if (dow === 0 || dow === 6) weekendSessions++;
    if (dow === 1) mondayCount++;
    if (dow === 5) fridayCount++;
    if (mmdd === '01-01') { newYearSession = true; janSessions++; }
    else if (mo === 1) janSessions++;
    if (mmdd === '12-25') christmasSession = true;
    if (mo >= 3 && mo <= 5)  springSession = true;
    if (mo >= 6 && mo <= 8)  summerSession = true;
    if (mo >= 9 && mo <= 11) fallSession = true;
    if (mo === 12 || mo <= 2) winterSession = true;

    let sessionSets=0, sessionReps=0, sessionExCount=0;
    const sessionMuscles = new Set<string>();

    w.exercises.forEach((ex) => {
      if (WARMUP_NAMES.has(ex.name.toLowerCase())) return;
      exNames.add(ex.name); sessionExCount++;
      const muscles = getExerciseMuscles(ex.name);
      muscles.forEach((m) => { muscleSet.add(m); sessionMuscles.add(m); });

      const sets = ex.sets.filter((s) => WORKING_SET_TYPES.has(s.type));
      const exVol = sets.reduce((s,t) => s + (t.weight_kg??0)*(t.reps??0), 0);
      if (muscles.includes('chest')) chestVolume += exVol;
      if (muscles.includes('back'))  backVolume  += exVol;
      if (['quads','hamstrings','glutes','calves'].some((m) => muscles.includes(m))) legVolume += exVol;

      sets.forEach((s) => {
        sessionSets++; totalSets++;
        const reps = s.reps ?? 0;
        sessionReps += reps; totalReps += reps;
        maxRepsInSet = Math.max(maxRepsInSet, reps);
        if (s.weight_kg) {
          maxSingleSetWeight = Math.max(maxSingleSetWeight, s.weight_kg);
          if (s.reps) maxE1RM = Math.max(maxE1RM, calcE1RM(s.weight_kg, s.reps));
          if (s.weight_kg > (prMapW[ex.name] ?? 0)) { prMapW[ex.name] = s.weight_kg; prCount++; }
        }
      });
    });

    maxSetsInSession      = Math.max(maxSetsInSession, sessionSets);
    maxRepsInSession      = Math.max(maxRepsInSession, sessionReps);
    maxExercisesInSession = Math.max(maxExercisesInSession, sessionExCount);

    if ([...sessionMuscles].some((m) => PUSH_M.has(m)))  pushSessions++;
    if ([...sessionMuscles].some((m) => PULL_M.has(m)))  pullSessions++;
    if ([...sessionMuscles].some((m) => LEG_M.has(m)))   legSessions++;
    if ([...sessionMuscles].some((m) => CORE_M.has(m)))  coreSessions++;
    if ([...sessionMuscles].some((m) => SHLDR_M.has(m))) shoulderSessions++;
    if ([...sessionMuscles].some((m) => ARM_M.has(m)))   armSessions++;
  });

  // Day gaps
  const dates = Object.keys(dayMap).sort();
  let maxDayGap=0; let hasComeback14=false, hasComeback30=false;
  for (let i=1; i<dates.length; i++) {
    const gap = (new Date(dates[i]).getTime() - new Date(dates[i-1]).getTime()) / 86400000;
    maxDayGap = Math.max(maxDayGap, gap);
    if (gap >= 14) hasComeback14 = true;
    if (gap >= 30) hasComeback30 = true;
  }

  const hasDoubleDay = Object.values(dayMap).some((c) => c >= 2);
  const hasTripleDay = Object.values(dayMap).some((c) => c >= 3);
  const maxWeekSessions  = Math.max(0, ...Object.values(weekMap));
  const maxMonthSessions = Math.max(0, ...Object.values(monthMap));
  const weeksWith3plus   = Object.values(weekMap).filter((c) => c >= 3).length;
  const monthsWith10plus = Object.values(monthMap).filter((c) => c >= 10).length;

  // Consecutive weeks (any session)
  const weekKeys = Object.keys(weekMap).sort();
  let consecutiveWeeks=1, curW=1;
  for (let i=1; i<weekKeys.length; i++) {
    const [y1,w1] = weekKeys[i-1].split('-').map(Number);
    const [y2,w2] = weekKeys[i].split('-').map(Number);
    if ((y2-y1)*52+(w2-w1) === 1) { curW++; consecutiveWeeks = Math.max(consecutiveWeeks, curW); }
    else curW=1;
  }

  // Consecutive weeks with 3+ sessions
  const week3Keys = Object.keys(weekMap).filter((k) => weekMap[k] >= 3).sort();
  let maxWeekStreak3=0, curW3=1;
  for (let i=1; i<week3Keys.length; i++) {
    const [y1,w1] = week3Keys[i-1].split('-').map(Number);
    const [y2,w2] = week3Keys[i].split('-').map(Number);
    if ((y2-y1)*52+(w2-w1) === 1) { curW3++; maxWeekStreak3 = Math.max(maxWeekStreak3, curW3); }
    else curW3=1;
  }
  if (week3Keys.length > 0 && maxWeekStreak3 === 0) maxWeekStreak3=1;

  // Consecutive months with 10+ sessions
  const month10Keys = Object.keys(monthMap).filter((k) => monthMap[k] >= 10).sort();
  let maxMonthStreak10=0, curM=1;
  for (let i=1; i<month10Keys.length; i++) {
    const [y1,m1] = month10Keys[i-1].split('-').map(Number);
    const [y2,m2] = month10Keys[i].split('-').map(Number);
    if ((y2-y1)*12+(m2-m1) === 1) { curM++; maxMonthStreak10 = Math.max(maxMonthStreak10, curM); }
    else curM=1;
  }
  if (month10Keys.length > 0 && maxMonthStreak10 === 0) maxMonthStreak10=1;

  const hexaSet = new Set(HEXA_AXES.filter(({ muscles }) => muscles.some((m) => muscleSet.has(m))).map(({ key }) => key));

  return {
    sessionCount: workouts.length, longestStreak: longest,
    consecutiveWeeks: weekKeys.length > 0 ? consecutiveWeeks : 0,
    maxWeekStreak3,
    totalVolume, maxSingleVol, maxE1RM, maxSingleSetWeight,
    exerciseCount: exNames.size, muscleCount: hexaSet.size, prCount,
    maxDuration, maxSetsInSession, maxExercisesInSession, maxRepsInSession, maxRepsInSet,
    totalSets, totalReps, totalDurationSec,
    earliestHour: has5am ? 5 : (hasMidnight ? 0 : Math.min(morningCount>0?6:24, 24)),
    latestHour: nightCount>0 ? 22 : (eveningCount>0 ? 17 : 0),
    has5am, hasMidnight,
    morningCount, noonCount, eveningCount, nightCount,
    weekendSessions, mondayCount, fridayCount,
    trainedEveryDayOfWeek: dowSet.size >= 7,
    maxWeekSessions, maxMonthSessions,
    trainedMonthsCount: monthSet.size, trainedYearsCount: yearSet.size,
    hasDoubleDay, hasTripleDay,
    pushSessions, pullSessions, legSessions, coreSessions, shoulderSessions, armSessions,
    maxDayGap, hasComeback14, hasComeback30,
    newYearSession, christmasSession,
    weeksWith3plus, monthsWith10plus, maxMonthStreak10,
    chestVolume, backVolume, legVolume,
    springSession, summerSession, fallSession, winterSession, janSessions,
  };
};

export const RARITY_COLOR = { common: '#6b7280', rare: '#3b82f6', epic: '#a855f7', legendary: '#ffcc00' } as const;
export const RARITY_LABEL = { common: '普通', rare: '稀有', epic: '史诗', legendary: '传说' } as const;
type Rarity = keyof typeof RARITY_COLOR;

export const ACHIEV_DEFS: Array<{
  id: string; icon: string; title: string; desc: string;
  color: string; rarity: Rarity;
  check: (w: WorkoutSession[], m: AchievMeta) => boolean;
  progress?: (w: WorkoutSession[], m: AchievMeta) => [number, number];
}> = [
  // ── 训练次数 Sessions ─────────────────────────────────────────────────────
  { id:'s1',   icon:'🎯', title:'初出茅庐',   desc:'完成第一次训练',             color:'#34d399', rarity:'common',    check:(_,m)=>m.sessionCount>=1 },
  { id:'s2',   icon:'✋', title:'五次出击',   desc:'完成5次训练',                color:'#6ee7b7', rarity:'common',    check:(_,m)=>m.sessionCount>=5,   progress:(_,m)=>[Math.min(m.sessionCount,5),5] },
  { id:'s3',   icon:'💪', title:'十次热身',   desc:'完成10次训练',               color:'#60a5fa', rarity:'common',    check:(_,m)=>m.sessionCount>=10,  progress:(_,m)=>[Math.min(m.sessionCount,10),10] },
  { id:'s4',   icon:'🏃', title:'四分之一百', desc:'完成25次训练',               color:'#93c5fd', rarity:'common',    check:(_,m)=>m.sessionCount>=25,  progress:(_,m)=>[Math.min(m.sessionCount,25),25] },
  { id:'s5',   icon:'🥊', title:'半程英雄',   desc:'完成50次训练',               color:'#818cf8', rarity:'common',    check:(_,m)=>m.sessionCount>=50,  progress:(_,m)=>[Math.min(m.sessionCount,50),50] },
  { id:'s6',   icon:'💯', title:'百次传说',   desc:'完成100次训练',              color:'#a855f7', rarity:'rare',      check:(_,m)=>m.sessionCount>=100, progress:(_,m)=>[Math.min(m.sessionCount,100),100] },
  { id:'s7',   icon:'🔱', title:'坚如磐石',   desc:'完成150次训练',              color:'#c084fc', rarity:'rare',      check:(_,m)=>m.sessionCount>=150, progress:(_,m)=>[Math.min(m.sessionCount,150),150] },
  { id:'s8',   icon:'⚔️', title:'铁血战士',   desc:'完成200次训练',              color:'#e879f9', rarity:'rare',      check:(_,m)=>m.sessionCount>=200, progress:(_,m)=>[Math.min(m.sessionCount,200),200] },
  { id:'s9',   icon:'🦅', title:'三百勇士',   desc:'完成300次训练',              color:'#f472b6', rarity:'epic',      check:(_,m)=>m.sessionCount>=300, progress:(_,m)=>[Math.min(m.sessionCount,300),300] },
  { id:'s10',  icon:'🗓️', title:'一年精华',   desc:'完成365次训练',              color:'#fb7185', rarity:'epic',      check:(_,m)=>m.sessionCount>=365, progress:(_,m)=>[Math.min(m.sessionCount,365),365] },
  { id:'s11',  icon:'🏆', title:'五百里程',   desc:'完成500次训练',              color:'#f97316', rarity:'epic',      check:(_,m)=>m.sessionCount>=500, progress:(_,m)=>[Math.min(m.sessionCount,500),500] },
  { id:'s12',  icon:'🌠', title:'千次传说',   desc:'完成1000次训练',             color:'#ffcc00', rarity:'legendary', check:(_,m)=>m.sessionCount>=1000,progress:(_,m)=>[Math.min(m.sessionCount,1000),1000] },

  // ── 连续训练 Streaks ──────────────────────────────────────────────────────
  { id:'st1',  icon:'⚡', title:'三连击',     desc:'连续训练3天',                color:'#fbbf24', rarity:'common',    check:(_,m)=>m.longestStreak>=3,   progress:(_,m)=>[Math.min(m.longestStreak,3),3] },
  { id:'st2',  icon:'🔥', title:'五连击',     desc:'连续训练5天',                color:'#f97316', rarity:'common',    check:(_,m)=>m.longestStreak>=5,   progress:(_,m)=>[Math.min(m.longestStreak,5),5] },
  { id:'st3',  icon:'💥', title:'一周无休',   desc:'连续训练7天',                color:'#ef4444', rarity:'rare',      check:(_,m)=>m.longestStreak>=7,   progress:(_,m)=>[Math.min(m.longestStreak,7),7] },
  { id:'st4',  icon:'🌋', title:'双周狂魔',   desc:'连续训练14天',               color:'#dc2626', rarity:'rare',      check:(_,m)=>m.longestStreak>=14,  progress:(_,m)=>[Math.min(m.longestStreak,14),14] },
  { id:'st5',  icon:'🧠', title:'习惯养成',   desc:'连续训练21天',               color:'#7c3aed', rarity:'rare',      check:(_,m)=>m.longestStreak>=21,  progress:(_,m)=>[Math.min(m.longestStreak,21),21] },
  { id:'st6',  icon:'🌊', title:'月度狂人',   desc:'连续训练30天',               color:'#6d28d9', rarity:'epic',      check:(_,m)=>m.longestStreak>=30,  progress:(_,m)=>[Math.min(m.longestStreak,30),30] },
  { id:'st7',  icon:'🦾', title:'铁人意志',   desc:'连续训练60天',               color:'#4c1d95', rarity:'epic',      check:(_,m)=>m.longestStreak>=60,  progress:(_,m)=>[Math.min(m.longestStreak,60),60] },
  { id:'st8',  icon:'👁', title:'季度征程',   desc:'连续训练90天',               color:'#2563eb', rarity:'epic',      check:(_,m)=>m.longestStreak>=90,  progress:(_,m)=>[Math.min(m.longestStreak,90),90] },
  { id:'st9',  icon:'♾️', title:'不朽意志',   desc:'连续训练180天',              color:'#ffcc00', rarity:'legendary', check:(_,m)=>m.longestStreak>=180, progress:(_,m)=>[Math.min(m.longestStreak,180),180] },

  // ── 单次出力 Single Session Volume ────────────────────────────────────────
  { id:'sv1',  icon:'📦', title:'破五百',     desc:'单次训练出力超500 kg',        color:'#67e8f9', rarity:'common',    check:(_,m)=>m.maxSingleVol>=500 },
  { id:'sv2',  icon:'💣', title:'出力破千',   desc:'单次训练出力超1,000 kg',      color:'#06b6d4', rarity:'common',    check:(_,m)=>m.maxSingleVol>=1000 },
  { id:'sv3',  icon:'🔨', title:'双倍炸场',   desc:'单次训练出力超2,000 kg',      color:'#0891b2', rarity:'common',    check:(_,m)=>m.maxSingleVol>=2000 },
  { id:'sv4',  icon:'⚙️', title:'三千突击',   desc:'单次训练出力超3,000 kg',      color:'#0e7490', rarity:'rare',      check:(_,m)=>m.maxSingleVol>=3000 },
  { id:'sv5',  icon:'🌟', title:'五千精英',   desc:'单次训练出力超5,000 kg',      color:'#6366f1', rarity:'rare',      check:(_,m)=>m.maxSingleVol>=5000 },
  { id:'sv6',  icon:'💎', title:'八千巅峰',   desc:'单次训练出力超8,000 kg',      color:'#818cf8', rarity:'epic',      check:(_,m)=>m.maxSingleVol>=8000 },
  { id:'sv7',  icon:'🏔️', title:'万公斤俱乐部',desc:'单次训练出力超10,000 kg',   color:'#a855f7', rarity:'epic',      check:(_,m)=>m.maxSingleVol>=10000 },
  { id:'sv8',  icon:'👑', title:'怪物出力',   desc:'单次训练出力超15,000 kg',     color:'#ffcc00', rarity:'legendary', check:(_,m)=>m.maxSingleVol>=15000 },

  // ── 累计出力 Total Volume ─────────────────────────────────────────────────
  { id:'tv1',  icon:'🌱', title:'入门里程',   desc:'累计出力超1,000 kg',          color:'#86efac', rarity:'common',    check:(_,m)=>m.totalVolume>=1000,    progress:(_,m)=>[Math.min(m.totalVolume,1000),1000] },
  { id:'tv2',  icon:'🌿', title:'五千里程',   desc:'累计出力超5,000 kg',          color:'#4ade80', rarity:'common',    check:(_,m)=>m.totalVolume>=5000,    progress:(_,m)=>[Math.min(m.totalVolume,5000),5000] },
  { id:'tv3',  icon:'🏕️', title:'万里征途',   desc:'累计出力超10,000 kg',         color:'#84cc16', rarity:'common',    check:(_,m)=>m.totalVolume>=10000,   progress:(_,m)=>[Math.min(m.totalVolume,10000),10000] },
  { id:'tv4',  icon:'🌄', title:'二万五里程', desc:'累计出力超25,000 kg',         color:'#65a30d', rarity:'rare',      check:(_,m)=>m.totalVolume>=25000,   progress:(_,m)=>[Math.min(m.totalVolume,25000),25000] },
  { id:'tv5',  icon:'🏞️', title:'五万勇士',   desc:'累计出力超50,000 kg',         color:'#f59e0b', rarity:'rare',      check:(_,m)=>m.totalVolume>=50000,   progress:(_,m)=>[Math.min(m.totalVolume,50000),50000] },
  { id:'tv6',  icon:'🗻', title:'十万里程碑', desc:'累计出力超100,000 kg',        color:'#d97706', rarity:'epic',      check:(_,m)=>m.totalVolume>=100000,  progress:(_,m)=>[Math.min(m.totalVolume,100000),100000] },
  { id:'tv7',  icon:'🌍', title:'黄金里程',   desc:'累计出力超250,000 kg',        color:'#b45309', rarity:'epic',      check:(_,m)=>m.totalVolume>=250000,  progress:(_,m)=>[Math.min(m.totalVolume,250000),250000] },
  { id:'tv8',  icon:'🌌', title:'铂金传说',   desc:'累计出力超500,000 kg',        color:'#ef4444', rarity:'epic',      check:(_,m)=>m.totalVolume>=500000,  progress:(_,m)=>[Math.min(m.totalVolume,500000),500000] },
  { id:'tv9',  icon:'🌠', title:'百万公斤神', desc:'累计出力超1,000,000 kg',      color:'#ffcc00', rarity:'legendary', check:(_,m)=>m.totalVolume>=1000000, progress:(_,m)=>[Math.min(m.totalVolume,1000000),1000000] },
  { id:'tv10', icon:'♾️', title:'超凡入圣',   desc:'累计出力超2,000,000 kg',      color:'#ffffff', rarity:'legendary', check:(_,m)=>m.totalVolume>=2000000, progress:(_,m)=>[Math.min(m.totalVolume,2000000),2000000] },

  // ── e1RM 力量 Estimated 1-Rep Max ─────────────────────────────────────────
  { id:'e1',   icon:'💪', title:'力量起步',   desc:'单动作 e1RM 突破60 kg',       color:'#a3e635', rarity:'common',    check:(_,m)=>m.maxE1RM>=60 },
  { id:'e2',   icon:'🏋️', title:'中级力量',   desc:'单动作 e1RM 突破80 kg',       color:'#84cc16', rarity:'common',    check:(_,m)=>m.maxE1RM>=80 },
  { id:'e3',   icon:'🔱', title:'百公斤俱乐部',desc:'单动作 e1RM 突破100 kg',     color:'#65a30d', rarity:'rare',      check:(_,m)=>m.maxE1RM>=100 },
  { id:'e4',   icon:'🦊', title:'力量进阶',   desc:'单动作 e1RM 突破120 kg',      color:'#f59e0b', rarity:'rare',      check:(_,m)=>m.maxE1RM>=120 },
  { id:'e5',   icon:'🦁', title:'强者之境',   desc:'单动作 e1RM 突破140 kg',      color:'#d97706', rarity:'rare',      check:(_,m)=>m.maxE1RM>=140 },
  { id:'e6',   icon:'🐂', title:'壮汉标配',   desc:'单动作 e1RM 突破150 kg',      color:'#ef4444', rarity:'epic',      check:(_,m)=>m.maxE1RM>=150 },
  { id:'e7',   icon:'🦅', title:'精英力量',   desc:'单动作 e1RM 突破160 kg',      color:'#dc2626', rarity:'epic',      check:(_,m)=>m.maxE1RM>=160 },
  { id:'e8',   icon:'🔥', title:'强者传说',   desc:'单动作 e1RM 突破180 kg',      color:'#b91c1c', rarity:'epic',      check:(_,m)=>m.maxE1RM>=180 },
  { id:'e9',   icon:'⚡', title:'双百公斤神', desc:'单动作 e1RM 突破200 kg',      color:'#a855f7', rarity:'legendary', check:(_,m)=>m.maxE1RM>=200 },
  { id:'e10',  icon:'💫', title:'力量神话',   desc:'单动作 e1RM 突破250 kg',      color:'#ffcc00', rarity:'legendary', check:(_,m)=>m.maxE1RM>=250 },
  { id:'e11',  icon:'🌟', title:'超人之力',   desc:'单动作 e1RM 突破300 kg',      color:'#ffffff', rarity:'legendary', check:(_,m)=>m.maxE1RM>=300 },

  // ── 单组重量 Max Single Set Weight ───────────────────────────────────────
  { id:'w1',   icon:'🏋️', title:'四十公斤',   desc:'单组举起40 kg',               color:'#a3e635', rarity:'common',    check:(_,m)=>m.maxSingleSetWeight>=40 },
  { id:'w2',   icon:'💪', title:'六十公斤',   desc:'单组举起60 kg',               color:'#84cc16', rarity:'common',    check:(_,m)=>m.maxSingleSetWeight>=60 },
  { id:'w3',   icon:'🔨', title:'八十公斤',   desc:'单组举起80 kg',               color:'#f59e0b', rarity:'common',    check:(_,m)=>m.maxSingleSetWeight>=80 },
  { id:'w4',   icon:'⚙️', title:'百公斤战士', desc:'单组举起100 kg',              color:'#d97706', rarity:'rare',      check:(_,m)=>m.maxSingleSetWeight>=100 },
  { id:'w5',   icon:'🦣', title:'一百二十',   desc:'单组举起120 kg',              color:'#ef4444', rarity:'rare',      check:(_,m)=>m.maxSingleSetWeight>=120 },
  { id:'w6',   icon:'🦁', title:'一百五十',   desc:'单组举起150 kg',              color:'#dc2626', rarity:'epic',      check:(_,m)=>m.maxSingleSetWeight>=150 },
  { id:'w7',   icon:'🦏', title:'一百八十',   desc:'单组举起180 kg',              color:'#a855f7', rarity:'epic',      check:(_,m)=>m.maxSingleSetWeight>=180 },
  { id:'w8',   icon:'👑', title:'两百公斤',   desc:'单组举起200 kg',              color:'#ffcc00', rarity:'legendary', check:(_,m)=>m.maxSingleSetWeight>=200 },

  // ── 单次时长 Single Session Duration ─────────────────────────────────────
  { id:'d1',   icon:'⏱', title:'有效训练',   desc:'单次训练持续30分钟',          color:'#67e8f9', rarity:'common',    check:(_,m)=>m.maxDuration>=1800 },
  { id:'d2',   icon:'🕐', title:'标准训练',   desc:'单次训练持续45分钟',          color:'#06b6d4', rarity:'common',    check:(_,m)=>m.maxDuration>=2700 },
  { id:'d3',   icon:'⌛', title:'黄金一小时', desc:'单次训练持续60分钟',          color:'#0891b2', rarity:'common',    check:(_,m)=>m.maxDuration>=3600 },
  { id:'d4',   icon:'🔥', title:'铁人训练',   desc:'单次训练持续90分钟',          color:'#f97316', rarity:'rare',      check:(_,m)=>m.maxDuration>=5400 },
  { id:'d5',   icon:'💥', title:'双小时挑战', desc:'单次训练持续120分钟',         color:'#ea580c', rarity:'epic',      check:(_,m)=>m.maxDuration>=7200 },
  { id:'d6',   icon:'🦾', title:'马拉松训练', desc:'单次训练持续180分钟',         color:'#ffcc00', rarity:'legendary', check:(_,m)=>m.maxDuration>=10800 },

  // ── 累计时长 Total Duration ───────────────────────────────────────────────
  { id:'dt1',  icon:'⏰', title:'十小时入门', desc:'累计训练超10小时',            color:'#a3e635', rarity:'common',    check:(_,m)=>m.totalDurationSec>=36000,    progress:(_,m)=>[Math.min(m.totalDurationSec,36000),36000] },
  { id:'dt2',  icon:'🕙', title:'二十五小时', desc:'累计训练超25小时',            color:'#84cc16', rarity:'common',    check:(_,m)=>m.totalDurationSec>=90000,    progress:(_,m)=>[Math.min(m.totalDurationSec,90000),90000] },
  { id:'dt3',  icon:'🌙', title:'半百小时',   desc:'累计训练超50小时',            color:'#60a5fa', rarity:'rare',      check:(_,m)=>m.totalDurationSec>=180000,   progress:(_,m)=>[Math.min(m.totalDurationSec,180000),180000] },
  { id:'dt4',  icon:'⭐', title:'百小时传说', desc:'累计训练超100小时',           color:'#6366f1', rarity:'rare',      check:(_,m)=>m.totalDurationSec>=360000,   progress:(_,m)=>[Math.min(m.totalDurationSec,360000),360000] },
  { id:'dt5',  icon:'🌟', title:'精英级别',   desc:'累计训练超250小时',           color:'#a855f7', rarity:'epic',      check:(_,m)=>m.totalDurationSec>=900000,   progress:(_,m)=>[Math.min(m.totalDurationSec,900000),900000] },
  { id:'dt6',  icon:'💎', title:'铁人级别',   desc:'累计训练超500小时',           color:'#ffcc00', rarity:'legendary', check:(_,m)=>m.totalDurationSec>=1800000,  progress:(_,m)=>[Math.min(m.totalDurationSec,1800000),1800000] },

  // ── 动作多样 Exercise Variety ─────────────────────────────────────────────
  { id:'v1',   icon:'🎯', title:'初探多样',   desc:'掌握5种不同动作',             color:'#f0abfc', rarity:'common',    check:(_,m)=>m.exerciseCount>=5,  progress:(_,m)=>[Math.min(m.exerciseCount,5),5] },
  { id:'v2',   icon:'🎪', title:'十项全能',   desc:'掌握10种不同动作',            color:'#e879f9', rarity:'common',    check:(_,m)=>m.exerciseCount>=10, progress:(_,m)=>[Math.min(m.exerciseCount,10),10] },
  { id:'v3',   icon:'🌈', title:'二十种把式', desc:'掌握20种不同动作',            color:'#d946ef', rarity:'common',    check:(_,m)=>m.exerciseCount>=20, progress:(_,m)=>[Math.min(m.exerciseCount,20),20] },
  { id:'v4',   icon:'🎭', title:'三十种招式', desc:'掌握30种不同动作',            color:'#a855f7', rarity:'rare',      check:(_,m)=>m.exerciseCount>=30, progress:(_,m)=>[Math.min(m.exerciseCount,30),30] },
  { id:'v5',   icon:'🔮', title:'四十种流派', desc:'掌握40种不同动作',            color:'#9333ea', rarity:'rare',      check:(_,m)=>m.exerciseCount>=40, progress:(_,m)=>[Math.min(m.exerciseCount,40),40] },
  { id:'v6',   icon:'🌀', title:'五十种大师', desc:'掌握50种不同动作',            color:'#7c3aed', rarity:'epic',      check:(_,m)=>m.exerciseCount>=50, progress:(_,m)=>[Math.min(m.exerciseCount,50),50] },
  { id:'v7',   icon:'🏛️', title:'七十种传奇', desc:'掌握70种不同动作',            color:'#ffcc00', rarity:'legendary', check:(_,m)=>m.exerciseCount>=70, progress:(_,m)=>[Math.min(m.exerciseCount,70),70] },

  // ── 肌群覆盖 Muscle Coverage ──────────────────────────────────────────────
  { id:'mc1',  icon:'💪', title:'初涉肌群',   desc:'训练覆盖2个主要肌群',         color:'#86efac', rarity:'common',    check:(_,m)=>m.muscleCount>=2, progress:(_,m)=>[m.muscleCount,2] },
  { id:'mc2',  icon:'🏋️', title:'三角训练',   desc:'训练覆盖3个主要肌群',         color:'#4ade80', rarity:'common',    check:(_,m)=>m.muscleCount>=3, progress:(_,m)=>[m.muscleCount,3] },
  { id:'mc3',  icon:'⚔️', title:'四面进攻',   desc:'训练覆盖4个主要肌群',         color:'#22c55e', rarity:'rare',      check:(_,m)=>m.muscleCount>=4, progress:(_,m)=>[m.muscleCount,4] },
  { id:'mc4',  icon:'🌟', title:'五面开花',   desc:'训练覆盖5个主要肌群',         color:'#16a34a', rarity:'rare',      check:(_,m)=>m.muscleCount>=5, progress:(_,m)=>[m.muscleCount,5] },
  { id:'mc5',  icon:'🌍', title:'全肌群猎手', desc:'训练覆盖所有6个主要肌群',     color:'#15803d', rarity:'epic',      check:(_,m)=>m.muscleCount>=6, progress:(_,m)=>[m.muscleCount,6] },

  // ── 总组数 Total Sets ─────────────────────────────────────────────────────
  { id:'ts1',  icon:'📋', title:'五十组热身', desc:'累计完成50组',                color:'#bae6fd', rarity:'common',    check:(_,m)=>m.totalSets>=50,   progress:(_,m)=>[Math.min(m.totalSets,50),50] },
  { id:'ts2',  icon:'📝', title:'百组突破',   desc:'累计完成100组',               color:'#7dd3fc', rarity:'common',    check:(_,m)=>m.totalSets>=100,  progress:(_,m)=>[Math.min(m.totalSets,100),100] },
  { id:'ts3',  icon:'📊', title:'二百五十组', desc:'累计完成250组',               color:'#38bdf8', rarity:'common',    check:(_,m)=>m.totalSets>=250,  progress:(_,m)=>[Math.min(m.totalSets,250),250] },
  { id:'ts4',  icon:'📈', title:'五百组',     desc:'累计完成500组',               color:'#0ea5e9', rarity:'rare',      check:(_,m)=>m.totalSets>=500,  progress:(_,m)=>[Math.min(m.totalSets,500),500] },
  { id:'ts5',  icon:'🗂️', title:'千组里程',   desc:'累计完成1,000组',             color:'#0284c7', rarity:'rare',      check:(_,m)=>m.totalSets>=1000, progress:(_,m)=>[Math.min(m.totalSets,1000),1000] },
  { id:'ts6',  icon:'🏗️', title:'两千组',     desc:'累计完成2,000组',             color:'#0369a1', rarity:'epic',      check:(_,m)=>m.totalSets>=2000, progress:(_,m)=>[Math.min(m.totalSets,2000),2000] },
  { id:'ts7',  icon:'🔱', title:'五千组传奇', desc:'累计完成5,000组',             color:'#a855f7', rarity:'epic',      check:(_,m)=>m.totalSets>=5000, progress:(_,m)=>[Math.min(m.totalSets,5000),5000] },
  { id:'ts8',  icon:'👑', title:'万组神话',   desc:'累计完成10,000组',            color:'#ffcc00', rarity:'legendary', check:(_,m)=>m.totalSets>=10000,progress:(_,m)=>[Math.min(m.totalSets,10000),10000] },

  // ── 单次密度 Session Density ──────────────────────────────────────────────
  { id:'sd1',  icon:'📌', title:'正式起步',   desc:'单次训练完成10组',            color:'#a3e635', rarity:'common',    check:(_,m)=>m.maxSetsInSession>=10 },
  { id:'sd2',  icon:'📍', title:'高效训练',   desc:'单次训练完成20组',            color:'#84cc16', rarity:'common',    check:(_,m)=>m.maxSetsInSession>=20 },
  { id:'sd3',  icon:'🎯', title:'高密度',     desc:'单次训练完成30组',            color:'#f59e0b', rarity:'rare',      check:(_,m)=>m.maxSetsInSession>=30 },
  { id:'sd4',  icon:'💣', title:'超高密度',   desc:'单次训练完成40组',            color:'#ef4444', rarity:'epic',      check:(_,m)=>m.maxSetsInSession>=40 },
  { id:'sd5',  icon:'⚡', title:'极限密度',   desc:'单次训练完成50组',            color:'#ffcc00', rarity:'legendary', check:(_,m)=>m.maxSetsInSession>=50 },
  { id:'sd6',  icon:'🎪', title:'五项全攻',   desc:'单次训练包含5种动作',         color:'#60a5fa', rarity:'common',    check:(_,m)=>m.maxExercisesInSession>=5 },
  { id:'sd7',  icon:'🌈', title:'八面强攻',   desc:'单次训练包含8种动作',         color:'#818cf8', rarity:'rare',      check:(_,m)=>m.maxExercisesInSession>=8 },
  { id:'sd8',  icon:'🏛️', title:'十项冲刺',   desc:'单次训练包含10种动作',        color:'#a855f7', rarity:'epic',      check:(_,m)=>m.maxExercisesInSession>=10 },

  // ── 单次次数 & 单组次数 Reps ──────────────────────────────────────────────
  { id:'r1',   icon:'🔄', title:'二十连发',   desc:'单组完成20次以上',            color:'#86efac', rarity:'common',    check:(_,m)=>m.maxRepsInSet>=20 },
  { id:'r2',   icon:'🌀', title:'三十连发',   desc:'单组完成30次以上',            color:'#4ade80', rarity:'common',    check:(_,m)=>m.maxRepsInSet>=30 },
  { id:'r3',   icon:'🔥', title:'五十连发',   desc:'单组完成50次以上',            color:'#f97316', rarity:'rare',      check:(_,m)=>m.maxRepsInSet>=50 },
  { id:'r4',   icon:'💯', title:'百次连发',   desc:'单组完成100次以上',           color:'#a855f7', rarity:'epic',      check:(_,m)=>m.maxRepsInSet>=100 },
  { id:'r5',   icon:'📦', title:'单次百rep',  desc:'单次训练总次数超100',         color:'#38bdf8', rarity:'common',    check:(_,m)=>m.maxRepsInSession>=100 },
  { id:'r6',   icon:'🌊', title:'单次双百rep',desc:'单次训练总次数超200',         color:'#0ea5e9', rarity:'rare',      check:(_,m)=>m.maxRepsInSession>=200 },
  { id:'r7',   icon:'🏊', title:'单次五百rep',desc:'单次训练总次数超500',         color:'#0284c7', rarity:'epic',      check:(_,m)=>m.maxRepsInSession>=500 },

  // ── 累计次数 Total Reps ───────────────────────────────────────────────────
  { id:'tr1',  icon:'🔢', title:'千次动作',   desc:'累计完成1,000次动作',         color:'#a3e635', rarity:'common',    check:(_,m)=>m.totalReps>=1000,  progress:(_,m)=>[Math.min(m.totalReps,1000),1000] },
  { id:'tr2',  icon:'🔣', title:'五千次动作', desc:'累计完成5,000次动作',         color:'#84cc16', rarity:'rare',      check:(_,m)=>m.totalReps>=5000,  progress:(_,m)=>[Math.min(m.totalReps,5000),5000] },
  { id:'tr3',  icon:'💫', title:'五万次动作', desc:'累计完成50,000次动作',        color:'#a855f7', rarity:'epic',      check:(_,m)=>m.totalReps>=50000, progress:(_,m)=>[Math.min(m.totalReps,50000),50000] },
  { id:'tr4',  icon:'🌌', title:'十万次动作', desc:'累计完成100,000次动作',       color:'#ffcc00', rarity:'legendary', check:(_,m)=>m.totalReps>=100000,progress:(_,m)=>[Math.min(m.totalReps,100000),100000] },

  // ── 时间规律 Time Patterns ────────────────────────────────────────────────
  { id:'tp1',  icon:'🌅', title:'晨练达人',   desc:'完成50次早晨(5-10时)训练',    color:'#fde68a', rarity:'rare',      check:(_,m)=>m.morningCount>=50,  progress:(_,m)=>[Math.min(m.morningCount,50),50] },
  { id:'tp2',  icon:'☀️', title:'午间战士',   desc:'完成20次午间(11-14时)训练',   color:'#fbbf24', rarity:'rare',      check:(_,m)=>m.noonCount>=20,     progress:(_,m)=>[Math.min(m.noonCount,20),20] },
  { id:'tp3',  icon:'🌇', title:'傍晚健将',   desc:'完成50次傍晚(17-22时)训练',   color:'#f97316', rarity:'rare',      check:(_,m)=>m.eveningCount>=50,  progress:(_,m)=>[Math.min(m.eveningCount,50),50] },
  { id:'tp4',  icon:'🌃', title:'夜间猛将',   desc:'完成30次夜间(22时+)训练',     color:'#4f46e5', rarity:'rare',      check:(_,m)=>m.nightCount>=30,    progress:(_,m)=>[Math.min(m.nightCount,30),30] },
  { id:'tp5',  icon:'🏖️', title:'周末战士',   desc:'完成20次周末训练',            color:'#34d399', rarity:'rare',      check:(_,m)=>m.weekendSessions>=20,progress:(_,m)=>[Math.min(m.weekendSessions,20),20] },
  { id:'tp6',  icon:'💼', title:'周一传说',   desc:'完成20次周一训练',            color:'#60a5fa', rarity:'rare',      check:(_,m)=>m.mondayCount>=20,   progress:(_,m)=>[Math.min(m.mondayCount,20),20] },
  { id:'tp7',  icon:'🎉', title:'周五狂欢',   desc:'完成15次周五训练',            color:'#f472b6', rarity:'common',    check:(_,m)=>m.fridayCount>=15,   progress:(_,m)=>[Math.min(m.fridayCount,15),15] },
  { id:'tp8',  icon:'📅', title:'全周覆盖',   desc:'训练过一周中的每一天',         color:'#a78bfa', rarity:'epic',      check:(_,m)=>m.trainedEveryDayOfWeek },
  { id:'tp9',  icon:'🚀', title:'单周五练',   desc:'单周完成5次以上训练',          color:'#818cf8', rarity:'rare',      check:(_,m)=>m.maxWeekSessions>=5 },
  { id:'tp10', icon:'⚡', title:'单周七练',   desc:'单周完成7次以上训练',          color:'#ffcc00', rarity:'legendary', check:(_,m)=>m.maxWeekSessions>=7 },
  { id:'tp11', icon:'🗓️', title:'全年覆盖',   desc:'12个月都有训练记录',           color:'#a855f7', rarity:'epic',      check:(_,m)=>m.trainedMonthsCount>=12,progress:(_,m)=>[Math.min(m.trainedMonthsCount,12),12] },
  { id:'tp12', icon:'📆', title:'跨越两年',   desc:'训练记录跨越2个年份',          color:'#ec4899', rarity:'rare',      check:(_,m)=>m.trainedYearsCount>=2 },

  // ── 作息习惯 Early/Late Habits ────────────────────────────────────────────
  { id:'h1',   icon:'🌄', title:'早起鸟',     desc:'早上6点前完成训练',           color:'#fbbf24', rarity:'common',    check:(_,m)=>m.earliestHour<6 },
  { id:'h2',   icon:'🌠', title:'黎明战士',   desc:'早上5点前完成训练',           color:'#f59e0b', rarity:'rare',      check:(_,m)=>m.has5am },
  { id:'h3',   icon:'🌙', title:'午夜骑士',   desc:'午夜0点后仍在训练',           color:'#6d28d9', rarity:'epic',      check:(_,m)=>m.hasMidnight },
  { id:'h4',   icon:'🦉', title:'夜枭',       desc:'晚上22点后开始训练',          color:'#8b5cf6', rarity:'common',    check:(_,m)=>m.nightCount>=1 },

  // ── 专项肌群 Muscle Specialization ───────────────────────────────────────
  { id:'ms1',  icon:'💓', title:'胸肌追求者', desc:'完成20次胸部训练',            color:'#f472b6', rarity:'common',    check:(_,m)=>m.pushSessions>=20,      progress:(_,m)=>[Math.min(m.pushSessions,20),20] },
  { id:'ms2',  icon:'🏋️', title:'卧推之王',   desc:'完成50次胸部训练',            color:'#ec4899', rarity:'rare',      check:(_,m)=>m.pushSessions>=50,      progress:(_,m)=>[Math.min(m.pushSessions,50),50] },
  { id:'ms3',  icon:'🌊', title:'背部开拓者', desc:'完成20次背部训练',            color:'#38bdf8', rarity:'common',    check:(_,m)=>m.pullSessions>=20,      progress:(_,m)=>[Math.min(m.pullSessions,20),20] },
  { id:'ms4',  icon:'🦅', title:'背阔肌之神', desc:'完成50次背部训练',            color:'#0ea5e9', rarity:'rare',      check:(_,m)=>m.pullSessions>=50,      progress:(_,m)=>[Math.min(m.pullSessions,50),50] },
  { id:'ms5',  icon:'🦵', title:'腿日信仰者', desc:'完成20次腿部训练',            color:'#a3e635', rarity:'common',    check:(_,m)=>m.legSessions>=20,       progress:(_,m)=>[Math.min(m.legSessions,20),20] },
  { id:'ms6',  icon:'🏔️', title:'腿王',       desc:'完成50次腿部训练',            color:'#84cc16', rarity:'rare',      check:(_,m)=>m.legSessions>=50,       progress:(_,m)=>[Math.min(m.legSessions,50),50] },
  { id:'ms7',  icon:'💪', title:'手臂爆炸',   desc:'完成20次手臂训练',            color:'#818cf8', rarity:'common',    check:(_,m)=>m.armSessions>=20,       progress:(_,m)=>[Math.min(m.armSessions,20),20] },
  { id:'ms8',  icon:'🏔️', title:'三角肌战士', desc:'完成20次肩部训练',            color:'#f97316', rarity:'common',    check:(_,m)=>m.shoulderSessions>=20,  progress:(_,m)=>[Math.min(m.shoulderSessions,20),20] },
  { id:'ms9',  icon:'🔥', title:'三角肌之神', desc:'完成50次肩部训练',            color:'#ea580c', rarity:'rare',      check:(_,m)=>m.shoulderSessions>=50,  progress:(_,m)=>[Math.min(m.shoulderSessions,50),50] },
  { id:'ms10', icon:'⚡', title:'核心战士',   desc:'完成20次核心训练',            color:'#06b6d4', rarity:'common',    check:(_,m)=>m.coreSessions>=20,      progress:(_,m)=>[Math.min(m.coreSessions,20),20] },
  { id:'ms11', icon:'🌀', title:'核心大师',   desc:'完成50次核心训练',            color:'#0891b2', rarity:'rare',      check:(_,m)=>m.coreSessions>=50,      progress:(_,m)=>[Math.min(m.coreSessions,50),50] },
  { id:'ms12', icon:'💥', title:'胸部出力王', desc:'胸部累计出力超10,000 kg',     color:'#ec4899', rarity:'rare',      check:(_,m)=>m.chestVolume>=10000,    progress:(_,m)=>[Math.min(m.chestVolume,10000),10000] },
  { id:'ms13', icon:'🌊', title:'背部出力王', desc:'背部累计出力超10,000 kg',     color:'#38bdf8', rarity:'rare',      check:(_,m)=>m.backVolume>=10000,     progress:(_,m)=>[Math.min(m.backVolume,10000),10000] },
  { id:'ms14', icon:'🦵', title:'腿部出力王', desc:'腿部累计出力超10,000 kg',     color:'#84cc16', rarity:'rare',      check:(_,m)=>m.legVolume>=10000,      progress:(_,m)=>[Math.min(m.legVolume,10000),10000] },

  // ── PR 成就 Personal Records ──────────────────────────────────────────────
  { id:'pr1',  icon:'🎯', title:'首次突破',   desc:'获得第一个个人最好',          color:'#34d399', rarity:'common',    check:(_,m)=>m.prCount>=1 },
  { id:'pr2',  icon:'⭐', title:'五次突破',   desc:'获得5个个人最好',             color:'#6ee7b7', rarity:'common',    check:(_,m)=>m.prCount>=5,   progress:(_,m)=>[Math.min(m.prCount,5),5] },
  { id:'pr3',  icon:'🌟', title:'十次突破',   desc:'获得10个个人最好',            color:'#4ade80', rarity:'common',    check:(_,m)=>m.prCount>=10,  progress:(_,m)=>[Math.min(m.prCount,10),10] },
  { id:'pr4',  icon:'💫', title:'二十次突破', desc:'获得20个个人最好',            color:'#22c55e', rarity:'rare',      check:(_,m)=>m.prCount>=20,  progress:(_,m)=>[Math.min(m.prCount,20),20] },
  { id:'pr5',  icon:'🚀', title:'五十次突破', desc:'获得50个个人最好',            color:'#f59e0b', rarity:'rare',      check:(_,m)=>m.prCount>=50,  progress:(_,m)=>[Math.min(m.prCount,50),50] },
  { id:'pr6',  icon:'🔥', title:'百次突破',   desc:'获得100个个人最好',           color:'#ef4444', rarity:'epic',      check:(_,m)=>m.prCount>=100, progress:(_,m)=>[Math.min(m.prCount,100),100] },
  { id:'pr7',  icon:'💥', title:'百五十突破', desc:'获得150个个人最好',           color:'#dc2626', rarity:'epic',      check:(_,m)=>m.prCount>=150, progress:(_,m)=>[Math.min(m.prCount,150),150] },
  { id:'pr8',  icon:'👑', title:'两百PR王',   desc:'获得200个个人最好',           color:'#ffcc00', rarity:'legendary', check:(_,m)=>m.prCount>=200, progress:(_,m)=>[Math.min(m.prCount,200),200] },

  // ── 频率稳定 Frequency Consistency ───────────────────────────────────────
  { id:'fc1',  icon:'📅', title:'四周稳定',   desc:'连续4周每周3次+训练',         color:'#60a5fa', rarity:'rare',      check:(_,m)=>m.maxWeekStreak3>=4,  progress:(_,m)=>[Math.min(m.maxWeekStreak3,4),4] },
  { id:'fc2',  icon:'🗓️', title:'八周稳定',   desc:'连续8周每周3次+训练',         color:'#3b82f6', rarity:'epic',      check:(_,m)=>m.maxWeekStreak3>=8,  progress:(_,m)=>[Math.min(m.maxWeekStreak3,8),8] },
  { id:'fc3',  icon:'🏆', title:'十二周稳定', desc:'连续12周每周3次+训练',        color:'#2563eb', rarity:'epic',      check:(_,m)=>m.maxWeekStreak3>=12, progress:(_,m)=>[Math.min(m.maxWeekStreak3,12),12] },
  { id:'fc4',  icon:'📊', title:'月度十练',   desc:'单月完成10次+训练',           color:'#84cc16', rarity:'common',    check:(_,m)=>m.maxMonthSessions>=10 },
  { id:'fc5',  icon:'📈', title:'月度十五',   desc:'单月完成15次+训练',           color:'#65a30d', rarity:'rare',      check:(_,m)=>m.maxMonthSessions>=15 },
  { id:'fc6',  icon:'🔝', title:'月度二十',   desc:'单月完成20次+训练',           color:'#f59e0b', rarity:'epic',      check:(_,m)=>m.maxMonthSessions>=20 },
  { id:'fc7',  icon:'⚡', title:'月度疯人',   desc:'单月完成25次+训练',           color:'#ffcc00', rarity:'legendary', check:(_,m)=>m.maxMonthSessions>=25 },
  { id:'fc8',  icon:'🌙', title:'季度稳定',   desc:'连续3个月每月10次+',          color:'#a855f7', rarity:'epic',      check:(_,m)=>m.maxMonthStreak10>=3,progress:(_,m)=>[Math.min(m.maxMonthStreak10,3),3] },
  { id:'fc9',  icon:'💎', title:'半年稳定',   desc:'连续6个月每月10次+',          color:'#ffcc00', rarity:'legendary', check:(_,m)=>m.maxMonthStreak10>=6,progress:(_,m)=>[Math.min(m.maxMonthStreak10,6),6] },
  { id:'fc10', icon:'🌍', title:'连续二十周', desc:'连续20周有训练记录',           color:'#34d399', rarity:'epic',      check:(_,m)=>m.consecutiveWeeks>=20,progress:(_,m)=>[Math.min(m.consecutiveWeeks,20),20] },

  // ── 均衡训练 Balance ──────────────────────────────────────────────────────
  { id:'b1',   icon:'⚖️', title:'推拉均衡',   desc:'推/拉训练次数差不超过30%',     color:'#a3e635', rarity:'rare',      check:(_,m)=>m.pushSessions>0&&m.pullSessions>0&&Math.abs(m.pushSessions-m.pullSessions)/Math.max(m.pushSessions,m.pullSessions)<=0.3 },
  { id:'b2',   icon:'🌐', title:'全面发展',   desc:'推/拉/腿各完成30次以上',       color:'#84cc16', rarity:'epic',      check:(_,m)=>m.pushSessions>=30&&m.pullSessions>=30&&m.legSessions>=30 },
  { id:'b3',   icon:'🎯', title:'六维均衡',   desc:'6大肌群各完成10次以上训练',   color:'#06b6d4', rarity:'epic',      check:(_,m)=>m.pushSessions>=10&&m.pullSessions>=10&&m.legSessions>=10&&m.coreSessions>=10&&m.shoulderSessions>=10&&m.armSessions>=10 },
  { id:'b4',   icon:'💫', title:'手臂均衡',   desc:'手臂(二头+三头)各有训练',     color:'#818cf8', rarity:'common',    check:(_,m)=>m.armSessions>=5 },
  { id:'b5',   icon:'🏋️', title:'上下均衡',   desc:'上肢与下肢各完成20次+',       color:'#f97316', rarity:'rare',      check:(_,m)=>(m.pushSessions+m.pullSessions)>=20&&m.legSessions>=20 },

  // ── 特殊挑战 Special Challenges ───────────────────────────────────────────
  { id:'sp1',  icon:'✌️', title:'双倍投入',   desc:'同一天完成两次训练',          color:'#a78bfa', rarity:'common',    check:(_,m)=>m.hasDoubleDay },
  { id:'sp2',  icon:'🔱', title:'三倍疯狂',   desc:'同一天完成三次训练',          color:'#7c3aed', rarity:'epic',      check:(_,m)=>m.hasTripleDay },
  { id:'sp3',  icon:'🌅', title:'浴火重生',   desc:'间隔14天后重返训练',          color:'#fb923c', rarity:'common',    check:(_,m)=>m.hasComeback14 },
  { id:'sp4',  icon:'🦅', title:'涅槃归来',   desc:'间隔30天后重返训练',          color:'#f97316', rarity:'rare',      check:(_,m)=>m.hasComeback30 },
  { id:'sp5',  icon:'🦾', title:'超高间隔',   desc:'间隔60天以上重返训练',        color:'#ef4444', rarity:'epic',      check:(_,m)=>m.maxDayGap>=60 },
  { id:'sp6',  icon:'🎋', title:'新年宣言',   desc:'在元旦(1月1日)完成训练',      color:'#f472b6', rarity:'rare',      check:(_,m)=>m.newYearSession },
  { id:'sp7',  icon:'🎄', title:'圣诞战士',   desc:'在圣诞节(12月25日)完成训练',  color:'#34d399', rarity:'rare',      check:(_,m)=>m.christmasSession },
  { id:'sp8',  icon:'🍃', title:'四季春',     desc:'在春季(3-5月)有训练记录',     color:'#86efac', rarity:'common',    check:(_,m)=>m.springSession },
  { id:'sp9',  icon:'☀️', title:'四季夏',     desc:'在夏季(6-8月)有训练记录',     color:'#fbbf24', rarity:'common',    check:(_,m)=>m.summerSession },
  { id:'sp10', icon:'🍂', title:'四季秋',     desc:'在秋季(9-11月)有训练记录',    color:'#f59e0b', rarity:'common',    check:(_,m)=>m.fallSession },
  { id:'sp11', icon:'❄️', title:'四季冬',     desc:'在冬季(12-2月)有训练记录',    color:'#bae6fd', rarity:'common',    check:(_,m)=>m.winterSession },
  { id:'sp12', icon:'🌍', title:'四季全覆盖', desc:'春夏秋冬四季均有训练记录',    color:'#a855f7', rarity:'epic',      check:(_,m)=>m.springSession&&m.summerSession&&m.fallSession&&m.winterSession },
  { id:'sp13', icon:'📅', title:'新年五练',   desc:'1月份完成5次以上训练',        color:'#ec4899', rarity:'rare',      check:(_,m)=>m.janSessions>=5 },
  { id:'sp14', icon:'🏗️', title:'八面强攻',   desc:'单次训练8种不同动作',         color:'#06b6d4', rarity:'rare',      check:(_,m)=>m.maxExercisesInSession>=8 },
  { id:'sp15', icon:'🌟', title:'三年征途',   desc:'训练记录跨越3个年份',         color:'#ffcc00', rarity:'legendary', check:(_,m)=>m.trainedYearsCount>=3 },

  // ── 传奇成就 Legendary Composite ─────────────────────────────────────────
  { id:'lg1',  icon:'🦾', title:'铁人',       desc:'连续坚持90天并完成200次训练', color:'#ef4444', rarity:'legendary', check:(_,m)=>m.longestStreak>=90&&m.sessionCount>=200 },
  { id:'lg2',  icon:'🌋', title:'钢铁意志',   desc:'连续180天且总出力超100,000 kg',color:'#dc2626',rarity:'legendary', check:(_,m)=>m.longestStreak>=180&&m.totalVolume>=100000 },
  { id:'lg3',  icon:'🏛️', title:'健身祭司',   desc:'500次训练+30种动作+6肌群',    color:'#a855f7', rarity:'legendary', check:(_,m)=>m.sessionCount>=500&&m.exerciseCount>=30&&m.muscleCount>=6 },
  { id:'lg4',  icon:'⚡', title:'闪电怪兽',   desc:'单次出力10,000kg+持续2小时+', color:'#f59e0b', rarity:'legendary', check:(_,m)=>m.maxSingleVol>=10000&&m.maxDuration>=7200 },
  { id:'lg5',  icon:'🔱', title:'力量之神',   desc:'e1RM 200kg+且总出力250,000kg',color:'#ffcc00', rarity:'legendary', check:(_,m)=>m.maxE1RM>=200&&m.totalVolume>=250000 },
  { id:'lg6',  icon:'🌌', title:'全能战神',   desc:'推/拉/腿各50次+e1RM 120kg+',  color:'#818cf8', rarity:'legendary', check:(_,m)=>m.pushSessions>=50&&m.pullSessions>=50&&m.legSessions>=50&&m.maxE1RM>=120 },
  { id:'lg7',  icon:'💎', title:'时间管理者', desc:'累计500小时+单月20次+',        color:'#06b6d4', rarity:'legendary', check:(_,m)=>m.totalDurationSec>=1800000&&m.maxMonthSessions>=20 },
  { id:'lg8',  icon:'🦅', title:'永恒传说',   desc:'365次训练+5年记录',           color:'#ffffff', rarity:'legendary', check:(_,m)=>m.sessionCount>=365&&m.trainedYearsCount>=5 },
  { id:'lg9',  icon:'👑', title:'健身神话',   desc:'200个PR+50种动作+总出力500,000 kg', color:'#ffcc00', rarity:'legendary', check:(_,m)=>m.prCount>=200&&m.exerciseCount>=50&&m.totalVolume>=500000 },
  { id:'lg10', icon:'♾️', title:'不朽之躯',   desc:'连续坚持180天+e1RM 150kg+万组',color:'#ffcc00', rarity:'legendary', check:(_,m)=>m.longestStreak>=180&&m.maxE1RM>=150&&m.totalSets>=10000 },

  // ── 进步里程碑 Progression Milestones ────────────────────────────────────
  { id:'pg1',  icon:'📉', title:'零基础出发', desc:'还没有任何训练重量记录',       color:'#94a3b8', rarity:'common',    check:(_,m)=>m.sessionCount>=1&&m.maxSingleSetWeight===0 },
  { id:'pg2',  icon:'🔼', title:'重量突破',   desc:'首次举起超过自己体重的重量(假设70kg)',color:'#34d399',rarity:'rare',check:(_,m)=>m.maxSingleSetWeight>=70 },
  { id:'pg3',  icon:'📐', title:'组数高手',   desc:'平均单次训练组数超过15组',     color:'#60a5fa', rarity:'rare',      check:(_,m)=>m.sessionCount>0&&m.totalSets/m.sessionCount>=15 },
  { id:'pg4',  icon:'🎲', title:'坚持四月',   desc:'训练记录覆盖4个不同月份',      color:'#818cf8', rarity:'common',    check:(_,m)=>m.trainedMonthsCount>=4,  progress:(_,m)=>[Math.min(m.trainedMonthsCount,4),4] },
  { id:'pg5',  icon:'🎯', title:'坚持半年',   desc:'训练记录覆盖6个不同月份',      color:'#a855f7', rarity:'rare',      check:(_,m)=>m.trainedMonthsCount>=6,  progress:(_,m)=>[Math.min(m.trainedMonthsCount,6),6] },
  { id:'pg6',  icon:'🔭', title:'连续三十周', desc:'连续30周有训练记录',           color:'#f97316', rarity:'epic',      check:(_,m)=>m.consecutiveWeeks>=30,   progress:(_,m)=>[Math.min(m.consecutiveWeeks,30),30] },
  { id:'pg7',  icon:'💪', title:'臂力者',     desc:'手臂训练累计50次以上',         color:'#818cf8', rarity:'rare',      check:(_,m)=>m.armSessions>=50,        progress:(_,m)=>[Math.min(m.armSessions,50),50] },
  { id:'pg8',  icon:'🏄', title:'千次rep组',  desc:'累计完成10,000次动作',         color:'#06b6d4', rarity:'epic',      check:(_,m)=>m.totalReps>=10000,       progress:(_,m)=>[Math.min(m.totalReps,10000),10000] },
  { id:'pg9',  icon:'🧗', title:'攀登者',     desc:'周末训练超50次',               color:'#84cc16', rarity:'rare',      check:(_,m)=>m.weekendSessions>=50,    progress:(_,m)=>[Math.min(m.weekendSessions,50),50] },
  { id:'pg10', icon:'🌞', title:'早起三十次', desc:'完成30次晨间(5-10时)训练',     color:'#fbbf24', rarity:'rare',      check:(_,m)=>m.morningCount>=30,       progress:(_,m)=>[Math.min(m.morningCount,30),30] },
  { id:'pg11', icon:'🔗', title:'每月打卡',   desc:'连续12个月每月至少一次训练',   color:'#34d399', rarity:'epic',      check:(_,m)=>m.consecutiveWeeks>=48 },
  { id:'pg12', icon:'🎖️', title:'百PR挑战者', desc:'获得100个个人最好记录',        color:'#a855f7', rarity:'epic',      check:(_,m)=>m.prCount>=100,           progress:(_,m)=>[Math.min(m.prCount,100),100] },
  { id:'pg13', icon:'🧲', title:'回归者',     desc:'间隔后重返并连续坚持14天以上', color:'#f472b6', rarity:'epic',      check:(_,m)=>m.hasComeback14&&m.longestStreak>=14 },
];

const AchievementsPanel = ({ workouts }: { workouts: WorkoutSession[] }) => {
  const meta = useMemo(() => calcAchievMeta(workouts), [workouts]);
  const items = useMemo(() =>
    ACHIEV_DEFS.map((def) => ({ ...def, unlocked: def.check(workouts, meta) })),
    [workouts, meta]);
  const unlockedCount = items.filter((i) => i.unlocked).length;
  const [selected, setSelected] = useState<typeof items[0] | null>(null);
  const [showAll, setShowAll] = useState(false);
  const visibleItems = showAll ? items : items.filter((i) => i.unlocked);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold uppercase tracking-[0.1em] opacity-40">
          {IS_CHINESE ? `成就 · ${unlockedCount} / ${items.length}` : `Achievements · ${unlockedCount} / ${items.length}`}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs opacity-25 tabular-nums">{Math.round((unlockedCount / items.length) * 100)}%</span>
          <button onClick={() => setShowAll((v) => !v)} style={{
            fontSize: 11, opacity: 0.45, background: 'none', border: 'none',
            cursor: 'pointer', color: 'inherit', padding: '2px 4px',
          }}>
            {showAll
              ? (IS_CHINESE ? '只看已解锁 ▲' : 'Unlocked only ▲')
              : (IS_CHINESE ? `显示全部 ${items.length} 个 ▼` : `Show all ${items.length} ▼`)}
          </button>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="h-1 rounded-full overflow-hidden mb-4" style={{ background: 'var(--wt-chip-bg)' }}>
        <div className="h-full rounded-full" style={{
          width: `${(unlockedCount / items.length) * 100}%`,
          background: 'linear-gradient(90deg, #6366f1, #a855f7, #ffcc00)',
          transition: 'width 1.2s ease',
        }} />
      </div>

      {/* Badge grid */}
      <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))' }}>
        {visibleItems.map(({ id, icon, title, desc, color, rarity, unlocked, progress }, idx) => {
          const prog = progress?.(workouts, meta);
          const progPct = prog ? Math.round((prog[0] / prog[1]) * 100) : null;
          return (
            <div key={id} title={`${title}\n${desc}${prog && !unlocked ? `\n${prog[0]} / ${prog[1]}` : ''}`}
              className="rounded-xl p-2.5 flex flex-col items-center gap-1.5 relative select-none"
              style={{
                background: unlocked ? `linear-gradient(135deg, ${color}1a, ${color}08)` : 'rgba(100,100,120,0.05)',
                border: `1px solid ${unlocked ? color + '45' : 'rgba(128,128,128,0.1)'}`,
                boxShadow: unlocked ? `0 0 14px ${color}20` : undefined,
                filter: unlocked ? undefined : 'grayscale(0.9)',
                opacity: unlocked ? 1 : 0.38,
                animation: unlocked ? `badgeUnlock 0.5s cubic-bezier(0.34,1.56,0.64,1) ${idx * 0.04}s both` : undefined,
                transition: 'box-shadow 0.2s, border-color 0.2s',
                cursor: 'pointer',
              }}
              onClick={() => setSelected(items.find((it) => it.id === id) ?? null)}
              onMouseEnter={(e) => {
                if (unlocked) (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 20px ${color}40`;
              }}
              onMouseLeave={(e) => {
                if (unlocked) (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 14px ${color}20`;
              }}
            >
              <span style={{ fontSize: 24, lineHeight: 1 }}>{icon}</span>
              <span className="text-center leading-tight font-semibold" style={{ fontSize: 9.5, color: unlocked ? color : undefined }}>
                {title}
              </span>
              {/* Rarity badge */}
              {unlocked && (
                <span className="rounded-full px-1.5 py-px" style={{
                  fontSize: 7, fontWeight: 700, letterSpacing: '0.04em',
                  background: RARITY_COLOR[rarity] + '22', color: RARITY_COLOR[rarity],
                }}>
                  {RARITY_LABEL[rarity]}
                </span>
              )}
              {/* Progress bar for milestone achievements */}
              {progPct !== null && !unlocked && (
                <div className="w-full h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(128,128,128,0.15)' }}>
                  <div className="h-full rounded-full" style={{ width: `${progPct}%`, background: color }} />
                </div>
              )}
              {/* Lock icon */}
              {!unlocked && (
                <span style={{ position: 'absolute', top: 4, right: 5, fontSize: 8, opacity: 0.35 }}>🔒</span>
              )}
            </div>
          );
        })}
      </div>

      {selected && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{
              background: 'var(--wo-card-bg)',
              border: `1px solid ${selected.color}44`,
              borderRadius: 20,
              padding: 28,
              maxWidth: 340,
              width: '90vw',
              position: 'relative',
              boxShadow: `0 0 40px ${selected.color}30`,
              animation: 'badgeUnlock 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelected(null)}
              style={{ position: 'absolute', top: 12, right: 14, background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', opacity: 0.4, color: 'inherit' }}
            >✕</button>

            {/* Icon + title */}
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 52, lineHeight: 1, marginBottom: 8 }}>{selected.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: selected.color }}>{selected.title}</div>
              <div style={{ fontSize: 11, opacity: 0.4, marginTop: 4 }}>{RARITY_LABEL[selected.rarity]} · {selected.rarity.toUpperCase()}</div>
            </div>

            {/* Description */}
            <div style={{ fontSize: 13, opacity: 0.7, textAlign: 'center', marginBottom: 16, lineHeight: 1.6 }}>{selected.desc}</div>

            {/* Status */}
            <div style={{
              borderRadius: 12, padding: '10px 16px', textAlign: 'center',
              background: selected.unlocked ? `${selected.color}15` : 'rgba(128,128,128,0.08)',
              border: `1px solid ${selected.unlocked ? selected.color + '30' : 'rgba(128,128,128,0.15)'}`,
            }}>
              {selected.unlocked ? (
                <span style={{ color: selected.color, fontWeight: 600, fontSize: 13 }}>✓ 已解锁</span>
              ) : (
                <span style={{ opacity: 0.45, fontSize: 13 }}>🔒 未解锁</span>
              )}
            </div>

            {/* Progress bar if applicable */}
            {(() => {
              const prog = selected.progress?.(workouts, meta);
              if (!prog) return null;
              const pct = Math.min(100, Math.round((prog[0] / prog[1]) * 100));
              return (
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: 0.5, marginBottom: 5 }}>
                    <span>进度</span>
                    <span>{prog[0].toLocaleString()} / {prog[1].toLocaleString()}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: 'rgba(128,128,128,0.15)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 99, width: `${pct}%`, background: selected.color, transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default AchievementsPanel;
