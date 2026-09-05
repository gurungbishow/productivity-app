'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '@/lib/store';
import { isSlotActive, getSlotDurationMinutes, sortScheduleAscending } from '@/lib/scheduleEngine';
import { ScheduleItem } from '@/lib/types';
import { triggerConfetti, formatDuration } from '@/lib/utils';
import { getCategoryConfig } from '@/lib/categories';

import { 
  Clock, 
  Plus, 
  Trash2, 
  Edit2, 
  Calendar,
  CheckCheck,
  MoreVertical,
  X,
  ChevronDown,
  Check,
  Save,
  Folder,
  PauseCircle,
  Play,
  AlertTriangle
} from 'lucide-react';

function parseTimeString(timeStr: string): { hour: number; minute: string; period: 'AM' | 'PM' } {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return { hour: 9, minute: '00', period: 'AM' };
  let hour = parseInt(match[1], 10);
  if (hour === 0) hour = 12;
  const minute = match[2];
  const period = (match[3] || 'AM').toUpperCase() as 'AM' | 'PM';
  return { hour, minute, period };
}

function buildTimeString(hour: number, minute: string, period: 'AM' | 'PM'): string {
  const paddedHour = String(hour).padStart(2, '0');
  return `${paddedHour}:${minute} ${period}`;
}

