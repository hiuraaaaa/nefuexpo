import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, withRepeat, withSequence,
  cancelAnimation, runOnJS, Easing,
} from 'react-native-reanimated';
import { COLORS, LOGO_URL } from '@/constants';
import { api } from '@/hooks/api';
import { Anime } from '@/types';

const { width, height } = Dimensions.get('window');

const NUM_COLS     = 4;
const CARD_GAP     = 6;
const CARD_W       = (width * 1.3) / NUM_COLS - CARD_GAP;
const CARD_H       = CARD_W * 1.45;
const STEP         = CARD_H + CARD_GAP;
const GRID_H       = height * 0.68;
const REPEAT_COUNT = 4;

const COL_OFFSETS   = [0, -(STEP * 0.6), -(STEP * 0.2), -(STEP * 0.8)] as const;
const COL_DURATIONS = [3800, 4400, 3400, 4800] as const;

const CARD_STYLE = {
  width: CARD_W, height: CARD_H,
  borderRadius: 8, overflow: 'hidden' as const,
  backgroundColor: COLORS.card,
};

const PosterCard = React.memo(({ item }: { item: Anime }) => (
  <View style={CARD_STYLE}>
    {item.image_poster ? (
      <Image
        source={{ uri: item.image_poster, priority: "low" }}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
      />
    ) : null}
  </View>
));

const PosterColumn = React.memo(({ items, offsetY, duration }: {
  items: Anime[]; offsetY: number; duration: number;
}) => {
  const translateY = useSharedValue(offsetY);
  const repeated = useMemo(
    () => Array.from({ length: REPEAT_COUNT }, () => items).flat(),
    [items]
  );

  useEffect(() => {
    if (!items.length) return;
    translateY.value = offsetY;
    translateY.value = withRepeat(
      withSequence(
        withTiming(offsetY - STEP, { duration, easing: Easing.linear }),
        withTiming(offsetY, { duration: 0 }),
      ),
      -1, false,
    );
    return () => cancelAnimation(translateY);
  }, [items.length]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[{ width: CARD_W, gap: CARD_GAP }, animStyle]}>
      {repeated.map((a, i) => <PosterCard key={`${a.id}-${i}`} item={a} />)}
    </Animated.View>
  );
});

export default function WelcomeScreen() {
  const router = useRouter();
  const [posters, setPosters] = useState<Anime[]>([]);

  const opacity        = useSharedValue(0);
  const translateY     = useSharedValue(24);
  const overlayOpacity = useSharedValue(0);

  const cols = useMemo(
    () => [0, 1, 2, 3].map(i => posters.filter((_, idx) => idx % 4 === i)),
    [posters]
  );

  useEffect(() => {
    api.ongoing().then(r => {
      setPosters(r.data?.slice(0, 32) || []);
      opacity.value    = withTiming(1, { duration: 700 });
      translateY.value = withSpring(0, { damping: 16, stiffness: 100 });
    }).catch(() => {
      opacity.value = withTiming(1, { duration: 400 });
    });
  }, []);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));

  const goMain    = useCallback(() => router.replace('/(tabs)'), [router]);
  const goExplore = useCallback(() => router.push('/(tabs)/explore'), [router]);

  const navigateTo = useCallback((target: 'main' | 'explore') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    overlayOpacity.value = withTiming(1, { duration: 300 }, (done) => {
      if (done) runOnJS(target === 'main' ? goMain : goExplore)();
    });
  }, [goMain, goExplore]);

  return (
    <View style={{ flex: 1, backgroundColor: '#08080a' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Poster grid */}
      <View style={{
        position: 'absolute',
        top: -height * 0.05,
        left: -(width * 0.15),
        width: width * 1.3,
        height: GRID_H,
        overflow: 'hidden',
        transform: [{ rotate: '-10deg' }],
      }}>
        <View style={{ flexDirection: 'row', gap: CARD_GAP, paddingHorizontal: CARD_GAP }}>
          {cols.map((col, i) => (
            <PosterColumn
              key={i}
              items={col.length >= 4 ? col : posters.slice(i * 4, i * 4 + 8)}
              offsetY={COL_OFFSETS[i]}
              duration={COL_DURATIONS[i]}
            />
          ))}
        </View>
      </View>

      {/* Gradient fade */}
      <LinearGradient
        colors={['transparent', 'rgba(8,8,10,0.5)', 'rgba(8,8,10,0.92)', '#08080a']}
        locations={[0, 0.35, 0.6, 0.8]}
        style={{
          position: 'absolute', left: 0, right: 0,
          top: GRID_H * 0.15, height: GRID_H * 0.9,
        }}
      />

      {/* Logo top left */}
      <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
          <Image
            source={{ uri: LOGO_URL, priority: "high" }}
            style={{ width: 36, height: 36 }}
            contentFit="contain"
          />
        </View>
      </SafeAreaView>

      {/* Bottom content */}
      <Animated.View style={[{ position: 'absolute', bottom: 0, left: 0, right: 0 }, contentStyle]}>
        <SafeAreaView edges={['bottom']}>
          <View style={{ paddingHorizontal: 28, paddingBottom: 36 }}>

            {/* App icon — logo di kiri bawah */}
            <View style={{ marginBottom: 20 }}>
              <Image
                source={{ uri: LOGO_URL, priority: "high" }}
                style={{
                  width: 56, height: 56, borderRadius: 14,
                  shadowColor: COLORS.gold, shadowOpacity: 0.3,
                  shadowRadius: 14,
                }}
                contentFit="contain"
              />
            </View>

            {/* Headline */}
            <Text style={{
              color: '#fff',
              fontSize: 36,
              fontWeight: '900',
              letterSpacing: -1,
              lineHeight: 42,
              marginBottom: 6,
            }}>
              Tonton Anime
            </Text>
            <Text style={{
              color: COLORS.gold,
              fontSize: 36,
              fontWeight: '900',
              letterSpacing: -1,
              lineHeight: 42,
              marginBottom: 14,
            }}>
              Favorit Kamu
            </Text>

            {/* Subtitle */}
            <Text style={{
              color: 'rgba(255,255,255,0.38)',
              fontSize: 13,
              lineHeight: 21,
              marginBottom: 32,
              fontWeight: '500',
            }}>
              Ribuan judul anime subtitle Indonesia.{'\n'}Gratis, tanpa iklan, kualitas hingga 1080p.
            </Text>

            {/* CTA Utama */}
            <TouchableOpacity
              onPress={() => navigateTo('main')}
              activeOpacity={0.85}
              style={{
                backgroundColor: COLORS.gold,
                paddingVertical: 16, borderRadius: 14,
                alignItems: 'center', marginBottom: 10,
                shadowColor: COLORS.gold, shadowOpacity: 0.35,
                shadowRadius: 16, elevation: 8,
              }}
            >
              <Text style={{ color: '#000', fontWeight: '900', fontSize: 15, letterSpacing: 0.2 }}>
                Mulai Nonton
              </Text>
            </TouchableOpacity>

            {/* CTA Sekunder */}
            <TouchableOpacity
              onPress={() => navigateTo('explore')}
              activeOpacity={0.85}
              style={{
                paddingVertical: 16, borderRadius: 14,
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
              }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.45)', fontWeight: '700', fontSize: 15 }}>
                Jelajahi Anime
              </Text>
            </TouchableOpacity>

          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Overlay transisi */}
      <Animated.View style={[{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: '#08080a', pointerEvents: 'none',
      }, overlayStyle]} />
    </View>
  );
}
