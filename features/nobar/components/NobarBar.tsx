import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '@/constants';
import { ChatPanel } from './ChatPanel';
import { MemberList } from './MemberList';
import type { RoomMember, ChatMessage } from '../hooks/useRoom';

const { height: SCREEN_H } = Dimensions.get('window');

interface Props {
  roomCode: string;
  isHost: boolean;
  members: RoomMember[];
  messages: ChatMessage[];
  currentUid: string;
  onOpenRoomModal: () => void;
  onSend: (text: string) => void;
}

export function NobarBar({ roomCode, isHost, members, messages, currentUid, onOpenRoomModal, onSend }: Props) {
  const [showChat, setShowChat] = useState(false);
  const unread = messages.length;

  return (
    <>
      {/* Floating bar di bawah video */}
      <BlurView intensity={60} tint="dark" style={{
        marginHorizontal: 16, borderRadius: 14, overflow: 'hidden',
        borderWidth: 1, borderColor: `${COLORS.gold}40`,
        marginBottom: 8,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 10 }}>
          {/* Room code */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' }} />
            <Text style={{ color: COLORS.gold, fontWeight: '900', fontSize: 13, letterSpacing: 2 }}>{roomCode}</Text>
          </View>

          {/* Members avatars (max 3) */}
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: -8 }}>
            {members.slice(0, 4).map((m, i) => (
              <View key={m.uid} style={{
                width: 24, height: 24, borderRadius: 12,
                backgroundColor: COLORS.gold + '30',
                borderWidth: 1.5, borderColor: '#111',
                alignItems: 'center', justifyContent: 'center',
                marginLeft: i > 0 ? -8 : 0, zIndex: 10 - i,
              }}>
                <Text style={{ color: COLORS.gold, fontSize: 10, fontWeight: '900' }}>
                  {m.display_name.charAt(0).toUpperCase()}
                </Text>
              </View>
            ))}
            {members.length > 4 && (
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginLeft: 4 }}>+{members.length - 4}</Text>
            )}
          </View>

          {/* Chat button */}
          <TouchableOpacity onPress={() => { Haptics.selectionAsync(); setShowChat(true); }} style={{ position: 'relative' }}>
            <Ionicons name="chatbubbles-outline" size={20} color="rgba(255,255,255,0.7)" />
            {messages.length > 0 && (
              <View style={{ position: 'absolute', top: -4, right: -4, backgroundColor: COLORS.gold, borderRadius: 6, minWidth: 12, height: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 }}>
                <Text style={{ color: '#000', fontSize: 7, fontWeight: '900' }}>{messages.length > 99 ? '99+' : messages.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Settings / leave */}
          <TouchableOpacity onPress={() => { Haptics.selectionAsync(); onOpenRoomModal(); }}>
            <Ionicons name="settings-outline" size={20} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </View>
      </BlurView>

      {/* Full chat modal */}
      <Modal visible={showChat} animationType="slide" transparent onRequestClose={() => setShowChat(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowChat(false)} />
          <View style={{ height: SCREEN_H * 0.65, backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
            {/* Chat header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' }} />
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>Room {roomCode}</Text>
                {isHost && (
                  <View style={{ backgroundColor: `${COLORS.gold}20`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: `${COLORS.gold}50` }}>
                    <Text style={{ color: COLORS.gold, fontSize: 10, fontWeight: '900' }}>HOST</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => setShowChat(false)}>
                <Ionicons name="close" size={22} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </View>

            {/* Members */}
            <View style={{ paddingTop: 12 }}>
              <MemberList members={members} currentUid={currentUid} />
            </View>

            {/* Chat */}
            <ChatPanel messages={messages} currentUid={currentUid} onSend={onSend} />
          </View>
        </View>
      </Modal>
    </>
  );
}

