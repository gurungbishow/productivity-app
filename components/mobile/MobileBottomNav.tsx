'use client';

import React from 'react';
import { LayoutGrid, CalendarDays, SlidersHorizontal } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: 'dashboard' | 'schedule' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'schedule' | 'settings') => void;
}

export function MobileBottomNav({ activeTab, setActiveTab }: MobileBottomNavProps) {
  const tabs = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: LayoutGrid,
      theme: {
        activeGlow: 'shadow-[0_0_18px_rgba(99,102,241,0.35)]',
        activeBorder: 'border-indigo-400/50',
        activeBg: 'bg-gradient-to-b from-indigo-500/20 via-purple-500/10 to-indigo-950/30',
        iconColor: 'text-indigo-300',
        dotColor: 'bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.9)]',
        textGradient: 'bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent font-black',
      },
    },
    {
      id: 'schedule',
      label: 'Schedule',
      icon: CalendarDays,
      theme: {
        activeGlow: 'shadow-[0_0_18px_rgba(16,185,129,0.35)]',
        activeBorder: 'border-emerald-400/50',
        activeBg: 'bg-gradient-to-b from-emerald-500/20 via-teal-500/10 to-emerald-950/30',
        iconColor: 'text-emerald-300',
        dotColor: 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)]',
        textGradient: 'bg-gradient-to-r from-white via-emerald-200 to-teal-200 bg-clip-text text-transparent font-black',
      },
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: SlidersHorizontal,
      theme: {
        activeGlow: 'shadow-[0_0_18px_rgba(6,182,212,0.35)]',
        activeBorder: 'border-cyan-400/50',
        activeBg: 'bg-gradient-to-b from-cyan-500/20 via-blue-500/10 to-cyan-950/30',
        iconColor: 'text-cyan-300',
        dotColor: 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.9)]',
        textGradient: 'bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent font-black',
      },
    },
  ] as const;

  return (
    <nav className="fixed bottom-3 sm:bottom-4 left-3 right-3 max-w-[430px] mx-auto z-50 rounded-[20px] bg-[#080D1A]/90 backdrop-blur-3xl border border-white/[0.12] p-1 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(99,102,241,0.18),inset_0_1px_1px_rgba(255,255,255,0.18)] transition-all">
      {/* Top rainbow/aurora ambient sheen line */}
      <div className="absolute inset-x-8 -top-[1px] h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 via-indigo-400 to-transparent opacity-80 pointer-events-none" />

      <div className="flex items-center justify-around gap-1.5 relative">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 flex flex-col items-center justify-center py-1.5 px-3 rounded-[14px] transition-all duration-300 active:scale-90 ${
                isActive
                  ? `${tab.theme.activeBg} border ${tab.theme.activeBorder} ${tab.theme.activeGlow}`
                  : 'bg-transparent border border-transparent hover:bg-white/[0.04] text-slate-400'
              }`}
            >
              <div className="relative flex items-center justify-center mb-0.5">
                <Icon
                  className={`w-4 h-4 sm:w-[18px] sm:h-[18px] transition-all duration-300 ${
                    isActive
                      ? `${tab.theme.iconColor} scale-110 drop-shadow-[0_0_8px_currentColor] stroke-[2.4]`
                      : 'text-slate-400 stroke-[1.8]'
                  }`}
                />
              </div>

              <span
                className={`text-[11.5px] sm:text-[12px] font-medium tracking-tight transition-all duration-300 ${
                  isActive
                    ? tab.theme.textGradient
                    : 'text-slate-400 font-semibold'
                }`}
              >
                {tab.label}
              </span>

              {/* Glowing active indicator dot */}
              {isActive && (
                <div
                  className={`w-1 h-1 rounded-full mt-0.5 ${tab.theme.dotColor} animate-pulse`}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
