import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  FlatList, Dimensions, RefreshControl, Animated,
  Share, Clipboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, DAY_KEYS, DAY_NAMES, LOGO_URL } from '@/constants';
import { api, shuffleArray, getAnimeSlug } from '@/hooks/api';
import { Anime, ScheduleDay } from '@/types';
import AnimeCard from '@/components/AnimeCard';
import SearchModal from '@/components/SearchModal';
import { HeroSkeleton, HorizontalCardSkeleton, RankSkeleton } from '@/components/Skeleton';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const [ongoing, setOngoing] = useState<Anime[]>([]);
  const [popular, setPopular] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [copyToast, setCopyToast] = useState(false);

  const heroRef = useRef<ScrollView>(null);
  const ongoingRef = useRef<ScrollView>(null);
  const terbaruRef = useRef<ScrollView>(null);

  // Hero pakai ongoing (sama kayak web)
  const carouselItems = ongoing.slice(0, 8);

  const fetchData = useCallback(async () => {
    try {
      const [, ongRes, popRes] = await api.home();
      const shuffled = shuffleArray(ongRes.data || []);
      setOngoing(shuffled);
      setPopular(popRes.data || []);
    } catch {}
    setIsLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchData(); }, []);

  // Auto-advance hero
  useEffect(() => {
    if (carouselItems.length === 0) return;
    const itv = setInterval(() => {
      setHeroIndex(p => {
        const next = (p + 1) % carouselItems.length;
        heroRef.current?.scrollTo({ x: next * width, animated: true });
        return next;
      });
    }, 6000);
    return () => clearInterval(itv);
  }, [carouselItems.length]);

  const goToAnime = (a: Anime) => router.push(`/watch/${getAnimeSlug(a)}`);

  const handleHeroNext = () => {
    const next = (heroIndex + 1) % carouselItems.length;
    setHeroIndex(next);
    heroRef.current?.scrollTo({ x: next * width, animated: true });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Ajak temanmu nonton anime favorit bareng di NefuSoft, gratis dan tanpa iklan!!\n\nhttps://nefusoft.eu.cc',
        title: 'NefuSoft',
      });
    } catch {}
  };

  const handleCopy = () => {
    Clipboard.setString('https://nefusoft.eu.cc');
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2000);
  };

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={['top']}>
      {/* Copy toast */}
      {copyToast && (
        <View style={{ position: 'absolute', top: 80, left: width / 2 - 120, zIndex: 999,
          backgroundColor: COLORS.gold, paddingHorizontal: 24, paddingVertical: 12,
          borderRadius: 999, width: 240, alignItems: 'center',
          shadowColor: COLORS.gold, shadowOpacity: 0.4, shadowRadius: 20 }}>
          <Text style={{ color: '#000', fontWeight: '900', fontSize: 12 }}>Tautan berhasil disalin!</Text>
        </View>
      )}


      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── Hero Carousel ── */}
        <View style={{ width, height: width * 0.7, backgroundColor: '#0f0f12' }}>
          {/* Navbar overlay di dalam hero */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 }}>
            <Image source={{ uri: LOGO_URL }} style={{ width: 40, height: 40 }} resizeMode="contain" />
            <TouchableOpacity onPress={() => setSearchOpen(true)}
              style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
              <View style={{ width: 13, height: 13, borderRadius: 6.5, borderWidth: 2,
                borderColor: 'rgba(255,255,255,0.8)' }} />
            </TouchableOpacity>
          </View>
          {isLoading ? <HeroSkeleton /> : (
            <>
              <ScrollView
                ref={heroRef}
                horizontal
                pagingEnabled
                scrollEnabled={false}
                showsHorizontalScrollIndicator={false}
                style={{ width, height: '100%' }}
              >
                {carouselItems.map((a, i) => (
                  <TouchableOpacity key={i} activeOpacity={0.9} onPress={() => goToAnime(a)}
                    style={{ width, height: width * 0.7, position: 'relative' }}>
                    <Image source={{ uri: a.image_cover || a.image_poster }}
                      style={{ width: '100%', height: '100%', opacity: 0.6 }} resizeMode="cover" />
                    {/* Gradient overlay — 3 layer supaya smooth tanpa garis */}
                    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%',
                      backgroundColor: 'rgba(10,10,12,0.3)' }} />
                    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
                      backgroundColor: 'rgba(10,10,12,0.5)' }} />
                    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%',
                      backgroundColor: 'rgba(10,10,12,0.65)' }} />
                    {/* Content */}
                    <View style={{ position: 'absolute', bottom: 24, left: 24, right: 24,
                      flexDirection: 'row', alignItems: 'flex-end', gap: 16 }}>
                      <Image source={{ uri: a.image_poster }}
                        style={{ width: 80, aspectRatio: 3/4.2, borderRadius: 8 }}
                        resizeMode="cover" />
                      <View style={{ flex: 1, marginBottom: 4 }}>
                        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18,
                          lineHeight: 22, marginBottom: 4 }} numberOfLines={2}>
                          {a.title}
                        </Text>
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10,
                          lineHeight: 14, marginBottom: 8 }} numberOfLines={2}>
                          {a.synopsis}
                        </Text>
                        <TouchableOpacity onPress={() => goToAnime(a)}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 6,
                            backgroundColor: COLORS.gold, paddingHorizontal: 20, paddingVertical: 8,
                            borderRadius: 4, alignSelf: 'flex-start' }}>
                          <Text style={{ fontSize: 10 }}>▶</Text>
                          <Text style={{ color: '#000', fontWeight: '900', fontSize: 10,
                            letterSpacing: 1 }}>TONTON</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Counter + next button — bottom right */}
              {carouselItems.length > 0 && (
                <View style={{ position: 'absolute', bottom: 24, right: 24,
                  flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 20 }}>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 10 }}>
                    {heroIndex + 1} / {carouselItems.length}
                  </Text>
                  <View style={{ width: 32, height: 2, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 1 }} />
                  <TouchableOpacity onPress={handleHeroNext}
                    style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900' }}>›</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>

        {/* ── Share Banner — pill modern style ── */}
        <View style={{ marginHorizontal: 16, marginTop: 20, borderRadius: 24,
          overflow: 'hidden', backgroundColor: 'rgba(22,22,26,0.6)',
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)' }}>
          <Image source={{ uri: 'https://raw.githubusercontent.com/alip-jmbd/alipp/main/bc.jpg' }}
            style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.15 }}
            resizeMode="cover" />
          <View style={{ padding: 18 }}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13,
              textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>
              Sebarkan Keseruan Ini!
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginBottom: 14 }}>
              Ajak teman-temanmu marathon anime favorit bareng di NefuSoft.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <TouchableOpacity onPress={handleCopy}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6,
                  paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999,
                  backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.12)' }}>
                <View style={{ width: 10, height: 10, borderRadius: 2, borderWidth: 1.5,
                  borderColor: 'rgba(255,255,255,0.6)' }} />
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 11 }}>Salin Link</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6,
                  paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999,
                  backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.12)' }}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>&#8599;</Text>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 11 }}>Lainnya</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Ongoing Section ── */}
        <View style={{ marginTop: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 16, marginBottom: 14 }}>
            <TouchableOpacity onPress={() => router.push('/(tabs)/ongoing')}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16,
                  textTransform: 'uppercase', letterSpacing: -0.5 }}>Ongoing</Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, fontWeight: '900' }}>›</Text>
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700',
                textTransform: 'uppercase', letterSpacing: 2, marginTop: 2 }}>
                Anime yang sedang tayang
              </Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={() => ongoingRef.current?.scrollTo({ x: -300, animated: true })}
                style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => ongoingRef.current?.scrollTo({ x: 300, animated: true })}
                style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ paddingHorizontal: 16 }}>
            <ScrollView ref={ongoingRef} horizontal showsHorizontalScrollIndicator={false}
              snapToInterval={110} decelerationRate="fast" snapToAlignment="start"
              contentContainerStyle={{ gap: 10 }}>
              {isLoading
                ? [...Array(6)].map((_, i) => <HorizontalCardSkeleton key={i} />)
                : ongoing.map(item => (
                  <AnimeCard key={item.id} anime={item} onPress={() => goToAnime(item)} width={100} />
                ))
              }
            </ScrollView>
          </View>
        </View>

        {/* ── Terbaru Section (ongoing.slice 0-8, sama kayak web) ── */}
        <View style={{ marginTop: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 16, marginBottom: 14 }}>
            <TouchableOpacity onPress={() => router.push('/(tabs)/schedule')}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16,
                  textTransform: 'uppercase', letterSpacing: -0.5 }}>Terbaru</Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, fontWeight: '900' }}>›</Text>
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700',
                textTransform: 'uppercase', letterSpacing: 2, marginTop: 2 }}>
                Episode terbaru minggu ini
              </Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={() => terbaruRef.current?.scrollTo({ x: -300, animated: true })}
                style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => terbaruRef.current?.scrollTo({ x: 300, animated: true })}
                style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ paddingHorizontal: 16 }}>
            <ScrollView ref={terbaruRef} horizontal showsHorizontalScrollIndicator={false}
              snapToInterval={110} decelerationRate="fast" snapToAlignment="start"
              contentContainerStyle={{ gap: 10 }}>
              {isLoading
                ? [...Array(6)].map((_, i) => <HorizontalCardSkeleton key={i} />)
                : ongoing.slice(0, 8).map(item => (
                  <AnimeCard key={item.id} anime={item} onPress={() => goToAnime(item)} width={100} />
                ))
              }
            </ScrollView>
          </View>
        </View>

        {/* ── Top 10 Anime ── */}
        <View style={{ marginTop: 28, paddingHorizontal: 16 }}>
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16,
            textTransform: 'uppercase', letterSpacing: -0.5, marginBottom: 2 }}>
            Top 10 Anime
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700',
            textTransform: 'uppercase', letterSpacing: 2, marginBottom: 20 }}>
            Anime populer sepanjang waktu
          </Text>
          {isLoading
            ? [...Array(5)].map((_, i) => <RankSkeleton key={i} />)
            : popular.slice(0, 10).map((anime, index) => (
              <TouchableOpacity key={anime.id} onPress={() => goToAnime(anime)}
                activeOpacity={0.8}
                style={{ marginBottom: 12, borderRadius: 16, overflow: 'hidden',
                  flexDirection: 'row', alignItems: 'center', height: 88, paddingHorizontal: 16,
                  backgroundColor: COLORS.card,
                  borderWidth: 1,
                  borderColor: index < 3 ? 'rgba(246,207,128,0.2)' : 'rgba(255,255,255,0.05)',
                  ...(index < 3 ? {} : {}) }}>
                {/* BG image right */}
                <Image source={{ uri: anime.image_cover || anime.image_poster }}
                  style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '45%', opacity: 0.5 }}
                  resizeMode="cover" />
                <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '45%',
                  backgroundColor: 'rgba(22,22,26,0.85)' }} />
                {/* Rank */}
                <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center',
                  justifyContent: 'center', marginRight: 16,
                  backgroundColor: index < 3 ? COLORS.gold : 'rgba(255,255,255,0.05)',
                  borderWidth: index < 3 ? 0 : 1,
                  borderColor: 'rgba(255,255,255,0.1)' }}>
                  <Text style={{ fontWeight: '900', fontSize: 14,
                    color: index < 3 ? '#000' : 'rgba(255,255,255,0.3)' }}>
                    {index + 1}
                  </Text>
                </View>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13, flex: 1 }}
                  numberOfLines={1}>{anime.title}</Text>
              </TouchableOpacity>
            ))
          }
        </View>
      </ScrollView>

      <SearchModal visible={searchOpen} onClose={() => setSearchOpen(false)} />
    </SafeAreaView>
  );
}
