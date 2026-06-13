import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { COLORS } from '@/constants';
import type { RoomMember } from '../hooks/useRoom';
import { getCurrentUser } from '@/hooks/auth';

interface Props {
  members: Record<string, RoomMember>;
  hostUid: string;
  visible: boolean;
}

export function MemberList({ members, hostUid, visible }: Props) {
  if (!visible) return null;

  const myUid  = getCurrentUser()?.uid;
  const entries = Object.entries(members).sort(([, a], [, b]) => a.joined_at - b.joined_at);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🍿 {entries.length} nonton bareng</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {entries.map(([uid, member]) => (
          <View key={uid} style={styles.item}>
            {member.avatar ? (
              <Image
                source={{ uri: member.avatar }}
                style={[styles.avatar, uid === hostUid && styles.avatarHost]}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatarPlaceholder, uid === hostUid && styles.avatarHost]}>
                <Text style={styles.avatarInitial}>
                  {member.display_name?.[0]?.toUpperCase() ?? '?'}
                </Text>
              </View>
            )}
            {uid === hostUid && (
              <View style={styles.hostBadge}>
                <Text style={styles.hostBadgeText}>👑</Text>
              </View>
            )}
            <Text style={styles.name} numberOfLines={1}>
              {uid === myUid ? 'Kamu' : member.display_name}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  header: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  list: { gap: 12, paddingBottom: 4 },
  item: { alignItems: 'center', position: 'relative', width: 52 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)',
  },
  avatarHost: { borderColor: COLORS.gold },
  avatarPlaceholder: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)',
  },
  avatarInitial: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  hostBadge: {
    position: 'absolute', top: -4, right: 2,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: COLORS.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  hostBadgeText: { fontSize: 10 },
  name: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    marginTop: 4,
    maxWidth: 52,
    textAlign: 'center',
  },
});
