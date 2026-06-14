import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { COLORS } from '@/constants';
import { Anime } from '@/types';

interface Props {
  anime: Anime;
  width?: number;
}

// AnimeCard adalah pure render component — tanpa animasi, tanpa shared values.
// Press handler & animasi diurus parent (AnimeItem / FlashList cell) supaya
// tidak ada puluhan useSharedValue jalan paralel saat scroll grid.
export default function AnimeCard({ anime, width }: Props) {
  return (
    <View style={[styles.root, width ? { width } : { flex: 1 }]}>
      {/* Poster */}
      <View style={styles.posterWrapper}>
        <Image
          source={{ uri: anime.image_poster }}
          style={styles.image}
          contentFit="cover"
          recyclingKey={anime.id}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={styles.gradient}
        />
        {anime.type ? (
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{anime.type}</Text>
          </View>
        ) : null}
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>
        {anime.title}
      </Text>

      {/* Year / studio */}
      {(anime.year || anime.studio) ? (
        <Text style={styles.sub} numberOfLines={1}>
          {[anime.year, anime.studio].filter(Boolean).join(' · ')}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  posterWrapper: {
    aspectRatio: 3 / 4.5,
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '40%',
  },
  typeBadge: {
    position: 'absolute',
    top: 6, left: 6,
    paddingHorizontal: 5, paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  typeBadgeText: {
    fontSize: 7, fontWeight: '700',
    color: 'rgba(255,255,255,0.7)', letterSpacing: 0.4,
  },
  title: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 10, fontWeight: '600',
    marginTop: 6, lineHeight: 14, letterSpacing: 0.1,
  },
  sub: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 8, fontWeight: '500',
    marginTop: 2, letterSpacing: 0.2,
  },
});
