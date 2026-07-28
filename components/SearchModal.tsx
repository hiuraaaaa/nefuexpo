import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, Modal, KeyboardAvoidingView,
  Platform, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { api, getAnimeSlug } from '@/hooks/api/api';
import { Anime } from '@/types';
import { getSearchHistory, addSearchHistory, clearSearchHistory } from '@/hooks/storage/storage';
import TraceMoeModal from '@/components/TraceMoeModal';

interface Props {
  visible: boolean;
  onClose: () => void;
  theme: any;
}

// ─── Result Item ──────────────────────────────────────────────────────────────
const ResultItem = React.memo(({ item, query, onPress, theme }: {
  item: Anime; query: string; onPress: () => void; theme: any;
}) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const onPressIn  = () => { scale.value = withSpring(0.96, { damping: 15, stiffness: 300 }); };
  const onPressOut = () => { scale.value = withSpring(1,    { damping: 12 }); };

  // Highlight matched query in title
  const title = item.title ?? '';
  const idx   = title.toLowerCase().indexOf(query.toLowerCase());
  const highlighted = idx >= 0 && query.length >= 3
    ? [title.slice(0, idx), title.slice(idx, idx + query.length), title.slice(idx + query.length)]
    : null;

  // FIX: nilai status asli dari API itu "Ongoing"/"Completed" (bukan ALL-CAPS),
  // sebelumnya dibandingkan ke 'ONGOING'/'COMPLETED' jadi selalu gak match.
  const statusColor =
    item.status === 'Ongoing'   ? '#4ade80' :
    item.status === 'Completed' ? theme.subtext :
    `${theme.subtext}50`;

  return (
    <TouchableOpacity onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={1}>
      <Animated.View style={[styles.resultItem, { backgroundColor: theme.card }, animStyle]}>
        <Image
          source={{ uri: item.image_poster, priority: "normal" }}
          style={styles.resultThumb}
          contentFit="cover"
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.resultTitle, { color: theme.subtext, fontFamily: 'PlusJakartaSans_700Bold' }]} numberOfLines={2}>
            {highlighted ? (
              <>
                <Text style={{ color: theme.subtext }}>{highlighted[0]}</Text>
                <Text style={{ color: theme.accent }}>{highlighted[1]}</Text>
                <Text style={{ color: theme.subtext }}>{highlighted[2]}</Text>
              </>
            ) : title}
          </Text>
          <View style={styles.resultMeta}>
            {item.type ? (
              <Text style={[styles.metaChip, { color: theme.subtext, backgroundColor: `${theme.subtext}15`, fontFamily: 'JetBrainsMono_500Medium' }]}>
                {item.type}
              </Text>
            ) : null}
            {item.status ? (
              <View style={[styles.statusChip, { borderColor: statusColor }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.metaText, { color: statusColor, fontFamily: 'JetBrainsMono_500Medium' }]}>
                  {item.status}
                </Text>
              </View>
            ) : null}
          </View>
          {item.studio ? (
            <Text style={[styles.studioText, { color: theme.subtext, fontFamily: 'PlusJakartaSans_400Regular' }]} numberOfLines={1}>
              {item.studio}
            </Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={14} color={`${theme.subtext}50`} />
      </Animated.View>
    </TouchableOpacity>
  );
});

