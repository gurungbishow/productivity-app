'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { ScheduleItem, UserProfile, PomodoroSettings, FocusSessionLog, PomodoroMode } from './types';
import { DEFAULT_SCHEDULE, parseTimeToMinutes } from './scheduleEngine';

interface AppContextType {
  isLoaded: boolean;
  profile: UserProfile;
  schedule: ScheduleItem[];
  completedTaskIds: string[];
  focusLogs: FocusSessionLog[];
  pomodoroSettings: PomodoroSettings;
  favoriteShayariIds: number[];
  userDefaultSchedule: ScheduleItem[];
  saveAsUserDefault: () => void;
  loadUserDefault: () => void;
  activeTaskForTimer: string | null;
  setActiveTaskForTimer: (taskName: string | null) => void;
  toggleTaskCompleted: (id: string) => boolean; // returns new completed status
  addScheduleItem: (item: { title: string; startTime: string; endTime: string; category?: ScheduleItem['category']; description?: string }) => void;
  updateScheduleItem: (id: string, updates: Partial<ScheduleItem>) => void;
  deleteScheduleItem: (id: string) => void;
  resetScheduleToDefault: () => void;
  clearSchedule: () => void;
  recordFocusSession: (durationMinutes: number, mode: PomodoroMode, associatedTask?: string) => void;
  updatePomodoroSettings: (updates: Partial<PomodoroSettings>) => void;
  toggleFavoriteShayari: (id: number) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  todayFocusMinutes: number;
  todayCompletedCount: number;
}

const STORAGE_KEYS = {
  PROFILE: 'bishow_productivity_profile_v1',
  SCHEDULE: 'bishow_productivity_schedule_v1',
  COMPLETED_TODAY: 'bishow_productivity_completed_today_v1',
  FOCUS_LOGS: 'bishow_productivity_focus_logs_v1',
  SETTINGS: 'bishow_productivity_settings_v1',
  FAVORITE_SHAYARIS: 'bishow_productivity_fav_shayaris_v1',
  USER_DEFAULT_SCHEDULE: 'bishow_productivity_user_default_v1',
};

const DEFAULT_PROFILE: UserProfile = {
  name: 'Bishow',
  dailyFocusGoalMinutes: 240, // 4 hours
  streak: 3,
  lastActiveDate: new Date().toISOString().split('T')[0],
};

const DEFAULT_SETTINGS: PomodoroSettings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  soundEnabled: true,
  ambientSound: 'none',
  ambientVolume: 0.25,
};

