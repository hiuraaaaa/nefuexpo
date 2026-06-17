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

  // ── Player init sekali dengan source kosong ──────────────────────────────
  // JANGAN pakai selectedServer?.link sebagai source langsung —
  // itu bikin useVideoPlayer re-init tiap render → FC + layar hitam
  const player = useVideoPlayer(null, p => {
    p.pause();
  });

  // ── Ganti source via player.replace() bukan re-init ──────────────────────
  useEffect(() => {
    if (!selectedServer?.link) return;
    try {
      player.replace({ uri: selectedServer.link });
      player.pause();
      // Reset posisi ke 0 biar durasi ga carry over dari episode sebelumnya
      try { player.seekBy(-(player.currentTime ?? 0)); } catch {}
    } catch {}
  }, [selectedServer?.link]);

  // ── Load servers saat episode berubah ────────────────────────────────────
  useEffect(() => {
    if (!currentEpId) return;
    const load = async () => {
      setIsEpLoading(true);
      setServerGroup({});
      setSelectedQuality('');
      setSelectedServer(null);
      // Reset posisi player ke 0 saat ganti episode
      try { player.seekBy(-(player.currentTime ?? 0)); } catch {}
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
            // Restore progress setelah player replace (delay biar buffering dulu)
            const saved = progressStorage.get(currentEpId);
            if (saved && saved.position > 5) {
              setTimeout(() => {
                try {
                  const diff = saved.position - (player.currentTime ?? 0);
                  if (Math.abs(diff) > 2) player.seekBy(diff);
                } catch {}
              }, 1500);
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
    // Restore posisi setelah ganti server
    setTimeout(() => {
      try {
        const diff = currentPosition - (player.currentTime ?? 0);
        if (Math.abs(diff) > 2) player.seekBy(diff);
      } catch {}
    }, 800);
  };

  const availableQualities = Object.keys(serverGroup).filter(q => serverGroup[q]?.length > 0);

  return {
    player, serverGroup, selectedQuality, selectedServer,
    isEpLoading, availableQualities, selectQualityAndServer,
  };
}
