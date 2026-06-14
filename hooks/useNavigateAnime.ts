import { useRef, useCallback } from 'react';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { getAnimeSlug } from '@/hooks/api/api';
import { Anime } from '@/types';

export function useNavigateAnime() {
  const router       = useRouter();
  const isNavigating = useRef(false);

  const goToAnime = useCallback((anime: Anime) => {
    if (isNavigating.current) return;
    isNavigating.current = true;
    Haptics.selectionAsync();
    router.push(`/watch/${getAnimeSlug(anime)}`);
    setTimeout(() => { isNavigating.current = false; }, 1500);
  }, [router]);

  return { goToAnime };
      }
