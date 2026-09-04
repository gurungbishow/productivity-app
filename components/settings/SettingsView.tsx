'use client';

import React, { useState } from 'react';
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
  X,
  LogOut,
  Bell,
  Volume2,
  VolumeX,
  Play,
  Zap,
  Cloud,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  Database,
  Copy,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabase';
import { playTimerEndSound } from '@/lib/utils';
import { PomodoroSoundType } from '@/lib/types';
import { SQL_SCHEMA_SCRIPT } from '@/lib/syncService';

export function SettingsView() {
  const {
    pomodoroSettings,
    updatePomodoroSettings,
    profile,
    updateProfile,
    clearSchedule,
    syncStatus,
    lastSyncedAt,
    syncError,
    syncNow,
    uploadToCloud,
    downloadFromCloud,
  } = useAppStore();

  const { user } = useAuth();

  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [isSyncingManual, setIsSyncingManual] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlSetup, setShowSqlSetup] = useState(syncStatus === 'table_missing');

  const showNotification = (msg: string) => {
    setSavedMessage(msg);
    setTimeout(() => setSavedMessage(null), 2500);
  };

  const handleManualSync = async () => {
    setIsSyncingManual(true);
    try {
      await syncNow();
      showNotification('Sync complete');
    } catch {
      showNotification('Sync failed');
    } finally {
      setIsSyncingManual(false);
    }
  };

  const handleUploadToCloud = async () => {
    setIsUploading(true);
    try {
      const success = await uploadToCloud();
      if (success) {
        showNotification('Local routine pushed to cloud');
      } else {
        showNotification('Failed to push to cloud');
      }
    } catch {
      showNotification('Upload error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRestoreFromCloud = async () => {
    setIsDownloading(true);
    try {
      const success = await downloadFromCloud();
      if (success) {
        showNotification('Data restored from cloud');
      } else {
        showNotification('Could not find remote data to restore');
      }
    } catch {
      showNotification('Download error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SQL_SCHEMA_SCRIPT);
      setCopiedSql(true);
      showNotification('SQL Schema copied to clipboard');
      setTimeout(() => setCopiedSql(false), 2500);
    } catch {
      showNotification('Failed to copy SQL');
    }
  };

  const formatLastSync = (isoString: string | null) => {
    if (!isoString) return 'Not synced yet';
    try {
      const d = new Date(isoString);
      return `Today at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return 'Recently';
    }
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

  const handleFocusGoalChange = (minutes: number) => {
    updateProfile({ dailyFocusGoalMinutes: minutes });
    showNotification(`Daily target set to ${minutes / 60} hours`);
  };

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
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">

      {/* Floating Aurora Toast Notification */}
      {savedMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-[#0E1528]/95 border border-emerald-400/40 text-emerald-300 text-xs font-bold shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(16,185,129,0.3)] backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* SECTION 1: POMODORO TIMER CONFIGURATION */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.12] bg-gradient-to-br from-[#12192B]/95 via-[#0D1322]/95 to-[#0A0E18]/98 backdrop-blur-2xl p-5 sm:p-6 shadow-[0_15px_35px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.12)] space-y-6">

        {/* Top Aurora Sheen Line */}
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent pointer-events-none" />

        {/* Ambient Corner Light Glow */}
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-white/[0.08]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500/25 to-purple-500/35 border border-indigo-400/30 flex items-center justify-center shadow-[0_0_14px_rgba(99,102,241,0.35)] shrink-0">
            <Timer className="w-4.5 h-4.5 text-indigo-300 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-base font-black text-white tracking-tight leading-tight">Pomodoro Focus Station</h3>
            <p className="text-[11px] text-slate-400 font-medium">Configure your intervals and productivity flow</p>
          </div>
        </div>

        {/* Focus Work Duration */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-indigo-400 stroke-[2.2]" />
              <span className="text-xs font-bold text-slate-200 tracking-tight">Focus Duration</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/15 border border-indigo-400/35 font-mono font-black text-xs text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.35)]">
              {pomodoroSettings.workMinutes} Minutes
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {workPresets.map((val) => (
              <button
                key={val}
                onClick={() => handlePomodoroChange('workMinutes', val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all active:scale-90 ${pomodoroSettings.workMinutes === val
                  ? 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-[0_0_14px_rgba(99,102,241,0.6)] border border-indigo-300/60 font-black'
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
            className="w-full cursor-pointer h-2 rounded-full appearance-none outline-none accent-indigo-400 shadow-inner"
          />
        </div>

        {/* Short Break Duration */}
        <div className="space-y-3 pt-3 border-t border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Coffee className="w-4 h-4 text-emerald-400 stroke-[2.2]" />
              <span className="text-xs font-bold text-slate-200 tracking-tight">Short Break</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-400/35 font-mono font-black text-xs text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.35)]">
              {pomodoroSettings.shortBreakMinutes} Minutes
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {shortBreakPresets.map((val) => (
              <button
                key={val}
                onClick={() => handlePomodoroChange('shortBreakMinutes', val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all active:scale-90 ${pomodoroSettings.shortBreakMinutes === val
                  ? 'bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-500 text-white shadow-[0_0_14px_rgba(16,185,129,0.6)] border border-emerald-300/60 font-black'
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
            className="w-full cursor-pointer h-2 rounded-full appearance-none outline-none accent-emerald-400 shadow-inner"
          />
        </div>

        {/* Long Break Duration */}
        <div className="space-y-3 pt-3 border-t border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Moon className="w-4 h-4 text-cyan-400 stroke-[2.2]" />
              <span className="text-xs font-bold text-slate-200 tracking-tight">Long Break</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/15 border border-cyan-400/35 font-mono font-black text-xs text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.35)]">
              {pomodoroSettings.longBreakMinutes} Minutes
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {longBreakPresets.map((val) => (
              <button
                key={val}
                onClick={() => handlePomodoroChange('longBreakMinutes', val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all active:scale-90 ${pomodoroSettings.longBreakMinutes === val
                  ? 'bg-gradient-to-tr from-cyan-600 via-cyan-500 to-blue-500 text-white shadow-[0_0_14px_rgba(6,182,212,0.6)] border border-cyan-300/60 font-black'
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
            className="w-full cursor-pointer h-2 rounded-full appearance-none outline-none accent-cyan-400 shadow-inner"
          />
        </div>

        {/* AUTOMATION & CYCLE FLOW */}
        <div className="space-y-4 pt-4 border-t border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 stroke-[2.2]" />
            <div>
              <span className="text-xs font-bold text-slate-200 tracking-tight">Cycle Flow & Automation</span>
              <p className="text-[11px] text-slate-400">Choose automatic continuous cycle or manual step-by-step</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Auto-start Breaks Card */}
            <div
              onClick={() => handleToggle('autoStartBreaks')}
              className={`cursor-pointer p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                pomodoroSettings.autoStartBreaks
                  ? 'bg-emerald-500/[0.08] border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                  : 'bg-white/[0.02] border-white/[0.08] hover:border-white/[0.15]'
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <Coffee className={`w-3.5 h-3.5 ${pomodoroSettings.autoStartBreaks ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold text-white">Auto-start Breaks</span>
                </div>
                <p className="text-[10.5px] text-slate-400 pt-0.5 leading-tight">
                  Start break immediately when focus sprint ends
                </p>
              </div>

              {/* Glowing Toggle Switch */}
              <div className={`w-10 h-5.5 rounded-full transition-colors relative p-0.5 shrink-0 ${
                pomodoroSettings.autoStartBreaks ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-700'
              }`}>
                <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform duration-200 shadow-md ${
                  pomodoroSettings.autoStartBreaks ? 'translate-x-4.5' : 'translate-x-0'
                }`} />
              </div>
            </div>

            {/* Auto-start Focus Card */}
            <div
              onClick={() => handleToggle('autoStartFocus')}
              className={`cursor-pointer p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                pomodoroSettings.autoStartFocus
                  ? 'bg-indigo-500/[0.08] border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                  : 'bg-white/[0.02] border-white/[0.08] hover:border-white/[0.15]'
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <Flame className={`w-3.5 h-3.5 ${pomodoroSettings.autoStartFocus ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold text-white">Auto-start Focus</span>
                </div>
                <p className="text-[10.5px] text-slate-400 pt-0.5 leading-tight">
                  Start next focus sprint immediately when break ends
                </p>
              </div>

              {/* Glowing Toggle Switch */}
              <div className={`w-10 h-5.5 rounded-full transition-colors relative p-0.5 shrink-0 ${
                pomodoroSettings.autoStartFocus ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-slate-700'
              }`}>
                <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform duration-200 shadow-md ${
                  pomodoroSettings.autoStartFocus ? 'translate-x-4.5' : 'translate-x-0'
                }`} />
              </div>
            </div>
          </div>

          {/* Long Break Interval Selector */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-xs font-bold text-slate-200 tracking-tight">Long Break Frequency</span>
              <p className="text-[10.5px] text-slate-400">Trigger long break after how many focus sessions</p>
            </div>

            <div className="flex items-center gap-1.5">
              {longBreakIntervalPresets.map((count) => (
                <button
                  key={count}
                  onClick={() => handleLongBreakIntervalChange(count)}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all active:scale-90 ${
                    (pomodoroSettings.longBreakInterval || 4) === count
                      ? 'bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.5)] border border-cyan-400/50'
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
        <div className="space-y-4 pt-4 border-t border-white/[0.08]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-400 stroke-[2.2]" />
              <div>
                <span className="text-xs font-bold text-slate-200 tracking-tight">Notification Sound & Alerts</span>
                <p className="text-[11px] text-slate-400">Play an uplifting chime when each focus & break session ends</p>
              </div>
            </div>

            {/* Sound Toggle Switch */}
            <div
              onClick={() => handleToggle('soundEnabled')}
              className={`cursor-pointer w-10 h-5.5 rounded-full transition-colors relative p-0.5 shrink-0 ${
                pomodoroSettings.soundEnabled ? 'bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]' : 'bg-slate-700'
              }`}
            >
              <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform duration-200 shadow-md ${
                pomodoroSettings.soundEnabled ? 'translate-x-4.5' : 'translate-x-0'
              }`} />
            </div>
          </div>

          {pomodoroSettings.soundEnabled && (
            <div className="space-y-3 pt-1 animate-in fade-in duration-200">
              {/* Sound Theme Selection Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {soundOptions.map((snd) => {
                  const isSelected = (pomodoroSettings.soundType ?? 'bell') === snd.id;
                  return (
                    <button
                      key={snd.id}
                      onClick={() => handleSoundTypeChange(snd.id)}
                      className={`p-2.5 rounded-2xl border text-left transition-all duration-150 active:scale-95 flex flex-col justify-between gap-1.5 ${
                        isSelected
                          ? 'bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-transparent border-indigo-400/50 shadow-[0_0_16px_rgba(99,102,241,0.25)]'
                          : 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.15] text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-base">{snd.icon}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 stroke-[3]" />}
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                          {snd.label}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {snd.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Volume Slider & Test Button Row */}
              <div className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-black/40 border border-white/[0.06]">
                <div className="flex items-center gap-2.5 flex-1">
                  {volumePercent === 0 ? (
                    <VolumeX className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-indigo-400 shrink-0" />
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
                    className="w-full cursor-pointer h-2 rounded-full appearance-none outline-none accent-indigo-400"
                  />
                  <span className="text-xs font-mono font-bold text-slate-300 w-10 text-right shrink-0">
                    {volumePercent}%
                  </span>
                </div>

                {/* Test Sound Button */}
                <button
                  onClick={handleTestSound}
                  disabled={isPlayingTest}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shrink-0 ${
                    isPlayingTest
                      ? 'bg-indigo-500 text-white border-indigo-400 shadow-[0_0_14px_rgba(99,102,241,0.6)]'
                      : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.12] text-indigo-300 hover:text-white'
                  }`}
                >
                  <Play className={`w-3 h-3 ${isPlayingTest ? 'fill-white animate-spin' : 'fill-indigo-300'}`} />
                  <span>{isPlayingTest ? 'Playing...' : 'Test Sound'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: GENERAL SETTINGS */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.12] bg-gradient-to-br from-[#12192B]/95 via-[#0D1322]/95 to-[#0A0E18]/98 backdrop-blur-2xl p-5 sm:p-6 shadow-[0_15px_35px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.12)] space-y-4">

        {/* Top Aurora Sheen Line */}
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent pointer-events-none" />

        {/* Ambient Corner Light Glow */}
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-white/[0.08]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/25 to-blue-500/35 border border-cyan-400/30 flex items-center justify-center shadow-[0_0_14px_rgba(6,182,212,0.35)] shrink-0">
            <User className="w-4.5 h-4.5 text-cyan-300 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-base font-black text-white tracking-tight leading-tight">General Preferences</h3>
            <p className="text-[11px] text-slate-400 font-medium">Personalize your identity and app defaults</p>
          </div>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {/* Display Name Row */}
          <div className="flex items-center justify-between py-3.5 gap-3">
            <div>
              <span className="text-xs font-bold text-slate-200">Display Name</span>
              <p className="text-[11px] text-slate-400">Shown in your daily greeting.</p>
            </div>
            <div className="relative flex items-center">
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none stroke-[2.2]" />
              <input
                type="text"
                value={profile.name}
                onChange={(e) => handleProfileNameChange(e.target.value)}
                placeholder="Enter name"
                className="w-36 sm:w-44 rounded-xl bg-[#080C18]/90 border border-white/[0.14] focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25 pl-8 pr-3 py-2 text-xs font-bold text-white shadow-inner transition-all outline-none"
              />
            </div>
          </div>

          {/* Daily Focus Goal Row */}
          <div className="flex items-center justify-between py-3.5 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-amber-400 stroke-[2.2]" />
                <span className="text-xs font-bold text-slate-200">Daily Focus Target</span>
              </div>
              <p className="text-[11px] text-slate-400">Target work sprint hours per day</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                value={profile.dailyFocusGoalMinutes / 60}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val > 0) {
                    handleFocusGoalChange(val * 60);
                  }
                }}
                className="w-16 rounded-xl bg-[#080C18]/90 border border-white/[0.14] focus:border-amber-400 focus:ring-2 focus:ring-amber-400/25 px-2 py-1.5 text-xs font-bold text-center text-white shadow-inner outline-none transition-all"
              />
              <span className="text-xs font-bold text-slate-400">hours</span>
            </div>
          </div>


          {/* Clear Timetable Row */}
          <div className="flex items-center justify-between py-3.5 gap-3">
            <div>
              <span className="text-xs font-bold text-slate-200">Clear Timetable</span>
              <p className="text-[11px] text-slate-400">Delete all scheduled items and start fresh</p>
            </div>
            {!showResetConfirm ? (
              <div className="p-[1.5px] rounded-xl bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 shadow-[0_0_16px_rgba(244,63,94,0.35)] shrink-0">
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="px-3.5 py-2 rounded-[10px] bg-[#0E1424] hover:bg-[#141C30] active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-400 stroke-[2.5]" />
                  <span className="bg-gradient-to-r from-white via-rose-100 to-rose-300 bg-clip-text text-transparent text-xs font-black whitespace-nowrap">
                    Clear
                  </span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                {/* Confirm Button with Radiant Rose-Amber Gradient Border */}
                <div className="p-[1.5px] rounded-xl bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 shadow-[0_0_16px_rgba(244,63,94,0.35)] shrink-0">
                  <button
                    onClick={handleClearSchedule}
                    className="px-3.5 py-2 rounded-[10px] bg-[#0E1424] hover:bg-[#1A121A] active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 text-rose-400 stroke-[2.8]" />
                    <span className="bg-gradient-to-r from-white via-rose-100 to-rose-300 bg-clip-text text-transparent text-xs font-black whitespace-nowrap">
                      Confirm
                    </span>
                  </button>
                </div>

                {/* Cancel Button with Matching Border */}
                <div className="p-[1.5px] rounded-xl bg-gradient-to-r from-slate-500/60 via-slate-400/50 to-slate-600/60 shadow-sm shrink-0">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-3.5 py-2 rounded-[10px] bg-[#0E1424] hover:bg-[#141C30] active:scale-95 text-slate-200 hover:text-white text-xs font-black transition-all flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5 text-slate-400 stroke-[2.5]" />
                    <span className="whitespace-nowrap">Cancel</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: CLOUD SYNCHRONIZATION & DATABASE */}
      <div className={`relative overflow-hidden rounded-3xl border transition-all duration-300 ${
        syncStatus === 'table_missing' 
          ? 'border-amber-500/40 bg-gradient-to-br from-amber-950/20 via-[#0D1322]/95 to-[#0A0E18]/98 shadow-[0_0_30px_rgba(245,158,11,0.15)]' 
          : 'border-white/[0.12] bg-gradient-to-br from-[#12192B]/95 via-[#0D1322]/95 to-[#0A0E18]/98'
      } backdrop-blur-2xl p-5 sm:p-6 shadow-[0_15px_35px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.12)] space-y-4`}>

        {/* Top Aurora Sheen Line */}
        <div className={`absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent ${
          syncStatus === 'table_missing' ? 'via-amber-400/70' : 'via-cyan-400/60'
        } to-transparent pointer-events-none`} />

        {/* Ambient Corner Light Glow */}
        <div className={`absolute -top-12 -right-12 w-44 h-44 ${
          syncStatus === 'table_missing' ? 'bg-amber-500/10' : 'bg-cyan-500/10'
        } rounded-full blur-3xl pointer-events-none`} />

        {/* Section Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/25 to-indigo-500/35 border border-cyan-400/30 flex items-center justify-center shadow-[0_0_14px_rgba(6,182,212,0.35)] shrink-0">
              <Cloud className="w-4.5 h-4.5 text-cyan-300 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-tight leading-tight">Cloud Sync & Database</h3>
              <p className="text-[11px] text-slate-400 font-medium">Cross-device routines backed by Supabase</p>
            </div>
          </div>

          {/* Quick Sync Button */}
          <button
            onClick={handleManualSync}
            disabled={isSyncingManual || syncStatus === 'table_missing'}
            className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
            title="Trigger instant sync"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncingManual ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isSyncingManual ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>

        {/* Status Card */}
        <div className="p-4 rounded-2xl bg-[#080C18]/80 border border-white/[0.08] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                syncStatus === 'synced' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]' :
                syncStatus === 'syncing' ? 'bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)] animate-pulse' :
                syncStatus === 'table_missing' ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)] animate-pulse' :
                syncStatus === 'error' ? 'bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.8)]' :
                'bg-slate-500'
              }`} />
              <span className="text-xs font-extrabold text-white">
                {syncStatus === 'synced' && 'Cloud Synchronized'}
                {syncStatus === 'syncing' && 'Syncing in Progress...'}
                {syncStatus === 'table_missing' && 'Database Table Setup Required'}
                {syncStatus === 'error' && 'Sync Error'}
                {syncStatus === 'local_only' && 'Local Offline Mode'}
                {syncStatus === 'idle' && 'Ready to Sync'}
              </span>
            </div>

            <span className="text-[11px] font-mono text-slate-400">
              {formatLastSync(lastSyncedAt)}
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            {syncStatus === 'synced' && 'All routines, timers, and shayaris are safely synced with your Supabase cloud database.'}
            {syncStatus === 'syncing' && 'Uploading latest local timetable changes to the remote database...'}
            {syncStatus === 'table_missing' && 'The required "user_data" table was not found in your Supabase database. Click "Database Setup (SQL)" below to copy the schema script.'}
            {syncStatus === 'error' && (syncError || 'Could not connect to Supabase. Check your internet connection.')}
            {syncStatus === 'local_only' && 'You are operating in local storage mode.'}
            {syncStatus === 'idle' && 'Changes are automatically debounced and synced to cloud in real-time.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={handleUploadToCloud}
            disabled={isUploading || syncStatus === 'table_missing'}
            className="px-3 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-bold text-slate-200 hover:text-white flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-40"
          >
            <UploadCloud className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">{isUploading ? 'Uploading...' : 'Push to Cloud'}</span>
          </button>

          <button
            onClick={handleRestoreFromCloud}
            disabled={isDownloading || syncStatus === 'table_missing'}
            className="px-3 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-bold text-slate-200 hover:text-white flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-40"
          >
            <DownloadCloud className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">{isDownloading ? 'Restoring...' : 'Pull from Cloud'}</span>
          </button>
        </div>

        {/* SQL Schema & Database Setup Card */}
        <div className={`mt-2 rounded-2xl border transition-all ${
          syncStatus === 'table_missing'
            ? 'border-amber-500/35 bg-[#0C111E]'
            : 'border-white/[0.08] bg-[#070A12]/60'
        }`}>
          <button
            onClick={() => setShowSqlSetup(!showSqlSetup)}
            className="w-full p-3.5 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2.5">
              <Database className={`w-4 h-4 ${syncStatus === 'table_missing' ? 'text-amber-400' : 'text-cyan-400'}`} />
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  Database Setup (SQL Script)
                  {syncStatus === 'table_missing' && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 uppercase">Action Needed</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400">Copy table schema & RLS policies for Supabase</div>
              </div>
            </div>
            {showSqlSetup ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showSqlSetup && (
            <div className="px-3.5 pb-4 pt-1 border-t border-white/[0.06] space-y-3 animate-in fade-in duration-200">
              {/* Instructions */}
              <div className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-[11px] text-cyan-200/90 leading-relaxed space-y-1">
                <p className="font-bold text-cyan-100 flex items-center gap-1.5">
                  <ExternalLink className="w-3 h-3 text-cyan-400" />
                  How to setup your Supabase database:
                </p>
                <ol className="list-decimal list-inside space-y-0.5 text-[10.5px] text-slate-300">
                  <li>Open your Supabase Project Dashboard</li>
                  <li>Click <span className="text-white font-semibold">SQL Editor</span> in the left sidebar</li>
                  <li>Click <span className="text-white font-semibold">New query</span>, paste the script below, and click <span className="text-emerald-400 font-semibold">Run</span></li>
                </ol>
              </div>

              {/* Copy SQL Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleCopySql}
                  className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                    copiedSql
                      ? 'bg-emerald-500 text-white border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                      : 'bg-indigo-600/30 hover:bg-indigo-600/50 border-indigo-500/40 text-indigo-200 hover:text-white'
                  }`}
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-indigo-300" />
                      <span>Copy SQL Schema</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code Preview */}
              <div className="relative rounded-xl bg-[#04060A] border border-white/[0.1] p-3 max-h-48 overflow-y-auto font-mono text-[10px] text-slate-300 leading-relaxed scrollbar-thin">
                <pre className="whitespace-pre">{SQL_SCHEMA_SCRIPT}</pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 4: ACCOUNT PROFILE */}
      {user && (
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.12] bg-gradient-to-br from-[#12192B]/95 via-[#0D1322]/95 to-[#0A0E18]/98 backdrop-blur-2xl p-5 sm:p-6 shadow-[0_15px_35px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.12)] space-y-4">
          <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none" />
          <div className="absolute -top-12 -left-12 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#070A12]/50 border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  {profile.name}
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] uppercase tracking-wider font-black">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    Connected
                  </span>
                </div>
                <div className="text-xs text-slate-400">{user.email}</div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs transition-colors border border-rose-500/20"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}

    </div>
  );
}
