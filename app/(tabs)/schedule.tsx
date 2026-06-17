// app/(tabs)/schedule.tsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  ScrollView, Dimensions, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DAY_KEYS, DAY_NAMES } from '@/constants';
import { api, getAnimeSlug } from '@/hooks/api/api';
import { Anime, ScheduleDay } from '@/types';
import { ScheduleCardSkeleton } from '@/components/Skeleton';
import { useTheme } from '@/hooks/theme';
import Animated, {
  FadeInDown, FadeInLeft,
  useSharedValue, useAnimatedStyle, withTiming, withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const DAY_ITEM_W = (width - 32) / 7;
const ITEM_HEIGHT = 98;

// ─── CardGradient ────────────────────────────────────────────────────────────

const CardGradient = React.memo<{ cardColor: string }>(({ cardColor }) => (
  <LinearGradient
    colors={[cardColor + '00', cardColor]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={s.gradientFade}
    pointerEvents="none"
  />
));
CardGradient.displayName = 'CardGradient';

// ─── DayItem ─────────────────────────────────────────────────────────────────

type DayItemProps = {
  name: string; date: number; dayKey: string;
  isToday: boolean; isSelected: boolean;
  onPress: (key: string) => void;
  accent: string; text: string; subtext: string; accentDim: string;
};

const DayItem = React.memo(({
  name, date, dayKey, isToday, isSelected,
  onPress, accent, text, subtext, accentDim,
}: DayItemProps) => {
  const scale    = useSharedValue(isSelected ? 1 : 0.9);
  const bgOpacity = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    scale.value     = withSpring(isSelected ? 1 : 0.9, { damping: 14, stiffness: 200 });
    bgOpacity.value = withTiming(isSelected ? 1 : 0, { duration: 160 });
  }, [isSelected]);

  const pillStyle = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));
  const wrapStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <TouchableOpacity
      onPress={() => onPress(dayKey)}
      activeOpacity={0.7}
      style={[s.dayTouch, { width: DAY_ITEM_W }]}
    >
      <Animated.View style={[s.dayInner, wrapStyle]}>
        <Animated.View style={[s.dayPill, { backgroundColor: accentDim }, pillStyle]} />
        <Text style={[s.dayName, { color: isSelected ? accent : subtext }]}>{name}</Text>
        <Text style={[s.dayDate, { color: isSelected ? accent : text, fontSize: isSelected ? 20 : 15 }]}>
          {date}
        </Text>
        {isToday && (
          <View style={[s.todayDot, { backgroundColor: isSelected ? accent : subtext }]} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
});
DayItem.displayName = 'DayItem';

// ─── ScheduleCard ────────────────────────────────────────────────────────────

type CardProps = {
  anime: Anime; index: number; onPress: (a: Anime) => void;
  cardColor: string; borderColor: string; textColor: string;
  accentColor: string; subtextColor: string; accentDim: string;
};

