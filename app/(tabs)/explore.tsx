import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, ScrollView, Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api, getAnimeSlug } from '@/hooks/api';
import { Anime, Genre } from '@/types';
import { CardSkeleton } from '@/components/Skeleton';
import { useTheme } from '@/hooks/theme';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import FastImage from 'react-native-fast-image';

const { width } = Dimensions.get('window');
const NUM_COLUMNS = 4;
const H_PAD = 12;
const GAP = 8;
const CARD_WIDTH = (width - H_PAD * 2 - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

// ── Card Item ─────────────────────────────────────────────────────────────────
const AnimeGridCard = React.memo(({ item, index, onPress, theme }: {
  item: Anime; index: number; onPress: () => void; theme: any;
}) => (
  <Animated.View
    entering={FadeInDown.delay(Math.min(index * 30, 300)).springify()}
    style={{ width: CARD_WIDTH }}
  >
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        borderRadius: 10, overflow: 'hidden',
        backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border,
      }}
    >
      <FastImage
        source={{ uri: item.image_poster, priority: FastImage.priority.normal }}
        style={{ width: '100%', aspectRatio: 3 / 4.2 }}
        resizeMode={FastImage.resizeMode.cover}
      />
      <View style={{ padding: 5 }}>
        <Text style={{ color: theme.text, fontSize: 9, fontWeight: '700', lineHeight: 13 }}
          numberOfLines={2}>
          {item.title}
        </Text>
        {item.type ? (
          <View style={{
            marginTop: 3, alignSelf: 'flex-start',
            backgroundColor: theme.accentDim, paddingHorizontal: 5,
            paddingVertical: 2, borderRadius: 3,
          }}>
            <Text style={{ color: theme.accent, fontSize: 7, fontWeight: '900' }}>
              {item.type}
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  </Animated.View>
));

// ── Pagination ────────────────────────────────────────────────────────────────
const Pagination = React.memo(({ page, hasResults, onPrev, onNext, theme }: {
  page: number; hasResults: boolean;
  onPrev: () => void; onNext: () => void; theme: any;
}) => (
  <View style={{
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 12, marginTop: 16, marginBottom: 16,
  }}>
    <TouchableOpacity
      onPress={onPrev}
      disabled={page === 0}
      style={{
        width: 44, height: 44, borderRadius: 12, alignItems: 'center',
        justifyContent: 'center', backgroundColor: theme.card,
        borderWidth: 1, borderColor: theme.border, opacity: page === 0 ? 0.3 : 1,
      }}
    >
      <Ionicons name="chevron-back" size={18} color={theme.text} />
    </TouchableOpacity>

    <View style={{
      paddingHorizontal: 20, height: 44, borderRadius: 12,
      backgroundColor: theme.accent, alignItems: 'center',
      justifyContent: 'center', minWidth: 44,
    }}>
      <Text style={{ color: '#000', fontWeight: '900', fontSize: 14 }}>{page + 1}</Text>
    </View>

    <TouchableOpacity
      onPress={onNext}
      disabled={!hasResults}
      style={{
        width: 44, height: 44, borderRadius: 12, alignItems: 'center',
        justifyContent: 'center', backgroundColor: theme.card,
        borderWidth: 1, borderColor: theme.border, opacity: !hasResults ? 0.3 : 1,
      }}
    >
      <Ionicons name="chevron-forward" size={18} color={theme.text} />
    </TouchableOpacity>
  </View>
));

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

  useEffect(() => {
    api.genre().then(r => setGenres(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => { setPage(0); }, [query, selectedGenres]);

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      setIsLoading(true);
      try {
        let res;
        if (query)                          res = await api.search(query, page);
        else if (selectedGenres.length > 0) res = await api.genreFilter(selectedGenres, page);
        else                                res = await api.popular(page);
        if (mounted) setResults(res.data || []);
      } catch { if (mounted) setResults([]); }
      if (mounted) setIsLoading(false);
    };
    fetch();
    return () => { mounted = false; };
  }, [page, query, selectedGenres]);

  const toggleGenre = useCallback((id: string) => {
    Haptics.selectionAsync();
    setSelectedGenres(p => p.includes(id) ? p.filter(g => g !== id) : [...p, id]);
  }, []);

  const handlePrev = useCallback(() => {
    Haptics.selectionAsync();
    setPage(p => Math.max(0, p - 1));
  }, []);

  const handleNext = useCallback(() => {
    Haptics.selectionAsync();
    setPage(p => p + 1);
  }, []);

  const renderItem = useCallback(({ item, index }: { item: Anime; index: number }) => (
    <AnimeGridCard
      item={item}
      index={index}
      theme={theme}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/watch/${getAnimeSlug(item)}`);
      }}
    />
  ), [theme, router]);

  // Pad buat fill row terakhir
  const paddedResults = results.length % NUM_COLUMNS === 0
    ? results
    : [...results, ...Array(NUM_COLUMNS - (results.length % NUM_COLUMNS)).fill(null)];

  const renderPadded = useCallback(({ item, index }: { item: Anime | null; index: number }) => {
    if (!item) return <View style={{ width: CARD_WIDTH }} />;
    return renderItem({ item, index });
  }, [renderItem]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>

      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
        <Text style={{ color: theme.text, fontWeight: '900', fontSize: 28, letterSpacing: -0.5 }}>
          Explore
        </Text>
        <Text style={{
          color: theme.subtext, fontSize: 11, fontWeight: '700',
          textTransform: 'uppercase', letterSpacing: 2, marginTop: 2,
        }}>
          Temukan anime favoritmu
        </Text>
      </View>

      {/* Search bar */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: theme.card, borderRadius: 14,
          paddingHorizontal: 14, paddingVertical: 11,
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
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={theme.subtext} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Genre chips */}
      {!query && genres.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 4 }}
          style={{ maxHeight: 44, marginBottom: 8 }}
        >
          {genres.map(g => {
            const active = selectedGenres.includes(g.id);
            return (
              <TouchableOpacity
                key={g.id}
                onPress={() => toggleGenre(g.id)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
                  backgroundColor: active ? theme.accent : theme.card,
                  borderWidth: 1, borderColor: active ? theme.accent : theme.border,
                }}
              >
                <Text style={{ color: active ? '#000' : theme.subtext, fontSize: 10, fontWeight: '700' }}>
                  {g.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Query label */}
      {query.length > 0 && (
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '700',
            letterSpacing: 1, textTransform: 'uppercase' }}>Hasil untuk</Text>
          <Text style={{ color: theme.accent, fontSize: 20, fontWeight: '900',
            letterSpacing: -0.5 }} numberOfLines={1}>"{query}"</Text>
        </View>
      )}

      {/* Content */}
      {isLoading ? (
        <FlatList
          data={[...Array(12)]}
          keyExtractor={(_, i) => String(i)}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={{ paddingHorizontal: H_PAD, paddingBottom: 100 }}
          columnWrapperStyle={{ gap: GAP, marginBottom: GAP }}
          renderItem={() => <View style={{ width: CARD_WIDTH }}><CardSkeleton /></View>}
          scrollEnabled={false}
        />
      ) : results.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Ionicons name="search-outline" size={56} color={theme.subtext} />
          <Text style={{ color: theme.subtext, fontWeight: '700', fontSize: 13,
            textTransform: 'uppercase', letterSpacing: 2 }}>Tidak ditemukan</Text>
        </View>
      ) : (
        <FlatList
          data={paddedResults}
          keyExtractor={(item, i) => item?.id ?? `empty-${i}`}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={{ paddingHorizontal: H_PAD, paddingBottom: 100 }}
          columnWrapperStyle={{ gap: GAP, marginBottom: GAP }}
          renderItem={renderPadded}
          removeClippedSubviews={true}
          maxToRenderPerBatch={12}
          windowSize={5}
          initialNumToRender={12}
          ListFooterComponent={
            <Pagination
              page={page}
              hasResults={results.length > 0}
              onPrev={handlePrev}
              onNext={handleNext}
              theme={theme}
            />
          }
        />
      )}

    </SafeAreaView>
  );
}
