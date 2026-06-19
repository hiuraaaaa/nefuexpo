import { useState, useEffect, useCallback, useRef } from 'react';

import firestore from '@react-native-firebase/firestore';
import { api, shuffleArray } from '@/hooks/api/api';
import { getHomeCache, clearHomeCache, prefetchHome } from '@/hooks/prefetch';
import { Anime, ScheduleDay } from '@/types';


const getTodayKey = (): string => {
  const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
  return days[new Date().getDay()];
};

export const todayLabel = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][new Date().getDay()];

export function useHomeData() {
  const [ongoing, setOngoing]             = useState<Anime[]>([]);
  const [movies, setMovies]               = useState<Anime[]>([]);
  const [todayAnime, setTodayAnime]       = useState<Anime[]>([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [dismissedIds, setDismissedIds]   = useState<Set<string>>(new Set());

  // Announcements realtime
  useEffect(() => {
    const unsub = firestore()
      .collection('announcements')
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(3)
      .onSnapshot(snap => {
        setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, () => {});
    return unsub;
  }, []);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) clearHomeCache();

      const cached = getHomeCache();
      if (cached && !isRefresh) {
        const todayKey = getTodayKey();
        setOngoing(shuffleArray(cached.ongoing));
        setMovies(cached.movies);
        setTodayAnime(cached.schedule?.[todayKey] || []);
        setIsLoading(false);
        setRefreshing(false);
        prefetchHome();
        return;
      }

      const results = await api.home();
      const [_rekom, ongRes, _comp, movRes, schedRes] = results;

      setOngoing(shuffleArray(ongRes.data || []));
      setMovies(movRes.data || []);
      const todayKey  = getTodayKey();
      const schedData = schedRes.data as ScheduleDay;
      setTodayAnime(schedData?.[todayKey] || []);
    } catch (e: any) {
      console.error('[HOME] FETCH ERROR:', e?.message);
    }
    setIsLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchData(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(true);
  }, [fetchData]);

  const dismissAnnouncement = useCallback((id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
  }, []);

  const visibleAnnouncements = announcements.filter(a => !dismissedIds.has(a.id));

  return {
    ongoing, movies, todayAnime,
    isLoading, refreshing, onRefresh,
    visibleAnnouncements, dismissAnnouncement,
  };
}
