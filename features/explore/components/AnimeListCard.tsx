// features/explore/components/AnimeListCard.tsx
//
// Signature: adopsi pattern LibraryListItem — poster flush ke left edge,
// left border tebal sebagai hierarchy cue bukan card shadow,
// nomor urut italic di kanan gantiin icon, score teks bold italic.
// Tidak ada card wrapper / borderRadius / backgroundColor card.
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

  // Edge weight tapers — item pertama paling berat, quiet hierarchy
  const edgeWidth  = index === 0 ? 4 : index <= 2 ? 3 : 2;
  // Odd rows nudge kanan sedikit — breaks perfectly-flush alignment
  const marginLeft = index % 2 === 0 ? 0 : 8;

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
          marginBottom: 18,
          borderLeftWidth: edgeWidth,
          borderLeftColor: item.score && parseFloat(item.score) >= 7.5
            ? theme.accent
            : `${theme.accent}55`,
        }}
      >
        {/* Poster — flush terhadap border kiri, tidak ada padding */}
        <View style={{ width: 72, aspectRatio: 2 / 3 }}>
          <Image
            source={{ uri: item.image_poster, priority: 'normal' }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
          {/* Status badge di sudut poster — bukan di luar card */}
          {item.status === 'Ongoing' && (
            <View style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              backgroundColor: `${theme.accent}CC`,
              paddingVertical: 2, alignItems: 'center',
            }}>
              <Text style={{ color: theme.bg, fontSize: 7, fontWeight: '900', letterSpacing: 0.5 }}>
                ONGOING
              </Text>
            </View>
          )}
        </View>

        {/* Kolom teks */}
        <View style={{ flex: 1, paddingLeft: 13, paddingVertical: 2, justifyContent: 'center', gap: 4 }}>
          {/* Judul */}
          <Text
            style={{ color: theme.text, fontSize: 14, fontWeight: '800', lineHeight: 19 }}
            numberOfLines={2}
          >
            {item.title}
          </Text>

          {/* Studio · Eps — satu baris, bukan chips terpisah */}
          <Text style={{ color: theme.subtext, fontSize: 10.5, fontWeight: '500' }} numberOfLines={1}>
            {[item.studio, item.total_episode ? `${item.total_episode} eps` : null, item.year]
              .filter(Boolean).join('  ·  ')}
          </Text>

          {/* Genre — teks inline, bukan chips */}
          {genres.length > 0 && (
            <Text style={{ color: `${theme.subtext}99`, fontSize: 10, fontWeight: '600', letterSpacing: 0.2 }}>
              {genres.join(' / ')}
            </Text>
          )}

          {/* Score — teks italic bold, bukan ⭐ icon */}
          {item.score != null && (
            <Text style={{
              color: theme.accent,
              fontSize: 11,
              fontWeight: '800',
              fontStyle: 'italic',
              marginTop: 1,
            }}>
              {item.score}
            </Text>
          )}
        </View>

        {/* Nomor urut italic di kanan — gantiin icon */}
        <View style={{ paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{
            color: `${theme.accent}50`,
            fontSize: 18,
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
