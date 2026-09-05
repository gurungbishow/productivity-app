'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '@/lib/store';
import {
  Timer,
  User,
  Check,
  RotateCcw,
  Flame,
  Coffee,
  Moon,
  Target,
  Minus,
  Plus,
  X,
  LogOut,
  Bell,
  Volume2,
  VolumeX,
  Play,
  Zap,
  AlertTriangle,
  Edit2,
  Trash2,
  Layers,
  Quote,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabase';
import { playTimerEndSound } from '@/lib/utils';
import { PomodoroSoundType, CustomCategory, CategoryColor, Shayari } from '@/lib/types';
import {
  CATEGORY_ICONS,
  AVAILABLE_CATEGORY_ICONS,
  CATEGORY_COLOR_THEMES,
  getCategoryConfig,
} from '@/lib/categories';

export function SettingsView() {
  const {
    pomodoroSettings,
    updatePomodoroSettings,
    profile,
    updateProfile,
    schedule,
    clearSchedule,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    shayaris,
    addShayari,
    updateShayari,
    deleteShayari,
  } = useAppStore();

  const { user } = useAuth();

  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => { },
    () => true,
    () => false
  );

  // Category management state
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catModalMode, setCatModalMode] = useState<'add' | 'edit'>('add');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catFormLabel, setCatFormLabel] = useState('');
  const [catFormColor, setCatFormColor] = useState<CategoryColor>('indigo');
  const [catFormIcon, setCatFormIcon] = useState('Layers');
  const [catToDelete, setCatToDelete] = useState<CustomCategory | null>(null);

  // Shayari management state
  const [shayariModalOpen, setShayariModalOpen] = useState(false);
  const [shayariModalMode, setShayariModalMode] = useState<'add' | 'edit'>('add');
  const [editingShayariId, setEditingShayariId] = useState<number | null>(null);
  const [shayariFormLines, setShayariFormLines] = useState('');
  const [shayariFormTranslation, setShayariFormTranslation] = useState('');
  const [shayariToDelete, setShayariToDelete] = useState<Shayari | null>(null);

  const COLOR_OPTIONS: { id: CategoryColor; label: string; bg: string; border: string; glow: string }[] = [
    { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-500', border: 'border-indigo-400', glow: 'shadow-indigo-500/40' },
    { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-500', border: 'border-emerald-400', glow: 'shadow-emerald-500/40' },
    { id: 'amber', label: 'Amber', bg: 'bg-amber-500', border: 'border-amber-400', glow: 'shadow-amber-500/40' },
    { id: 'purple', label: 'Purple', bg: 'bg-purple-500', border: 'border-purple-400', glow: 'shadow-purple-500/40' },
    { id: 'rose', label: 'Rose', bg: 'bg-rose-500', border: 'border-rose-400', glow: 'shadow-rose-500/40' },
    { id: 'cyan', label: 'Cyan', bg: 'bg-cyan-500', border: 'border-cyan-400', glow: 'shadow-cyan-500/40' },
    { id: 'blue', label: 'Blue', bg: 'bg-blue-500', border: 'border-blue-400', glow: 'shadow-blue-500/40' },
    { id: 'orange', label: 'Orange', bg: 'bg-orange-500', border: 'border-orange-400', glow: 'shadow-orange-500/40' },
  ];

  const showNotification = (msg: string) => {
    setSavedMessage(msg);
    setTimeout(() => setSavedMessage(null), 2500);
  };

  const handleOpenAddCategory = () => {
    setCatModalMode('add');
    setEditingCatId(null);
    setCatFormLabel('');
    setCatFormColor('indigo');
    setCatFormIcon('Layers');
    setCatModalOpen(true);
  };

  const handleOpenEditCategory = (cat: CustomCategory) => {
    setCatModalMode('edit');
    setEditingCatId(cat.id);
    setCatFormLabel(cat.label);
    setCatFormColor(cat.color);
    setCatFormIcon(cat.icon);
    setCatModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = catFormLabel.trim();
    if (!trimmed) return;

    if (catModalMode === 'add') {
      addCategory({
        label: trimmed,
        color: catFormColor,
        icon: catFormIcon,
      });
      showNotification(`Added category "${trimmed}"`);
    } else if (editingCatId) {
      updateCategory(editingCatId, {
        label: trimmed,
        color: catFormColor,
        icon: catFormIcon,
      });
      showNotification(`Updated category "${trimmed}"`);
    }
    setCatModalOpen(false);
  };

  const handleConfirmDeleteCategory = () => {
    if (!catToDelete) return;
    if (categories.length <= 1) {
      showNotification('Cannot delete the last category');
      setCatToDelete(null);
      return;
    }
    deleteCategory(catToDelete.id);
    showNotification(`Deleted category "${catToDelete.label}"`);
    setCatToDelete(null);
  };

  const handleOpenAddShayari = () => {
    setShayariModalMode('add');
    setEditingShayariId(null);
    setShayariFormLines('');
    setShayariFormTranslation('');
    setShayariModalOpen(true);
  };

  const handleOpenEditShayari = (item: Shayari) => {
    setShayariModalMode('edit');
    setEditingShayariId(item.id);
    setShayariFormLines(item.lines.join('\n'));
    setShayariFormTranslation(item.translation || '');
    setShayariModalOpen(true);
  };

  const handleSaveShayari = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = shayariFormLines
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length === 0) return;

    if (shayariModalMode === 'add') {
      addShayari({
        lines,
        translation: shayariFormTranslation.trim(),
      });
      showNotification('Added new motivational quote');
    } else if (editingShayariId !== null) {
      updateShayari(editingShayariId, {
        lines,
        translation: shayariFormTranslation.trim(),
      });
      showNotification('Updated motivational quote');
    }
    setShayariModalOpen(false);
  };

  const handleConfirmDeleteShayari = () => {
    if (!shayariToDelete) return;
    if (shayaris.length <= 1) {
      showNotification('Cannot delete the last quote');
      setShayariToDelete(null);
      return;
    }
    deleteShayari(shayariToDelete.id);
    showNotification('Deleted motivational quote');
    setShayariToDelete(null);
  };

  const handlePomodoroChange = (key: 'workMinutes' | 'shortBreakMinutes' | 'longBreakMinutes', val: number) => {
    const clamped = Math.max(1, Math.min(180, val));
    updatePomodoroSettings({ [key]: clamped });
    showNotification('Timer preferences updated');
  };

  const handleToggle = (key: 'autoStartBreaks' | 'autoStartFocus' | 'soundEnabled') => {
    const newVal = !pomodoroSettings[key];
    updatePomodoroSettings({ [key]: newVal });
    showNotification(
      key === 'autoStartBreaks'
        ? `Auto-start breaks ${newVal ? 'enabled' : 'disabled'}`
        : key === 'autoStartFocus'
          ? `Auto-start focus ${newVal ? 'enabled' : 'disabled'}`
          : `Sound alerts ${newVal ? 'enabled' : 'muted'}`
    );
  };

  const handleSoundTypeChange = (type: PomodoroSoundType) => {
    updatePomodoroSettings({ soundType: type });
    playTimerEndSound(type, pomodoroSettings.soundVolume ?? 0.8);
    showNotification(`Sound set to ${type}`);
  };

  const handleVolumeChange = (vol: number) => {
    updatePomodoroSettings({ soundVolume: vol });
  };

  const handleLongBreakIntervalChange = (val: number) => {
    updatePomodoroSettings({ longBreakInterval: val });
    showNotification(`Long break every ${val} sessions`);
  };

  const handleTestSound = () => {
    setIsPlayingTest(true);
    playTimerEndSound(pomodoroSettings.soundType ?? 'bell', pomodoroSettings.soundVolume ?? 0.8);
    setTimeout(() => setIsPlayingTest(false), 1200);
  };

  const handleProfileNameChange = (newName: string) => {
    updateProfile({ name: newName });
    showNotification('Profile updated');
  };

  const currentGoalHours = (profile?.dailyFocusGoalMinutes && profile.dailyFocusGoalMinutes > 0)
    ? profile.dailyFocusGoalMinutes / 60
    : 4;

  const [prevGoalHours, setPrevGoalHours] = useState(currentGoalHours);
  const [goalHoursInput, setGoalHoursInput] = useState<string>(() => String(currentGoalHours));

  if (prevGoalHours !== currentGoalHours) {
    setPrevGoalHours(currentGoalHours);
    setGoalHoursInput(String(currentGoalHours));
  }

  const applyFocusGoal = (hours: number, notify = true) => {
    const clamped = Math.min(24, Math.max(0.5, Math.round(hours * 2) / 2));
    updateProfile({ dailyFocusGoalMinutes: Math.round(clamped * 60) });
    setGoalHoursInput(String(clamped));
    if (notify) {
      showNotification(`Daily target set to ${clamped} ${clamped === 1 ? 'hour' : 'hours'}`);
    }
  };

  const handleDecrementFocusGoal = () => {
    const next = Math.max(0.5, currentGoalHours - 0.5);
    applyFocusGoal(next, true);
  };

  const handleIncrementFocusGoal = () => {
    const next = Math.min(24, currentGoalHours + 0.5);
    applyFocusGoal(next, true);
  };

  const handleFocusGoalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setGoalHoursInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 24) {
      updateProfile({ dailyFocusGoalMinutes: Math.round(parsed * 60) });
    }
  };

  const handleFocusGoalInputBlur = () => {
    const parsed = parseFloat(goalHoursInput);
    if (isNaN(parsed) || parsed < 0.5) {
      const fallback = Math.max(0.5, currentGoalHours || 4);
      setGoalHoursInput(String(fallback));
      applyFocusGoal(fallback, false);
    } else {
      const clamped = Math.min(24, Math.max(0.5, Math.round(parsed * 10) / 10));
      applyFocusGoal(clamped, true);
    }
  };

  const handleFocusGoalInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const focusGoalPresets = [1, 2, 3, 4, 5, 6, 8];

  const handleClearSchedule = () => {
    clearSchedule();
    setShowResetConfirm(false);
    showNotification('Schedule cleared successfully');
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      showNotification('Signed out successfully');
    }
  };

  const workPresets = [10, 15, 25, 45, 50, 60];
  const shortBreakPresets = [3, 5, 8, 10];
  const longBreakPresets = [10, 15, 20, 30];
  const longBreakIntervalPresets = [2, 3, 4, 5, 6];

  const soundOptions: { id: PomodoroSoundType; label: string; desc: string; icon: string }[] = [
    { id: 'bell', label: 'Zen Bell', desc: 'Harmonic bell chime', icon: '🔔' },
    { id: 'digital', label: 'Digital Beep', desc: 'Modern electronic pulse', icon: '📟' },
    { id: 'gong', label: 'Singing Bowl', desc: 'Deep resonant meditation', icon: '🧘' },
    { id: 'marimba', label: 'Marimba', desc: 'Warm acoustic wood', icon: '🪵' },
  ];

  // Calculate slider percentage fills for sleek dynamic gradient tracks
  const workPercent = Math.min(100, Math.max(0, ((pomodoroSettings.workMinutes - 5) / (90 - 5)) * 100));
  const shortBreakPercent = Math.min(100, Math.max(0, ((pomodoroSettings.shortBreakMinutes - 1) / (20 - 1)) * 100));
  const longBreakPercent = Math.min(100, Math.max(0, ((pomodoroSettings.longBreakMinutes - 5) / (45 - 5)) * 100));
  const volumePercent = Math.round((pomodoroSettings.soundVolume ?? 0.8) * 100);

  return (
    <div className="space-y-3 pb-6">

      {/* Floating Aurora Toast Notification */}
      {mounted && savedMessage && createPortal(
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0E1528]/95 border border-emerald-400/40 text-emerald-300 text-xs font-bold shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(16,185,129,0.3)] backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none">
          <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
          <span>{savedMessage}</span>
        </div>,
        document.body
      )}

      {/* SECTION 1: POMODORO TIMER CONFIGURATION */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.10] bg-gradient-to-br from-[#12192B]/95 via-[#0D1322]/95 to-[#0A0E18]/98 backdrop-blur-2xl p-3.5 sm:p-4 shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.10)] space-y-3.5">

        {/* Top Aurora Sheen Line */}
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent pointer-events-none" />

        {/* Ambient Corner Light Glow */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="flex items-center gap-2.5 pb-2.5 border-b border-white/[0.08]">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500/25 to-purple-500/35 border border-indigo-400/30 flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.3)] shrink-0">
            <Timer className="w-4 h-4 text-indigo-300 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white tracking-tight leading-tight">Pomodoro Focus Station</h3>
            <p className="text-[10.5px] text-slate-400 font-medium">Configure your intervals and productivity flow</p>
          </div>
        </div>

        {/* Focus Work Duration */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-indigo-400 stroke-[2.2]" />
              <span className="text-xs font-bold text-slate-200 tracking-tight">Focus Duration</span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-400/35 font-mono font-bold text-[11px] text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.3)]">
              {pomodoroSettings.workMinutes} Minutes
            </span>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {workPresets.map((val) => (
              <button
                key={val}
                onClick={() => handlePomodoroChange('workMinutes', val)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all active:scale-90 ${pomodoroSettings.workMinutes === val
                  ? 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.55)] border border-indigo-300/60 font-black'
                  : 'bg-white/[0.04] border border-white/[0.08] hover:border-indigo-400/30 text-slate-300 hover:text-white'
                  }`}
              >
                {val}m
              </button>
            ))}
          </div>

          <input
            type="range"
            min="5"
            max="90"
            step="5"
            value={pomodoroSettings.workMinutes}
            onChange={(e) => handlePomodoroChange('workMinutes', parseInt(e.target.value))}
            style={{
              background: `linear-gradient(to right, #6366f1 ${workPercent}%, rgba(255,255,255,0.08) ${workPercent}%)`
            }}
            className="w-full cursor-pointer h-1.5 rounded-full appearance-none outline-none accent-indigo-400 shadow-inner"
          />
        </div>

        {/* Short Break Duration */}
        <div className="space-y-2 pt-2.5 border-t border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Coffee className="w-3.5 h-3.5 text-emerald-400 stroke-[2.2]" />
              <span className="text-xs font-bold text-slate-200 tracking-tight">Short Break</span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-400/35 font-mono font-bold text-[11px] text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
              {pomodoroSettings.shortBreakMinutes} Minutes
            </span>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {shortBreakPresets.map((val) => (
              <button
                key={val}
                onClick={() => handlePomodoroChange('shortBreakMinutes', val)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all active:scale-90 ${pomodoroSettings.shortBreakMinutes === val
                  ? 'bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.55)] border border-emerald-300/60 font-black'
                  : 'bg-white/[0.04] border border-white/[0.08] hover:border-emerald-400/30 text-slate-300 hover:text-white'
                  }`}
              >
                {val}m
              </button>
            ))}
          </div>

          <input
            type="range"
            min="1"
            max="20"
            step="1"
            value={pomodoroSettings.shortBreakMinutes}
            onChange={(e) => handlePomodoroChange('shortBreakMinutes', parseInt(e.target.value))}
            style={{
              background: `linear-gradient(to right, #10b981 ${shortBreakPercent}%, rgba(255,255,255,0.08) ${shortBreakPercent}%)`
            }}
            className="w-full cursor-pointer h-1.5 rounded-full appearance-none outline-none accent-emerald-400 shadow-inner"
          />
        </div>

        {/* Long Break Duration */}
        <div className="space-y-2 pt-2.5 border-t border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-cyan-400 stroke-[2.2]" />
              <span className="text-xs font-bold text-slate-200 tracking-tight">Long Break</span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-400/35 font-mono font-bold text-[11px] text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              {pomodoroSettings.longBreakMinutes} Minutes
            </span>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {longBreakPresets.map((val) => (
              <button
                key={val}
                onClick={() => handlePomodoroChange('longBreakMinutes', val)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all active:scale-90 ${pomodoroSettings.longBreakMinutes === val
                  ? 'bg-gradient-to-tr from-cyan-600 via-cyan-500 to-blue-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.55)] border border-cyan-300/60 font-black'
                  : 'bg-white/[0.04] border border-white/[0.08] hover:border-cyan-400/30 text-slate-300 hover:text-white'
                  }`}
              >
                {val}m
              </button>
            ))}
          </div>

          <input
            type="range"
            min="5"
            max="45"
            step="5"
            value={pomodoroSettings.longBreakMinutes}
            onChange={(e) => handlePomodoroChange('longBreakMinutes', parseInt(e.target.value))}
            style={{
              background: `linear-gradient(to right, #06b6d4 ${longBreakPercent}%, rgba(255,255,255,0.08) ${longBreakPercent}%)`
            }}
            className="w-full cursor-pointer h-1.5 rounded-full appearance-none outline-none accent-cyan-400 shadow-inner"
          />
        </div>

        {/* AUTOMATION & CYCLE FLOW */}
        <div className="space-y-2.5 pt-3 border-t border-white/[0.08]">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400 stroke-[2.2]" />
            <div>
              <span className="text-xs font-bold text-slate-200 tracking-tight">Cycle Flow & Automation</span>
              <p className="text-[10px] text-slate-400 leading-tight">Choose automatic continuous cycle or manual step-by-step</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
            {/* Auto-start Breaks Card */}
            <div
              onClick={() => handleToggle('autoStartBreaks')}
              className={`cursor-pointer p-2.5 sm:p-3 rounded-xl border transition-all duration-200 flex items-center justify-between gap-2.5 ${pomodoroSettings.autoStartBreaks
                ? 'bg-emerald-500/[0.08] border-emerald-500/30 shadow-[0_0_14px_rgba(16,185,129,0.12)]'
                : 'bg-white/[0.02] border-white/[0.08] hover:border-white/[0.15]'
                }`}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <Coffee className={`w-3.5 h-3.5 ${pomodoroSettings.autoStartBreaks ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold text-white">Auto-start Breaks</span>
                </div>
                <p className="text-[10px] text-slate-400 pt-0.5 leading-tight">
                  Start break immediately when focus sprint ends
                </p>
              </div>

              {/* Sleek Glowing Toggle Switch */}
              <div className={`w-9 h-5 rounded-full transition-colors duration-250 ease-out relative p-0.5 shrink-0 ${pomodoroSettings.autoStartBreaks ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-700'
                }`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-250 ease-out shadow-md ${pomodoroSettings.autoStartBreaks ? 'translate-x-4' : 'translate-x-0'
                  }`} />
              </div>
            </div>

            {/* Auto-start Focus Card */}
            <div
              onClick={() => handleToggle('autoStartFocus')}
              className={`cursor-pointer p-2.5 sm:p-3 rounded-xl border transition-all duration-200 flex items-center justify-between gap-2.5 ${pomodoroSettings.autoStartFocus
                ? 'bg-indigo-500/[0.08] border-indigo-500/30 shadow-[0_0_14px_rgba(99,102,241,0.12)]'
                : 'bg-white/[0.02] border-white/[0.08] hover:border-white/[0.15]'
                }`}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <Flame className={`w-3.5 h-3.5 ${pomodoroSettings.autoStartFocus ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold text-white">Auto-start Focus</span>
                </div>
                <p className="text-[10px] text-slate-400 pt-0.5 leading-tight">
                  Start next focus sprint immediately when break ends
                </p>
              </div>

              {/* Sleek Glowing Toggle Switch */}
              <div className={`w-9 h-5 rounded-full transition-colors duration-250 ease-out relative p-0.5 shrink-0 ${pomodoroSettings.autoStartFocus ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-slate-700'
                }`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-250 ease-out shadow-md ${pomodoroSettings.autoStartFocus ? 'translate-x-4' : 'translate-x-0'
                  }`} />
              </div>
            </div>
          </div>

          {/* Long Break Interval Selector */}
          <div className="flex items-center justify-between pt-0.5">
            <div>
              <span className="text-xs font-bold text-slate-200 tracking-tight">Long Break Frequency</span>
              <p className="text-[10px] text-slate-400">Trigger long break after how many focus sessions</p>
            </div>

            <div className="flex items-center gap-1">
              {longBreakIntervalPresets.map((count) => (
                <button
                  key={count}
                  onClick={() => handleLongBreakIntervalChange(count)}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold transition-all duration-200 active:scale-95 ${(pomodoroSettings.longBreakInterval || 4) === count
                    ? 'bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.45)] border border-cyan-400/50'
                    : 'bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white'
                    }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* NOTIFICATION SOUND & CHIME ALERTS */}
        <div className="space-y-2.5 pt-3 border-t border-white/[0.08]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-indigo-400 stroke-[2.2]" />
              <div>
                <span className="text-xs font-bold text-slate-200 tracking-tight">Notification Sound & Alerts</span>
                <p className="text-[10px] text-slate-400 leading-tight">Play an uplifting chime when each session ends</p>
              </div>
            </div>

            {/* Sound Toggle Switch */}
            <div
              onClick={() => handleToggle('soundEnabled')}
              className={`cursor-pointer w-9 h-5 rounded-full transition-colors duration-250 ease-out relative p-0.5 shrink-0 ${pomodoroSettings.soundEnabled ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-slate-700'
                }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-250 ease-out shadow-md ${pomodoroSettings.soundEnabled ? 'translate-x-4' : 'translate-x-0'
                }`} />
            </div>
          </div>

          {pomodoroSettings.soundEnabled && (
            <div className="space-y-2 pt-0.5 animate-in fade-in duration-200">
              {/* Sound Theme Selection Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {soundOptions.map((snd) => {
                  const isSelected = (pomodoroSettings.soundType ?? 'bell') === snd.id;
                  return (
                    <button
                      key={snd.id}
                      onClick={() => handleSoundTypeChange(snd.id)}
                      className={`p-2 rounded-xl border text-left transition-all duration-150 active:scale-95 flex flex-col justify-between gap-1 ${isSelected
                        ? 'bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-transparent border-indigo-400/50 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                        : 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.15] text-slate-400 hover:text-white'
                        }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-sm">{snd.icon}</span>
                        {isSelected && <Check className="w-3 h-3 text-indigo-400 stroke-[3]" />}
                      </div>
                      <div>
                        <div className={`text-[11px] font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                          {snd.label}
                        </div>
                        <div className="text-[9.5px] text-slate-400 truncate">
                          {snd.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Volume Slider & Test Button Row */}
              <div className="flex items-center justify-between gap-3 p-2 sm:p-2.5 rounded-xl bg-black/40 border border-white/[0.06]">
                <div className="flex items-center gap-2 flex-1">
                  {volumePercent === 0 ? (
                    <VolumeX className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  )}
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={volumePercent}
                    onChange={(e) => handleVolumeChange(parseInt(e.target.value) / 100)}
                    style={{
                      background: `linear-gradient(to right, #818cf8 ${volumePercent}%, rgba(255,255,255,0.08) ${volumePercent}%)`
                    }}
                    className="w-full cursor-pointer h-1.5 rounded-full appearance-none outline-none accent-indigo-400"
                  />
                  <span className="text-[11px] font-mono font-bold text-slate-300 w-8 text-right shrink-0">
                    {volumePercent}%
                  </span>
                </div>

                {/* Test Sound Button */}
                <button
                  onClick={handleTestSound}
                  disabled={isPlayingTest}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all active:scale-95 flex items-center gap-1.5 shrink-0 ${isPlayingTest
                    ? 'bg-indigo-500 text-white border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.5)]'
                    : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.12] text-indigo-300 hover:text-white'
                    }`}
                >
                  <Play className={`w-2.5 h-2.5 ${isPlayingTest ? 'fill-white animate-spin' : 'fill-indigo-300'}`} />
                  <span>{isPlayingTest ? 'Playing...' : 'Test'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: GENERAL SETTINGS */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.10] bg-gradient-to-br from-[#12192B]/95 via-[#0D1322]/95 to-[#0A0E18]/98 backdrop-blur-2xl p-3.5 sm:p-4 shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.10)] space-y-3">

        {/* Top Aurora Sheen Line */}
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent pointer-events-none" />

        {/* Ambient Corner Light Glow */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="flex items-center gap-2.5 pb-2.5 border-b border-white/[0.08]">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500/25 to-blue-500/35 border border-cyan-400/30 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.3)] shrink-0">
            <User className="w-4 h-4 text-cyan-300 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white tracking-tight leading-tight">General Preferences</h3>
            <p className="text-[10.5px] text-slate-400 font-medium">Personalize your identity and app defaults</p>
          </div>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {/* Display Name Row */}
          <div className="flex items-center justify-between py-2.5 gap-3">
            <div>
              <span className="text-xs font-bold text-slate-200">Display Name</span>
              <p className="text-[10.5px] text-slate-400">Shown in your daily greeting.</p>
            </div>
            <div className="relative flex items-center">
              <input
                type="text"
                value={profile.name}
                onChange={(e) => handleProfileNameChange(e.target.value)}
                placeholder="Enter name"
                className="w-32 sm:w-40 rounded-lg bg-white/[0.05] border border-white/[0.14] focus:bg-white/[0.08] focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 pl-8 pr-2.5 py-1.5 text-xs font-bold text-white shadow-inner backdrop-blur-xl transition-all outline-none"
              />
              <User className="w-3.5 h-3.5 text-cyan-400 absolute left-2.5 pointer-events-none stroke-[2.2] z-10 drop-shadow-[0_0_8px_rgba(6,182,212,0.45)]" />
            </div>
          </div>

          {/* Daily Focus Goal Row */}
          <div className="py-2.5 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-amber-400 stroke-[2.2]" />
                  <span className="text-xs font-bold text-slate-200">Daily Focus Target</span>
                </div>
                <p className="text-[10.5px] text-slate-400">Target work sprint hours per day</p>
              </div>

              {/* Stepper with - / + and direct editable input */}
              <div className="flex items-center gap-1.5">
                <div className="flex items-center bg-white/[0.05] border border-white/[0.14] rounded-lg p-0.5 shadow-inner backdrop-blur-xl focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400/25 transition-all">
                  <button
                    type="button"
                    onClick={handleDecrementFocusGoal}
                    disabled={currentGoalHours <= 0.5}
                    aria-label="Decrease focus target"
                    className="w-6.5 h-6.5 rounded-md bg-white/[0.04] hover:bg-amber-500/20 active:scale-90 disabled:opacity-25 disabled:pointer-events-none flex items-center justify-center text-slate-300 hover:text-amber-300 transition-all cursor-pointer"
                  >
                    <Minus className="w-3 h-3 stroke-[2.5]" />
                  </button>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={goalHoursInput}
                    onChange={handleFocusGoalInputChange}
                    onBlur={handleFocusGoalInputBlur}
                    onKeyDown={handleFocusGoalInputKeyDown}
                    className="w-9 text-center text-xs font-mono font-bold text-white bg-transparent outline-none"
                    placeholder="4"
                  />
                  <button
                    type="button"
                    onClick={handleIncrementFocusGoal}
                    disabled={currentGoalHours >= 24}
                    aria-label="Increase focus target"
                    className="w-6.5 h-6.5 rounded-md bg-white/[0.04] hover:bg-amber-500/20 active:scale-90 disabled:opacity-25 disabled:pointer-events-none flex items-center justify-center text-slate-300 hover:text-amber-300 transition-all cursor-pointer"
                  >
                    <Plus className="w-3 h-3 stroke-[2.5]" />
                  </button>
                </div>
                <span className="text-[11px] font-bold text-slate-400">hours</span>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1 flex-wrap">
              {focusGoalPresets.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => applyFocusGoal(val, true)}
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold transition-all active:scale-90 cursor-pointer ${currentGoalHours === val
                    ? 'bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.55)] border border-amber-300/60 font-black'
                    : 'bg-white/[0.04] border border-white/[0.08] hover:border-amber-400/30 text-slate-300 hover:text-white'
                    }`}
                >
                  {val}h
                </button>
              ))}
            </div>

            {/* Range slider for fluid adjustment */}
            <input
              type="range"
              min="0.5"
              max="16"
              step="0.5"
              value={currentGoalHours}
              onChange={(e) => applyFocusGoal(parseFloat(e.target.value), false)}
              style={{
                background: `linear-gradient(to right, #f59e0b ${Math.min(100, Math.max(0, ((currentGoalHours - 0.5) / (16 - 0.5)) * 100))}%, rgba(255,255,255,0.08) ${Math.min(100, Math.max(0, ((currentGoalHours - 0.5) / (16 - 0.5)) * 100))}%)`
              }}
              className="w-full cursor-pointer h-1.5 rounded-full appearance-none outline-none accent-amber-400 shadow-inner"
            />
          </div>

          {/* Clear Timetable Row */}
          <div className="flex items-center justify-between py-2.5 gap-3">
            <div>
              <span className="text-xs font-bold text-slate-200">Clear Timetable</span>
              <p className="text-[10.5px] text-slate-400">Delete all scheduled items and start fresh</p>
            </div>
            <div className="p-[1.5px] rounded-xl bg-gradient-to-r from-rose-500/80 via-red-500/80 to-amber-500/80 shadow-[0_0_16px_rgba(244,63,94,0.35)] shrink-0">
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="px-3 py-1.5 rounded-[10px] bg-[#0E1424]/75 hover:bg-[#141C30]/85 backdrop-blur-xl active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]"
              >
                <RotateCcw className="w-3 h-3 text-rose-400 stroke-[2.5]" />
                <span className="bg-gradient-to-r from-white via-rose-100 to-rose-300 bg-clip-text text-transparent text-xs font-black whitespace-nowrap">
                  Clear
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: ROUTINE CATEGORIES */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.10] bg-gradient-to-br from-[#12192B]/95 via-[#0D1322]/95 to-[#0A0E18]/98 backdrop-blur-2xl p-3.5 sm:p-4 shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.10)] space-y-3.5">
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent pointer-events-none" />
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                Routine Categories
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-400/25">
                  {categories.length}
                </span>
              </h2>
              <p className="text-[10.5px] text-slate-400">Custom categories for scheduling and tracking</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenAddCategory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(99,102,241,0.4)] active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add</span>
          </button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {categories.map((cat) => {
            const config = getCategoryConfig(cat.label, categories);
            const IconComp = config.icon;
            const isProtected = categories.length <= 1;

            return (
              <div
                key={cat.id}
                className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-[#070A12]/60 border border-white/5 hover:border-white/10 transition-all group"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${config.badge}`}>
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block truncate">
                      {cat.label}
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize">
                      {cat.color} • {cat.icon}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEditCategory(cat)}
                    className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.12] text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                    title="Edit category"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={isProtected}
                    onClick={() => setCatToDelete(cat)}
                    className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center transition-all cursor-pointer"
                    title={isProtected ? 'Cannot delete the only category' : 'Delete category'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 4: MOTIVATIONAL SHAYARI & QUOTES */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.10] bg-gradient-to-br from-[#12192B]/95 via-[#0D1322]/95 to-[#0A0E18]/98 backdrop-blur-2xl p-3.5 sm:p-4 shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.10)] space-y-3.5">
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent pointer-events-none" />
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center">
              <Quote className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                Daily Motivation & Shayari
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/25">
                  {shayaris.length}
                </span>
              </h2>
              <p className="text-[10.5px] text-slate-400">Quotes shown on your daily dashboard</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenAddShayari}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(245,158,11,0.4)] active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add</span>
          </button>
        </div>

        {/* Shayari Scrollable List */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {shayaris.map((item, idx) => {
            const isProtected = shayaris.length <= 1;
            return (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 p-3 rounded-xl bg-[#070A12]/60 border border-white/5 hover:border-white/10 transition-all group"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      #{idx + 1}
                    </span>
                  </div>
                  <div className="text-xs text-slate-200 font-serif italic space-y-0.5">
                    {item.lines.map((line, lIdx) => (
                      <p key={lIdx} className="leading-snug">&ldquo;{line}&rdquo;</p>
                    ))}
                  </div>
                  {item.translation && (
                    <p className="text-[10.5px] text-slate-400 not-italic font-sans pt-0.5 line-clamp-2">
                      {item.translation}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0 pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEditShayari(item)}
                    className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.12] text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                    title="Edit quote"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={isProtected}
                    onClick={() => setShayariToDelete(item)}
                    className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center transition-all cursor-pointer"
                    title={isProtected ? 'Cannot delete the only quote' : 'Delete quote'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 5: ACCOUNT PROFILE */}
      {user && (
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.10] bg-gradient-to-br from-[#12192B]/95 via-[#0D1322]/95 to-[#0A0E18]/98 backdrop-blur-2xl p-3.5 sm:p-4 shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.10)] space-y-3">
          <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none" />
          <div className="absolute -top-12 -left-12 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-[#070A12]/50 border border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center font-bold text-xs text-white shadow-md">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  {profile.name}
                  <span className="flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[8.5px] uppercase tracking-wider font-black">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    Connected
                  </span>
                </div>
                <div className="text-[10.5px] text-slate-400">{user.email}</div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs transition-colors border border-rose-500/20"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      )}

      {/* Clear Timetable Confirmation Warning Modal (Portaled to document.body for true viewport centering) */}
      {mounted && showResetConfirm && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowResetConfirm(false);
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
                  Clear Entire Timetable?
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Are you sure you want to delete all scheduled items and start fresh? {schedule.length > 0 ? (
                    <>All <span className="font-bold text-white bg-white/[0.12] px-1.5 py-0.5 rounded-md border border-white/[0.2] shadow-inner backdrop-blur-sm">{schedule.length}</span> routine {schedule.length === 1 ? 'slot' : 'slots'} will be permanently removed.</>
                  ) : (
                    <>Your timetable is currently empty.</>
                  )}
                </p>
              </div>

              <button
                onClick={() => setShowResetConfirm(false)}
                className="absolute top-0 right-0 w-7 h-7 rounded-xl bg-white/[0.08] hover:bg-white/[0.2] border border-white/[0.22] backdrop-blur-2xl text-slate-300 hover:text-white flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>

            {/* Frosted Translucent Glass Warning Notice */}
            <div className="p-3 rounded-2xl bg-white/[0.06] backdrop-blur-2xl border border-white/[0.18] border-t-white/[0.3] shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.2),0_4px_15px_rgba(0,0,0,0.2)] relative z-10">
              <p className="text-[11px] text-rose-200/90 font-medium leading-snug">
                ⚠️ This will completely wipe all routine schedule slots and reset your daily task tracking. This action cannot be undone.
              </p>
            </div>

            {/* Frosted Glass Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-1 relative z-10">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.18] text-slate-200 hover:text-white border border-white/[0.22] backdrop-blur-2xl shadow-[0_4px_15px_rgba(0,0,0,0.2),inset_0_1.5px_1px_rgba(255,255,255,0.35)] text-xs font-bold active:scale-95 transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleClearSchedule}
                className="flex-1 sm:flex-initial px-4.5 py-2 rounded-xl bg-gradient-to-r from-rose-500/90 via-rose-600/90 to-red-600/90 hover:from-rose-500 hover:to-red-500 text-white text-xs font-black shadow-[0_0_25px_rgba(244,63,94,0.55),inset_0_1.5px_2px_rgba(255,255,255,0.5)] border border-rose-300/70 backdrop-blur-2xl active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                <span>Clear Timetable</span>
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* Category Add/Edit Modal */}
      {mounted && catModalOpen && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setCatModalOpen(false);
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xl animate-in fade-in duration-150"
        >
          <div className="relative overflow-hidden w-full max-w-md rounded-[28px] border border-white/[0.22] border-t-white/[0.4] bg-gradient-to-br from-white/[0.14] via-[#0E1322]/85 to-[#060913]/90 backdrop-blur-3xl shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(99,102,241,0.25),inset_0_1.5px_1.5px_rgba(255,255,255,0.45),inset_0_-1px_1px_rgba(255,255,255,0.1)] p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150">
            {/* Top Rim Light Sheen */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-300/80 to-transparent opacity-95 pointer-events-none" />
            <div className="absolute -top-20 -right-16 w-52 h-52 bg-indigo-500/25 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <Layers className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white tracking-tight">
                    {catModalMode === 'add' ? 'Add Routine Category' : 'Edit Routine Category'}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    {catModalMode === 'add' ? 'Create a custom category for your routines' : 'Update category name, style, and icon'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCatModalOpen(false)}
                className="w-7 h-7 rounded-xl bg-white/[0.08] hover:bg-white/[0.2] border border-white/[0.22] backdrop-blur-2xl text-slate-300 hover:text-white flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 relative z-10">
              {/* Category Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200">Category Name</label>
                <input
                  type="text"
                  required
                  value={catFormLabel}
                  onChange={(e) => setCatFormLabel(e.target.value)}
                  placeholder="e.g. Deep Work, Workout, Reading..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#070A12]/80 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/30 transition-all"
                  autoFocus
                />
              </div>

              {/* Color Palette */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span>Color Theme</span>
                  <span className="text-[10px] font-mono text-slate-400 capitalize">{catFormColor}</span>
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {COLOR_OPTIONS.map((col) => {
                    const isSelected = catFormColor === col.id;
                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => setCatFormColor(col.id)}
                        className={`h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${col.bg} ${isSelected
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-[#070A12] scale-105 shadow-md'
                          : 'opacity-70 hover:opacity-100 hover:scale-100'
                          }`}
                        title={col.label}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Icon Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span>Icon</span>
                  <span className="text-[10px] font-mono text-slate-400">{catFormIcon}</span>
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {AVAILABLE_CATEGORY_ICONS.map((iconKey) => {
                    const IconComponent = CATEGORY_ICONS[iconKey] || Layers;
                    const isSelected = catFormIcon === iconKey;
                    return (
                      <button
                        key={iconKey}
                        type="button"
                        onClick={() => setCatFormIcon(iconKey)}
                        className={`h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${isSelected
                          ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300 ring-1 ring-indigo-400 shadow-sm'
                          : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.08]'
                          }`}
                        title={iconKey}
                      >
                        <IconComponent className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Preview */}
              {(() => {
                const PreviewIcon = CATEGORY_ICONS[catFormIcon] || Layers;
                const theme = CATEGORY_COLOR_THEMES[catFormColor] || CATEGORY_COLOR_THEMES.indigo;
                return (
                  <div className="p-3 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400">Preview:</span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border shadow-sm ${theme.badge}`}>
                      <PreviewIcon className="w-3.5 h-3.5" />
                      <span>{catFormLabel.trim() || 'Category Name'}</span>
                    </span>
                  </div>
                );
              })()}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setCatModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.18] text-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!catFormLabel.trim()}
                  className="px-4.5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{catModalMode === 'add' ? 'Save Category' : 'Update Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Category Delete Confirmation Modal */}
      {mounted && catToDelete && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setCatToDelete(null);
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xl animate-in fade-in duration-150"
        >
          <div className="relative overflow-hidden w-full max-w-sm rounded-[28px] border border-white/[0.22] border-t-white/[0.4] bg-gradient-to-br from-white/[0.14] via-[#0E1322]/85 to-[#060913]/90 backdrop-blur-3xl shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(244,63,94,0.25),inset_0_1.5px_1.5px_rgba(255,255,255,0.45)] p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-rose-300/80 to-transparent opacity-95 pointer-events-none" />
            <div className="absolute -top-20 -right-16 w-52 h-52 bg-rose-500/25 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start gap-3 relative z-10">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1 pr-6">
                <h3 className="text-base font-black text-white tracking-tight">
                  Delete Category?
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Are you sure you want to delete <span className="font-bold text-white bg-white/10 px-1.5 py-0.5 rounded border border-white/20">&ldquo;{catToDelete.label}&rdquo;</span>?
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCatToDelete(null)}
                className="absolute top-0 right-0 w-7 h-7 rounded-xl bg-white/[0.08] hover:bg-white/[0.2] border border-white/[0.22] text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.06] border border-white/10 text-[11px] text-slate-300 leading-snug relative z-10">
              ℹ️ Existing scheduled slots using this category will remain unchanged, but this category won&apos;t be available for new slots.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1 relative z-10">
              <button
                type="button"
                onClick={() => setCatToDelete(null)}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.18] text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCategory}
                className="flex-1 sm:flex-initial px-4.5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white text-xs font-black shadow-[0_0_20px_rgba(244,63,94,0.5)] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Shayari Add/Edit Modal */}
      {mounted && shayariModalOpen && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShayariModalOpen(false);
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xl animate-in fade-in duration-150"
        >
          <div className="relative overflow-hidden w-full max-w-md rounded-[28px] border border-white/[0.22] border-t-white/[0.4] bg-gradient-to-br from-white/[0.14] via-[#0E1322]/85 to-[#060913]/90 backdrop-blur-3xl shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(245,158,11,0.25),inset_0_1.5px_1.5px_rgba(255,255,255,0.45),inset_0_-1px_1px_rgba(255,255,255,0.1)] p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-300/80 to-transparent opacity-95 pointer-events-none" />
            <div className="absolute -top-20 -right-16 w-52 h-52 bg-amber-500/25 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                  <Quote className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white tracking-tight">
                    {shayariModalMode === 'add' ? 'Add Motivation / Shayari' : 'Edit Motivation / Shayari'}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Inspiring verses displayed on your dashboard widget
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShayariModalOpen(false)}
                className="w-7 h-7 rounded-xl bg-white/[0.08] hover:bg-white/[0.2] border border-white/[0.22] backdrop-blur-2xl text-slate-300 hover:text-white flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>

            <form onSubmit={handleSaveShayari} className="space-y-4 relative z-10">
              {/* Lines textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span>Lines (one per line)</span>
                  <span className="text-[10px] text-slate-400">Poetry / Verse</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={shayariFormLines}
                  onChange={(e) => setShayariFormLines(e.target.value)}
                  placeholder="उम्र थका नहीं सकती, ठोकरें गिरा नहीं सकती...&#10;अगर ज़िद हो जीतने की तो हार भी हरा नहीं सकती..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070A12]/80 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 font-serif leading-relaxed transition-all resize-none"
                  autoFocus
                />
              </div>

              {/* Translation textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span>English Translation / Context <span className="text-slate-400 font-normal">(optional)</span></span>
                </label>
                <textarea
                  rows={2}
                  value={shayariFormTranslation}
                  onChange={(e) => setShayariFormTranslation(e.target.value)}
                  placeholder="Age cannot tire you, stumbles cannot defeat you..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#070A12]/80 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all resize-none"
                />
              </div>

              {/* Live Preview */}
              <div className="p-3 rounded-2xl bg-white/[0.05] border border-white/10 space-y-1.5">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Live Preview
                </span>
                <div className="space-y-1 font-serif italic text-xs text-slate-200">
                  {shayariFormLines.trim() ? (
                    shayariFormLines
                      .split('\n')
                      .filter((l) => l.trim())
                      .map((l, i) => <p key={i}>&ldquo;{l}&rdquo;</p>)
                  ) : (
                    <p className="text-slate-500 not-italic font-sans text-[11px]">
                      Enter lines above to see the live preview...
                    </p>
                  )}
                </div>
                {shayariFormTranslation.trim() && (
                  <p className="text-[10.5px] text-slate-400 font-sans border-t border-white/5 pt-1.5 mt-1">
                    {shayariFormTranslation.trim()}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShayariModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.18] text-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!shayariFormLines.trim()}
                  className="px-4.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{shayariModalMode === 'add' ? 'Save Quote' : 'Update Quote'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Shayari Delete Confirmation Modal */}
      {mounted && shayariToDelete && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShayariToDelete(null);
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xl animate-in fade-in duration-150"
        >
          <div className="relative overflow-hidden w-full max-w-sm rounded-[28px] border border-white/[0.22] border-t-white/[0.4] bg-gradient-to-br from-white/[0.14] via-[#0E1322]/85 to-[#060913]/90 backdrop-blur-3xl shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(244,63,94,0.25),inset_0_1.5px_1.5px_rgba(255,255,255,0.45)] p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-rose-300/80 to-transparent opacity-95 pointer-events-none" />
            <div className="absolute -top-20 -right-16 w-52 h-52 bg-rose-500/25 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start gap-3 relative z-10">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1 pr-6">
                <h3 className="text-base font-black text-white tracking-tight">
                  Delete Motivation / Shayari?
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-serif italic line-clamp-2">
                  &ldquo;{shayariToDelete.lines[0]}&rdquo;
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShayariToDelete(null)}
                className="absolute top-0 right-0 w-7 h-7 rounded-xl bg-white/[0.08] hover:bg-white/[0.2] border border-white/[0.22] text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.06] border border-white/10 text-[11px] text-slate-300 leading-snug relative z-10">
              ⚠️ This quote will be permanently removed from your rotation pool.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1 relative z-10">
              <button
                type="button"
                onClick={() => setShayariToDelete(null)}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.18] text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteShayari}
                className="flex-1 sm:flex-initial px-4.5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white text-xs font-black shadow-[0_0_20px_rgba(244,63,94,0.5)] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
