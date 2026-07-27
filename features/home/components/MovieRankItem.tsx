// features/home/components/MovieRankItem.tsx
//
// List row editorial — bullet crescent moon (signature Lunar) di kiri,
// bukan nomor ranking. Poster kecil, badge rating pakai JetBrains Mono.
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
        paddingVertical: 14, paddingHorizontal: 22,
        borderTopWidth: index === 0 ? 0 : 1,
        borderTopColor: theme.border,
        gap: 14,
      }}
    >
      {/* Crescent bullet — signature Lunar, bukan nomor ranking */}
      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: theme.accent }}>
        <View style={{
          position: 'absolute', top: -2, left: 5, width: 22, height: 22, borderRadius: 11,
          backgroundColor: theme.bg,
        }} />
      </View>

      {/* Poster kecil */}
      <Image
        source={{ uri: anime.image_poster, priority: 'normal' }}
        style={{ width: 44, aspectRatio: 2 / 3, borderRadius: 8 }}
        contentFit="cover"
        recyclingKey={anime.id}
      />

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.text, fontSize: 13.5, fontFamily: 'PlusJakartaSans_700Bold', lineHeight: 17 }} numberOfLines={2}>
          {anime.title}
        </Text>
        {(anime.total_episode || anime.status) && (
          <Text style={{ color: theme.subtext, fontSize: 10.5, fontFamily: 'PlusJakartaSans_600SemiBold', marginTop: 4 }} numberOfLines={1}>
            {[anime.total_episode ? `${anime.total_episode} Eps` : null, anime.status].filter(Boolean).join(' · ')}
          </Text>
        )}
      </View>

      {/* Rating — cuma tampil kalau datanya beneran ada */}
      {scoreNum != null && (
        <View style={{ alignItems: 'center', minWidth: 34 }}>
          <Text style={{ color: theme.accent, fontSize: 13 }}>★</Text>
          <Text style={{ color: theme.accent, fontSize: 11, fontFamily: 'JetBrainsMono_600SemiBold', marginTop: 1 }}>{anime.score}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
