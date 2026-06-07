import { createMMKV } from 'react-native-mmkv';
import { Anime, HistoryItem } from '@/types';

// ─── Storage instances ────────────────────────────────────────────────────────
// Pisah instance biar ga ada key collision & bisa clear per-domain
export const storageMain     = createMMKV({ id: 'nefusoft-main' });
export const storageProgress = createMMKV({ id: 'nefusoft-progress' });

// ─── Keys ─────────────────────────────────────────────────────────────────────
const HISTORY_KEY        = 'history';
const AUTONEXT_KEY       = 'autonext';
const SEARCH_HISTORY_KEY = 'search_history';
const FAVORIT_KEY        = 'favorit';
const MAX_HISTORY        = 50;
const MAX_SEARCH_HISTORY = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getJSON = <T>(storage: MMKV, key: string, fallback: T): T => {
  try {
    const raw = storage.getString(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};

const setJSON = (storage: MMKV, key: string, value: unknown): void => {
  try { storage.set(key, JSON.stringify(value)); } catch {}
};

const sanitizeKey = (id: string): string =>
  id.replace(/\//g, '_').replace(/\./g, '_').replace(/\s+/g, '_')
    .replace(/[^\w-]/g, '').slice(0, 500) || 'unknown';

// ─── History ──────────────────────────────────────────────────────────────────
export const historyStorage = {
  getAll: (): HistoryItem[] =>
    getJSON<HistoryItem[]>(storageMain, HISTORY_KEY, []),

  add: (anime: Anime, episodeIndex: number): void => {
    const history = historyStorage.getAll();
    const filtered = history.filter(h => h.anime.id !== anime.id);
    const updated: HistoryItem[] = [
      { anime, episodeIndex, timestamp: Date.now() },
      ...filtered,
    ].slice(0, MAX_HISTORY);
    setJSON(storageMain, HISTORY_KEY, updated);
  },

  clear: (): void => {
    storageMain.delete(HISTORY_KEY);
  },

  getAutoNext: (): boolean =>
    storageMain.getBoolean(AUTONEXT_KEY) ?? false,

  setAutoNext: (val: boolean): void => {
    storageMain.set(AUTONEXT_KEY, val);
  },
};

// ─── Search history ───────────────────────────────────────────────────────────
export const getSearchHistory = (): string[] =>
  getJSON<string[]>(storageMain, SEARCH_HISTORY_KEY, []);

export const addSearchHistory = (term: string): void => {
  if (!term?.trim()) return;
  const prev = getSearchHistory();
  const filtered = prev.filter(t => t.toLowerCase() !== term.toLowerCase());
  const updated = [term.trim(), ...filtered].slice(0, MAX_SEARCH_HISTORY);
  setJSON(storageMain, SEARCH_HISTORY_KEY, updated);
};

export const clearSearchHistory = (): void => {
  storageMain.delete(SEARCH_HISTORY_KEY);
};

// ─── Progress ─────────────────────────────────────────────────────────────────
// Synchronous — aman dipanggil dari onProgress tiap detik tanpa await
export type ProgressData = { position: number; duration: number };

export const progressStorage = {
  get: (epId: string): ProgressData | null => {
    try {
      const raw = storageProgress.getString(sanitizeKey(epId));
      if (!raw) return null;
      const parsed = JSON.parse(raw) as ProgressData;
      return typeof parsed.position === 'number' ? parsed : null;
    } catch { return null; }
  },

  save: (epId: string, position: number, duration: number): void => {
    try {
      const key = sanitizeKey(epId);
      if (duration > 0 && position > 5 && position < duration - 30) {
        storageProgress.set(key, JSON.stringify({ position, duration }));
      } else if (duration > 0 && position >= duration - 30) {
        storageProgress.delete(key);
      }
    } catch {}
  },

  clear: (epId: string): void => {
    try { storageProgress.delete(sanitizeKey(epId)); } catch {}
  },
};

// ─── Favorit ──────────────────────────────────────────────────────────────────
export const favoritStorage = {
  getAll: (): Anime[] =>
    getJSON<Anime[]>(storageMain, FAVORIT_KEY, []),

  isFavorited: (animeId: string): boolean =>
    favoritStorage.getAll().some(a => a.id === animeId),

  toggle: (anime: Anime): boolean => {
    const list = favoritStorage.getAll();
    const exists = list.some(a => a.id === anime.id);
    if (exists) {
      setJSON(storageMain, FAVORIT_KEY, list.filter(a => a.id !== anime.id));
      return false;
    } else {
      setJSON(storageMain, FAVORIT_KEY, [anime, ...list]);
      return true;
    }
  },

  remove: (animeId: string): void => {
    const list = favoritStorage.getAll();
    setJSON(storageMain, FAVORIT_KEY, list.filter(a => a.id !== animeId));
  },

  clear: (): void => {
    storageMain.delete(FAVORIT_KEY);
  },
};
