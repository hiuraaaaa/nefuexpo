import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Image,
  Dimensions, Animated, StatusBar, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, LOGO_URL } from '@/constants';
import { api } from '@/hooks/api';
import { Anime } from '@/types';

const { width, height } = Dimensions.get('window');

const CARD_W = 90;
const CARD_H = 130;
const CARD_GAP = 10;
const TILT = '-8deg';

// ─── Kolom poster diagonal ────────────────────────────────────────────────────

function PosterColumn({
  items,
  offsetY,
  delay,
}: {
  items: Anime[];
  offsetY: number;
  delay: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (items.length === 0) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: -CARD_H - CARD_GAP,
          duration: 4000 + delay * 400,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    const t = setTimeout(() => loop.start(), delay * 300);
    return () => { clearTimeout(t); loop.stop(); };
  }, [items.length]);

  const repeated = [...items, ...items, ...items]; // loop buffer

  return (
    <Animated.View
      style={{
        transform: [{ translateY: Animated.add(anim, new Animated.Value(offsetY)) }],
        gap: CARD_GAP,
      }}
    >
      {repeated.map((a, i) => (
        <View
          key={`${a.id}-${i}`}
          style={{
            width: CARD_W,
            height: CARD_H,
            borderRadius: 10,
            overflow: 'hidden',
            backgroundColor: COLORS.card,
          }}
        >
          <Image
            source={{ uri: a.image_poster }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
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
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    api.ongoing().then(r => {
      const data = r.data || [];
      setPosters(data.slice(0, 24));
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }),
      ]).start();
    }).catch(() => {});
  }, []);

  // Bagi poster ke 4 kolom
  const cols = [0, 1, 2, 3].map(i =>
    posters.filter((_, idx) => idx % 4 === i)
  );

  const GRID_H = height * 0.62;

  return (
    <View style={{ flex: 1, backgroundColor: '#08080a' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── Poster grid (diagonal) ── */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: GRID_H,
        overflow: 'hidden', transform: [{ rotate: TILT }], left: -20, right: -20 }}>
        <View style={{ flexDirection: 'row', gap: CARD_GAP, paddingHorizontal: 8 }}>
          {cols.map((col, i) => (
            <PosterColumn
              key={i}
              items={col.length > 0 ? col : Array(6).fill({ id: String(i), image_poster: '' })}
              offsetY={i % 2 === 0 ? 0 : -(CARD_H + CARD_GAP) * 0.5}
              delay={i}
            />
          ))}
        </View>
      </View>

      {/* ── Gradient overlay bawah ── */}
      <LinearGradient
        colors={['transparent', 'rgba(8,8,10,0.7)', '#08080a']}
        style={{ position: 'absolute', left: 0, right: 0, top: GRID_H * 0.3, height: GRID_H * 0.8 }}
      />

      {/* ── Logo top left ── */}
      <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
          <Image source={{ uri: LOGO_URL }} style={{ width: 40, height: 40 }} resizeMode="contain" />
        </View>
      </SafeAreaView>

      {/* ── Bottom content ── */}
      <Animated.View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}>
        <SafeAreaView edges={['bottom']}>
          <View style={{ paddingHorizontal: 28, paddingBottom: 36 }}>

            {/* App icon */}
            <View style={{
              width: 58, height: 58, borderRadius: 16,
              backgroundColor: COLORS.gold,
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
              shadowColor: COLORS.gold, shadowOpacity: 0.5, shadowRadius: 20,
              elevation: 12,
            }}>
              <Ionicons name="play-forward" size={28} color="#000" />
            </View>

            {/* Headline */}
            <Text style={{
              color: '#fff', fontSize: 34, fontWeight: '900',
              letterSpacing: -0.8, lineHeight: 40, marginBottom: 12,
            }}>
              Tonton Anime{'\n'}
              <Text style={{ color: COLORS.gold }}>Favorit Kamu</Text>
            </Text>

            {/* Subtitle */}
            <Text style={{
              color: 'rgba(255,255,255,0.45)', fontSize: 13,
              lineHeight: 20, marginBottom: 36, maxWidth: 300,
            }}>
              Ribuan judul anime subtitle Indonesia.{'\n'}Gratis, tanpa iklan, kualitas hingga 1080p.
            </Text>

            {/* CTA utama */}
            <TouchableOpacity
              onPress={() => router.replace('/(tabs)/')}
              style={{
                backgroundColor: COLORS.gold,
                paddingVertical: 16, borderRadius: 14,
                alignItems: 'center', marginBottom: 12,
                shadowColor: COLORS.gold, shadowOpacity: 0.4, shadowRadius: 16,
                elevation: 8,
              }}
            >
              <Text style={{ color: '#000', fontWeight: '900', fontSize: 15, letterSpacing: 0.5 }}>
                Mulai Nonton
              </Text>
            </TouchableOpacity>

            {/* CTA sekunder */}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/explore')}
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                paddingVertical: 16, borderRadius: 14,
                alignItems: 'center',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
              }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '700', fontSize: 15 }}>
                Jelajahi Anime
              </Text>
            </TouchableOpacity>

          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
              }
