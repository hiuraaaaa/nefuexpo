import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LOGO_URL } from '@/constants';
import { Anime } from '@/types';
import { HeroSkeleton } from '@/components/Skeleton';

const { width } = Dimensions.get('window');
export const HERO_HEIGHT = width * 0.85;

interface Props {
  items: Anime[];
  isLoading: boolean;
  insetTop: number;
  theme: any;
  onPressAnime: (anime: Anime) => void;
  onPressSearch: () => void;
}

export function HeroBanner({ items, isLoading, insetTop, theme, onPressAnime, onPressSearch }: Props) {
  const heroRef   = useRef<ScrollView>(null);
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
  }, [items.length]);

  const handleNext = () => {
    const next = (index + 1) % items.length;
    setIndex(next);
    heroRef.current?.scrollTo({ x: next * width, animated: true });
    Haptics.selectionAsync();
  };

  return (
    <View style={{ width, height: HERO_HEIGHT, backgroundColor: theme.card }}>
      {/* Top bar */}
      <View style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: insetTop + 10, paddingBottom: 10,
      }}>
        <Image source={{ uri: LOGO_URL }} style={{ width: 40, height: 40 }} contentFit="contain" />
        <TouchableOpacity
          onPress={() => { Haptics.selectionAsync(); onPressSearch(); }}
          style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
        >
          <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.9)" />
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
              <TouchableOpacity key={i} activeOpacity={0.9} onPress={() => onPressAnime(a)} style={{ width, height: HERO_HEIGHT }}>
                <Image
                  source={{ uri: a.image_cover || a.image_poster }}
                  style={{ width: '100%', height: '100%', opacity: 0.65 }}
                  contentFit="cover"
                />
                <LinearGradient
                  colors={['transparent', `${theme.bg}88`, theme.bg]}
                  locations={[0.3, 0.65, 1]}
                  style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%' }}
                />
                <View style={{ position: 'absolute', bottom: 28, left: 20, right: 20, flexDirection: 'row', alignItems: 'flex-end', gap: 14 }}>
                  <Image
                    source={{ uri: a.image_poster }}
                    style={{ width: 80, aspectRatio: 3 / 4.2, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}
                    contentFit="cover"
                  />
                  <View style={{ flex: 1, marginBottom: 4, gap: 6 }}>
                    <Text style={{ color: '#fff', fontWeight: '900', fontSize: 17, lineHeight: 22 }} numberOfLines={2}>{a.title}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, lineHeight: 14 }} numberOfLines={2}>{a.synopsis}</Text>
                    <TouchableOpacity
                      onPress={() => onPressAnime(a)}
                      onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.accent, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 6, alignSelf: 'flex-start', marginTop: 4 }}
                    >
                      <Ionicons name="play" size={11} color={accentTextColor} />
                      <Text style={{ color: accentTextColor, fontWeight: '900', fontSize: 11, letterSpacing: 0.5 }}>TONTON</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {items.length > 0 && (
            <View style={{ position: 'absolute', bottom: 28, right: 20, flexDirection: 'row', alignItems: 'center', gap: 6, zIndex: 20 }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '800', fontSize: 10 }}>{index + 1} / {items.length}</Text>
              <TouchableOpacity
                onPress={handleNext}
                style={{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
              >
                <Ionicons name="chevron-forward" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
}
