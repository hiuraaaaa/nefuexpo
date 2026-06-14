import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Anime } from '@/types';

interface Props {
  item: Anime;
  index: number;
  onPress: () => void;
  theme: any;
}

export default function AnimeListCard({ item, index, onPress, theme }: Props) {
  const genres        = item.genre ? item.genre.split(',').map(g => g.trim()).filter(Boolean) : [];
  const visibleGenres = genres.slice(0, 3);
  const extraGenres   = genres.length - visibleGenres.length;

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index * 30, 300)).springify()}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.82}
        style={{
          flexDirection: 'row',
          backgroundColor: theme.card,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: theme.border,
          overflow: 'hidden',
          marginBottom: 10,
        }}
      >
        {/* Poster */}
        <Image
          source={{ uri: item.image_poster, priority: 'normal' }}
          style={{ width: 100, aspectRatio: 2 / 3 }}
          contentFit="cover"
        />

        {/* Detail */}
        <View style={{ flex: 1, padding: 10, justifyContent: 'space-between' }}>

          {/* Eps + status + tahun */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {item.total_episode != null && (
                <View style={{ backgroundColor: theme.accentDim, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text style={{ color: theme.accent, fontSize: 9, fontWeight: '800' }}>{item.total_episode} Eps</Text>
                </View>
              )}
              {item.status ? (
                <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text style={{ color: theme.subtext, fontSize: 9, fontWeight: '700' }}>{item.status}</Text>
                </View>
              ) : null}
            </View>
            {item.year ? (
              <Text style={{ color: theme.subtext, fontSize: 9, fontWeight: '600' }}>{item.year}</Text>
            ) : null}
          </View>

          {/* Judul */}
          <Text
            style={{ color: theme.text, fontSize: 13, fontWeight: '800', lineHeight: 18, marginBottom: 4 }}
            numberOfLines={2}
          >
            {item.title}
          </Text>

          {/* Genre tags */}
          {genres.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 5 }}>
              {visibleGenres.map(g => (
                <View key={g} style={{
                  backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 5,
                  paddingHorizontal: 6, paddingVertical: 2,
                  borderWidth: 1, borderColor: theme.border,
                }}>
                  <Text style={{ color: theme.subtext, fontSize: 8, fontWeight: '700' }}>{g}</Text>
                </View>
              ))}
              {extraGenres > 0 && (
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 5,
                  paddingHorizontal: 6, paddingVertical: 2,
                  borderWidth: 1, borderColor: theme.border,
                }}>
                  <Text style={{ color: theme.subtext, fontSize: 8, fontWeight: '700' }}>+{extraGenres}</Text>
                </View>
              )}
            </View>
          )}

          {/* Studio + score */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {item.studio ? (
              <Text style={{ color: theme.subtext, fontSize: 9, fontWeight: '600', flex: 1 }} numberOfLines={1}>
                {item.studio}
              </Text>
            ) : null}
            {item.score != null && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Ionicons name="star" size={9} color={theme.accent} />
                <Text style={{ color: theme.accent, fontSize: 9, fontWeight: '800' }}>{item.score}</Text>
              </View>
            )}
          </View>

          {/* Synopsis */}
          {item.synopsis ? (
            <Text
              style={{ color: theme.subtext, fontSize: 10, lineHeight: 14, marginTop: 5 }}
              numberOfLines={3}
            >
              {item.synopsis}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