// ─── History Item ─────────────────────────────────────────────────────────────
const HistoryItem = React.memo(({ term, onPress, theme }: { term: string; onPress: () => void; theme: any }) => (
  <TouchableOpacity onPress={onPress} style={[styles.historyItem, { borderBottomColor: theme.border }]}>
    <Ionicons name="time-outline" size={15} color={`${theme.subtext}80`} />
    <Text style={[styles.historyText, { color: theme.subtext, fontFamily: 'PlusJakartaSans_600SemiBold' }]} numberOfLines={1}>{term}</Text>
    <Ionicons name="arrow-up-back-outline" size={13} color={`${theme.subtext}50`} />
  </TouchableOpacity>
));

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function SearchModal({ visible, onClose, theme }: Props) {
  const router = useRouter();

  const [query, setQuery]     = useState('');
  const [results, setResults] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [traceMoeVisible, setTraceMoeVisible] = useState(false);

  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef  = useRef<TextInput>(null);

  const opacity = useSharedValue(0);
  const overlayStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      loadHistory();
      focusRef.current = setTimeout(() => inputRef.current?.focus(), 200);
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      setQuery('');
      setResults([]);
      if (focusRef.current) clearTimeout(focusRef.current);
    }
    return () => {
      if (focusRef.current) clearTimeout(focusRef.current);
    };
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
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  const go = useCallback(async (a: Anime) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await addSearchHistory(a.title ?? '');
    onClose();
    router.push(`/watch/${getAnimeSlug(a)}`);
  }, [onClose, router]);

  const handleHistoryTap = useCallback((term: string) => {
    Haptics.selectionAsync();
    setQuery(term);
  }, []);

  const handleClearHistory = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await clearSearchHistory();
    setHistory([]);
  }, []);

  const renderResult = useCallback(({ item }: { item: Anime }) => (
    <ResultItem item={item} query={query} onPress={() => go(item)} theme={theme} />
  ), [query, go, theme]);

  const showHistory = query.length === 0 && history.length > 0;
  const showEmpty   = query.length >= 3 && !loading && results.length === 0;

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Animated.View style={[styles.overlay, { backgroundColor: `${theme.bg}F7` }, overlayStyle]}>

          {/* ── Search bar ── */}
          <View style={[styles.searchBar, { borderBottomColor: theme.border }]}>
            <Ionicons name="search-outline" size={20} color={theme.accent} />
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: theme.text, fontFamily: 'PlusJakartaSans_600SemiBold' }]}
              placeholder="Cari anime..."
              placeholderTextColor={`${theme.subtext}60`}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              selectionColor={theme.accent}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={18} color={`${theme.subtext}80`} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTraceMoeVisible(true);
              }}
              style={styles.clearBtn}
            >
              <Ionicons name="scan-outline" size={20} color={theme.accent} />
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={[styles.cancelText, { color: theme.accent, fontFamily: 'PlusJakartaSans_600SemiBold' }]}>Batal</Text>
            </TouchableOpacity>
          </View>

          {/* ── Content ── */}
          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={theme.accent} size="small" />
              <Text style={[styles.loadingText, { color: theme.subtext, fontFamily: 'PlusJakartaSans_400Regular' }]}>Mencari...</Text>
            </View>

          ) : showHistory ? (
            <Animated.View entering={FadeIn.duration(200)} style={{ paddingHorizontal: 16, paddingTop: 8 }}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.subtext, fontFamily: 'JetBrainsMono_600SemiBold' }]}>
                  Pencarian terakhir
                </Text>
                <TouchableOpacity onPress={handleClearHistory}>
                  <Text style={[styles.clearText, { color: theme.accent, fontFamily: 'PlusJakartaSans_600SemiBold' }]}>Hapus semua</Text>
                </TouchableOpacity>
              </View>
              {history.map((term, i) => (
                <HistoryItem key={i} term={term} onPress={() => handleHistoryTap(term)} theme={theme} />
              ))}
            </Animated.View>

          ) : showEmpty ? (
            <View style={styles.centered}>
              <Ionicons name="search-outline" size={40} color={`${theme.subtext}20`} />
              <Text style={[styles.emptyText, { color: theme.subtext, fontFamily: 'PlusJakartaSans_700Bold' }]}>Anime tidak ditemukan</Text>
              <Text style={[styles.emptySubText, { color: `${theme.subtext}90` }]}>Coba kata kunci lain</Text>
            </View>

          ) : (
            <FlatList
              data={results}
              keyExtractor={i => i.id}
              contentContainerStyle={{ padding: 16, gap: 8 }}
              keyboardShouldPersistTaps="handled"
              renderItem={renderResult}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              windowSize={5}
            />
          )}

        </Animated.View>
      </KeyboardAvoidingView>

      <TraceMoeModal
        visible={traceMoeVisible}
        onClose={() => setTraceMoeVisible(false)}
      />
    </Modal>
  );
}

// ─── Styles (layout-only; warna dioverride inline via theme) ─────────────────
const styles = StyleSheet.create({
  overlay: { flex: 1 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 10,
    borderBottomWidth: 1,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 0 },
  clearBtn: { padding: 2 },
  divider: { width: 1, height: 18 },
  cancelBtn: { paddingLeft: 4 },
  cancelText: { fontSize: 14 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText: { fontSize: 12, marginTop: 4 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  sectionTitle: { fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' },
  clearText: { fontSize: 11 },
  historyItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1,
  },
  historyText: { flex: 1, fontSize: 13 },
  resultItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 10, padding: 10,
  },
  resultThumb: { width: 44, aspectRatio: 3 / 4.5, borderRadius: 6 },
  resultTitle: { fontSize: 13, lineHeight: 18, marginBottom: 4 },
  resultMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  metaChip: {
    fontSize: 9.5, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  statusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2,
  },
  statusDot: { width: 4, height: 4, borderRadius: 2 },
  metaText: { fontSize: 9.5 },
  studioText: { fontSize: 10, marginTop: 3 },
  emptyText: { fontSize: 15, marginTop: 8 },
  emptySubText: { fontSize: 12 },
});
