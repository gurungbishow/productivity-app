'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { getNepaliDate } from '@/lib/bikramSambat';
import { 
  Sun, 
  Moon, 
  Sunrise, 
  Sunset,
  Cloud 
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';

export function MobileHeader() {
  const { profile } = useAppStore();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const now = currentTime || new Date();
  const nepaliDate = getNepaliDate(now);

  const timeFormatted = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const gregorianMonthName = now.toLocaleDateString('en-US', { month: 'long' });
  const gregorianDateStr = `${gregorianMonthName} ${now.getDate()}, ${now.getFullYear()} AD`;

  const hours = now.getHours();
  let greeting = 'Good morning';
  let GreetingIcon = Sunrise;
  let iconTheme = {
    ring: 'from-amber-500/60 via-orange-500/40 to-yellow-400/50',
    glow: 'shadow-[0_0_16px_rgba(245,158,11,0.25)]',
    iconColor: 'text-amber-400',
    badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
    textGradient: 'from-amber-200 via-orange-200 to-yellow-300',
  };

  if (hours >= 5 && hours < 12) {
    greeting = 'Good morning';
    GreetingIcon = Sunrise;
    iconTheme = {
      ring: 'from-amber-500/60 via-orange-500/40 to-yellow-400/50',
      glow: 'shadow-[0_0_16px_rgba(245,158,11,0.25)]',
      iconColor: 'text-amber-400',
      badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
      textGradient: 'from-amber-200 via-orange-200 to-yellow-300',
    };
  } else if (hours >= 12 && hours < 17) {
    greeting = 'Good afternoon';
    GreetingIcon = Sun;
    iconTheme = {
      ring: 'from-sky-500/60 via-indigo-500/40 to-amber-400/50',
      glow: 'shadow-[0_0_16px_rgba(14,165,233,0.25)]',
      iconColor: 'text-sky-400',
      badgeBg: 'bg-sky-500/10 text-sky-300 border-sky-500/25',
      textGradient: 'from-white via-sky-200 to-amber-200',
    };
  } else if (hours >= 17 && hours < 21) {
    greeting = 'Good evening';
    GreetingIcon = Sunset;
    iconTheme = {
      ring: 'from-indigo-500/70 via-purple-500/50 to-rose-400/50',
      glow: 'shadow-[0_0_18px_rgba(139,92,246,0.3)]',
      iconColor: 'text-purple-300',
      badgeBg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      textGradient: 'from-purple-200 via-pink-200 to-rose-300',
    };
  } else {
    greeting = 'Good night';
    GreetingIcon = Moon;
    iconTheme = {
      ring: 'from-indigo-500/60 via-blue-500/40 to-purple-500/50',
      glow: 'shadow-[0_0_16px_rgba(99,102,241,0.25)]',
      iconColor: 'text-indigo-300',
      badgeBg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25',
      textGradient: 'from-cyan-300 via-indigo-300 to-pink-400',
    };
  }

  const userName = profile?.name || 'Bishow';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#070A12]/80 backdrop-blur-2xl border-b border-white/[0.08] px-4 py-2 sm:py-2.5 shadow-[0_4px_30px_rgba(0,0,0,0.6)] relative space-y-1.5">
      {/* Subtle top ambient sheen */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/40 via-indigo-500/40 to-transparent pointer-events-none" />

      {/* Top Row: Left (Greeting with Avatar emblem) & Right (Cloud Status) */}
      <div className="flex items-center justify-between gap-2.5">
        {/* Left: Emblem + Greeting with Vibrant Gradient */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr ${iconTheme.ring} p-[1px] ${iconTheme.glow} shrink-0 transition-all duration-300`}>
            <div className="w-full h-full rounded-[11px] bg-gradient-to-b from-[#13192B] to-[#0A0D15] flex items-center justify-center shadow-inner">
              <GreetingIcon className={`w-4.5 h-4.5 ${iconTheme.iconColor}`} />
            </div>
          </div>

          <div className="min-w-0">
            <h1 className="text-base sm:text-[17px] font-black tracking-tight truncate leading-tight">
              <span className={`bg-gradient-to-r ${iconTheme.textGradient} bg-clip-text text-transparent font-black`}>
                {greeting}, {userName}!
              </span>
            </h1>
            <p className="text-[10.5px] font-semibold text-slate-400">Stay consistent & make it count</p>
          </div>
        </div>

        {/* Right: Cloud Status Pill */}
        <div className="shrink-0">
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] uppercase tracking-wider font-black shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            Cloud
          </span>
        </div>
      </div>

      {/* Bottom Stack: Centered Date & Time */}
      <div className="flex flex-col items-center justify-center space-y-0">
        <div className="flex items-center gap-2 text-[12px] font-black tracking-tight">
          <span className="text-cyan-400">{dayName}</span>
          <span className="text-white/20">|</span>
          <span className="text-white font-mono">{timeFormatted}</span>
        </div>
        
        <div className="flex items-center gap-2 text-[10.5px] font-bold tracking-tight">
          <span className="text-amber-400 flex items-center gap-1">
            <span>{nepaliDate.monthName} {nepaliDate.day}, {nepaliDate.year} BS</span>
          </span>
          <span className="text-white/20">|</span>
          <span className="text-slate-300">
            {gregorianDateStr}
          </span>
        </div>
      </div>
    </header>
  );
}
