'use client';

import React, { useState, useMemo } from 'react';
import { getDailyShayari, getRandomShayari } from '@/lib/shayaris';
import { useAppStore } from '@/lib/store';
import { Quote, Shuffle, Sparkles } from 'lucide-react';

export function ShayariWidget() {
  const { shayaris } = useAppStore();
  const [selectedShayariId, setSelectedShayariId] = useState<number | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);

  // Derive active shayari directly during render without effect cascading
  const displayShayari = useMemo(() => {
    if (!shayaris || shayaris.length === 0) {
      return {
        id: 1,
        lines: ['Consistency creates mastery.'],
        translation: 'Small daily steps compound into life-changing triumphs.',
      };
    }
    if (selectedShayariId !== null) {
      const found = shayaris.find((s) => s.id === selectedShayariId);
      if (found) return found;
    }
    return getDailyShayari(new Date(), shayaris);
  }, [shayaris, selectedShayariId]);

  const handleNext = () => {
    setIsFlipping(true);
    setTimeout(() => {
      const next = getRandomShayari(displayShayari.id, shayaris);
      setSelectedShayariId(next.id);
      setIsFlipping(false);
    }, 200);
  };

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-amber-500/30 bg-gradient-to-br from-white/[0.08] via-amber-950/20 to-[#0A0D15]/90 p-4 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_1px_1.5px_rgba(245,158,11,0.25)] space-y-3">
      
      {/* Subtle top amber sheen line */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent pointer-events-none" />

      {/* Ambient warm amber bloom */}
      <div className="absolute -top-10 -right-10 w-48 h-48 bg-gradient-to-br from-amber-500/15 via-rose-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      
      {/* Watermark Quote Mark */}
      <div className="absolute -bottom-8 -right-2 text-amber-500/[0.05] pointer-events-none select-none font-serif text-9xl leading-none">
        ”
      </div>

      {/* Card Header */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/35 text-amber-300 text-[10.5px] font-black uppercase tracking-wider backdrop-blur-xl shadow-[0_0_12px_rgba(245,158,11,0.25)]">
          <Quote className="w-3.5 h-3.5 text-amber-400" />
          <span>Daily Wisdom & Lessons</span>
        </span>

        <span className="text-[10px] font-bold text-amber-400/70 uppercase tracking-widest flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-amber-400/80" />
          <span>Mindset</span>
        </span>
      </div>

      {/* Shayari Lines with Smooth Flip Transition */}
      <div className={`transition-all duration-200 ease-out space-y-3.5 ${isFlipping ? 'opacity-0 scale-[0.98] translate-y-1' : 'opacity-100 scale-100 translate-y-0'}`}>
        <div className="space-y-1 my-0.5 pl-1 border-l-2 border-amber-400/40">
          {displayShayari.lines.map((line, idx) => (
            <p key={idx} className="text-base sm:text-lg font-serif font-bold text-amber-100/95 leading-relaxed tracking-wide drop-shadow-sm pl-2">
              {line}
            </p>
          ))}
        </div>

        {/* English Meaning Box (Translucent Liquid Amber Glass) */}
        <div className="p-3.5 rounded-2xl bg-amber-500/[0.07] border border-amber-400/[0.2] backdrop-blur-xl text-xs text-slate-300 leading-relaxed shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] space-y-0.5">
          <span className="text-amber-400 font-black mr-1.5 tracking-tight uppercase text-[10px]">Essence:</span>
          <span className="text-slate-200 font-medium">{displayShayari.translation}</span>
        </div>
      </div>

      {/* Modern Industry-Standard Action Button */}
      <div className="flex items-center justify-end pt-1">
        <button
          onClick={handleNext}
          className="group flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/20 hover:from-amber-500/30 hover:to-orange-500/25 active:scale-95 border border-amber-300/40 hover:border-amber-300/60 shadow-[0_0_15px_rgba(245,158,11,0.2),inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-xl transition-all duration-200 cursor-pointer"
        >
          <Shuffle className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-180 transition-transform duration-500 ease-out stroke-[2.2]" />
          <span className="text-[11.5px] font-bold text-amber-200 group-hover:text-white tracking-tight transition-colors">
            Next Wisdom
          </span>
        </button>
      </div>

    </div>
  );
}
