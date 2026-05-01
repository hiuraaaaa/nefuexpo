import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '@/constants';

const { width } = Dimensions.get('window');

// Core shimmer animation — satu komponen, dipakai semua skeleton
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
        duration: 1400,
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
          backgroundColor: '#16161a',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          ...StyleSheet.absoluteFillObject,
          transform: [{ translateX }, { skewX: '-20deg' }],
          background: 'transparent',
        }}
      >
        {/* Shimmer gradient strip */}
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(255,255,255,0.04)',
            width: 80,
          }}
        />
      </Animated.View>
    </View>
  );
}

// Card skeleton — buat grid anime
export function CardSkeleton() {
  return (
    <View style={{ flex: 1 }}>
      <ShimmerBox w="100%" h={0} borderRadius={4}
        style={{ aspectRatio: 3 / 4.5 }} />
      <ShimmerBox w="70%" h={8} borderRadius={3} style={{ marginTop: 6 }} />
    </View>
  );
}

// Hero skeleton — buat carousel home
export function HeroSkeleton() {
  return (
    <View style={{ width: '100%', aspectRatio: 16 / 10, backgroundColor: COLORS.card }}>
      <ShimmerBox w="100%" h="100%" borderRadius={0} />
      <View style={{ position: 'absolute', bottom: 24, left: 16, right: 16, flexDirection: 'row', gap: 12, alignItems: 'flex-end' }}>
        <ShimmerBox w={80} h={0} borderRadius={8} style={{ aspectRatio: 3 / 4.2 }} />
        <View style={{ flex: 1, gap: 8 }}>
          <ShimmerBox w="40%" h={10} borderRadius={4} />
          <ShimmerBox w="80%" h={20} borderRadius={4} />
          <ShimmerBox w="60%" h={14} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}

// Horizontal card skeleton — buat section ongoing/today
export function HorizontalCardSkeleton() {
  return (
    <View style={{ width: 100, marginRight: 10 }}>
      <ShimmerBox w={100} h={0} borderRadius={4} style={{ aspectRatio: 3 / 4.5 }} />
      <ShimmerBox w={70} h={8} borderRadius={3} style={{ marginTop: 6 }} />
    </View>
  );
}

// Top 10 list item skeleton
export function RankSkeleton() {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 16,
      backgroundColor: COLORS.card, borderRadius: 16,
      padding: 16, marginBottom: 12,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
      height: 80,
    }}>
      <ShimmerBox w={40} h={40} borderRadius={20} />
      <View style={{ flex: 1, gap: 8 }}>
        <ShimmerBox w="70%" h={12} borderRadius={4} />
        <ShimmerBox w="40%" h={8} borderRadius={4} />
      </View>
    </View>
  );
}

// Schedule card skeleton
export function ScheduleCardSkeleton() {
  return (
    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
      <ShimmerBox w={44} h={12} borderRadius={4} style={{ marginTop: 20 }} />
      <View style={{ width: 16, alignItems: 'center', paddingTop: 20 }}>
        <ShimmerBox w={8} h={8} borderRadius={4} />
      </View>
      <View style={{ flex: 1, backgroundColor: COLORS.card, borderRadius: 16,
        padding: 12, flexDirection: 'row', gap: 12,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
        <ShimmerBox w={64} h={0} borderRadius={8} style={{ aspectRatio: 3 / 4 }} />
        <View style={{ flex: 1, gap: 8, paddingTop: 4 }}>
          <ShimmerBox w="50%" h={10} borderRadius={4} />
          <ShimmerBox w="90%" h={14} borderRadius={4} />
          <ShimmerBox w="70%" h={14} borderRadius={4} />
          <ShimmerBox w="40%" h={10} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}

// Watch page skeleton
export function WatchSkeleton() {
  return (
    <View>
      <ShimmerBox w="100%" h={0} borderRadius={0} style={{ aspectRatio: 16 / 9 }} />
      <View style={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <ShimmerBox w="48%" h={48} borderRadius={12} />
          <ShimmerBox w="48%" h={48} borderRadius={12} />
        </View>
        <ShimmerBox w="100%" h={48} borderRadius={12} />
        <View style={{ backgroundColor: COLORS.card, borderRadius: 12, padding: 16, gap: 12,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
          <ShimmerBox w="40%" h={12} borderRadius={4} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {[...Array(12)].map((_, i) => (
              <ShimmerBox key={i} w={44} h={44} borderRadius={6} />
            ))}
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 16, backgroundColor: COLORS.card,
          borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
          <ShimmerBox w={100} h={0} borderRadius={8} style={{ aspectRatio: 3 / 4.2 }} />
          <View style={{ flex: 1, gap: 10 }}>
            <ShimmerBox w="80%" h={18} borderRadius={4} />
            <ShimmerBox w="50%" h={12} borderRadius={4} />
            <ShimmerBox w="100%" h={10} borderRadius={4} />
            <ShimmerBox w="100%" h={10} borderRadius={4} />
            <ShimmerBox w="75%" h={10} borderRadius={4} />
          </View>
        </View>
      </View>
    </View>
  );
}
