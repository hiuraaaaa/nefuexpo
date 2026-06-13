import { useCallback } from 'react';
import { Episode } from '@/types';

export function useEpisodeNav(
  episodes: Episode[],
  currentEpId: string | null,
  setCurrentEpId: (id: string) => void,
) {
  const epIndex    = episodes.findIndex(e => e.id === currentEpId);
  const currentEp  = episodes.find(e => e.id === currentEpId);
  const currentEpNum = currentEp?.index || 0;

  const changeEpisode = useCallback((ep: Episode) => {
    setCurrentEpId(ep.id);
  }, [setCurrentEpId]);

  const handlePrev = useCallback(() => {
    if (epIndex < episodes.length - 1) changeEpisode(episodes[epIndex + 1]);
  }, [epIndex, episodes, changeEpisode]);

  const handleNext = useCallback(() => {
    if (epIndex > 0) changeEpisode(episodes[epIndex - 1]);
  }, [epIndex, episodes, changeEpisode]);

  const canGoPrev = epIndex < episodes.length - 1;
  const canGoNext = epIndex > 0;

  return { epIndex, currentEpNum, changeEpisode, handlePrev, handleNext, canGoPrev, canGoNext };
}
