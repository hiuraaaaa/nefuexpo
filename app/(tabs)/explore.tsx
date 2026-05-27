import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, ScrollView, Dimensions, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api, getAnimeSlug } from '@/hooks/api';
import { Anime, Genre } from '@/types';
import { CardSkeleton } from '@/components/Skeleton';
import { useTheme } from '@/hooks/theme';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import FastImage from 'react-native-fast-image';

const { width } = Dimensions.get('window');
const NUM_COLUMNS = 3;
const H_PAD = 12;
const GAP = 8;
const CARD_WIDTH = (width - H_PAD * 2 - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

const AnimeGridCard = React.memo(({ item, index, onPress, theme }: {
  item: Anime; index: number; onPress: () => void; theme: any;
}) => (
  <Animated.View
    entering={FadeInDown.delay(Math.min(index * 25, 250)).springify()}
    style={{ width: CARD_WIDTH }}
  >
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      style={{
        borderRadius: 12, overflow: 'hidden',
        backgroundColor: theme.card,
        borderWidth: 1, borderColor: theme.border,
      }}
    >
      <FastImage
        source={{ uri: item.image_poster, priority: FastImage.priority.normal }}
        style={{ width: '100%', aspectRatio: 2 / 3 }}
        resizeMode={FastImage.resizeMode.cover}
      />
      <View style={{ padding: 7 }}>
        <Text style={{ color: theme.text, fontSize: 10, fontWeight: '700', lineHeight: 14 }}
          numberOfLines={2}>
          {item.title}
        </Text>
        {item.type ? (
          <View style={{
            marginTop: 4, alignSelf: 'flex-start',
            backgroundColor: theme.accentDim, paddingHorizontal: 6,
            paddingVertical: 2, borderRadius: 4,
          }}>
            <Text style={{ color: theme.accent, fontSize: 8, fontWeight: '900' }}>
              {item.type}
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  </Animated.View>
));

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
        marginHorizontal: 16, marginVertical: 16,
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
        if (query)                          res = await api.searchLocal(query);
        else if (selectedGenres.length > 0) res = await api.genreFilter(selectedGenres, page);
        else                                res = await api.animeList(page);

        const newData: Anime[] = res.data || [];
        if (mounted) {
          if (page === 0) setResults(newData);
          else setResults(prev => [...prev, ...newData]);
          // Search local return semua sekaligus, ga perlu load more
          if (query) setHasMore(false);
          else setHasMore(newData.length >= 12);
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

  const renderItem = useCallback(({ item, index }: { item: Anime | null; index: number }) => {
    if (!item) return <View style={{ width: CARD_WIDTH }} />;
    return (
      <AnimeGridCard
        item={item}
        index={index}
        theme={theme}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(`/watch/${getAnimeSlug(item)}`);
        }}
      />
    );
  }, [theme, router]);

  const paddedResults = results.length % NUM_COLUMNS === 0
    ? results
    : [...results, ...Array(NUM_COLUMNS - (results.length % NUM_COLUMNS)).fill(null)];

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
        <View style={{ paddingHorizontal: 16, marginBottom: 14 }}>
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
        <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
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
          data={[...Array(12)]}
          keyExtractor={(_, i) => String(i)}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={{ paddingHorizontal: H_PAD, paddingBottom: 100 }}
          columnWrapperStyle={{ gap: GAP, marginBottom: GAP }}
          renderItem={() => <View style={{ width: CARD_WIDTH }}><CardSkeleton /></View>}
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
          data={paddedResults as (Anime | null)[]}
          keyExtractor={(item, i) => item?.id ?? `empty-${i}`}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={{ paddingHorizontal: H_PAD, paddingBottom: 120 }}
          columnWrapperStyle={{ gap: GAP, marginBottom: GAP }}
          renderItem={renderItem}
          removeClippedSubviews
          maxToRenderPerBatch={12}
          windowSize={5}
          initialNumToRender={12}
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
