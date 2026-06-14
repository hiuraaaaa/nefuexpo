import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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

  const ListHeader = (
    <View>
      {!query && (
        <GenreFilter
          genres={genres}
          selectedGenres={selectedGenres}
          onToggle={toggleGenre}
          onClearAll={clearGenres}
          theme={theme}
        />
      )}

      {query.length > 0 && (
        <View style={{ marginBottom: 14 }}>
          <Text style={{
            color: theme.subtext, fontSize: 10, fontWeight: '700',
            letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2,
          }}>Hasil untuk</Text>
          <Text style={{
            color: theme.accent, fontSize: 22, fontWeight: '900', letterSpacing: -0.5,
          }} numberOfLines={1}>"{query}"</Text>
        </View>
      )}

      {!query && selectedGenres.length === 0 && (
        <View style={{ marginBottom: 10 }}>
          <Text style={{
            color: theme.subtext, fontSize: 10, fontWeight: '800',
            letterSpacing: 1.5, textTransform: 'uppercase',
          }}>Semua Anime</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
        <Text style={{ color: theme.text, fontWeight: '900', fontSize: 28, letterSpacing: -0.5 }}>
          Explore
        </Text>
      </View>

      {/* Search bar */}
      <SearchBar
        value={query}
        onChangeText={handleQueryChange}
        onClear={clearQuery}
        theme={theme}
      />

      {/* Loading skeleton */}
      {isLoading ? (
        <FlatList
          data={[...Array(8)]}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          renderItem={() => <ListCardSkeleton theme={theme} />}
          scrollEnabled={false}
          ListHeaderComponent={ListHeader}
        />

      /* Empty state */
      ) : results.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 80 }}>
          <Ionicons name="search-outline" size={56} color={theme.subtext} />
          <Text style={{
            color: theme.subtext, fontWeight: '700', fontSize: 13,
            textTransform: 'uppercase', letterSpacing: 2,
          }}>Tidak ditemukan</Text>
          {query.length > 0 && (
            <TouchableOpacity
              onPress={clearQuery}
              style={{
                paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10,
                backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border,
              }}
            >
              <Text style={{ color: theme.accent, fontWeight: '700', fontSize: 12 }}>Hapus Pencarian</Text>
            </TouchableOpacity>
          )}
        </View>

      /* Results list */
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
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

