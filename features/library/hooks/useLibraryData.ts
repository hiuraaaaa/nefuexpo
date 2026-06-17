// features/library/hooks/useLibraryData.ts
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { favoritStorage, historyStorage } from '@/hooks/storage/storage';
import { getCurrentUser } from '@/hooks/auth';
import { Anime, HistoryItem } from '@/types';

export type LibraryTab = 'favorit' | 'history';

export function useLibraryData() {
  const [favorites, setFavorites] = useState<Anime[]>([]);
  const [history, setHistory]     = useState<HistoryItem[]>([]);
  const [loading, setLoading]     = useState(true);

  const user = getCurrentUser();

  const reload = useCallback(() => {
    setLoading(true);
    try {
      setFavorites(favoritStorage.getAll() ?? []);
      setHistory(historyStorage.getAll() ?? []);
    } catch {}
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const removeFavorite = useCallback((anime: Anime) => {
    Alert.alert('Hapus Favorit', `Hapus ${anime.title} dari favorit?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => {
          favoritStorage.remove(anime.id);
          setFavorites(prev => prev.filter(a => a.id !== anime.id));
        },
      },
    ]);
  }, []);

  const clearHistory = useCallback(() => {
    Alert.alert('Hapus Riwayat', 'Hapus semua riwayat tontonan?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => {
          historyStorage.clear();
          setHistory([]);
        },
      },
    ]);
  }, []);

  return {
    user,
    loading,
    favorites,
    history,
    removeFavorite,
    clearHistory,
    reload,
  };
}

