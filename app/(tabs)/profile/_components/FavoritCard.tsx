import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/theme';
import { Anime } from '@/types';
import { SectionLabel, Card } from './shared';

export function FavoritCard({ favorites }: { favorites: Anime[] }) {
  const theme  = useTheme();
  const router = useRouter();

  if (favorites.length === 0) return null;

  return (
    <Animated.View entering={FadeInDown.delay(120).springify()}>
      <SectionLabel label="Favorit" />
      <Card>
        {favorites.slice(0, 5).map((a, i) => (
          <TouchableOpacity
            key={`fav-${i}`}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 12,
              paddingHorizontal: 14, paddingVertical: 12,
              borderBottomWidth: i < Math.min(favorites.length, 5) - 1 ? 1 : 0,
              borderBottomColor: theme.border,
            }}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/watch/${a.id}`); }}
          >
            <Image
              source={{ uri: a.image_poster, priority: 'normal' }}
              style={{ width: 38, aspectRatio: 3 / 4.5, borderRadius: 6 }}
              contentFit="cover"
            />
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontSize: 12, fontWeight: '600' }} numberOfLines={1}>{a.title}</Text>
              <Text style={{ color: theme.subtext, fontSize: 10, marginTop: 2 }}>{a.type} • {a.status}</Text>
            </View>
            <Ionicons name="bookmark" size={15} color={theme.accent} />
          </TouchableOpacity>
        ))}
      </Card>
    </Animated.View>
  );
}
