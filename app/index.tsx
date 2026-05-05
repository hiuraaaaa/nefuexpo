import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  ScrollView, FlatList, ActivityIndicator, Keyboard,
  Dimensions, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LOGO_URL, KAGUYA_URL, COLORS } from '@/constants';
import { api, getAnimeSlug } from '@/hooks/api';
import { Anime } from '@/types';

const { width, height } = Dimensions.get('window');

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
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Navbar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 20, paddingVertical: 12 }}>
          <Image source={{ uri: LOGO_URL }} style={{ width: 44, height: 44 }} resizeMode="contain" />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { label: 'Home', route: '/(tabs)/' },
              { label: 'Explore', route: '/(tabs)/explore' },
              { label: 'Ongoing', route: '/(tabs)/ongoing' },
            ].map(l => (
              <TouchableOpacity key={l.route} onPress={() => router.push(l.route as any)}
                style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
                  backgroundColor: 'rgba(255,255,255,0.04)' }}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{l.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Hero — full bleed image dengan search overlay */}
        <View style={{ marginHorizontal: 16, borderRadius: 20, overflow: 'hidden',
          height: height * 0.32, position: 'relative' }}>
          <Image
            source={{ uri: 'https://raw.githubusercontent.com/alip-jmbd/alipp/main/bc.jpg' }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          {/* Dark overlay */}
          <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)' }} />

          {/* Search bar di tengah */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
            <View style={{ width: '100%', backgroundColor: '#fff', borderRadius: 12,
              paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center',
              shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12 }}>
              {/* Search icon SVG-style via View */}
              <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 2,
                borderColor: '#9ca3af', marginRight: 10 }} />
              <TextInput
                style={{ flex: 1, color: '#111', fontWeight: '700', fontSize: 13 }}
                placeholder="Ketik anime yang ingin kamu tonton..."
                placeholderTextColor="#9ca3af"
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => query && router.push(`/(tabs)/explore?q=${query}` as any)}
              />
            </View>

            {/* Live search results */}
            {(results.length > 0 || loading) && (
              <View style={{ width: '100%', marginTop: 6, backgroundColor: '#fff',
                borderRadius: 12, overflow: 'hidden', maxHeight: 200 }}>
                {loading ? (
                  <ActivityIndicator color={COLORS.gold} style={{ padding: 16 }} />
                ) : (
                  <FlatList
                    data={results.slice(0, 5)}
                    keyExtractor={i => i.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity onPress={() => goToAnime(item)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 10,
                          padding: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                        <Image source={{ uri: item.image_poster }}
                          style={{ width: 36, height: 50, borderRadius: 6 }} resizeMode="cover" />
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: '#111', fontWeight: '700', fontSize: 12 }}
                            numberOfLines={1}>{item.title}</Text>
                          <Text style={{ color: '#9ca3af', fontSize: 11, marginTop: 2 }}>
                            {item.type} · {item.status}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                    scrollEnabled={false}
                  />
                )}
              </View>
            )}
          </View>

          {/* Tombol Masuk Beranda */}
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/')}
            style={{ position: 'absolute', bottom: 20, alignSelf: 'center',
              backgroundColor: COLORS.gold, paddingHorizontal: 32, paddingVertical: 12,
              borderRadius: 999, shadowColor: COLORS.gold, shadowOpacity: 0.5, shadowRadius: 16 }}>
            <Text style={{ color: '#000', fontWeight: '900', fontSize: 12,
              textTransform: 'uppercase', letterSpacing: 2 }}>Masuk Beranda</Text>
          </TouchableOpacity>
        </View>

        {/* Branding section */}
        <View style={{ alignItems: 'center', paddingHorizontal: 32, marginTop: 48, paddingBottom: 60 }}>
          <Image source={{ uri: KAGUYA_URL }}
            style={{ width: 96, height: 96, borderRadius: 16, marginBottom: 20 }}
            resizeMode="cover" />
          <Text style={{ color: '#fff', fontSize: 36, fontWeight: '900',
            letterSpacing: -1, marginBottom: 12 }}>
            Nefu<Text style={{ color: COLORS.gold }}>Soft</Text>
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center',
            lineHeight: 20, maxWidth: 280 }}>
            NefuSoft menyediakan akses menonton ribuan judul anime secara gratis tanpa gangguan iklan.
            Nikmati subtitle Indonesia dengan kualitas 360p hingga 1080p.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
