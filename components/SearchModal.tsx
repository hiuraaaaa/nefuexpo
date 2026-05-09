import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  Image, ActivityIndicator, Modal, KeyboardAvoidingView,
  Platform, Animated, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import { api, getAnimeSlug } from '@/hooks/api';
import { Anime } from '@/types';
import { getSearchHistory, addSearchHistory, clearSearchHistory } from '@/hooks/storage';

interface Props {
  visible: boolean;
  onClose: () => void;
}

// ─── Result Item ──────────────────────────────────────────────────────────────

function ResultItem({ item, query, onPress }: { item: Anime; query: string; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start();

  // Highlight matched query in title
  const title = item.title ?? '';
  const idx = title.toLowerCase().indexOf(query.toLowerCase());
  const highlighted = idx >= 0 && query.length >= 3
    ? [title.slice(0, idx), title.slice(idx, idx + query.length), title.slice(idx + query.length)]
    : null;

  const statusColor = item.status === 'ONGOING' ? '#4ade80' : item.status === 'COMPLETED' ? COLORS.gold : 'rgba(255,255,255,0.3)';

  return (
    <TouchableOpacity onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={1}>
      <Animated.View style={[styles.resultItem, { transform: [{ scale }] }]}>
        <Image source={{ uri: item.image_poster }} style={styles.resultThumb} resizeMode="cover" />
        <View style={{ flex: 1 }}>
          <Text style={styles.resultTitle} numberOfLines={2}>
            {highlighted ? (
              <>
                <Text style={{ color: 'rgba(255,255,255,0.55)' }}>{highlighted[0]}</Text>
                <Text style={{ color: COLORS.gold, fontWeight: '800' }}>{highlighted[1]}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.55)' }}>{highlighted[2]}</Text>
              </>
            ) : title}
          </Text>
          <View style={styles.resultMeta}>
            {item.type ? <Text style={styles.metaChip}>{item.type}</Text> : null}
            {item.status ? (
              <View style={[styles.statusChip, { borderColor: statusColor }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.metaText, { color: statusColor }]}>
                  {item.status === 'ONGOING' ? 'Ongoing' : item.status === 'COMPLETED' ? 'Completed' : item.status}
                </Text>
              </View>
            ) : null}
          </View>
          {item.studio ? <Text style={styles.studioText} numberOfLines={1}>{item.studio}</Text> : null}
        </View>
        <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.2)" />
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function SearchModal({ visible, onClose }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 200);
      loadHistory();
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    } else {
      setQuery('');
      setResults([]);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const loadHistory = async () => {
    const h = await getSearchHistory();
    setHistory(h);
  };

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

  const go = async (a: Anime) => {
    await addSearchHistory(a.title ?? '');
    onClose();
    router.push(`/watch/${getAnimeSlug(a)}`);
  };

  const handleHistoryTap = (term: string) => setQuery(term);

  const handleClearHistory = async () => {
    await clearSearchHistory();
    setHistory([]);
  };

  const showHistory = query.length === 0 && history.length > 0;
  const showEmpty = query.length >= 3 && !loading && results.length === 0;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>

          {/* ── Search bar ── */}
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color={COLORS.gold} />
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Cari anime..."
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              selectionColor={COLORS.gold}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
            )}
            <View style={styles.divider} />
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Batal</Text>
            </TouchableOpacity>
          </View>

          {/* ── Content ── */}
          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={COLORS.gold} size="small" />
              <Text style={styles.loadingText}>Mencari...</Text>
            </View>
          ) : showHistory ? (
            <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Pencarian terakhir</Text>
                <TouchableOpacity onPress={handleClearHistory}>
                  <Text style={styles.clearText}>Hapus semua</Text>
                </TouchableOpacity>
              </View>
              {history.map((term, i) => (
                <TouchableOpacity key={i} onPress={() => handleHistoryTap(term)} style={styles.historyItem}>
                  <Ionicons name="time-outline" size={15} color="rgba(255,255,255,0.3)" />
                  <Text style={styles.historyText} numberOfLines={1}>{term}</Text>
                  <Ionicons name="arrow-up-back-outline" size={13} color="rgba(255,255,255,0.2)" />
                </TouchableOpacity>
              ))}
            </View>
          ) : showEmpty ? (
            <View style={styles.centered}>
              <Ionicons name="search-outline" size={40} color="rgba(255,255,255,0.08)" />
              <Text style={styles.emptyText}>Anime tidak ditemukan</Text>
              <Text style={styles.emptySubText}>Coba kata kunci lain</Text>
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={i => i.id}
              contentContainerStyle={{ padding: 16, gap: 8 }}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <ResultItem item={item} query={query} onPress={() => go(item)} />
              )}
            />
          )}

        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10,10,12,0.97)',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 2,
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cancelBtn: {
    paddingLeft: 4,
  },
  cancelText: {
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  clearText: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: '600',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  historyText: {
    flex: 1,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '500',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 10,
  },
  resultThumb: {
    width: 44,
    aspectRatio: 3 / 4.5,
    borderRadius: 6,
  },
  resultTitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 4,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  metaChip: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '600',
    backgroundColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  metaText: {
    fontSize: 10,
    fontWeight: '600',
  },
  studioText: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 10,
    marginTop: 3,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySubText: {
    color: 'rgba(255,255,255,0.12)',
    fontSize: 12,
  },
});