const ScheduleCard = React.memo(({
  anime, index, onPress,
  cardColor, borderColor, textColor, accentColor, subtextColor, accentDim,
}: CardProps) => {
  const timeText = useMemo(() => {
    const ts = anime.updated;
    if (!ts || typeof ts !== 'number') return anime.time ?? '--:--';
    return new Date(ts * 1000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }, [anime.updated, anime.time]);

  const [hour, min] = timeText.split(':');

  const genres = useMemo(() =>
    anime.genre ? anime.genre.split(',').map(g => g.trim()).filter(Boolean).slice(0, 2) : [],
    [anime.genre],
  );

  const entering = index < 10
    ? FadeInDown.delay(index * 30).springify().damping(18)
    : undefined;

  return (
    <Animated.View entering={entering} style={s.row}>

      {/* Timeline kiri */}
      <View style={s.timeCol}>
        <Text style={[s.timeHour, { color: accentColor }]}>{hour}</Text>
        <Text style={[s.timeMin,  { color: subtextColor }]}>{min ?? '--'}</Text>
        <View style={[s.timeLine, { backgroundColor: borderColor }]} />
      </View>

      {/* Dot */}
      <View style={s.dotCol}>
        <View style={[s.dotOuter, { borderColor: accentColor }]}>
          <View style={[s.dotInner, { backgroundColor: accentColor }]} />
        </View>
      </View>

      {/* Card */}
      <TouchableOpacity
        onPress={() => onPress(anime)}
        activeOpacity={0.8}
        style={[s.card, { backgroundColor: cardColor, borderColor }]}
      >
        {/* Accent bar kiri */}
        <View style={[s.accentBar, { backgroundColor: accentColor }]} />

        <View style={s.cardRow}>
          {/* Poster */}
          <View style={s.posterWrap}>
            <Image
              source={{ uri: anime.image_poster }}
              style={s.poster}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={120}
            />
            {anime.type ? (
              <View style={[s.typeBadge, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
                <Text style={s.typeBadgeText}>{anime.type}</Text>
              </View>
            ) : null}
            {anime.total_episode != null && (
              <View style={[s.epsBadge, { backgroundColor: accentColor }]}>
                <Text style={[s.epsBadgeText, { color: '#000' }]}>{anime.total_episode}ep</Text>
              </View>
            )}
          </View>

          <CardGradient cardColor={cardColor} />

          {/* Info */}
          <View style={s.cardInfo}>
            <Text style={[s.cardTitle, { color: textColor }]} numberOfLines={2}>
              {anime.title}
            </Text>

            {genres.length > 0 && (
              <View style={s.genreRow}>
                {genres.map(g => (
                  <View key={g} style={[s.genreChip, { backgroundColor: accentDim }]}>
                    <Text style={[s.genreText, { color: accentColor }]}>{g}</Text>
                  </View>
                ))}
              </View>
            )}

            {anime.date ? (
              <Text style={[s.cardDate, { color: subtextColor }]} numberOfLines={1}>
                {anime.date}
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});
ScheduleCard.displayName = 'ScheduleCard';

// ─── Empty ────────────────────────────────────────────────────────────────────

const EmptyState = React.memo(({ accent, subtext, text }: {
  accent: string; subtext: string; text: string;
}) => (
  <Animated.View entering={FadeInLeft.delay(80).springify()} style={s.emptyWrap}>
    <View style={[s.emptyLine, { backgroundColor: accent }]} />
    <View>
      <Text style={[s.emptyTitle, { color: text }]}>Hari ini bebas</Text>
      <Text style={[s.emptySub,   { color: subtext }]}>
        Ga ada jadwal tayang.{'\n'}Waktunya bakar backlog.
      </Text>
    </View>
  </Animated.View>
));
EmptyState.displayName = 'EmptyState';

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ScheduleScreen() {
  const router   = useRouter();
  const theme    = useTheme();
  const listRef  = useRef<FlatList>(null);
  const [schedule,  setSchedule]  = useState<ScheduleDay>({});
  const [isLoading, setIsLoading] = useState(true);

  const today         = useMemo(() => new Date(), []);
  const currentDayIdx = today.getDay(); // 0=Sun

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
      return { name, date: d.getDate(), key: DAY_KEYS[i], isToday: i === currentDayIdx };
    }), [today, currentDayIdx],
  );

  const animeList: Anime[] = useMemo(
    () => schedule[selectedDay] || [],
    [schedule, selectedDay],
  );

  const todayCount = useMemo(
    () => schedule[DAY_KEYS[currentDayIdx]]?.length ?? 0,
    [schedule, currentDayIdx],
  );

  const selectedDayName = useMemo(() => {
    const idx = DAY_KEYS.indexOf(selectedDay);
    return DAY_NAMES[idx] ?? '';
  }, [selectedDay]);

  const handleDayPress = useCallback((key: string) => {
    Haptics.selectionAsync();
    setSelectedDay(key);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const handleCardPress = useCallback((anime: Anime) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/watch/${getAnimeSlug(anime)}`);
  }, [router]);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index,
  }), []);

  const renderItem = useCallback(({ item, index }: { item: Anime; index: number }) => (
    <ScheduleCard
      anime={item} index={index} onPress={handleCardPress}
      cardColor={theme.card}   borderColor={theme.border}
      textColor={theme.text}   accentColor={theme.accent}
      subtextColor={theme.subtext} accentDim={theme.accentDim}
    />
  ), [handleCardPress, theme]);

  const keyExtractor = useCallback(
    (item: Anime, index: number) => `${item.id}-${index}`, [],
  );

  return (
    <SafeAreaView style={[s.flex1, { backgroundColor: theme.bg }]} edges={['top']}>

      {/* Header */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <View>
            <Text style={[s.title, { color: theme.text }]}>SCHEDULE</Text>
            <Text style={[s.subtitle, { color: theme.subtext }]}>
              {selectedDayName} · {animeList.length} anime
            </Text>
          </View>
          {todayCount > 0 && (
            <View style={[s.countBadge, { backgroundColor: theme.accentDim }]}>
              <Text style={[s.countBadgeText, { color: theme.accent }]}>
                {todayCount} hari ini
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Day picker */}
      <View style={s.dayRow}>
        {weekDates.map(w => (
          <DayItem
            key={w.key}
            name={w.name} date={w.date} dayKey={w.key}
            isToday={w.isToday} isSelected={selectedDay === w.key}
            onPress={handleDayPress}
            accent={theme.accent} text={theme.text}
            subtext={theme.subtext} accentDim={theme.accentDim}
          />
        ))}
      </View>

      {/* Divider accent */}
      <View style={s.dividerWrap}>
        <View style={[s.dividerAccent, { backgroundColor: theme.accent }]} />
        <View style={[s.dividerFade,   { backgroundColor: theme.border }]} />
      </View>

      {/* Content */}
      {isLoading ? (
        <ScrollView contentContainerStyle={s.skeletonWrap}>
          {[...Array(5)].map((_, i) => <ScheduleCardSkeleton key={i} />)}
        </ScrollView>
      ) : animeList.length === 0 ? (
        <EmptyState accent={theme.accent} subtext={theme.subtext} text={theme.text} />
      ) : (
        <FlatList
          ref={listRef}
          data={animeList}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={s.listWrap}
          showsVerticalScrollIndicator={false}
          getItemLayout={getItemLayout}
          initialNumToRender={8}
          maxToRenderPerBatch={6}
          windowSize={5}
          removeClippedSubviews
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  flex1: { flex: 1 },

  // Header
  header:         { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  headerRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title:          { fontWeight: '900', fontSize: 22, letterSpacing: -0.5 },
  subtitle:       { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 3 },
  countBadge:     { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  countBadgeText: { fontSize: 10, fontWeight: '800' },

  // Day picker
  dayRow:   { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 6 },
  dayTouch: { alignItems: 'center' },
  dayInner: { alignItems: 'center', paddingVertical: 8, paddingHorizontal: 2, position: 'relative', minWidth: 34 },
  dayPill:  { position: 'absolute', top: 2, left: 0, right: 0, bottom: 2, borderRadius: 10 },
  dayName:  { fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4, zIndex: 1 },
  dayDate:  { fontWeight: '900', marginTop: 2, zIndex: 1 },
  todayDot: { width: 3, height: 3, borderRadius: 2, marginTop: 3, zIndex: 1 },

  // Divider
  dividerWrap:   { flexDirection: 'row', marginHorizontal: 20, marginBottom: 12, height: 1.5 },
  dividerAccent: { width: 28, borderRadius: 1 },
  dividerFade:   { flex: 1, borderRadius: 1, opacity: 0.35 },

  // List
  listWrap:    { paddingHorizontal: 16, paddingBottom: 120 },
  skeletonWrap: { paddingHorizontal: 16, paddingBottom: 100 },

  // Timeline row
  row:    { flexDirection: 'row', gap: 8, marginBottom: 10 },
  timeCol: { width: 34, alignItems: 'center', paddingTop: 10 },
  timeHour: { fontSize: 13, fontWeight: '900', lineHeight: 15 },
  timeMin:  { fontSize: 9, fontWeight: '700', lineHeight: 12 },
  timeLine: { width: 1.5, flex: 1, marginTop: 4, borderRadius: 1 },
  dotCol:   { width: 14, alignItems: 'center', paddingTop: 13 },
  dotOuter: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  dotInner: { width: 4, height: 4, borderRadius: 2 },

  // Card
  card:         { flex: 1, borderRadius: 14, overflow: 'hidden', borderWidth: 1 },
  accentBar:    { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, zIndex: 1 },
  cardRow:      { flexDirection: 'row' },
  posterWrap:   { position: 'relative' },
  poster:       { width: 68, aspectRatio: 3 / 4 },
  gradientFade: { position: 'absolute', left: 56, top: 0, bottom: 0, width: 28 },
  typeBadge:    { position: 'absolute', top: 5, left: 4, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
  typeBadgeText: { fontSize: 7, fontWeight: '700', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.3 },
  epsBadge:     { position: 'absolute', bottom: 5, left: 4, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
  epsBadgeText: { fontSize: 7, fontWeight: '900' },
  cardInfo:     { flex: 1, paddingHorizontal: 10, paddingVertical: 10, justifyContent: 'center', gap: 5 },
  cardTitle:    { fontWeight: '800', fontSize: 12, lineHeight: 16 },
  genreRow:     { flexDirection: 'row', gap: 4 },
  genreChip:    { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  genreText:    { fontSize: 8, fontWeight: '800' },
  cardDate:     { fontSize: 9, fontWeight: '600' },

  // Empty
  emptyWrap:  { flex: 1, flexDirection: 'row', gap: 16, paddingHorizontal: 28, paddingTop: 48, alignItems: 'flex-start' },
  emptyLine:  { width: 3, height: 48, borderRadius: 2, marginTop: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5, marginBottom: 8 },
  emptySub:   { fontSize: 13, lineHeight: 20, fontWeight: '500' },
});
