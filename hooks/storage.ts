import { MMKV } from 'react-native-mmkv';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Anime, HistoryItem } from '@/types';

// ─── MMKV instance ────────────────────────────────────────────────────────────
const storage = new MMKV({ id: 'nefusoft-storage' });

const HISTORY_KEY        = 'nefusoft_history';
const AUTONEXT_KEY       = 'nefusoft_autonext';
const SEARCH_HISTORY_KEY = 'nefusoft_search_history';
const PROGRESS_PREFIX    = 'nefusoft_progress_';
const MAX_HISTORY        = 50;
const MAX_SEARCH_HISTORY = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getJSON = <T>(key: string, fallback: T): T => {
  try {
    const raw = storage.getString(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const setJSON = (key: string, value: any): void => {
  try {
    storage.set(key, JSON.stringify(value));
  } catch {}
};

/**
 * Sanitize string buat Firestore doc ID.
 * Firestore ga boleh: '/', '.', '..', spasi, karakter kontrol.
 * Kalau anime.id berisi URL atau path, ini prevent crash.
 */
const sanitizeDocId = (id: string): string =>
  id
    .replace(/\//g, '_')   // slash → underscore
    .replace(/\./g, '_')   // dot → underscore
    .replace(/\s+/g, '_')  // spasi → underscore
    .replace(/[^\w-]/g, '') // hapus karakter non-alphanumeric kecuali _ dan -
    .slice(0, 500)          // max 500 char (Firestore limit)
    || 'unknown';

// ─── History ──────────────────────────────────────────────────────────────────

export const historyStorage = {
  getAll: (): HistoryItem[] => getJSON<HistoryItem[]>(HISTORY_KEY, []),

  add: (anime: Anime, episodeIndex: number): void => {
    const history = historyStorage.getAll();
    const filtered = history.filter(h => h.anime.id !== anime.id);
    const updated: HistoryItem[] = [
      { anime, episodeIndex, timestamp: Date.now() },
      ...filtered,
    ].slice(0, MAX_HISTORY);
    setJSON(HISTORY_KEY, updated);
  },

  clear: (): void => {
    storage.delete(HISTORY_KEY);
  },

  getAutoNext: (): boolean => {
    return storage.getBoolean(AUTONEXT_KEY) ?? false;
  },

  setAutoNext: (val: boolean): void => {
    storage.set(AUTONEXT_KEY, val);
  },
};

// ─── Search History ───────────────────────────────────────────────────────────

export const getSearchHistory = (): string[] =>
  getJSON<string[]>(SEARCH_HISTORY_KEY, []);

export const addSearchHistory = (term: string): void => {
  if (!term?.trim()) return;
  const prev = getSearchHistory();
  const filtered = prev.filter(t => t.toLowerCase() !== term.toLowerCase());
  const updated = [term.trim(), ...filtered].slice(0, MAX_SEARCH_HISTORY);
  setJSON(SEARCH_HISTORY_KEY, updated);
};

export const clearSearchHistory = (): void => {
  storage.delete(SEARCH_HISTORY_KEY);
};

// ─── Progress Storage ─────────────────────────────────────────────────────────

export const progressStorage = {
  get: (epId: string): number => {
    try {
      // ✅ sanitize key buat MMKV juga — epId bisa berisi karakter aneh
      const key = `${PROGRESS_PREFIX}${sanitizeDocId(epId)}`;
      return storage.getNumber(key) ?? 0;
    } catch {
      return 0;
    }
  },

  save: (epId: string, position: number, duration: number): void => {
    try {
      const key = `${PROGRESS_PREFIX}${sanitizeDocId(epId)}`;
      if (duration > 0 && position > 5 && position < duration - 30) {
        storage.set(key, position);
      } else if (duration > 0 && position >= duration - 30) {
        storage.delete(key);
      }
    } catch {}
  },

  clear: (epId: string): void => {
    try {
      storage.delete(`${PROGRESS_PREFIX}${sanitizeDocId(epId)}`);
    } catch {}
  },
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
      // ✅ sanitize doc ID — prevent crash kalau anime.id berisi slash/URL
      await ref.doc(sanitizeDocId(anime.id)).set({ anime, savedAt: Date.now() });
    } catch {}
  },

  remove: async (animeId: string): Promise<void> => {
    try {
      const ref = getUserFavRef();
      if (!ref) return;
      await ref.doc(sanitizeDocId(animeId)).delete();
    } catch {}
  },

  isFavorited: async (animeId: string): Promise<boolean> => {
    try {
      const ref = getUserFavRef();
      if (!ref) return false;
      const doc = await ref.doc(sanitizeDocId(animeId)).get();
      return doc.exists;
    } catch {
      return false;
    }
  },

  toggle: async (anime: Anime): Promise<boolean> => {
    const isFav = await favoritStorage.isFavorited(anime.id);
    if (isFav) { await favoritStorage.remove(anime.id); return false; }
    else { await favoritStorage.add(anime); return true; }
  },
};
