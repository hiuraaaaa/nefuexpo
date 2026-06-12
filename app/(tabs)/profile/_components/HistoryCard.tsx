import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/theme';
import { HistoryItem } from '@/types';
import { SectionLabel, Card } from './shared';

export function HistoryCard({ history }: { history: HistoryItem[] }) {
  const theme  = useTheme();
  const router = useRouter();

  if (history.length === 0) return null;

  return (
    <Animated.View entering={FadeInDown.delay(160).springify()}>
      <SectionLabel label="Terakhir Ditonton" />
      <Card>
        {history.map((h, i) => (
          <TouchableOpacity
            key={`hist-${i}`}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 12,
              paddingHorizontal: 14, paddingVertical: 12,
              borderBottomWidth: i < history.length - 1 ? 1 : 0,
              borderBottomColor: theme.border,
            }}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/watch/${h.anime.id}`); }}
          >
            <Image
              source={{ uri: h.anime.image_poster, priority: 'low' }}
              style={{ width: 38, aspectRatio: 3 / 4.5, borderRadius: 6 }}
              contentFit="cover"
            />
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontSize: 12, fontWeight: '600' }} numberOfLines={1}>{h.anime.title}</Text>
              <Text style={{ color: theme.subtext, fontSize: 10, marginTop: 2 }}>Episode {h.episodeIndex}</Text>
            </View>
            <Ionicons name="time-outline" size={14} color={theme.subtext} />
          </TouchableOpacity>
        ))}
      </Card>
    </Animated.View>
  );
}
