import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, getAnimeSlug } from '@/hooks/api';
import { useTheme } from '@/hooks/theme';
import { Anime } from '@/types';
import AnimeCard from '@/components/AnimeCard';
import { CardSkeleton } from '@/components/Skeleton';

const { width } = Dimensions.get('window');
const NUM_COLUMNS = 4;
const H_PAD = 12;
const GAP = 8;
const CARD_WIDTH = (width - H_PAD * 2 - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

export default function OngoingScreen() {
  const router = useRouter();
  const theme  = useTheme();
  const [results, setResults] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.ongoing()
      .then(r => setResults(r.data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  // Pad biar baris terakhir ga ngembang
  const paddedResults = [...results];
  while (paddedResults.length % NUM_COLUMNS !== 0) paddedResults.push(null as any);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>

      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
        <Text style={{ color: theme.text, fontWeight: '900', fontSize: 28,
          letterSpacing: -0.5 }}>Ongoing</Text>
        <Text style={{ color: theme.subtext, fontSize: 11, fontWeight: '700',
          textTransform: 'uppercase', letterSpacing: 2, marginTop: 2 }}>
          Anime yang sedang tayang saat ini
        </Text>
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
        />
      ) : (
        <FlatList
          data={paddedResults}
          keyExtractor={(item, i) => item?.id ?? `empty-${i}`}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={{ paddingHorizontal: H_PAD, paddingBottom: 100 }}
          columnWrapperStyle={{ gap: GAP, marginBottom: GAP }}
          renderItem={({ item }) => {
            if (!item) return <View style={{ width: CARD_WIDTH }} />;
            return (
              <View style={{ width: CARD_WIDTH }}>
                <AnimeCard
                  anime={item}
                  onPress={() => router.push(`/watch/${getAnimeSlug(item)}`)}
                />
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
