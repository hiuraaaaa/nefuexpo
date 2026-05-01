import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  Image, Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants';
import { historyStorage } from '@/hooks/storage';
import { getAnimeSlug } from '@/hooks/api';
import { HistoryItem } from '@/types';

export default function HistoryScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Refresh every time tab is focused
  useFocusEffect(useCallback(() => {
    historyStorage.getAll().then(setHistory);
  }, []));

  const clearHistory = () => {
    Alert.alert('Hapus Riwayat', 'Yakin ingin menghapus semua riwayat?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: () => { historyStorage.clear(); setHistory([]); },
      },
    ]);
  };

  if (history.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={['top']}>
        <View className="flex-1 items-center justify-center gap-4">
          <Text style={{ fontSize: 48 }}>📺</Text>
          <Text className="text-white font-black text-lg">Belum ada riwayat</Text>
          <Text className="text-white/40 text-sm text-center px-8">
            Anime yang sudah kamu tonton akan muncul di sini
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={['top']}>
      <View className="flex-row items-center justify-between px-4 py-4">
        <Text className="text-white font-black text-lg uppercase tracking-tight">Riwayat</Text>
        <TouchableOpacity onPress={clearHistory}
          className="px-3 py-1.5 rounded-xl border border-white/10">
          <Text className="text-white/50 text-xs font-bold">Hapus Semua</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={history}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/watch/${getAnimeSlug(item.anime)}?ep=${item.episodeIndex}`)}
            className="flex-row items-center gap-3 mb-3 p-3 rounded-2xl"
            style={{ backgroundColor: COLORS.card, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}
            activeOpacity={0.8}
          >
            <Image source={{ uri: item.anime.image_poster }} className="w-14 rounded-lg"
              style={{ aspectRatio: 3 / 4 }} resizeMode="cover" />
            <View className="flex-1">
              <Text className="text-white font-bold text-sm mb-1" numberOfLines={1}>{item.anime.title}</Text>
              <Text style={{ color: COLORS.gold, fontSize: 11, fontWeight: '700' }}>
                Episode {item.episodeIndex}
              </Text>
              <Text className="text-white/30 text-xs mt-1">
                {new Date(item.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </View>
            <Text className="text-white/20 text-xl">›</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
