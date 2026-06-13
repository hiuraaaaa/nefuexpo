import { useState, useEffect, useRef, useCallback } from 'react';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface RoomMember {
  uid: string;
  display_name: string;
  avatar: string | null;
  joined_at: number;
  is_host: boolean;
}

export interface ChatMessage {
  id: string;
  uid: string;
  display_name: string;
  avatar: string | null;
  text: string;
  sent_at: number;
}

export interface RoomState {
  code: string;
  anime_id: string;
  anime_title: string;
  anime_poster: string;
  episode_id: string;
  episode_num: number;
  host_uid: string;
  is_playing: boolean;
  position: number;
  updated_at: number;
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function useRoom() {
  const [roomCode, setRoomCode]       = useState<string | null>(null);
  const [room, setRoom]               = useState<RoomState | null>(null);
  const [members, setMembers]         = useState<RoomMember[]>([]);
  const [messages, setMessages]       = useState<ChatMessage[]>([]);
  const [isHost, setIsHost]           = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const unsubRoom     = useRef<(() => void) | null>(null);
  const unsubMembers  = useRef<(() => void) | null>(null);
  const unsubMessages = useRef<(() => void) | null>(null);

  const currentUser = auth().currentUser;

  const cleanup = useCallback(() => {
    unsubRoom.current?.();
    unsubMembers.current?.();
    unsubMessages.current?.();
    unsubRoom.current = null;
    unsubMembers.current = null;
    unsubMessages.current = null;
  }, []);

  const subscribeToRoom = useCallback((code: string) => {
    cleanup();

    // Subscribe room state
    unsubRoom.current = firestore()
      .collection('rooms')
      .doc(code)
      .onSnapshot(snap => {
        if (!snap.exists) { setRoom(null); setRoomCode(null); return; }
        setRoom(snap.data() as RoomState);
      });

    // Subscribe members
    unsubMembers.current = firestore()
      .collection('rooms').doc(code)
      .collection('members')
      .orderBy('joined_at', 'asc')
      .onSnapshot(snap => {
        setMembers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as RoomMember)));
      });

    // Subscribe chat (last 50 messages)
    unsubMessages.current = firestore()
      .collection('rooms').doc(code)
      .collection('messages')
      .orderBy('sent_at', 'asc')
      .limitToLast(50)
      .onSnapshot(snap => {
        setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)));
      });
  }, [cleanup]);

  // Create room
  const createRoom = useCallback(async (params: {
    anime_id: string;
    anime_title: string;
    anime_poster: string;
    episode_id: string;
    episode_num: number;
  }) => {
    if (!currentUser) { setError('Login dulu untuk membuat room'); return null; }
    setLoading(true);
    setError(null);

    try {
      const code = generateCode();
      const now  = Date.now();

      const roomData: RoomState = {
        code,
        ...params,
        host_uid:   currentUser.uid,
        is_playing: false,
        position:   0,
        updated_at: now,
      };

      const batch = firestore().batch();
      const roomRef   = firestore().collection('rooms').doc(code);
      const memberRef = roomRef.collection('members').doc(currentUser.uid);

      batch.set(roomRef, roomData);
      batch.set(memberRef, {
        display_name: currentUser.displayName || 'User',
        avatar:       currentUser.photoURL || null,
        joined_at:    now,
        is_host:      true,
      });

      await batch.commit();

      setRoomCode(code);
      setIsHost(true);
      subscribeToRoom(code);
      return code;
    } catch (e: any) {
      setError(e.message || 'Gagal membuat room');
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser, subscribeToRoom]);

  // Join room
  const joinRoom = useCallback(async (code: string) => {
    if (!currentUser) { setError('Login dulu untuk bergabung'); return false; }
    setLoading(true);
    setError(null);

    try {
      const snap = await firestore().collection('rooms').doc(code.toUpperCase()).get();
      if (!snap.exists) { setError('Room tidak ditemukan'); return false; }

      const now = Date.now();
      await firestore()
        .collection('rooms').doc(code.toUpperCase())
        .collection('members').doc(currentUser.uid)
        .set({
          display_name: currentUser.displayName || 'User',
          avatar:       currentUser.photoURL || null,
          joined_at:    now,
          is_host:      false,
        });

      const isHostUser = (snap.data() as RoomState).host_uid === currentUser.uid;
      setRoomCode(code.toUpperCase());
      setIsHost(isHostUser);
      subscribeToRoom(code.toUpperCase());
      return true;
    } catch (e: any) {
      setError(e.message || 'Gagal bergabung ke room');
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentUser, subscribeToRoom]);

  // Leave room
  const leaveRoom = useCallback(async () => {
    if (!currentUser || !roomCode) return;
    try {
      await firestore()
        .collection('rooms').doc(roomCode)
        .collection('members').doc(currentUser.uid)
        .delete();

      // If host, delete room
      if (isHost) {
        await firestore().collection('rooms').doc(roomCode).delete();
      }
    } catch {}
    cleanup();
    setRoomCode(null);
    setRoom(null);
    setMembers([]);
    setMessages([]);
    setIsHost(false);
  }, [currentUser, roomCode, isHost, cleanup]);

  // Send chat message
  const sendMessage = useCallback(async (text: string) => {
    if (!currentUser || !roomCode || !text.trim()) return;
    try {
      await firestore()
        .collection('rooms').doc(roomCode)
        .collection('messages')
        .add({
          uid:          currentUser.uid,
          display_name: currentUser.displayName || 'User',
          avatar:       currentUser.photoURL || null,
          text:         text.trim(),
          sent_at:      Date.now(),
        });
    } catch {}
  }, [currentUser, roomCode]);

  // Host: update playback state
  const updatePlayback = useCallback(async (update: Partial<Pick<RoomState, 'is_playing' | 'position' | 'episode_id' | 'episode_num'>>) => {
    if (!isHost || !roomCode) return;
    try {
      await firestore().collection('rooms').doc(roomCode).update({
        ...update,
        updated_at: Date.now(),
      });
    } catch {}
  }, [isHost, roomCode]);

  useEffect(() => () => cleanup(), [cleanup]);

  return {
    roomCode, room, members, messages,
    isHost, loading, error,
    createRoom, joinRoom, leaveRoom,
    sendMessage, updatePlayback,
  };
}
