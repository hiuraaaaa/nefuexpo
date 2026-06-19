// features/home/components/MovieRankItem.tsx
//
// List row editorial — nomor besar italic, separator garis tipis antar
// item, poster kecil flush kiri. Tidak ada rounded card / background
// image blur / drop shadow.
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
  const isTop = index < 3;
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
      {/* Nomor besar — redup kalau bukan top 3 */}
      <Text style={{
        fontSize: 26, fontWeight: '900', fontStyle: 'italic',
        color: isTop ? theme.accent : `${theme.subtext}30`,
        minWidth: 38,
      }}>
        {String(index + 1).padStart(2, '0')}
      </Text>

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
        <Text style={{ color: theme.subtext, fontSize: 10.5, fontWeight: '600', marginTop: 4 }} numberOfLines={1}>
          {[anime.studio, anime.year].filter(Boolean).join(' · ')}
        </Text>
      </View>

      {/* Score */}
      {scoreNum != null && (
        <Text style={{ color: theme.accent, fontSize: 11, fontWeight: '900', fontStyle: 'italic' }}>
          {anime.score}
        </Text>
      )}
    </TouchableOpacity>
  );
}
