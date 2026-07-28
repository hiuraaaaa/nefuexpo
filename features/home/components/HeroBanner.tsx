import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LOGO_URL } from '@/constants';
import { Anime } from '@/types';
import { HeroSkeleton } from '@/components/Skeleton';

// Layout kompak (bukan full-bleed cinematic lagi): poster + info di samping,
// dot progress bentuk crescent — bukan angka "1/8".
export const calcHeroHeight = (w: number) => 210 + Math.max(0, (w - 380) * 0.15);

interface Props {
  items: Anime[];
  isLoading: boolean;
  insetTop: number;
  theme: any;
  onPressAnime: (anime: Anime) => void;
  onPressSearch: () => void;
}

export function HeroBanner({ items, isLoading, insetTop, theme, onPressAnime, onPressSearch }: Props) {
  const { width } = useWindowDimensions();
  const HERO_HEIGHT = calcHeroHeight(width);

  const heroRef       = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const accentTextColor = theme.tint === 'light' ? '#fff' : '#000';

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
  }, [items.length, width]);

  const goTo = (i: number) => {
    setIndex(i);
    heroRef.current?.scrollTo({ x: i * width, animated: true });
    Haptics.selectionAsync();
  };

  return (
    <View style={{ width, backgroundColor: theme.bg, paddingTop: insetTop + 10 }}>
      {/* Top bar */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingBottom: 6,
      }}>
        <Image source={{ uri: LOGO_URL }} style={{ width: 32, height: 32 }} contentFit="contain" />
        <TouchableOpacity
          onPress={() => { Haptics.selectionAsync(); onPressSearch(); }}
          style={{
            width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
            backgroundColor: `${theme.subtext}12`, borderWidth: 1, borderColor: theme.border,
          }}
        >
          <Ionicons name="search-outline" size={16} color={theme.text} />
        </TouchableOpacity>
      </View>

      {isLoading ? <HeroSkeleton /> : (
        <View style={{ height: HERO_HEIGHT }}>
          <ScrollView
            ref={heroRef}
            horizontal pagingEnabled scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            style={{ width, height: '100%' }}
          >
            {items.map((a, i) => (
              <View key={i} style={{ width, height: HERO_HEIGHT, paddingHorizontal: 24 }}>
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => onPressAnime(a)}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 16 }}
                >
                  <Image
                    source={{ uri: a.image_poster }}
                    style={{
                      width: 118, aspectRatio: 3 / 4.3, borderRadius: 14,
                      borderWidth: 1, borderColor: theme.border,
                    }}
                    contentFit="cover"
                  />
                  <View style={{ flex: 1, gap: 8, paddingBottom: 4 }}>
                    <Text style={{
                      color: theme.accent, fontFamily: 'JetBrainsMono_600SemiBold',
                      fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase',
                    }}>
                      Tayang Musim Ini
                    </Text>
                    <Text
                      style={{ color: theme.text, fontFamily: 'Unbounded_700Bold', fontSize: 16, lineHeight: 21 }}
                      numberOfLines={3}
                    >
                      {a.title}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 }}>
                      <TouchableOpacity
                        onPress={() => onPressAnime(a)}
                        onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                        style={{
                          flexDirection: 'row', alignItems: 'center', gap: 6,
                          backgroundColor: theme.accent, paddingHorizontal: 16, paddingVertical: 9,
                          borderRadius: 999,
                        }}
                      >
                        <Ionicons name="play" size={11} color={accentTextColor} />
                        <Text style={{ color: accentTextColor, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11, letterSpacing: 0.3 }}>
                          Tonton
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          {/* Moon-dot progress — bukan angka "1/8" */}
          {items.length > 1 && (
            <View style={{
              position: 'absolute', bottom: 4, left: 24 + 118 + 16, flexDirection: 'row', gap: 5, alignItems: 'center',
            }}>
              {items.slice(0, 8).map((_, i) => (
                <TouchableOpacity key={i} onPress={() => goTo(i)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                  <View style={{
                    width: i === index ? 16 : 6, height: 6, borderRadius: 3,
                    backgroundColor: i === index ? theme.accent : `${theme.subtext}40`,
                  }} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
