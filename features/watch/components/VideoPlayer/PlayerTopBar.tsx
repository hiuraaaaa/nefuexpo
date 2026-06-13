import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '@/constants';
import { Clock } from '../shared/Clock';
import { BatteryIndicator } from '../shared/BatteryIndicator';

interface Props {
  title: string;
  currentEpNum: number;
  isFullscreen: boolean;
  isFavorited: boolean;
  infoEnabled: boolean;
  onBack: () => void;
  onBookmark: () => void;
}

export function PlayerTopBar({ title, currentEpNum, isFullscreen, isFavorited, infoEnabled, onBack, onBookmark }: Props) {
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 12, paddingTop: 10, gap: 6 }}>
      {infoEnabled && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Clock />
          <BatteryIndicator />
        </View>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onBack(); }}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}
        >
          <View style={{ width: 0, height: 0, borderTopWidth: 7, borderBottomWidth: 7, borderRightWidth: 10, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: '#fff', marginRight: 2 }} />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13, flex: 1 }} numberOfLines={1}>
          {title}
          <Text style={{ color: COLORS.gold, fontWeight: '900' }}>  Eps {currentEpNum}</Text>
        </Text>
        <TouchableOpacity
          onPress={onBookmark}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name={isFavorited ? 'bookmark' : 'bookmark-outline'} size={18} color={COLORS.gold} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
