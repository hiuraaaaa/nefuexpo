import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  FlatList, ActivityIndicator, Dimensions, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, DAY_KEYS, DAY_NAMES, LOGO_URL } from '@/constants';
import { api, shuffleArray, getAnimeSlug } from '@/hooks/api';
import { Anime, ScheduleDay } from '@/types';
import AnimeCard from '@/components/AnimeCard';
import SearchModal from '@/components/SearchModal';
import {
  HeroSkeleton,
  HorizontalCardSkeleton,
  RankSkeleton,
} from '@/components/Skeleton';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const [schedule, setSchedule] = useState<ScheduleDay>({});
  const [ongoing, setOngoing] = useState<Anime[]>([]);
  const [popular, setPopular] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);

  const today = DAY_KEYS[new Date().getDay()];
  const todayAnime = (schedule[today] || []).filter(a => a.status === 'ONGOING');

  const fetchData = useCallback(async () => {
    try {
      const [schRes, ongRes, popRes] = await api.home();
      setSchedule(schRes.data || {});
      setOngoing(shuffleArray(ongRes.data || []));
      setPopular(popRes.data || []);
    } catch {}
    setIsLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchData(); }, []);

  // Hero carousel auto-advance
  useEffect(() => {
    if (todayAnime.length === 0) return;
    const itv = setInterval(() => setHeroIndex(p => (p + 1) % todayAnime.length), 6000);
    return () => clearInterval(itv);
  }, [todayAnime.length]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };
  const goToAnime = (a: Anime) => router.push(`/watch/${getAnimeSlug(a)}`);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={['top']}>
      {/* Navbar */}
      <View className="flex-row items-center justify-between px-4 py-3 absolute top-0 left-0 right-0 z-50"
        style={{ backgroundColor: 'rgba(10,10,12,0.8)' }}>
        <Image source={{ uri: LOGO_URL }} className="w-12 h-12" resizeMode="contain" />
        <TouchableOpacity onPress={() => setSearchOpen(true)}
          className="w-9 h-9 rounded-full items-center justify-center border border-white/10"
          style={{ backgroundColor: COLORS.whiteDim }}>
          <Text style={{ fontSize: 16 }}>🔍</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 60, paddingBottom: 100 }}
      >
        {/* Hero Carousel */}
        {isLoading ? (
          <HeroSkeleton />
        ) : todayAnime.length > 0 ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => goToAnime(todayAnime[heroIndex])}
            style={{ width, height: width * 0.6, position: 'relative' }}>
            <Image
              source={{ uri: todayAnime[heroIndex].image_cover || todayAnime[heroIndex].image_poster }}
              style={{ width: '100%', height: '100%', opacity: 0.6 }}
              resizeMode="cover"
            />
            <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(10,10,12,0.5)' }} />
            <View className="absolute bottom-6 left-4 right-4 flex-row items-end gap-4">
              <Image
                source={{ uri: todayAnime[heroIndex].image_poster }}
                className="w-20 rounded-lg shadow-2xl"
                style={{ aspectRatio: 3 / 4.2 }}
                resizeMode="cover"
              />
              <View className="flex-1 mb-1">
                <Text className="text-white font-black text-lg leading-tight" numberOfLines={2}>
                  {todayAnime[heroIndex].title}
                </Text>
                <Text className="text-white/50 text-xs mt-1" numberOfLines={2}>
                  {todayAnime[heroIndex].synopsis}
                </Text>
                <TouchableOpacity
                  onPress={() => goToAnime(todayAnime[heroIndex])}
                  className="mt-3 px-5 py-2 rounded items-center justify-center flex-row gap-2 self-start"
                  style={{ backgroundColor: COLORS.gold }}>
                  <Text style={{ fontSize: 12 }}>▶</Text>
                  <Text className="text-black font-black text-xs tracking-widest">TONTON</Text>
                </TouchableOpacity>
              </View>
            </View>
            {/* Indicator dots */}
            <View className="absolute bottom-3 right-4 flex-row gap-1">
              {todayAnime.map((_, i) => (
                <View key={i} className={`h-1 rounded-full ${i === heroIndex ? 'w-4' : 'w-1'}`}
                  style={{ backgroundColor: i === heroIndex ? COLORS.gold : 'rgba(255,255,255,0.3)' }} />
              ))}
            </View>
          </TouchableOpacity>
        ) : null}

        {/* Ongoing Section */}
        <View className="mt-8 px-4">
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity onPress={() => router.push('/(tabs)/ongoing')}>
              <Text className="text-white font-black text-base uppercase tracking-tight">Ongoing</Text>
              <Text className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">Anime yang sedang tayang</Text>
            </TouchableOpacity>
          </View>
          {isLoading ? (
            <FlatList
              data={[...Array(6)]}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, i) => String(i)}
              renderItem={() => <HorizontalCardSkeleton />}
            />
          ) : (
            <FlatList
              data={ongoing}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={i => i.id}
              ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
              renderItem={({ item }) => (
                <AnimeCard anime={item} onPress={() => goToAnime(item)} width={100} />
              )}
            />
          )}
        </View>

        {/* Today Section */}
        {todayAnime.length > 0 && (
          <View className="mt-8 px-4">
            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity onPress={() => router.push('/(tabs)/schedule')}>
                <Text className="text-white font-black text-base uppercase tracking-tight">Today</Text>
                <Text className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">
                  Anime hari ini — {DAY_NAMES[new Date().getDay()]}
                </Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={todayAnime}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={i => i.id}
              ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
              renderItem={({ item }) => (
                <AnimeCard anime={item} onPress={() => goToAnime(item)} width={100} />
              )}
            />
          </View>
        )}

        {/* Top 10 Popular */}
        <View className="mt-8 px-4">
          <Text className="text-white font-black text-base uppercase tracking-tight mb-1">Top 10 Anime</Text>
          <Text className="text-white/40 text-xs font-bold uppercase tracking-widest mb-5">Anime populer sepanjang waktu</Text>
          {isLoading ? (
            [...Array(5)].map((_, i) => <RankSkeleton key={i} />)
          ) : (
            popular.slice(0, 10).map((anime, index) => (
              <TouchableOpacity
                key={anime.id}
                onPress={() => goToAnime(anime)}
                className="mb-3 rounded-2xl overflow-hidden flex-row items-center h-24 px-4"
                style={{
                  backgroundColor: COLORS.card,
                  borderWidth: 1,
                  borderColor: index < 3 ? 'rgba(246,207,128,0.2)' : 'rgba(255,255,255,0.05)',
                }}
                activeOpacity={0.8}
              >
                {/* Cover blurred bg */}
                <Image
                  source={{ uri: anime.image_cover }}
                  style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '40%', opacity: 0.4 }}
                  resizeMode="cover"
                />
                <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '40%', backgroundColor: 'rgba(22,22,26,0.8)' }} />
                
                {/* Rank number */}
                <View className="w-10 h-10 rounded-full items-center justify-center mr-4"
                  style={{ backgroundColor: index < 3 ? COLORS.gold : 'rgba(255,255,255,0.05)' }}>
                  <Text className={`font-black text-sm ${index < 3 ? 'text-black' : 'text-white/30'}`}>{index + 1}</Text>
                </View>
                <Text className="text-white font-bold text-sm flex-1" numberOfLines={1}>{anime.title}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <SearchModal visible={searchOpen} onClose={() => setSearchOpen(false)} />
    </SafeAreaView>
  );
}
