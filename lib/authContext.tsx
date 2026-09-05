'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoadingAuth: boolean;
  isRecoveringPassword: boolean;
  recoveryError: string | null;
  resetEmail: string;
  openResetPassword: (email?: string) => void;
  clearRecovery: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoadingAuth: true,
  isRecoveringPassword: false,
  recoveryError: null,
  resetEmail: '',
  openResetPassword: () => {},
  clearRecovery: () => {},
});

function detectRecoveryState(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    const stored = sessionStorage.getItem('is_recovering_password') === 'true';
    return (
      stored ||
      hash.includes('type=recovery') ||
      hash.includes('update-password') ||
      search.includes('type=recovery') ||
      search.includes('update-password')
    );
  } catch {
    return false;
  }
}

function parseUrlTokens() {
  if (typeof window === 'undefined') {
    return { code: null, token_hash: null, accessToken: null, refreshToken: null, errorDesc: null };
  }

  const searchParams = new URLSearchParams(window.location.search);
  let code = searchParams.get('code');
  let token_hash = searchParams.get('token_hash');
  let errorDesc = searchParams.get('error_description') || searchParams.get('error');

  const hash = window.location.hash || '';
  let accessToken: string | null = null;
  let refreshToken: string | null = null;

  if (hash) {
    const qIndex = hash.indexOf('?');
    if (qIndex !== -1) {
      const hashSearchParams = new URLSearchParams(hash.slice(qIndex + 1));
      if (!code) code = hashSearchParams.get('code');
      if (!token_hash) token_hash = hashSearchParams.get('token_hash');
      if (!errorDesc) errorDesc = hashSearchParams.get('error_description') || hashSearchParams.get('error');
    }

    const cleanHash = hash.replace(/^#/, '').replace(/^update-password\??/, '').replace(/^update-password&?/, '');
    const directParams = new URLSearchParams(cleanHash);
    if (!code) code = directParams.get('code');
    if (!token_hash) token_hash = directParams.get('token_hash');
    if (!errorDesc) errorDesc = directParams.get('error_description') || directParams.get('error');
    accessToken = directParams.get('access_token');
    refreshToken = directParams.get('refresh_token');
  }

  return { code, token_hash, accessToken, refreshToken, errorDesc };
}

function getInitialRecoveryError() {
  const { errorDesc } = parseUrlTokens();
  return errorDesc ? decodeURIComponent(errorDesc.replace(/\+/g, ' ')) : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isRecoveringPassword, setIsRecoveringPassword] = useState(detectRecoveryState);
  const [recoveryError, setRecoveryError] = useState<string | null>(getInitialRecoveryError);

  const [resetEmail, setResetEmail] = useState<string>('');

  const openResetPassword = (email?: string) => {
    if (email) setResetEmail(email);
    setIsRecoveringPassword(true);
  };

  const clearRecovery = () => {
    setIsRecoveringPassword(false);
    setRecoveryError(null);
    setResetEmail('');
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('is_recovering_password');
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    const isRecovery = detectRecoveryState();
    if (isRecovery) {
      try {
        sessionStorage.setItem('is_recovering_password', 'true');
      } catch {
        // ignore
      }
    }

    const client = supabase;
    if (!client) {
      setTimeout(() => setIsLoadingAuth(false), 0);
      return;
    }

    const { code, token_hash, accessToken, refreshToken } = parseUrlTokens();

    // Auth state listener:
    // When Supabase processes the session (via detectSessionInUrl or manual exchange),
    // it triggers SIGNED_IN or PASSWORD_RECOVERY.
    const { data: { subscription } } = client.auth.onAuthStateChange(
      (event, currentSession) => {
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
        }

        if (event === 'PASSWORD_RECOVERY' || detectRecoveryState()) {
          setIsRecoveringPassword(true);
          try {
            sessionStorage.setItem('is_recovering_password', 'true');
          } catch {
            // ignore
          }
        }

        setIsLoadingAuth(false);
      }
    );

    const initAuth = async () => {
      try {
        if (code) {
          // PKCE code exchange
          const { data, error } = await client.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Failed to exchange code:', error.message);
            if (isRecovery) {
              setRecoveryError(error.message || 'Recovery link has expired or is invalid.');
            }
          } else if (data.session) {
            setSession(data.session);
            setUser(data.session.user);
            if (isRecovery) {
              setIsRecoveringPassword(true);
            }
          }
        } else if (token_hash && isRecovery) {
          // Token hash verification
          const { data, error } = await client.auth.verifyOtp({
            token_hash,
            type: 'recovery',
          });
          if (error) {
            console.error('Failed to verify recovery token:', error.message);
            setRecoveryError(error.message || 'Recovery link has expired or is invalid.');
          } else if (data.session) {
            setSession(data.session);
            setUser(data.session.user);
            setIsRecoveringPassword(true);
          }
        } else {
          // Check if session was already detected/established by Supabase
          const { data: { session: existingSession } } = await client.auth.getSession();
          if (existingSession) {
            setSession(existingSession);
            setUser(existingSession.user);
          } else if (accessToken) {
            // Only set session if Supabase did NOT automatically detect it
            const { data, error } = await client.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            if (!error && data.session) {
              setSession(data.session);
              setUser(data.session.user);
            } else if (error) {
              console.error('Session establishment error:', error.message);
              if (isRecovery) {
                // If token failed, getUser with access token directly as fallback
                const { data: userData } = await client.auth.getUser(accessToken);
                if (userData?.user) {
                  setUser(userData.user);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoadingAuth(false);
        // Clean URL from address bar if sensitive parameters were parsed
        if (
          typeof window !== 'undefined' &&
          (code || token_hash || accessToken || window.location.hash.includes('update-password') || window.location.hash.includes('access_token'))
        ) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    };

    initAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoadingAuth,
        isRecoveringPassword,
        recoveryError,
        resetEmail,
        openResetPassword,
        clearRecovery,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
