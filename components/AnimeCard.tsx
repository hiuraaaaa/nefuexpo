import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { COLORS } from '@/constants';
import { Anime } from '@/types';

interface Props {
  anime: Anime;
  onPress: () => void;
  width?: number;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// Guard global — cegah 2 card di-tap hampir bersamaan
let _lastNavTime = 0;
const NAV_DEBOUNCE_MS = 600;

export default function AnimeCard({ anime, onPress, width }: Props) {
  const scale   = useSharedValue(1);
  const opacity = useSharedValue(1);
  // Guard lokal per-card — cegah double-tap card yang sama
  const firedRef = useRef(false);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value   = withSpring(0.93, { damping: 15, stiffness: 300 });
    opacity.value = withTiming(0.7, { duration: 80 });
  };

  const handlePressOut = () => {
    scale.value   = withSpring(1, { damping: 12, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 150 });
  };

  const handlePress = () => {
    const now = Date.now();
    if (firedRef.current || now - _lastNavTime < NAV_DEBOUNCE_MS) return;
    firedRef.current = true;
    _lastNavTime = now;
    onPress();
    // Reset setelah 1 detik biar bisa navigate lagi kalau user balik
    setTimeout(() => { firedRef.current = false; }, 1000);
  };

  return (
    <AnimatedTouchable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={[animStyle, width ? { width } : { flex: 1 }]}
    >
      {/* Poster */}
      <View style={styles.posterWrapper}>
        <Image
          source={{ uri: anime.image_poster }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
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
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  posterWrapper: {
    aspectRatio: 3 / 4.5,
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 8,
    overflow: 'hidden',
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
