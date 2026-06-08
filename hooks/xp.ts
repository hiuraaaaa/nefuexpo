import { storageMain } from '@/hooks/storage';

// ─── Types ────────────────────────────────────────────────────────────────────
export type XPData = {
  xp: number;
  level: number;
  streak: number;
  lastWatchDate: string;
  _todayXP: number;
};

// ─── Level table ──────────────────────────────────────────────────────────────
export const LEVELS: { level: number; min: number; label: string }[] = [
  { level: 1,  min: 0,    label: 'Pemula' },
  { level: 2,  min: 100,  label: 'Penonton' },
  { level: 3,  min: 300,  label: 'Penggemar' },
  { level: 4,  min: 600,  label: 'Otaku' },
  { level: 5,  min: 1000, label: 'Weeaboo' },
  { level: 6,  min: 1500, label: 'Senpai' },
  { level: 7,  min: 2200, label: 'Sensei' },
  { level: 8,  min: 3000, label: 'Hikkomori' },
  { level: 9,  min: 4000, label: 'Anime Lord' },
  { level: 10, min: 5500, label: 'Kage no Ou' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const XP_KEY = 'nefusoft_xp';

const DEFAULT: XPData = {
  xp: 0, level: 1, streak: 0, lastWatchDate: '', _todayXP: 0,
};

const calcLevel = (xp: number): number => {
  let lv = 1;
  for (const l of LEVELS) { if (xp >= l.min) lv = l.level; }
  return lv;
};

const todayStr = (): string => new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

// ─── Storage (MMKV sync) ──────────────────────────────────────────────────────
export const xpStorage = {
  /** Baca XPData. Sync — tidak perlu await. */
  get: (): XPData => {
    try {
      const raw = storageMain.getString(XP_KEY);
      if (!raw) return { ...DEFAULT };
      const parsed = JSON.parse(raw) as Partial<XPData>;
      return {
        xp:            typeof parsed.xp === 'number'    ? parsed.xp            : 0,
        level:         typeof parsed.level === 'number' ? parsed.level         : 1,
        streak:        typeof parsed.streak === 'number'? parsed.streak        : 0,
        lastWatchDate: typeof parsed.lastWatchDate === 'string' ? parsed.lastWatchDate : '',
        _todayXP:      typeof parsed._todayXP === 'number'     ? parsed._todayXP      : 0,
      };
    } catch {
      return { ...DEFAULT };
    }
  },

  /** Simpan XPData. */
  set: (data: XPData): void => {
    try { storageMain.set(XP_KEY, JSON.stringify(data)); } catch {}
  },

  /**
   * Tambah XP. Handle streak & level otomatis.
   * Limit 100 XP per hari biar ga abuse.
   * Return XPData terbaru.
   */
  add: (amount: number): XPData => {
    const data   = xpStorage.get();
    const today  = todayStr();
    const isToday = data.lastWatchDate === today;

    // Hitung sisa kuota harian
    const dailyUsed = isToday ? (data._todayXP ?? 0) : 0;
    const MAX_DAILY = 100;
    const canAdd    = Math.max(0, MAX_DAILY - dailyUsed);
    const actualAdd = Math.min(amount, canAdd);

    // Streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    let newStreak = data.streak;
    if (!isToday) {
      newStreak = data.lastWatchDate === yesterdayStr ? data.streak + 1 : 1;
    }

    const newXP = data.xp + actualAdd;
    const updated: XPData = {
      xp:            newXP,
      level:         calcLevel(newXP),
      streak:        newStreak,
      lastWatchDate: today,
      _todayXP:      dailyUsed + actualAdd,
    };

    xpStorage.set(updated);
    return updated;
  },

  /** Reset total (admin only). */
  reset: (): void => {
    xpStorage.set({ ...DEFAULT });
  },
};
