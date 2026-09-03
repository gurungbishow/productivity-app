'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { getScheduleStatus } from '@/lib/scheduleEngine';
import { triggerConfetti } from '@/lib/utils';

import { 
  Play, 
  Pause,
  RotateCcw,
  SkipForward,
  Clock, 
  Check
} from 'lucide-react';

export function CurrentTaskCard() {
  const { 
    schedule, 
    completedTaskIds, 
    toggleTaskCompleted,
    pomodoroSettings,
    timerState,
    displayTime,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    skipSession,
    changeMode,
    setActiveTaskForTimer,
  } = useAppStore();

  const [scheduleStatus, setScheduleStatus] = useState(() => getScheduleStatus(schedule, new Date()));
  
  // Sync slot status every second
  useEffect(() => {
    const update = () => {
      setScheduleStatus(getScheduleStatus(schedule, new Date()));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [schedule]);

  const { currentSlot, currentProgressPercent, minutesRemainingInCurrent } = scheduleStatus;
  const activeTaskTitle = currentSlot?.title || 'Self Directed Focus';
  const isCompleted = currentSlot ? completedTaskIds.includes(currentSlot.id) : false;

  // Sync active task title to global state for accurate focus logs
  useEffect(() => {
    setActiveTaskForTimer(activeTaskTitle);
  }, [activeTaskTitle, setActiveTaskForTimer]);

  const handleStartPause = () => {
    if (timerState.status === 'running') {
      pauseTimer();
    } else {
      if (timerState.status === 'paused') {
        resumeTimer();
      } else {
        startTimer();
      }
    }
  };

  const handleToggleComplete = () => {
    if (!currentSlot) return;
    const isNowDone = toggleTaskCompleted(currentSlot.id);
    if (isNowDone) {
      triggerConfetti();
    }
  };



  const formatRemaining = (mins: number) => {
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h}h ${m}m`;
    }
    return `${mins}m`;
  };

  // Timer math: reversed fill (ring starts empty at 25:00 and fills up clockwise as time elapses)
  const totalDuration = timerState.durationSeconds;
  const elapsedSeconds = totalDuration - displayTime;
  const progressPercent = totalDuration > 0
    ? Math.min(100, Math.max(0, (elapsedSeconds / totalDuration) * 100))
    : 0;

  const minutes = Math.floor(displayTime / 60);
  const seconds = displayTime % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const circleRadius = 68;
  const circumference = 2 * Math.PI * circleRadius;
  // Reversed fill: starts at 0% when elapsedSeconds === 0 (offset = circumference).
  // As time elapses, ring fills up clockwise towards 100% (offset = 0 when completed).
  const rawDrawn = (progressPercent / 100) * circumference;
  const visibleDrawn = elapsedSeconds > 0
    ? Math.max(8, rawDrawn)
    : 0;
  const strokeDashoffset = circumference - visibleDrawn;

  const getModeColor = () => {
    switch (timerState.mode) {
      case 'work':
        return {
          stroke: '#818CF8',
          glow: 'rgba(129, 140, 248, 0.65)',
          accent: 'text-indigo-400',
          badge: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300',
          button: 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30',
          ambientGlow: 'from-indigo-500/15 via-purple-500/5 to-transparent'
        };
      case 'short_break':
        return {
          stroke: '#34D399',
          glow: 'rgba(52, 211, 153, 0.65)',
          accent: 'text-emerald-400',
          badge: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
          button: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30',
          ambientGlow: 'from-emerald-500/15 via-teal-500/5 to-transparent'
        };
      case 'long_break':
        return {
          stroke: '#22D3EE',
          glow: 'rgba(34, 211, 238, 0.65)',
          accent: 'text-cyan-400',
          badge: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
          button: 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/30',
          ambientGlow: 'from-cyan-500/15 via-blue-500/5 to-transparent'
        };
    }
  };

  const theme = getModeColor();

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-gradient-to-b from-[#131B30]/95 via-[#0D1322]/95 to-[#080B14]/98 p-4 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.08)] space-y-3">
      
      {/* Ambient background glowing sphere adapted to current mode */}
      <div className={`absolute -top-12 -right-12 w-56 h-56 bg-gradient-to-b ${theme.ambientGlow} rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-60`} />

      {/* TOP HEADER: Current Slot Identity & Schedule */}
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10.5px] font-bold uppercase tracking-wider shrink-0 shadow-sm shadow-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Current Slot</span>
          </span>
        </div>

        {/* Slot Schedule Hours */}
        {currentSlot ? (
          <div className="flex items-center gap-1.5 text-xs sm:text-[12px] font-mono font-extrabold text-white shrink-0 bg-white/[0.08] px-2.5 py-1 rounded-xl border border-white/[0.14] shadow-sm tracking-tight">
            <Clock className="w-4 h-4 text-indigo-300 stroke-[2.25] drop-shadow-[0_0_6px_rgba(129,140,248,0.8)] shrink-0" />
            <span className="text-white font-extrabold tracking-tight">{currentSlot.startTime} – {currentSlot.endTime}</span>
          </div>
        ) : (
          <span className="text-[10.5px] text-slate-400 font-medium shrink-0">Free Transition</span>
        )}
      </div>

      {/* TASK TITLE */}
      <div className="space-y-0.5">
        <h2 className="text-lg font-black text-white tracking-tight leading-snug break-words">
          {activeTaskTitle}
        </h2>
        {currentSlot?.description && (
          <p className="text-xs text-slate-300/80 leading-relaxed font-normal">
            {currentSlot.description}
          </p>
        )}
      </div>

      {/* POMODORO STATION ENGINE */}
      <div className="pt-0.5 space-y-3">
        
        {/* Mode Selector Tabs (Colourful Gradient Border ONLY on Active Clicked Button) */}
        <div className="grid grid-cols-3 p-1 rounded-2xl bg-black/60 border border-white/[0.08] shadow-inner backdrop-blur-md gap-1">
          {/* Focus Mode Button */}
          <div
            className={`rounded-xl transition-all duration-200 ${
              timerState.mode === 'work'
                ? 'p-[1.5px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_16px_rgba(99,102,241,0.35)]'
                : 'p-[1.5px] bg-transparent'
            }`}
          >
            <button
              onClick={() => changeMode('work')}
              className={`w-full py-2 px-1 rounded-[10px] text-xs font-bold transition-all duration-150 active:scale-95 flex items-center justify-center ${
                timerState.mode === 'work'
                  ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              Focus ({pomodoroSettings.workMinutes}m)
            </button>
          </div>

          {/* Break Mode Button */}
          <div
            className={`rounded-xl transition-all duration-200 ${
              timerState.mode === 'short_break'
                ? 'p-[1.5px] bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 shadow-[0_0_16px_rgba(52,211,153,0.35)]'
                : 'p-[1.5px] bg-transparent'
            }`}
          >
            <button
              onClick={() => changeMode('short_break')}
              className={`w-full py-2 px-1 rounded-[10px] text-xs font-bold transition-all duration-150 active:scale-95 flex items-center justify-center ${
                timerState.mode === 'short_break'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              Break ({pomodoroSettings.shortBreakMinutes}m)
            </button>
          </div>

          {/* Long Break Mode Button */}
          <div
            className={`rounded-xl transition-all duration-200 ${
              timerState.mode === 'long_break'
                ? 'p-[1.5px] bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 shadow-[0_0_16px_rgba(6,182,212,0.35)]'
                : 'p-[1.5px] bg-transparent'
            }`}
          >
            <button
              onClick={() => changeMode('long_break')}
              className={`w-full py-2 px-1 rounded-[10px] text-xs font-bold transition-all duration-150 active:scale-95 flex items-center justify-center ${
                timerState.mode === 'long_break'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              Long ({pomodoroSettings.longBreakMinutes}m)
            </button>
          </div>
        </div>

        {/* Dynamic Session Progress: Session 1 of 4 */}
        <div className="flex items-center justify-between px-3.5 py-1.5 rounded-[14px] bg-white/[0.03] border border-white/[0.06] backdrop-blur-md">
          <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${
              timerState.mode === 'work' ? 'bg-indigo-400 animate-pulse' : timerState.mode === 'short_break' ? 'bg-emerald-400' : 'bg-cyan-400'
            }`} />
            <span>Session {timerState.sessionNumber} of 4</span>
          </span>

          {/* 4 Visual Session Indicator Pills */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((step) => {
              const isPast = step < timerState.sessionNumber;
              const isCurrent = step === timerState.sessionNumber;
              return (
                <div
                  key={step}
                  title={`Session ${step} of 4`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isCurrent
                      ? 'w-5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-sm shadow-indigo-500/50'
                      : isPast
                      ? 'w-2 bg-emerald-400/90'
                      : 'w-2 bg-white/15'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Circular Countdown Timer (Luxury Timepiece with Vivid Solid Stroke & Neon Glow) */}
        <div className="relative flex items-center justify-center py-2">
          {/* Ambient Glowing Core */}
          <div 
            className="absolute w-32 h-32 sm:w-36 sm:h-36 rounded-full blur-3xl opacity-40 transition-all duration-700 pointer-events-none"
            style={{ backgroundColor: theme.stroke }}
          />

          <div className="relative flex items-center justify-center w-44 h-44 sm:w-48 sm:h-48">
            {/* Concentric outer decorative halo */}
            <div className="absolute inset-2 rounded-full border border-white/[0.06] pointer-events-none" />

            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
              {/* Background Circular Track */}
              <circle
                cx="80"
                cy="80"
                r={circleRadius}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="8"
                fill="rgba(0, 0, 0, 0.35)"
              />
              {/* Animated Progress Ring */}
              <circle
                cx="80"
                cy="80"
                r={circleRadius}
                stroke={theme.stroke}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{
                  strokeDasharray: `${circumference}px`,
                  strokeDashoffset: `${strokeDashoffset}px`,
                  filter: `drop-shadow(0 0 12px ${theme.glow})`,
                  transition: timerState.status === 'running' ? 'stroke-dashoffset 0.95s linear' : 'stroke-dashoffset 0.35s ease-out'
                }}
              />
            </svg>

            {/* Inner Digital Readout */}
            <div className="absolute flex flex-col items-center justify-center text-center space-y-1 pointer-events-none select-none">
              <span className="text-[9.5px] font-black uppercase tracking-[0.2em] text-slate-400">
                {timerState.mode === 'work' ? 'WORK SPRINT' : timerState.mode.replace('_', ' ')}
              </span>
              <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
                {timeFormatted}
              </span>
              <div className="text-[10.5px] font-semibold flex items-center justify-center gap-1.5 pt-0.5">
                {timerState.status === 'running' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>Sprint Active</span>
                  </span>
                ) : (
                  <span className="text-slate-400 text-[10.5px] font-medium">
                    Ready to Start
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Primary Controls (Permanent Mobile Glow & Signature Gradient Border) */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 pt-0">
          {/* Reset Timer Button - Warm Golden Amber Glow */}
          <button
            onClick={resetTimer}
            title="Reset Timer"
            aria-label="Reset Timer"
            className="group relative w-12 h-12 flex items-center justify-center rounded-2xl bg-gradient-to-b from-amber-500/15 via-white/[0.04] to-black/60 border border-amber-400/40 shadow-[0_4px_20px_rgba(0,0,0,0.35),0_0_18px_rgba(251,191,36,0.25),inset_0_1px_1px_rgba(255,255,255,0.2)] active:scale-90 active:border-amber-300 active:shadow-[0_0_25px_rgba(251,191,36,0.45)] transition-all duration-200 shrink-0"
          >
            <RotateCcw className="w-5 h-5 text-amber-300 stroke-[2.2] drop-shadow-[0_0_8px_rgba(251,191,36,0.6)] group-hover:-rotate-90 transition-all duration-300" />
          </button>

          {/* Start / Pause Core Button with Colorful Border */}
          <div
            className={`flex-1 max-w-[210px] sm:max-w-[230px] p-[1.5px] rounded-2xl transition-all duration-300 shrink-0 ${
              timerState.mode === 'work'
                ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_25px_rgba(99,102,241,0.45)]'
                : timerState.mode === 'short_break'
                ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 shadow-[0_0_25px_rgba(52,211,153,0.45)]'
                : 'bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 shadow-[0_0_25px_rgba(6,182,212,0.45)]'
            }`}
          >
            <button
              onClick={handleStartPause}
              className={`w-full h-12 flex items-center justify-center gap-2 px-5 rounded-[14px] text-white font-black text-sm tracking-wide active:scale-95 transition-all shadow-inner ${
                timerState.mode === 'work'
                  ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:opacity-95'
                  : timerState.mode === 'short_break'
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:opacity-95'
                  : 'bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 hover:opacity-95'
              }`}
            >
              {timerState.status === 'running' ? (
                <>
                  <Pause className="w-4 h-4 fill-white" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>{timerState.status === 'paused' ? 'Resume' : 'Start'} {timerState.mode === 'work' ? 'Focus' : 'Break'}</span>
                </>
              )}
            </button>
          </div>

          {/* Skip to Next Session Button - Electric Cyan Glow */}
          <button
            onClick={skipSession}
            title="Skip to next session"
            aria-label="Skip to next session"
            className="group relative w-12 h-12 flex items-center justify-center rounded-2xl bg-gradient-to-b from-cyan-500/15 via-white/[0.04] to-black/60 border border-cyan-400/40 shadow-[0_4px_20px_rgba(0,0,0,0.35),0_0_18px_rgba(34,211,238,0.25),inset_0_1px_1px_rgba(255,255,255,0.2)] active:scale-90 active:border-cyan-300 active:shadow-[0_0_25px_rgba(34,211,238,0.45)] transition-all duration-200 shrink-0"
          >
            <SkipForward className="w-5 h-5 text-cyan-300 stroke-[2.2] drop-shadow-[0_0_8px_rgba(34,211,238,0.6)] group-hover:translate-x-0.5 transition-all duration-300" />
          </button>
        </div>

      </div>

      {/* ROUTINE PROGRESS & COMPLETION: Slot progress on left, Complete button on right */}
      {currentSlot && (
        <div className="p-3 rounded-2xl bg-black/50 border border-white/[0.08] backdrop-blur-md flex items-center justify-between gap-3">
          {/* Left: Slot Progress */}
          <div className="flex-1 space-y-1.5 min-w-0">
            <div className="flex items-center justify-between text-[11px] font-medium pr-1">
              <span className="text-slate-300 flex items-center gap-1.5">
                <span>Slot Progress:</span>
                <strong className="text-white font-mono bg-white/[0.08] px-1.5 py-0.5 rounded-md font-bold">{currentProgressPercent}%</strong>
              </span>
              <span className="text-emerald-300 font-mono text-[10.5px] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{formatRemaining(minutesRemainingInCurrent)} left</span>
              </span>
            </div>
            <div className="w-full h-2 bg-slate-900/90 rounded-full overflow-hidden p-[1px] border border-white/[0.06]">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                style={{ width: `${currentProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Visible Separation Divider */}
          <div className="h-8 w-[1px] bg-white/[0.12] shrink-0" />

          {/* Right: Mark Done Action Button (Colourful Gradient Border & Glow) */}
          <div
            className={`shrink-0 p-[1.5px] rounded-xl transition-all duration-300 active:scale-90 ${
              isCompleted
                ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 shadow-[0_0_25px_rgba(52,211,153,0.6)]'
                : 'bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-500 hover:from-emerald-300 hover:via-cyan-300 hover:to-purple-400 shadow-[0_0_20px_rgba(52,211,153,0.4),0_0_15px_rgba(168,85,247,0.25)]'
            }`}
          >
            <button
              onClick={handleToggleComplete}
              title={isCompleted ? "Mark as in-progress" : "Mark as completed"}
              className={`w-full h-full px-3.5 sm:px-4 py-2 rounded-[10px] text-xs font-black tracking-wide whitespace-nowrap transition-all duration-300 flex items-center justify-center gap-1.5 ${
                isCompleted
                  ? 'bg-transparent text-slate-950 font-black'
                  : 'bg-[#0B101D]/90 hover:bg-[#0B101D]/70 text-white font-bold backdrop-blur-md'
              }`}
            >
              {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              <span>{isCompleted ? 'Completed' : 'Mark Done'}</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
