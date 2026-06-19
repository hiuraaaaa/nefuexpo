// features/explore/index.tsx
import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/theme';
import { Anime } from '@/types';
import { useNavigateAnime } from '@/hooks/useNavigateAnime';

import { useExplore } from './hooks/useExplore';
import SearchBar from './components/SearchBar';
import GenreFilter from './components/GenreFilter';
import AnimeListCard from './components/AnimeListCard';
import ListCardSkeleton from './components/ListCardSkeleton';
import LoadMoreFooter from './components/LoadMoreFooter';

export default function ExploreScreen() {
  const params = useLocalSearchParams<{ q?: string }>();
  const router = useRouter();
  const { goToAnime } = useNavigateAnime();
  const theme  = useTheme();

  const {
    query, genres, selectedGenres, results,
    isLoading, loadingMore, hasMore,
    handleQueryChange, clearQuery,
    toggleGenre, clearGenres, handleLoadMore,
    getSlug,
  } = useExplore(params.q || '');

  const renderItem = useCallback(({ item, index }: { item: Anime; index: number }) => (
    <AnimeListCard
      item={item}
      index={index}
      theme={theme}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/watch/${getSlug(item)}`);
      }}
    />
  ), [theme, router]);

  // ── Header editorial ──────────────────────────────────────────────────────
  const ListHeader = (
    <View style={{ marginBottom: 18, marginTop: 4 }}>
      {!query && (
        <GenreFilter
          genres={genres}
          selectedGenres={selectedGenres}
          onToggle={toggleGenre}
          onClearAll={clearGenres}
          theme={theme}
        />
      )}

      {/* Context label — query atau genre atau default */}
      {query.length > 0 ? (
        <View style={{ paddingHorizontal: 22 }}>
          <Text style={{
            color: theme.subtext, fontSize: 9, fontWeight: '800',
            letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 3,
          }}>Hasil untuk</Text>
          <Text style={{
            color: theme.accent, fontSize: 24, fontWeight: '900',
            letterSpacing: -0.8, fontStyle: 'italic',
          }} numberOfLines={1}>
            {query}
          </Text>
        </View>
      ) : selectedGenres.length > 0 ? (
        <View style={{ paddingHorizontal: 22 }}>
          <Text style={{
            color: theme.subtext, fontSize: 9, fontWeight: '800',
            letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 3,
          }}>Genre</Text>
          <Text style={{
            color: theme.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.5,
          }}>
            {selectedGenres.join(' + ')}
          </Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 22 }}>
          <Text style={{
            color: theme.subtext, fontSize: 9, fontWeight: '800',
            letterSpacing: 2.5, textTransform: 'uppercase',
          }}>Semua Anime</Text>
        </View>
      )}
    </View>
  );

  // ── Empty state — typographic, bukan icon centered ────────────────────────
  const EmptyState = (
    <View style={{ flex: 1, paddingHorizontal: 22, paddingTop: 48 }}>
      <Text style={{
        color: `${theme.accent}25`,
        fontSize: 96,
        fontWeight: '900',
        fontStyle: 'italic',
        letterSpacing: -4,
        lineHeight: 96,
      }}>0</Text>
      <Text style={{
        color: theme.subtext,
        fontSize: 14,
        fontWeight: '700',
        marginTop: 12,
        letterSpacing: 0.2,
      }}>
        Tidak ada hasil
      </Text>
      <Text style={{
        color: `${theme.subtext}70`,
        fontSize: 12,
        fontWeight: '500',
        marginTop: 4,
        lineHeight: 18,
      }}>
        {query.length > 0
          ? `Coba kata kunci lain untuk "${query}"`
          : 'Belum ada anime yang tersedia'}
      </Text>
      {query.length > 0 && (
        <TouchableOpacity
          onPress={clearQuery}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ marginTop: 20, alignSelf: 'flex-start' }}
        >
          <Text style={{ color: theme.accent, fontWeight: '800', fontSize: 13 }}>
            ← Hapus pencarian
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>

      {/* ── Header + Search (menyatu — judul "Anime" ADALAH input search) ── */}
      <SearchBar
        value={query}
        onChangeText={handleQueryChange}
        onClear={clearQuery}
        theme={theme}
      />

      {/* ── Loading skeleton ── */}
      {isLoading ? (
        <FlatList
          data={[...Array(8)]}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 100 }}
          renderItem={() => <ListCardSkeleton theme={theme} />}
          scrollEnabled={false}
          ListHeaderComponent={ListHeader}
        />

      /* ── Empty state ── */
      ) : results.length === 0 ? (
        EmptyState

      /* ── Results ── */
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 120 }}
          renderItem={renderItem}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={10}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={
            <LoadMoreFooter
              loading={loadingMore}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
              theme={theme}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
