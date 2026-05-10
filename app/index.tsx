import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity,
  Dimensions, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import FastImage from 'react-native-fast-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  cancelAnimation,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { COLORS, LOGO_URL } from '@/constants';
import { api } from '@/hooks/api';
import { Anime } from '@/types';

const { width, height } = Dimensions.get('window');

const NUM_COLS  = 4;
const CARD_GAP  = 6;
const CARD_W    = (width * 1.3) / NUM_COLS - CARD_GAP;
const CARD_H    = CARD_W * 1.45;
const GRID_H    = height * 0.68;

// ─── Poster Column (Reanimated) ────────────────────────────────────────────────

function PosterColumn({ items, offsetY, duration }: {
  items: Anime[];
  offsetY: number;
  duration: number;
}) {
  const STEP     = CARD_H + CARD_GAP;
  const translateY = useSharedValue(offsetY);

  useEffect(() => {
    if (!items.length) return;
    translateY.value = offsetY;
    translateY.value = withRepeat(
      withSequence(
        withTiming(offsetY - STEP, { duration, easing: Easing.linear }),
        withTiming(offsetY, { duration: 0 }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(translateY);
  }, [items.length]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const repeated = [...items, ...items, ...items, ...items];

  return (
    <Animated.View style={[{ width: CARD_W, gap: CARD_GAP }, animStyle]}>
      {repeated.map((a, i) => (
        <View key={`${a.id}-${i}`} style={{
          width: CARD_W, height: CARD_H,
          borderRadius: 8, overflow: 'hidden',
          backgroundColor: COLORS.card,
        }}>
          {a.image_poster ? (
            <FastImage
              source={{ uri: a.image_poster, priority: FastImage.priority.low }}
              style={{ width: '100%', height: '100%' }}
              resizeMode={FastImage.resizeMode.cover}
            />
          ) : null}
        </View>
      ))}
    </Animated.View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function WelcomeScreen() {
  const router  = useRouter();
  const [posters, setPosters] = useState<Anime[]>([]);

  // Animasi masuk konten bawah
  const opacity   = useSharedValue(0);
  const translateY = useSharedValue(20);

  // Animasi transisi ke main — overlay gelap
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    api.ongoing().then(r => {
      setPosters(r.data?.slice(0, 32) || []);
      opacity.value    = withTiming(1, { duration: 600 });
      translateY.value = withSpring(0, { damping: 18, stiffness: 120 });
    }).catch(() => {
      opacity.value = withTiming(1, { duration: 400 });
    });
  }, []);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const navigateTo = (target: 'main' | 'explore') => {
    // Fade ke hitam dulu baru navigate
    overlayOpacity.value = withTiming(1, { duration: 300 }, (done) => {
      if (done) runOnJS(target === 'main'
        ? () => router.replace('/(tabs)/')
        : () => router.push('/(tabs)/explore')
      )();
    });
  };

  const cols = [0, 1, 2, 3].map(i =>
    posters.filter((_, idx) => idx % 4 === i)
  );

  const colOffsets   = [0, -(CARD_H + CARD_GAP) * 0.6, -(CARD_H + CARD_GAP) * 0.2, -(CARD_H + CARD_GAP) * 0.8];
  const colDurations = [3800, 4400, 3400, 4800];

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
              offsetY={colOffsets[i]}
              duration={colDurations[i]}
            />
          ))}
        </View>
      </View>

      {/* Gradient fade bawah */}
      <LinearGradient
        colors={['transparent', 'rgba(8,8,10,0.5)', 'rgba(8,8,10,0.92)', '#08080a']}
        locations={[0, 0.35, 0.6, 0.8]}
        style={{
          position: 'absolute', left: 0, right: 0,
          top: GRID_H * 0.15, height: GRID_H * 0.9,
        }}
      />

      {/* Logo */}
      <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
          <FastImage
            source={{ uri: LOGO_URL, priority: FastImage.priority.high }}
            style={{ width: 36, height: 36 }}
            resizeMode={FastImage.resizeMode.contain}
          />
        </View>
      </SafeAreaView>

      {/* Bottom content */}
      <Animated.View style={[{
        position: 'absolute', bottom: 0, left: 0, right: 0,
      }, contentStyle]}>
        <SafeAreaView edges={['bottom']}>
          <View style={{ paddingHorizontal: 24, paddingBottom: 32 }}>

            {/* Icon */}
            <View style={{
              width: 48, height: 48, borderRadius: 10,
              backgroundColor: COLORS.gold,
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 18,
              shadowColor: COLORS.gold, shadowOpacity: 0.4,
              shadowRadius: 14, elevation: 8,
            }}>
              <Ionicons name="play-forward" size={22} color="#000" />
            </View>

            {/* Headline */}
            <Text style={{
              color: '#fff', fontSize: 30, fontWeight: '900',
              letterSpacing: -0.5, lineHeight: 36, marginBottom: 10,
            }}>
              Tonton Anime{'\n'}
              <Text style={{ color: COLORS.gold }}>Favorit Kamu</Text>
            </Text>

            {/* Subtitle */}
            <Text style={{
              color: 'rgba(255,255,255,0.4)', fontSize: 13,
              lineHeight: 20, marginBottom: 28,
            }}>
              Ribuan judul anime subtitle Indonesia.{'\n'}Gratis, tanpa iklan, kualitas hingga 1080p.
            </Text>

            {/* CTA Utama */}
            <TouchableOpacity
              onPress={() => navigateTo('main')}
              style={{
                backgroundColor: COLORS.gold,
                paddingVertical: 14, borderRadius: 10,
                alignItems: 'center', marginBottom: 8,
                shadowColor: COLORS.gold, shadowOpacity: 0.3,
                shadowRadius: 12, elevation: 6,
              }}
            >
              <Text style={{ color: '#000', fontWeight: '900', fontSize: 15, letterSpacing: 0.3 }}>
                Mulai Nonton
              </Text>
            </TouchableOpacity>

            {/* CTA Sekunder */}
            <TouchableOpacity
              onPress={() => navigateTo('explore')}
              style={{
                paddingVertical: 14, borderRadius: 10,
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
              }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '700', fontSize: 15 }}>
                Jelajahi Anime
              </Text>
            </TouchableOpacity>

          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Overlay transisi — fade to black sebelum navigate */}
      <Animated.View style={[{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: '#08080a', pointerEvents: 'none',
      }, overlayStyle]} />
    </View>
  );
}
