import { useEffect, useRef } from 'react';
import { progressStorage } from '@/hooks/storage/storage';
import { xpStorage } from '@/hooks/xp';

interface Deps {
  currentEpId: string | null;
  position: number;
  duration: number;
  setEpProgress: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setWatchedEps: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export function useProgressTracker({ currentEpId, position, duration, setEpProgress, setWatchedEps }: Deps) {
  const lastSaveTime  = useRef(0);
  const xpAwardedEps  = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!currentEpId || duration <= 0) return;

    const now = Date.now();
    if (now - lastSaveTime.current < 5000) return;
    lastSaveTime.current = now;

    progressStorage.save(currentEpId, position, duration);
    const prog = position / duration;

    setEpProgress(prev => ({ ...prev, [currentEpId]: prog }));

    if (prog > 0.9) {
      setWatchedEps(prev => new Set([...prev, currentEpId]));
      setEpProgress(prev => { const n = { ...prev }; delete n[currentEpId]; return n; });
    }

    if (prog >= 0.7 && !xpAwardedEps.current.has(currentEpId)) {
      xpAwardedEps.current.add(currentEpId);
      xpStorage.add(10);
    }
  }, [position]);
}
