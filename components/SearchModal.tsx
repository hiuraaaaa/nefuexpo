import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  Image, ActivityIndicator, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants';
import { api, getAnimeSlug } from '@/hooks/api';
import { Anime } from '@/types';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function SearchModal({ visible, onClose }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) setTimeout(() => inputRef.current?.focus(), 200);
    else { setQuery(''); setResults([]); }
  }, [visible]);

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
    }, 400);
  }, [query]);

  const go = (a: Anime) => {
    onClose();
    router.push(`/watch/${getAnimeSlug(a)}`);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(10,10,12,0.95)' }}>
          {/* Search bar */}
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12,
            borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
            <Text style={{ fontSize: 18, color: COLORS.gold }}>🔍</Text>
            <TextInput
              ref={inputRef}
              style={{ flex: 1, color: '#fff', fontWeight: '700', fontSize: 16 }}
              placeholder="Cari anime..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={results}
              keyExtractor={i => i.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => go(item)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12,
                    backgroundColor: COLORS.card, borderRadius: 12, padding: 12 }}
                  activeOpacity={0.8}>
                  <Image source={{ uri: item.image_poster }} style={{ width: 40, borderRadius: 6 }}
                    resizeMode="cover" aspectRatio={3 / 4.5} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }} numberOfLines={1}>{item.title}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 2 }}>
                      {item.type} • {item.status}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={query.length > 2 && !loading ? (
                <Text style={{ color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 40, fontWeight: '700' }}>
                  Anime tidak ditemukan
                </Text>
              ) : null}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
