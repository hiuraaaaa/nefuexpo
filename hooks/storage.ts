import AsyncStorage from '@react-native-async-storage/async-storage';
import { Anime, HistoryItem } from '@/types';

const HISTORY_KEY = 'nefusoft_history';
const AUTONEXT_KEY = 'nefusoft_autonext';
const SEARCH_HISTORY_KEY = 'nefusoft_search_history';
const MAX_HISTORY = 50;
const MAX_SEARCH_HISTORY = 10;

export const historyStorage = {
  getAll: async (): Promise<HistoryItem[]> => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  add: async (anime: Anime, episodeIndex: number): Promise<void> => {
    try {
      const history = await historyStorage.getAll();
      const filtered = history.filter(h => h.anime.id !== anime.id);
      const updated: HistoryItem[] = [
        { anime, episodeIndex, timestamp: Date.now() },
        ...filtered,
      ].slice(0, MAX_HISTORY);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch {}
  },

  clear: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(HISTORY_KEY);
    } catch {}
  },

  getAutoNext: async (): Promise<boolean> => {
    try {
      const val = await AsyncStorage.getItem(AUTONEXT_KEY);
      return val === 'true';
    } catch {
      return false;
    }
  },

  setAutoNext: async (val: boolean): Promise<void> => {
    try {
      await AsyncStorage.setItem(AUTONEXT_KEY, String(val));
    } catch {}
  },
};

// ─── Search History ───────────────────────────────────────────────────────────

export const getSearchHistory = async (): Promise<string[]> => {
  try {
    const raw = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const addSearchHistory = async (term: string): Promise<void> => {
  if (!term?.trim()) return;
  try {
    const prev = await getSearchHistory();
    const filtered = prev.filter(t => t.toLowerCase() !== term.toLowerCase());
    const updated = [term.trim(), ...filtered].slice(0, MAX_SEARCH_HISTORY);
    await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
  } catch {}
};

export const clearSearchHistory = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch {}
};
