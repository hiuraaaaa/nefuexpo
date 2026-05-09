import React, { useEffect, useRef } from 'react';
import { Animated, View, Dimensions } from 'react-native';
import { COLORS } from '@/constants';

const { width } = Dimensions.get('window');

// ─── ShimmerBox ───────────────────────────────────────────────────────────────
// Core shimmer — dipakai semua skeleton

export function ShimmerBox({ w, h, borderRadius = 6, style }: {
  w: number | string;
  h: number | string;
  borderRadius?: number;
  style?: object;
}) {
  const translateX = useRef(new Animated.Value(-width)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(translateX, {
        toValue: width,
        duration: 1200,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <View
      style={[
        {
          width: w as any,
          height: h as any,
          borderRadius,
          backgroundColor: '#1e1e24',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: 0, bottom: 0,
          width: 100,
          transform: [{ translateX }, { skewX: '-20deg' }],
          backgroundColor: 'rgba(255,255,255,0.07)',
        }}
      />
    </View>
  );
}

// ─── CardSkeleton ─────────────────────────────────────────────────────────────
// Grid 3-kolom — dipakai di Explore & Ongoing

export function CardSkeleton() {
  return (
    <View style={{ flex: 1 }}>
      <ShimmerBox w="100%" h={0} borderRadius={8} style={{ aspectRatio: 3 / 4.5 }} />
      <ShimmerBox w="75%" h={9} borderRadius={4} style={{ marginTop: 7 }} />
      <ShimmerBox w="50%" h={8} borderRadius={4} style={{ marginTop: 4 }} />
    </View>
  );
}

// ─── HeroSkeleton ─────────────────────────────────────────────────────────────
// Carousel hero — dipakai di Home

export function HeroSkeleton() {
  return (
    <View style={{ width: '100%', aspectRatio: 16 / 10, backgroundColor: COLORS.card }}>
      <ShimmerBox w="100%" h="100%" borderRadius={0} />
      {/* Overlay info — thumbnail + text */}
      <View style={{
        position: 'absolute', bottom: 24, left: 16, right: 16,
        flexDirection: 'row', gap: 12, alignItems: 'flex-end',
      }}>
        <ShimmerBox w={72} h={0} borderRadius={8} style={{ aspectRatio: 3 / 4.2 }} />
        <View style={{ flex: 1, gap: 8 }}>
          {/* Badge */}
          <ShimmerBox w="35%" h={10} borderRadius={20} />
          {/* Title */}
          <ShimmerBox w="90%" h={18} borderRadius={4} />
          <ShimmerBox w="70%" h={18} borderRadius={4} />
          {/* Meta */}
          <ShimmerBox w="55%" h={12} borderRadius={4} />
          {/* Button */}
          <ShimmerBox w="45%" h={32} borderRadius={20} style={{ marginTop: 4 }} />
        </View>
      </View>
      {/* Dot indicators */}
      <View style={{
        position: 'absolute', bottom: 8, left: 0, right: 0,
        flexDirection: 'row', justifyContent: 'center', gap: 6,
      }}>
        {[...Array(5)].map((_, i) => (
          <ShimmerBox key={i} w={i === 0 ? 16 : 6} h={6} borderRadius={3} />
        ))}
      </View>
    </View>
  );
}

// ─── HorizontalCardSkeleton ───────────────────────────────────────────────────
// Horizontal scroll — dipakai di Home (ongoing/terbaru section)

export function HorizontalCardSkeleton() {
  return (
    <View style={{ width: 104, marginRight: 10 }}>
      <ShimmerBox w={104} h={0} borderRadius={8} style={{ aspectRatio: 3 / 4.5 }} />
      <ShimmerBox w={80} h={9} borderRadius={4} style={{ marginTop: 7 }} />
      <ShimmerBox w={55} h={8} borderRadius={4} style={{ marginTop: 4 }} />
    </View>
  );
}

// ─── RankSkeleton ─────────────────────────────────────────────────────────────
// Top 10 list — dipakai di Home

export function RankSkeleton() {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 14,
      backgroundColor: COLORS.card, borderRadius: 16,
      padding: 14, marginBottom: 10,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
      height: 76,
    }}>
      {/* Rank number placeholder */}
      <ShimmerBox w={28} h={28} borderRadius={4} />
      {/* Thumbnail */}
      <ShimmerBox w={38} h={52} borderRadius={6} />
      {/* Text */}
      <View style={{ flex: 1, gap: 8 }}>
        <ShimmerBox w="80%" h={13} borderRadius={4} />
        <ShimmerBox w="50%" h={9} borderRadius={4} />
      </View>
      {/* Score badge */}
      <ShimmerBox w={36} h={22} borderRadius={10} />
    </View>
  );
}

