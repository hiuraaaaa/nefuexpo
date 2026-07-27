// features/home/components/MovieRankItem.tsx
//
// List row editorial — separator garis tipis antar item, poster kecil
// flush kiri, badge rating di kanan (data rekomendasi selalu punya score).
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Anime } from '@/types';

interface Props {
  anime: Anime;
  index: number;
  onPress: () => void;
  theme: any;
}

export function MovieRankItem({ anime, index, onPress, theme }: Props) {
  const scoreNum = anime.score != null ? parseFloat(String(anime.score)) : null;

  return (
    <TouchableOpacity
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 16, paddingHorizontal: 22,
        borderTopWidth: index === 0 ? 0 : 1,
        borderTopColor: `${theme.subtext}15`,
        gap: 16,
      }}
    >
      {/* Poster kecil */}
      <Image
        source={{ uri: anime.image_poster, priority: 'normal' }}
        style={{ width: 48, aspectRatio: 2 / 3 }}
        contentFit="cover"
        recyclingKey={anime.id}
      />

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.text, fontSize: 13.5, fontWeight: '800', lineHeight: 17 }} numberOfLines={2}>
          {anime.title}
        </Text>
        {(anime.total_episode || anime.status) && (
          <Text style={{ color: theme.subtext, fontSize: 10.5, fontWeight: '600', marginTop: 4 }} numberOfLines={1}>
            {[anime.total_episode ? `${anime.total_episode} Eps` : null, anime.status].filter(Boolean).join(' · ')}
          </Text>
        )}
      </View>

      {/* Rating — cuma tampil kalau datanya beneran ada */}
      {scoreNum != null && (
        <View style={{ alignItems: 'center', minWidth: 34 }}>
          <Text style={{ color: theme.accent, fontSize: 13, fontWeight: '900' }}>★</Text>
          <Text style={{ color: theme.accent, fontSize: 11, fontWeight: '900' }}>{anime.score}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
