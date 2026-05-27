// app/(tabs)/news.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, Image,
  ActivityIndicator, TextInput, Modal,
  SafeAreaView as RNSafeAreaView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { WebView } from 'react-native-webview';
import { useTheme } from '@/hooks/theme';
import { fetchAnimeNews, formatNewsDate, NewsItem } from '@/hooks/news';

const PLACEHOLDER_IMG = 'https://raw.githubusercontent.com/alip-jmbd/alipp/main/icon-rbg.png';

// ── In-App Browser Modal ───────────────────────────────────────────────────────
function NewsWebModal({
  url, title, visible, onClose, theme,
}: {
  url: string;
  title: string;
  visible: boolean;
  onClose: () => void;
  theme: any;
}) {
  const [loading, setLoading] = useState(true);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <RNSafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        {/* Header */}
        <View style={[modalStyles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
            <Ionicons name="close" size={22} color={theme.text} />
          </TouchableOpacity>
          <Text
            style={[modalStyles.headerTitle, { color: theme.text }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        {/* WebView */}
        {visible && (
          <WebView
            source={{ uri: url }}
            style={{ flex: 1, backgroundColor: theme.bg }}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            javaScriptEnabled
            domStorageEnabled
          />
        )}

        {/* Loading overlay */}
        {loading && (
          <View style={[modalStyles.loadingOverlay, { backgroundColor: theme.bg }]}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[modalStyles.loadingText, { color: theme.subtext }]}>
              Memuat artikel...
            </Text>
          </View>
        )}
      </RNSafeAreaView>
    </Modal>
  );
}

// ── News Card ──────────────────────────────────────────────────────────────────
function NewsCard({
  item, index, theme, onPress,
}: {
  item: NewsItem;
  index: number;
  theme: any;
  onPress: (item: NewsItem) => void;
}) {
  const imageUrl = item.images?.jpg?.image_url ?? PLACEHOLDER_IMG;

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
      <TouchableOpacity
        onPress={() => onPress(item)}
        activeOpacity={0.75}
        style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
      >
        {/* Thumbnail */}
        <Image
          source={{ uri: imageUrl }}
          style={styles.thumbnail}
          resizeMode="cover"
        />

        {/* Content */}
        <View style={styles.cardContent}>
          <Text
            style={[styles.cardTitle, { color: theme.text }]}
            numberOfLines={2}
          >
            {item.title}
          </Text>

          <Text
            style={[styles.cardExcerpt, { color: theme.subtext }]}
            numberOfLines={2}
          >
            {item.excerpt}
          </Text>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <View style={styles.authorRow}>
              <Ionicons name="person-circle-outline" size={12} color={theme.subtext} />
              <Text style={[styles.cardMeta, { color: theme.subtext }]}>
                {item.author_username}
              </Text>
            </View>
            <View style={styles.authorRow}>
              <Ionicons name="time-outline" size={12} color={theme.subtext} />
              <Text style={[styles.cardMeta, { color: theme.subtext }]}>
                {formatNewsDate(item.date)}
              </Text>
            </View>
            <View style={styles.authorRow}>
              <Ionicons name="chatbubble-outline" size={12} color={theme.subtext} />
              <Text style={[styles.cardMeta, { color: theme.subtext }]}>
                {item.comments}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Header ─────────────────────────────────────────────────────────────────────
function NewsHeader({ theme, search, onSearch }: {
  theme: any;
  search: string;
  onSearch: (v: string) => void;
}) {
  return (
    <View style={[styles.header, { borderBottomColor: theme.border }]}>
      <Text style={[styles.headerTitle, { color: theme.text }]}>ANIME NEWS</Text>
      <Text style={[styles.headerSub, { color: theme.subtext }]}>
        LATEST FROM MYANIMELIST
      </Text>

      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Ionicons name="search-outline" size={16} color={theme.subtext} />
        <TextInput
          value={search}
          onChangeText={onSearch}
          placeholder="Cari berita..."
          placeholderTextColor={theme.subtext}
          style={[styles.searchInput, { color: theme.text }]}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => onSearch('')}>
            <Ionicons name="close-circle" size={16} color={theme.subtext} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function NewsScreen() {
  const theme = useTheme();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [filtered, setFiltered] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // State modal
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadNews = useCallback(async (p = 1, append = false) => {
    try {
      setError(null);
      const res = await fetchAnimeNews(p);
      const newItems = res.data ?? [];
      setNews(prev => append ? [...prev, ...newItems] : newItems);
      setHasMore(res.pagination?.has_next_page ?? false);
      setPage(p);
    } catch (e: any) {
      setError('Gagal memuat berita. Cek koneksi internet kamu.');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadNews(1).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(news);
    } else {
      const lower = search.toLowerCase();
      setFiltered(news.filter(n =>
        n.title.toLowerCase().includes(lower) ||
        n.excerpt.toLowerCase().includes(lower)
      ));
    }
  }, [search, news]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNews(1);
    setRefreshing(false);
  }, [loadNews]);

  const onLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore || search.trim()) return;
    setLoadingMore(true);
    await loadNews(page + 1, true);
    setLoadingMore(false);
  }, [loadingMore, hasMore, page, search, loadNews]);

  const handleCardPress = useCallback((item: NewsItem) => {
    setSelectedNews(item);
    setModalVisible(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setModalVisible(false);
    setSelectedNews(null);
  }, []);

  // ── Render States ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <NewsHeader theme={theme} search={search} onSearch={setSearch} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.subtext }]}>
            Memuat berita...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <NewsHeader theme={theme} search={search} onSearch={setSearch} />
        <View style={styles.center}>
          <Ionicons name="wifi-outline" size={48} color={theme.subtext} />
          <Text style={[styles.errorText, { color: theme.subtext }]}>{error}</Text>
          <TouchableOpacity
            onPress={() => { setLoading(true); loadNews(1).finally(() => setLoading(false)); }}
            style={[styles.retryBtn, { backgroundColor: theme.accent }]}
          >
            <Text style={[styles.retryText, { color: theme.bg }]}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <FlatList
        data={filtered}
        keyExtractor={item => String(item.mal_id)}
        renderItem={({ item, index }) => (
          <NewsCard
            item={item}
            index={index}
            theme={theme}
            onPress={handleCardPress}
          />
        )}
        ListHeaderComponent={
          <NewsHeader theme={theme} search={search} onSearch={setSearch} />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="newspaper-outline" size={48} color={theme.subtext} />
            <Text style={[styles.emptyText, { color: theme.subtext }]}>
              {search ? 'Berita tidak ditemukan' : 'Belum ada berita'}
            </Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator color={theme.accent} />
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* In-App Browser */}
      {selectedNews && (
        <NewsWebModal
          url={selectedNews.url}
          title={selectedNews.title}
          visible={modalVisible}
          onClose={handleModalClose}
          theme={theme}
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, marginTop: 60 },

  // Header
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },

  // Card
  card: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  thumbnail: {
    width: 100,
    height: 110,
  },
  cardContent: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
    marginBottom: 4,
  },
  cardExcerpt: {
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cardMeta: {
    fontSize: 10,
    fontWeight: '600',
  },

  // States
  loadingText: { marginTop: 12, fontSize: 13 },
  errorText: { marginTop: 12, fontSize: 13, textAlign: 'center' },
  emptyText: { marginTop: 12, fontSize: 13 },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: { fontWeight: '800', fontSize: 13 },
});

const modalStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  headerTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
  },
});
