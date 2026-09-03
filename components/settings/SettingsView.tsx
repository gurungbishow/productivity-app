'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import {
  Timer,
  User,
  Check,
  RotateCcw,
  Sparkles,
  Flame,
  Coffee,
  Moon,
  Target,
  ShieldCheck,
  X,
  Cloud,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabase';

export function SettingsView() {
  const {
    pomodoroSettings,
    updatePomodoroSettings,
    profile,
    updateProfile,
    clearSchedule,
  } = useAppStore();

  const { user, session } = useAuth();

  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const showNotification = (msg: string) => {
    setSavedMessage(msg);
    setTimeout(() => setSavedMessage(null), 2500);
  };

  const handlePomodoroChange = (key: 'workMinutes' | 'shortBreakMinutes' | 'longBreakMinutes', val: number) => {
    const clamped = Math.max(1, Math.min(180, val));
    updatePomodoroSettings({ [key]: clamped });
    showNotification('Timer preferences updated');
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

  const workPresets = [15, 25, 45, 50, 60];
  const shortBreakPresets = [3, 5, 8, 10];
  const longBreakPresets = [10, 15, 20, 30];
  const focusGoalPresets = [120, 180, 240, 360, 480]; // 2h, 3h, 4h, 6h, 8h

  // Calculate slider percentage fills for sleek dynamic gradient tracks
  const workPercent = Math.min(100, Math.max(0, ((pomodoroSettings.workMinutes - 5) / (90 - 5)) * 100));
  const shortBreakPercent = Math.min(100, Math.max(0, ((pomodoroSettings.shortBreakMinutes - 1) / (20 - 1)) * 100));
  const longBreakPercent = Math.min(100, Math.max(0, ((pomodoroSettings.longBreakMinutes - 5) / (45 - 5)) * 100));

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
