'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { getScheduleStatus } from '@/lib/scheduleEngine';
import { formatDuration } from '@/lib/utils';
import { ArrowRight, Clock, Sparkles } from 'lucide-react';

interface UpNextCardProps {
  onViewSchedule: () => void;
}

export function UpNextCard({ onViewSchedule }: UpNextCardProps) {
  const { schedule } = useAppStore();
  const [scheduleStatus, setScheduleStatus] = useState(() => getScheduleStatus(schedule, new Date()));

  useEffect(() => {
    const update = () => {
      setScheduleStatus(getScheduleStatus(schedule, new Date()));
    };
    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, [schedule]);

  const { nextSlot, minutesUntilNext } = scheduleStatus;

  if (!nextSlot) {
    return null;
  }

  return (
    <div 
      onClick={onViewSchedule}
      className="group relative overflow-hidden rounded-[24px] p-4 border border-white/[0.1] bg-gradient-to-br from-[#12192B]/90 via-[#0D1322]/90 to-[#0A0E18]/95 backdrop-blur-2xl shadow-[0_15px_35px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.12)] space-y-2 cursor-pointer active:scale-[0.99] transition-all duration-200"
    >
      {/* Subtle top ambient sheen */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />

      {/* Ambient background glow */}
      <div className="absolute -top-10 -right-10 w-36 h-36 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/25 transition-all duration-500" />

      {/* Header tags */}
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-[10.5px] font-black uppercase tracking-wider shadow-[0_0_10px_rgba(6,182,212,0.2)]">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Up Next</span>
        </span>

        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-[11px] font-mono font-bold shadow-[0_0_10px_rgba(99,102,241,0.2)]">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          <span>starts in {formatDuration(minutesUntilNext)}</span>
        </span>
      </div>

      {/* Content & Action */}
      <div className="flex items-center justify-between gap-3 pt-0.5">
        <div className="space-y-1.5 min-w-0">
          <h3 className="text-base sm:text-[17px] font-black text-white tracking-tight group-hover:text-cyan-200 transition-colors truncate">
            {nextSlot.title}
          </h3>
          <div className="flex items-center gap-1.5 text-xs font-mono font-extrabold text-slate-200">
            <Clock className="w-4 h-4 text-cyan-300 stroke-[2.25] drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] shrink-0" />
            <span className="text-slate-100 font-extrabold">{nextSlot.startTime} – {nextSlot.endTime}</span>
          </div>
        </div>

        <div className="p-[1px] rounded-2xl bg-gradient-to-tr from-cyan-500/30 to-indigo-500/30 group-hover:from-cyan-400 group-hover:to-indigo-400 transition-all duration-300 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewSchedule();
            }}
            className="p-2.5 rounded-[15px] bg-[#0C1222] text-slate-300 group-hover:text-white group-hover:bg-[#121A30] active:scale-90 transition-all duration-200 flex items-center justify-center"
          >
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
