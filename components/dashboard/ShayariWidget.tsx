'use client';

import React, { useState } from 'react';
import { getDailyShayari, getRandomShayari } from '@/lib/shayaris';
import { Shayari } from '@/lib/types';
import { Quote, Shuffle, Sparkles } from 'lucide-react';

export function ShayariWidget() {
  const [currentShayari, setCurrentShayari] = useState<Shayari>(() => getDailyShayari(new Date()));
  const [isFlipping, setIsFlipping] = useState(false);

  const handleNext = () => {
    setIsFlipping(true);
    setTimeout(() => {
      const next = getRandomShayari(currentShayari.id);
      setCurrentShayari(next);
      setIsFlipping(false);
    }, 200);
  };

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-amber-500/25 bg-gradient-to-br from-amber-950/25 via-[#101422]/90 to-[#0A0D15]/95 p-4 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(245,158,11,0.2)] space-y-3">
      
      {/* Subtle top amber sheen line */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent pointer-events-none" />

      {/* Ambient warm amber bloom */}
      <div className="absolute -top-10 -right-10 w-48 h-48 bg-gradient-to-br from-amber-500/15 via-rose-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      
      {/* Watermark Quote Mark */}
      <div className="absolute -bottom-8 -right-2 text-amber-500/[0.05] pointer-events-none select-none font-serif text-9xl leading-none">
        ”
      </div>

      {/* Card Header */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-[10.5px] font-black uppercase tracking-wider shadow-[0_0_12px_rgba(245,158,11,0.2)]">
          <Quote className="w-3.5 h-3.5 text-amber-400" />
          <span>Daily Wisdom & Lessons</span>
        </span>

        <span className="text-[10px] font-bold text-amber-400/60 uppercase tracking-widest flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-amber-400/70" />
          <span>Mindset</span>
        </span>
      </div>

      {/* Shayari Lines with Smooth Flip Transition */}
      <div className={`transition-all duration-200 ease-out space-y-3.5 ${isFlipping ? 'opacity-0 scale-[0.98] translate-y-1' : 'opacity-100 scale-100 translate-y-0'}`}>
        <div className="space-y-1 my-0.5 pl-1 border-l-2 border-amber-400/40">
          {currentShayari.lines.map((line, idx) => (
            <p key={idx} className="text-base sm:text-lg font-serif font-bold text-amber-100/95 leading-relaxed tracking-wide drop-shadow-sm pl-2">
              {line}
            </p>
          ))}
        </div>

        {/* English Meaning Box */}
        <div className="p-3.5 rounded-2xl bg-[#080B15]/85 border border-white/[0.08] backdrop-blur-md text-xs text-slate-300 leading-relaxed shadow-inner space-y-0.5">
          <span className="text-amber-400 font-black mr-1.5 tracking-tight uppercase text-[10px]">Essence:</span>
          <span className="text-slate-200 font-medium">{currentShayari.translation}</span>
        </div>
      </div>

      {/* Tap for Next Button with Signature Gradient Border */}
      <div className="flex items-center justify-end pt-1">
        <div className="p-[1.5px] rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 shadow-[0_0_14px_rgba(245,158,11,0.25)]">
          <button
            onClick={handleNext}
            className="px-3.5 py-1.5 rounded-[10px] bg-[#0E1424] hover:bg-[#141C30] text-amber-300 active:scale-90 font-black text-[11px] flex items-center gap-1.5 transition-all duration-200"
          >
            <Shuffle className="w-3 h-3 text-amber-400 stroke-[2.5]" />
            <span className="bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-transparent">Next Wisdom</span>
          </button>
        </div>
      </div>

    </div>
  );
}
