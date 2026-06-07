import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Anime, HistoryItem } from '@/types';

const HISTORY_KEY        = 'nefusoft_history';
const AUTONEXT_KEY       = 'nefusoft_autonext';
const SEARCH_HISTORY_KEY = 'nefusoft_search_history';
const PROGRESS_PREFIX    = 'nefusoft_progress_';
const MAX_HISTORY        = 50;
const MAX_SEARCH_HISTORY = 10;

const getJSON = async <T>(key: string, fallback: T): Promise<T> => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};

const setJSON = async (key: string, value: any): Promise<void> => {
  try { await AsyncStorage.setItem(key, JSON.stringify(value)); } catch {}
};

const sanitizeDocId = (id: string): string =>
  id.replace(/\//g, '_').replace(/\./g, '_').replace(/\s+/g, '_')
    .replace(/[^\w-]/g, '').slice(0, 500) || 'unknown';

export const historyStorage = {
  getAll: async (): Promise<HistoryItem[]> => getJSON<HistoryItem[]>(HISTORY_KEY, []),

  add: async (anime: Anime, episodeIndex: number): Promise<void> => {
    const history = await historyStorage.getAll();
    const filtered = history.filter(h => h.anime.id !== anime.id);
    const updated: HistoryItem[] = [
      { anime, episodeIndex, timestamp: Date.now() },
      ...filtered,
    ].slice(0, MAX_HISTORY);
    await setJSON(HISTORY_KEY, updated);
  },

  clear: async (): Promise<void> => {
    await AsyncStorage.removeItem(HISTORY_KEY);
  },

  getAutoNext: async (): Promise<boolean> => {
    try {
      const val = await AsyncStorage.getItem(AUTONEXT_KEY);
      return val === 'true';
    } catch { return false; }
  },

  setAutoNext: async (val: boolean): Promise<void> => {
    try { await AsyncStorage.setItem(AUTONEXT_KEY, String(val)); } catch {}
  },
};

export const getSearchHistory = async (): Promise<string[]> =>
  getJSON<string[]>(SEARCH_HISTORY_KEY, []);

export const addSearchHistory = async (term: string): Promise<void> => {
  if (!term?.trim()) return;
  const prev = await getSearchHistory();
  const filtered = prev.filter(t => t.toLowerCase() !== term.toLowerCase());
  const updated = [term.trim(), ...filtered].slice(0, MAX_SEARCH_HISTORY);
  await setJSON(SEARCH_HISTORY_KEY, updated);
};

export const clearSearchHistory = async (): Promise<void> => {
  await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
};

export type ProgressData = { position: number; duration: number };

export const progressStorage = {
  get: async (epId: string): Promise<ProgressData | null> => {
    try {
      const key = `${PROGRESS_PREFIX}${sanitizeDocId(epId)}`;
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as ProgressData;
      if (typeof parsed.position !== 'number') return null;
      return parsed;
    } catch { return null; }
  },

  save: async (epId: string, position: number, duration: number): Promise<void> => {
    try {
      const key = `${PROGRESS_PREFIX}${sanitizeDocId(epId)}`;
      if (duration > 0 && position > 5 && position < duration - 30) {
        await AsyncStorage.setItem(key, JSON.stringify({ position, duration }));
      } else if (duration > 0 && position >= duration - 30) {
        await AsyncStorage.removeItem(key);
      }
    } catch {}
  },

  clear: async (epId: string): Promise<void> => {
    try { await AsyncStorage.removeItem(`${PROGRESS_PREFIX}${sanitizeDocId(epId)}`); } catch {}
  },
};
