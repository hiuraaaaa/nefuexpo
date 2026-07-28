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
import { HorizontalCardSkeleton } from '@/components/Skeleton';
import { useNavigateAnime } from '@/hooks/useNavigateAnime';

import {
  useHomeData, todayLabel,
  HeroBanner, ShareBanner, SectionHeader,
  AnnouncementBanner, NobarFAB,
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
    ongoing, ongoingType, ongoingTabLoading, changeOngoingType,
    recommendations, todayAnime,
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

        {/* Ongoing */}
        <View style={{ marginTop: 28 }}>
          <SectionHeader
            title="Ongoing"
            subtitle="Anime yang sedang tayang"
            onPress={() => router.push('/(tabs)/ongoing')}
            theme={theme}
          />
          <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: H_PADDING, marginBottom: 12 }}>
            {([
              { id: 'all', label: 'Semua' },
              { id: 'anime', label: 'Anime' },
              { id: 'donghua', label: 'Donghua' },
            ] as const).map(tab => {
              const active = ongoingType === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => { Haptics.selectionAsync(); changeOngoingType(tab.id); }}
                  activeOpacity={0.8}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999,
                    backgroundColor: active ? theme.accent : `${theme.subtext}15`,
                  }}
                >
                  <Text style={{ color: active ? accentTextColor : theme.subtext, fontSize: 11, fontWeight: '800' }}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
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
              {(isLoading || ongoingTabLoading)
                ? [...Array(6)].map((_, i) => <HorizontalCardSkeleton key={i} />)
                : ongoing.map(item => (
                  <TouchableOpacity key={item.id} onPress={() => goToAnime(item)} activeOpacity={0.85}>
                    {/* FIX: width dinamis berdasarkan layar */}
                    <AnimeCard anime={item} width={CARD_W} theme={theme} />
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
                    <AnimeCard anime={item} width={CARD_W} theme={theme} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>

        {/* Rekomendasi */}
        <View style={{ marginTop: 28 }}>
          <SectionHeader
            title="Rekomendasi"
            subtitle="Pilihan untuk kamu"
            onPress={() => router.push('/(tabs)/ongoing')}
            theme={theme}
          />
          <View style={{ paddingLeft: H_PADDING }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={SNAP_INTERVAL}
              decelerationRate="fast"
              snapToAlignment="start"
              contentContainerStyle={{ gap: CARD_GAP, paddingRight: H_PADDING }}
            >
              {isLoading
                ? [...Array(6)].map((_, i) => <HorizontalCardSkeleton key={i} />)
                : recommendations.slice(0, 10).map(anime => (
                  <TouchableOpacity key={anime.id} onPress={() => goToAnime(anime)} activeOpacity={0.85}>
                    <AnimeCard
                      anime={anime}
                      width={CARD_W}
                      theme={theme}
                      scoreLabel={anime.score ? String(anime.score) : undefined}
                      metaLabel={[anime.total_episode ? `${anime.total_episode} Eps` : null, anime.status].filter(Boolean).join(' · ')}
                    />
                  </TouchableOpacity>
                ))
              }
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      {/* Nobar FAB */}
      <NobarFAB insetBottom={insets.bottom} />

      <SearchModal visible={searchOpen} onClose={() => setSearchOpen(false)} theme={theme} />
    </View>
  );
}
