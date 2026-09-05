import { 
  Brain, 
  Dumbbell, 
  BookOpen, 
  Moon, 
  Code,
  Briefcase,
  Heart,
  Coffee,
  Sparkles,
  Music,
  Zap,
  Target,
  Flame,
  Smile,
  Layers,
  Folder,
  LucideIcon 
} from 'lucide-react';
import { RoutineCategory, CustomCategory, CategoryColor } from './types';

export interface CategoryThemeConfig {
  label: string;
  badge: string;
  clockColor: string;
  timePill: string;
  icon: LucideIcon;
  accentBorder: string;
}

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Brain,
  Dumbbell,
  BookOpen,
  Moon,
  Code,
  Briefcase,
  Heart,
  Coffee,
  Sparkles,
  Music,
  Zap,
  Target,
  Flame,
  Smile,
  Layers,
  Folder,
};

export const AVAILABLE_CATEGORY_ICONS = [
  'Brain',
  'Dumbbell',
  'BookOpen',
  'Moon',
  'Code',
  'Briefcase',
  'Heart',
  'Coffee',
  'Sparkles',
  'Music',
  'Zap',
  'Target',
] as const;

export const CATEGORY_COLOR_THEMES: Record<CategoryColor, {
  badge: string;
  clockColor: string;
  timePill: string;
  accentBorder: string;
  bgSoft: string;
  text: string;
  chipBg: string;
}> = {
  indigo: {
    badge: 'bg-indigo-500/15 border-indigo-400/30 text-indigo-300',
    clockColor: 'text-indigo-400',
    timePill: 'bg-indigo-500/10 border-indigo-500/25 text-indigo-300',
    accentBorder: 'hover:border-indigo-400/30',
    bgSoft: 'bg-indigo-500/20',
    text: 'text-indigo-400',
    chipBg: 'bg-indigo-500',
  },
  emerald: {
    badge: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300',
    clockColor: 'text-emerald-400',
    timePill: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300',
    accentBorder: 'hover:border-emerald-400/30',
    bgSoft: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    chipBg: 'bg-emerald-500',
  },
  amber: {
    badge: 'bg-amber-500/15 border-amber-400/30 text-amber-300',
    clockColor: 'text-amber-400',
    timePill: 'bg-amber-500/10 border-amber-500/25 text-amber-300',
    accentBorder: 'hover:border-amber-400/30',
    bgSoft: 'bg-amber-500/20',
    text: 'text-amber-400',
    chipBg: 'bg-amber-500',
  },
  purple: {
    badge: 'bg-purple-500/15 border-purple-400/30 text-purple-300',
    clockColor: 'text-purple-400',
    timePill: 'bg-purple-500/10 border-purple-500/25 text-purple-300',
    accentBorder: 'hover:border-purple-400/30',
    bgSoft: 'bg-purple-500/20',
    text: 'text-purple-400',
    chipBg: 'bg-purple-500',
  },
  rose: {
    badge: 'bg-rose-500/15 border-rose-400/30 text-rose-300',
    clockColor: 'text-rose-400',
    timePill: 'bg-rose-500/10 border-rose-500/25 text-rose-300',
    accentBorder: 'hover:border-rose-400/30',
    bgSoft: 'bg-rose-500/20',
    text: 'text-rose-400',
    chipBg: 'bg-rose-500',
  },
  cyan: {
    badge: 'bg-cyan-500/15 border-cyan-400/30 text-cyan-300',
    clockColor: 'text-cyan-400',
    timePill: 'bg-cyan-500/10 border-cyan-500/25 text-cyan-300',
    accentBorder: 'hover:border-cyan-400/30',
    bgSoft: 'bg-cyan-500/20',
    text: 'text-cyan-400',
    chipBg: 'bg-cyan-500',
  },
  blue: {
    badge: 'bg-blue-500/15 border-blue-400/30 text-blue-300',
    clockColor: 'text-blue-400',
    timePill: 'bg-blue-500/10 border-blue-500/25 text-blue-300',
    accentBorder: 'hover:border-blue-400/30',
    bgSoft: 'bg-blue-500/20',
    text: 'text-blue-400',
    chipBg: 'bg-blue-500',
  },
  orange: {
    badge: 'bg-orange-500/15 border-orange-400/30 text-orange-300',
    clockColor: 'text-orange-400',
    timePill: 'bg-orange-500/10 border-orange-500/25 text-orange-300',
    accentBorder: 'hover:border-orange-400/30',
    bgSoft: 'bg-orange-500/20',
    text: 'text-orange-400',
    chipBg: 'bg-orange-500',
  },
};

