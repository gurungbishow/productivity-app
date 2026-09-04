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
      glowStyle: {
        '--glow-color': 'rgba(99, 102, 241, 0.45)',
        '--border-color-low': 'rgba(129, 140, 248, 0.5)',
        '--border-color-high': 'rgba(165, 180, 252, 0.85)',
      } as React.CSSProperties,
      theme: {
        activeBg: 'bg-gradient-to-b from-indigo-500/20 via-purple-500/10 to-indigo-950/35',
        ambientAura: 'bg-indigo-500/20',
        topSheen: 'via-indigo-300/70',
        activeText: 'text-indigo-200 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]',
        activeIcon: 'text-indigo-300 drop-shadow-[0_0_6px_rgba(99,102,241,0.8)]',
        dotBg: 'bg-indigo-400',
        dotGlow: 'shadow-[0_0_6px_rgba(99,102,241,0.9)]',
      },
    },
    {
      id: 'schedule',
      label: 'Schedule',
      icon: CalendarDays,
      glowStyle: {
        '--glow-color': 'rgba(16, 185, 129, 0.45)',
        '--border-color-low': 'rgba(52, 211, 153, 0.5)',
        '--border-color-high': 'rgba(110, 231, 183, 0.85)',
      } as React.CSSProperties,
      theme: {
        activeBg: 'bg-gradient-to-b from-emerald-500/20 via-teal-500/10 to-emerald-950/35',
        ambientAura: 'bg-emerald-500/20',
        topSheen: 'via-emerald-300/70',
        activeText: 'text-emerald-200 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]',
        activeIcon: 'text-emerald-300 drop-shadow-[0_0_6px_rgba(16,185,129,0.8)]',
        dotBg: 'bg-emerald-400',
        dotGlow: 'shadow-[0_0_6px_rgba(16,185,129,0.9)]',
      },
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: SlidersHorizontal,
      glowStyle: {
        '--glow-color': 'rgba(6, 182, 212, 0.45)',
        '--border-color-low': 'rgba(34, 211, 238, 0.5)',
        '--border-color-high': 'rgba(125, 211, 252, 0.85)',
      } as React.CSSProperties,
      theme: {
        activeBg: 'bg-gradient-to-b from-cyan-500/20 via-blue-500/10 to-cyan-950/35',
        ambientAura: 'bg-cyan-500/20',
        topSheen: 'via-cyan-300/70',
        activeText: 'text-cyan-200 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]',
        activeIcon: 'text-cyan-300 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]',
        dotBg: 'bg-cyan-400',
        dotGlow: 'shadow-[0_0_6px_rgba(6,182,212,0.9)]',
      },
    },
  ] as const;

  return (
    <nav className="fixed bottom-3 sm:bottom-4 left-3 right-3 max-w-[430px] mx-auto z-50 rounded-[20px] bg-[#080D1A]/95 backdrop-blur-3xl border border-white/[0.12] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_20px_rgba(99,102,241,0.12),inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all">
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
              className="relative flex-1 flex flex-col items-center justify-center py-2 px-2 rounded-[14px] min-h-[52px] box-border active:scale-95 transition-transform duration-150 cursor-pointer select-none"
            >
              {/* Permanent Active Pill Overlay with Smooth Cross-Fade */}
              <div
                style={tab.glowStyle}
                className={`absolute inset-0 rounded-[14px] border ${tab.theme.activeBg} animate-glow-pulse pointer-events-none transition-all duration-250 ease-out ${
                  isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}
              >
                <div className={`absolute inset-0 rounded-[13px] ${tab.theme.ambientAura} blur-sm -z-10 animate-aura-breath`} />
                <div className={`absolute inset-x-2.5 top-0 h-[1px] bg-gradient-to-r from-transparent ${tab.theme.topSheen} to-transparent`} />
              </div>

              {/* Inactive Hover Sheen */}
              {!isActive && (
                <div className="absolute inset-0 rounded-[14px] bg-white/[0.02] hover:bg-white/[0.05] pointer-events-none transition-colors duration-200" />
              )}

              <div className="relative z-10 flex flex-col items-center justify-center">
                <div className="relative flex items-center justify-center mb-0.5">
                  <Icon
                    className={`w-4 h-4 sm:w-[18px] sm:h-[18px] transition-all duration-250 ease-out ${
                      isActive
                        ? `${tab.theme.activeIcon} stroke-[2.2] scale-105`
                        : 'text-slate-400 stroke-[1.8] scale-100'
                    }`}
                  />
                </div>

                <span
                  className={`text-[11.5px] sm:text-[12px] font-bold tracking-tight transition-colors duration-250 leading-tight ${
                    isActive
                      ? tab.theme.activeText
                      : 'text-slate-400'
                  }`}
                >
                  {tab.label}
                </span>

                {/* Glowing active indicator dot - permanently rendered with persistent colors */}
                <div
                  className={`w-1 h-1 rounded-full mt-0.5 ${tab.theme.dotBg} ${tab.theme.dotGlow} transition-all duration-250 ease-out ${
                    isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
