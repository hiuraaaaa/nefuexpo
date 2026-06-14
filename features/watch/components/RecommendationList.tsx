import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants';
import { Anime } from '@/types';
import { getAnimeSlug } from '@/hooks/api/api';
import { useNavigateAnime } from '@/hooks/useNavigateAnime';

export function RecommendationList({ items }: { items: Anime[] }) {
  const router = useRouter();
  const { goToAnime } = useNavigateAnime();
  if (!items.length) return null;
  return (
    <View style={{ marginHorizontal: 16 }}>
      <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Rekomendasi Lainnya</Text>
      {items.map(a => (
        <TouchableOpacity key={a.id} onPress={() => router.replace(`/watch/${getAnimeSlug(a)}`)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, backgroundColor: COLORS.card, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}
          activeOpacity={0.8}>
          <Image source={{ uri: a.image_poster }} style={{ width: 44, aspectRatio: 3 / 4.2, borderRadius: 6 }} contentFit="cover" />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }} numberOfLines={1}>{a.title}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 3 }}>{a.type} · {a.status}</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.2)" />
        </TouchableOpacity>
      ))}
    </View>
  );
}
