import { useEffect, useRef, useCallback } from 'react';
import type { RoomState } from './useRoom';

const SYNC_THRESHOLD = 3;    // detik — kalau beda lebih dari ini, auto-seek
const PUSH_INTERVAL  = 3000; // ms — host push posisi tiap 3 detik

interface SyncDeps {
  room: RoomState | null;
  isHost: boolean;
  player: any | null;
  isPlaying: boolean;
  position: number;
  updatePlayback: (update: any) => Promise<void>;
  onEpisodeChange?: (episodeId: string, episodeNum: number) => void;
}

export function useSync({
  room, isHost, player, isPlaying, position, updatePlayback, onEpisodeChange,
}: SyncDeps) {
  const pushIntervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSyncedEpisode = useRef<string | null>(null);
  const isSeeking         = useRef(false);
  // FIX BUG 2: simpan ref isPlaying supaya interval selalu baca nilai terbaru
  const isPlayingRef      = useRef(isPlaying);
  isPlayingRef.current    = isPlaying;

  // ── HOST: push posisi ke Firestore tiap 3 detik ──────────────────────────
  useEffect(() => {
    if (!isHost || !room) return;
    if (pushIntervalRef.current) clearInterval(pushIntervalRef.current);

    pushIntervalRef.current = setInterval(() => {
      if (player) {
        updatePlayback({
          position:   player.currentTime ?? 0,
          is_playing: isPlayingRef.current, // pakai ref, bukan stale closure
        });
      }
    }, PUSH_INTERVAL);

    return () => { if (pushIntervalRef.current) clearInterval(pushIntervalRef.current); };
  }, [isHost, room?.code, player, updatePlayback]); // FIX: room?.code bukan room object

  // ── HOST: push play/pause langsung ───────────────────────────────────────
  const hostTogglePlay = useCallback(async (playing: boolean) => {
    if (!isHost) return;
    await updatePlayback({ is_playing: playing, position: player?.currentTime ?? 0 });
  }, [isHost, player, updatePlayback]);

  // ── HOST: push seek langsung ──────────────────────────────────────────────
  const hostSeek = useCallback(async (pos: number) => {
    if (!isHost) return;
    await updatePlayback({ position: pos });
  }, [isHost, updatePlayback]);

  // ── MEMBER: sync dari Firestore ───────────────────────────────────────────
  useEffect(() => {
    if (isHost || !room || !player) return;

    // FIX BUG 2: episode pertama join — init lastSyncedEpisode tanpa trigger change
    if (lastSyncedEpisode.current === null) {
      lastSyncedEpisode.current = room.episode_id;
      // Langsung sync posisi host setelah join
      const currentPos = player.currentTime ?? 0;
      const diff = Math.abs(currentPos - room.position);
      if (diff > SYNC_THRESHOLD) {
        isSeeking.current = true;
        player.seekBy(room.position - currentPos);
        setTimeout(() => { isSeeking.current = false; }, 1000);
      }
      return;
    }

    // Episode berubah (host ganti ep)
    if (room.episode_id !== lastSyncedEpisode.current) {
      lastSyncedEpisode.current = room.episode_id;
      onEpisodeChange?.(room.episode_id, room.episode_num);
      return;
    }

    // Sync play/pause — pakai isPlayingRef supaya ga stale
    const currentlyPlaying = isPlayingRef.current;
    if (room.is_playing && !currentlyPlaying) {
      player.play();
    } else if (!room.is_playing && currentlyPlaying) {
      player.pause();
    }

    // Sync posisi kalau drift > threshold
    const currentPos = player.currentTime ?? 0;
    const diff = Math.abs(currentPos - room.position);
    if (diff > SYNC_THRESHOLD && !isSeeking.current) {
      isSeeking.current = true;
      player.seekBy(room.position - currentPos);
      setTimeout(() => { isSeeking.current = false; }, 1000);
    }
  // FIX BUG 2: tambah player dan isHost ke dependency
  }, [room?.is_playing, room?.position, room?.episode_id, player, isHost]);

  // Reset lastSyncedEpisode kalau keluar room
  useEffect(() => {
    if (!room) {
      lastSyncedEpisode.current = null;
    }
  }, [room]);

  return { hostTogglePlay, hostSeek };
}
