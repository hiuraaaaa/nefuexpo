import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import { api, getAnimeSlug } from '@/hooks/api';
import { Anime, Genre } from '@/types';
import AnimeCard from '@/components/AnimeCard';
import { CardSkeleton } from '@/components/Skeleton';

const NUM_COLUMNS = 3;
const H_PAD = 12;
const GAP = 8;

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

  const cardWidth = `${(100 - ((NUM_COLUMNS - 1) * GAP * 100 / (375 - H_PAD * 2))) / NUM_COLUMNS}%`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={['top']}>

      {/* ── Search bar ── */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: COLORS.card, borderRadius: 14,
          paddingHorizontal: 14, paddingVertical: 11,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
          gap: 10,
        }}>
          <Ionicons name="search-outline" size={18} color={COLORS.gold} />
          <TextInput
            style={{ flex: 1, color: '#fff', fontWeight: '600', fontSize: 14, paddingVertical: 0 }}
            placeholder="Cari anime..."
            placeholderTextColor="rgba(255,255,255,0.25)"
            value={query}
            onChangeText={t => { setQuery(t); setSelectedGenres([]); }}
            returnKeyType="search"
            selectionColor={COLORS.gold}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Genre chips ── */}
      {!query && genres.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          style={{ maxHeight: 44, marginBottom: 12 }}
        >
          {genres.map(g => {
            const active = selectedGenres.includes(g.id);
            return (
              <TouchableOpacity
                key={g.id}
                onPress={() => toggleGenre(g.id)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
                  backgroundColor: active ? COLORS.gold : 'rgba(255,255,255,0.05)',
                  borderWidth: 1,
                  borderColor: active ? COLORS.gold : 'rgba(255,255,255,0.08)',
                }}
              >
                <Text style={{
                  color: active ? '#000' : 'rgba(255,255,255,0.5)',
                  fontSize: 10, fontWeight: '700',
                }}>{g.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* ── Query label ── */}
      {query.length > 0 && (
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>
            Hasil untuk
          </Text>
          <Text style={{ color: COLORS.gold, fontSize: 20, fontWeight: '900', letterSpacing: -0.5 }} numberOfLines={1}>
            "{query}"
          </Text>
        </View>
      )}

      {/* ── Content ── */}
      {isLoading ? (
        <FlatList
          data={[...Array(12)]}
          keyExtractor={(_, i) => String(i)}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={{ paddingHorizontal: H_PAD, paddingBottom: 100 }}
          columnWrapperStyle={{ gap: GAP, marginBottom: GAP }}
          renderItem={() => <View style={{ flex: 1 }}><CardSkeleton /></View>}
          scrollEnabled={false}
        />
      ) : results.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Ionicons name="search-outline" size={40} color="rgba(255,255,255,0.08)" />
          <Text style={{ color: 'rgba(255,255,255,0.2)', fontWeight: '700', fontSize: 13 }}>
            Tidak ditemukan
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={i => i.id}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={{ paddingHorizontal: H_PAD, paddingBottom: 100 }}
          columnWrapperStyle={{ gap: GAP, marginBottom: GAP }}
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <AnimeCard
                anime={item}
                onPress={() => router.push(`/watch/${getAnimeSlug(item)}`)}
              />
            </View>
          )}
          ListFooterComponent={() => (
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 8, marginBottom: 16 }}>
              <TouchableOpacity
                onPress={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                style={{
                  paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10,
                  backgroundColor: COLORS.card, opacity: page === 0 ? 0.3 : 1,
                }}
              >
                <Ionicons name="chevron-back" size={16} color="#fff" />
              </TouchableOpacity>

              <View style={{
                paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
                backgroundColor: COLORS.gold, minWidth: 40, alignItems: 'center',
              }}>
                <Text style={{ color: '#000', fontWeight: '900', fontSize: 13 }}>{page + 1}</Text>
              </View>

              <TouchableOpacity
                onPress={() => setPage(p => p + 1)}
                disabled={results.length === 0}
                style={{
                  paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10,
                  backgroundColor: COLORS.card, opacity: results.length === 0 ? 0.3 : 1,
                }}
              >
                <Ionicons name="chevron-forward" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
                  }
