'use client';

import React, { useState } from 'react';
import { AppProvider } from '@/lib/store';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import { CurrentTaskCard } from '@/components/dashboard/CurrentTaskCard';
import { UpNextCard } from '@/components/dashboard/UpNextCard';
import { ShayariWidget } from '@/components/dashboard/ShayariWidget';
import { DailyAnalyticsAccordion } from '@/components/dashboard/DailyAnalyticsAccordion';
import { TimelineList } from '@/components/schedule/TimelineList';
import { SettingsView } from '@/components/settings/SettingsView';
import { useAuth } from '@/lib/authContext';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { UpdatePasswordScreen } from '@/components/auth/UpdatePasswordScreen';
import { Loader2 } from 'lucide-react';

function MobileAppContent() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'schedule' | 'settings'>('dashboard');
  const mainRef = React.useRef<HTMLElement>(null);

  const handleTabChange = (tab: 'dashboard' | 'schedule' | 'settings') => {
    setActiveTab(tab);
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  };

  return (
    <div className="min-h-screen bg-[#05070B] flex justify-center selection:bg-indigo-500 selection:text-white">
      
      {/* Mobile-Only Application Shell */}
      <div className="w-full max-w-md min-h-screen bg-[#080B11] border-x border-white/[0.06] flex flex-col relative shadow-2xl overflow-x-hidden">
        
        {/* Ambient atmospheric background glows */}
        <div className="absolute top-12 -left-20 w-72 h-72 bg-indigo-600/12 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-96 -right-20 w-80 h-80 bg-purple-600/10 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute bottom-36 left-10 w-72 h-72 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Sticky Mobile Top App Bar */}
        <MobileHeader onTimerClick={() => handleTabChange('dashboard')} />

        {/* Scrollable Main Mobile Content */}
        <main ref={mainRef} className="flex-1 px-4 py-4 pb-28 space-y-5 overflow-y-auto">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4 animate-tab-enter">

              {/* Active Task (Now with Integrated Pomodoro) */}
              <CurrentTaskCard />

              {/* Up Next Card */}
              <UpNextCard onViewSchedule={() => handleTabChange('schedule')} />

              {/* Daily Motivational Shayari */}
              <ShayariWidget />

              {/* Daily Progress Analytics Accordion */}
              <DailyAnalyticsAccordion />
            </div>
          )}

          {/* TAB 2: TIMETABLE SCHEDULE */}
          {activeTab === 'schedule' && (
            <div className="animate-tab-enter">
              <TimelineList />
            </div>
          )}

          {/* TAB 3: APP & POMODORO SETTINGS */}
          {activeTab === 'settings' && (
            <div className="animate-tab-enter">
              <SettingsView />
            </div>
          )}

        </main>

        {/* Pinned Mobile Bottom Navigation Bar (Dashboard, Timetable, Settings) */}
        <MobileBottomNav activeTab={activeTab} setActiveTab={handleTabChange} />

      </div>

    </div>
  );
}

function AuthGuard() {
  const { user, isLoadingAuth, isRecoveringPassword } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#05070B] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (isRecoveringPassword) {
    return <UpdatePasswordScreen />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <MobileAppContent />;
}

export default function Home() {
  return (
    <AppProvider>
      <AuthGuard />
    </AppProvider>
  );
}
