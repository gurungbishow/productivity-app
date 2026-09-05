import { Shayari } from './types';

export const MOTIVATIONAL_SHAYARIS: Shayari[] = [
  {
    id: 1,
    lines: [
      "Life isn’t fair, but it is still good."
    ],
    translation: "Even when life feels unjust or challenging, beauty, joy, and meaningful moments remain everywhere around us if we choose to notice them."
  },
  {
    id: 2,
    lines: [
      "If we threw our problems in a pile and saw everyone else’s,",
      "we’d grab ours right back."
    ],
    translation: "Everyone carries silent battles we know nothing about. Appreciating your own life and challenges keeps you grounded, humble, and empathetic."
  },
  {
    id: 3,
    lines: [
      "Time heals almost everything.",
      "Give Time, time."
    ],
    translation: "Deep wounds, heartache, and turbulence soften with patient endurance. Trust the natural unfolding of time to restore peace."
  },
  {
    id: 4,
    lines: [
      "No matter how good or bad a situation is,",
      "it will change."
    ],
    translation: "Everything in life is impermanent. Stay humble and appreciative during peak moments, and remain hopeful during the difficult seasons."
  },
  {
    id: 5,
    lines: [
      "No matter how you feel,",
      "get up, dress up, and show up."
    ],
    translation: "Discipline means honoring your potential regardless of temporary moods. Showing up consistently with pride is how greatness is built."
  },
  {
    id: 6,
    lines: [
      "When in doubt, just take the next small step."
    ],
    translation: "Overthinking paralyzes, but action brings clarity. You don't need to see the entire path ahead to take one courageous step forward."
  },
  {
    id: 7,
    lines: [
      "You can’t go back and change the beginning,",
      "but you can start where you are and change the ending."
    ],
    translation: "Your past does not define your destiny. The power to write an extraordinary conclusion begins with the decisions you make right now."
  },
  {
    id: 8,
    lines: [
      "Make peace with your past,",
      "so it won’t screw up the present."
    ],
    translation: "Carrying resentment and regret drains the energy needed for today. Forgive, release what was, and step fully into the present."
  },
  {
    id: 9,
    lines: [
      "What other people think of you is none of your business."
    ],
    translation: "Others judge through the lens of their own projections and insecurities. Protect your inner peace by refusing to seek external validation."
  },
  {
    id: 10,
    lines: [
      "Envy is a waste of time.",
      "Accept what you already have, not what you think you need."
    ],
    translation: "Comparison steals joy. True abundance is found not in accumulating more, but in wholeheartedly valuing the blessings already in your life."
  },
  {
    id: 11,
    lines: [
      "Take a deep breath, it calms the mind."
    ],
    translation: "A single mindful, deep breath anchors you in stillness, dissolving anxiety and resetting your clarity in times of tension."
  },
  {
    id: 12,
    lines: [
      "Don’t buy stuff you don’t need."
    ],
    translation: "Material clutter burdens both your finances and your mental space. Master intentional simplicity to keep your life light and focused."
  },
  {
    id: 13,
    lines: [
      "Save money for the things that matter."
    ],
    translation: "Financial discipline grants freedom, security, and peace of mind. Prioritize long-term stability and purpose over short-term impulse."
  },
  {
    id: 14,
    lines: [
      "Your job won’t take care of you when you are sick.",
      "Your friends and family will."
    ],
    translation: "Work earns a living, but love gives life meaning. Always prioritize your health and nurture the people who truly stand by you."
  },
  {
    id: 15,
    lines: [
      "You don’t have to win every argument.",
      "Just stay true to yourself."
    ],
    translation: "Preserving your peace and personal integrity is far superior to feeding the ego with useless debates. Let your character speak for itself."
  },
  {
    id: 16,
    lines: [
      "Believe in miracles."
    ],
    translation: "Keep your heart open to wonder and unexpected grace. When you maintain belief, life reveals breakthroughs beyond ordinary logic."
  },
  {
    id: 17,
    lines: [
      "Get outside every day,",
      "miracles are waiting everywhere."
    ],
    translation: "Nature heals and revitalizes the mind. Stepping outside expands your perspective and connects you with the vibrant rhythm of the living world."
  },
  {
    id: 18,
    lines: [
      "What you believe, you become."
    ],
    translation: "Your deepest internal convictions determine your daily choices, habits, and reality. Cultivate empowering beliefs to realize an empowering life."
  },
  {
    id: 19,
    lines: [
      "Whether you think you can, or you think you can’t —",
      "you’re right."
    ],
    translation: "Your attitude sets the ceiling for your capability. When your mindset is resolute, challenges transform into stepping stones."
  },
  {
    id: 20,
    lines: [
      "Your only limit is your mind."
    ],
    translation: "Most obstacles exist only as self-imposed doubts. When you liberate your mind from fear, your true potential has no boundaries."
  },
  {
    id: 21,
    lines: [
      "If you don’t sacrifice for what you want,",
      "what you want becomes the sacrifice."
    ],
    translation: "Every worthwhile dream demands giving up short-term comfort and trivial distractions. Choose the price of discipline over the price of regret."
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
