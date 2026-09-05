'use client';

import React, { useState } from 'react';
import { supabase, getAppURL } from '@/lib/supabase';
import { Mail, Lock, Eye, EyeOff, Loader2, CheckCircle2, KeyRound, ArrowRight, Send } from 'lucide-react';
import { useAuth } from '@/lib/authContext';

export function UpdatePasswordScreen() {
  const { clearRecovery, recoveryError, resetEmail } = useAuth();

  const [email, setEmail] = useState(resetEmail || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSuccessMsg, setEmailSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const displayError = error || recoveryError;

  const handleSendResetEmail = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address first.');
      return;
    }
    if (!supabase) {
      setError('Authentication is not configured.');
      return;
    }
    setIsSendingEmail(true);
    setError(null);
    setEmailSuccessMsg(null);
    try {
      const redirectUrl = `${getAppURL()}/`;
      const { error: sendErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });
      if (sendErr) throw sendErr;
      setEmailSuccessMsg(`Password reset link sent to ${email.trim()}! Click "Reset Password" in the email to open ${getAppURL()} and set your new password.`);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to send reset email.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. If user already has an active session from recovery link, try client update first
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { error: clientError } = await supabase.auth.updateUser({ password });
          if (!clientError) {
            setSuccess(true);
            return;
          }
        }
      }

      // 2. Direct reset without email verification via backend API
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          newPassword: password,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to reset password.');
      }

      // Attempt immediate login with new credentials
      if (supabase) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (!signInErr) {
          clearRecovery();
          return;
        }
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070B] flex justify-center selection:bg-indigo-500 selection:text-white">
      {/* Mobile-Only Application Shell */}
      <div className="w-full max-w-md min-h-screen bg-[#080B11] border-x border-white/[0.06] flex flex-col items-center justify-center relative shadow-2xl overflow-x-hidden p-4 sm:p-6">
        {/* Ambient atmospheric background glows */}
        <div className="absolute top-12 -left-20 w-72 h-72 bg-indigo-600/12 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-96 -right-20 w-80 h-80 bg-purple-600/10 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute bottom-36 left-10 w-72 h-72 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Main Card */}
        <div className="relative w-full max-w-md overflow-hidden rounded-[28px] bg-gradient-to-b from-[#141C32]/95 via-[#0E1424]/95 to-[#070A12]/95 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/[0.08] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-500 z-10">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="p-6 sm:p-8">
            <div className="text-center mb-8">
              {/* Top Icon Badge */}
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center border bg-cyan-500/15 border-cyan-400/30 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
                  <KeyRound className="w-6 h-6 stroke-[2.2]" />
                </div>
              </div>

              <h2 className="text-[28px] font-black text-white tracking-tight leading-tight">
                Reset Password
              </h2>
              <p className="text-sm text-slate-400 mt-2 font-medium">
                Enter your account email and new password to reset it directly.
              </p>
            </div>

            {success ? (
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 mb-2">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <p className="text-emerald-400 font-bold text-sm">
                  Your password has been successfully reset!
                </p>
                <div className="p-[1.5px] rounded-[18px] bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 relative group overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.15)] mt-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 opacity-60 blur-lg group-hover:opacity-100 transition-opacity duration-300" />
                  <button
                    onClick={clearRecovery}
                    className="relative w-full py-4 rounded-[16px] bg-[#0E1424] text-white font-bold text-[15px] tracking-wide shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 hover:bg-[#141C30] transition-colors cursor-pointer"
                  >
                    Continue to Sign In
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 ml-1">Account Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/[0.05] border border-white/[0.14] text-white text-[15px] rounded-2xl focus:bg-white/[0.08] focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 block pl-12 p-3.5 backdrop-blur-xl transition-all placeholder:text-slate-500 shadow-inner [&:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s] [&:-webkit-autofill]:[-webkit-text-fill-color:white]"
                      placeholder="you@example.com"
                      required
                    />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <Mail className="h-5 w-5 text-slate-400 stroke-[2]" />
                    </div>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 ml-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/[0.05] border border-white/[0.14] text-white text-[15px] rounded-2xl focus:bg-white/[0.08] focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 block pl-12 pr-12 p-3.5 backdrop-blur-xl transition-all placeholder:text-slate-500 shadow-inner [&:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s] [&:-webkit-autofill]:[-webkit-text-fill-color:white]"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <Lock className="h-5 w-5 text-slate-400 stroke-[2]" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors z-10"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 ml-1">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-white/[0.05] border border-white/[0.14] text-white text-[15px] rounded-2xl focus:bg-white/[0.08] focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 block pl-12 pr-12 p-3.5 backdrop-blur-xl transition-all placeholder:text-slate-500 shadow-inner [&:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s] [&:-webkit-autofill]:[-webkit-text-fill-color:white]"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <Lock className="h-5 w-5 text-slate-400 stroke-[2]" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors z-10"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {emailSuccessMsg && (
                  <div className="p-3.5 mt-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium animate-in slide-in-from-top-2 leading-relaxed">
                    {emailSuccessMsg}
                  </div>
                )}

                {displayError && (
                  <div className="p-3 mt-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium animate-in slide-in-from-top-2 leading-relaxed">
                    {displayError}
                  </div>
                )}

                <div className="pt-5">
                  <div className="p-[1.5px] rounded-[18px] bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 relative group overflow-hidden shadow-[0_0_25px_rgba(6,182,212,0.25)]">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 opacity-60 blur-lg group-hover:opacity-100 transition-opacity duration-300" />
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="relative w-full py-4 rounded-[16px] bg-[#0E1424]/90 backdrop-blur-xl text-white font-bold text-[15px] tracking-wide shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 hover:bg-[#141C30]/95 active:scale-[0.99] transition-all disabled:opacity-80 cursor-pointer"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Reset Password
                          <ArrowRight className="w-4.5 h-4.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={handleSendResetEmail}
                    disabled={isSendingEmail}
                    className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSendingEmail ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Sending link...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Send reset link to email
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={clearRecovery}
                    className="text-slate-400 hover:text-white font-medium transition-colors cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* Form Footer */}
            <div className="mt-6 pt-4 border-t border-white/[0.06] text-center">
              <p className="text-xs text-slate-500 font-medium tracking-wider">
                My Daily Routine @ 2026
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
