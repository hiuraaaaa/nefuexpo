import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants';
import { api, getAnimeSlug } from '@/hooks/api';
import { Anime, Genre } from '@/types';
import AnimeCard from '@/components/AnimeCard';
import { CardSkeleton } from '@/components/Skeleton';

export default function ExploreScreen() {
  const params = useLocalSearchParams<{ q?: string }>();
  const router = useRouter();
  const [query, setQuery] = useState(params.q || '');
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [results, setResults] = useState<Anime[]>([]);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

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
        if (query) res = await api.search(query, page);
        else if (selectedGenres.length > 0) res = await api.genreFilter(selectedGenres, page);
        else res = await api.popular(page);
        if (mounted) setResults(res.data || []);
      } catch { if (mounted) setResults([]); }
      if (mounted) setIsLoading(false);
    };
    fetch();
    return () => { mounted = false; };
  }, [page, query, selectedGenres]);

  const toggleGenre = (id: string) =>
    setSelectedGenres(p => p.includes(id) ? p.filter(g => g !== id) : [...p, id]);

  const numColumns = 3;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={['top']}>
      {/* Search bar */}
      <View className="px-4 pt-4 pb-3">
        <View className="flex-row items-center bg-card rounded-2xl px-4 py-3 border border-white/5">
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            className="flex-1 text-white font-bold text-sm"
            placeholder="Cari anime..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={query}
            onChangeText={t => { setQuery(t); setSelectedGenres([]); }}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text className="text-white/40 text-lg">✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Genre filter chips */}
      {!query && genres.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 mb-3" style={{ maxHeight: 44 }}>
          {genres.map(g => (
            <TouchableOpacity
              key={g.id}
              onPress={() => toggleGenre(g.id)}
              className="mr-2 px-4 py-2 rounded-xl"
              style={{
                backgroundColor: selectedGenres.includes(g.id) ? COLORS.gold : 'rgba(255,255,255,0.05)',
                borderWidth: 1,
                borderColor: selectedGenres.includes(g.id) ? COLORS.gold : 'rgba(255,255,255,0.1)',
              }}>
              <Text style={{
                color: selectedGenres.includes(g.id) ? '#000' : 'rgba(255,255,255,0.5)',
                fontSize: 10, fontWeight: '700',
              }}>{g.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {query.length > 0 && (
        <View className="px-4 mb-3">
          <Text className="text-white/40 text-xs font-bold uppercase tracking-widest">Hasil untuk:</Text>
          <Text className="font-black text-xl uppercase tracking-tighter" style={{ color: COLORS.gold }}>"{query}"</Text>
        </View>
      )}

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
      ) : results.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-white/20 font-bold uppercase tracking-widest text-sm">Tidak ditemukan</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={i => i.id}
          numColumns={numColumns}
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
          ListFooterComponent={() => (
            <View className="flex-row justify-center gap-4 mt-4 mb-4">
              <TouchableOpacity
                onPress={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-6 py-3 rounded-xl"
                style={{ backgroundColor: COLORS.card, opacity: page === 0 ? 0.3 : 1 }}>
                <Text className="text-white font-black">‹ Prev</Text>
              </TouchableOpacity>
              <View className="px-4 py-3 rounded-xl items-center justify-center" style={{ backgroundColor: COLORS.gold }}>
                <Text className="text-black font-black">{page + 1}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setPage(p => p + 1)}
                disabled={results.length === 0}
                className="px-6 py-3 rounded-xl"
                style={{ backgroundColor: COLORS.card }}>
                <Text className="text-white font-black">Next ›</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
