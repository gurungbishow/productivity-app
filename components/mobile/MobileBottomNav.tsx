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
        activeIcon: 'text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.65)]',
        activeText: 'text-white font-extrabold',
      },
    },
    {
      id: 'schedule',
      label: 'Schedule',
      icon: CalendarDays,
      theme: {
        activeIcon: 'text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.65)]',
        activeText: 'text-white font-extrabold',
      },
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: SlidersHorizontal,
      theme: {
        activeIcon: 'text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.65)]',
        activeText: 'text-white font-extrabold',
      },
    },
  ] as const;

  return (
    <nav className="fixed bottom-2.5 sm:bottom-3.5 left-4 right-4 max-w-[416px] mx-auto z-50 rounded-2xl bg-gradient-to-b from-white/[0.09] via-[#0C1222]/65 to-[#060913]/75 backdrop-blur-2xl border border-white/[0.18] px-3 py-2 shadow-[0_20px_45px_rgba(0,0,0,0.7),0_0_25px_rgba(99,102,241,0.08),inset_0_1px_1.5px_rgba(255,255,255,0.3),inset_0_-1px_1px_rgba(255,255,255,0.06)] transition-all">
      {/* Top specular glass reflection sheen */}
      <div className="absolute inset-x-6 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/50 via-cyan-300/30 to-transparent pointer-events-none" />

      <div className="flex items-center justify-around gap-1 relative">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="group relative flex-1 flex flex-col items-center justify-center py-1 px-2 rounded-xl min-h-[46px] box-border active:scale-90 transition-transform duration-150 cursor-pointer select-none"
            >
              {/* Clean Illuminated Icon (Zero Boxes / Zero Pills) */}
              <div className="flex items-center justify-center mb-1">
                <Icon
                  className={`w-5 h-5 transition-all duration-200 ease-out ${
                    isActive
                      ? `${tab.theme.activeIcon} stroke-[2.4] scale-110`
                      : 'text-slate-400/80 stroke-[1.8] scale-100 group-hover:text-slate-200 group-hover:scale-105'
                  }`}
                />
              </div>

              {/* Refined Minimalist Typography */}
              <span
                className={`text-[10.5px] tracking-tight transition-colors duration-200 leading-none ${
                  isActive
                    ? `${tab.theme.activeText} drop-shadow-[0_0_6px_rgba(255,255,255,0.2)]`
                    : 'text-slate-400/80 font-medium group-hover:text-slate-200'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
