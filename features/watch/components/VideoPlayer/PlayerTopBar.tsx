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
  isInRoom: boolean;
  onBack: () => void;
  onBookmark: () => void;
  onNobar: () => void;
}

export function PlayerTopBar({ title, currentEpNum, isFullscreen, isFavorited, infoEnabled, isInRoom, onBack, onBookmark, onNobar }: Props) {
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 12, paddingTop: 10, gap: 6 }}>
      {infoEnabled && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Clock />
          <BatteryIndicator />
        </View>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {/* Back */}
        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onBack(); }}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}
        >
          <View style={{ width: 0, height: 0, borderTopWidth: 7, borderBottomWidth: 7, borderRightWidth: 10, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: '#fff', marginRight: 2 }} />
        </TouchableOpacity>

        {/* Title */}
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13, flex: 1 }} numberOfLines={1}>
          {title}
          <Text style={{ color: COLORS.gold, fontWeight: '900' }}>  Eps {currentEpNum}</Text>
        </Text>

        {/* Nobar button */}
        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onNobar(); }}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isInRoom ? '#4ade8030' : 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', borderWidth: isInRoom ? 1 : 0, borderColor: '#4ade80' }}
        >
          <Ionicons name="people-outline" size={18} color={isInRoom ? '#4ade80' : 'rgba(255,255,255,0.8)'} />
        </TouchableOpacity>

        {/* Bookmark */}
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
