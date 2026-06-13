import { useState, useEffect, useRef } from 'react';
import { useVideoPlayer } from 'expo-video';
import { api } from '@/hooks/api/api';
import { progressStorage } from '@/hooks/storage/storage';
import { Server } from '@/types';

export type ServerGroup = { [quality: string]: Server[] };

export function useEpisodeLoader(currentEpId: string | null) {
  const [serverGroup, setServerGroup]         = useState<ServerGroup>({});
  const [selectedQuality, setSelectedQuality] = useState('');
  const [selectedServer, setSelectedServer]   = useState<Server | null>(null);
  const [isEpLoading, setIsEpLoading]         = useState(false);

  const player = useVideoPlayer(
    selectedServer?.link ? { uri: selectedServer.link } : null,
    p => { p.pause(); }
  );

  useEffect(() => {
    if (!currentEpId) return;
    const load = async () => {
      setIsEpLoading(true);
      setServerGroup({});
      setSelectedQuality('');
      setSelectedServer(null);
      try {
        const res = await api.episode(currentEpId);
        if (res.status && res.data) {
          const allServers: Server[] = res.data.server || [];
          const group: ServerGroup = {};
          allServers.forEach((s: Server, i: number) => {
            const q = s.quality || 'AUTO';
            if (!group[q]) group[q] = [];
            group[q].push({ ...s, id: String(i) });
          });
          setServerGroup(group);
          const qualities = ['1080p', '720p', '480p', '360p'];
          const bestQ = qualities.find(q => group[q]?.length > 0) || Object.keys(group)[0];
          if (bestQ && group[bestQ]?.length > 0) {
            setSelectedQuality(bestQ);
            setSelectedServer(group[bestQ][0]);
            const saved = progressStorage.get(currentEpId);
            if (saved && saved.position > 5) {
              setTimeout(() => {
                if (player) player.seekBy(saved.position - (player.currentTime ?? 0));
              }, 800);
            }
          }
        }
      } catch {}
      setIsEpLoading(false);
    };
    load();
  }, [currentEpId]);

  const selectQualityAndServer = (quality: string, server: Server, currentPosition: number) => {
    setSelectedQuality(quality);
    setSelectedServer(server);
    setTimeout(() => {
      if (player) player.seekBy(currentPosition - (player.currentTime ?? 0));
    }, 300);
  };

  const availableQualities = Object.keys(serverGroup).filter(q => serverGroup[q]?.length > 0);

  return {
    player, serverGroup, selectedQuality, selectedServer,
    isEpLoading, availableQualities, selectQualityAndServer,
  };
}
