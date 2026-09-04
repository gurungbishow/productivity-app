import { ScheduleItem } from './types';

export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const cleaned = timeStr.trim();

  // 12-hour format: "05:30 AM", "5:30am", "10:00 PM"
  const match12 = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const meridiem = match12[3].toUpperCase();

    if (meridiem === 'PM' && hours !== 12) {
      hours += 12;
    } else if (meridiem === 'AM' && hours === 12) {
      hours = 0;
    }

    return hours * 60 + minutes;
  }

  // 24-hour format: "14:30", "05:30"
  const match24 = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    return hours * 60 + minutes;
  }

  return 0;
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

export function sortScheduleAscending(items: ScheduleItem[]): ScheduleItem[] {
  return [...items].sort((a, b) => {
    const aStart = typeof a.startMinutes === 'number' && !isNaN(a.startMinutes)
      ? a.startMinutes
      : parseTimeToMinutes(a.startTime || '00:00 AM');
    const bStart = typeof b.startMinutes === 'number' && !isNaN(b.startMinutes)
      ? b.startMinutes
      : parseTimeToMinutes(b.startTime || '00:00 AM');

    if (aStart !== bStart) {
      return aStart - bStart;
    }

    const aEnd = typeof a.endMinutes === 'number' && !isNaN(a.endMinutes)
      ? a.endMinutes
      : parseTimeToMinutes(a.endTime || '00:00 AM');
    const bEnd = typeof b.endMinutes === 'number' && !isNaN(b.endMinutes)
      ? b.endMinutes
      : parseTimeToMinutes(b.endTime || '00:00 AM');

    return aEnd - bEnd;
  });
}

export const DEFAULT_SCHEDULE: ScheduleItem[] = [
  {
    id: 'slot-1',
    title: 'Morning Rituals',
    description: 'Get up from bed, Brush your teeth, Wash your face, Drink a glass of warm water, Exercise to energize your body, Take a refreshing shower, Practice positive affirmations to start the day with a positive mindset, Breakfast.',
    startTime: '5:30 AM',
    endTime: '6:30 AM',
    startMinutes: parseTimeToMinutes('5:30 AM'),
    endMinutes: parseTimeToMinutes('6:30 AM'),
    category: 'mindfulness',
    isDefault: true,
  },
  {
    id: 'slot-2',
    title: 'College & Meals',
    description: 'Go to college, Attend lectures and actively participate in class, Engage in campus discussions and activities, Have lunch and take a short break.',
    startTime: '6:30 AM',
    endTime: '10:00 AM',
    startMinutes: parseTimeToMinutes('6:30 AM'),
    endMinutes: parseTimeToMinutes('10:00 AM'),
    category: 'health_fitness',
    isDefault: true,
  },
  {
    id: 'slot-3',
    title: 'College Coursework',
    description: 'Complete assignments, Review and cover the syllabus, Study lecture materials and strengthen understanding of key concepts, Revise regularly to stay up to date with coursework',
    startTime: '10:00 AM',
    endTime: '12:00 PM',
    startMinutes: parseTimeToMinutes('10:00 AM'),
    endMinutes: parseTimeToMinutes('12:00 PM'),
    category: 'deep_work',
    isDefault: true,
  },
  {
    id: 'slot-4',
    title: 'Data Science from Coursera',
    description: 'Attend specialized lectures and complete structured video modules, Work on practical projects to apply concepts, Complete courses and assessments to build industry-relevant skills.',
    startTime: '12:00 PM',
    endTime: '3:30 PM',
    startMinutes: parseTimeToMinutes('12:00 PM'),
    endMinutes: parseTimeToMinutes('3:30 PM'),
    category: 'deep_work',
    isDefault: true,
  },
  {
    id: 'slot-5',
    title: 'Refreshment & Break',
    description: 'Healthy meal, tea/coffee, rest eyes, and prepare energy for evening deep work.',
    startTime: '3:30 PM',
    endTime: '4:00 PM',
    startMinutes: parseTimeToMinutes('3:30 PM'),
    endMinutes: parseTimeToMinutes('4:00 PM'),
    category: 'health_fitness',
    isDefault: true,
  },
  {
    id: 'slot-6',
    title: 'AI / ML Deep Work',
    description: 'Machine Learning models, Python, Neural Networks, research papers, and Kaggle/building projects.',
    startTime: '4:00 PM',
    endTime: '7:00 PM',
    startMinutes: parseTimeToMinutes('4:00 PM'),
    endMinutes: parseTimeToMinutes('7:00 PM'),
    category: 'deep_work',
    isDefault: true,
  },
  {
    id: 'slot-7',
    title: 'Dinner Book Reading',
    description: 'Nutritious dinner, relaxation with family/friends, Data Science Book.',
    startTime: '7:00 PM',
    endTime: '9:30 PM',
    startMinutes: parseTimeToMinutes('7:00 PM'),
    endMinutes: parseTimeToMinutes('9:30 PM'),
    category: 'health_fitness',
    isDefault: true,
  },
  {
    id: 'slot-8',
    title: 'Evening Affirmation & Wind Down',
    description: 'Reflect on today\'s achievements, gratitude journal, plan tomorrow, Restorative uninterrupted sleep, muscle recovery, memory consolidation.',
    startTime: '9:30 PM',
    endTime: '5:30 AM',
    startMinutes: parseTimeToMinutes('9:30 PM'),
    endMinutes: parseTimeToMinutes('5:30 AM'),
    category: 'mindfulness',
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
  // Crosses midnight (e.g. 21:30 to 05:30 -> 1290 to 330)
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
  const sortedItems = sortScheduleAscending(items);
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const currentSeconds = date.getSeconds();
  const currentTotalFraction = currentMinutes + currentSeconds / 60;

  let currentSlot: ScheduleItem | null = null;
  let nextSlot: ScheduleItem | null = null;

  for (const item of sortedItems) {
    if (isSlotActive(item, currentMinutes)) {
      currentSlot = item;
      break;
    }
  }

  // Determine next slot
  if (currentSlot) {
    const currentIndex = sortedItems.findIndex(i => i.id === currentSlot!.id);
    if (currentIndex !== -1 && sortedItems.length > 1) {
      nextSlot = sortedItems[(currentIndex + 1) % sortedItems.length];
    }
  } else {
    // If no slot is strictly active, find the nearest upcoming one
    let minDistance = Infinity;
    for (const item of sortedItems) {
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
