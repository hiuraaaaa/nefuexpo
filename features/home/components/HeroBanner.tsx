// features/home/components/HeroBanner.tsx
//
// Editorial hero: nomor rank besar italic jadi focal point (bukan poster
// kecil overlay generik), top bar search pakai "/" plain bukan icon kaca
// pembesar dalam circle, CTA "Tonton" jadi underline bukan rounded button.
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Anime } from '@/types';
import { HeroSkeleton } from '@/components/Skeleton';

const { width } = Dimensions.get('window');
export const HERO_HEIGHT = width * 1.18;

interface Props {
  items: Anime[];
  isLoading: boolean;
  insetTop: number;
  theme: any;
  onPressAnime: (anime: Anime) => void;
  onPressSearch: () => void;
}

export function HeroBanner({ items, isLoading, insetTop, theme, onPressAnime, onPressSearch }: Props) {
  const heroRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length === 0) return;
    const itv = setInterval(() => {
      setIndex(p => {
        const next = (p + 1) % items.length;
        heroRef.current?.scrollTo({ x: next * width, animated: true });
        return next;
      });
    }, 6000);
    return () => clearInterval(itv);
  }, [items.length]);

  return (
    <View style={{ width, height: HERO_HEIGHT, backgroundColor: theme.card }}>
      {/* Top bar */}
      <View style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 22, paddingTop: insetTop + 16,
      }}>
        <Text style={{
          color: 'rgba(255,255,255,0.55)', fontSize: 9, fontWeight: '800',
          letterSpacing: 2.5, textTransform: 'uppercase',
        }}>
          NefuSoft
        </Text>
        <TouchableOpacity
          onPress={() => { Haptics.selectionAsync(); onPressSearch(); }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '300' }}>/</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? <HeroSkeleton /> : (
        <>
          <ScrollView
            ref={heroRef}
            horizontal pagingEnabled scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            style={{ width, height: '100%' }}
          >
            {items.map((a, i) => (
              <TouchableOpacity
                key={i} activeOpacity={0.9}
                onPress={() => onPressAnime(a)}
                style={{ width, height: HERO_HEIGHT }}
              >
                <Image
                  source={{ uri: a.image_cover || a.image_poster }}
                  style={{ width: '100%', height: '100%', opacity: 0.5 }}
                  contentFit="cover"
                />
                <LinearGradient
                  colors={['transparent', `${theme.bg}66`, theme.bg]}
                  locations={[0, 0.45, 0.92]}
                  style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '85%' }}
                />

                <View style={{ position: 'absolute', bottom: 32, left: 22, right: 22 }}>
                  {/* Nomor rank — focal point besar, bukan badge kecil */}
                  <Text style={{
                    color: `${theme.accent}80`,
                    fontSize: 80, fontWeight: '900', fontStyle: 'italic',
                    lineHeight: 64, letterSpacing: -3,
                    marginBottom: -6,
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </Text>

                  <Text style={{
                    color: theme.accent, fontSize: 10, fontWeight: '800',
                    letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8,
                  }}>
                    {a.status === 'Ongoing' ? 'Sedang Tayang' : 'Direkomendasikan'}
                  </Text>

                  <Text
                    style={{ color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: -1, lineHeight: 30, marginBottom: 10 }}
                    numberOfLines={2}
                  >
                    {a.title}
                  </Text>

                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11.5, fontWeight: '600', marginBottom: 18 }} numberOfLines={1}>
                    {[a.type, a.genre, a.lastch].filter(Boolean).join(' · ')}
                  </Text>

                  <TouchableOpacity
                    onPress={() => onPressAnime(a)}
                    onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                    style={{
                      alignSelf: 'flex-start',
                      borderBottomWidth: 2, borderBottomColor: theme.accent,
                      paddingBottom: 6,
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 1 }}>
                      TONTON SEKARANG
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Dots indicator — bar bukan circle */}
          {items.length > 0 && (
            <View style={{ position: 'absolute', bottom: 32, right: 22, flexDirection: 'row', gap: 5, zIndex: 20 }}>
              {items.slice(0, Math.min(items.length, 6)).map((_, i) => (
                <View
                  key={i}
                  style={{
                    height: 4, borderRadius: 2,
                    width: i === index ? 16 : 4,
                    backgroundColor: i === index ? theme.accent : 'rgba(255,255,255,0.25)',
                  }}
                />
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
}
