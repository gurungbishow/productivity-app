'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoadingAuth: boolean;
  isRecoveringPassword: boolean;
  clearRecovery: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoadingAuth: true,
  isRecoveringPassword: false,
  clearRecovery: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isRecoveringPassword, setIsRecoveringPassword] = useState(false);

  const clearRecovery = () => {
    setIsRecoveringPassword(false);
  };

  useEffect(() => {
    if (!supabase) {
      setTimeout(() => setIsLoadingAuth(false), 0);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user || null);
        
        if (event === 'PASSWORD_RECOVERY') {
          setIsRecoveringPassword(true);
        }
        
        setIsLoadingAuth(false);
      }
    );

    // Initial check
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user || null);
      setIsLoadingAuth(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, isLoadingAuth, isRecoveringPassword, clearRecovery }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