export const DEFAULT_CATEGORIES: CustomCategory[] = [
  { id: 'deep_work', label: 'Deep Work', color: 'indigo', icon: 'Brain', isDefault: true },
  { id: 'health_fitness', label: 'Health', color: 'emerald', icon: 'Dumbbell', isDefault: true },
  { id: 'growth_creative', label: 'Growth', color: 'amber', icon: 'BookOpen', isDefault: true },
  { id: 'mindfulness', label: 'Mindfulness', color: 'purple', icon: 'Moon', isDefault: true },
];

export function getCategoryConfig(
  category?: RoutineCategory | string,
  customCategories?: CustomCategory[]
): CategoryThemeConfig {
  // If customCategories is provided, check for a matching category by id or label
  if (customCategories && customCategories.length > 0 && category) {
    const custom = customCategories.find(
      (c) => c.id === category || c.label.toLowerCase() === String(category).toLowerCase()
    );
    if (custom) {
      const theme = CATEGORY_COLOR_THEMES[custom.color] || CATEGORY_COLOR_THEMES.indigo;
      const Icon = CATEGORY_ICONS[custom.icon] || Brain;
      return {
        label: custom.label,
        badge: theme.badge,
        clockColor: theme.clockColor,
        timePill: theme.timePill,
        icon: Icon,
        accentBorder: theme.accentBorder,
      };
    }
  }

  switch (category) {
    case 'deep_work':
    case 'study':
    case 'college':
      return {
        label: 'Deep Work',
        badge: 'bg-indigo-500/15 border-indigo-400/30 text-indigo-300',
        clockColor: 'text-indigo-400',
        timePill: 'bg-indigo-500/10 border-indigo-500/25 text-indigo-300',
        icon: Brain,
        accentBorder: 'hover:border-indigo-400/30',
      };
    case 'health_fitness':
    case 'health':
    case 'exercise':
      return {
        label: 'Health',
        badge: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300',
        clockColor: 'text-emerald-400',
        timePill: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300',
        icon: Dumbbell,
        accentBorder: 'hover:border-emerald-400/30',
      };
    case 'growth_creative':
    case 'reading':
    case 'creative':
      return {
        label: 'Growth',
        badge: 'bg-amber-500/15 border-amber-400/30 text-amber-300',
        clockColor: 'text-amber-400',
        timePill: 'bg-amber-500/10 border-amber-500/25 text-amber-300',
        icon: BookOpen,
        accentBorder: 'hover:border-amber-400/30',
      };
    case 'mindfulness':
    case 'sleep':
    case 'rest':
      return {
        label: 'Mindfulness',
        badge: 'bg-purple-500/15 border-purple-400/30 text-purple-300',
        clockColor: 'text-purple-400',
        timePill: 'bg-purple-500/10 border-purple-500/25 text-purple-300',
        icon: Moon,
        accentBorder: 'hover:border-purple-400/30',
      };
    default:
      // Try to make a graceful label from the string if available
      const cleanLabel = category 
        ? String(category).replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
        : 'Routine';
      return {
        label: cleanLabel,
        badge: 'bg-cyan-500/15 border-cyan-400/30 text-cyan-300',
        clockColor: 'text-cyan-400',
        timePill: 'bg-cyan-500/10 border-cyan-500/25 text-cyan-300',
        icon: Sparkles,
        accentBorder: 'hover:border-cyan-400/30',
      };
  }
}
