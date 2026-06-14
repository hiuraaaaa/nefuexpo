import React, { createContext, useContext } from 'react';
import { useRoom } from '@/features/nobar';

const RoomContext = createContext<ReturnType<typeof useRoom> | null>(null);

export function RoomProvider({ children }: { children: React.ReactNode }) {
  const room = useRoom();
  return <RoomContext.Provider value={room}>{children}</RoomContext.Provider>;
}

export function useRoomContext() {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error('useRoomContext must be used inside RoomProvider');
  return ctx;
}
