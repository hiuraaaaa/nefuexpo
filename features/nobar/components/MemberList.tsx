import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import type { RoomMember } from '../hooks/useRoom';

interface Props {
  members: RoomMember[];
  currentUid: string;
}

export function MemberList({ members, currentUid }: Props) {
  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
        {members.length} Penonton
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
        {members.map(m => (
          <View key={m.uid} style={{ alignItems: 'center', gap: 4 }}>
            <View style={{ position: 'relative' }}>
              {m.avatar ? (
                <Image
                  source={{ uri: m.avatar }}
                  style={{ width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: m.uid === currentUid ? COLORS.gold : m.is_host ? '#4ade80' : 'transparent' }}
                  contentFit="cover"
                />
              ) : (
                <View style={{
                  width: 38, height: 38, borderRadius: 19,
                  backgroundColor: m.is_host ? '#4ade8030' : 'rgba(255,255,255,0.1)',
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 2, borderColor: m.uid === currentUid ? COLORS.gold : m.is_host ? '#4ade80' : 'transparent',
                }}>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>
                    {m.display_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              {m.is_host && (
                <View style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: '#4ade80', borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="star" size={9} color="#000" />
                </View>
              )}
            </View>
            <Text style={{ color: m.uid === currentUid ? COLORS.gold : 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', maxWidth: 50 }} numberOfLines={1}>
              {m.uid === currentUid ? 'Kamu' : m.display_name}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
