import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  Dimensions, RefreshControl, Share, Linking,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn, FadeOut, FadeInDown,
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import firestore from '@react-native-firebase/firestore';

import { LOGO_URL } from '@/constants';
import { api, shuffleArray, getAnimeSlug } from '@/hooks/api';
import { getHomeCache, clearHomeCache, prefetchHome } from '@/hooks/prefetch';
import { useTheme } from '@/hooks/theme';
import { Anime, ScheduleDay } from '@/types';
import AnimeCard from '@/components/AnimeCard';
import SearchModal from '@/components/SearchModal';
import { HeroSkeleton, HorizontalCardSkeleton, RankSkeleton } from '@/components/Skeleton';

const { width } = Dimensions.get('window');

const HERO_HEIGHT = width * 0.85;

const getTodayKey = (): string => {
  const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
  return days[new Date().getDay()];
};

const todayLabel = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][new Date().getDay()];

const TYPE_COLORS: Record<string, string> = {
  info:        '#4a9eff',
  warning:     '#F6CF80',
  promo:       '#2ecc71',
  maintenance: '#e63946',
};

const TYPE_ICONS: Record<string, string> = {
  info:        'information-circle-outline',
  warning:     'warning-outline',
  promo:       'gift-outline',
  maintenance: 'construct-outline',
};

// ── Announcement Banner ───────────────────────────────────────────────────────
function AnnouncementBanner({ item, onDismiss }: { item: any; onDismiss: () => void }) {
  const theme = useTheme();
  const color = TYPE_COLORS[item.type] ?? '#4a9eff';
  const icon  = TYPE_ICONS[item.type]  ?? 'information-circle-outline';

  return (
    <Animated.View
      entering={FadeInDown.duration(400).springify()}
      exiting={FadeOut.duration(200)}
      style={{
        marginHorizontal: 16, marginTop: 12,
        borderRadius: 14, overflow: 'hidden',
        backgroundColor: theme.card,
        borderWidth: 1, borderColor: theme.border,
        borderLeftWidth: 4, borderLeftColor: color,
      }}
    >
      <View style={{ padding: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <View style={{ width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: `${color}20` }}>
            <Ionicons name={icon as any} size={14} color={color} />
          </View>
          <Text style={{ color, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, flex: 1 }}>
            {item.type ?? 'Info'}
          </Text>
          <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={16} color={theme.subtext} />
          </TouchableOpacity>
        </View>
        <Text style={{ color: theme.text, fontWeight: '800', fontSize: 13, marginBottom: 4 }}>{item.title}</Text>
        <Text style={{ color: theme.subtext, fontSize: 11, lineHeight: 17 }}>{item.body}</Text>
        {item.ctaText && item.ctaUrl && (
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Linking.openURL(item.ctaUrl); }}
            style={{ marginTop: 10, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, backgroundColor: `${color}20`, borderWidth: 1, borderColor: `${color}40` }}
          >
            <Text style={{ color, fontSize: 11, fontWeight: '800' }}>{item.ctaText} →</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

// ── Section Header ─────────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle, onPress, theme }: {
  title: string; subtitle: string; onPress: () => void; theme: any;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={{ paddingHorizontal: 16, marginBottom: 14 }} activeOpacity={0.7}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ color: theme.text, fontWeight: '900', fontSize: 16, textTransform: 'uppercase', letterSpacing: -0.5 }}>{title}</Text>
        <Text style={{ color: theme.subtext, fontSize: 16, fontWeight: '900' }}>›</Text>
      </View>
      <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginTop: 2 }}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

