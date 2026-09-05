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
  Check,
  Zap
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
          badgeBg: 'bg-[#0E162B]/95',
          badgeText: 'text-indigo-200',
          badgeDot: 'bg-indigo-400',
          badgePing: 'bg-indigo-400',
          beamFrom: 'rgba(99, 102, 241, 0.2)',
          beamVia: '#818CF8',
          beamTo: '#C084FC',
          beamHead: '#FFFFFF',
          button: 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30',
          ambientGlow: 'from-indigo-500/15 via-purple-500/5 to-transparent',
          cardBorder: 'from-indigo-500/70 via-purple-500/40 to-cyan-500/40',
          cardShadow: 'shadow-[0_20px_50px_rgba(0,0,0,0.65),0_0_35px_rgba(99,102,241,0.25)]',
          ambientAura: 'from-indigo-500/25 via-purple-500/15 to-transparent',
          topSheen: 'via-indigo-400/60'
        };
      case 'short_break':
        return {
          stroke: '#34D399',
          glow: 'rgba(52, 211, 153, 0.65)',
          accent: 'text-emerald-400',
          badgeBg: 'bg-[#091F1A]/95',
          badgeText: 'text-emerald-200',
          badgeDot: 'bg-emerald-400',
          badgePing: 'bg-emerald-400',
          beamFrom: 'rgba(16, 185, 129, 0.2)',
          beamVia: '#34D399',
          beamTo: '#2DD4BF',
          beamHead: '#FFFFFF',
          button: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30',
          ambientGlow: 'from-emerald-500/15 via-teal-500/5 to-transparent',
          cardBorder: 'from-emerald-400/70 via-teal-500/40 to-cyan-500/40',
          cardShadow: 'shadow-[0_20px_50px_rgba(0,0,0,0.65),0_0_35px_rgba(16,185,129,0.25)]',
          ambientAura: 'from-emerald-500/25 via-teal-500/15 to-transparent',
          topSheen: 'via-emerald-400/60'
        };
      case 'long_break':
        return {
          stroke: '#22D3EE',
          glow: 'rgba(34, 211, 238, 0.65)',
          accent: 'text-cyan-400',
          badgeBg: 'bg-[#081B26]/95',
          badgeText: 'text-cyan-200',
          badgeDot: 'bg-cyan-400',
          badgePing: 'bg-cyan-400',
          beamFrom: 'rgba(6, 182, 212, 0.2)',
          beamVia: '#22D3EE',
          beamTo: '#38BDF8',
          beamHead: '#FFFFFF',
          button: 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/30',
          ambientGlow: 'from-cyan-500/15 via-blue-500/5 to-transparent',
          cardBorder: 'from-cyan-400/70 via-sky-500/40 to-indigo-500/40',
          cardShadow: 'shadow-[0_20px_50px_rgba(0,0,0,0.65),0_0_35px_rgba(6,182,212,0.25)]',
          ambientAura: 'from-cyan-500/25 via-sky-500/15 to-transparent',
          topSheen: 'via-cyan-400/60'
        };
    }
  };

  const theme = getModeColor();

  return (
    <div className={`relative rounded-[25px] p-[1.5px] bg-gradient-to-b ${theme.cardBorder} ${theme.cardShadow} transition-all duration-700`}>
      {/* Outer ambient aura glow */}
      <div className={`absolute -inset-1.5 rounded-[27px] bg-gradient-to-b ${theme.ambientAura} blur-xl pointer-events-none -z-10 opacity-70 transition-all duration-700`} />

      <div className="relative overflow-hidden rounded-[23.5px] bg-gradient-to-b from-[#131B30]/98 via-[#0D1322]/98 to-[#080B14]/98 p-4 backdrop-blur-2xl shadow-inner space-y-3">
        {/* Ambient background glowing sphere adapted to current mode */}
        <div className={`absolute -top-12 -right-12 w-56 h-56 bg-gradient-to-b ${theme.ambientGlow} rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-60`} />

      {/* TOP HEADER: Current Slot Identity & Schedule */}
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          {/* Animated Circulating Rainbow Border Badge for Current Slot */}
          <div className="relative shrink-0">
            {/* Soft ambient chromatic aura glow behind Current Slot badge */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-rose-500/35 via-indigo-500/30 to-cyan-500/35 blur-sm pointer-events-none opacity-80" />

            <div className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-full ${theme.badgeBg} text-[10.5px] font-bold uppercase tracking-wider backdrop-blur-md transition-colors duration-500 shadow-sm overflow-hidden`}>
              {/* Crisp rotating rainbow border beam synchronized with TimelineList */}
              <div 
                className="absolute inset-0 rounded-full pointer-events-none overflow-hidden"
                style={{
                  padding: '1.25px',
                  mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  maskComposite: 'exclude',
                  WebkitMaskComposite: 'xor',
                }}
              >
                {/* Subtle iridescent glass border track */}
                <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 via-indigo-500/20 via-cyan-500/20 to-emerald-500/20" />

                <div 
                  className="absolute -inset-[150%] animate-border-beam"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent 0deg, transparent 140deg, rgba(0, 245, 255, 0.05) 155deg, #00F5FF 185deg, #3B82F6 215deg, #6366F1 240deg, #A855F7 265deg, #EC4899 290deg, #F43F5E 312deg, #FF6B00 332deg, #FACC15 348deg, #FFFFFF 356deg, #FFFFFF 359deg, transparent 360deg)',
                    animationDuration: '10s',
                  }}
                />
              </div>

              <span className="relative flex h-2 w-2 z-10">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${theme.badgePing} opacity-75`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${theme.badgeDot}`} />
              </span>
              <span className={`relative z-10 ${theme.badgeText}`}>Current Slot</span>
            </div>
          </div>
        </div>

        {/* Slot Schedule Hours */}
        {currentSlot ? (
          <div className="flex items-center gap-1.5 text-xs sm:text-[12px] font-mono font-extrabold text-white shrink-0 bg-white/[0.08] px-2.5 py-1 rounded-xl border border-white/[0.14] shadow-sm tracking-tight">
            <Clock className={`w-4 h-4 ${theme.accent} stroke-[2.25] drop-shadow-[0_0_6px_rgba(129,140,248,0.8)] shrink-0 transition-colors duration-500`} />
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
      <div className="pt-0.5 space-y-2.5">
        
        {/* Grouped Mode Selector & Session Progress (Zero y-gap) */}
        <div className="space-y-1">
          {/* Mode Selector Tabs (Smooth cross-fading active overlays) */}
          <div className="grid grid-cols-3 p-1 rounded-xl bg-black/60 border border-white/[0.08] shadow-inner backdrop-blur-md gap-1">
            {[
              { id: 'work' as const, label: `Focus (${pomodoroSettings.workMinutes}m)`, border: 'from-indigo-500 via-purple-500 to-pink-500', shadow: 'shadow-[0_0_16px_rgba(99,102,241,0.35)]', bg: 'from-indigo-600 via-indigo-500 to-purple-600' },
              { id: 'short_break' as const, label: `Break (${pomodoroSettings.shortBreakMinutes}m)`, border: 'from-emerald-400 via-teal-400 to-cyan-400', shadow: 'shadow-[0_0_16px_rgba(52,211,153,0.35)]', bg: 'from-emerald-600 to-teal-600' },
              { id: 'long_break' as const, label: `Long (${pomodoroSettings.longBreakMinutes}m)`, border: 'from-cyan-400 via-blue-500 to-purple-500', shadow: 'shadow-[0_0_16px_rgba(6,182,212,0.35)]', bg: 'from-cyan-600 to-blue-600' },
            ].map((modeItem) => {
              const isModeActive = timerState.mode === modeItem.id;
              return (
                <button
                  key={modeItem.id}
                  onClick={() => changeMode(modeItem.id)}
                  className="relative h-8 rounded-lg p-[1.5px] select-none active:scale-95 transition-transform duration-150 cursor-pointer overflow-hidden"
                >
                  {/* Active Glowing Border & Gradient Background Overlay */}
                  <div
                    className={`absolute inset-0 rounded-lg bg-gradient-to-r ${modeItem.border} ${modeItem.shadow} transition-opacity duration-200 ease-out pointer-events-none ${
                      isModeActive ? 'opacity-100' : 'opacity-0'
                    }`}
                  />

                  {/* Inner button container */}
                  <div
                    className={`relative z-10 w-full h-full px-1 rounded-[7px] text-[11px] font-bold transition-colors duration-200 flex items-center justify-center ${
                      isModeActive
                        ? 'text-white shadow-inner'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                    }`}
                  >
                    {/* Active fill sheen */}
                    <div
                      className={`absolute inset-0 rounded-[7px] bg-gradient-to-r ${modeItem.bg} transition-opacity duration-200 pointer-events-none -z-10 ${
                        isModeActive ? 'opacity-90' : 'opacity-0'
                      }`}
                    />
                    <span>{modeItem.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Dynamic Session Progress: Session 1 of 4 */}
          <div className="flex items-center justify-between px-3.5 py-1.5 rounded-[14px] bg-white/[0.03] border border-white/[0.06] backdrop-blur-md">
            <span className="text-[11px] font-bold text-slate-200">
              {timerState.mode === 'long_break'
                ? `Cycle Complete (${pomodoroSettings.longBreakInterval || 4}/${pomodoroSettings.longBreakInterval || 4})`
                : `Session ${timerState.sessionNumber} of ${pomodoroSettings.longBreakInterval || 4}`}
            </span>

            <div className="flex items-center gap-2.5">
              {/* Auto status badge */}
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium text-slate-400">
                <Zap className={`w-2.5 h-2.5 ${pomodoroSettings.autoStartBreaks && pomodoroSettings.autoStartFocus ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>{pomodoroSettings.autoStartBreaks && pomodoroSettings.autoStartFocus ? 'Auto-flow' : 'Manual'}</span>
              </span>

              {/* Visual Session Indicator Pills */}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: pomodoroSettings.longBreakInterval || 4 }, (_, i) => i + 1).map((step) => {
                  const isPast = step < timerState.sessionNumber;
                  const isCurrent = step === timerState.sessionNumber;
                  return (
                    <div
                      key={step}
                      title={`Session ${step} of ${pomodoroSettings.longBreakInterval || 4}`}
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
          </div>
        </div>

        {/* Circular Countdown Timer (Luxury Timepiece with Vivid Solid Stroke & Neon Glow) */}
        <div className="relative flex items-center justify-center py-0.5">
          {/* Ambient Glowing Core */}
          <div 
            className="absolute w-32 h-32 sm:w-36 sm:h-36 rounded-full blur-3xl opacity-40 transition-all duration-700 pointer-events-none"
            style={{ backgroundColor: theme.stroke }}
          />

          <div className="relative flex items-center justify-center w-40 h-40 sm:w-44 sm:h-44">
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
                  transition: timerState.status === 'running' ? 'stroke-dashoffset 1s linear' : 'stroke-dashoffset 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              />
            </svg>

            {/* Inner Digital Readout */}
            <div className="absolute flex flex-col items-center justify-center text-center space-y-0.5 pointer-events-none select-none">
              <span className="text-[9.5px] font-black uppercase tracking-[0.2em] text-slate-400">
                {timerState.mode === 'work' ? 'WORK SPRINT' : timerState.mode.replace('_', ' ')}
              </span>
              <span className="text-4xl sm:text-[44px] font-black font-mono tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
                {timeFormatted}
              </span>
              <div className="h-5 flex items-center justify-center gap-1.5 pt-0.5">
                {timerState.status === 'running' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Sprint Active</span>
                  </span>
                ) : (
                  <span className="text-slate-400 text-[10px] font-medium">
                    Ready to Start
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Primary Controls (Permanent Mobile Glow & Signature Gradient Border) */}
        <div className="w-full flex items-center justify-between gap-2 sm:gap-2.5 px-2.5 sm:px-3 pt-0">
          {/* Reset Timer Button - Warm Golden Amber Glow */}
          <button
            onClick={resetTimer}
            title="Reset Timer"
            aria-label="Reset Timer"
            className="group relative w-12 sm:w-14 h-10 flex items-center justify-center rounded-xl bg-gradient-to-b from-amber-500/15 via-white/[0.04] to-black/60 border border-amber-400/40 shadow-[0_4px_20px_rgba(0,0,0,0.35),0_0_18px_rgba(251,191,36,0.25),inset_0_1px_1px_rgba(255,255,255,0.2)] active:scale-90 active:border-amber-300 active:shadow-[0_0_25px_rgba(251,191,36,0.45)] transition-all duration-200 shrink-0"
          >
            <RotateCcw className="w-[18px] h-[18px] text-amber-300 stroke-[2.2] drop-shadow-[0_0_8px_rgba(251,191,36,0.6)] group-hover:-rotate-90 transition-all duration-300" />
          </button>

          {/* Start / Pause Core Button with Colorful Border */}
          <div className="relative flex-1 h-10 min-w-0 p-[1.5px] rounded-xl overflow-hidden">
            {/* Work border overlay */}
            <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_25px_rgba(99,102,241,0.45)] transition-opacity duration-300 pointer-events-none ${timerState.mode === 'work' ? 'opacity-100' : 'opacity-0'}`} />
            {/* Short break border overlay */}
            <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 shadow-[0_0_25px_rgba(52,211,153,0.45)] transition-opacity duration-300 pointer-events-none ${timerState.mode === 'short_break' ? 'opacity-100' : 'opacity-0'}`} />
            {/* Long break border overlay */}
            <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 shadow-[0_0_25px_rgba(6,182,212,0.45)] transition-opacity duration-300 pointer-events-none ${timerState.mode === 'long_break' ? 'opacity-100' : 'opacity-0'}`} />

            <button
              onClick={handleStartPause}
              className="relative z-10 w-full h-full flex items-center justify-center gap-2 px-4 rounded-[10.5px] text-white font-black text-xs tracking-wide active:scale-95 transition-all shadow-inner overflow-hidden"
            >
              {/* Internal background gradient overlays */}
              <div className={`absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 transition-opacity duration-300 pointer-events-none ${timerState.mode === 'work' ? 'opacity-100' : 'opacity-0'}`} />
              <div className={`absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 transition-opacity duration-300 pointer-events-none ${timerState.mode === 'short_break' ? 'opacity-100' : 'opacity-0'}`} />
              <div className={`absolute inset-0 bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 transition-opacity duration-300 pointer-events-none ${timerState.mode === 'long_break' ? 'opacity-100' : 'opacity-0'}`} />

              <div className="relative z-10 flex items-center justify-center gap-2">
                {timerState.status === 'running' ? (
                  <>
                    <Pause className="w-4 h-4 fill-white shrink-0" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white shrink-0" />
                    <span>{timerState.status === 'paused' ? 'Resume' : 'Start'} {timerState.mode === 'work' ? 'Focus' : 'Break'}</span>
                  </>
                )}
              </div>
            </button>
          </div>

          {/* Skip to Next Session Button - Electric Cyan Glow */}
          <button
            onClick={skipSession}
            title="Skip to next session"
            aria-label="Skip to next session"
            className="group relative w-12 sm:w-14 h-10 flex items-center justify-center rounded-xl bg-gradient-to-b from-cyan-500/15 via-white/[0.04] to-black/60 border border-cyan-400/40 shadow-[0_4px_20px_rgba(0,0,0,0.35),0_0_18px_rgba(34,211,238,0.25),inset_0_1px_1px_rgba(255,255,255,0.2)] active:scale-90 active:border-cyan-300 active:shadow-[0_0_25px_rgba(34,211,238,0.45)] transition-all duration-200 shrink-0"
          >
            <SkipForward className="w-[18px] h-[18px] text-cyan-300 stroke-[2.2] drop-shadow-[0_0_8px_rgba(34,211,238,0.6)] group-hover:translate-x-0.5 transition-all duration-300" />
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
            className={`shrink-0 h-9 p-[1.5px] rounded-xl transition-all duration-300 active:scale-90 ${
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
    </div>
  );
}
