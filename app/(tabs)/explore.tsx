import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, ScrollView, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api, getAnimeSlug } from '@/hooks/api/api';
import { Anime, Genre } from '@/types';
import { useTheme } from '@/hooks/theme';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';

// ── List Card (horizontal, detail lengkap) ────────────────────────────────────
const AnimeListCard = React.memo(({ item, index, onPress, theme }: {
  item: Anime; index: number; onPress: () => void; theme: any;
}) => {
  const genres = item.genre
    ? item.genre.split(',').map(g => g.trim()).filter(Boolean)
    : [];
  const visibleGenres = genres.slice(0, 3);
  const extraGenres   = genres.length - visibleGenres.length;

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index * 30, 300)).springify()}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.82}
        style={{
          flexDirection: 'row',
          backgroundColor: theme.card,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: theme.border,
          overflow: 'hidden',
          marginBottom: 10,
        }}
      >
        {/* Poster */}
        <Image
          source={{ uri: item.image_poster, priority: 'normal' }}
          style={{ width: 100, aspectRatio: 2 / 3 }}
          contentFit="cover"
        />

        {/* Detail */}
        <View style={{ flex: 1, padding: 10, justifyContent: 'space-between' }}>

          {/* Baris atas: eps + status + tanggal */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {item.total_episode != null && (
                <View style={{
                  backgroundColor: theme.accentDim, borderRadius: 6,
                  paddingHorizontal: 6, paddingVertical: 2,
                }}>
                  <Text style={{ color: theme.accent, fontSize: 9, fontWeight: '800' }}>
                    {item.total_episode} Eps
                  </Text>
                </View>
              )}
              {item.status ? (
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 6,
                  paddingHorizontal: 6, paddingVertical: 2,
                }}>
                  <Text style={{ color: theme.subtext, fontSize: 9, fontWeight: '700' }}>
                    {item.status}
                  </Text>
                </View>
              ) : null}
            </View>
            {item.year ? (
              <Text style={{ color: theme.subtext, fontSize: 9, fontWeight: '600' }}>
                {item.year}
              </Text>
            ) : null}
          </View>

          {/* Judul */}
          <Text
            style={{ color: theme.text, fontSize: 13, fontWeight: '800', lineHeight: 18, marginBottom: 4 }}
            numberOfLines={2}
          >
            {item.title}
          </Text>

          {/* Genre tags */}
          {genres.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 5 }}>
              {visibleGenres.map(g => (
                <View key={g} style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2,
                  borderWidth: 1, borderColor: theme.border,
                }}>
                  <Text style={{ color: theme.subtext, fontSize: 8, fontWeight: '700' }}>{g}</Text>
                </View>
              ))}
              {extraGenres > 0 && (
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2,
                  borderWidth: 1, borderColor: theme.border,
                }}>
                  <Text style={{ color: theme.subtext, fontSize: 8, fontWeight: '700' }}>+{extraGenres}</Text>
                </View>
              )}
            </View>
          )}

          {/* Studio + score */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {item.studio ? (
              <Text style={{ color: theme.subtext, fontSize: 9, fontWeight: '600', flex: 1 }} numberOfLines={1}>
                {item.studio}
              </Text>
            ) : null}
            {item.score != null && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Ionicons name="star" size={9} color={theme.accent} />
                <Text style={{ color: theme.accent, fontSize: 9, fontWeight: '800' }}>
                  {item.score}
                </Text>
              </View>
            )}
          </View>

          {/* Synopsis preview */}
          {item.synopsis ? (
            <Text
              style={{ color: theme.subtext, fontSize: 10, lineHeight: 14, marginTop: 5 }}
              numberOfLines={3}
            >
              {item.synopsis}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ── Load More Footer ──────────────────────────────────────────────────────────
const LoadMoreFooter = ({ loading, onLoadMore, hasMore, theme }: {
  loading: boolean; onLoadMore: () => void; hasMore: boolean; theme: any;
}) => {
  if (!hasMore) return (
    <View style={{ paddingVertical: 32, alignItems: 'center' }}>
      <Text style={{ color: theme.subtext, fontSize: 11, fontWeight: '600' }}>
        Semua anime sudah ditampilkan
      </Text>
    </View>
  );
  return (
    <TouchableOpacity
      onPress={onLoadMore}
      disabled={loading}
      style={{
        marginVertical: 16,
        paddingVertical: 14, borderRadius: 12,
        backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border,
        alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
      }}
    >
      {loading
        ? <ActivityIndicator size="small" color={theme.accent} />
        : <>
            <Ionicons name="add-circle-outline" size={18} color={theme.accent} />
            <Text style={{ color: theme.accent, fontWeight: '800', fontSize: 13 }}>
              Muat Lebih Banyak
            </Text>
          </>
      }
    </TouchableOpacity>
  );
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
const ListCardSkeleton = ({ theme }: { theme: any }) => (
  <View style={{
    flexDirection: 'row', backgroundColor: theme.card,
    borderRadius: 14, borderWidth: 1, borderColor: theme.border,
    overflow: 'hidden', marginBottom: 10, height: 130,
  }}>
    <View style={{ width: 100, backgroundColor: theme.border }} />
    <View style={{ flex: 1, padding: 10, gap: 8 }}>
      <View style={{ height: 10, width: '60%', backgroundColor: theme.border, borderRadius: 6 }} />
      <View style={{ height: 14, width: '90%', backgroundColor: theme.border, borderRadius: 6 }} />
      <View style={{ height: 14, width: '70%', backgroundColor: theme.border, borderRadius: 6 }} />
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[40, 50, 35].map((w, i) => (
          <View key={i} style={{ height: 16, width: w, backgroundColor: theme.border, borderRadius: 5 }} />
        ))}
      </View>
      <View style={{ height: 10, width: '80%', backgroundColor: theme.border, borderRadius: 6 }} />
    </View>
  </View>
);

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ExploreScreen() {
  const params = useLocalSearchParams<{ q?: string }>();
  const router = useRouter();
  const theme  = useTheme();

  const [query, setQuery]                   = useState(params.q || '');
  const [genres, setGenres]                 = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [results, setResults]               = useState<Anime[]>([]);
  const [page, setPage]                     = useState(0);
  const [isLoading, setIsLoading]           = useState(true);
  const [loadingMore, setLoadingMore]       = useState(false);
  const [hasMore, setHasMore]               = useState(true);
  const isFetching = useRef(false);

  useEffect(() => {
    api.genre().then(r => setGenres(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setPage(0);
    setResults([]);
    setHasMore(true);
  }, [query, selectedGenres]);

  useEffect(() => {
    if (isFetching.current) return;
    let mounted = true;
    isFetching.current = true;

    const doFetch = async () => {
      if (page === 0) setIsLoading(true);
      else setLoadingMore(true);

      try {
        let res;
        if (query)                          res = await api.search(query, page);
        else if (selectedGenres.length > 0) res = await api.genreFilter(selectedGenres, page);
        else                                res = await api.animeList(page);

        const newData: Anime[] = res.data || [];
        if (mounted) {
          if (page === 0) setResults(newData);
          else setResults(prev => [...prev, ...newData]);
          setHasMore(newData.length >= 12);
        }
      } catch {
        if (mounted) {
          if (page === 0) setResults([]);
          setHasMore(false);
        }
      }

      if (mounted) {
        setIsLoading(false);
        setLoadingMore(false);
      }
      isFetching.current = false;
    };

    doFetch();
    return () => { mounted = false; };
  }, [page, query, selectedGenres]);

  const toggleGenre = useCallback((id: string) => {
    Haptics.selectionAsync();
    setSelectedGenres(p => p.includes(id) ? p.filter(g => g !== id) : [...p, id]);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && !isFetching.current) {
      Haptics.selectionAsync();
      setPage(p => p + 1);
    }
  }, [loadingMore, hasMore]);

  const clearQuery = useCallback(() => {
    setQuery('');
    setSelectedGenres([]);
  }, []);

  const renderItem = useCallback(({ item, index }: { item: Anime; index: number }) => (
    <AnimeListCard
      item={item}
      index={index}
      theme={theme}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/watch/${getAnimeSlug(item)}`);
      }}
    />
  ), [theme, router]);

  const ListHeader = (
    <View>
      {!query && genres.length > 0 && (
        <Animated.View entering={FadeIn.duration(300)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 12 }}
          >
            <TouchableOpacity
              onPress={() => { Haptics.selectionAsync(); setSelectedGenres([]); }}
              style={{
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                backgroundColor: selectedGenres.length === 0 ? theme.accent : theme.card,
                borderWidth: 1,
                borderColor: selectedGenres.length === 0 ? theme.accent : theme.border,
              }}
            >
              <Text style={{
                color: selectedGenres.length === 0 ? theme.bg : theme.subtext,
                fontSize: 11, fontWeight: '800',
              }}>Semua</Text>
            </TouchableOpacity>
            {genres.map(g => {
              const active = selectedGenres.includes(g.id);
              return (
                <TouchableOpacity
                  key={g.id}
                  onPress={() => toggleGenre(g.id)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                    backgroundColor: active ? theme.accent : theme.card,
                    borderWidth: 1, borderColor: active ? theme.accent : theme.border,
                  }}
                >
                  <Text style={{
                    color: active ? theme.bg : theme.subtext,
                    fontSize: 11, fontWeight: '800',
                  }}>{g.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>
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
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
        <Text style={{ color: theme.text, fontWeight: '900', fontSize: 28, letterSpacing: -0.5 }}>
          Explore
        </Text>
      </View>

      <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: theme.card, borderRadius: 16,
          paddingHorizontal: 14, paddingVertical: 12,
          borderWidth: 1, borderColor: theme.border, gap: 10,
        }}>
          <Ionicons name="search-outline" size={18} color={theme.accent} />
          <TextInput
            style={{ flex: 1, color: theme.text, fontWeight: '600', fontSize: 14, paddingVertical: 0 }}
            placeholder="Cari anime..."
            placeholderTextColor={theme.subtext}
            value={query}
            onChangeText={t => { setQuery(t); setSelectedGenres([]); }}
            returnKeyType="search"
            selectionColor={theme.accent}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearQuery} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={20} color={theme.subtext} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <FlatList
          data={[...Array(8)]}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          renderItem={() => <ListCardSkeleton theme={theme} />}
          scrollEnabled={false}
          ListHeaderComponent={ListHeader}
        />
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
              <Text style={{ color: theme.accent, fontWeight: '700', fontSize: 12 }}>
                Hapus Pencarian
              </Text>
            </TouchableOpacity>
          )}
        </View>
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
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              theme={theme}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
