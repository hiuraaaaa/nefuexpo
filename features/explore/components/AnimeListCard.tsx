// features/explore/components/AnimeListCard.tsx
//
// v2: spacing lebih lega, poster lebih besar, genre dipisah dari meta row,
// score jadi badge kecil bukan teks polos, edge weight lebih kontras.
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

  // Edge weight tapers across first few — quiet hierarchy tanpa featured treatment
  const edgeWidth  = index === 0 ? 4 : index <= 2 ? 3 : 2;
  // Odd rows nudge kanan sedikit — breaks perfectly-flush alignment
  const marginLeft = index % 2 === 0 ? 0 : 10;

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index * 25, 250)).springify()}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={{
          flexDirection: 'row',
          marginLeft,
          marginBottom: 30,
          borderLeftWidth: edgeWidth,
          borderLeftColor: isHighScore ? theme.accent : `${theme.accent}45`,
        }}
      >
        {/* Poster — lebih besar dari v1, masih flush ke border kiri */}
        <View style={{ width: 92, aspectRatio: 2 / 3 }}>
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
              <Text style={{ color: theme.bg, fontSize: 7.5, fontWeight: '900', letterSpacing: 0.5 }}>
                ONGOING
              </Text>
            </View>
          )}
        </View>

        {/* Kolom teks — lebih banyak breathing room antar baris */}
        <View style={{ flex: 1, paddingLeft: 15, paddingVertical: 3, justifyContent: 'center' }}>
          {/* Judul */}
          <Text
            style={{ color: theme.text, fontSize: 15, fontWeight: '800', lineHeight: 20 }}
            numberOfLines={2}
          >
            {item.title}
          </Text>

          {/* Studio · Eps · Tahun */}
          <Text style={{ color: theme.subtext, fontSize: 11, fontWeight: '500', marginTop: 7 }} numberOfLines={1}>
            {[item.studio, item.total_episode ? `${item.total_episode} eps` : null, item.year]
              .filter(Boolean).join('  ·  ')}
          </Text>

          {/* Genre — baris terpisah sendiri, tidak numpuk sama meta */}
          {genres.length > 0 && (
            <Text style={{
              color: theme.accent, fontSize: 10.5, fontWeight: '700',
              letterSpacing: 0.2, marginTop: 6,
            }}>
              {genres.join('  /  ')}
            </Text>
          )}

          {/* Score — badge kecil, bukan teks polos */}
          {scoreNum != null && (
            <View style={{
              flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
              marginTop: 9,
              paddingHorizontal: 7, paddingVertical: 2.5,
              borderWidth: 1, borderColor: isHighScore ? theme.accent : `${theme.subtext}40`,
              borderRadius: 4,
            }}>
              <Text style={{
                color: isHighScore ? theme.accent : theme.subtext,
                fontSize: 10.5, fontWeight: '900', fontStyle: 'italic',
              }}>
                {item.score}
              </Text>
            </View>
          )}
        </View>

        {/* Nomor urut — lebih besar, jadi focal point yang lebih kuat */}
        <View style={{ paddingHorizontal: 14, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{
            color: `${theme.accent}60`,
            fontSize: 22,
            fontWeight: '900',
            fontStyle: 'italic',
          }}>
            {String(index + 1).padStart(2, '0')}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
