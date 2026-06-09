import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ScrollView, Dimensions, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DAY_KEYS, DAY_NAMES } from '@/constants';
import { api, getAnimeSlug } from '@/hooks/api';
import { Anime, ScheduleDay } from '@/types';
import { ScheduleCardSkeleton } from '@/components/Skeleton';
import { useTheme } from '@/hooks/theme';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const DAY_ITEM_W = (width - 32) / 7;

// ─── Static Styles ────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  flex1:        { flex: 1 },
  row:          { flexDirection: 'row' },
  header:       { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  title:        { fontWeight: '900', fontSize: 28, letterSpacing: -0.5 },
  subtitle:     { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginTop: 2 },
  dayRow:       { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 4 },
  dayItem:      { alignItems: 'center', paddingVertical: 8 },
  dayName:      { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  dayDate:      { fontSize: 16, fontWeight: '900', marginTop: 2 },
  dot:          { width: 3, height: 3, borderRadius: 2, marginTop: 3 },
  divider:      { height: 1, marginHorizontal: 16, marginBottom: 12 },
  listContent:  { paddingHorizontal: 16, paddingBottom: 100 },
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
  gradientFade: { width: 24, position: 'absolute', left: 52, top: 0, bottom: 0 },
  cardInfo:     { flex: 1, padding: 12, justifyContent: 'center', gap: 4 },
  cardTitle:    { fontWeight: '800', fontSize: 12, lineHeight: 16 },
  cardGenre:    { fontSize: 9, fontWeight: '600' },
  arrowWrap:    { justifyContent: 'center', paddingRight: 12 },
  skeletonContent: { paddingHorizontal: 16, paddingBottom: 100 },
});

// ─── DayItem ──────────────────────────────────────────────────────────────────

type DayItemProps = {
  name: string;
  date: number;
  dayKey: string;
  isToday: boolean;
  isSelected: boolean;
  onPress: (key: string) => void;
  accent: string;
  text: string;
  subtext: string;
};

const DayItem = React.memo(({
  name, date, dayKey, isToday, isSelected,
  onPress, accent, text, subtext,
}: DayItemProps) => (
  <TouchableOpacity
    onPress={() => onPress(dayKey)}
    activeOpacity={0.7}
    style={[s.dayItem, { width: DAY_ITEM_W }]}
  >
    <Text style={[s.dayName, { color: isSelected ? accent : subtext }]}>
      {name}
    </Text>
    <Text style={[s.dayDate, { color: isSelected ? accent : text }]}>
      {date}
    </Text>
    {isToday && (
      <View style={[s.dot, { backgroundColor: isSelected ? accent : subtext }]} />
    )}
    <View style={{
      height: 2, borderRadius: 1, marginTop: 6,
      width: isSelected ? DAY_ITEM_W * 0.6 : 0,
      backgroundColor: accent,
    }} />
  </TouchableOpacity>
));

// ─── ScheduleCard ─────────────────────────────────────────────────────────────

type ScheduleCardProps = {
  anime: Anime;
  index: number;
  onPress: (anime: Anime) => void;
  theme: ReturnType<typeof useTheme>;
};

const ScheduleCard = React.memo(({ anime, index, onPress, theme }: ScheduleCardProps) => {
  const timeText = useMemo(() =>
    anime.key_time ? anime.key_time.split(' ')[1]?.substring(0, 5) : '--:--',
    [anime.key_time]
  );

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 40).springify()}
      style={s.timelineWrap}
    >
      {/* Timeline kiri */}
      <View style={s.timelineLeft}>
        <Text style={[s.timeText, { color: theme.accent }]}>{timeText}</Text>
        <View style={[s.timelineLine, { backgroundColor: theme.border }]} />
      </View>

      {/* Dot */}
      <View style={s.dotWrap}>
        <View style={[s.dotCircle, { backgroundColor: theme.accent }]} />
      </View>

      {/* Card */}
      <TouchableOpacity
        onPress={() => onPress(anime)}
        activeOpacity={0.85}
        style={[s.card, { backgroundColor: theme.card, borderColor: theme.border }]}
      >
        <View style={s.row}>
          <Image
            source={{ uri: item.image_poster }}
            style={s.poster}
            contentFit="cover"
          />
          <LinearGradient
            colors={[theme.card + '00', theme.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.gradientFade}
          />
          <View style={s.cardInfo}>
            <Text style={[s.cardTitle, { color: theme.text }]} numberOfLines={2}>
              {anime.title}
            </Text>
            {anime.genre ? (
              <Text style={[s.cardGenre, { color: theme.subtext }]} numberOfLines={1}>
                {anime.genre.replace(/,/g, ' · ')}
              </Text>
            ) : null}
          </View>
          <View style={s.arrowWrap}>
            <Ionicons name="chevron-forward" size={14} color={theme.subtext} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ScheduleScreen() {
  const router    = useRouter();
  const theme     = useTheme();
  const listRef   = useRef<FlatList>(null);

  const [schedule, setSchedule]   = useState<ScheduleDay>({});
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
      return { name, date: d.getDate(), key: DAY_KEYS[i], isToday: i === currentDayIdx };
    }),
    [today, currentDayIdx]
  );

  const animeList: Anime[] = useMemo(
    () => schedule[selectedDay] || [],
    [schedule, selectedDay]
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

  const renderItem = useCallback(({ item, index }: { item: Anime; index: number }) => (
    <ScheduleCard
      anime={item}
      index={index}
      onPress={handleCardPress}
      theme={theme}
    />
  ), [handleCardPress, theme]);

  const keyExtractor = useCallback((item: Anime, index: number) =>
    `${item.id}-${index}`, []);

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
          initialNumToRender={8}
          maxToRenderPerBatch={6}
          windowSize={5}
          removeClippedSubviews={true}
        />
      )}

    </SafeAreaView>
  );
            }
