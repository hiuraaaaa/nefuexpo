import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, FlatList, Dimensions, StyleSheet, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
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

const SKELETON_DATA  = [...Array(12)].map((_, i) => ({ id: `sk-${i}` }));
const COLUMN_WRAPPER = { gap: GAP, marginBottom: GAP };
const LIST_CONTENT   = { paddingHorizontal: H_PAD, paddingBottom: 120 };

let _lastNavTime = 0;
const NAV_DEBOUNCE_MS = 600;

// ─── AnimeItem ────────────────────────────────────────────────────────────────

const AnimeItem = React.memo(({ item, onPress }: { item: Anime | null; onPress: (a: Anime) => void }) => {
  const scale    = useSharedValue(1);
  const opacity  = useSharedValue(1);
  const firedRef = useRef(false);

  const animStyle = useAnimatedStyle(() => ({
    width: CARD_WIDTH,
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!item) return <View style={{ width: CARD_WIDTH }} />;

  const handlePressIn  = () => {
    scale.value   = withSpring(0.93, { damping: 15, stiffness: 300 });
    opacity.value = withTiming(0.7, { duration: 80 });
  };
  const handlePressOut = () => {
    scale.value   = withSpring(1, { damping: 12, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 150 });
  };
  const handlePress = () => {
    const now = Date.now();
    if (firedRef.current || now - _lastNavTime < NAV_DEBOUNCE_MS) return;
    firedRef.current = true;
    _lastNavTime = now;
    onPress(item);
    setTimeout(() => { firedRef.current = false; }, 1000);
  };

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <AnimeCard anime={item} />
      </TouchableOpacity>
    </Animated.View>
  );
});

const SkeletonItem = React.memo(() => (
  <View style={{ width: CARD_WIDTH }}>
    <CardSkeleton />
  </View>
));

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function OngoingScreen() {
  const router = useRouter();
  const { goToAnime } = useNavigateAnime();
  const theme  = useTheme();

  const [results, setResults]   = useState<Anime[]>([]);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    api.ongoing()
      .then(r => setResults(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const paddedResults = useMemo(() => {
    const rem = results.length % NUM_COLUMNS;
    if (rem === 0) return results;
    return [...results, ...Array(NUM_COLUMNS - rem).fill(null)];
  }, [results]);

  const handlePress = useCallback((item: Anime) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/watch/${getAnimeSlug(item)}`);
  }, [router]);

  const renderItem     = useCallback(({ item }: { item: Anime | null }) =>
    <AnimeItem item={item} onPress={handlePress} />, [handlePress]);

  const renderSkeleton = useCallback(() => <SkeletonItem />, []);

  const keyExtractor   = useCallback((item: any, i: number) =>
    item?.id ?? `empty-${i}`, []);

  return (
    <SafeAreaView style={[s.flex1, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={s.header}>
        <Text style={[s.title, { color: theme.text }]}>Ongoing</Text>
        <Text style={[s.subtitle, { color: theme.subtext }]}>
          Anime yang sedang tayang
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
          initialNumToRender={16}
          maxToRenderPerBatch={8}
          updateCellsBatchingPeriod={50}
          windowSize={7}
          removeClippedSubviews
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex1:   { flex: 1 },
  header:  { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title:   { fontWeight: '900', fontSize: 28, letterSpacing: -0.5 },
  subtitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginTop: 2 },
});
