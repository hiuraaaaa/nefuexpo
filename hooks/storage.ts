import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
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

// ─── Favorit (Firestore) ─────────────────────────────────────────────────────

const getUserFavRef = () => {
  const user = auth().currentUser;
  if (!user) return null;
  return firestore().collection('users').doc(user.uid).collection('favorites');
};

export const favoritStorage = {
  getAll: async (): Promise<Anime[]> => {
    try {
      const ref = getUserFavRef();
      if (!ref) return [];
      const snap = await ref.orderBy('savedAt', 'desc').get();
      return snap.docs.map(d => d.data().anime as Anime);
    } catch {
      return [];
    }
  },

  add: async (anime: Anime): Promise<void> => {
    try {
      const ref = getUserFavRef();
      if (!ref) return;
      await ref.doc(anime.id).set({ anime, savedAt: Date.now() });
    } catch {}
  },

  remove: async (animeId: string): Promise<void> => {
    try {
      const ref = getUserFavRef();
      if (!ref) return;
      await ref.doc(animeId).delete();
    } catch {}
  },

  isFavorited: async (animeId: string): Promise<boolean> => {
    try {
      const ref = getUserFavRef();
      if (!ref) return false;
      const doc = await ref.doc(animeId).get();
      return doc.exists;
    } catch {
      return false;
    }
  },

  toggle: async (anime: Anime): Promise<boolean> => {
    const isFav = await favoritStorage.isFavorited(anime.id);
    if (isFav) {
      await favoritStorage.remove(anime.id);
      return false;
    } else {
      await favoritStorage.add(anime);
      return true;
    }
  },
};

// ─── Progress Storage ─────────────────────────────────────────────────────────

const PROGRESS_KEY = 'nefusoft_progress';

export const progressStorage = {
  get: async (epId: string): Promise<number> => {
    try {
      const raw = await AsyncStorage.getItem(`${PROGRESS_KEY}_${epId}`);
      return raw ? parseFloat(raw) : 0;
    } catch {
      return 0;
    }
  },

  save: async (epId: string, position: number, duration: number): Promise<void> => {
    try {
      if (duration > 0 && position > 5) {
        await AsyncStorage.setItem(`${PROGRESS_KEY}_${epId}`, String(position));
      }
    } catch {}
  },

  clear: async (epId: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(`${PROGRESS_KEY}_${epId}`);
    } catch {}
  },
};
