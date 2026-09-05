'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, User as UserIcon, Sparkles, KeyRound, UserPlus } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export function LoginScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Only for signup
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { updateProfile } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('Authentication is not configured.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isForgotPassword) {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}` : undefined,
        });
        if (resetError) throw resetError;
        setSuccess('Check your email for the password reset link.');
      } else if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              name: name.trim() || 'Hero',
            }
          }
        });
        if (signUpError) throw signUpError;
        
        if (data.user && !data.session) {
          setSuccess('Account created! Please check your email to verify your account.');
        } else {
          setSuccess('Account created successfully! Welcome aboard.');
          if (name.trim()) {
            updateProfile({ name: name.trim() });
          }
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setIsForgotPassword(false);
    setError(null);
    setSuccess(null);
  };

  const toggleForgotPassword = () => {
    setIsForgotPassword(!isForgotPassword);
    setIsSignUp(false);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080C16]/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-md relative">
        {/* Ambient atmospheric glows behind modal */}
        <div className="absolute -top-24 -left-20 w-72 h-72 bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-48 -right-20 w-80 h-80 bg-purple-600/12 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute bottom-36 left-10 w-72 h-72 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Main Login Card */}
        <div className="relative w-full max-w-md overflow-hidden rounded-[28px] bg-gradient-to-b from-[#141C32]/95 via-[#0E1424]/95 to-[#070A12]/95 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/[0.08] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-500 z-10">
          
          {/* Top Aurora Sheen */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="p-6 sm:p-8">
          <div className="text-center mb-8">
            {/* Top Icon Badge */}
            <div className="flex justify-center mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
                isForgotPassword
                  ? 'bg-amber-500/15 border-amber-400/30 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                  : isSignUp
                  ? 'bg-indigo-500/15 border-indigo-400/30 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.25)]'
                  : 'bg-cyan-500/15 border-cyan-400/30 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
              }`}>
                {isForgotPassword ? (
                  <KeyRound className="w-6 h-6 stroke-[2.2]" />
                ) : isSignUp ? (
                  <UserPlus className="w-6 h-6 stroke-[2.2]" />
                ) : (
                  <Sparkles className="w-6 h-6 stroke-[2.2]" />
                )}
              </div>
            </div>

            <h2 className="text-[28px] font-black text-white tracking-tight leading-tight">
              {isForgotPassword ? 'Reset Password' : isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-sm text-slate-400 mt-2 font-medium">
              {isForgotPassword
                ? 'Enter your email to receive a reset link'
                : isSignUp 
                ? 'Start tracking your daily routines and focus' 
                : 'Sign in to continue'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 ml-1">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/[0.05] border border-white/[0.14] text-white text-[15px] rounded-2xl focus:bg-white/[0.08] focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 block pl-12 p-3.5 backdrop-blur-xl transition-all placeholder:text-slate-500 shadow-inner [&:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s] [&:-webkit-autofill]:[-webkit-text-fill-color:white]"
                    placeholder="Bishow"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <UserIcon className="h-5 w-5 text-slate-400 stroke-[2]" />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 ml-1">Email Address</label>
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

            {!isForgotPassword && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-xs font-bold text-slate-300">Password</label>
                  {!isSignUp && (
                    <button 
                      type="button" 
                      onClick={toggleForgotPassword}
                      className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
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
            )}

            {error && (
              <div className="p-3 mt-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium animate-in slide-in-from-top-2">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 mt-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium animate-in slide-in-from-top-2">
                {success}
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
                      {isForgotPassword ? 'Send Reset Link' : isSignUp ? 'Create Account' : 'Sign In'}
                      <ArrowRight className="w-4.5 h-4.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          <div className="mt-8 text-center">
            {isForgotPassword ? (
              <p className="text-xs text-slate-400 font-medium">
                Remembered your password?{' '}
                <button 
                  type="button"
                  onClick={toggleForgotPassword}
                  className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors"
                >
                  Back to Sign In
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-400 font-medium">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button 
                  type="button"
                  onClick={toggleMode}
                  className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors"
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            )}
          </div>

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
