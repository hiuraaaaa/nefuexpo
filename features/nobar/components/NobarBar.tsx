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

  return (
    <>
      {/* Floating bar di bawah video */}
      <BlurView intensity={50} tint="dark" style={{
        marginHorizontal: 16, borderRadius: 14, overflow: 'hidden',
        borderWidth: 1, borderColor: `${COLORS.gold}35`,
        marginBottom: 8,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 10 }}>
          {/* Live dot + room code */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ade80' }} />
            <Text style={{ color: COLORS.gold, fontWeight: '900', fontSize: 13, letterSpacing: 2 }}>{roomCode}</Text>
          </View>

          {/* Member avatars (max 4, stacked) */}
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            {members.slice(0, 4).map((m, i) => (
              <View key={m.uid} style={{
                width: 24, height: 24, borderRadius: 12,
                backgroundColor: `${COLORS.gold}25`,
                borderWidth: 1.5, borderColor: '#111',
                alignItems: 'center', justifyContent: 'center',
                marginLeft: i > 0 ? -7 : 0, zIndex: 10 - i,
              }}>
                <Text style={{ color: COLORS.gold, fontSize: 10, fontWeight: '900' }}>
                  {m.display_name.charAt(0).toUpperCase()}
                </Text>
              </View>
            ))}
            {members.length > 4 && (
              <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginLeft: 6 }}>+{members.length - 4}</Text>
            )}
          </View>

          {/* Chat button */}
          <TouchableOpacity onPress={() => { Haptics.selectionAsync(); setShowChat(true); }} style={{ position: 'relative', padding: 2 }}>
            <Ionicons name="chatbubbles-outline" size={20} color="rgba(255,255,255,0.65)" />
            {messages.length > 0 && (
              <View style={{ position: 'absolute', top: -3, right: -3, backgroundColor: COLORS.gold, borderRadius: 6, minWidth: 14, height: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 }}>
                <Text style={{ color: '#1a1208', fontSize: 7, fontWeight: '900' }}>{messages.length > 99 ? '99+' : messages.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Settings */}
          <TouchableOpacity onPress={() => { Haptics.selectionAsync(); onOpenRoomModal(); }} style={{ padding: 2 }}>
            <Ionicons name="settings-outline" size={20} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
        </View>
      </BlurView>

      {/* Full chat modal */}
      <Modal visible={showChat} animationType="slide" transparent onRequestClose={() => setShowChat(false)}>
        <View style={{ flex: 1 }}>
          {/* Backdrop */}
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }}
            activeOpacity={1}
            onPress={() => setShowChat(false)}
          />

          {/* Bottom sheet — fixed height, flex layout di dalamnya */}
          <View style={{
            height: SCREEN_H * 0.68,
            backgroundColor: '#141210',
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.07)',
          }}>
            {/* Sheet header */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12,
              borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' }} />
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>Room {roomCode}</Text>
                {isHost && (
                  <View style={{ backgroundColor: `${COLORS.gold}18`, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: `${COLORS.gold}45` }}>
                    <Text style={{ color: COLORS.gold, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 }}>HOST</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => setShowChat(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </View>

            {/* Members strip */}
            <View style={{ paddingTop: 10, paddingBottom: 4 }}>
              <MemberList members={members} currentUid={currentUid} />
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 16 }} />

            {/* Chat — flex:1 fills remaining height */}
            <View style={{ flex: 1 }}>
              <ChatPanel messages={messages} currentUid={currentUid} onSend={onSend} />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
