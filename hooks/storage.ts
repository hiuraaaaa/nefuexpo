import AsyncStorage from '@react-native-async-storage/async-storage';
import { Anime, HistoryItem } from '@/types';

const HISTORY_KEY = 'nefusoft_history';
const AUTONEXT_KEY = 'nefusoft_autonext';
const MAX_HISTORY = 50;

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