const AppContext = createContext<AppContextType | null>(null);

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [schedule, setSchedule] = useState<ScheduleItem[]>(DEFAULT_SCHEDULE);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [focusLogs, setFocusLogs] = useState<FocusSessionLog[]>([]);
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS);
  const [favoriteShayariIds, setFavoriteShayariIds] = useState<number[]>([]);
  const [userDefaultSchedule, setUserDefaultSchedule] = useState<ScheduleItem[]>([]);
  const [activeTaskForTimer, setActiveTaskForTimer] = useState<string | null>(null);

  // Initialize from LocalStorage
  useEffect(() => {
    try {
      const today = getTodayString();

      // Load Profile
      const savedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        // Check streak maintenance
        const lastDate = parsed.lastActiveDate;
        let streak = parsed.streak || 1;
        if (lastDate && lastDate !== today) {
          const last = new Date(lastDate).getTime();
          const curr = new Date(today).getTime();
          const dayDiff = Math.round((curr - last) / (1000 * 3600 * 24));
          if (dayDiff === 1) {
            // Continues streak
          } else if (dayDiff > 1) {
            streak = 1;
          }
        }
        setProfile({ ...parsed, streak, lastActiveDate: today });
      } else {
        setProfile({ ...DEFAULT_PROFILE, lastActiveDate: today });
      }

      // Load Schedule
      const savedSchedule = localStorage.getItem(STORAGE_KEYS.SCHEDULE);
      if (savedSchedule) {
        setSchedule(JSON.parse(savedSchedule));
      } else {
        setSchedule([]); // Start fresh for new users
      }

      // Load Today's Completed Tasks
      const savedCompleted = localStorage.getItem(STORAGE_KEYS.COMPLETED_TODAY);
      if (savedCompleted) {
        const { date, ids } = JSON.parse(savedCompleted);
        if (date === today) {
          setCompletedTaskIds(ids || []);
        } else {
          setCompletedTaskIds([]);
        }
      }

      // Load Focus Logs
      const savedLogs = localStorage.getItem(STORAGE_KEYS.FOCUS_LOGS);
      if (savedLogs) {
        setFocusLogs(JSON.parse(savedLogs));
      }

      // Load Settings
      const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (savedSettings) {
        setPomodoroSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      }

      // Load Favorites
      const savedFavs = localStorage.getItem(STORAGE_KEYS.FAVORITE_SHAYARIS);
      if (savedFavs) {
        setFavoriteShayariIds(JSON.parse(savedFavs));
      }

      // Load User Default Schedule
      const savedUserDefault = localStorage.getItem(STORAGE_KEYS.USER_DEFAULT_SCHEDULE);
      if (savedUserDefault) {
        setUserDefaultSchedule(JSON.parse(savedUserDefault));
      }
    } catch (err) {
      console.error('Failed to load storage state:', err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error(e);
    }
  }, [profile, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(schedule));
    } catch (e) {
      console.error(e);
    }
  }, [schedule, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      const today = getTodayString();
      localStorage.setItem(STORAGE_KEYS.COMPLETED_TODAY, JSON.stringify({ date: today, ids: completedTaskIds }));
    } catch (e) {
      console.error(e);
    }
  }, [completedTaskIds, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEYS.FOCUS_LOGS, JSON.stringify(focusLogs));
    } catch (e) {
      console.error(e);
    }
  }, [focusLogs, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(pomodoroSettings));
    } catch (e) {
      console.error(e);
    }
  }, [pomodoroSettings, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITE_SHAYARIS, JSON.stringify(favoriteShayariIds));
    } catch (e) {
      console.error(e);
    }
  }, [favoriteShayariIds, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEYS.USER_DEFAULT_SCHEDULE, JSON.stringify(userDefaultSchedule));
    } catch (e) {
      console.error(e);
    }
  }, [userDefaultSchedule, isLoaded]);

  const toggleTaskCompleted = useCallback((id: string): boolean => {
    let isNowCompleted = false;
    setCompletedTaskIds((prev) => {
      const exists = prev.includes(id);
      isNowCompleted = !exists;
      if (exists) {
        return prev.filter((i) => i !== id);
      } else {
        return [...prev, id];
      }
    });
    return isNowCompleted;
  }, []);

  const addScheduleItem = useCallback((item: { title: string; startTime: string; endTime: string; category?: ScheduleItem['category']; description?: string }) => {
    const startMinutes = parseTimeToMinutes(item.startTime);
    const endMinutes = parseTimeToMinutes(item.endTime);
    const newItem: ScheduleItem = {
      id: `custom-${Date.now()}`,
      title: item.title,
      description: item.description || '',
      startTime: item.startTime,
      endTime: item.endTime,
      startMinutes,
      endMinutes,
      category: item.category || 'deep_work',
      isDefault: false,
    };

    setSchedule((prev) => {
      const updated = [...prev, newItem].sort((a, b) => a.startMinutes - b.startMinutes);
      return updated;
    });
  }, []);

  const updateScheduleItem = useCallback((id: string, updates: Partial<ScheduleItem>) => {
    setSchedule((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...updates };
        if (updates.startTime) updated.startMinutes = parseTimeToMinutes(updates.startTime);
        if (updates.endTime) updated.endMinutes = parseTimeToMinutes(updates.endTime);
        return updated;
      })
    );
  }, []);

  const deleteScheduleItem = useCallback((id: string) => {
    setSchedule((prev) => prev.filter((i) => i.id !== id));
    setCompletedTaskIds((prev) => prev.filter((i) => i !== id));
  }, []);

  const resetScheduleToDefault = useCallback(() => {
    setSchedule(DEFAULT_SCHEDULE);
    setCompletedTaskIds([]);
  }, []);

  const clearSchedule = useCallback(() => {
    setSchedule([]);
    setCompletedTaskIds([]);
  }, []);

  const recordFocusSession = useCallback((durationMinutes: number, mode: PomodoroMode, associatedTask?: string) => {
    const newSession: FocusSessionLog = {
      id: `session-${Date.now()}`,
      timestamp: Date.now(),
      durationMinutes,
      mode,
      associatedTask,
    };
    setFocusLogs((prev) => [newSession, ...prev]);

    // Check streak
    setProfile((prev) => {
      const today = getTodayString();
      if (prev.lastActiveDate !== today) {
        return {
          ...prev,
          streak: prev.streak + 1,
          lastActiveDate: today,
        };
      }
      return prev;
    });
  }, []);

  const updatePomodoroSettings = useCallback((updates: Partial<PomodoroSettings>) => {
    setPomodoroSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const toggleFavoriteShayari = useCallback((id: number) => {
    setFavoriteShayariIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  }, []);

  const saveAsUserDefault = useCallback(() => {
    setUserDefaultSchedule(
      schedule.map(item => ({ ...item, id: crypto.randomUUID() }))
    );
  }, [schedule]);

  const loadUserDefault = useCallback(() => {
    if (userDefaultSchedule.length > 0) {
      setSchedule(userDefaultSchedule.map(item => ({ ...item, id: crypto.randomUUID() })));
      setCompletedTaskIds([]);
    }
  }, [userDefaultSchedule]);

  // Today's focus minutes
  const todayFocusMinutes = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startMs = startOfToday.getTime();

    return focusLogs
      .filter((log) => log.timestamp >= startMs && log.mode === 'work')
      .reduce((acc, curr) => acc + curr.durationMinutes, 0);
  }, [focusLogs]);

  const todayCompletedCount = completedTaskIds.length;

  return (
    <AppContext.Provider
      value={{
        isLoaded,
        profile,
        schedule,
        completedTaskIds,
        focusLogs,
        pomodoroSettings,
        favoriteShayariIds,
        activeTaskForTimer,
        setActiveTaskForTimer,
        toggleTaskCompleted,
        addScheduleItem,
        updateScheduleItem,
        deleteScheduleItem,
        resetScheduleToDefault,
        clearSchedule,
        recordFocusSession,
        updatePomodoroSettings,
        toggleFavoriteShayari,
        updateProfile,
        userDefaultSchedule,
        saveAsUserDefault,
        loadUserDefault,
        todayFocusMinutes,
        todayCompletedCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
}
