import { storageMain } from '@/hooks/storage/storage';

// ─── Types ────────────────────────────────────────────────────────────────────
export type XPData = {
  xp: number;
  level: number;
  streak: number;
  lastWatchDate: string;
  _todayXP: number;
};

export type LevelEntry = {
  level: number;
  min: number;
  title: string;
};

// ─── Level table ──────────────────────────────────────────────────────────────
export const LEVELS: LevelEntry[] = [
  { level: 1,  min: 0,    title: 'Pemula' },
  { level: 2,  min: 100,  title: 'Penonton' },
  { level: 3,  min: 300,  title: 'Penggemar' },
  { level: 4,  min: 600,  title: 'Otaku' },
  { level: 5,  min: 1000, title: 'Weeaboo' },
  { level: 6,  min: 1500, title: 'Senpai' },
  { level: 7,  min: 2200, title: 'Sensei' },
  { level: 8,  min: 3000, title: 'Hikkomori' },
  { level: 9,  min: 4000, title: 'Anime Lord' },
  { level: 10, min: 5500, title: 'Kage no Ou' },
];

// ─── getLevelData ─────────────────────────────────────────────────────────────
export function getLevelData(xp: number): {
  current: LevelEntry;
  next: LevelEntry | null;
  progress: number; // 0–1
} {
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.min) current = l;
  }
  const nextIndex = LEVELS.findIndex(l => l.level === current.level) + 1;
  const next = nextIndex < LEVELS.length ? LEVELS[nextIndex] : null;
  const progress = next
    ? Math.min((xp - current.min) / (next.min - current.min), 1)
    : 1;
  return { current, next, progress };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const XP_KEY = 'nefusoft_xp';

const DEFAULT: XPData = {
  xp: 0, level: 1, streak: 0, lastWatchDate: '', _todayXP: 0,
};

const todayStr = (): string => new Date().toISOString().slice(0, 10);

// ─── Storage (MMKV sync) ──────────────────────────────────────────────────────
export const xpStorage = {
  get: (): XPData => {
    try {
      const raw = storageMain.getString(XP_KEY);
      if (!raw) return { ...DEFAULT };
      const p = JSON.parse(raw) as Partial<XPData>;
      return {
        xp:            typeof p.xp === 'number'            ? p.xp            : 0,
        level:         typeof p.level === 'number'         ? p.level         : 1,
        streak:        typeof p.streak === 'number'        ? p.streak        : 0,
        lastWatchDate: typeof p.lastWatchDate === 'string' ? p.lastWatchDate : '',
        _todayXP:      typeof p._todayXP === 'number'      ? p._todayXP      : 0,
      };
    } catch { return { ...DEFAULT }; }
  },

  set: (data: XPData): void => {
    try { storageMain.set(XP_KEY, JSON.stringify(data)); } catch {}
  },

  add: (amount: number): XPData => {
    const data    = xpStorage.get();
    const today   = todayStr();
    const isToday = data.lastWatchDate === today;

    const dailyUsed = isToday ? (data._todayXP ?? 0) : 0;
    const canAdd    = Math.max(0, 100 - dailyUsed);
    const actualAdd = Math.min(amount, canAdd);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().slice(0, 10);

    let newStreak = data.streak;
    if (!isToday) {
      newStreak = data.lastWatchDate === yStr ? data.streak + 1 : 1;
    }

    const newXP = data.xp + actualAdd;
    const { current } = getLevelData(newXP);
    const updated: XPData = {
      xp:            newXP,
      level:         current.level,
      streak:        newStreak,
      lastWatchDate: today,
      _todayXP:      dailyUsed + actualAdd,
    };
    xpStorage.set(updated);
    return updated;
  },

  reset: (): void => { xpStorage.set({ ...DEFAULT }); },
};
