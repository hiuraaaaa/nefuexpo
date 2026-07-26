import React, { useRef, useState } from 'react';
import {
  View, Text, ScrollView, RefreshControl,
  StatusBar, TouchableOpacity, useWindowDimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useTheme } from '@/hooks/theme';
import { getAnimeSlug } from '@/hooks/api/api';
import { Anime } from '@/types';
import AnimeCard from '@/components/AnimeCard';
import SearchModal from '@/components/SearchModal';
import { HorizontalCardSkeleton, RankSkeleton } from '@/components/Skeleton';
import { useNavigateAnime } from '@/hooks/useNavigateAnime';

import {
  useHomeData, todayLabel,
  HeroBanner, ShareBanner, SectionHeader,
  AnnouncementBanner, MovieRankItem, NobarFAB,
} from '@/features/home';

export default function HomeScreen() {
  const router = useRouter();
  const { goToAnime } = useNavigateAnime();
  const theme  = useTheme();
  const insets = useSafeAreaInsets();

  // FIX: useWindowDimensions supaya responsif saat rotasi / tablet
  const { width } = useWindowDimensions();

  // FIX: Hitung card width dan snap interval secara dinamis
  // Formula: (layar - padding kiri-kanan - gap antar kartu) / jumlah kartu terlihat
  // Untuk HP normal: ~4.5 kartu terlihat. Untuk tablet: ~6 kartu.
  const CARD_GAP    = 10;
  const H_PADDING   = 16;
  // Tentukan berapa kartu yang terlihat berdasarkan lebar layar
  const cardsVisible = width >= 600 ? 6 : width >= 400 ? 4.5 : 3.8;
  const CARD_W      = Math.round((width - H_PADDING * 2 - CARD_GAP * Math.floor(cardsVisible)) / cardsVisible);
  const SNAP_INTERVAL = CARD_W + CARD_GAP;

  const [searchOpen, setSearchOpen] = useState(false);
  const [copyToast, setCopyToast]   = useState(false);

  const ongoingRef = useRef<ScrollView>(null);
  const todayRef   = useRef<ScrollView>(null);

  const accentTextColor = theme.tint === 'light' ? '#fff' : '#000';

  const {
    ongoing, movies, todayAnime,
    isLoading, refreshing, onRefresh,
    visibleAnnouncements, dismissAnnouncement,
  } = useHomeData();

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
        {/* Hero */}
        <HeroBanner
          items={ongoing.slice(0, 8)}
          isLoading={isLoading}
          insetTop={insets.top}
          theme={theme}
          onPressAnime={goToAnime}
          onPressSearch={() => setSearchOpen(true)}
        />

        {/* Announcements */}
        {visibleAnnouncements.map(item => (
          <AnnouncementBanner
            key={item.id}
            item={item}
            onDismiss={() => dismissAnnouncement(item.id)}
          />
        ))}

        {/* Share Banner */}
        <ShareBanner
          theme={theme}
          onCopySuccess={() => {
            setCopyToast(true);
            setTimeout(() => setCopyToast(false), 2000);
          }}
        />

        {/* Terbaru */}
        <View style={{ marginTop: 28 }}>
          <SectionHeader
            title="Terbaru"
            subtitle="Anime baru diupload"
            onPress={() => router.push('/(tabs)/ongoing')}
            theme={theme}
          />
          <View style={{ paddingLeft: H_PADDING }}>
            <ScrollView
              ref={ongoingRef} horizontal
              showsHorizontalScrollIndicator={false}
              // FIX: snapToInterval dinamis sesuai lebar layar
              snapToInterval={SNAP_INTERVAL}
              decelerationRate="fast"
              snapToAlignment="start"
              contentContainerStyle={{ gap: CARD_GAP, paddingRight: H_PADDING }}
            >
              {isLoading
                ? [...Array(6)].map((_, i) => <HorizontalCardSkeleton key={i} />)
                : ongoing.map(item => (
                  <TouchableOpacity key={item.id} onPress={() => goToAnime(item)} activeOpacity={0.85}>
                    {/* FIX: width dinamis berdasarkan layar */}
                    <AnimeCard anime={item} width={CARD_W} />
                  </TouchableOpacity>
                ))
              }
            </ScrollView>
          </View>
        </View>

        {/* Tayang Hari Ini */}
        <View style={{ marginTop: 28 }}>
          <SectionHeader
            title={`Hari ${todayLabel}`}
            subtitle="Tayang hari ini"
            onPress={() => router.push('/(tabs)/schedule')}
            theme={theme}
          />
          <View style={{ paddingLeft: H_PADDING }}>
            {isLoading ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: CARD_GAP, paddingRight: H_PADDING }}>
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
                snapToInterval={SNAP_INTERVAL}
                decelerationRate="fast"
                snapToAlignment="start"
                contentContainerStyle={{ gap: CARD_GAP, paddingRight: H_PADDING }}
              >
                {todayAnime.map(item => (
                  <TouchableOpacity key={item.id} onPress={() => goToAnime(item)} activeOpacity={0.85}>
                    <AnimeCard anime={item} width={CARD_W} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>

        {/* Movies */}
        <View style={{ marginTop: 28, paddingHorizontal: H_PADDING }}>
          <SectionHeader
            title="Movies"
            subtitle="Film anime terpopuler"
            onPress={() => router.push('/(tabs)/ongoing')}
            theme={theme}
          />
          {isLoading
            ? [...Array(5)].map((_, i) => <RankSkeleton key={i} />)
            : movies.slice(0, 10).map((anime, index) => (
                <MovieRankItem
                  key={anime.id}
                  anime={anime}
                  index={index}
                  onPress={() => goToAnime(anime)}
                  theme={theme}
                />
              ))
          }
        </View>
      </ScrollView>

      {/* Nobar FAB */}
      <NobarFAB insetBottom={insets.bottom} />

      <SearchModal visible={searchOpen} onClose={() => setSearchOpen(false)} />
    </View>
  );
}
