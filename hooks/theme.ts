import { useState, useEffect } from 'react';
import { MMKV } from 'react-native-mmkv';
import { THEMES, Theme } from '@/constants';

const storage   = new MMKV({ id: 'nefusoft-theme' });
const THEME_KEY = 'nefusoft_theme';

// ✅ Baca MMKV synchronous saat module pertama di-import
// Jadi globalTheme udah bener sebelum component apapun render — ga ngeblink
const _savedId = (() => {
  try { return storage.getString(THEME_KEY) ?? null; } catch { return null; }
})();

let globalTheme: Theme                = THEMES.find(t => t.id === _savedId) ?? THEMES[0];
let listeners: ((t: Theme) => void)[] = [];

const notifyListeners = (t: Theme) => listeners.forEach(fn => fn(t));

export const setGlobalTheme = (themeId: string): void => {
  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0];
  globalTheme = theme;
  storage.set(THEME_KEY, themeId);
  notifyListeners(theme);
};

export const useTheme = (): Theme => {
  const [theme, setTheme] = useState<Theme>(globalTheme);

  useEffect(() => {
    listeners.push(setTheme);
    // Sync ulang kalau ada perubahan antara module load dan mount
    setTheme(globalTheme);
    return () => {
      listeners = listeners.filter(fn => fn !== setTheme);
    };
  }, []);

  return theme;
};
