import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  ScrollView, FlatList, ActivityIndicator, Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LOGO_URL, KAGUYA_URL, COLORS } from '@/constants';
import { api, getAnimeSlug } from '@/hooks/api';
import { Anime } from '@/types';

export default function WelcomeScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query.length < 3) { setResults([]); return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.search(query);
        setResults(res.data || []);
      } catch { setResults([]); }
      setLoading(false);
    }, 350);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  const goToAnime = (a: Anime) => {
    Keyboard.dismiss();
    setQuery('');
    setResults([]);
    router.push(`/watch/${getAnimeSlug(a)}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
        {/* Navbar */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <Image source={{ uri: LOGO_URL }} className="w-14 h-14" resizeMode="contain" />
          <View className="flex-row gap-3">
            {[
              { label: 'Home', route: '/(tabs)/' },
              { label: 'Explore', route: '/(tabs)/explore' },
              { label: 'Ongoing', route: '/(tabs)/ongoing' },
            ].map(l => (
              <TouchableOpacity key={l.route} onPress={() => router.push(l.route as any)}
                className="px-3 py-2 rounded-full border border-white/10">
                <Text className="text-white text-xs font-bold">{l.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Search Hero */}
        <View className="mx-4 rounded-3xl overflow-hidden bg-card border border-white/5 mt-2">
          <Image
            source={{ uri: 'https://raw.githubusercontent.com/alip-jmbd/alipp/main/bc.jpg' }}
            className="w-full h-64"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-black/50" />
          <View className="absolute inset-0 items-center justify-center px-6">
            <View className="w-full bg-white rounded-full px-4 py-3 flex-row items-center shadow-2xl">
              <Text className="text-gray-400 mr-2">🔍</Text>
              <TextInput
                className="flex-1 text-black font-bold text-sm"
                placeholder="Ketik anime yang ingin kamu tonton..."
                placeholderTextColor="#9ca3af"
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => query && router.push(`/(tabs)/explore?q=${query}` as any)}
              />
            </View>

            {/* Live search results */}
            {(results.length > 0 || loading) && (
              <View className="w-full mt-2 bg-white rounded-2xl overflow-hidden max-h-48">
                {loading ? (
                  <ActivityIndicator color={COLORS.gold} style={{ padding: 16 }} />
                ) : (
                  <FlatList
                    data={results.slice(0, 5)}
                    keyExtractor={i => i.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity onPress={() => goToAnime(item)}
                        className="flex-row items-center gap-3 p-3 border-b border-gray-100">
                        <Image source={{ uri: item.image_poster }} className="w-10 h-14 rounded-lg" resizeMode="cover" />
                        <View className="flex-1">
                          <Text className="text-black font-bold text-xs" numberOfLines={1}>{item.title}</Text>
                          <Text className="text-gray-400 text-xs mt-1">{item.type} • {item.status}</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                    scrollEnabled={false}
                  />
                )}
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/')}
            className="absolute bottom-6 self-center bg-gold px-12 py-3 rounded-full shadow-lg"
            style={{ shadowColor: COLORS.gold, shadowOpacity: 0.4, shadowRadius: 15 }}>
            <Text className="text-black font-black text-xs uppercase tracking-widest">Masuk Beranda</Text>
          </TouchableOpacity>
        </View>

        {/* Branding */}
        <View className="items-center px-6 mt-12 mb-24">
          <Image source={{ uri: KAGUYA_URL }} className="w-28 h-28 mb-6" resizeMode="contain" />
          <Text className="text-white text-4xl font-black tracking-tighter mb-4">
            Nefu<Text style={{ color: COLORS.gold }}>Soft</Text>
          </Text>
          <Text className="text-white/60 text-sm text-center leading-relaxed max-w-xs">
            NefuSoft menyediakan akses menonton ribuan judul anime secara gratis tanpa gangguan iklan.
            Nikmati subtitle Indonesia dengan kualitas 360p hingga 1080p.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
