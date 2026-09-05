'use client';

import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { 
  TrendingUp, 
  ChevronDown, 
  CheckCircle2, 
  Flame,
  Sparkles
} from 'lucide-react';

export function DailyAnalyticsAccordion() {
  const {
    schedule,
    completedTaskIds,
    todayFocusMinutes,
    profile,
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


  return (
    <div className="relative overflow-hidden rounded-[24px] border border-cyan-500/30 bg-gradient-to-br from-white/[0.08] via-cyan-950/20 to-[#0A0D15]/90 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_1px_1.5px_rgba(6,182,212,0.25)] transition-all">

      {/* Subtle top cyan sheen line */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent pointer-events-none" />

      {/* Ambient warm bloom */}
      <div className="absolute -top-10 -right-10 w-48 h-48 bg-gradient-to-br from-cyan-500/15 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Accordion Toggle Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left transition-all active:scale-[0.99] cursor-pointer group"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/35 text-cyan-300 text-[10.5px] font-black uppercase tracking-wider backdrop-blur-xl shadow-[0_0_12px_rgba(6,182,212,0.25)]">
          <TrendingUp className="w-3.5 h-3.5 text-cyan-400 stroke-[2.2]" />
          <span>Daily Progress</span>
        </span>

        {/* Toggle Indicator Button */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-cyan-400/70 uppercase tracking-widest flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-cyan-400/80" />
            <span>Overview</span>
          </span>
          <div className={`w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-cyan-400/25 backdrop-blur-xl flex items-center justify-center text-cyan-300 group-hover:text-white transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] ${isOpen ? 'rotate-180 bg-cyan-500/15' : 'rotate-0'}`}>
            <ChevronDown className="w-3.5 h-3.5 stroke-[2.5] transition-transform duration-200" />
          </div>
        </div>
      </button>

      {/* Accordion Expanded Content - Minimalist & Streamlined */}
      {isOpen && (
        <div className="px-4 pb-4 space-y-3 pt-2 border-t border-cyan-500/15 animate-in fade-in slide-in-from-top-2 duration-200">

          {/* Dual Progress Bars: Routines & Focus Target */}
          <div className="space-y-3 p-3.5 rounded-[18px] bg-white/[0.03] border border-cyan-500/15 backdrop-blur-xl">
            {/* 1. Routines Progress */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-bold text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 stroke-[2.2]" />
                  <span>Routines</span>
                </span>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-slate-400 text-[11px]">
                    <strong className="text-white font-bold">{completedRoutinesCount}</strong> / {totalActiveRoutines}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-400/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                    {routineCompletionPercent}%
                  </span>
                </div>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  style={{ width: `${Math.min(100, routineCompletionPercent)}%` }}
                />
              </div>
            </div>

            {/* 2. Focus Goal Progress */}
            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-bold text-slate-300">
                  <Flame className="w-3.5 h-3.5 text-amber-400 stroke-[2.2]" />
                  <span>Focus Target</span>
                </span>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-slate-400 text-[11px]">
                    <strong className="text-white font-bold">{actualFocusHours}h</strong> / {focusGoalHours}h
                  </span>
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-400/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
                    {focusGoalPercent}%
                  </span>
                </div>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                  style={{ width: `${Math.min(100, focusGoalPercent)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Minimalist Schedule Rhythm Strip */}
          <div className="flex items-center justify-around py-2.5 px-3 rounded-[18px] bg-white/[0.02] border border-cyan-500/15 text-center">
            <div>
              <span className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Scheduled</span>
              <span className="text-xs font-mono font-bold text-white">{scheduleSpan.totalPlannedHours} hrs</span>
            </div>

            <div className="h-4.5 w-[1px] bg-white/[0.08]" />

            <div>
              <span className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Finishes At</span>
              <span className="text-xs font-mono font-bold text-cyan-300">{scheduleSpan.finishTime}</span>
            </div>

            {pausedItems.length > 0 && (
              <>
                <div className="h-4.5 w-[1px] bg-white/[0.08]" />
                <div>
                  <span className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Paused</span>
                  <span className="text-xs font-mono font-bold text-amber-300">{pausedItems.length}</span>
                </div>
              </>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
