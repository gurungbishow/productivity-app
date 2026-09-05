'use client';

import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { getCategoryConfig } from '@/lib/categories';
import { RoutineCategory } from '@/lib/types';
import { 
  TrendingUp, 
  ChevronDown, 
  CheckCircle2, 
  Flame, 
  Timer, 
  Zap, 
  Layers
} from 'lucide-react';

export function DailyAnalyticsAccordion() {
  const {
    schedule,
    completedTaskIds,
    todayFocusMinutes,
    todayCompletedCount,
    profile,
    pomodoroSettings,
    timerState,
    categories,
  } = useAppStore();

  const [isOpen, setIsOpen] = useState(false);

  // Active vs paused items
  const activeItems = useMemo(() => {
    return schedule.filter((item) => item.isActive !== false);
  }, [schedule]);

  const pausedItems = useMemo(() => {
    return schedule.filter((item) => item.isActive === false);
  }, [schedule]);

  // Routine completion statistics
  const totalActiveRoutines = activeItems.length;
  const completedRoutinesCount = useMemo(() => {
    return activeItems.filter((item) => completedTaskIds.includes(item.id)).length;
  }, [activeItems, completedTaskIds]);

  const remainingRoutinesCount = Math.max(0, totalActiveRoutines - completedRoutinesCount);

  const routineCompletionPercent = totalActiveRoutines > 0 
    ? Math.round((completedRoutinesCount / totalActiveRoutines) * 100) 
    : 0;

  // Daily focus goal statistics
  const dailyFocusGoalMinutes = profile?.dailyFocusGoalMinutes && profile.dailyFocusGoalMinutes > 0 
    ? profile.dailyFocusGoalMinutes 
    : 240; // fallback 4 hours

  const focusGoalPercent = Math.min(100, Math.round((todayFocusMinutes / dailyFocusGoalMinutes) * 100));
  const focusGoalHours = (dailyFocusGoalMinutes / 60).toFixed(1).replace('.0', '');
  const actualFocusHours = (todayFocusMinutes / 60).toFixed(1).replace('.0', '');

  // Category analytical distribution
  const categoryStats = useMemo(() => {
    const map: Record<string, { category: RoutineCategory; plannedMinutes: number; completedCount: number; totalCount: number }> = {};

    activeItems.forEach((item) => {
      const cat = (item.category as RoutineCategory) || 'deep_work';
      const duration = Math.max(0, item.endMinutes - item.startMinutes);
      const isDone = completedTaskIds.includes(item.id);

      if (!map[cat]) {
        map[cat] = {
          category: cat,
          plannedMinutes: 0,
          completedCount: 0,
          totalCount: 0,
        };
      }
      map[cat].plannedMinutes += duration;
      map[cat].totalCount += 1;
      if (isDone) {
        map[cat].completedCount += 1;
      }
    });

    const list = Object.values(map);
    const totalPlannedMinutes = list.reduce((acc, curr) => acc + curr.plannedMinutes, 0) || 1;

    return list.map((item) => ({
      ...item,
      percentageOfTotal: Math.round((item.plannedMinutes / totalPlannedMinutes) * 100),
      isAllDone: item.totalCount > 0 && item.completedCount === item.totalCount,
    })).sort((a, b) => b.plannedMinutes - a.plannedMinutes);
  }, [activeItems, completedTaskIds]);

  // Overall schedule span (e.g. earliest start to latest end)
  const scheduleSpan = useMemo(() => {
    if (activeItems.length === 0) return { totalPlannedHours: '0', finishTime: '--' };

    const sortedByEnd = [...activeItems].sort((a, b) => b.endMinutes - a.endMinutes);
    const totalPlannedMinutes = activeItems.reduce((acc, item) => acc + Math.max(0, item.endMinutes - item.startMinutes), 0);
    const totalPlannedHours = (totalPlannedMinutes / 60).toFixed(1).replace('.0', '');

    return {
      totalPlannedHours,
      finishTime: sortedByEnd[0].endTime,
    };
  }, [activeItems]);

  // Efficiency badge
  const efficiencyBadge = useMemo(() => {
    if (routineCompletionPercent >= 100 && focusGoalPercent >= 100) {
      return { label: 'Peak Day', color: 'text-amber-300 border-amber-400/40 bg-amber-500/15' };
    }
    if (routineCompletionPercent >= 70 || focusGoalPercent >= 70) {
      return { label: 'Strong Momentum', color: 'text-emerald-300 border-emerald-400/40 bg-emerald-500/15' };
    }
    if (routineCompletionPercent >= 35 || focusGoalPercent >= 35) {
      return { label: 'In Progress', color: 'text-cyan-300 border-cyan-400/40 bg-cyan-500/15' };
    }
    return { label: 'Starting Up', color: 'text-indigo-300 border-indigo-400/40 bg-indigo-500/15' };
  }, [routineCompletionPercent, focusGoalPercent]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.14] bg-gradient-to-br from-white/[0.09] via-[#0D1222]/75 to-[#070A14]/85 backdrop-blur-2xl shadow-[0_15px_35px_rgba(0,0,0,0.6),inset_0_1px_1.5px_rgba(255,255,255,0.2)] transition-all">
      
      {/* Specular Top Rim Light Sheen */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/70 via-indigo-400/60 to-transparent pointer-events-none opacity-90" />

      {/* Ambient Diffused Corner Glow */}
      <div className="absolute -top-10 -right-10 w-36 h-36 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Accordion Toggle Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3.5 sm:p-4 flex items-center justify-between text-left transition-all active:scale-[0.99] cursor-pointer group"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/25 to-indigo-500/25 border border-cyan-400/40 backdrop-blur-xl flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3),inset_0_1px_1px_rgba(255,255,255,0.3)] shrink-0 group-hover:border-cyan-300/60 transition-colors">
            <TrendingUp className="w-4.5 h-4.5 text-cyan-300 stroke-[2.2]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black text-white tracking-tight leading-tight">
                Daily Progress & Analytics
              </h3>
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${efficiencyBadge.color}`}>
                {efficiencyBadge.label}
              </span>
            </div>

            {/* Quick Glance Preview Chips When Collapsed */}
            <div className="flex items-center gap-1.5 pt-1 text-[10.5px] text-slate-300 font-medium">
              <span className="font-mono font-bold text-emerald-400">
                {routineCompletionPercent}% Done
              </span>
              <span className="text-slate-500">·</span>
              <span className="font-mono font-bold text-amber-400">
                {actualFocusHours}h Focus
              </span>
              <span className="text-slate-500">·</span>
              <span className="font-mono font-bold text-indigo-300">
                {profile.streak || 1}d Streak 🔥
              </span>
            </div>
          </div>
        </div>

        {/* Toggle Indicator Button */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10.5px] font-bold text-slate-400 group-hover:text-slate-200 transition-colors hidden xs:inline">
            {isOpen ? 'Collapse' : 'Details'}
          </span>
          <div className={`w-7 h-7 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.15] backdrop-blur-xl flex items-center justify-center text-slate-300 group-hover:text-white transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] ${isOpen ? 'rotate-180 bg-white/[0.12]' : 'rotate-0'}`}>
            <ChevronDown className="w-3.5 h-3.5 stroke-[2.5] transition-transform duration-200" />
          </div>
        </div>
      </button>

      {/* Accordion Expanded Content */}
      {isOpen && (
        <div className="px-3.5 pb-4 sm:px-4 sm:pb-4.5 space-y-3.5 pt-1 border-t border-white/[0.08] animate-in fade-in slide-in-from-top-2 duration-200">

          {/* 1. Core Key Metrics Grid (2x2) */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            
            {/* Metric 1: Routine Completion */}
            <div className="p-2.5 rounded-xl bg-white/[0.05] border border-white/[0.12] backdrop-blur-xl space-y-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10.5px] font-bold text-slate-300">Routines Done</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-400/30">
                  {routineCompletionPercent}%
                </span>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-base sm:text-lg font-mono font-black text-white">
                  {completedRoutinesCount}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">
                  / {totalActiveRoutines}
                </span>
              </div>

              {/* Mini High-Density Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  style={{ width: `${Math.min(100, routineCompletionPercent)}%` }}
                />
              </div>

              <p className="text-[9.5px] text-slate-400 font-medium">
                {remainingRoutinesCount === 0 && totalActiveRoutines > 0
                  ? 'All routines completed today! 🌟'
                  : `${remainingRoutinesCount} routines remaining`}
              </p>
            </div>

            {/* Metric 2: Daily Focus Sprint Target */}
            <div className="p-2.5 rounded-xl bg-white/[0.05] border border-white/[0.12] backdrop-blur-xl space-y-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10.5px] font-bold text-slate-300">Focus Goal</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-400/30">
                  {focusGoalPercent}%
                </span>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-base sm:text-lg font-mono font-black text-white">
                  {actualFocusHours}h
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">
                  / {focusGoalHours}h
                </span>
              </div>

              {/* Mini High-Density Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                  style={{ width: `${Math.min(100, focusGoalPercent)}%` }}
                />
              </div>

              <p className="text-[9.5px] text-slate-400 font-medium">
                {todayFocusMinutes >= dailyFocusGoalMinutes
                  ? 'Daily focus goal crushed! 🎯'
                  : `${Math.max(0, Math.round(dailyFocusGoalMinutes - todayFocusMinutes))}m to hit target`}
              </p>
            </div>

            {/* Metric 3: Pomodoro Sessions & Rhythm */}
            <div className="p-2.5 rounded-xl bg-white/[0.05] border border-white/[0.12] backdrop-blur-xl space-y-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[10.5px] font-bold text-slate-300">Deep Sprints</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-indigo-300 bg-indigo-500/15 px-1.5 py-0.5 rounded border border-indigo-400/30">
                  {pomodoroSettings.workMinutes}m each
                </span>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-base sm:text-lg font-mono font-black text-white">
                  {todayCompletedCount}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {todayCompletedCount === 1 ? 'sprint' : 'sprints'}
                </span>
              </div>

              <p className="text-[9.5px] text-slate-400 font-medium truncate">
                {timerState.status === 'running'
                  ? `Timer active: ${timerState.mode === 'work' ? 'In focus sprint' : 'Resting on break'}`
                  : 'Timer idle · Ready to sprint'}
              </p>
            </div>

            {/* Metric 4: Streak & Consistency */}
            <div className="p-2.5 rounded-xl bg-white/[0.05] border border-white/[0.12] backdrop-blur-xl space-y-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-[10.5px] font-bold text-slate-300">Consistency</span>
                </div>
                <span className="text-[10px] font-bold text-purple-300 bg-purple-500/15 px-1.5 py-0.5 rounded border border-purple-400/30">
                  Active
                </span>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-base sm:text-lg font-mono font-black text-white">
                  {profile.streak || 1}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  Days 🔥
                </span>
              </div>

              <p className="text-[9.5px] text-slate-400 font-medium">
                Keep the momentum unbroken
              </p>
            </div>

          </div>

          {/* 2. Analytical Category Time Distribution */}
          {categoryStats.length > 0 && (
            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.1] backdrop-blur-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs font-bold text-slate-200">Category Allocation</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">
                  Planned vs Completed
                </span>
              </div>

              <div className="space-y-2">
                {categoryStats.map((item) => {
                  const meta = getCategoryConfig(item.category, categories);
                  const Icon = meta.icon;
                  const catPercent = item.totalCount > 0 ? Math.round((item.completedCount / item.totalCount) * 100) : 0;
                  const hoursText = (item.plannedMinutes / 60).toFixed(1).replace('.0', '');

                  return (
                    <div key={item.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5 text-slate-300" />
                          <span className="font-bold text-slate-200 text-[11px]">{meta.label}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({hoursText}h)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10.5px] font-mono text-slate-400">
                            {item.completedCount}/{item.totalCount} done
                          </span>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                            catPercent === 100 
                              ? 'text-emerald-300 bg-emerald-500/20' 
                              : 'text-slate-300 bg-white/[0.06]'
                          }`}>
                            {catPercent}%
                          </span>
                        </div>
                      </div>

                      {/* Distribution progress bar */}
                      <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-400 ${
                            item.category === 'deep_work' 
                              ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]'
                              : item.category === 'health_fitness'
                              ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                              : item.category === 'growth_creative'
                              ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                              : 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                          }`}
                          style={{ width: `${catPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Daily Rhythm & Schedule Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 pt-0.5 text-center">
            <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl">
              <span className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Scheduled</span>
              <span className="text-xs font-mono font-black text-white">{scheduleSpan.totalPlannedHours} hrs</span>
            </div>

            <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl">
              <span className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Finishes At</span>
              <span className="text-xs font-mono font-black text-cyan-300">{scheduleSpan.finishTime}</span>
            </div>

            <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl">
              <span className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Paused Slots</span>
              <span className={`text-xs font-mono font-black ${pausedItems.length > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                {pausedItems.length}
              </span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
