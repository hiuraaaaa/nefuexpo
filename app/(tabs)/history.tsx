import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import { favoritStorage } from '@/hooks/storage/storage';
import { getCurrentUser } from '@/hooks/auth';
import { Anime } from '@/types';

export default function SavedScreen() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getCurrentUser();

  useFocusEffect(useCallback(() => {
    const load = async () => {
      setLoading(true);
      const data = await favoritStorage.getAll();
      setFavorites(data);
      setLoading(false);
    };
    load();
  }, []));

  const handleRemove = (anime: Anime) => {
    Alert.alert('Hapus Favorit', `Hapus ${anime.title} dari favorit?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          await favoritStorage.remove(anime.id);
          setFavorites(prev => prev.filter(a => a.id !== anime.id));
        },
      },
    ]);
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tersimpan</Text>
        </View>
        <View style={styles.emptyBox}>
          <Ionicons name="bookmark-outline" size={56} color="rgba(255,255,255,0.1)" />
          <Text style={styles.emptyTitle}>Belum Login</Text>
          <Text style={styles.emptySub}>Login untuk menyimpan anime favorit kamu</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tersimpan</Text>
        </View>
        <View style={styles.emptyBox}>
          <ActivityIndicator color={COLORS.gold} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tersimpan</Text>
        <Text style={styles.headerCount}>{favorites.length} anime</Text>
      </View>

      {favorites.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="bookmark-outline" size={56} color="rgba(255,255,255,0.1)" />
          <Text style={styles.emptyTitle}>Belum Ada Favorit</Text>
          <Text style={styles.emptySub}>Tap ikon bookmark saat nonton untuk menyimpan anime</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/watch/${item.id}`)}
              style={styles.card}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: item.image_poster }}
                style={styles.poster}
                resizeMode="cover"
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.meta}>{item.type} • {item.status}</Text>
                {item.genre ? (
                  <Text style={styles.genre} numberOfLines={1}>
                    {item.genre.replace(/,/g, ', ')}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={() => handleRemove(item)}
                style={styles.removeBtn}
              >
                <Ionicons name="bookmark" size={22} color={COLORS.gold} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
  },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  headerCount: { color: 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: '700' },
  emptyBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 40,
  },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 8 },
  emptySub: { color: 'rgba(255,255,255,0.35)', fontSize: 12, textAlign: 'center' },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.card, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  poster: { width: 56, height: 80, borderRadius: 8 },
  title: { color: '#fff', fontSize: 13, fontWeight: '700', marginBottom: 4 },
  meta: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginBottom: 4 },
  genre: { color: COLORS.gold, fontSize: 10, fontWeight: '600' },
  removeBtn: { padding: 8 },
});
