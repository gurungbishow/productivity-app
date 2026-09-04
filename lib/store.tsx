'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { ScheduleItem, UserProfile, PomodoroSettings, FocusSessionLog, PomodoroMode, GlobalPomodoroState } from './types';
import { DEFAULT_SCHEDULE, parseTimeToMinutes, sortScheduleAscending } from './scheduleEngine';
import { triggerConfetti, playTimerEndSound, sendNotificationSafe } from './utils';
import { useAuth } from './authContext';
import {
  fetchUserDataFromCloud,
  saveUserDataToCloud,
  subscribeToUserDataChanges,
  SyncStatus,
  UserDataPayload,
} from './syncService';

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
  timerState: GlobalPomodoroState;
  displayTime: number;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  skipSession: () => void;
  changeMode: (mode: PomodoroMode) => void;
  // Cloud sync properties
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  syncError: string | null;
  syncNow: () => Promise<void>;
  uploadToCloud: () => Promise<boolean>;
  downloadFromCloud: () => Promise<boolean>;
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
  soundType: 'bell',
  soundVolume: 0.8,
  autoStartBreaks: true,
  autoStartFocus: true,
  longBreakInterval: 4,
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

  // Global Pomodoro State
  const [timerState, setTimerState] = useState<GlobalPomodoroState>({
    status: 'idle',
    mode: 'work',
    durationSeconds: DEFAULT_SETTINGS.workMinutes * 60,
    endTime: null,
    pausedRemainingSeconds: null,
    sessionNumber: 1,
    notificationSent: false,
  });
  const [displayTime, setDisplayTime] = useState<number>(DEFAULT_SETTINGS.workMinutes * 60);

  // Silent audio for background activity
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      silentAudioRef.current = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
      silentAudioRef.current.loop = true;
    }
  }, []);

  // Sync state reference to handle callbacks cleanly
  const timerStateRef = useRef<GlobalPomodoroState>(timerState);
  useEffect(() => {
    timerStateRef.current = timerState;
  }, [timerState]);

  // Initialize from LocalStorage
  useEffect(() => {
    const initTimer = setTimeout(() => {
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
        setProfile({
          ...DEFAULT_PROFILE,
          ...parsed,
          dailyFocusGoalMinutes:
            typeof parsed.dailyFocusGoalMinutes === 'number' && parsed.dailyFocusGoalMinutes > 0
              ? parsed.dailyFocusGoalMinutes
              : DEFAULT_PROFILE.dailyFocusGoalMinutes,
          streak,
          lastActiveDate: today,
        });
      } else {
        setProfile({ ...DEFAULT_PROFILE, lastActiveDate: today });
      }

      // Load Schedule
      const savedSchedule = localStorage.getItem(STORAGE_KEYS.SCHEDULE);
      if (savedSchedule) {
        try {
          const parsed = JSON.parse(savedSchedule);
          if (Array.isArray(parsed)) {
            setSchedule(sortScheduleAscending(parsed));
          } else {
            setSchedule([]);
          }
        } catch {
          setSchedule([]);
        }
      } else {
        setSchedule(sortScheduleAscending(DEFAULT_SCHEDULE));
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
        try {
          const parsed = JSON.parse(savedUserDefault);
          if (Array.isArray(parsed)) {
            setUserDefaultSchedule(sortScheduleAscending(parsed));
          }
        } catch {}
      }

      // Load Pomodoro Global State
      const savedTimerState = localStorage.getItem('pomodoro-state');
      if (savedTimerState) {
        const parsed = JSON.parse(savedTimerState) as GlobalPomodoroState;
        
        let initialDisplay = parsed.durationSeconds > 0 ? parsed.durationSeconds : (DEFAULT_SETTINGS.workMinutes * 60);
        
        if (parsed.status === 'running' && parsed.endTime) {
          const remainingMs = parsed.endTime - Date.now();
          if (remainingMs > 0) {
            initialDisplay = Math.ceil(remainingMs / 1000);
          } else {
            // Timer expired while app/browser was closed or asleep
            parsed.status = 'idle';
            parsed.endTime = null;
            parsed.pausedRemainingSeconds = null;
            parsed.notificationSent = false;
            initialDisplay = parsed.durationSeconds > 0 ? parsed.durationSeconds : (DEFAULT_SETTINGS.workMinutes * 60);
          }
        } else if (parsed.status === 'paused') {
          if (parsed.pausedRemainingSeconds !== null && parsed.pausedRemainingSeconds > 0) {
            initialDisplay = parsed.pausedRemainingSeconds;
          } else {
            parsed.status = 'idle';
            parsed.pausedRemainingSeconds = null;
            initialDisplay = parsed.durationSeconds > 0 ? parsed.durationSeconds : (DEFAULT_SETTINGS.workMinutes * 60);
          }
        }

        // Always unlatch notificationSent on fresh load
        parsed.notificationSent = false;

        setTimerState(parsed);
        setDisplayTime(initialDisplay);
      }
      setIsLoaded(true);
    } catch (error) {
      console.error('Failed to load from LocalStorage', error);
      setIsLoaded(true); // Still load to not break app
    }
    }, 0);
    return () => clearTimeout(initTimer);
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

  // Persist Pomodoro State whenever it changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('pomodoro-state', JSON.stringify(timerState));
    } catch (e) {
      console.error(e);
    }
  }, [timerState, isLoaded]);

  // --- Cloud Sync Integration ---
  const { user, isLoadingAuth } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const syncStatusRef = useRef<SyncStatus>(syncStatus);
  useEffect(() => {
    syncStatusRef.current = syncStatus;
  }, [syncStatus]);

  // Keep live refs of current values to avoid stale closures in sync callbacks
  const profileRef = useRef(profile);
  useEffect(() => { profileRef.current = profile; }, [profile]);

  const scheduleRef = useRef(schedule);
  useEffect(() => { scheduleRef.current = schedule; }, [schedule]);

  const userDefaultScheduleRef = useRef(userDefaultSchedule);
  useEffect(() => { userDefaultScheduleRef.current = userDefaultSchedule; }, [userDefaultSchedule]);

  const completedTaskIdsRef = useRef(completedTaskIds);
  useEffect(() => { completedTaskIdsRef.current = completedTaskIds; }, [completedTaskIds]);

  const focusLogsRef = useRef(focusLogs);
  useEffect(() => { focusLogsRef.current = focusLogs; }, [focusLogs]);

  const pomodoroSettingsRef = useRef(pomodoroSettings);
  useEffect(() => { pomodoroSettingsRef.current = pomodoroSettings; }, [pomodoroSettings]);

  const favoriteShayariIdsRef = useRef(favoriteShayariIds);
  useEffect(() => { favoriteShayariIdsRef.current = favoriteShayariIds; }, [favoriteShayariIds]);

  const isHydratingFromRemoteRef = useRef(false);
  const initialCloudLoadDoneRef = useRef(false);

  // Hydrate from Cloud when authenticated
  const hydrateFromCloud = useCallback(async (userId: string) => {
    setSyncStatus('syncing');
    setSyncError(null);

    const result = await fetchUserDataFromCloud(userId);

    if (result.status === 'table_missing') {
      setSyncStatus('table_missing');
      setSyncError(result.error || 'Database table public.user_data not found in Supabase.');
      initialCloudLoadDoneRef.current = true;
      return;
    }

    if (result.status === 'error') {
      setSyncStatus('error');
      setSyncError(result.error || 'Failed to connect to Supabase.');
      initialCloudLoadDoneRef.current = true;
      return;
    }

    if (result.status === 'no_client') {
      setSyncStatus('local_only');
      initialCloudLoadDoneRef.current = true;
      return;
    }

    if (result.status === 'not_found') {
      // First time user in database!
      // If this device has local schedule items (e.g. created on mobile), upload immediately!
      const currentSchedule = scheduleRef.current;
      const currentDefault = userDefaultScheduleRef.current;
      if (currentSchedule.length > 0 || currentDefault.length > 0) {
        const payload: UserDataPayload = {
          profile: profileRef.current,
          schedule: currentSchedule,
          user_default_schedule: currentDefault,
          completed_tasks: { date: getTodayString(), ids: completedTaskIdsRef.current },
          focus_logs: focusLogsRef.current,
          pomodoro_settings: pomodoroSettingsRef.current,
          favorite_shayari_ids: favoriteShayariIdsRef.current,
        };
        const saveRes = await saveUserDataToCloud(userId, payload);
        if (saveRes.status === 'success') {
          setSyncStatus('synced');
          setLastSyncedAt(saveRes.updatedAt || new Date().toISOString());
        } else if (saveRes.status === 'table_missing') {
          setSyncStatus('table_missing');
          setSyncError(saveRes.error || 'Database table missing');
        } else {
          setSyncStatus('error');
        }
      } else {
        setSyncStatus('synced');
        setLastSyncedAt(new Date().toISOString());
      }
      initialCloudLoadDoneRef.current = true;
      return;
    }

    if (result.status === 'success' && result.data) {
      const cloudData = result.data;
      const localSchedule = scheduleRef.current;

      // Smart check: If local has items (e.g. mobile created routine), but cloud has 0 items:
      if (localSchedule.length > 0 && cloudData.schedule.length === 0) {
        // Push local schedule up to cloud to protect mobile data
        const payload: UserDataPayload = {
          profile: profileRef.current,
          schedule: localSchedule,
          user_default_schedule: userDefaultScheduleRef.current.length > 0 ? userDefaultScheduleRef.current : cloudData.user_default_schedule,
          completed_tasks: { date: getTodayString(), ids: completedTaskIdsRef.current },
          focus_logs: focusLogsRef.current.length > 0 ? focusLogsRef.current : cloudData.focus_logs,
          pomodoro_settings: pomodoroSettingsRef.current,
          favorite_shayari_ids: favoriteShayariIdsRef.current.length > 0 ? favoriteShayariIdsRef.current : cloudData.favorite_shayari_ids,
        };
        await saveUserDataToCloud(userId, payload);
        setSyncStatus('synced');
        setLastSyncedAt(new Date().toISOString());
      } else {
        // Cloud has schedule: Hydrate local state from cloud!
        isHydratingFromRemoteRef.current = true;

        if (cloudData.profile && cloudData.profile.name) {
          setProfile(prev => ({
            ...prev,
            ...cloudData.profile,
            dailyFocusGoalMinutes:
              typeof cloudData.profile.dailyFocusGoalMinutes === 'number' && cloudData.profile.dailyFocusGoalMinutes > 0
                ? cloudData.profile.dailyFocusGoalMinutes
                : (prev.dailyFocusGoalMinutes || DEFAULT_PROFILE.dailyFocusGoalMinutes),
          }));
        }
        if (Array.isArray(cloudData.schedule)) {
          setSchedule(sortScheduleAscending(cloudData.schedule));
        }
        if (Array.isArray(cloudData.user_default_schedule)) {
          setUserDefaultSchedule(sortScheduleAscending(cloudData.user_default_schedule));
        }
        if (cloudData.completed_tasks && cloudData.completed_tasks.date === getTodayString()) {
          setCompletedTaskIds(cloudData.completed_tasks.ids || []);
        }
        if (Array.isArray(cloudData.focus_logs) && cloudData.focus_logs.length > 0) {
          setFocusLogs(cloudData.focus_logs);
        }
        if (cloudData.pomodoro_settings && Object.keys(cloudData.pomodoro_settings).length > 0) {
          setPomodoroSettings(prev => ({ ...prev, ...cloudData.pomodoro_settings }));
        }
        if (Array.isArray(cloudData.favorite_shayari_ids)) {
          setFavoriteShayariIds(cloudData.favorite_shayari_ids);
        }

        setTimeout(() => {
          isHydratingFromRemoteRef.current = false;
        }, 500);

        setSyncStatus('synced');
        setLastSyncedAt(cloudData.updated_at || new Date().toISOString());
      }
      initialCloudLoadDoneRef.current = true;
    }
  }, []);

  // Initial fetch on login / auth resolution
  useEffect(() => {
    if (isLoadingAuth) return;
    const timer = setTimeout(() => {
      if (user && isLoaded) {
        hydrateFromCloud(user.id);
      } else if (!user) {
        setSyncStatus('local_only');
        initialCloudLoadDoneRef.current = false;
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [user, isLoadingAuth, isLoaded, hydrateFromCloud]);

  // Realtime subscription for cross-device updates
  const userId = user?.id;
  const isTableMissing = syncStatus === 'table_missing';
  useEffect(() => {
    if (!userId || isTableMissing) return;

    const unsubscribe = subscribeToUserDataChanges(userId, (remoteData) => {
      isHydratingFromRemoteRef.current = true;
      if (Array.isArray(remoteData.schedule)) {
        setSchedule(sortScheduleAscending(remoteData.schedule));
      }
      if (Array.isArray(remoteData.user_default_schedule)) {
        setUserDefaultSchedule(sortScheduleAscending(remoteData.user_default_schedule));
      }
      if (remoteData.profile && remoteData.profile.name) {
        setProfile(prev => ({
          ...prev,
          ...remoteData.profile,
          dailyFocusGoalMinutes:
            typeof remoteData.profile.dailyFocusGoalMinutes === 'number' && remoteData.profile.dailyFocusGoalMinutes > 0
              ? remoteData.profile.dailyFocusGoalMinutes
              : (prev.dailyFocusGoalMinutes || DEFAULT_PROFILE.dailyFocusGoalMinutes),
        }));
      }
      if (remoteData.completed_tasks && remoteData.completed_tasks.date === getTodayString()) {
        setCompletedTaskIds(remoteData.completed_tasks.ids || []);
      }
      if (Array.isArray(remoteData.focus_logs)) {
        setFocusLogs(remoteData.focus_logs);
      }
      if (remoteData.pomodoro_settings && Object.keys(remoteData.pomodoro_settings).length > 0) {
        setPomodoroSettings(prev => ({ ...prev, ...remoteData.pomodoro_settings }));
      }
      if (Array.isArray(remoteData.favorite_shayari_ids)) {
        setFavoriteShayariIds(remoteData.favorite_shayari_ids);
      }

      setSyncStatus('synced');
      setLastSyncedAt(remoteData.updated_at || new Date().toISOString());

      setTimeout(() => {
        isHydratingFromRemoteRef.current = false;
      }, 500);
    });

    return () => {
      unsubscribe();
    };
  }, [userId, isTableMissing]);

  // Auto-sync debounced changes to Supabase
  useEffect(() => {
    if (!isLoaded || !user || !initialCloudLoadDoneRef.current || isHydratingFromRemoteRef.current) {
      return;
    }
    if (syncStatusRef.current === 'table_missing') return;

    const debounceTimer = setTimeout(async () => {
      setSyncStatus('syncing');
      const payload: UserDataPayload = {
        profile,
        schedule,
        user_default_schedule: userDefaultSchedule,
        completed_tasks: { date: getTodayString(), ids: completedTaskIds },
        focus_logs: focusLogs,
        pomodoro_settings: pomodoroSettings,
        favorite_shayari_ids: favoriteShayariIds,
      };

      const res = await saveUserDataToCloud(user.id, payload);
      if (res.status === 'success') {
        setSyncStatus('synced');
        setLastSyncedAt(res.updatedAt || new Date().toISOString());
        setSyncError(null);
      } else if (res.status === 'table_missing') {
        setSyncStatus('table_missing');
        setSyncError(res.error || 'Table public.user_data missing in Supabase');
      } else if (res.status === 'error') {
        setSyncStatus('error');
        setSyncError(res.error || 'Failed to sync with cloud');
      }
    }, 800);

    return () => clearTimeout(debounceTimer);
  }, [
    profile,
    schedule,
    completedTaskIds,
    focusLogs,
    pomodoroSettings,
    favoriteShayariIds,
    userDefaultSchedule,
    user,
    isLoaded,
  ]);

  // Refetch newer data when tab gains focus
  useEffect(() => {
    const handleFocus = () => {
      if (user && syncStatusRef.current !== 'table_missing' && !isHydratingFromRemoteRef.current) {
        fetchUserDataFromCloud(user.id).then((res) => {
          if (res.status === 'success' && res.data && res.data.updated_at) {
            const remoteTime = new Date(res.data.updated_at).getTime();
            const localTime = lastSyncedAt ? new Date(lastSyncedAt).getTime() : 0;
            if (remoteTime > localTime) {
              isHydratingFromRemoteRef.current = true;
              if (Array.isArray(res.data.schedule)) setSchedule(sortScheduleAscending(res.data.schedule));
              if (Array.isArray(res.data.user_default_schedule)) setUserDefaultSchedule(sortScheduleAscending(res.data.user_default_schedule));
              if (res.data.profile) {
                setProfile((prev) => ({
                  ...prev,
                  ...res.data!.profile,
                  dailyFocusGoalMinutes:
                    typeof res.data!.profile.dailyFocusGoalMinutes === 'number' && res.data!.profile.dailyFocusGoalMinutes > 0
                      ? res.data!.profile.dailyFocusGoalMinutes
                      : (prev.dailyFocusGoalMinutes || DEFAULT_PROFILE.dailyFocusGoalMinutes),
                }));
              }
              if (res.data.completed_tasks && res.data.completed_tasks.date === getTodayString()) {
                setCompletedTaskIds(res.data.completed_tasks.ids || []);
              }
              if (Array.isArray(res.data.focus_logs)) setFocusLogs(res.data.focus_logs);
              if (res.data.pomodoro_settings) setPomodoroSettings((prev) => ({ ...prev, ...res.data!.pomodoro_settings }));
              if (Array.isArray(res.data.favorite_shayari_ids)) setFavoriteShayariIds(res.data.favorite_shayari_ids);

              setTimeout(() => {
                isHydratingFromRemoteRef.current = false;
              }, 500);
              setSyncStatus('synced');
              setLastSyncedAt(res.data.updated_at);
            }
          }
        });
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, lastSyncedAt]);

  // Manual actions
  const uploadToCloud = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    setSyncStatus('syncing');
    setSyncError(null);
    const payload: UserDataPayload = {
      profile: profileRef.current,
      schedule: sortScheduleAscending(scheduleRef.current),
      user_default_schedule: sortScheduleAscending(userDefaultScheduleRef.current),
      completed_tasks: { date: getTodayString(), ids: completedTaskIdsRef.current },
      focus_logs: focusLogsRef.current,
      pomodoro_settings: pomodoroSettingsRef.current,
      favorite_shayari_ids: favoriteShayariIdsRef.current,
    };
    const res = await saveUserDataToCloud(user.id, payload);
    if (res.status === 'success') {
      setSyncStatus('synced');
      setLastSyncedAt(res.updatedAt || new Date().toISOString());
      return true;
    } else if (res.status === 'table_missing') {
      setSyncStatus('table_missing');
      setSyncError(res.error || 'Database table public.user_data not found');
      return false;
    } else {
      setSyncStatus('error');
      setSyncError(res.error || 'Upload failed');
      return false;
    }
  }, [user]);

  const downloadFromCloud = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    setSyncStatus('syncing');
    setSyncError(null);
    const res = await fetchUserDataFromCloud(user.id);
    if (res.status === 'success' && res.data) {
      isHydratingFromRemoteRef.current = true;
      if (Array.isArray(res.data.schedule)) setSchedule(sortScheduleAscending(res.data.schedule));
      if (Array.isArray(res.data.user_default_schedule)) setUserDefaultSchedule(sortScheduleAscending(res.data.user_default_schedule));
      if (res.data.profile && res.data.profile.name) {
        setProfile((prev) => ({
          ...prev,
          ...res.data!.profile,
          dailyFocusGoalMinutes:
            typeof res.data!.profile.dailyFocusGoalMinutes === 'number' && res.data!.profile.dailyFocusGoalMinutes > 0
              ? res.data!.profile.dailyFocusGoalMinutes
              : (prev.dailyFocusGoalMinutes || DEFAULT_PROFILE.dailyFocusGoalMinutes),
        }));
      }
      if (res.data.completed_tasks && res.data.completed_tasks.date === getTodayString()) {
        setCompletedTaskIds(res.data.completed_tasks.ids || []);
      }
      if (Array.isArray(res.data.focus_logs)) setFocusLogs(res.data.focus_logs);
      if (res.data.pomodoro_settings && Object.keys(res.data.pomodoro_settings).length > 0) {
        setPomodoroSettings((prev) => ({ ...prev, ...res.data!.pomodoro_settings }));
      }
      if (Array.isArray(res.data.favorite_shayari_ids)) setFavoriteShayariIds(res.data.favorite_shayari_ids);

      setTimeout(() => {
        isHydratingFromRemoteRef.current = false;
      }, 500);

      setSyncStatus('synced');
      setLastSyncedAt(res.data.updated_at || new Date().toISOString());
      return true;
    } else if (res.status === 'table_missing') {
      setSyncStatus('table_missing');
      setSyncError(res.error || 'Database table public.user_data not found');
      return false;
    } else {
      setSyncStatus('error');
      setSyncError(res.error || 'Download failed');
      return false;
    }
  }, [user]);

  const syncNow = useCallback(async () => {
    if (!user) return;
    await hydrateFromCloud(user.id);
  }, [user, hydrateFromCloud]);

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
      const updated = sortScheduleAscending([...prev, newItem]);
      return updated;
    });
  }, []);

  const updateScheduleItem = useCallback((id: string, updates: Partial<ScheduleItem>) => {
    setSchedule((prev) => {
      const updated = prev.map((item) => {
        if (item.id !== id) return item;
        const newItem = { ...item, ...updates };
        if (updates.startTime) newItem.startMinutes = parseTimeToMinutes(updates.startTime);
        if (updates.endTime) newItem.endMinutes = parseTimeToMinutes(updates.endTime);
        return newItem;
      });
      return sortScheduleAscending(updated);
    });
  }, []);

  const deleteScheduleItem = useCallback((id: string) => {
    setSchedule((prev) => prev.filter((i) => i.id !== id));
    setCompletedTaskIds((prev) => prev.filter((i) => i !== id));
  }, []);

  const resetScheduleToDefault = useCallback(() => {
    setSchedule(sortScheduleAscending(DEFAULT_SCHEDULE));
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
      sortScheduleAscending(schedule.map(item => ({ ...item, id: crypto.randomUUID() })))
    );
  }, [schedule]);

  const loadUserDefault = useCallback(() => {
    if (userDefaultSchedule.length > 0) {
      setSchedule(sortScheduleAscending(userDefaultSchedule.map(item => ({ ...item, id: crypto.randomUUID() }))));
      setCompletedTaskIds([]);
    }
  }, [userDefaultSchedule]);

  // --- Pomodoro Global Timer Engine ---
  
  const getModeDurationSeconds = useCallback((targetMode: PomodoroMode): number => {
    switch (targetMode) {
      case 'work': return pomodoroSettings.workMinutes * 60;
      case 'short_break': return pomodoroSettings.shortBreakMinutes * 60;
      case 'long_break': return pomodoroSettings.longBreakMinutes * 60;
    }
  }, [pomodoroSettings]);

  // Request Notification Permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      try {
        await Notification.requestPermission();
      } catch {}
    }
  };

  // Trigger Completion
  const activeTaskRef = useRef(activeTaskForTimer);
  useEffect(() => { activeTaskRef.current = activeTaskForTimer; }, [activeTaskForTimer]);

  const handleTimerCompletion = useCallback((state: GlobalPomodoroState) => {
    if (state.notificationSent) return;
    // Latch synchronously to prevent duplicate calls during the 250ms tick interval
    timerStateRef.current = { ...timerStateRef.current, notificationSent: true };

    const maxSessions = pomodoroSettings.longBreakInterval || 4;

    if (state.mode === 'work') {
      const currentSession = state.sessionNumber;
      const isLongBreak = currentSession >= maxSessions;
      const nextMode: PomodoroMode = isLongBreak ? 'long_break' : 'short_break';
      const nextDuration = (isLongBreak ? pomodoroSettings.longBreakMinutes : pomodoroSettings.shortBreakMinutes) * 60;
      const shouldAutoStart = Boolean(pomodoroSettings.autoStartBreaks);

      const nextStatus: 'running' | 'idle' = shouldAutoStart ? 'running' : 'idle';
      const nextEndTime = shouldAutoStart ? Date.now() + nextDuration * 1000 : null;

      // 1. Guaranteed state transition first
      setTimerState(prev => ({
        ...prev,
        status: nextStatus,
        mode: nextMode,
        sessionNumber: currentSession,
        durationSeconds: nextDuration,
        endTime: nextEndTime,
        pausedRemainingSeconds: null,
        notificationSent: false
      }));
      setDisplayTime(nextDuration);

      // 2. Safe side-effects (cannot crash or block the timer)
      try {
        recordFocusSession(pomodoroSettings.workMinutes, 'work', activeTaskRef.current || 'Self Directed Focus');
      } catch (e) {
        console.error('Failed to record focus session', e);
      }

      try {
        triggerConfetti();
      } catch (e) {
        console.error('Failed to trigger confetti', e);
      }

      if (pomodoroSettings.soundEnabled) {
        try {
          playTimerEndSound(pomodoroSettings.soundType, pomodoroSettings.soundVolume);
        } catch (e) {
          console.error('Failed to play timer end sound', e);
        }
      }

      const title = isLongBreak ? 'Focus Milestone Reached! 🌟' : 'Focus Sprint Complete! 🎉';
      const body = isLongBreak
        ? `Session ${currentSession} of ${maxSessions} complete. ${shouldAutoStart ? 'Long break timer started.' : 'Time for a long break.'}`
        : `Session ${currentSession} of ${maxSessions} complete. ${shouldAutoStart ? 'Break timer started.' : 'Take a short break.'}`;
      sendNotificationSafe(title, { body, icon: '/icon-192x192.png' });

    } else {
      const breakDuration = state.mode === 'short_break' ? pomodoroSettings.shortBreakMinutes : pomodoroSettings.longBreakMinutes;
      const nextSession = state.mode === 'short_break' && state.sessionNumber < maxSessions
        ? state.sessionNumber + 1
        : 1;

      const nextDuration = pomodoroSettings.workMinutes * 60;
      const shouldAutoStart = Boolean(pomodoroSettings.autoStartFocus);

      const nextStatus: 'running' | 'idle' = shouldAutoStart ? 'running' : 'idle';
      const nextEndTime = shouldAutoStart ? Date.now() + nextDuration * 1000 : null;

      // 1. Guaranteed state transition first
      setTimerState(prev => ({
        ...prev,
        status: nextStatus,
        mode: 'work',
        sessionNumber: nextSession,
        durationSeconds: nextDuration,
        endTime: nextEndTime,
        pausedRemainingSeconds: null,
        notificationSent: false
      }));
      setDisplayTime(nextDuration);

      // 2. Safe side-effects
      try {
        recordFocusSession(breakDuration, state.mode, activeTaskRef.current || 'Self Directed Focus');
      } catch (e) {
        console.error('Failed to record break session', e);
      }

      if (pomodoroSettings.soundEnabled) {
        try {
          playTimerEndSound(pomodoroSettings.soundType, pomodoroSettings.soundVolume);
        } catch (e) {
          console.error('Failed to play timer end sound', e);
        }
      }

      const title = state.mode === 'long_break' ? 'Cycle Reset! 🚀' : 'Break Finished! ⚡';
      const body = `Starting Focus Session ${nextSession} of ${maxSessions}. ${shouldAutoStart ? 'Focus timer running!' : 'Ready when you are.'}`;
      sendNotificationSafe(title, { body, icon: '/icon-192x192.png' });
    }
  }, [pomodoroSettings, recordFocusSession]);

  // Main UI Loop & Completion Detection
  useEffect(() => {
    if (timerState.status !== 'running' || !timerState.endTime) {
      return;
    }

    const interval = setInterval(() => {
      const remainingMs = timerState.endTime! - Date.now();
      
      if (remainingMs <= 0) {
        setDisplayTime(0);
        handleTimerCompletion(timerStateRef.current);
      } else {
        setDisplayTime(Math.ceil(remainingMs / 1000));
      }
    }, 250);

    return () => clearInterval(interval);
  }, [timerState.status, timerState.endTime, handleTimerCompletion]);

  // Handle visibility changes
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const state = timerStateRef.current;
        if (state.status === 'running' && state.endTime) {
          const remainingMs = state.endTime - Date.now();
          if (remainingMs <= 0) {
            setDisplayTime(0);
            handleTimerCompletion(state);
          } else {
            setDisplayTime(Math.ceil(remainingMs / 1000));
          }
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [handleTimerCompletion]);

  // Sync across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'pomodoro-state' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as GlobalPomodoroState;
          setTimerState(parsed);
          if (parsed.status === 'running' && parsed.endTime) {
            const remainingMs = parsed.endTime - Date.now();
            setDisplayTime(remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0);
          } else if (parsed.status === 'paused' && parsed.pausedRemainingSeconds !== null) {
            setDisplayTime(parsed.pausedRemainingSeconds);
          } else {
            setDisplayTime(parsed.durationSeconds);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Control Actions
  const startTimer = useCallback(async () => {
    try {
      await requestNotificationPermission();
    } catch {}
    
    let duration = timerState.durationSeconds;
    if (timerState.status === 'paused' && timerState.pausedRemainingSeconds !== null && timerState.pausedRemainingSeconds > 0) {
      duration = timerState.pausedRemainingSeconds;
    } else if (duration <= 0) {
      duration = getModeDurationSeconds(timerState.mode);
    }
    
    const endTime = Date.now() + duration * 1000;
    
    setTimerState(prev => ({
      ...prev,
      status: 'running',
      durationSeconds: duration,
      endTime,
      pausedRemainingSeconds: null,
      notificationSent: false
    }));
    setDisplayTime(duration);
  }, [timerState.durationSeconds, timerState.status, timerState.pausedRemainingSeconds, timerState.mode, getModeDurationSeconds]);

  const pauseTimer = useCallback(() => {
    if (timerState.status !== 'running' || !timerState.endTime) return;
    
    const remainingMs = Math.max(0, timerState.endTime - Date.now());
    const pausedRemainingSeconds = Math.ceil(remainingMs / 1000);
    
    setTimerState(prev => ({
      ...prev,
      status: 'paused',
      endTime: null,
      pausedRemainingSeconds,
    }));
    setDisplayTime(pausedRemainingSeconds);
  }, [timerState.status, timerState.endTime]);

  const resumeTimer = startTimer;

  const resetTimer = useCallback(() => {
    const duration = getModeDurationSeconds(timerState.mode);
    setTimerState(prev => ({
      ...prev,
      status: 'idle',
      durationSeconds: duration,
      endTime: null,
      pausedRemainingSeconds: null,
      notificationSent: false
    }));
    setDisplayTime(duration);
  }, [timerState.mode, getModeDurationSeconds]);

  const skipSession = useCallback(() => {
    const state = timerStateRef.current;
    const maxSessions = pomodoroSettings.longBreakInterval || 4;
    if (state.mode === 'work') {
      const isLongBreak = state.sessionNumber >= maxSessions;
      const nextMode: PomodoroMode = isLongBreak ? 'long_break' : 'short_break';
      const nextDuration = (isLongBreak ? pomodoroSettings.longBreakMinutes : pomodoroSettings.shortBreakMinutes) * 60;
      setTimerState(prev => ({ ...prev, status: 'idle', mode: nextMode, durationSeconds: nextDuration, endTime: null, pausedRemainingSeconds: null, notificationSent: false }));
      setDisplayTime(nextDuration);
    } else {
      const nextSession = state.mode === 'short_break' && state.sessionNumber < maxSessions ? state.sessionNumber + 1 : 1;
      const nextDuration = pomodoroSettings.workMinutes * 60;
      setTimerState(prev => ({ ...prev, status: 'idle', mode: 'work', sessionNumber: nextSession, durationSeconds: nextDuration, endTime: null, pausedRemainingSeconds: null, notificationSent: false }));
      setDisplayTime(nextDuration);
    }
  }, [pomodoroSettings]);

  const changeMode = useCallback((newMode: PomodoroMode) => {
    const duration = getModeDurationSeconds(newMode);
    setTimerState(prev => ({
      ...prev,
      status: 'idle',
      mode: newMode,
      durationSeconds: duration,
      endTime: null,
      pausedRemainingSeconds: null,
      notificationSent: false
    }));
    setDisplayTime(duration);
  }, [getModeDurationSeconds]);

  // Audio and Media Session
  useEffect(() => {
    if (timerState.status === 'running') silentAudioRef.current?.play().catch(() => {});
    else silentAudioRef.current?.pause();
  }, [timerState.status]);

  const handlersRef = useRef({ startTimer, pauseTimer, skipSession });
  useEffect(() => { handlersRef.current = { startTimer, pauseTimer, skipSession }; }, [startTimer, pauseTimer, skipSession]);

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => handlersRef.current.startTimer());
      navigator.mediaSession.setActionHandler('pause', () => handlersRef.current.pauseTimer());
      navigator.mediaSession.setActionHandler('nexttrack', () => handlersRef.current.skipSession());
    }
    return () => {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
      }
    };
  }, []);

  // Update Document title
  useEffect(() => {
    const minutes = Math.floor(displayTime / 60);
    const seconds = displayTime % 60;
    const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    const titleText = `${timeFormatted} - ${timerState.mode === 'work' ? 'Focus' : 'Break'}`;
    document.title = timerState.status === 'running' ? titleText : 'My Routine';
    
    if ('mediaSession' in navigator && timerState.status === 'running') {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: titleText,
        artist: activeTaskForTimer || 'Self Directed Focus',
        album: 'Productivity Timer',
        artwork: [
          { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      });
    }
  }, [displayTime, timerState.status, timerState.mode, activeTaskForTimer]);

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
        timerState,
        displayTime,
        startTimer,
        pauseTimer,
        resumeTimer,
        resetTimer,
        skipSession,
        changeMode,
        syncStatus,
        lastSyncedAt,
        syncError,
        syncNow,
        uploadToCloud,
        downloadFromCloud,
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
