import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { getLevelData, LEVELS } from '@/hooks/xp';
import { COLORS } from '@/constants';

const LEVEL_COLORS = [
  '#9ca3af','#60a5fa','#34d399','#a78bfa',
  '#f59e0b','#f97316','#ef4444','#ec4899',
];

export function XPBar({ xp }: { xp: number }) {
  const { current, next, progress } = getLevelData(xp);
  const color = LEVEL_COLORS[current.level - 1];
  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animWidth, {
      toValue: progress,
      useNativeDriver: false,
      tension: 50,
      friction: 10,
    }).start();
  }, [progress]);

  return (
    <View style={styles.wrapper}>
      {/* Label atas */}
      <View style={styles.row}>
        <Text style={styles.label}>
          {current.title}
          {next ? ` → ${next.title}` : ' (MAX)'}
        </Text>
        <Text style={[styles.xpText, { color }]}>
          {xp} XP
        </Text>
      </View>

      {/* Bar */}
      <View style={styles.track}>
        <Animated.View style={[
          styles.fill,
          {
            backgroundColor: color,
            width: animWidth.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
            shadowColor: color,
          }
        ]} />
      </View>

      {/* Label bawah */}
      {next && (
        <Text style={styles.nextLabel}>
          {next.min - xp} XP lagi ke {next.title}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600' },
  xpText: { fontSize: 12, fontWeight: '800' },
  track: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  nextLabel: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 10,
    fontWeight: '500',
  },
});
