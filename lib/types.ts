export type RoutineCategory = 
  | 'deep_work'
  | 'health_fitness'
  | 'mindfulness'
  | 'growth_creative'
  | 'operations'
  | 'health' 
  | 'college' 
  | 'study' 
  | 'routine' 
  | 'sleep' 
  | 'personal';

export interface ScheduleItem {
  id: string;
  title: string;
  description?: string;
  startTime: string; // e.g. "05:30 AM"
  endTime: string;   // e.g. "06:30 AM"
  startMinutes: number; // minutes from midnight (0 - 1439)
  endMinutes: number;   // minutes from midnight (0 - 1439)
  category?: RoutineCategory | string;
  isDefault?: boolean;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  completedScheduleIds: string[];
  totalFocusMinutes: number;
  completedPomodoros: number;
}

export type PomodoroMode = 'work' | 'short_break' | 'long_break';

export interface PomodoroSettings {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  soundEnabled: boolean;
  ambientSound: 'none' | 'rain' | 'brown';
  ambientVolume: number;
}

export interface FocusSessionLog {
  id: string;
  timestamp: number;
  durationMinutes: number;
  mode: PomodoroMode;
  associatedTask?: string;
}

export interface Shayari {
  id: number;
  lines: string[];
  transliteration?: string[];
  translation: string;
  poet: string;
  theme: string;
}

export interface UserProfile {
  name: string;
  greetingCustom?: string;
  dailyFocusGoalMinutes: number;
  streak: number;
  lastActiveDate: string;
}

export interface GlobalPomodoroState {
  status: 'idle' | 'running' | 'paused';
  mode: PomodoroMode;
  durationSeconds: number;
  endTime: number | null;
  pausedRemainingSeconds: number | null;
  sessionNumber: number;
  notificationSent: boolean;
}
