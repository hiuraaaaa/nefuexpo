import { useState, useEffect, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { api, getAnimeSlug } from '@/hooks/api/api';
import { Anime, Genre } from '@/types';

export function useExplore(initialQuery = '') {
  const [query, setQuery]                   = useState(initialQuery);
  const [genres, setGenres]                 = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [results, setResults]               = useState<Anime[]>([]);
  const [page, setPage]                     = useState(0);
  const [isLoading, setIsLoading]           = useState(true);
  const [loadingMore, setLoadingMore]       = useState(false);
  const [hasMore, setHasMore]               = useState(true);

  // Fetch genre list sekali
  useEffect(() => {
    api.genre().then(r => setGenres(r.data || [])).catch(() => {});
  }, []);

  // Fetch utama — cancelled flag per-effect biar gak ada stale response
  useEffect(() => {
    let cancelled = false;

    const doFetch = async () => {
      if (page === 0) setIsLoading(true);
      else setLoadingMore(true);

      try {
        let res;
        if (query)                          res = await api.search(query, page);
        else if (selectedGenres.length > 0) res = await api.genreFilter(selectedGenres, page);
        else                                res = await api.animeList(page);

        if (cancelled) return;

        const newData: Anime[] = res?.data || [];
        if (page === 0) setResults(newData);
        else setResults(prev => [...prev, ...newData]);
        setHasMore(newData.length >= 12);
      } catch {
        if (cancelled) return;
        if (page === 0) setResults([]);
        setHasMore(false);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setLoadingMore(false);
        }
      }
    };

    doFetch();
    return () => { cancelled = true; };
  }, [page, query, selectedGenres]);

  const reset = useCallback((newQuery = query, newGenres = selectedGenres) => {
    setPage(0);
    setResults([]);
    setHasMore(true);
    setQuery(newQuery);
    setSelectedGenres(newGenres);
  }, [query, selectedGenres]);

  const handleQueryChange = useCallback((t: string) => {
    reset(t, []);
  }, []);

  const clearQuery = useCallback(() => {
    reset('', []);
  }, []);

  const toggleGenre = useCallback((id: string) => {
    Haptics.selectionAsync();
    const next = selectedGenres.includes(id)
      ? selectedGenres.filter(g => g !== id)
      : [...selectedGenres, id];
    reset(query, next);
  }, [selectedGenres, query]);

  const clearGenres = useCallback(() => {
    Haptics.selectionAsync();
    reset(query, []);
  }, [query]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      Haptics.selectionAsync();
      setPage(p => p + 1);
    }
  }, [loadingMore, hasMore]);

  return {
    query,
    genres,
    selectedGenres,
    results,
    isLoading,
    loadingMore,
    hasMore,
    handleQueryChange,
    clearQuery,
    toggleGenre,
    clearGenres,
    handleLoadMore,
    getSlug: getAnimeSlug,
  };
}
