'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/authContext';

export function UpdatePasswordScreen() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { clearRecovery } = useAuth();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setError(null);
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;
      setSuccess(true);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to update password.');
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
              <h2 className="text-[28px] font-black text-white tracking-tight leading-tight">
                Update Password
              </h2>
              <p className="text-sm text-slate-400 mt-2 font-medium">
                Please enter a new password for your account.
              </p>
            </div>

            {success ? (
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 mb-2">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <p className="text-emerald-400 font-bold text-sm">
                  Your password has been successfully updated!
                </p>
                <div className="p-[1.5px] rounded-[18px] bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 relative group overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.15)] mt-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 opacity-60 blur-lg group-hover:opacity-100 transition-opacity duration-300" />
                  <button
                    onClick={clearRecovery}
                    className="relative w-full py-4 rounded-[16px] bg-[#0E1424] text-white font-bold text-[15px] tracking-wide shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 hover:bg-[#141C30] transition-colors"
                  >
                    Continue to App
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 ml-1">New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/[0.05] border border-white/[0.14] text-white text-[15px] rounded-2xl focus:bg-white/[0.08] focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 block pl-12 pr-12 p-3.5 backdrop-blur-xl transition-all placeholder:text-slate-500 shadow-inner [&:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s] [&:-webkit-autofill]:[-webkit-text-fill-color:white]"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 mt-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium animate-in slide-in-from-top-2">
                    {error}
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
                        'Update Password'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
