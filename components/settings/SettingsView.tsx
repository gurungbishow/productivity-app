'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '@/lib/store';
import {
  User,
  Check,
  RotateCcw,
  Flame,
  Coffee,
  Moon,
  Target,
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
    resetCategoriesToDefault,
    shayaris,
    addShayari,
    updateShayari,
    deleteShayari,
    resetShayarisToDefault,
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
    const linesStr = Array.isArray(item.lines) ? item.lines.join('\n') : (item.lines || '');
    setShayariFormLines(linesStr);
    setShayariFormTranslation(item.translation || '');
    setShayariModalOpen(true);
  };

  const handleSaveShayari = (e: React.FormEvent) => {
    e.preventDefault();
    const content = shayariFormLines.trim();
    if (!content) return;

    if (shayariModalMode === 'add') {
      addShayari({
        lines: content,
        ...(shayariFormTranslation.trim() ? { translation: shayariFormTranslation.trim() } : {}),
      });
      showNotification('Added new motivational quote');
    } else if (editingShayariId !== null) {
      updateShayari(editingShayariId, {
        lines: content,
        ...(shayariFormTranslation.trim() ? { translation: shayariFormTranslation.trim() } : {}),
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

  const applyFocusGoal = (hours: number, notify = true) => {
    const clamped = Math.min(24, Math.max(0.5, Math.round(hours * 2) / 2));
    updateProfile({ dailyFocusGoalMinutes: Math.round(clamped * 60) });
    if (notify) {
      showNotification(`Daily target set to ${clamped} ${clamped === 1 ? 'hour' : 'hours'}`);
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

  const workPresets = [10, 15, 25, 30, 45, 50, 60];
  const shortBreakPresets = [3, 5, 8, 10];
  const longBreakPresets = [10, 15, 20, 30];
  const longBreakIntervalPresets = [2, 3, 4, 5, 6, 8];

  const soundOptions: { id: PomodoroSoundType; label: string; desc: string; icon: string }[] = [
    { id: 'bell', label: 'Zen Bell', desc: 'Harmonic bell chime', icon: '🔔' },
    { id: 'digital', label: 'Digital Beep', desc: 'Modern electronic pulse', icon: '📟' },
    { id: 'gong', label: 'Singing Bowl', desc: 'Deep resonant meditation', icon: '🧘' },
    { id: 'marimba', label: 'Marimba', desc: 'Warm acoustic wood', icon: '🪵' },
  ];

  const workPercent = Math.min(100, Math.max(0, ((pomodoroSettings.workMinutes - 5) / (90 - 5)) * 100));
  const shortBreakPercent = Math.min(100, Math.max(0, ((pomodoroSettings.shortBreakMinutes - 1) / (20 - 1)) * 100));
  const longBreakPercent = Math.min(100, Math.max(0, ((pomodoroSettings.longBreakMinutes - 5) / (45 - 5)) * 100));
  const focusGoalPercent = Math.min(100, Math.max(0, ((currentGoalHours - 0.5) / (16 - 0.5)) * 100));
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

      {/* SECTION 1: TIMER INTERVALS */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
          Timer Intervals
        </span>
        <div className="rounded-[20px] bg-white/[0.025] border border-white/[0.08] backdrop-blur-2xl divide-y divide-white/[0.05] overflow-hidden shadow-[0_8px_25px_rgba(0,0,0,0.4)]">
          {/* Focus Duration */}
          <div className="p-3 sm:p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6.5 h-6.5 rounded-lg bg-indigo-500/15 border border-indigo-400/25 flex items-center justify-center text-indigo-400 shrink-0">
                  <Flame className="w-3.5 h-3.5 stroke-[2.2]" />
                </div>
                <span className="text-xs font-bold text-white">Focus Duration</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-400/35 font-mono font-bold text-[11px] text-indigo-300">
                {pomodoroSettings.workMinutes} Minutes
              </span>
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              {workPresets.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handlePomodoroChange('workMinutes', val)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all active:scale-90 cursor-pointer ${pomodoroSettings.workMinutes === val
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

          {/* Short Break */}
          <div className="p-3 sm:p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6.5 h-6.5 rounded-lg bg-emerald-500/15 border border-emerald-400/25 flex items-center justify-center text-emerald-400 shrink-0">
                  <Coffee className="w-3.5 h-3.5 stroke-[2.2]" />
                </div>
                <span className="text-xs font-bold text-white">Short Break</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-400/35 font-mono font-bold text-[11px] text-emerald-300">
                {pomodoroSettings.shortBreakMinutes} Minutes
              </span>
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              {shortBreakPresets.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handlePomodoroChange('shortBreakMinutes', val)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all active:scale-90 cursor-pointer ${pomodoroSettings.shortBreakMinutes === val
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

          {/* Long Break */}
          <div className="p-3 sm:p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6.5 h-6.5 rounded-lg bg-cyan-500/15 border border-cyan-400/25 flex items-center justify-center text-cyan-400 shrink-0">
                  <Moon className="w-3.5 h-3.5 stroke-[2.2]" />
                </div>
                <span className="text-xs font-bold text-white">Long Break</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-400/35 font-mono font-bold text-[11px] text-cyan-300">
                {pomodoroSettings.longBreakMinutes} Minutes
              </span>
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              {longBreakPresets.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handlePomodoroChange('longBreakMinutes', val)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all active:scale-90 cursor-pointer ${pomodoroSettings.longBreakMinutes === val
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

          {/* Sessions per Cycle */}
          <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-400/25 flex items-center justify-center text-purple-400 shrink-0">
                <Zap className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <span className="text-xs font-bold text-white">Sessions per Cycle</span>
            </div>
            <div className="flex items-center gap-1">
              {longBreakIntervalPresets.map((count) => (
                <button
                  key={count}
                  type="button"
                  title={`${count} sessions before a long break`}
                  onClick={() => handleLongBreakIntervalChange(count)}
                  className={`w-6.5 h-6.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${(pomodoroSettings.longBreakInterval || 4) === count
                    ? 'bg-purple-600 text-white shadow-sm border border-purple-400/50'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.06]'
                    }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: AUTOMATION & AUDIO */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
          Automation & Sound
        </span>
        <div className="rounded-[20px] bg-white/[0.025] border border-white/[0.08] backdrop-blur-2xl divide-y divide-white/[0.05] overflow-hidden shadow-[0_8px_25px_rgba(0,0,0,0.4)]">
          {/* Auto-start Breaks */}
          <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-400/25 flex items-center justify-center text-emerald-400 shrink-0">
                <Coffee className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <span className="text-xs font-bold text-white">Auto-start Breaks</span>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('autoStartBreaks')}
              className={`w-8.5 h-5 rounded-full transition-colors duration-200 relative p-0.5 shrink-0 cursor-pointer ${pomodoroSettings.autoStartBreaks ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-white/[0.12]'
                }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow-sm ${pomodoroSettings.autoStartBreaks ? 'translate-x-3.5' : 'translate-x-0'
                }`} />
            </button>
          </div>

          {/* Auto-start Focus */}
          <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-400/25 flex items-center justify-center text-indigo-400 shrink-0">
                <Flame className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <span className="text-xs font-bold text-white">Auto-start Focus</span>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('autoStartFocus')}
              className={`w-8.5 h-5 rounded-full transition-colors duration-200 relative p-0.5 shrink-0 cursor-pointer ${pomodoroSettings.autoStartFocus ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]' : 'bg-white/[0.12]'
                }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow-sm ${pomodoroSettings.autoStartFocus ? 'translate-x-3.5' : 'translate-x-0'
                }`} />
            </button>
          </div>

          {/* Sound Alerts */}
          <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-400/25 flex items-center justify-center text-cyan-400 shrink-0">
                <Bell className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <span className="text-xs font-bold text-white">Sound Alerts</span>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('soundEnabled')}
              className={`w-8.5 h-5 rounded-full transition-colors duration-200 relative p-0.5 shrink-0 cursor-pointer ${pomodoroSettings.soundEnabled ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-white/[0.12]'
                }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow-sm ${pomodoroSettings.soundEnabled ? 'translate-x-3.5' : 'translate-x-0'
                }`} />
            </button>
          </div>

          {/* Expanded Sound Theme & Volume */}
          {pomodoroSettings.soundEnabled && (
            <div className="p-3 sm:p-3.5 space-y-3 bg-white/[0.015]">
              {/* Sound Theme Segmented Bar */}
              <div className="flex items-center justify-between gap-2">
                <div className="grid grid-cols-4 gap-1 flex-1 p-0.5 rounded-xl bg-black/40 border border-white/[0.06]">
                  {soundOptions.map((snd) => {
                    const isSelected = (pomodoroSettings.soundType ?? 'bell') === snd.id;
                    return (
                      <button
                        key={snd.id}
                        type="button"
                        onClick={() => handleSoundTypeChange(snd.id)}
                        className={`py-1.5 px-1 rounded-lg text-[10.5px] font-bold transition-all text-center truncate cursor-pointer ${isSelected
                          ? 'bg-indigo-600 text-white shadow-sm font-black'
                          : 'text-slate-400 hover:text-white'
                          }`}
                      >
                        {snd.label.split(' ')[0]}
                      </button>
                    );
                  })}
                </div>

                {/* Test Sound Button */}
                <button
                  type="button"
                  onClick={handleTestSound}
                  disabled={isPlayingTest}
                  className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] flex items-center justify-center text-indigo-300 hover:text-white shrink-0 transition-all cursor-pointer"
                  title="Test chime"
                >
                  <Play className={`w-3 h-3 ${isPlayingTest ? 'animate-spin' : 'fill-indigo-300'}`} />
                </button>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2.5 pt-0.5">
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
                <span className="text-[10.5px] font-mono font-bold text-slate-300 w-7 text-right shrink-0">
                  {volumePercent}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: PREFERENCES */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
          Preferences
        </span>
        <div className="rounded-[20px] bg-white/[0.025] border border-white/[0.08] backdrop-blur-2xl divide-y divide-white/[0.05] overflow-hidden shadow-[0_8px_25px_rgba(0,0,0,0.4)]">
          {/* Display Name */}
          <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6.5 h-6.5 rounded-lg bg-cyan-500/15 border border-cyan-400/25 flex items-center justify-center text-cyan-400 shrink-0">
                <User className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <span className="text-xs font-bold text-white">Display Name</span>
            </div>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => handleProfileNameChange(e.target.value)}
              onBlur={() => {
                if (profile.name !== profile.name.trim()) {
                  handleProfileNameChange(profile.name.trim());
                }
              }}
              spellCheck={false}
              autoComplete="off"
              className="w-28 sm:w-36 rounded-lg bg-white/[0.05] border border-white/[0.1] px-2.5 py-1 text-xs font-bold text-white text-left focus:border-cyan-400 outline-none transition-all"
            />
          </div>

          {/* Daily Focus Goal */}
          <div className="p-3 sm:p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6.5 h-6.5 rounded-lg bg-amber-500/15 border border-amber-400/25 flex items-center justify-center text-amber-400 shrink-0">
                  <Target className="w-3.5 h-3.5 stroke-[2.2]" />
                </div>
                <span className="text-xs font-bold text-white">Daily Focus Goal</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-400/35 font-mono font-bold text-[11px] text-amber-300">
                {currentGoalHours} {currentGoalHours === 1 ? 'Hour' : 'Hours'}
              </span>
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              {focusGoalPresets.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => applyFocusGoal(val, true)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all active:scale-90 cursor-pointer ${currentGoalHours === val
                    ? 'bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.55)] border border-amber-300/60 font-black'
                    : 'bg-white/[0.04] border border-white/[0.08] hover:border-amber-400/30 text-slate-300 hover:text-white'
                    }`}
                >
                  {val}h
                </button>
              ))}
            </div>

            <input
              type="range"
              min="0.5"
              max="16"
              step="0.5"
              value={currentGoalHours}
              onChange={(e) => applyFocusGoal(parseFloat(e.target.value), false)}
              style={{
                background: `linear-gradient(to right, #f59e0b ${focusGoalPercent}%, rgba(255,255,255,0.08) ${focusGoalPercent}%)`
              }}
              className="w-full cursor-pointer h-1.5 rounded-full appearance-none outline-none accent-amber-400 shadow-inner"
            />
          </div>

          {/* Reset Timetable */}
          <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-400/25 flex items-center justify-center text-rose-400 shrink-0">
                <RotateCcw className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <span className="text-xs font-bold text-white">Clear Timetable</span>
            </div>
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 text-xs font-bold transition-all cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 4: ROUTINE CATEGORIES */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Routine Categories
            </span>
            <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-400/20">
              {categories.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                resetCategoriesToDefault();
                showNotification('Restored default categories');
              }}
              className="px-2 py-0.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-400 hover:text-white text-[11px] font-medium transition-all cursor-pointer"
              title="Reset default categories"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleOpenAddCategory}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400/30 text-indigo-300 text-[11px] font-bold transition-all cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          </div>
        </div>

        <div className="rounded-[20px] bg-white/[0.025] border border-white/[0.08] backdrop-blur-2xl divide-y divide-white/[0.05] overflow-hidden shadow-[0_8px_25px_rgba(0,0,0,0.4)]">
          {categories.map((cat) => {
            const config = getCategoryConfig(cat.label, categories);
            const IconComp = config.icon;
            const isProtected = categories.length <= 1;

            return (
              <div
                key={cat.id}
                className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-white/[0.015] transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 ${config.badge}`}>
                    <IconComp className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-white truncate">
                    {cat.label}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEditCategory(cat)}
                    className="w-6.5 h-6.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.12] text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                    title="Edit category"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    disabled={isProtected}
                    onClick={() => setCatToDelete(cat)}
                    className="w-6.5 h-6.5 rounded-lg bg-white/[0.04] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center transition-all cursor-pointer"
                    title={isProtected ? 'Cannot delete only category' : 'Delete category'}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 5: DAILY WISDOM (QUOTES) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Daily Wisdom
            </span>
            <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/20">
              {shayaris.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                resetShayarisToDefault();
                showNotification('Restored default quotes');
              }}
              className="px-2 py-0.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-400 hover:text-white text-[11px] font-medium transition-all cursor-pointer"
              title="Reset default quotes"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleOpenAddShayari}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 text-amber-300 text-[11px] font-bold transition-all cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          </div>
        </div>

        <div className="rounded-[20px] bg-white/[0.025] border border-white/[0.08] backdrop-blur-2xl divide-y divide-white/[0.05] overflow-hidden shadow-[0_8px_25px_rgba(0,0,0,0.4)] max-h-64 overflow-y-auto">
          {shayaris.map((item, idx) => {
            const isProtected = shayaris.length <= 1;
            const quoteText = Array.isArray(item.lines) ? item.lines[0] : item.lines;
            return (
              <div
                key={item.id}
                className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-white/[0.015] transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-[9.5px] font-mono font-bold text-amber-400/70 shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-xs text-slate-200 font-serif italic truncate">
                    &ldquo;{quoteText}&rdquo;
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEditShayari(item)}
                    className="w-6.5 h-6.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.12] text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                    title="Edit quote"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    disabled={isProtected}
                    onClick={() => setShayariToDelete(item)}
                    className="w-6.5 h-6.5 rounded-lg bg-white/[0.04] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center transition-all cursor-pointer"
                    title={isProtected ? 'Cannot delete only quote' : 'Delete quote'}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 6: ACCOUNT PROFILE */}
      {user && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
            Account
          </span>
          <div className="rounded-[20px] bg-white/[0.025] border border-white/[0.08] backdrop-blur-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-[0_8px_25px_rgba(0,0,0,0.4)]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center font-bold text-[11px] text-white shadow-sm shrink-0">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate">{profile.name}</span>
                <span className="text-[10px] font-mono text-slate-400 block truncate">{user.email}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Clear Timetable Confirmation Warning Modal */}
      {mounted && showResetConfirm && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowResetConfirm(false);
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xl animate-in fade-in duration-150"
        >
          <div className="relative overflow-hidden w-full max-w-[360px] rounded-2xl border border-white/10 bg-[#0B0F19]/95 backdrop-blur-2xl shadow-2xl p-4 sm:p-5 space-y-3 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-6.5 h-6.5 rounded-lg bg-rose-500/15 border border-rose-400/25 flex items-center justify-center text-rose-400 shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5 stroke-[2.2]" />
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Clear Timetable?
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="w-6.5 h-6.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to clear your timetable? {schedule.length > 0 ? (
                <>All <span className="font-bold text-white">{schedule.length}</span> routine {schedule.length === 1 ? 'slot' : 'slots'} will be permanently removed.</>
              ) : (
                <>Your timetable is currently empty.</>
              )}
            </p>

            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300 leading-snug">
              ⚠️ This action cannot be undone.
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearSchedule}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
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
          <div className="relative overflow-hidden w-full max-w-[390px] rounded-2xl border border-white/10 bg-[#0B0F19]/95 backdrop-blur-2xl shadow-2xl p-4 sm:p-5 space-y-3.5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-6.5 h-6.5 rounded-lg bg-indigo-500/15 border border-indigo-400/25 flex items-center justify-center text-indigo-400 shrink-0">
                  <Layers className="w-3.5 h-3.5 stroke-[2.2]" />
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {catModalMode === 'add' ? 'Add Routine Category' : 'Edit Routine Category'}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setCatModalOpen(false)}
                className="w-6.5 h-6.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3">
              {/* Category Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Category Name</label>
                <input
                  type="text"
                  required
                  value={catFormLabel}
                  onChange={(e) => setCatFormLabel(e.target.value)}
                  placeholder="e.g. Deep Work, Workout..."
                  className="w-full px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400/80 focus:bg-white/[0.06] transition-all"
                  autoFocus
                />
              </div>

              {/* Color Palette */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-300">Color Theme</span>
                  <span className="text-[10px] font-mono text-slate-400 capitalize">{catFormColor}</span>
                </div>
                <div className="flex items-center justify-between gap-1.5 pt-0.5">
                  {COLOR_OPTIONS.map((col) => {
                    const isSelected = catFormColor === col.id;
                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => setCatFormColor(col.id)}
                        className={`w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full flex items-center justify-center transition-all cursor-pointer ${col.bg} ${isSelected
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0B0F19] scale-110 shadow-sm'
                          : 'opacity-70 hover:opacity-100 hover:scale-105'
                          }`}
                        title={col.label}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Icon Picker */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-300">Icon</span>
                  <span className="text-[10px] font-mono text-slate-400">{catFormIcon}</span>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {AVAILABLE_CATEGORY_ICONS.map((iconKey) => {
                    const IconComponent = CATEGORY_ICONS[iconKey] || Layers;
                    const isSelected = catFormIcon === iconKey;
                    return (
                      <button
                        key={iconKey}
                        type="button"
                        onClick={() => setCatFormIcon(iconKey)}
                        className={`h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${isSelected
                          ? 'bg-indigo-500/20 border-indigo-400/60 text-indigo-300 shadow-sm'
                          : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.07]'
                          }`}
                        title={iconKey}
                      >
                        <IconComponent className="w-3.5 h-3.5" />
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
                  <div className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-400">Preview</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${theme.badge}`}>
                      <PreviewIcon className="w-3 h-3" />
                      <span>{catFormLabel.trim() || 'Category Name'}</span>
                    </span>
                  </div>
                );
              })()}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCatModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!catFormLabel.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{catModalMode === 'add' ? 'Save' : 'Update'}</span>
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
          <div className="relative overflow-hidden w-full max-w-[360px] rounded-2xl border border-white/10 bg-[#0B0F19]/95 backdrop-blur-2xl shadow-2xl p-4 sm:p-5 space-y-3 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-6.5 h-6.5 rounded-lg bg-rose-500/15 border border-rose-400/25 flex items-center justify-center text-rose-400 shrink-0">
                  <Trash2 className="w-3.5 h-3.5 stroke-[2.2]" />
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Delete Category
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setCatToDelete(null)}
                className="w-6.5 h-6.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-white bg-white/10 px-1.5 py-0.5 rounded border border-white/20">&ldquo;{catToDelete.label}&rdquo;</span>?
            </p>

            <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-slate-400 leading-snug">
              Existing scheduled slots using this category will remain unchanged.
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setCatToDelete(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCategory}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
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
          <div className="relative overflow-hidden w-full max-w-[390px] rounded-2xl border border-white/10 bg-[#0B0F19]/95 backdrop-blur-2xl shadow-2xl p-4 sm:p-5 space-y-3.5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-6.5 h-6.5 rounded-lg bg-amber-500/15 border border-amber-400/25 flex items-center justify-center text-amber-400 shrink-0">
                  <Quote className="w-3.5 h-3.5 stroke-[2.2]" />
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {shayariModalMode === 'add' ? 'Add Wisdom' : 'Edit Wisdom'}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShayariModalOpen(false)}
                className="w-6.5 h-6.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSaveShayari} className="space-y-3">
              {/* Quote / Lines textarea */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Quote / Wisdom Text</label>
                <textarea
                  required
                  rows={3}
                  value={shayariFormLines}
                  onChange={(e) => setShayariFormLines(e.target.value)}
                  placeholder="Life isn’t fair, but it is still good."
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/80 focus:bg-white/[0.06] font-serif leading-relaxed transition-all resize-none"
                  autoFocus
                />
              </div>

              {/* Live Preview */}
              <div className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Preview
                </span>
                <div className="space-y-0.5 font-serif italic text-xs text-slate-200">
                  {shayariFormLines.trim() ? (
                    shayariFormLines
                      .split('\n')
                      .filter((l) => l.trim())
                      .map((l, i) => <p key={i}>&ldquo;{l}&rdquo;</p>)
                  ) : (
                    <p className="text-slate-500 not-italic font-sans text-[11px]">
                      Enter lines above to preview...
                    </p>
                  )}
                </div>
                {shayariFormTranslation.trim() && (
                  <p className="text-[10px] text-slate-400 font-sans border-t border-white/5 pt-1 mt-1">
                    {shayariFormTranslation.trim()}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShayariModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!shayariFormLines.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:pointer-events-none text-slate-950 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{shayariModalMode === 'add' ? 'Save' : 'Update'}</span>
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
          <div className="relative overflow-hidden w-full max-w-[360px] rounded-2xl border border-white/10 bg-[#0B0F19]/95 backdrop-blur-2xl shadow-2xl p-4 sm:p-5 space-y-3 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-6.5 h-6.5 rounded-lg bg-rose-500/15 border border-rose-400/25 flex items-center justify-center text-rose-400 shrink-0">
                  <Trash2 className="w-3.5 h-3.5 stroke-[2.2]" />
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Delete Quote?
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShayariToDelete(null)}
                className="w-6.5 h-6.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-serif italic line-clamp-3">
              &ldquo;{Array.isArray(shayariToDelete.lines) ? shayariToDelete.lines.join(' ') : shayariToDelete.lines}&rdquo;
            </p>

            <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-slate-400 leading-snug">
              This quote will be removed from your rotation pool.
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShayariToDelete(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteShayari}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
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
