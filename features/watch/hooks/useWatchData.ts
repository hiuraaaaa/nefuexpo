import { useState, useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { api } from '@/hooks/api/api';
import { progressStorage } from '@/hooks/storage/storage';
import { AnimeDetail, Episode, Anime } from '@/types';

const EP_PAGE_SIZE = 100;

export function useWatchData(animeId: string, epParam?: string) {
  const [anime, setAnime]               = useState<AnimeDetail | null>(null);
  const [episodes, setEpisodes]         = useState<Episode[]>([]);
  const [filteredEps, setFilteredEps]   = useState<Episode[]>([]);
  const [epSearch, setEpSearch]         = useState('');
  const [epPage, setEpPage]             = useState(0);
  const [currentEpId, setCurrentEpId]   = useState<string | null>(null);
  const [recommendations, setRecs]      = useState<Anime[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [epProgress, setEpProgress]     = useState<Record<string, number>>({});
  const [watchedEps, setWatchedEps]     = useState<Set<string>>(new Set());

  const load = async () => {
    if (!animeId) return;
    setIsLoading(true);
    try {
      const detailRes = await api.detail(animeId);
      if (detailRes.status && detailRes.data) {
        setAnime(detailRes.data);
        const eps = detailRes.data.episode_list || [];
        setEpisodes(eps);
        setFilteredEps(eps);

        const progressMap: Record<string, number> = {};
        const watched = new Set<string>();
        for (const ep of eps) {
          const saved = progressStorage.get(ep.id);
          if (saved && saved.position > 0) {
            const ratio = saved.duration > 0 ? saved.position / saved.duration : 0;
            if (ratio > 0.9) watched.add(ep.id);
            else progressMap[ep.id] = ratio;
          }
        }
        setEpProgress(progressMap);
        setWatchedEps(watched);

        const target = epParam
          ? eps.find((e: Episode) => e.index.toString() === epParam)
          : eps[eps.length - 1];
        if (target) setCurrentEpId(target.id);
      }
      api.rekomendasi().then(r => setRecs((r.data || []).slice(0, 5))).catch(() => {});
    } catch {}
    setIsLoading(false);
  };

  useEffect(() => {
    load();
    const unsub = NetInfo.addEventListener(state => {
      if (state.isConnected && !anime) load();
    });
    return () => unsub();
  }, [animeId]);

  useEffect(() => {
    if (!epSearch.trim()) setFilteredEps(episodes);
    else setFilteredEps(episodes.filter(e => String(e.index).includes(epSearch.trim())));
  }, [epSearch, episodes]);

  useEffect(() => {
    if (!currentEpId) return;
    setEpSearch('');
    setFilteredEps(episodes);
    const idx = episodes.findIndex(e => e.id === currentEpId);
    if (idx >= 0) setEpPage(Math.floor(idx / EP_PAGE_SIZE));
  }, [currentEpId, episodes]);

  return {
    anime, episodes, filteredEps, epSearch, setEpSearch,
    epPage, setEpPage, currentEpId, setCurrentEpId,
    recommendations, isLoading, epProgress, setEpProgress,
    watchedEps, setWatchedEps,
  };
}
