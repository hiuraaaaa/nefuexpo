import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  Image, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, DAY_KEYS, DAY_NAMES } from '@/constants';
import { api, getAnimeSlug } from '@/hooks/api';
import { Anime, ScheduleDay } from '@/types';
import { ScheduleCardSkeleton } from '@/components/Skeleton';

export default function ScheduleScreen() {
  const router = useRouter();
  const [schedule, setSchedule] = useState<ScheduleDay>({});
  const [isLoading, setIsLoading] = useState(true);
  const today = new Date();
  const currentDayIndex = today.getDay();
  const [selectedDay, setSelectedDay] = useState(DAY_KEYS[currentDayIndex]);

  useEffect(() => {
    api.schedule().then(r => setSchedule(r.data || {})).catch(() => {}).finally(() => setIsLoading(false));
  }, []);

  const animeList: Anime[] = schedule[selectedDay] || [];

  const weekDates = DAY_NAMES.map((name, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - currentDayIndex + i);
    return { name, date: d.getDate(), key: DAY_KEYS[i], isToday: i === currentDayIndex };
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={['top']}>
      <Text className="text-white font-black text-xl text-center mt-4 mb-6 italic tracking-tighter">JADWAL TAYANG</Text>

      {/* Day picker */}
      <View className="flex-row justify-between px-4 mb-6 pb-4 border-b border-white/5">
        {weekDates.map(w => (
          <TouchableOpacity key={w.key} onPress={() => setSelectedDay(w.key)} className="items-center gap-1">
            <Text style={{ fontSize: 10, fontWeight: '700', color: selectedDay === w.key ? COLORS.gold : 'rgba(255,255,255,0.4)' }}>
              {w.name}
            </Text>
            <View className="w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: selectedDay === w.key ? COLORS.gold : 'transparent' }}>
              <Text style={{
                fontSize: 13, fontWeight: '900',
                color: selectedDay === w.key ? '#000' : 'rgba(255,255,255,0.6)',
              }}>{w.date}</Text>
            </View>
            {w.isToday && <View className="w-1 h-1 rounded-full" style={{ backgroundColor: COLORS.gold }} />}
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}>
          {[...Array(5)].map((_, i) => <ScheduleCardSkeleton key={i} />)}
        </ScrollView>
      ) : animeList.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-white/20 font-bold uppercase tracking-widest text-sm italic">Belum ada jadwal</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}>
          {animeList.map((a, index) => {
            const timeText = a.key_time ? a.key_time.split(' ')[1]?.substring(0, 5) : '--:--';
            return (
              <View key={`${a.id}-${index}`} className="flex-row gap-4 mb-4">
                {/* Time */}
                <Text style={{ color: COLORS.gold, fontSize: 11, fontWeight: '900', width: 44, paddingTop: 18 }}>
                  {timeText}
                </Text>
                {/* Line */}
                <View className="items-center pt-5" style={{ width: 16 }}>
                  <View className="w-2 h-2 rounded-full z-10" style={{ backgroundColor: COLORS.gold }} />
                  <View className="w-px flex-1 mt-1" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                </View>
                {/* Card */}
                <TouchableOpacity
                  onPress={() => router.push(`/watch/${getAnimeSlug(a)}`)}
                  className="flex-1 rounded-2xl overflow-hidden flex-row p-3 gap-3"
                  style={{ backgroundColor: COLORS.card, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}
                  activeOpacity={0.8}>
                  <Image source={{ uri: a.image_poster }} className="w-16 rounded-lg"
                    style={{ aspectRatio: 3 / 4 }} resizeMode="cover" />
                  <View className="flex-1">
                    <Text className="text-white font-bold text-sm mb-2" numberOfLines={2}>{a.title}</Text>
                    {a.genre && (
                      <Text className="text-white/40 text-xs" numberOfLines={1}>{a.genre.replace(/,/g, ', ')}</Text>
                    )}
                    {a.time && (
                      <Text style={{ color: COLORS.gold, fontSize: 10, fontWeight: '700', marginTop: 4 }}>{a.time}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
