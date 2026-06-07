import AsyncStorage from '@react-native-async-storage/async-storage';

const XP_KEY = 'nefusoft_xp';

const getLocal = async (): Promise<XPData> => {
  try {
    const raw = await AsyncStorage.getItem(XP_KEY);
    return raw ? JSON.parse(raw) : { xp: 0, level: 1, streak: 0, lastWatchDate: '', _todayXP: 0 };
  } catch {
    return { xp: 0, level: 1, streak: 0, lastWatchDate: '', _todayXP: 0 };
  }
};

const setLocal = async (data: XPData): Promise<void> => {
  try { await AsyncStorage.setItem(XP_KEY, JSON.stringify(data)); } catch {}
};
