// HistoryCard.tsx — Glassmorphism
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
            activeOpacity={0.75}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              borderBottomWidth: i < history.length - 1 ? 1 : 0,
              borderBottomColor: `${theme.accent}10`,
            }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/watch/${h.anime.id}?ep=${h.episodeIndex}`);
            }}
          >
            {/* Poster */}
            <View style={{
              shadowColor: theme.accent,
              shadowOpacity: 0.3,
              shadowRadius: 5,
              elevation: 3,
            }}>
              <Image
                source={{ uri: h.anime.image_poster, priority: 'low' }}
                style={{
                  width: 38,
                  aspectRatio: 3 / 4.5,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: `${theme.accent}20`,
                }}
                contentFit="cover"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontSize: 12, fontWeight: '700' }} numberOfLines={1}>
                {h.anime.title}
              </Text>
              <Text style={{ color: theme.subtext, fontSize: 10, marginTop: 2 }}>
                Episode {h.episodeIndex}
              </Text>
            </View>

            <View style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: `${theme.accent}10`,
            }}>
              <Ionicons name="time-outline" size={13} color={theme.subtext} />
            </View>
          </TouchableOpacity>
        ))}
      </Card>
    </Animated.View>
  );
}
