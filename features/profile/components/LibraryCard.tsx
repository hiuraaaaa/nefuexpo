// LibraryCard.tsx — Combined Favorit + Riwayat with tab switcher (Glassmorphism)
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/theme';
import { HistoryItem, Anime } from '@/types';
import { Card } from './shared';

type LibTab = 'favorit' | 'history';

interface Props {
  favorites: Anime[];
  history:   HistoryItem[];
}

export function LibraryCard({ favorites, history }: Props) {
  const theme  = useTheme();
  const router = useRouter();
  const [tab, setTab] = useState<LibTab>('favorit');

  if (favorites.length === 0 && history.length === 0) return null;

  const TABS: { key: LibTab; label: string; icon: string; count: number }[] = [
    { key: 'favorit', label: 'Favorit',  icon: 'bookmark',   count: favorites.length },
    { key: 'history', label: 'Riwayat',  icon: 'time',       count: history.length },
  ];

  const activeData = tab === 'favorit' ? favorites : history;
  const isEmpty = activeData.length === 0;

  return (
    <Animated.View entering={FadeInDown.delay(120).springify()}>
      {/* Section label */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 20, marginBottom: 8, marginTop: 6,
      }}>
        <View style={{ width: 3, height: 12, borderRadius: 2, backgroundColor: theme.accent }} />
        <Text style={{
          color: theme.subtext, fontSize: 10, fontWeight: '800',
          letterSpacing: 2, textTransform: 'uppercase',
        }}>
          Koleksi
        </Text>
      </View>

      <Card style={{ paddingTop: 8 }}>
        {/* ── Tab switcher ── */}
        <View style={{
          flexDirection: 'row',
          marginHorizontal: 12,
          marginTop: 4,
          marginBottom: 4,
          backgroundColor: `${theme.accent}10`,
          borderRadius: 14,
          padding: 4,
          gap: 4,
        }}>
          {TABS.map(t => {
            const active = tab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => { Haptics.selectionAsync(); setTab(t.key); }}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  paddingVertical: 9,
                  borderRadius: 11,
                  backgroundColor: active ? theme.accent : 'transparent',
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={(active ? t.icon : `${t.icon}-outline`) as any}
                  size={13}
                  color={active ? theme.bg : theme.subtext}
                />
                <Text style={{
                  color: active ? theme.bg : theme.subtext,
                  fontSize: 12,
                  fontWeight: '800',
                }}>
                  {t.label}
                </Text>
                {t.count > 0 && (
                  <View style={{
                    minWidth: 18, height: 18, borderRadius: 9,
                    alignItems: 'center', justifyContent: 'center',
                    paddingHorizontal: 4,
                    backgroundColor: active ? `${theme.bg}30` : `${theme.accent}25`,
                  }}>
                    <Text style={{
                      color: active ? theme.bg : theme.accent,
                      fontSize: 9, fontWeight: '900',
                    }}>
                      {t.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── List content ── */}
        <Animated.View key={tab} entering={FadeIn.duration(180)} style={{ marginTop: 4 }}>
          {isEmpty ? (
            <View style={{ alignItems: 'center', paddingVertical: 36 }}>
              <Ionicons
                name={tab === 'favorit' ? 'bookmark-outline' : 'time-outline'}
                size={30}
                color={`${theme.accent}40`}
              />
              <Text style={{ color: theme.subtext, fontSize: 12, fontWeight: '600', marginTop: 8 }}>
                {tab === 'favorit' ? 'Belum ada favorit' : 'Belum ada riwayat'}
              </Text>
            </View>
          ) : (
            activeData.slice(0, 5).map((item, i) => {
              const isFav  = tab === 'favorit';
              const anime  = isFav ? (item as Anime) : (item as HistoryItem).anime;
              const isLast = i === Math.min(activeData.length, 5) - 1;

              return (
                <TouchableOpacity
                  key={`${tab}-${i}`}
                  activeOpacity={0.75}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderBottomWidth: isLast ? 0 : 1,
                    borderBottomColor: `${theme.accent}10`,
                  }}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/watch/${anime.id}`);
                  }}
                >
                  <View style={{
                    shadowColor: theme.accent,
                    shadowOpacity: isFav ? 0.4 : 0.3,
                    shadowRadius: isFav ? 6 : 5,
                    elevation: isFav ? 4 : 3,
                  }}>
                    <Image
                      source={{ uri: anime.image_poster, priority: isFav ? 'normal' : 'low' }}
                      style={{
                        width: 38,
                        aspectRatio: 3 / 4.5,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: `${theme.accent}${isFav ? '25' : '20'}`,
                      }}
                      contentFit="cover"
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontSize: 12, fontWeight: '700' }} numberOfLines={1}>
                      {anime.title}
                    </Text>
                    <Text style={{ color: theme.subtext, fontSize: 10, marginTop: 2 }}>
                      {isFav
                        ? `${(item as Anime).type} • ${(item as Anime).status}`
                        : `Episode ${(item as HistoryItem).episodeIndex}`}
                    </Text>
                  </View>

                  <View style={{
                    width: 28, height: 28, borderRadius: 8,
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: isFav ? `${theme.accent}15` : `${theme.accent}10`,
                  }}>
                    <Ionicons
                      name={isFav ? 'bookmark' : 'time-outline'}
                      size={13}
                      color={isFav ? theme.accent : theme.subtext}
                    />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </Animated.View>
      </Card>
    </Animated.View>
  );
}
