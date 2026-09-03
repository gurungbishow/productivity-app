import { ScheduleItem } from './types';

export function parseTimeToMinutes(timeStr: string): number {
  // Parses "05:30 AM", "5:30 AM", "10:00 PM", "12:00 PM", etc.
  const cleaned = timeStr.trim();
  const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();

  if (meridiem === 'PM' && hours !== 12) {
    hours += 12;
  } else if (meridiem === 'AM' && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

export function formatMinutesToTime(minutes: number): string {
  const normMin = ((minutes % 1440) + 1440) % 1440;
  let hours = Math.floor(normMin / 60);
  const mins = normMin % 60;
  const meridiem = hours >= 12 ? 'PM' : 'AM';

  if (hours === 0) hours = 12;
  else if (hours > 12) hours -= 12;

  const paddedMins = mins < 10 ? `0${mins}` : `${mins}`;
  return `${hours}:${paddedMins} ${meridiem}`;
}

export const DEFAULT_SCHEDULE: ScheduleItem[] = [
  {
    id: 'slot-1',
    title: 'Early Morning Rise & Hydration',
    description: 'Get up from bed, drink warm water, stretch, welcome the day with gratitude',
    startTime: '5:00 AM',
    endTime: '5:30 AM',
    startMinutes: parseTimeToMinutes('5:00 AM'), // 300
    endMinutes: parseTimeToMinutes('5:30 AM'),   // 330
    category: 'mindfulness',
    isDefault: true,
  },
  {
    id: 'slot-2',
    title: 'Exercise, Bath & Morning Affirmation',
    description: 'Physical workout, cold/warm shower, positive self-talk and daily mindset alignment',
    startTime: '5:30 AM',
    endTime: '6:30 AM',
    startMinutes: parseTimeToMinutes('5:30 AM'), // 330
    endMinutes: parseTimeToMinutes('6:30 AM'),   // 390
    category: 'health_fitness',
    isDefault: true,
  },
  {
    id: 'slot-3',
    title: 'College',
    description: 'Classes, lectures, campus discussions, and academic sessions',
    startTime: '6:30 AM',
    endTime: '10:00 AM',
    startMinutes: parseTimeToMinutes('6:30 AM'), // 390
    endMinutes: parseTimeToMinutes('10:00 AM'),  // 600
    category: 'deep_work',
    isDefault: true,
  },
  {
    id: 'slot-4',
    title: 'Coursework',
    description: 'Assignments, engineering labs, exam preparation, and curriculum problem solving',
    startTime: '10:00 AM',
    endTime: '12:00 PM',
    startMinutes: parseTimeToMinutes('10:00 AM'), // 600
    endMinutes: parseTimeToMinutes('12:00 PM'),   // 720
    category: 'deep_work',
    isDefault: true,
  },
  {
    id: 'slot-5',
    title: 'Coursera',
    description: 'Online certifications, specialized lectures, projects, and structured video modules',
    startTime: '12:00 PM',
    endTime: '3:30 PM',
    startMinutes: parseTimeToMinutes('12:00 PM'), // 720
    endMinutes: parseTimeToMinutes('3:30 PM'),    // 930
    category: 'deep_work',
    isDefault: true,
  },
  {
    id: 'slot-6',
    title: 'Breakfast & Refreshment',
    description: 'Healthy meal, tea/coffee, rest eyes, and prepare energy for evening deep work',
    startTime: '3:30 PM',
    endTime: '4:00 PM',
    startMinutes: parseTimeToMinutes('3:30 PM'), // 930
    endMinutes: parseTimeToMinutes('4:00 PM'),   // 960
    category: 'health_fitness',
    isDefault: true,
  },
  {
    id: 'slot-7',
    title: 'AI / ML Deep Work',
    description: 'Machine Learning models, Python, Neural Networks, research papers, and Kaggle/building projects',
    startTime: '4:00 PM',
    endTime: '7:00 PM',
    startMinutes: parseTimeToMinutes('4:00 PM'), // 960
    endMinutes: parseTimeToMinutes('7:00 PM'),   // 1140
    category: 'deep_work',
    isDefault: true,
  },
  {
    id: 'slot-8',
    title: 'Dinner',
    description: 'Nutritious dinner, relaxation with family/friends, mindful eating without screens',
    startTime: '7:00 PM',
    endTime: '8:00 PM',
    startMinutes: parseTimeToMinutes('7:00 PM'), // 1140
    endMinutes: parseTimeToMinutes('8:00 PM'),   // 1200
    category: 'health_fitness',
    isDefault: true,
  },
  {
    id: 'slot-9',
    title: 'Book Reading',
    description: 'Non-fiction, philosophy, self-development, or biography reading before sleep',
    startTime: '8:00 PM',
    endTime: '9:30 PM',
    startMinutes: parseTimeToMinutes('8:00 PM'), // 1200
    endMinutes: parseTimeToMinutes('9:30 PM'),   // 1290
    category: 'growth_creative',
    isDefault: true,
  },
  {
    id: 'slot-10',
    title: 'Evening Affirmation & Wind Down',
    description: 'Reflect on today\'s achievements, gratitude journal, plan tomorrow, digital detox',
    startTime: '9:30 PM',
    endTime: '10:00 PM',
    startMinutes: parseTimeToMinutes('9:30 PM'), // 1290
    endMinutes: parseTimeToMinutes('10:00 PM'),  // 1320
    category: 'mindfulness',
    isDefault: true,
  },
  {
    id: 'slot-11',
    title: 'Deep Sleep',
    description: 'Restorative uninterrupted sleep, muscle recovery, memory consolidation',
    startTime: '10:00 PM',
    endTime: '5:00 AM',
    startMinutes: parseTimeToMinutes('10:00 PM'), // 1320
    endMinutes: parseTimeToMinutes('5:00 AM'),   // 300 (overnight span)
    category: 'health_fitness',
    isDefault: true,
  },
];

export interface ScheduleStatus {
  currentSlot: ScheduleItem | null;
  nextSlot: ScheduleItem | null;
  currentProgressPercent: number; // 0 to 100
  minutesRemainingInCurrent: number;
  minutesUntilNext: number;
  currentMinutesOfDay: number;
}

export function isSlotActive(item: ScheduleItem, currentMinutes: number): boolean {
  if (item.startMinutes <= item.endMinutes) {
    return currentMinutes >= item.startMinutes && currentMinutes < item.endMinutes;
  }
  // Crosses midnight (e.g. 22:00 to 05:00 -> 1320 to 300)
  return currentMinutes >= item.startMinutes || currentMinutes < item.endMinutes;
}

export function getSlotDurationMinutes(item: ScheduleItem): number {
  if (item.endMinutes >= item.startMinutes) {
    return item.endMinutes - item.startMinutes;
  }
  return 1440 - item.startMinutes + item.endMinutes;
}

export function getSlotElapsedMinutes(item: ScheduleItem, currentMinutes: number): number {
  if (!isSlotActive(item, currentMinutes)) return 0;
  if (item.endMinutes >= item.startMinutes) {
    return Math.max(0, currentMinutes - item.startMinutes);
  }
  // Overnight span
  if (currentMinutes >= item.startMinutes) {
    return currentMinutes - item.startMinutes;
  }
  return (1440 - item.startMinutes) + currentMinutes;
}

export function getScheduleStatus(items: ScheduleItem[] = DEFAULT_SCHEDULE, date: Date = new Date()): ScheduleStatus {
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const currentSeconds = date.getSeconds();
  const currentTotalFraction = currentMinutes + currentSeconds / 60;

  let currentSlot: ScheduleItem | null = null;
  let nextSlot: ScheduleItem | null = null;

  for (const item of items) {
    if (isSlotActive(item, currentMinutes)) {
      currentSlot = item;
      break;
    }
  }

  // Determine next slot
  if (currentSlot) {
    const currentIndex = items.findIndex(i => i.id === currentSlot!.id);
    if (currentIndex !== -1) {
      nextSlot = items[(currentIndex + 1) % items.length];
    }
  } else {
    // If no slot is strictly active, find the nearest upcoming one
    let minDistance = Infinity;
    for (const item of items) {
      let distance = item.startMinutes - currentMinutes;
      if (distance < 0) distance += 1440;
      if (distance < minDistance) {
        minDistance = distance;
        nextSlot = item;
      }
    }
  }

  let currentProgressPercent = 0;
  let minutesRemainingInCurrent = 0;

  if (currentSlot) {
    const totalDuration = getSlotDurationMinutes(currentSlot);
    let elapsed = 0;
    if (currentSlot.endMinutes >= currentSlot.startMinutes) {
      elapsed = Math.max(0, currentTotalFraction - currentSlot.startMinutes);
    } else {
      // Overnight
      if (currentTotalFraction >= currentSlot.startMinutes) {
        elapsed = currentTotalFraction - currentSlot.startMinutes;
      } else {
        elapsed = (1440 - currentSlot.startMinutes) + currentTotalFraction;
      }
    }

    currentProgressPercent = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
    minutesRemainingInCurrent = Math.max(0, Math.round(totalDuration - elapsed));
  }

  let minutesUntilNext = 0;
  if (nextSlot) {
    let diff = nextSlot.startMinutes - currentMinutes;
    if (diff < 0) diff += 1440;
    minutesUntilNext = diff;
  }

  return {
    currentSlot,
    nextSlot,
    currentProgressPercent,
    minutesRemainingInCurrent,
    minutesUntilNext,
    currentMinutesOfDay: currentMinutes,
  };
}