export function TimelineList() {
  const {
    schedule,
    completedTaskIds,
    toggleTaskCompleted,
    addScheduleItem,
    updateScheduleItem,
    toggleScheduleItemActive,
    resumeAllScheduleItems,
    deleteScheduleItem,
    userDefaultSchedule,
    saveAsUserDefault,
    loadUserDefault,
  } = useAppStore();

  const sortedSchedule = React.useMemo(() => {
    return sortScheduleAscending(schedule);
  }, [schedule]);

  const activeSchedule = React.useMemo(() => {
    return sortedSchedule.filter((item) => item.isActive !== false);
  }, [sortedSchedule]);

  const inactiveSchedule = React.useMemo(() => {
    return sortedSchedule.filter((item) => item.isActive === false);
  }, [sortedSchedule]);

  const [isPausedSectionOpen, setIsPausedSectionOpen] = useState(false);

  const [currentMinutes, setCurrentMinutes] = useState(
    () => new Date().getHours() * 60 + new Date().getMinutes()
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ScheduleItem | null>(null);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const [formTitle, setFormTitle] = useState('');
  const [formStartTime, setFormStartTime] = useState('09:00 AM');
  const [formEndTime, setFormEndTime] = useState('10:00 AM');
  const [formCategory, setFormCategory] = useState<ScheduleItem['category']>('deep_work');
  const [formDesc, setFormDesc] = useState('');
  const [activeTimePicker, setActiveTimePicker] = useState<'start' | 'end' | null>(null);

  const currentPickerTime = activeTimePicker === 'start' ? formStartTime : formEndTime;
  const { hour: currentHour, minute: currentMinute, period: currentPeriod } = parseTimeString(currentPickerTime);

  const handleHourSelect = (h: number) => {
    const updated = buildTimeString(h, currentMinute, currentPeriod);
    if (activeTimePicker === 'start') {
      setFormStartTime(updated);
    } else {
      setFormEndTime(updated);
    }
  };

  const handleMinuteSelect = (m: string) => {
    const updated = buildTimeString(currentHour, m, currentPeriod);
    if (activeTimePicker === 'start') {
      setFormStartTime(updated);
    } else {
      setFormEndTime(updated);
    }
  };

  const handlePeriodSelect = (p: 'AM' | 'PM') => {
    const updated = buildTimeString(currentHour, currentMinute, p);
    if (activeTimePicker === 'start') {
      setFormStartTime(updated);
    } else {
      setFormEndTime(updated);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Automatically dismiss three-dot menu when tapping or clicking anywhere outside
  useEffect(() => {
    if (!openMenuId) return;
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest('[data-routine-menu]')) {
        setOpenMenuId(null);
      }
    };
    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [openMenuId]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormStartTime('08:00 AM');
    setFormEndTime('09:00 AM');
    setFormCategory('deep_work');
    setFormDesc('');
    setActiveTimePicker(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (item: ScheduleItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormStartTime(item.startTime);
    setFormEndTime(item.endTime);
    setFormCategory(item.category || 'deep_work');
    setFormDesc(item.description || '');
    setActiveTimePicker(null);
    setShowAddModal(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (editingItem) {
      updateScheduleItem(editingItem.id, {
        title: formTitle,
        startTime: formStartTime,
        endTime: formEndTime,
        category: formCategory,
        description: formDesc,
      });
    } else {
      addScheduleItem({
        title: formTitle,
        startTime: formStartTime,
        endTime: formEndTime,
        category: formCategory,
        description: formDesc,
      });
    }

    setShowAddModal(false);
  };

  const handleCheckTask = (id: string) => {
    const isNowDone = toggleTaskCompleted(id);
    if (isNowDone) {
      triggerConfetti();
    }
  };

  const activeCompletedTaskIds = React.useMemo(() => {
    const activeIds = new Set(activeSchedule.map((i) => i.id));
    return completedTaskIds.filter((id) => activeIds.has(id));
  }, [activeSchedule, completedTaskIds]);

  const completionPercentage = activeSchedule.length > 0 
    ? Math.round((activeCompletedTaskIds.length / activeSchedule.length) * 100) 
    : 0;

  return (
    <div className="space-y-4">
      
      {/* Mobile Top Header & Controls */}
      <div className="rounded-3xl p-4 bg-gradient-to-r from-[#10172B]/95 via-[#0C1220]/95 to-[#131127]/95 backdrop-blur-2xl border border-white/[0.1] shadow-[0_15px_35px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)] space-y-3">
        {/* Header & Stats Container */}
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-500/25 to-purple-500/35 border border-indigo-400/30 flex items-center justify-center shadow-[0_0_14px_rgba(99,102,241,0.3)] shrink-0">
              <Calendar className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-indigo-300" />
            </div>
            
            <div className="flex flex-col justify-center min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white truncate">
                Daily Routine
              </h2>
              <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 flex items-center gap-1 sm:gap-1.5 -mt-0.5 truncate">
                <span className="text-indigo-300 font-extrabold">{activeCompletedTaskIds.length}</span>
                <span>of</span>
                <span className="text-slate-300 font-extrabold">{activeSchedule.length}</span>
                <span className="hidden sm:inline">completed</span>
                <span className="text-white/20 hidden sm:inline">·</span>
                <span className="text-emerald-400 font-mono font-bold">{completionPercentage}%</span>
                {inactiveSchedule.length > 0 && (
                  <>
                    <span className="text-white/20">·</span>
                    <span className="text-amber-400 font-bold">{inactiveSchedule.length} paused</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Save as Default Button (only show if schedule has items) */}
            {schedule.length > 0 && (
              <div className="p-[1.5px] rounded-xl bg-gradient-to-r from-amber-500/40 via-orange-500/40 to-rose-500/40 shadow-sm">
                <button
                  onClick={() => {
                    saveAsUserDefault();
                  }}
                  className="flex items-center gap-1 sm:gap-1.5 py-1 sm:py-1.5 px-2.5 sm:px-3.5 rounded-[10px] bg-[#0E1424] hover:bg-[#141C30] active:scale-95 text-white text-[11px] sm:text-[13px] font-bold transition-all"
                  title="Save current schedule as your default"
                >
                  <Save className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300 stroke-[2.2]" />
                  <span className="bg-gradient-to-r from-amber-100 to-orange-100 bg-clip-text text-transparent font-black whitespace-nowrap">Set Default</span>
                </button>
              </div>
            )}

            {/* Add Slot Button with Colorful Gradient Border */}
            <div className="p-[1.5px] rounded-xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-500 shadow-[0_0_16px_rgba(99,102,241,0.35)] shrink-0">
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-1 sm:gap-1.5 py-1 sm:py-1.5 px-2.5 sm:px-3.5 rounded-[10px] bg-[#0C1220] hover:bg-[#121B30] active:scale-95 text-white text-[11px] sm:text-[13px] font-black transition-all"
              >
                <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-300 stroke-[2.8]" />
                <span className="bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent font-black whitespace-nowrap">Add Slot</span>
              </button>
            </div>
          </div>
        </div>

        {/* Overall Routine Completion Progress Track */}
        <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden p-[0.5px] border border-white/[0.06]">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Global dismiss backdrop for three-dot menu */}
      {openMenuId && (
        <div className="fixed inset-0 z-20" onClick={() => setOpenMenuId(null)} />
      )}

      {/* Empty State when no slots configured */}
      {schedule.length === 0 && (
        <div className="p-8 rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#12192B]/80 via-[#0D1322]/80 to-[#0A0E18]/90 backdrop-blur-2xl text-center space-y-3">
          <Calendar className="w-8 h-8 text-indigo-400 mx-auto" />
          <h3 className="text-sm font-bold text-white">No routine slots configured</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            You can add custom slots or load your saved default routine.
          </p>
          {userDefaultSchedule.length > 0 && (
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={loadUserDefault}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all border border-white/10"
              >
                <Folder className="w-3.5 h-3.5 text-amber-400" />
                Load Default
              </button>
            </div>
          )}
        </div>
      )}

      {/* Routine Cards List (Compact & Mobile-Optimized with Safe Bottom Padding) */}
      <div className="space-y-2.5 pb-20">
        {/* Banner when all routines are currently paused */}
        {schedule.length > 0 && activeSchedule.length === 0 && (
          <div className="p-6 rounded-3xl border border-amber-500/25 bg-gradient-to-br from-[#18151f]/90 via-[#120f1a]/90 to-[#0c0a12]/95 backdrop-blur-2xl text-center space-y-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 mx-auto">
              <PauseCircle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">All routine slots are paused</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              You have {inactiveSchedule.length} paused slot{inactiveSchedule.length > 1 ? 's' : ''}. You can resume them anytime below.
            </p>
            <div className="pt-1 flex justify-center">
              <button
                onClick={resumeAllScheduleItems}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/35 text-xs font-bold transition-all active:scale-95 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Resume All Slots</span>
              </button>
            </div>
          </div>
        )}

        {activeSchedule.map((item) => {
          const active = isSlotActive(item, currentMinutes);
          const isCompleted = completedTaskIds.includes(item.id);
          const duration = getSlotDurationMinutes(item);
          const isMenuOpen = openMenuId === item.id;
          const categoryMeta = getCategoryConfig(item.category);
          const CategoryIcon = categoryMeta.icon;

          return (
            <div
              key={item.id}
              className={`group relative rounded-2xl p-3 sm:p-3.5 transition-all duration-200 ${
                isMenuOpen ? 'z-30' : 'z-10'
              } ${
                active
                  ? 'bg-gradient-to-br from-[#0c1322]/98 via-[#080d18]/98 to-[#050810]/98 shadow-[0_8px_30px_rgba(0,0,0,0.6),0_0_25px_rgba(16,185,129,0.15)]'
                  : isCompleted
                  ? 'border border-emerald-500/20 bg-gradient-to-br from-[#090D15]/60 via-[#070A10]/70 to-[#05070C]/80 opacity-70 backdrop-blur-md'
                  : `border border-white/[0.08] bg-gradient-to-br from-[#121829]/90 via-[#0C111F]/92 to-[#080D18]/95 ${categoryMeta.accentBorder} shadow-[0_4px_20px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-white/20`
              }`}
            >
              {/* Single Crisp Rainbow Rotating Border Beam around Active Container */}
              {active && (
                <>
                  <div 
                    className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden z-0"
                    style={{
                      padding: '1.5px',
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

                  {/* Soft ambient chromatic aura blur behind active card */}
                  <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-rose-500/20 via-purple-500/20 via-cyan-500/20 to-emerald-500/20 blur-xl pointer-events-none -z-10 opacity-70" />
                </>
              )}

              {/* Isolated active ambient corner bloom */}
              {active && (
                <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none z-0">
                  <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-cyan-500/20 via-purple-500/15 to-pink-500/20 rounded-full blur-2xl" />
                </div>
              )}

              {/* Top-Aligned Row Layout */}
              <div className="relative z-10 flex items-start justify-between gap-2.5">
                
                {/* Left: Completion Button (Matches exact text height: w-4 h-4) */}
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <button
                    onClick={() => handleCheckTask(item.id)}
                    className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 shrink-0 ${
                      isCompleted
                        ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 border border-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.6)] text-white'
                        : active
                        ? 'border-[1.75px] border-emerald-400 bg-emerald-500/20 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                        : 'border-[1.75px] border-slate-500/60 hover:border-slate-300 bg-white/[0.03]'
                    }`}
                    aria-label={isCompleted ? "Mark task incomplete" : "Mark task complete"}
                  >
                    {isCompleted && (
                      <CheckCheck className="w-2.5 h-2.5 stroke-[3] animate-in zoom-in-95 duration-150" />
                    )}
                  </button>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className={`text-[13.5px] sm:text-sm font-black tracking-tight truncate leading-tight ${isCompleted ? 'text-slate-400 line-through' : 'text-white'}`}>
                        {item.title}
                      </h3>

                      {active && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[9px] font-black uppercase tracking-wider shadow-[0_0_8px_rgba(52,211,153,0.35)] leading-none">
                          <span>Now</span>
                        </span>
                      )}

                      {/* Subtle category badge with icon */}
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md border text-[9.5px] font-bold leading-none ${
                        active
                          ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300'
                          : categoryMeta.badge
                      }`}>
                        <CategoryIcon className="w-2.5 h-2.5 stroke-[2.2]" />
                        <span>{categoryMeta.label}</span>
                      </span>
                    </div>

                    {/* Time & Duration badges */}
                    <div className="flex items-center gap-1.5 flex-wrap text-xs">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-mono font-bold text-[11px] shadow-sm leading-none ${
                        active
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                          : categoryMeta.timePill
                      }`}>
                        <Clock className={`w-3 h-3 ${active ? 'text-emerald-300 stroke-[2.2]' : categoryMeta.clockColor}`} />
                        <span>{item.startTime} – {item.endTime}</span>
                      </span>

                      <span className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-slate-300 text-[10px] font-mono font-bold leading-none">
                        {formatDuration(duration)}
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-[11px] text-slate-400/90 line-clamp-1 leading-snug">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Vertical Three-Dot Action Menu (Matches exact text height: w-4 h-4) */}
                <div data-routine-menu className="relative shrink-0 self-start mt-0.5">
                  <button
                    onClick={() => setOpenMenuId(isMenuOpen ? null : item.id)}
                    className={`w-4 h-4 sm:w-4.5 sm:h-4.5 flex items-center justify-center transition-all active:scale-90 ${
                      isMenuOpen
                        ? 'text-indigo-300 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]'
                        : 'text-slate-400 hover:text-white active:text-indigo-300'
                    }`}
                    title="Task options"
                    aria-label="Task options"
                  >
                    <MoreVertical className="w-4 h-4 stroke-[2.2]" />
                  </button>

                  {/* Dropdown Action Popover */}
                  {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-1.5 z-30 min-w-[130px] rounded-2xl bg-[#0B101E]/90 backdrop-blur-2xl border border-white/[0.18] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.2)] space-y-1 animate-in fade-in zoom-in-95 duration-150">
                      {/* Edit Option */}
                      <button
                        onClick={() => {
                          setOpenMenuId(null);
                          handleOpenEdit(item);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-indigo-500/20 active:scale-95 transition-all text-left group"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                        <span>Edit</span>
                      </button>

                      {/* Pause Routine Option */}
                      <button
                        onClick={() => {
                          setOpenMenuId(null);
                          toggleScheduleItemActive(item.id);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-300 hover:text-amber-200 hover:bg-amber-500/20 active:scale-95 transition-all text-left group"
                      >
                        <PauseCircle className="w-3.5 h-3.5 text-amber-400 group-hover:text-amber-300 transition-colors" />
                        <span>Pause Slot</span>
                      </button>

                      {/* Subtle Glassmorphic Separator */}
                      <div className="h-[1px] mx-1 bg-white/[0.08]" />

                      {/* Delete Option */}
                      <button
                        onClick={() => {
                          setOpenMenuId(null);
                          setItemToDelete(item);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-300 hover:text-rose-200 hover:bg-rose-500/20 active:scale-95 transition-all text-left group"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400 group-hover:text-rose-300 transition-colors" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          );
        })}

        {/* Collapsible Paused Routines Tray */}
        {inactiveSchedule.length > 0 && (
          <div className="mt-4 rounded-2xl border border-dashed border-amber-500/30 bg-gradient-to-br from-[#121624]/90 via-[#0E121E]/90 to-[#0A0D15]/95 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] overflow-hidden transition-all">
            {/* Tray Header (Accordion Toggle) */}
            <div
              onClick={() => setIsPausedSectionOpen((prev) => !prev)}
              className="w-full flex items-center justify-between p-3 sm:p-3.5 cursor-pointer select-none hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <PauseCircle className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs sm:text-[13px] font-black text-slate-200 tracking-tight">
                    Paused Routines
                  </span>
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] font-mono font-bold">
                    {inactiveSchedule.length}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    resumeAllScheduleItems();
                  }}
                  className="flex items-center gap-1 py-1 px-2.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 text-[10.5px] font-bold active:scale-95 transition-all"
                  title="Resume all paused routines"
                >
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span>Resume All</span>
                </button>

                <div className={`text-slate-400 p-0.5 transition-transform duration-200 ${isPausedSectionOpen ? 'rotate-180 text-amber-300' : ''}`}>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Expanded Paused Items List */}
            {isPausedSectionOpen && (
              <div className="px-3 pb-3 sm:px-3.5 sm:pb-3.5 space-y-2 border-t border-white/[0.06] pt-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                {inactiveSchedule.map((item) => {
                  const duration = getSlotDurationMinutes(item);
                  const isMenuOpen = openMenuId === item.id;
                  const categoryMeta = getCategoryConfig(item.category);
                  const CategoryIcon = categoryMeta.icon;

                  return (
                    <div
                      key={item.id}
                      className={`relative rounded-xl p-2.5 sm:p-3 border border-white/[0.08] bg-[#0A0D18]/80 backdrop-blur-md transition-all ${
                        isMenuOpen ? 'z-30' : 'z-10'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs sm:text-[13px] font-bold text-slate-300 truncate">
                              {item.title}
                            </h4>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md border border-white/[0.08] bg-white/[0.03] text-[9px] font-bold text-slate-400">
                              <CategoryIcon className="w-2.5 h-2.5 stroke-[2]" />
                              <span>{categoryMeta.label}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap text-xs">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.06] text-slate-400 font-mono font-semibold text-[10px]">
                              <Clock className="w-2.5 h-2.5 text-slate-400" />
                              <span>{item.startTime} – {item.endTime}</span>
                            </span>
                            <span className="text-[9.5px] font-mono text-slate-500">
                              ({formatDuration(duration)})
                            </span>
                          </div>
                        </div>

                        {/* Right: 1-Tap Quick Resume Button + 3-Dot Menu */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => toggleScheduleItemActive(item.id)}
                            className="flex items-center gap-1 py-1.5 px-2.5 sm:px-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-400/40 text-emerald-300 text-[11px] font-black active:scale-95 transition-all shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                            title="Resume this routine"
                          >
                            <Play className="w-2.5 h-2.5 fill-current" />
                            <span>Resume</span>
                          </button>

                          <div data-routine-menu className="relative">
                            <button
                              onClick={() => setOpenMenuId(isMenuOpen ? null : item.id)}
                              className={`w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/[0.06] transition-all ${
                                isMenuOpen ? 'text-indigo-300' : 'text-slate-400 hover:text-white'
                              }`}
                              title="Options"
                              aria-label="Options"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {isMenuOpen && (
                              <div className="absolute right-0 top-full mt-1 z-30 min-w-[130px] rounded-2xl bg-[#0B101E]/90 backdrop-blur-2xl border border-white/[0.18] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.2)] space-y-1 animate-in fade-in zoom-in-95 duration-150">
                                <button
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handleOpenEdit(item);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-indigo-500/20 active:scale-95 transition-all text-left"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                                  <span>Edit</span>
                                </button>
                                <div className="h-[1px] mx-1 bg-white/[0.08]" />
                                <button
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    setItemToDelete(item);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-300 hover:text-rose-200 hover:bg-rose-500/20 active:scale-95 transition-all text-left"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Modal (Portaled to document.body) */}
      {mounted && showAddModal && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200"
        >
          <div className="relative overflow-hidden w-full max-w-sm rounded-[28px] border border-white/[0.14] bg-gradient-to-b from-[#141C32]/95 via-[#0E1526]/95 to-[#080B14]/98 backdrop-blur-3xl p-5 sm:p-6 shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_35px_rgba(99,102,241,0.2),inset_0_1px_1px_rgba(255,255,255,0.2)] space-y-4 animate-in zoom-in-95 duration-200">
            
            {/* Top Aurora Sheen Line */}
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 via-indigo-500 to-transparent opacity-85 pointer-events-none" />

            {/* Subtle Ambient Corner Glow */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500/25 to-purple-500/35 border border-indigo-400/30 flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.35)] shrink-0">
                  <Calendar className="w-4 h-4 text-indigo-300" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white tracking-tight leading-tight">
                    {editingItem ? 'Edit Routine Slot' : 'Add Routine Slot'}
                  </h3>
                  <p className="text-[10.5px] text-slate-400 font-medium">Design your daily 24h schedule</p>
                </div>
              </div>

              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-xl bg-white/[0.04] border border-white/[0.1] text-slate-400 hover:text-white hover:bg-white/[0.1] flex items-center justify-center active:scale-90 transition-all"
                title="Close"
                aria-label="Close modal"
              >
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3.5">
              {/* Task Title */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI / ML, College, Reading"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded-xl bg-white/[0.05] border border-white/[0.14] focus:bg-white/[0.08] focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25 px-3.5 py-2.5 text-xs font-bold text-white placeholder:text-slate-500 shadow-inner backdrop-blur-xl transition-all outline-none"
                />
              </div>

              {/* Category Selection Grid */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-300">
                  Category
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['deep_work', 'health_fitness', 'growth_creative', 'mindfulness'] as const).map((cat) => {
                    const meta = getCategoryConfig(cat);
                    const CatIcon = meta.icon;
                    const isSelected = formCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormCategory(cat)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
                          isSelected
                            ? `${meta.badge} border-white/40 shadow-sm font-black`
                            : 'bg-white/[0.03] border-white/[0.07] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <CatIcon className="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
                        <span className="truncate">{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modern Glassmorphic Time Selector */}
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Start Time Trigger */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Start Time
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveTimePicker(activeTimePicker === 'start' ? null : 'start')}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all active:scale-95 ${
                        activeTimePicker === 'start'
                          ? 'bg-cyan-500/15 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                          : 'bg-white/[0.05] border-white/[0.14] hover:bg-white/[0.08] hover:border-cyan-400/50 text-white backdrop-blur-xl'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0 stroke-[2.2]" />
                        <span className="text-xs font-mono font-bold truncate">
                          {formStartTime}
                        </span>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${activeTimePicker === 'start' ? 'rotate-180 text-cyan-300' : ''}`} />
                    </button>
                  </div>

                  {/* End Time Trigger */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      End Time
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveTimePicker(activeTimePicker === 'end' ? null : 'end')}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all active:scale-95 ${
                        activeTimePicker === 'end'
                          ? 'bg-indigo-500/15 border-indigo-400 text-indigo-200 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                          : 'bg-white/[0.05] border-white/[0.14] hover:bg-white/[0.08] hover:border-indigo-400/50 text-white backdrop-blur-xl'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0 stroke-[2.2]" />
                        <span className="text-xs font-mono font-bold truncate">
                          {formEndTime}
                        </span>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${activeTimePicker === 'end' ? 'rotate-180 text-indigo-300' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Custom Modern Glassmorphic Time Picker Panel */}
                {activeTimePicker && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-b from-[#111728]/98 to-[#0B0F1D]/98 border border-cyan-400/30 shadow-[0_15px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(6,182,212,0.15)] space-y-3 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                      <div className="flex items-center gap-2">
                        <Clock className={`w-4 h-4 stroke-[2.2] ${activeTimePicker === 'start' ? 'text-cyan-400' : 'text-indigo-400'}`} />
                        <span className="text-xs font-black text-slate-200">
                          {activeTimePicker === 'start' ? 'Start Time' : 'End Time'}
                        </span>
                      </div>
                      
                      {/* AM / PM Segmented Pills */}
                      <div className="flex p-0.5 rounded-xl bg-white/[0.06] border border-white/[0.08]">
                        <button
                          type="button"
                          onClick={() => handlePeriodSelect('AM')}
                          className={`px-3 py-0.5 rounded-lg text-xs font-black transition-all ${
                            currentPeriod === 'AM'
                              ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          AM
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePeriodSelect('PM')}
                          className={`px-3 py-0.5 rounded-lg text-xs font-black transition-all ${
                            currentPeriod === 'PM'
                              ? 'bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.5)]'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          PM
                        </button>
                      </div>
                    </div>

                    {/* Hours Selector (1 to 12) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                        <span className="uppercase tracking-wider">Select Hour</span>
                        <span className="font-mono text-cyan-300 font-black">{currentHour} {currentPeriod}</span>
                      </div>
                      <div className="grid grid-cols-6 gap-1.5">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => handleHourSelect(h)}
                            className={`h-8 rounded-xl text-xs font-mono font-bold transition-all active:scale-90 ${
                              currentHour === h
                                ? 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.6)] border border-indigo-300/60 font-black'
                                : 'bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.1] text-slate-300'
                            }`}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Minutes Selector */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                        <span className="uppercase tracking-wider">Select Minute</span>
                        <span className="font-mono text-cyan-300 font-black">:{currentMinute}</span>
                      </div>
                      <div className="grid grid-cols-6 gap-1.5">
                        {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => handleMinuteSelect(m)}
                            className={`h-8 rounded-xl text-xs font-mono font-bold transition-all active:scale-90 ${
                              currentMinute === m
                                ? 'bg-gradient-to-tr from-cyan-500 to-teal-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.6)] border border-cyan-300/60 font-black'
                                : 'bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.1] text-slate-300'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Done / Close Button */}
                    <button
                      type="button"
                      onClick={() => setActiveTimePicker(null)}
                      className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white text-xs font-black tracking-wide shadow-[0_0_15px_rgba(16,185,129,0.35)] active:scale-95 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Done ({currentPickerTime})</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Description <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Deep focus, drink water, review concepts..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full rounded-xl bg-white/[0.05] border border-white/[0.14] focus:bg-white/[0.08] focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25 px-3.5 py-2.5 text-xs font-medium text-white placeholder:text-slate-500 shadow-inner resize-none backdrop-blur-xl transition-all outline-none"
                />
              </div>

              {/* Action Buttons with Aligned Colorful Borders */}
              <div className="flex items-center justify-between gap-2.5 pt-2">
                {editingItem ? (
                  <button
                    type="button"
                    onClick={() => {
                      setItemToDelete(editingItem);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-rose-500/[0.12] hover:bg-rose-500/[0.22] backdrop-blur-xl text-rose-300 hover:text-rose-200 border border-rose-400/35 text-xs font-bold active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(244,63,94,0.18),inset_0_1px_1px_rgba(255,255,255,0.22)]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2.5">
                  {/* Cancel Button with Matching Border */}
                  <div className="p-[1.5px] rounded-xl bg-gradient-to-r from-slate-500/60 via-slate-400/50 to-slate-600/50 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 rounded-[10px] bg-white/[0.08] hover:bg-white/[0.16] text-slate-200 hover:text-white backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] text-xs font-bold active:scale-95 transition-all"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Save Slot Button with Glowing Colorful Gradient Border */}
                  <div className="p-[1.5px] rounded-xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-500 shadow-[0_0_18px_rgba(99,102,241,0.45)]">
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-[10px] bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 active:scale-95 text-white text-xs font-black tracking-wide shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      <CheckCheck className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                      <span>{editingItem ? 'Update Slot' : 'Save Slot'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Warning Modal (Portaled to document.body) */}
      {mounted && itemToDelete && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setItemToDelete(null);
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xl animate-in fade-in duration-150"
        >
          {/* Glassmorphic Modal Dialog Card with Liquid Frosted Glass Aesthetics */}
          <div className="relative overflow-hidden w-full max-w-sm rounded-[28px] border border-white/[0.22] border-t-white/[0.4] bg-gradient-to-br from-white/[0.14] via-[#0E1322]/70 to-[#060913]/80 backdrop-blur-3xl shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(244,63,94,0.25),inset_0_1.5px_1.5px_rgba(255,255,255,0.45),inset_0_-1px_1px_rgba(255,255,255,0.1)] p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150">
            
            {/* Prismatic Top Rim Light Sheen */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white/90 via-rose-300/80 to-transparent opacity-95 pointer-events-none" />

            {/* Left Edge Vertical Light Reflection */}
            <div className="absolute top-0 left-0 w-[1.5px] h-32 bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />

            {/* Diagonal Prismatic Glass Reflection Glare */}
            <div className="absolute -top-24 -left-20 w-48 h-96 bg-gradient-to-br from-white/[0.12] via-white/[0.04] to-transparent rotate-45 pointer-events-none blur-[1px]" />

            {/* Radiant Ambient Diffused Glow Orbs Behind Glass */}
            <div className="absolute -top-20 -right-16 w-52 h-52 bg-rose-500/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-16 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Modal Warning Header */}
            <div className="flex items-start gap-3 relative z-10">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-white/[0.18] to-rose-500/20 border border-white/[0.35] border-t-white/[0.5] backdrop-blur-2xl flex items-center justify-center shadow-[0_8px_20px_rgba(244,63,94,0.35),inset_0_1.5px_2px_rgba(255,255,255,0.6)] shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400 stroke-[2.2]" />
              </div>
              <div className="space-y-1 pr-6">
                <h3 className="text-base font-black text-white tracking-tight leading-tight">
                  Delete Routine Slot?
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Are you sure you want to permanently remove{' '}
                  <span className="font-bold text-white bg-white/[0.12] px-1.5 py-0.5 rounded-md border border-white/[0.2] shadow-inner backdrop-blur-sm">
                    {itemToDelete.title}
                  </span>{' '}
                  ({itemToDelete.startTime} - {itemToDelete.endTime})?
                </p>
              </div>

              <button
                onClick={() => setItemToDelete(null)}
                className="absolute top-0 right-0 w-7 h-7 rounded-xl bg-white/[0.08] hover:bg-white/[0.2] border border-white/[0.22] backdrop-blur-2xl text-slate-300 hover:text-white flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>

            {/* Glassmorphic Suggestion Notice: Suggest Pausing as a Safe Alternative */}
            {itemToDelete.isActive !== false && (
              <div className="p-3 rounded-2xl bg-amber-500/[0.12] backdrop-blur-2xl border border-amber-300/[0.35] border-t-amber-200/50 shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.25),0_4px_15px_rgba(245,158,11,0.15)] flex items-start gap-2.5 text-left relative z-10">
                <PauseCircle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-200/95 leading-snug">
                  <strong className="text-amber-300 font-bold">Need a break instead?</strong> You can pause this slot to hide it from today’s active timetable without losing your setup.
                </p>
              </div>
            )}

            {/* Warning Note */}
            <p className="text-[11px] text-rose-300/90 font-medium relative z-10">
              ⚠️ This action cannot be undone.
            </p>

            {/* Frosted Glass Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-1 relative z-10">
              {itemToDelete.isActive !== false && (
                <button
                  type="button"
                  onClick={() => {
                    toggleScheduleItemActive(itemToDelete.id);
                    setItemToDelete(null);
                    if (showAddModal) setShowAddModal(false);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/[0.16] hover:bg-amber-500/[0.26] text-amber-200 border border-amber-300/[0.4] backdrop-blur-2xl shadow-[0_0_18px_rgba(245,158,11,0.25),inset_0_1.5px_1px_rgba(255,255,255,0.3)] text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <PauseCircle className="w-3.5 h-3.5 text-amber-300" />
                  <span>Pause Slot Instead</span>
                </button>
              )}

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.18] text-slate-200 hover:text-white border border-white/[0.22] backdrop-blur-2xl shadow-[0_4px_15px_rgba(0,0,0,0.2),inset_0_1.5px_1px_rgba(255,255,255,0.35)] text-xs font-bold active:scale-95 transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => {
                    deleteScheduleItem(itemToDelete.id);
                    setItemToDelete(null);
                    if (showAddModal) setShowAddModal(false);
                  }}
                  className="flex-1 sm:flex-initial px-4.5 py-2 rounded-xl bg-gradient-to-r from-rose-500/90 via-rose-600/90 to-red-600/90 hover:from-rose-500 hover:to-red-500 text-white text-xs font-black shadow-[0_0_25px_rgba(244,63,94,0.55),inset_0_1.5px_2px_rgba(255,255,255,0.5)] border border-rose-300/70 backdrop-blur-2xl active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-white stroke-[2.2]" />
                  <span>Delete Slot</span>
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
