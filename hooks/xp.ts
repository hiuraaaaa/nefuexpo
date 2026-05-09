import AsyncStorage from '@react-native-async-storage/async-storage';

const XP_KEY = 'nefusoft_xp';

export interface XPData {
  xp: number;
  level: number;
  streak: number;
  lastWatchDate: string;
}

export const LEVELS = [
  { level: 1, title: 'Newbie',      min: 0    },
  { level: 2, title: 'Pemula',      min: 100  },
  { level: 3, title: 'Wibu',        min: 300  },
  { level: 4, title: 'Otaku',       min: 600  },
  { level: 5, title: 'Weeb',        min: 1000 },
  { level: 6, title: 'Anime Freak', min: 1500 },
  { level: 7, title: 'Legend Wibu', min: 2500 },
  { level: 8, title: 'Otaku Master',min: 4000 },
];

export const getLevelData = (xp: number) => {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].min) {
      current = LEVELS[i];
      next = LEVELS[i + 1] ?? null;
    }
  }
  const progress = next
    ? (xp - current.min) / (next.min - current.min)
    : 1;
  return { current, next, progress };
};

export const xpStorage = {
  get: async (): Promise<XPData> => {
    try {
      const raw = await AsyncStorage.getItem(XP_KEY);
      return raw ? JSON.parse(raw) : { xp: 0, level: 1, streak: 0, lastWatchDate: '' };
    } catch {
      return { xp: 0, level: 1, streak: 0, lastWatchDate: '' };
    }
  },

  add: async (amount: number): Promise<XPData> => {
    try {
      const data = await xpStorage.get();
      const today = new Date().toDateString();
      const isNewDay = data.lastWatchDate !== today;
      const streak = isNewDay ? data.streak + 1 : data.streak;
      const streakBonus = isNewDay ? 5 : 0;
      const newXp = data.xp + amount + streakBonus;
      const { current } = getLevelData(newXp);
      const updated: XPData = {
        xp: newXp,
        level: current.level,
        streak,
        lastWatchDate: today,
      };
      await AsyncStorage.setItem(XP_KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return await xpStorage.get();
    }
  },

  reset: async (): Promise<void> => {
    await AsyncStorage.removeItem(XP_KEY);
  },
};
