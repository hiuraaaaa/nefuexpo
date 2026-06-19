// features/home/components/HomeScrollCard.tsx
//
// Card untuk horizontal scroller (Terbaru / Hari Ini).
// Nomor urut italic mengambang di atas poster, left border accent
// sebagai pembatas — bukan rounded card dengan shadow.
import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { Anime } from '@/types';

interface Props {
  anime: Anime;
  index: number;
  width?: number;
  metaOverride?: string; // contoh: jam tayang "19:00 WIB" untuk section Hari Ini
  theme: any;
}

export default function HomeScrollCard({ anime, index, width = 108, metaOverride, theme }: Props) {
  const meta = metaOverride ?? [anime.lastch, anime.type].filter(Boolean).join(' · ');

  return (
    <View style={{ width, position: 'relative' }}>
      {/* Nomor urut — mengambang di atas poster, sedikit overflow ke luar */}
      <Text style={{
        position: 'absolute', top: -22, left: -2,
        color: `${theme.accent}55`,
        fontSize: 15, fontWeight: '900', fontStyle: 'italic',
        zIndex: 2,
      }}>
        {String(index + 1).padStart(2, '0')}
      </Text>

      <Image
        source={{ uri: anime.image_poster, priority: 'normal' }}
        style={{
          width: '100%', aspectRatio: 2 / 3,
          borderLeftWidth: 2, borderLeftColor: `${theme.accent}80`,
        }}
        contentFit="cover"
        recyclingKey={anime.id}
      />

      <Text
        style={{ color: theme.text, fontSize: 11.5, fontWeight: '800', marginTop: 8, lineHeight: 14 }}
        numberOfLines={2}
      >
        {anime.title}
      </Text>

      {meta ? (
        <Text style={{ color: theme.subtext, fontSize: 9.5, fontWeight: '600', marginTop: 3 }} numberOfLines={1}>
          {meta}
        </Text>
      ) : null}
    </View>
  );
}

