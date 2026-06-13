import { useEffect, useRef, useCallback } from 'react';
import firestore from '@react-native-firebase/firestore';
import type { VideoPlayer } from 'expo-video';
import type { RoomData } from './useRoom';

const SYNC_INTERVAL_MS = 3000;   // push ke Firestore tiap 3 detik (host)
const DRIFT_THRESHOLD  = 3;      // detik — kalau beda > 3 detik, auto-seek

interface UseSyncOptions {
  player:    VideoPlayer | null;
  roomCode:  string | null;
  roomData:  RoomData | null;
  isHost:    boolean;
  isPlaying: boolean;
  position:  number;
}

export function useSync({
  player, roomCode, roomData, isHost, isPlaying, position,
}: UseSyncOptions) {
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPushedPos   = useRef<number>(0);
  const isSeeking       = useRef(false);

  // HOST: push state ke Firestore tiap SYNC_INTERVAL_MS
  useEffect(() => {
    if (!isHost || !roomCode) return;

    syncIntervalRef.current = setInterval(() => {
      if (!player) return;
      const pos = player.currentTime ?? 0;
      // Hanya push kalau ada perubahan bermakna (> 0.5 detik)
      if (Math.abs(pos - lastPushedPos.current) > 0.5 || isPlaying !== undefined) {
        firestore()
          .collection('rooms')
          .doc(roomCode)
          .update({
            position:   pos,
            is_playing: isPlaying,
            updated_at: firestore.FieldValue.serverTimestamp(),
          })
          .catch(e => console.warn('[useSync] push error:', e));
        lastPushedPos.current = pos;
      }
    }, SYNC_INTERVAL_MS);

    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [isHost, roomCode, isPlaying, player]);

  // MEMBER: sync dari roomData (Firestore onSnapshot sudah jalan di useRoom)
  useEffect(() => {
    if (isHost || !player || !roomData) return;

    // Sync play/pause
    const hostPlaying = roomData.is_playing;
    if (hostPlaying && !player.playing) {
      player.play();
    } else if (!hostPlaying && player.playing) {
      player.pause();
    }

    // Sync position — kalau drift > DRIFT_THRESHOLD
    const hostPos  = roomData.position ?? 0;
    const localPos = player.currentTime ?? 0;
    if (Math.abs(hostPos - localPos) > DRIFT_THRESHOLD && !isSeeking.current) {
      isSeeking.current = true;
      player.seekBy(hostPos - localPos);
      setTimeout(() => { isSeeking.current = false; }, 1500);
    }
  }, [roomData, isHost, player]);

  // HOST: push segera ketika play/pause berubah (bukan nunggu interval)
  const pushPlayPause = useCallback(
    (playing: boolean) => {
      if (!isHost || !roomCode || !player) return;
      firestore()
        .collection('rooms')
        .doc(roomCode)
        .update({
          is_playing: playing,
          position:   player.currentTime ?? 0,
          updated_at: firestore.FieldValue.serverTimestamp(),
        })
        .catch(e => console.warn('[useSync] pushPlayPause error:', e));
    },
    [isHost, roomCode, player],
  );

  // HOST: push segera ketika seek
  const pushSeek = useCallback(
    (newPos: number) => {
      if (!isHost || !roomCode) return;
      firestore()
        .collection('rooms')
        .doc(roomCode)
        .update({
          position:   newPos,
          updated_at: firestore.FieldValue.serverTimestamp(),
        })
        .catch(e => console.warn('[useSync] pushSeek error:', e));
    },
    [isHost, roomCode],
  );

  return { pushPlayPause, pushSeek };
}
