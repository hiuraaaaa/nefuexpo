import { useState, useEffect, useCallback, useRef } from 'react';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { getCurrentUser } from '@/hooks/auth';

export interface RoomMember {
  display_name: string;
  avatar: string | null;
  joined_at: number;
}

export interface RoomData {
  anime_id: string;
  episode_id: string;
  host_uid: string;
  is_playing: boolean;
  position: number;
  updated_at: FirebaseFirestoreTypes.Timestamp | null;
  members: Record<string, RoomMember>;
}

const generateCode = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

export function useRoom() {
  const [roomCode, setRoomCode]   = useState<string | null>(null);
  const [roomData, setRoomData]   = useState<RoomData | null>(null);
  const [isHost, setIsHost]       = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const unsubRef = useRef<(() => void) | null>(null);

  // Subscribe ke room realtime
  const subscribeRoom = useCallback((code: string) => {
    unsubRef.current?.();
    unsubRef.current = firestore()
      .collection('rooms')
      .doc(code)
      .onSnapshot(
        snap => {
          if (snap.exists) {
            setRoomData(snap.data() as RoomData);
          } else {
            // Room dihapus (host keluar)
            setRoomCode(null);
            setRoomData(null);
            setIsHost(false);
          }
        },
        err => console.warn('[useRoom] snapshot error:', err),
      );
  }, []);

  const createRoom = useCallback(
    async (anime_id: string, episode_id: string): Promise<string | null> => {
      const user = getCurrentUser();
      if (!user) { setError('Login dulu untuk buat room'); return null; }

      setIsLoading(true);
      setError(null);
      try {
        const code: string = generateCode();
        const member: RoomMember = {
          display_name: user.displayName ?? 'User',
          avatar:       user.photoURL ?? null,
          joined_at:    Date.now(),
        };
        const data: RoomData = {
          anime_id,
          episode_id,
          host_uid:   user.uid,
          is_playing: false,
          position:   0,
          updated_at: null,
          members:    { [user.uid]: member },
        };
        await firestore().collection('rooms').doc(code).set(data);
        setRoomCode(code);
        setIsHost(true);
        subscribeRoom(code);
        return code;
      } catch (e: any) {
        setError('Gagal buat room');
        console.warn('[useRoom] createRoom error:', e);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [subscribeRoom],
  );

  const joinRoom = useCallback(
    async (code: string): Promise<boolean> => {
      const user = getCurrentUser();
      if (!user) { setError('Login dulu untuk join room'); return false; }

      setIsLoading(true);
      setError(null);
      try {
        const snap = await firestore().collection('rooms').doc(code).get();
        if (!snap.exists) { setError('Room tidak ditemukan'); return false; }

        const member: RoomMember = {
          display_name: user.displayName ?? 'User',
          avatar:       user.photoURL ?? null,
          joined_at:    Date.now(),
        };
        await firestore()
          .collection('rooms')
          .doc(code)
          .update({ [`members.${user.uid}`]: member });

        setRoomCode(code);
        setIsHost(false);
        subscribeRoom(code);
        return true;
      } catch (e: any) {
        setError('Gagal join room');
        console.warn('[useRoom] joinRoom error:', e);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [subscribeRoom],
  );

  const leaveRoom = useCallback(async () => {
    const user = getCurrentUser();
    if (!roomCode || !user) return;

    try {
      if (isHost) {
        // Host keluar → hapus room
        await firestore().collection('rooms').doc(roomCode).delete();
      } else {
        // Member keluar → remove dari members map
        await firestore()
          .collection('rooms')
          .doc(roomCode)
          .update({
            [`members.${user.uid}`]: firestore.FieldValue.delete(),
          });
      }
    } catch (e) {
      console.warn('[useRoom] leaveRoom error:', e);
    } finally {
      unsubRef.current?.();
      unsubRef.current = null;
      setRoomCode(null);
      setRoomData(null);
      setIsHost(false);
    }
  }, [roomCode, isHost]);

  useEffect(() => {
    return () => { unsubRef.current?.(); };
  }, []);

  return {
    roomCode,
    roomData,
    isHost,
    isLoading,
    error,
    createRoom,
    joinRoom,
    leaveRoom,
    setError,
  };
}
