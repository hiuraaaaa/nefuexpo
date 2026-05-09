import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Image,
  Dimensions, Animated, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, LOGO_URL } from '@/constants';
import { api } from '@/hooks/api';
import { Anime } from '@/types';

const { width, height } = Dimensions.get('window');

// Card size dinamis berdasar lebar layar
const NUM_COLS = 4;
const CARD_GAP = 8;
const CARD_W = (width * 1.3) / NUM_COLS - CARD_GAP; // 1.3x lebar layar biar pas setelah rotate
const CARD_H = CARD_W * 1.45;
const GRID_H = height * 0.68;

// ─── Kolom poster ─────────────────────────────────────────────────────────────

function PosterColumn({ items, offsetY, duration }: {
  items: Anime[];
  offsetY: number;
  duration: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const STEP = CARD_H + CARD_GAP;

  useEffect(() => {
    if (!items.length) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: -STEP,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [items.length]);

  const repeated = [...items, ...items, ...items, ...items];

  return (
    <Animated.View style={{
      width: CARD_W,
      gap: CARD_GAP,
      transform: [{ translateY: Animated.add(anim, new Animated.Value(offsetY)) }],
    }}>
      {repeated.map((a, i) => (
        <View key={`${a.id}-${i}`} style={{
          width: CARD_W,
          height: CARD_H,
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: COLORS.card,
        }}>
          {a.image_poster ? (
            <Image
              source={{ uri: a.image_poster }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : null}
        </View>
      ))}
    </Animated.View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function WelcomeScreen() {
  const router = useRouter();
  const [posters, setPosters] = useState<Anime[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    api.ongoing().then(r => {
      setPosters(r.data?.slice(0, 32) || []);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 55, friction: 10 }),
      ]).start();
    }).catch(() => {
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    });
  }, []);

  // Bagi poster ke 4 kolom
  const cols = [0, 1, 2, 3].map(i =>
    posters.filter((_, idx) => idx % 4 === i)
  );

  // Offset tiap kolom biar stagger (selang-seling naik-turun)
  const colOffsets = [0, -(CARD_H + CARD_GAP) * 0.6, -(CARD_H + CARD_GAP) * 0.2, -(CARD_H + CARD_GAP) * 0.8];
  const colDurations = [3800, 4400, 3400, 4800];

  return (
    <View style={{ flex: 1, backgroundColor: '#08080a' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── Poster grid ── */}
      <View style={{
        position: 'absolute',
        top: -height * 0.05,
        left: -(width * 0.15),       // geser kiri supaya setelah rotate tetap cover penuh
        width: width * 1.3,          // lebih lebar dari layar
        height: GRID_H,
        overflow: 'hidden',
        transform: [{ rotate: '-10deg' }],
      }}>
        <View style={{
          flexDirection: 'row',
          gap: CARD_GAP,
          paddingHorizontal: CARD_GAP,
        }}>
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

      {/* ── Gradient fade bawah ── */}
      <LinearGradient
        colors={['transparent', 'rgba(8,8,10,0.5)', 'rgba(8,8,10,0.92)', '#08080a']}
        locations={[0, 0.35, 0.6, 0.8]}
        style={{
          position: 'absolute',
          left: 0, right: 0,
          top: GRID_H * 0.15,
          height: GRID_H * 0.9,
        }}
      />

      {/* ── Logo ── */}
      <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
          <Image source={{ uri: LOGO_URL }} style={{ width: 38, height: 38 }} resizeMode="contain" />
        </View>
      </SafeAreaView>

      {/* ── Bottom content ── */}
      <Animated.View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}>
        <SafeAreaView edges={['bottom']}>
          <View style={{ paddingHorizontal: 24, paddingBottom: 32 }}>

            {/* Icon */}
            <View style={{
              width: 56, height: 56, borderRadius: 16,
              backgroundColor: COLORS.gold,
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
              shadowColor: COLORS.gold, shadowOpacity: 0.45,
              shadowRadius: 18, elevation: 10,
            }}>
              <Ionicons name="play-forward" size={26} color="#000" />
            </View>

            {/* Headline */}
            <Text style={{
              color: '#fff', fontSize: 32, fontWeight: '900',
              letterSpacing: -0.5, lineHeight: 38, marginBottom: 10,
            }}>
              Tonton Anime{'\n'}
              <Text style={{ color: COLORS.gold }}>Favorit Kamu</Text>
            </Text>

            {/* Subtitle */}
            <Text style={{
              color: 'rgba(255,255,255,0.4)', fontSize: 13,
              lineHeight: 20, marginBottom: 32,
            }}>
              Ribuan judul anime subtitle Indonesia.{'\n'}Gratis, tanpa iklan, kualitas hingga 1080p.
            </Text>

            {/* CTA Utama */}
            <TouchableOpacity
              onPress={() => router.replace('/(tabs)/')}
              style={{
                backgroundColor: COLORS.gold,
                paddingVertical: 15, borderRadius: 14,
                alignItems: 'center', marginBottom: 10,
                shadowColor: COLORS.gold, shadowOpacity: 0.35,
                shadowRadius: 14, elevation: 8,
              }}
            >
              <Text style={{ color: '#000', fontWeight: '900', fontSize: 15, letterSpacing: 0.3 }}>
                Mulai Nonton
              </Text>
            </TouchableOpacity>

            {/* CTA Sekunder */}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/explore')}
              style={{
                paddingVertical: 15, borderRadius: 14,
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
              }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.55)', fontWeight: '700', fontSize: 15 }}>
                Jelajahi Anime
              </Text>
            </TouchableOpacity>

          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
      }
