// app/(tabs)/schedule.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Optimasi dari versi sebelumnya:
//
//  PERFORMA:
//  • Hapus FadeInDown per-item → ganti enteringAnimation hanya untuk batch pertama
//    (index < 8). Item di luar viewport tidak perlu animasi masuk.
//  • LinearGradient dipindah ke komponen terpisah + memo → tidak re-create tiap render
//  • Image: tambah cachePolicy="memory-disk" → gambar tidak reload saat scroll balik
//  • getItemLayout ditambahkan ke FlatList → skip layout calculation, scroll lebih smooth
//  • theme di-destructure di parent, dipass sebagai primitif ke child → mencegah
//    re-render ScheduleCard saat object theme sama tapi referensi berubah
//
//  BUG FIX:
//  • timeText: anime.updated bisa undefined → fallback '--:--' sudah ada tapi
//    tambah guard type-safe
//  • weekDates: kalkulasi tanggal lebih robust pakai Date cloning
//  • DayItem underline width: animated via Reanimated agar tidak layout jump
// ─────────────────────────────────────────────────────────────────────────────

import React, {
  useState, useEffect, useRef, useMemo, useCallback,
} from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  ScrollView, Dimensions, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DAY_KEYS, DAY_NAMES } from '@/constants';
import { api, getAnimeSlug } from '@/hooks/api';
import { Anime, ScheduleDay } from '@/types';
import { ScheduleCardSkeleton } from '@/components/Skeleton';
import { useTheme } from '@/hooks/theme';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const DAY_ITEM_W  = (width - 32) / 7;

// Card height tetap — dipakai getItemLayout agar FlatList skip measure
const CARD_HEIGHT = 88;   // poster 64 * (4/3) ≈ 85 + margin 10
const ITEM_HEIGHT = CARD_HEIGHT + 10; // + marginBottom timelineWrap

// ─── Static Styles ────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  flex1:        { flex: 1 },
  row:          { flexDirection: 'row' },
  header:       { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  title:        { fontWeight: '900', fontSize: 22, letterSpacing: -0.5 },
  subtitle:     { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginTop: 2 },
  dayRow:       { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 4 },
  dayItem:      { alignItems: 'center', paddingVertical: 8 },
  dayName:      { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  dayDate:      { fontSize: 16, fontWeight: '900', marginTop: 2 },
  dot:          { width: 3, height: 3, borderRadius: 2, marginTop: 3 },
  underline:    { height: 2, borderRadius: 1, marginTop: 6 },
  divider:      { height: 1, marginHorizontal: 16, marginBottom: 12 },
  listContent:  { paddingHorizontal: 16, paddingBottom: 120 },
  emptyGap:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText:    { fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 2 },
  timelineWrap: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  timelineLeft: { width: 40, alignItems: 'center', paddingTop: 14 },
  timeText:     { fontSize: 10, fontWeight: '900', textAlign: 'center', lineHeight: 13 },
  timelineLine: { width: 1.5, flex: 1, marginTop: 6, borderRadius: 1 },
  dotWrap:      { width: 10, alignItems: 'center', paddingTop: 16 },
  dotCircle:    { width: 8, height: 8, borderRadius: 4 },
  card:         { flex: 1, borderRadius: 14, overflow: 'hidden', borderWidth: 1 },
  poster:       { width: 64, aspectRatio: 3 / 4 },
  gradientFade: { width: 28, position: 'absolute', left: 52, top: 0, bottom: 0 },
  cardInfo:     { flex: 1, padding: 12, justifyContent: 'center', gap: 4 },
  cardTitle:    { fontWeight: '800', fontSize: 12, lineHeight: 16 },
  cardMeta:     { fontSize: 9, fontWeight: '600' },
  cardGenre:    { fontSize: 9, fontWeight: '600' },
  arrowWrap:    { justifyContent: 'center', paddingRight: 12 },
  skeletonContent: { paddingHorizontal: 16, paddingBottom: 100 },
});

// ─── CardGradient — memo agar tidak re-render tiap scroll ─────────────────────

interface CardGradientProps { cardColor: string }

