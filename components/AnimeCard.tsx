import React, { useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants';
import { Anime } from '@/types';

interface Props {
  anime: Anime;
  onPress: () => void;
  width?: number;
}

export default function AnimeCard({ anime, onPress, width }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const brightness = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.93,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
      Animated.timing(brightness, {
        toValue: 0.7,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 8,
      }),
      Animated.timing(brightness, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={width ? { width } : { flex: 1 }}
    >
      <Animated.View style={{ transform: [{ scale }], opacity: brightness }}>
        {/* Poster */}
        <View style={styles.posterWrapper}>
          <Image
            source={{ uri: anime.image_poster }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />

          {/* Gradient overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.gradient}
          />

          {/* Type badge — top left */}
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
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  posterWrapper: {
    aspectRatio: 3 / 4.5,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    overflow: 'hidden',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  typeBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  typeBadgeText: {
    fontSize: 7,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.4,
  },
  title: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 6,
    lineHeight: 14,
    letterSpacing: 0.1,
  },
  sub: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 8,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 0.2,
  },
});
