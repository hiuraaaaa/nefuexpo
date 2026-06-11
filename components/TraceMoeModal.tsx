// components/TraceMoeModal.tsx
import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Modal,
  ActivityIndicator, ScrollView, StyleSheet,
  Alert, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/theme';
import {
  searchByImageUri, TraceMoeResult,
  getBestTitle, formatTimestamp, formatSimilarity,
} from '@/hooks/tracemoe';
import { api, getAnimeSlug } from '@/hooks/api/api';
import { Anime } from '@/types';

interface Props {
  visible: boolean;
  onClose: () => void;
}

// ─── Result Card ──────────────────────────────────────────────────────────────
const ResultCard = React.memo(({ result, index, onPress, theme }: {
  result: TraceMoeResult;
  index: number;
  onPress: () => void;
  theme: any;
}) => {
  const title = getBestTitle(result);
  const sim = parseFloat(formatSimilarity(result.similarity));
  const simColor = sim >= 95 ? '#4ade80' : sim >= 85 ? theme.accent : 'rgba(255,255,255,0.4)';

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.82}
        style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
      >
        {/* Preview thumbnail dari trace.moe */}
        <Image
          source={{ uri: result.image }}
          style={styles.cardThumb}
          contentFit="cover"
        />

        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={2}>
            {title}
          </Text>

          <View style={styles.cardMeta}>
            {result.episode != null && (
              <View style={[styles.chip, { backgroundColor: theme.accentDim }]}>
                <Text style={[styles.chipText, { color: theme.accent }]}>
                  EP {result.episode}
                </Text>
              </View>
            )}
            <View style={[styles.chip, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
              <Ionicons name="time-outline" size={9} color="rgba(255,255,255,0.4)" />
              <Text style={[styles.chipText, { color: 'rgba(255,255,255,0.4)' }]}>
                {formatTimestamp(result.at)}
              </Text>
            </View>
          </View>

          <View style={styles.simRow}>
            <View style={[styles.simBar, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
              <View style={[
                styles.simFill,
                { width: `${Math.min(result.similarity * 100, 100)}%` as any, backgroundColor: simColor }
              ]} />
            </View>
            <Text style={[styles.simText, { color: simColor }]}>
              {formatSimilarity(result.similarity)}
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.2)" />
      </TouchableOpacity>
    </Animated.View>
  );
});

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function TraceMoeModal({ visible, onClose }: Props) {
  const router = useRouter();
  const theme = useTheme();

  const [phase, setPhase] = useState<'idle' | 'searching' | 'results' | 'navigating'>('idle');
  const [results, setResults] = useState<TraceMoeResult[]>([]);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const opacity = useSharedValue(0);
  const overlayStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  React.useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      setPhase('idle');
      setResults([]);
      setPreviewUri(null);
      setError(null);
    } else {
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible]);

  const pickAndSearch = useCallback(async (fromCamera: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Request permission
    if (fromCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission', 'Izin kamera dibutuhkan');
        return;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission', 'Izin galeri dibutuhkan');
        return;
      }
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.85,
          allowsEditing: false,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.85,
          allowsEditing: false,
        });

    if (result.canceled || !result.assets?.[0]) return;

    const uri = result.assets[0].uri;
    setPreviewUri(uri);
    setPhase('searching');
    setError(null);

    try {
      const found = await searchByImageUri(uri);
      setResults(found);
      setPhase(found.length > 0 ? 'results' : 'idle');
      if (found.length === 0) setError('Anime tidak ditemukan dari gambar ini');
    } catch (e: any) {
      setPhase('idle');
      setError(e?.message ?? 'Gagal menghubungi trace.moe');
    }
  }, []);

  const handleResultPress = useCallback(async (result: TraceMoeResult) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhase('navigating');

    try {
      const title = getBestTitle(result);
      // Search di API kita pake judul dari trace.moe
      const res = await api.search(title);
      const found: Anime[] = res.data || [];

      if (found.length > 0) {
        onClose();
        setTimeout(() => {
          router.push(`/watch/${getAnimeSlug(found[0])}`);
        }, 300);
      } else {
        // Fallback: search manual di explore
        onClose();
        setTimeout(() => {
          router.push(`/(tabs)/explore?q=${encodeURIComponent(title)}`);
        }, 300);
      }
    } catch {
      setPhase('results');
    }
  }, [onClose, router]);

  const reset = useCallback(() => {
    setPhase('idle');
    setResults([]);
    setPreviewUri(null);
    setError(null);
  }, []);

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { backgroundColor: 'rgba(10,10,12,0.97)' }, overlayStyle]}>

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Ionicons name="close" size={22} color={theme.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Cari dari Gambar</Text>
            <Text style={[styles.headerSub, { color: theme.subtext }]}>powered by trace.moe</Text>
          </View>
          {phase === 'results' ? (
            <TouchableOpacity onPress={reset} style={styles.headerBtn}>
              <Ionicons name="refresh" size={20} color={theme.accent} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        {/* Content */}
        {phase === 'idle' && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.idleContainer}>

            {/* Preview kalau ada */}
            {previewUri && (
              <Image
                source={{ uri: previewUri }}
                style={styles.preview}
                contentFit="contain"
              />
            )}

            {error && (
              <View style={[styles.errorBox, { borderColor: theme.border }]}>
                <Ionicons name="alert-circle-outline" size={18} color="#e63946" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Text style={[styles.idleHint, { color: theme.subtext }]}>
              Upload screenshot anime untuk langsung menemukan judulnya
            </Text>

            <View style={styles.btnRow}>
              <TouchableOpacity
                onPress={() => pickAndSearch(false)}
                style={[styles.pickBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <Ionicons name="images-outline" size={26} color={theme.accent} />
                <Text style={[styles.pickBtnText, { color: theme.text }]}>Galeri</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => pickAndSearch(true)}
                style={[styles.pickBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <Ionicons name="camera-outline" size={26} color={theme.accent} />
                <Text style={[styles.pickBtnText, { color: theme.text }]}>Kamera</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {phase === 'searching' && (
          <Animated.View entering={FadeIn.duration(150)} style={styles.centeredFlex}>
            {previewUri && (
              <Image
                source={{ uri: previewUri }}
                style={styles.preview}
                contentFit="contain"
              />
            )}
            <ActivityIndicator color={theme.accent} size="large" style={{ marginTop: 24 }} />
            <Text style={[styles.searchingText, { color: theme.subtext }]}>
              Menganalisa gambar...
            </Text>
          </Animated.View>
        )}

        {phase === 'navigating' && (
          <View style={styles.centeredFlex}>
            <ActivityIndicator color={theme.accent} size="large" />
            <Text style={[styles.searchingText, { color: theme.subtext }]}>Membuka anime...</Text>
          </View>
        )}

        {phase === 'results' && (
          <ScrollView
            contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {previewUri && (
              <Image
                source={{ uri: previewUri }}
                style={[styles.preview, { marginBottom: 12 }]}
                contentFit="contain"
              />
            )}
            <Text style={[styles.resultsLabel, { color: theme.subtext }]}>
              {results.length} hasil ditemukan · tap untuk buka
            </Text>
            {results.map((r, i) => (
              <ResultCard
                key={`${r.anilist}-${i}`}
                result={r}
                index={i}
                theme={theme}
                onPress={() => handleResultPress(r)}
              />
            ))}
          </ScrollView>
        )}

      </Animated.View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 1,
  },
  idleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  centeredFlex: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  idleHint: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  pickBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  pickBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderColor: '#e63946',
    backgroundColor: 'rgba(230,57,70,0.08)',
    alignSelf: 'stretch',
  },
  errorText: {
    color: '#e63946',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  searchingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resultsLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    gap: 12,
  },
  cardThumb: {
    width: 80,
    height: 54,
    borderRadius: 8,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  chipText: {
    fontSize: 9,
    fontWeight: '700',
  },
  simRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  simBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  simFill: {
    height: '100%',
    borderRadius: 2,
  },
  simText: {
    fontSize: 10,
    fontWeight: '800',
    minWidth: 36,
    textAlign: 'right',
  },
});
