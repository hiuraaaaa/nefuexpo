import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, Dimensions, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, getAnimeSlug } from '@/hooks/api/api';
import { useTheme } from '@/hooks/theme';
import { Anime } from '@/types';
import AnimeCard from '@/components/AnimeCard';
import { CardSkeleton } from '@/components/Skeleton';

const { width } = Dimensions.get('window');
const NUM_COLUMNS = 4;
const H_PAD       = 12;
const GAP         = 8;
const CARD_WIDTH  = (width - H_PAD * 2 - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

const SKELETON_DATA = [...Array(12)].map((_, i) => ({ id: `skeleton-${i}` }));
const COLUMN_WRAPPER = { gap: GAP, marginBottom: GAP };
const LIST_CONTENT   = { paddingHorizontal: H_PAD, paddingBottom: 100 };

const s = StyleSheet.create({
  flex1:     { flex: 1 },
  header:    { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title:     { fontWeight: '900', fontSize: 28, letterSpacing: -0.5 },
  subtitle:  { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginTop: 2 },
  cardWrap:  { width: CARD_WIDTH },
});

// ─── SkeletonItem ─────────────────────────────────────────────────────────────

const SkeletonItem = React.memo(() => (
  <View style={s.cardWrap}>
    <CardSkeleton />
  </View>
));

// ─── AnimeItem ────────────────────────────────────────────────────────────────

type AnimeItemProps = {
  item: Anime | null;
  onPress: (item: Anime) => void;
};

const AnimeItem = React.memo(({ item, onPress }: AnimeItemProps) => {
  if (!item) return <View style={s.cardWrap} />;
  return (
    <View style={s.cardWrap}>
      <AnimeCard anime={item} onPress={() => onPress(item)} />
    </View>
  );
});

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function OngoingScreen() {
  const router = useRouter();
  const theme  = useTheme();

  const [results, setResults]     = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.ongoing()
      .then(r => setResults(r.data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  // Pad biar baris terakhir ga ngembang
  const paddedResults = useMemo(() => {
    const padded = [...results];
    while (padded.length % NUM_COLUMNS !== 0) padded.push(null as any);
    return padded;
  }, [results]);

  const handlePress = useCallback((item: Anime) => {
    router.push(`/watch/${getAnimeSlug(item)}`);
  }, [router]);

  const renderSkeleton = useCallback(() => <SkeletonItem />, []);

  const renderItem = useCallback(({ item }: { item: Anime | null }) => (
    <AnimeItem item={item} onPress={handlePress} />
  ), [handlePress]);

  const keyExtractor = useCallback((item: any, i: number) =>
    item?.id ?? `empty-${i}`, []);

  return (
    <SafeAreaView style={[s.flex1, { backgroundColor: theme.bg }]} edges={['top']}>

      {/* Header */}
      <View style={s.header}>
        <Text style={[s.title, { color: theme.text }]}>Ongoing</Text>
        <Text style={[s.subtitle, { color: theme.subtext }]}>
          Anime yang sedang tayang saat ini
        </Text>
      </View>

      {isLoading ? (
        <FlatList
          data={SKELETON_DATA}
          keyExtractor={keyExtractor}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={LIST_CONTENT}
          columnWrapperStyle={COLUMN_WRAPPER}
          renderItem={renderSkeleton}
          scrollEnabled={false}
        />
      ) : (
        <FlatList
          data={paddedResults}
          keyExtractor={keyExtractor}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={LIST_CONTENT}
          columnWrapperStyle={COLUMN_WRAPPER}
          renderItem={renderItem}
          initialNumToRender={12}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews={true}
        />
      )}

    </SafeAreaView>
  );
}
