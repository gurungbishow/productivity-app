import { Shayari } from './types';

export const MOTIVATIONAL_SHAYARIS: Shayari[] = [
  {
    id: 1,
    lines: "Life isn’t fair, but it is still good."
  },
  {
    id: 2,
    lines: "If we threw our problems in a pile and saw everyone else’s, we’d grab ours right back."
  },
  {
    id: 3,
    lines: "Time heals almost everything. Give Time, time."
  },
  {
    id: 4,
    lines: "No matter how good or bad a situation is, it will change."
  },
  {
    id: 5,
    lines: "No matter how you feel, get up, dress up, and show up."
  },
  {
    id: 6,
    lines: "When in doubt, just take the next small step."
  },
  {
    id: 7,
    lines: "You can’t go back and change the beginning, but you can start where you are and change the ending."
  },
  {
    id: 8,
    lines: "Make peace with your past, so it won’t screw up the present."
  },
  {
    id: 9,
    lines: "What other people think of you is none of your business."
  },
  {
    id: 10,
    lines: "Envy is a waste of time. Accept what you already have, not what you think you need."
  },
  {
    id: 11,
    lines: "Take a deep breath, it calms the mind."
  },
  {
    id: 12,
    lines: "Don’t buy stuff you don’t need."
  },
  {
    id: 13,
    lines: "Save money for the things that matter."
  },
  {
    id: 14,
    lines: "Your job won’t take care of you when you are sick. Your friends and family will."
  },
  {
    id: 15,
    lines: "You don’t have to win every argument. Just stay true to yourself."
  },
  {
    id: 16,
    lines: "Believe in miracles."
  },
  {
    id: 17,
    lines: "Get outside every day, miracles are waiting everywhere."
  },
  {
    id: 18,
    lines: "What you believe, you become."
  },
  {
    id: 19,
    lines: "Whether you think you can, or you think you can’t — you’re right."
  },
  {
    id: 20,
    lines: "Your only limit is your mind."
  },
  {
    id: 21,
    lines: "If you don’t sacrifice for what you want, what you want becomes the sacrifice."
  }
];

export function getDailyShayari(date: Date = new Date(), customList?: Shayari[]): Shayari {
  const list = (customList && customList.length > 0) ? customList : MOTIVATIONAL_SHAYARIS;
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  const index = Math.abs(dayOfYear) % list.length;
  return list[index] || MOTIVATIONAL_SHAYARIS[0];
}

export function getRandomShayari(currentId?: number, customList?: Shayari[]): Shayari {
  const list = (customList && customList.length > 0) ? customList : MOTIVATIONAL_SHAYARIS;
  if (list.length === 1) return list[0];
  let nextIndex = Math.floor(Math.random() * list.length);
  if (currentId !== undefined && list.length > 1) {
    let attempts = 0;
    while (list[nextIndex].id === currentId && attempts < 20) {
      nextIndex = Math.floor(Math.random() * list.length);
      attempts++;
    }
  }
  return list[nextIndex] || MOTIVATIONAL_SHAYARIS[0];
}
