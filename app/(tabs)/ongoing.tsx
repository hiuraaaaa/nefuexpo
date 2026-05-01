import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants';
import { api, getAnimeSlug } from '@/hooks/api';
import { Anime } from '@/types';
import AnimeCard from '@/components/AnimeCard';
import { CardSkeleton } from '@/components/Skeleton';

export default function OngoingScreen() {
  const router = useRouter();
  const [results, setResults] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.ongoing().then(r => setResults(r.data || [])).catch(() => {}).finally(() => setIsLoading(false));
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={['top']}>
      <View className="px-4 pt-4 pb-3">
        <Text className="text-white font-black text-lg uppercase tracking-tight">Ongoing Anime</Text>
        <Text className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">Anime yang sedang tayang saat ini</Text>
      </View>

      {isLoading ? (
        <FlatList
          data={[...Array(12)]}
          keyExtractor={(_, i) => String(i)}
          numColumns={3}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 100 }}
          columnWrapperStyle={{ gap: 8, marginBottom: 12 }}
          renderItem={() => <View style={{ flex: 1 }}><CardSkeleton /></View>}
          scrollEnabled={false}
        />
      ) : (
        <FlatList
          data={results}
          keyExtractor={i => i.id}
          numColumns={3}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 100 }}
          columnWrapperStyle={{ gap: 8, marginBottom: 12 }}
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <AnimeCard
                anime={item}
                onPress={() => router.push(`/watch/${getAnimeSlug(item)}`)}
              />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
