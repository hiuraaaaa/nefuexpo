// features/explore/components/AnimeListCard.tsx
//
// v3: nomor urut "01/02" dicabut — itu cuma index render, bukan ranking
// asli (data dari search/genre-filter gak punya urutan popularitas).
// Diganti crescent bullet (signature Lunar, sama kayak SectionHeader &
// MovieRankItem). Genre sekarang jadi chip beneran (border+bg), bukan
// teks dipisah slash. Font disamain ke set Lunar.
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Anime } from '@/types';

interface Props {
  item: Anime;
  index: number;
  onPress: () => void;
  theme: any;
}

export default function AnimeListCard({ item, index, onPress, theme }: Props) {
  const genres = item.genre
    ? item.genre.split(',').map(g => g.trim()).filter(Boolean).slice(0, 2)
    : [];

  const scoreNum = item.score != null ? parseFloat(String(item.score)) : null;
  const isHighScore = scoreNum != null && scoreNum >= 7.5;

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index * 25, 250)).springify()}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 22,
          gap: 12,
        }}
      >
        {/* Crescent bullet — signature Lunar, gantiin nomor urut palsu */}
        <View style={{ width: 13, height: 13, borderRadius: 6.5, backgroundColor: theme.accent, flexShrink: 0 }}>
          <View style={{
            position: 'absolute', top: -1.5, left: 3.5, width: 13, height: 13, borderRadius: 6.5,
            backgroundColor: theme.bg,
          }} />
        </View>

        {/* Poster */}
        <View style={{ width: 88, aspectRatio: 2 / 3, borderRadius: 10, overflow: 'hidden' }}>
          <Image
            source={{ uri: item.image_poster, priority: 'normal' }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
          {item.status === 'Ongoing' && (
            <View style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              backgroundColor: `${theme.accent}CC`,
              paddingVertical: 3, alignItems: 'center',
            }}>
              <Text style={{ color: theme.bg, fontSize: 7, fontFamily: 'JetBrainsMono_600SemiBold', letterSpacing: 0.5 }}>
                ONGOING
              </Text>
            </View>
          )}
        </View>

        {/* Kolom teks */}
        <View style={{ flex: 1, paddingVertical: 3 }}>
          <Text
            style={{ color: theme.text, fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', lineHeight: 19 }}
            numberOfLines={2}
          >
            {item.title}
          </Text>

          {/* Studio · Eps · Tahun */}
          <Text style={{ color: theme.subtext, fontSize: 10.5, fontFamily: 'PlusJakartaSans_400Regular', marginTop: 6 }} numberOfLines={1}>
            {[item.studio, item.total_episode ? `${item.total_episode} eps` : null, item.year]
              .filter(Boolean).join('  ·  ')}
          </Text>

          {/* Genre — chip beneran, bukan teks dipisah slash */}
          {genres.length > 0 && (
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {genres.map(g => (
                <View key={g} style={{
                  paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
                  backgroundColor: `${theme.accent}18`, borderWidth: 1, borderColor: `${theme.accent}35`,
                }}>
                  <Text style={{ color: theme.accent, fontSize: 9.5, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                    {g}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Score — badge kecil di kanan */}
        {scoreNum != null && (
          <View style={{
            alignItems: 'center', flexShrink: 0, minWidth: 32,
            paddingVertical: 6, paddingHorizontal: 6,
            borderRadius: 8,
            backgroundColor: isHighScore ? `${theme.accent}18` : 'transparent',
            borderWidth: 1, borderColor: isHighScore ? `${theme.accent}40` : theme.border,
          }}>
            <Text style={{ color: isHighScore ? theme.accent : theme.subtext, fontSize: 11 }}>★</Text>
            <Text style={{
              color: isHighScore ? theme.accent : theme.subtext,
              fontSize: 10, fontFamily: 'JetBrainsMono_600SemiBold', marginTop: 1,
            }}>
              {item.score}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}