// ── Movie Rank Item ────────────────────────────────────────────────────────────
function MovieRankItem({ anime, index, onPress, theme }: {
  anime: Anime; index: number; onPress: () => void; theme: any;
}) {
  const scale     = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 300 }); Haptics.selectionAsync(); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
        activeOpacity={1}
        style={{
          marginBottom: 12, borderRadius: 16, overflow: 'hidden',
          flexDirection: 'row', alignItems: 'center', height: 88, paddingHorizontal: 16,
          backgroundColor: theme.card, borderWidth: 1,
          borderColor: index < 3 ? theme.accentDim : theme.border,
        }}
      >
        <Image
          source={{ uri: anime.image_cover || anime.image_poster }}
          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '55%', opacity: 0.6 }}
          contentFit="cover"
        />
        <LinearGradient
          colors={[theme.card, theme.card, 'transparent']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '75%' }}
        />
        <View style={{
          width: 40, height: 40, borderRadius: 20,
          alignItems: 'center', justifyContent: 'center', marginRight: 16, zIndex: 1,
          backgroundColor: index < 3 ? theme.accent : theme.border,
          borderWidth: index < 3 ? 0 : 1, borderColor: theme.border,
        }}>
          <Text style={{
            fontWeight: '900', fontSize: 14,
            color: index < 3 ? (theme.tint === 'light' ? '#fff' : '#000') : theme.subtext,
          }}>
            {index + 1}
          </Text>
        </View>
        <View style={{ flex: 1, zIndex: 1 }}>
          <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }} numberOfLines={1}>{anime.title}</Text>
          {anime.year ? (
            <Text style={{ color: theme.subtext, fontSize: 10, marginTop: 3 }}>
              {anime.year}{anime.studio ? ` · ${anime.studio}` : ''}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const theme  = useTheme();
  const insets = useSafeAreaInsets();

  const [ongoing, setOngoing]             = useState<Anime[]>([]);
  const [movies, setMovies]               = useState<Anime[]>([]);
  const [todayAnime, setTodayAnime]       = useState<Anime[]>([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [heroIndex, setHeroIndex]         = useState(0);
  const [searchOpen, setSearchOpen]       = useState(false);
  const [copyToast, setCopyToast]         = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [dismissedIds, setDismissedIds]   = useState<Set<string>>(new Set());

  const heroRef    = useRef<ScrollView>(null);
  const ongoingRef = useRef<ScrollView>(null);
  const todayRef   = useRef<ScrollView>(null);

  const carouselItems = ongoing.slice(0, 8);

  useEffect(() => {
    const unsub = firestore()
      .collection('announcements')
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(3)
      .onSnapshot(snap => {
        setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, () => {});
    return unsub;
  }, []);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) clearHomeCache();

      const cached = getHomeCache();
      if (cached && !isRefresh) {
        const todayKey = getTodayKey();
        setOngoing(shuffleArray(cached.ongoing));
        setMovies(cached.movies);
        setTodayAnime(cached.schedule?.[todayKey] || []);
        setIsLoading(false);
        setRefreshing(false);
        prefetchHome();
        return;
      }

      const results = await api.home();
      const [_rekom, ongRes, _comp, movRes, schedRes] = results;

      setOngoing(shuffleArray(ongRes.data || []));
      setMovies(movRes.data || []);
      const todayKey  = getTodayKey();
      const schedData = schedRes.data as ScheduleDay;
      setTodayAnime(schedData?.[todayKey] || []);
    } catch (e: any) {
      console.error('[HOME] FETCH ERROR:', e?.message);
    }
    setIsLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchData(); }, []);

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
    Haptics.selectionAsync();
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({ message: 'Ajak temanmu nonton anime favorit bareng di NefuSoft, gratis dan tanpa iklan!!\n\nhttps://nefusoft.eu.cc', title: 'NefuSoft' });
    } catch {}
  };

  const handleCopy = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Clipboard.setStringAsync('https://nefusoft.eu.cc');
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2000);
  };

  const onRefresh = () => { setRefreshing(true); fetchData(true); };

  const visibleAnnouncements = announcements.filter(a => !dismissedIds.has(a.id));

  // Warna teks di atas accent button
  const accentTextColor = theme.tint === 'light' ? '#fff' : '#000';

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={theme.tint === 'light' ? 'dark-content' : 'light-content'}
      />

      {/* Copy Toast */}
      {copyToast && (
        <Animated.View
          entering={FadeIn.duration(200)} exiting={FadeOut.duration(300)}
          style={{
            position: 'absolute', top: insets.top + 60,
            alignSelf: 'center', zIndex: 999,
            backgroundColor: theme.accent,
            paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999,
          }}
        >
          <Text style={{ color: accentTextColor, fontWeight: '900', fontSize: 12 }}>Tautan berhasil disalin!</Text>
        </Animated.View>
      )}

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      >

        {/* ── Hero Carousel ── */}
        <View style={{ width, height: HERO_HEIGHT, backgroundColor: theme.card }}>

          <View style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: insets.top + 10,
            paddingBottom: 10,
          }}>
            <Image
              source={{ uri: LOGO_URL }}
              style={{ width: 40, height: 40 }}
              contentFit="contain"
            />
            <TouchableOpacity
              onPress={() => { Haptics.selectionAsync(); setSearchOpen(true); }}
              style={{
                width: 36, height: 36, borderRadius: 18,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.4)',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
              }}
            >
              <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          </View>

          {isLoading ? <HeroSkeleton /> : (
            <>
              <ScrollView
                ref={heroRef}
                horizontal pagingEnabled scrollEnabled={false}
                showsHorizontalScrollIndicator={false}
                style={{ width, height: '100%' }}
              >
                {carouselItems.map((a, i) => (
                  <TouchableOpacity
                    key={i} activeOpacity={0.9}
                    onPress={() => goToAnime(a)}
                    style={{ width, height: HERO_HEIGHT }}
                  >
                    <Image
                      source={{ uri: a.image_cover || a.image_poster }}
                      style={{ width: '100%', height: '100%', opacity: 0.65 }}
                      contentFit="cover"
                    />
                    <LinearGradient
                      colors={['transparent', `${theme.bg}88`, theme.bg]}
                      locations={[0.3, 0.65, 1]}
                      style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%' }}
                    />
                    <View style={{
                      position: 'absolute', bottom: 28, left: 20, right: 20,
                      flexDirection: 'row', alignItems: 'flex-end', gap: 14,
                    }}>
                      <Image
                        source={{ uri: a.image_poster }}
                        style={{ width: 80, aspectRatio: 3 / 4.2, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}
                        contentFit="cover"
                      />
                      <View style={{ flex: 1, marginBottom: 4, gap: 6 }}>
                        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 17, lineHeight: 22 }} numberOfLines={2}>
                          {a.title}
                        </Text>
                        <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, lineHeight: 14 }} numberOfLines={2}>
                          {a.synopsis}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <TouchableOpacity
                            onPress={() => goToAnime(a)}
                            onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                            style={{
                              flexDirection: 'row', alignItems: 'center', gap: 6,
                              backgroundColor: theme.accent,
                              paddingHorizontal: 18, paddingVertical: 8,
                              borderRadius: 6,
                            }}
                          >
                            <Ionicons name="play" size={11} color={accentTextColor} />
                            <Text style={{ color: accentTextColor, fontWeight: '900', fontSize: 11, letterSpacing: 0.5 }}>TONTON</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {carouselItems.length > 0 && (
                <View style={{
                  position: 'absolute', bottom: 28, right: 20,
                  flexDirection: 'row', alignItems: 'center', gap: 6, zIndex: 20,
                }}>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '800', fontSize: 10 }}>
                    {heroIndex + 1} / {carouselItems.length}
                  </Text>
                  <TouchableOpacity
                    onPress={handleHeroNext}
                    style={{
                      width: 26, height: 26, borderRadius: 13,
                      alignItems: 'center', justifyContent: 'center',
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
                    }}
                  >
                    <Ionicons name="chevron-forward" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>

        {/* ── Announcements ── */}
        {visibleAnnouncements.map(item => (
          <AnnouncementBanner
            key={item.id}
            item={item}
            onDismiss={() => setDismissedIds(prev => new Set([...prev, item.id]))}
          />
        ))}

        {/* ── Share Banner ── */}
        <View style={{
          marginHorizontal: 16, marginTop: 16,
          borderRadius: 16, overflow: 'hidden',
          backgroundColor: theme.card,
          borderWidth: 1, borderColor: theme.border,
        }}>
          <Image
            source={{ uri: 'https://raw.githubusercontent.com/alip-jmbd/alipp/main/bc.jpg' }}
            style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.15 }}
            contentFit="cover"
          />
          <LinearGradient
            colors={[theme.accentDim, 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View style={{ padding: 18 }}>
            <Text style={{ color: theme.text, fontWeight: '900', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>
              Sebarkan Keseruan Ini!
            </Text>
            <Text style={{ color: theme.subtext, fontSize: 11, marginBottom: 14 }}>
              Ajak teman-temanmu marathon anime favorit bareng di NefuSoft.
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={handleCopy}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, backgroundColor: theme.border, borderWidth: 1, borderColor: theme.border }}
              >
                <Ionicons name="copy-outline" size={12} color={theme.subtext} />
                <Text style={{ color: theme.text, fontWeight: '800', fontSize: 11 }}>Salin Link</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleShare}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, backgroundColor: theme.border, borderWidth: 1, borderColor: theme.border }}
              >
                <Ionicons name="share-outline" size={12} color={theme.subtext} />
                <Text style={{ color: theme.text, fontWeight: '800', fontSize: 11 }}>Lainnya</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Ongoing / Terbaru ── */}
        <View style={{ marginTop: 28 }}>
          <SectionHeader title="Terbaru" subtitle="Anime baru diupload" onPress={() => router.push('/(tabs)/ongoing')} theme={theme} />
          <View style={{ paddingHorizontal: 16 }}>
            <ScrollView
              ref={ongoingRef} horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={110} decelerationRate="fast" snapToAlignment="start"
              contentContainerStyle={{ gap: 10 }}
            >
              {isLoading
                ? [...Array(6)].map((_, i) => <HorizontalCardSkeleton key={i} />)
                : ongoing.map(item => <AnimeCard key={item.id} anime={item} onPress={() => goToAnime(item)} width={100} />)
              }
            </ScrollView>
          </View>
        </View>

        {/* ── Tayang Hari Ini ── */}
        <View style={{ marginTop: 28 }}>
          <SectionHeader title={`Hari ${todayLabel}`} subtitle="Tayang hari ini" onPress={() => router.push('/(tabs)/schedule')} theme={theme} />
          <View style={{ paddingHorizontal: 16 }}>
            {isLoading ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {[...Array(6)].map((_, i) => <HorizontalCardSkeleton key={i} />)}
              </ScrollView>
            ) : todayAnime.length === 0 ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <Text style={{ color: theme.subtext, fontSize: 12, fontWeight: '700' }}>Tidak ada anime hari ini</Text>
              </View>
            ) : (
              <ScrollView
                ref={todayRef} horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={110} decelerationRate="fast" snapToAlignment="start"
                contentContainerStyle={{ gap: 10 }}
              >
                {todayAnime.map(item => <AnimeCard key={item.id} anime={item} onPress={() => goToAnime(item)} width={100} />)}
              </ScrollView>
            )}
          </View>
        </View>

        {/* ── Movies ── */}
        <View style={{ marginTop: 28, paddingHorizontal: 16 }}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/ongoing')} style={{ marginBottom: 20 }} activeOpacity={0.7}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ color: theme.text, fontWeight: '900', fontSize: 16, textTransform: 'uppercase', letterSpacing: -0.5 }}>Movies</Text>
              <Text style={{ color: theme.subtext, fontSize: 16, fontWeight: '900' }}>›</Text>
            </View>
            <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginTop: 2 }}>Film anime terpopuler</Text>
          </TouchableOpacity>
          {isLoading
            ? [...Array(5)].map((_, i) => <RankSkeleton key={i} />)
            : movies.slice(0, 10).map((anime, index) => (
                <MovieRankItem key={anime.id} anime={anime} index={index} onPress={() => goToAnime(anime)} theme={theme} />
              ))
          }
        </View>

      </ScrollView>

      <SearchModal visible={searchOpen} onClose={() => setSearchOpen(false)} />
    </View>
  );
          }
