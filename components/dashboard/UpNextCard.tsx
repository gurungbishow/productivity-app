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
      className="group relative overflow-hidden rounded-[24px] p-4 border border-white/[0.14] bg-gradient-to-br from-white/[0.09] via-[#0D1222]/80 to-[#070A14]/90 backdrop-blur-2xl shadow-[0_15px_35px_rgba(0,0,0,0.6),inset_0_1px_1.5px_rgba(255,255,255,0.2)] space-y-2 cursor-pointer active:scale-[0.99] transition-all duration-200"
    >
      {/* Specular top rim light sheen */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/70 via-indigo-400/60 to-transparent pointer-events-none opacity-90" />

      {/* Ambient background glow */}
      <div className="absolute -top-10 -right-10 w-36 h-36 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/25 transition-all duration-500" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header tags */}
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/35 text-cyan-300 text-[10.5px] font-black uppercase tracking-wider backdrop-blur-xl shadow-[0_0_12px_rgba(6,182,212,0.25)]">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Up Next</span>
        </span>

        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-400/35 text-indigo-300 text-[11px] font-mono font-bold backdrop-blur-xl shadow-[0_0_12px_rgba(99,102,241,0.25)]">
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

        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewSchedule();
          }}
          className="relative group/arrow w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-b from-cyan-500/20 via-white/[0.06] to-indigo-500/15 hover:from-cyan-500/30 hover:via-white/[0.12] hover:to-indigo-500/25 border border-cyan-400/35 hover:border-cyan-300/60 backdrop-blur-xl shadow-[0_0_15px_rgba(6,182,212,0.25),inset_0_1px_1.5px_rgba(255,255,255,0.3)] hover:shadow-[0_0_22px_rgba(6,182,212,0.45),inset_0_1px_2px_rgba(255,255,255,0.4)] active:scale-90 transition-all duration-200 flex items-center justify-center shrink-0 cursor-pointer overflow-hidden"
          title="View Schedule"
          aria-label="View Schedule"
        >
          {/* Subtle top rim light sheen */}
          <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent pointer-events-none" />

          {/* Luminous Arrow Icon with Glow and Hover Nudge */}
          <ArrowRight className="w-4 h-4 text-cyan-300 stroke-[2.4] drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] group-hover:translate-x-0.5 group-hover:text-white group-hover:drop-shadow-[0_0_12px_rgba(34,211,238,1)] transition-all duration-300" />
        </button>
      </div>
    </div>
  );
}