// ─── ScheduleCardSkeleton ─────────────────────────────────────────────────────
// Timeline layout — dipakai di Schedule

export function ScheduleCardSkeleton() {
  return (
    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
      {/* Jam tayang */}
      <View style={{ width: 42, alignItems: 'center', paddingTop: 18 }}>
        <ShimmerBox w={42} h={11} borderRadius={4} />
        <ShimmerBox w={30} h={9} borderRadius={4} style={{ marginTop: 4 }} />
      </View>
      {/* Dot timeline */}
      <View style={{ width: 14, alignItems: 'center', paddingTop: 20 }}>
        <ShimmerBox w={8} h={8} borderRadius={4} />
        <View style={{ width: 1, flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginTop: 4 }} />
      </View>
      {/* Card */}
      <View style={{
        flex: 1, backgroundColor: COLORS.card, borderRadius: 14,
        padding: 12, flexDirection: 'row', gap: 12,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
        marginBottom: 4,
      }}>
        <ShimmerBox w={60} h={0} borderRadius={8} style={{ aspectRatio: 3 / 4 }} />
        <View style={{ flex: 1, gap: 8, paddingTop: 2 }}>
          {/* Episode badge */}
          <ShimmerBox w="38%" h={10} borderRadius={10} />
          {/* Title */}
          <ShimmerBox w="95%" h={14} borderRadius={4} />
          <ShimmerBox w="75%" h={14} borderRadius={4} />
          {/* Genre chips */}
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
            <ShimmerBox w={44} h={18} borderRadius={8} />
            <ShimmerBox w={52} h={18} borderRadius={8} />
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── WatchSkeleton ────────────────────────────────────────────────────────────
// Watch/player page — dipakai di watch/[slug]

export function WatchSkeleton() {
  return (
    <View>
      {/* Video player area */}
      <ShimmerBox w="100%" h={0} borderRadius={0} style={{ aspectRatio: 16 / 9 }} />

      <View style={{ padding: 16, gap: 14 }}>
        {/* Server & quality buttons */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <ShimmerBox w="48%" h={44} borderRadius={12} />
          <ShimmerBox w="48%" h={44} borderRadius={12} />
        </View>

        {/* Episode navigation button */}
        <ShimmerBox w="100%" h={44} borderRadius={12} />

        {/* Episode list */}
        <View style={{
          backgroundColor: COLORS.card, borderRadius: 14, padding: 14, gap: 12,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
        }}>
          <ShimmerBox w="38%" h={13} borderRadius={4} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {[...Array(18)].map((_, i) => (
              <ShimmerBox key={i} w={44} h={44} borderRadius={8} />
            ))}
          </View>
        </View>

        {/* Anime info card */}
        <View style={{
          flexDirection: 'row', gap: 14,
          backgroundColor: COLORS.card, borderRadius: 14,
          padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
        }}>
          {/* Poster */}
          <ShimmerBox w={90} h={0} borderRadius={10} style={{ aspectRatio: 3 / 4.2 }} />
          <View style={{ flex: 1, gap: 10 }}>
            {/* Title */}
            <ShimmerBox w="90%" h={16} borderRadius={4} />
            <ShimmerBox w="70%" h={16} borderRadius={4} />
            {/* Meta */}
            <ShimmerBox w="45%" h={11} borderRadius={4} />
            {/* Genre chips */}
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              <ShimmerBox w={50} h={20} borderRadius={10} />
              <ShimmerBox w={60} h={20} borderRadius={10} />
              <ShimmerBox w={44} h={20} borderRadius={10} />
            </View>
            {/* Synopsis lines */}
            <ShimmerBox w="100%" h={10} borderRadius={4} />
            <ShimmerBox w="85%" h={10} borderRadius={4} />
          </View>
        </View>
      </View>
    </View>
  );
}