const CardGradient = React.memo<CardGradientProps>(({ cardColor }) => (
  <LinearGradient
    colors={[cardColor + '00', cardColor]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={s.gradientFade}
  />
));
CardGradient.displayName = 'CardGradient';

// ─── DayItem ──────────────────────────────────────────────────────────────────

type DayItemProps = {
  name: string; date: number; dayKey: string;
  isToday: boolean; isSelected: boolean;
  onPress: (key: string) => void;
  accent: string; text: string; subtext: string;
};

const DayItem = React.memo(({
  name, date, dayKey, isToday, isSelected,
  onPress, accent, text, subtext,
}: DayItemProps) => {
  // Animasi underline dengan Reanimated — hindari layout recalculation
  const underlineW = useSharedValue(isSelected ? DAY_ITEM_W * 0.6 : 0);

  useEffect(() => {
    underlineW.value = withTiming(isSelected ? DAY_ITEM_W * 0.6 : 0, { duration: 200 });
  }, [isSelected]);

  const underlineStyle = useAnimatedStyle(() => ({
    width: underlineW.value,
    backgroundColor: accent,
  }));

  return (
    <TouchableOpacity
      onPress={() => onPress(dayKey)}
      activeOpacity={0.7}
      style={[s.dayItem, { width: DAY_ITEM_W }]}
    >
      <Text style={[s.dayName, { color: isSelected ? accent : subtext }]}>{name}</Text>
      <Text style={[s.dayDate, { color: isSelected ? accent : text }]}>{date}</Text>
      {isToday && (
        <View style={[s.dot, { backgroundColor: isSelected ? accent : subtext }]} />
      )}
      <Animated.View style={[s.underline, underlineStyle]} />
    </TouchableOpacity>
  );
});
DayItem.displayName = 'DayItem';

// ─── ScheduleCard ─────────────────────────────────────────────────────────────
// Props dipass sebagai primitif (bukan object theme) → React.memo lebih efektif
// karena shallow comparison bekerja dengan benar

type ScheduleCardProps = {
  anime:      Anime;
  index:      number;
  onPress:    (anime: Anime) => void;
  // Primitif dari theme — bukan whole object
  cardColor:  string;
  borderColor: string;
  textColor:  string;
  accentColor: string;
  subtextColor: string;
};

const ScheduleCard = React.memo(({
  anime, index, onPress,
  cardColor, borderColor, textColor, accentColor, subtextColor,
}: ScheduleCardProps) => {
  // Guard type-safe: updated bisa undefined/null
  const timeText = useMemo(() => {
    const ts = anime.updated;
    if (!ts || typeof ts !== 'number') return '--:--';
    return new Date(ts * 1000).toLocaleTimeString('id-ID', {
      hour: '2-digit', minute: '2-digit',
    });
  }, [anime.updated]);

  // Animasi masuk hanya untuk 8 item pertama — sisanya langsung muncul
  // Ini yang paling berdampak untuk performa awal masuk screen
  const entering = index < 8
    ? FadeInDown.delay(index * 35).springify().damping(18)
    : undefined;

  return (
    <Animated.View entering={entering} style={s.timelineWrap}>
      {/* Timeline kiri */}
      <View style={s.timelineLeft}>
        <Text style={[s.timeText, { color: accentColor }]}>{timeText}</Text>
        <View style={[s.timelineLine, { backgroundColor: borderColor }]} />
      </View>

      {/* Dot */}
      <View style={s.dotWrap}>
        <View style={[s.dotCircle, { backgroundColor: accentColor }]} />
      </View>

      {/* Card */}
      <TouchableOpacity
        onPress={() => onPress(anime)}
        activeOpacity={0.85}
        style={[s.card, { backgroundColor: cardColor, borderColor }]}
      >
        <View style={s.row}>
          <Image
            source={{ uri: anime.image_poster }}
            style={s.poster}
            contentFit="cover"
            // Cache agresif — gambar tidak reload saat scroll balik
            cachePolicy="memory-disk"
            transition={150}
          />
          {/* Gradient dipisah ke komponen memo */}
          <CardGradient cardColor={cardColor} />

          <View style={s.cardInfo}>
            <Text
              style={[s.cardTitle, { color: textColor }]}
              numberOfLines={2}
            >
              {anime.title}
            </Text>
            {anime.date ? (
              <Text
                style={[s.cardMeta, { color: accentColor }]}
                numberOfLines={1}
              >
                {anime.date}
              </Text>
            ) : null}
            {anime.genre ? (
              <Text
                style={[s.cardGenre, { color: subtextColor }]}
                numberOfLines={1}
              >
                {anime.genre.replace(/,/g, ' · ')}
              </Text>
            ) : null}
          </View>

          <View style={s.arrowWrap}>
            <Ionicons name="chevron-forward" size={14} color={subtextColor} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});
ScheduleCard.displayName = 'ScheduleCard';

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ScheduleScreen() {
  const router  = useRouter();
  const theme   = useTheme();
  const listRef = useRef<FlatList>(null);

  const [schedule,  setSchedule]  = useState<ScheduleDay>({});
  const [isLoading, setIsLoading] = useState(true);

  const today         = useMemo(() => new Date(), []);
  const currentDayIdx = today.getDay();

  const [selectedDay, setSelectedDay] = useState(() => DAY_KEYS[currentDayIdx]);

  useEffect(() => {
    api.schedule()
      .then(r => setSchedule(r.data || {}))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const weekDates = useMemo(() =>
    DAY_NAMES.map((name, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - currentDayIdx + i);
      return {
        name,
        date:    d.getDate(),
        key:     DAY_KEYS[i],
        isToday: i === currentDayIdx,
      };
    }),
    [today, currentDayIdx],
  );

  const animeList: Anime[] = useMemo(
    () => schedule[selectedDay] || [],
    [schedule, selectedDay],
  );

  const handleDayPress = useCallback((key: string) => {
    Haptics.selectionAsync();
    setSelectedDay(key);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const handleCardPress = useCallback((anime: Anime) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/watch/${getAnimeSlug(anime)}`);
  }, [router]);

  // getItemLayout — skip layout calculation, scroll instantly smooth
  const getItemLayout = useCallback((_: any, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  const renderItem = useCallback(({ item, index }: { item: Anime; index: number }) => (
    <ScheduleCard
      anime={item}
      index={index}
      onPress={handleCardPress}
      // Pass primitif, bukan whole theme object
      cardColor={theme.card}
      borderColor={theme.border}
      textColor={theme.text}
      accentColor={theme.accent}
      subtextColor={theme.subtext}
    />
  ), [handleCardPress, theme.card, theme.border, theme.text, theme.accent, theme.subtext]);

  const keyExtractor = useCallback(
    (item: Anime, index: number) => `${item.id}-${index}`,
    [],
  );

  return (
    <SafeAreaView style={[s.flex1, { backgroundColor: theme.bg }]} edges={['top']}>

      {/* Header */}
      <View style={s.header}>
        <Text style={[s.title, { color: theme.text }]}>SCHEDULE</Text>
        <Text style={[s.subtitle, { color: theme.subtext }]}>
          Anime yang tayang minggu ini
        </Text>
      </View>

      {/* Day picker */}
      <View style={s.dayRow}>
        {weekDates.map(w => (
          <DayItem
            key={w.key}
            name={w.name}
            date={w.date}
            dayKey={w.key}
            isToday={w.isToday}
            isSelected={selectedDay === w.key}
            onPress={handleDayPress}
            accent={theme.accent}
            text={theme.text}
            subtext={theme.subtext}
          />
        ))}
      </View>

      {/* Divider */}
      <View style={[s.divider, { backgroundColor: theme.border }]} />

      {/* Content */}
      {isLoading ? (
        <ScrollView contentContainerStyle={s.skeletonContent}>
          {[...Array(5)].map((_, i) => <ScheduleCardSkeleton key={i} />)}
        </ScrollView>
      ) : animeList.length === 0 ? (
        <View style={s.emptyGap}>
          <Ionicons name="calendar-outline" size={56} color={theme.subtext} />
          <Text style={[s.emptyText, { color: theme.subtext }]}>Belum ada jadwal</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={animeList}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          // ── Optimasi FlatList ──────────────────────────────────────────
          getItemLayout={getItemLayout}      // skip measure, scroll mulus
          initialNumToRender={8}             // hanya render 8 item pertama
          maxToRenderPerBatch={6}            // batch render saat scroll
          windowSize={5}                     // viewport 5x tinggi layar
          removeClippedSubviews={true}       // unmount item di luar viewport
          updateCellsBatchingPeriod={50}     // batching lebih agresif
        />
      )}

    </SafeAreaView>
  );
}
