import { 
  Brain, 
  Dumbbell, 
  BookOpen, 
  Moon, 
  LucideIcon 
} from 'lucide-react';
import { RoutineCategory } from './types';

export interface CategoryThemeConfig {
  label: string;
  badge: string;
  clockColor: string;
  timePill: string;
  icon: LucideIcon;
  accentBorder: string;
}

export function getCategoryConfig(category?: RoutineCategory | string): CategoryThemeConfig {
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
    default:
      return {
        label: 'Mindfulness',
        badge: 'bg-purple-500/15 border-purple-400/30 text-purple-300',
        clockColor: 'text-purple-400',
        timePill: 'bg-purple-500/10 border-purple-500/25 text-purple-300',
        icon: Moon,
        accentBorder: 'hover:border-purple-400/30',
      };
  }
}
