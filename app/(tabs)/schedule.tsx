import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
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
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function ScheduleScreen() {
  const router   = useRouter();
  const theme    = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  const [schedule, setSchedule]     = useState<ScheduleDay>({});
  const [isLoading, setIsLoading]   = useState(true);

  const today          = new Date();
  const currentDayIdx  = today.getDay();
  const [selectedDay, setSelectedDay] = useState(DAY_KEYS[currentDayIdx]);

  useEffect(() => {
    api.schedule()
      .then(r => setSchedule(r.data || {}))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const animeList: Anime[] = schedule[selectedDay] || [];

  const weekDates = DAY_NAMES.map((name, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - currentDayIdx + i);
    return { name, date: d.getDate(), key: DAY_KEYS[i], isToday: i === currentDayIdx };
  });

  const handleDayPress = (key: string) => {
    Haptics.selectionAsync();
    setSelectedDay(key);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  // Day item width — 7 hari pas muat di layar
  const DAY_ITEM_W = (width - 32) / 7; // 32 = padding kiri kanan, 6 gap antar 7 item

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>

      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
        <Text style={{ color: theme.text, fontWeight: '900', fontSize: 28,
          letterSpacing: -0.5 }}>Jadwal</Text>
        <Text style={{ color: theme.subtext, fontSize: 11, fontWeight: '700',
          textTransform: 'uppercase', letterSpacing: 2, marginTop: 2 }}>
          Anime yang tayang minggu ini
        </Text>
      </View>

      {/* Day picker — underline style */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 4 }}>
        {weekDates.map(w => {
          const isSelected = selectedDay === w.key;
          return (
            <TouchableOpacity
              key={w.key}
              onPress={() => handleDayPress(w.key)}
              activeOpacity={0.7}
              style={{ width: DAY_ITEM_W, alignItems: 'center', paddingVertical: 8 }}
            >
              <Text style={{ fontSize: 9, fontWeight: '700', textTransform: 'uppercase',
                letterSpacing: 0.5,
                color: isSelected ? theme.accent : theme.subtext }}>
                {w.name}
              </Text>
              <Text style={{ fontSize: 16, fontWeight: '900', marginTop: 2,
                color: isSelected ? theme.accent : theme.text }}>
                {w.date}
              </Text>
              {/* Dot hari ini */}
              {w.isToday && (
                <View style={{ width: 3, height: 3, borderRadius: 2, marginTop: 3,
                  backgroundColor: isSelected ? theme.accent : theme.subtext }} />
              )}
              {/* Underline aktif */}
              <View style={{ height: 2, borderRadius: 1, marginTop: 6,
                width: isSelected ? DAY_ITEM_W * 0.6 : 0,
                backgroundColor: theme.accent }} />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: theme.border, marginHorizontal: 16, marginBottom: 12 }} />

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
            const timeText = a.key_time
              ? a.key_time.split(' ')[1]?.substring(0, 5)
              : '--:--';

            return (
              <Animated.View
                key={`${a.id}-${index}`}
                entering={FadeInDown.delay(index * 40).springify()}
                style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}
              >
                {/* Timeline kiri */}
                <View style={{ width: 40, alignItems: 'center', paddingTop: 14 }}>
                  <Text style={{ color: theme.accent, fontSize: 10, fontWeight: '900',
                    textAlign: 'center', lineHeight: 13 }}>
                    {timeText}
                  </Text>
                  <View style={{ width: 1.5, flex: 1, marginTop: 6,
                    backgroundColor: theme.border, borderRadius: 1 }} />
                </View>

                {/* Dot */}
                <View style={{ width: 10, alignItems: 'center', paddingTop: 16 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4,
                    backgroundColor: theme.accent }} />
                </View>

                {/* Card */}
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/watch/${getAnimeSlug(a)}`);
                  }}
                  activeOpacity={0.85}
                  style={{ flex: 1, borderRadius: 14, overflow: 'hidden',
                    backgroundColor: theme.card,
                    borderWidth: 1, borderColor: theme.border }}
                >
                  <View style={{ flexDirection: 'row', gap: 0 }}>
                    {/* Poster */}
                    <FastImage
                      source={{ uri: a.image_poster, priority: FastImage.priority.normal }}
                      style={{ width: 64, aspectRatio: 3/4 }}
                      resizeMode={FastImage.resizeMode.cover}
                    />

                    {/* Gradient fade dari poster ke card */}
                    <LinearGradient
                      colors={[theme.card + '00', theme.card]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={{ width: 24, position: 'absolute', left: 52, top: 0, bottom: 0 }}
                    />

                    {/* Info */}
                    <View style={{ flex: 1, padding: 12, justifyContent: 'center', gap: 4 }}>
                      <Text style={{ color: theme.text, fontWeight: '800', fontSize: 12,
                        lineHeight: 16 }} numberOfLines={2}>
                        {a.title}
                      </Text>
                      {a.genre ? (
                        <Text style={{ color: theme.subtext, fontSize: 9, fontWeight: '600' }}
                          numberOfLines={1}>
                          {a.genre.replace(/,/g, ' · ')}
                        </Text>
                      ) : null}
                    </View>

                    {/* Arrow */}
                    <View style={{ justifyContent: 'center', paddingRight: 12 }}>
                      <Ionicons name="chevron-forward" size={14} color={theme.subtext} />
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
