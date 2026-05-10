import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DAY_KEYS, DAY_NAMES } from '@/constants';
import { api, getAnimeSlug } from '@/hooks/api';
import { Anime, ScheduleDay } from '@/types';
import { ScheduleCardSkeleton } from '@/components/Skeleton';
import { useTheme } from '@/hooks/theme';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import FastImage from 'react-native-fast-image';
import { Ionicons } from '@expo/vector-icons';

export default function ScheduleScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [schedule, setSchedule] = useState<ScheduleDay>({});
  const [isLoading, setIsLoading] = useState(true);
  const today = new Date();
  const currentDayIndex = today.getDay();
  const [selectedDay, setSelectedDay] = useState(DAY_KEYS[currentDayIndex]);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    api.schedule().then(r => setSchedule(r.data || {})).catch(() => {}).finally(() => setIsLoading(false));
  }, []);

  const animeList: Anime[] = schedule[selectedDay] || [];

  const weekDates = DAY_NAMES.map((name, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - currentDayIndex + i);
    return { name, date: d.getDate(), key: DAY_KEYS[i], isToday: i === currentDayIndex };
  });

  const handleDayPress = (key: string) => {
    Haptics.selectionAsync();
    setSelectedDay(key);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>

      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
        <Text style={{ color: theme.text, fontWeight: '900', fontSize: 28,
          letterSpacing: -0.5 }}>Jadwal</Text>
        <Text style={{ color: theme.subtext, fontSize: 11, fontWeight: '700',
          textTransform: 'uppercase', letterSpacing: 2, marginTop: 2 }}>
          Anime yang tayang minggu ini
        </Text>
      </View>

      {/* Day picker */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}>
          {weekDates.map(w => {
            const isSelected = selectedDay === w.key;
            return (
              <TouchableOpacity
                key={w.key}
                onPress={() => handleDayPress(w.key)}
                activeOpacity={0.8}
                style={{
                  alignItems: 'center', gap: 4, paddingHorizontal: 14,
                  paddingVertical: 10, borderRadius: 16,
                  backgroundColor: isSelected ? theme.accent : theme.card,
                  borderWidth: 1,
                  borderColor: isSelected ? theme.accent : theme.border,
                  minWidth: 52,
                }}
              >
                <Text style={{
                  fontSize: 10, fontWeight: '700',
                  color: isSelected ? '#000' : theme.subtext,
                }}>
                  {w.name}
                </Text>
                <Text style={{
                  fontSize: 16, fontWeight: '900',
                  color: isSelected ? '#000' : theme.text,
                }}>
                  {w.date}
                </Text>
                {w.isToday && (
                  <View style={{
                    width: 4, height: 4, borderRadius: 2,
                    backgroundColor: isSelected ? '#000' : theme.accent,
                  }} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: theme.border, marginHorizontal: 16, marginBottom: 8 }} />

      {/* Content */}
      {isLoading ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}>
          {[...Array(5)].map((_, i) => <ScheduleCardSkeleton key={i} />)}
        </ScrollView>
      ) : animeList.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Ionicons name="calendar-outline" size={56} color={theme.subtext} />
          <Text style={{ color: theme.subtext, fontWeight: '700', fontSize: 13,
            textTransform: 'uppercase', letterSpacing: 2 }}>
            Belum ada jadwal
          </Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {animeList.map((a, index) => {
            const timeText = a.key_time ? a.key_time.split(' ')[1]?.substring(0, 5) : '--:--';
            return (
              <Animated.View
                key={`${a.id}-${index}`}
                entering={FadeInDown.delay(index * 40).springify()}
                style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}
              >
                {/* Time */}
                <View style={{ alignItems: 'center', width: 44 }}>
                  <Text style={{ color: theme.accent, fontSize: 11, fontWeight: '900',
                    paddingTop: 18, textAlign: 'center' }}>
                    {timeText}
                  </Text>
                  <View style={{ width: 2, flex: 1, marginTop: 6,
                    backgroundColor: theme.border, borderRadius: 1 }} />
                </View>

                {/* Dot */}
                <View style={{ alignItems: 'center', paddingTop: 20, width: 12 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5,
                    backgroundColor: theme.accent,
                    shadowColor: theme.accent, shadowOpacity: 0.6,
                    shadowRadius: 6, elevation: 4 }} />
                </View>

                {/* Card */}
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/watch/${getAnimeSlug(a)}`);
                  }}
                  activeOpacity={0.85}
                  style={{ flex: 1, borderRadius: 16, overflow: 'hidden',
                    backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border }}
                >
                  <View style={{ flexDirection: 'row', padding: 12, gap: 12 }}>
                    <FastImage
                      source={{ uri: a.image_poster, priority: FastImage.priority.normal }}
                      style={{ width: 60, aspectRatio: 3/4, borderRadius: 10 }}
                      resizeMode={FastImage.resizeMode.cover}
                    />
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                      <Text style={{ color: theme.text, fontWeight: '800', fontSize: 13,
                        marginBottom: 6 }} numberOfLines={2}>
                        {a.title}
                      </Text>
                      {a.genre && (
                        <Text style={{ color: theme.subtext, fontSize: 10, marginBottom: 6 }}
                          numberOfLines={1}>
                          {a.genre.replace(/,/g, ', ')}
                        </Text>
                      )}
                      {a.time && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Ionicons name="time-outline" size={11} color={theme.accent} />
                          <Text style={{ color: theme.accent, fontSize: 10, fontWeight: '700' }}>
                            {a.time}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Arrow */}
                    <View style={{ justifyContent: 'center' }}>
                      <Ionicons name="chevron-forward" size={16} color={theme.subtext} />
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
                              }
