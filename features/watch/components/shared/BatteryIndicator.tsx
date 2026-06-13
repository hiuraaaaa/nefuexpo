import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBatteryLevel, useBatteryState, BatteryState } from 'expo-battery';

export function BatteryIndicator() {
  const level = useBatteryLevel();
  const state = useBatteryState();
  const isCharging = state === BatteryState.CHARGING || state === BatteryState.FULL;
  const pct        = level !== null ? Math.round(level * 100) : null;
  const color      = isCharging ? '#4ade80' : pct !== null && pct <= 20 ? '#e63946' : 'rgba(255,255,255,0.75)';
  const iconName   = isCharging ? 'battery-charging'
    : pct !== null && pct > 80 ? 'battery-full'
    : pct !== null && pct > 50 ? 'battery-half'
    : pct !== null && pct > 20 ? 'battery-low'
    : 'battery-dead';
  if (pct === null) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      <Ionicons name={iconName as any} size={14} color={color} />
      <Text style={{ color, fontSize: 11, fontWeight: '700' }}>{pct}%{isCharging ? ' ⚡' : ''}</Text>
    </View>
  );
}
