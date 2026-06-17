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
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 14, paddingTop: 10, gap: 6 }}>
      {infoEnabled && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Clock />
          <BatteryIndicator />
        </View>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>

        {/* Back — lebih besar, bukan circle */}
        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onBack(); }}
          style={{ paddingVertical: 6, paddingRight: 10, justifyContent: 'center' }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {/* Custom arrow — tebal, bukan icon library */}
          <View style={{ width: 20, height: 20, justifyContent: 'center' }}>
            <View style={{
              width: 12, height: 2.5, backgroundColor: '#fff',
              borderRadius: 2, transform: [{ rotate: '-45deg' }, { translateY: 3 }],
            }} />
            <View style={{
              width: 12, height: 2.5, backgroundColor: '#fff',
              borderRadius: 2, transform: [{ rotate: '45deg' }, { translateY: -3 }],
            }} />
          </View>
        </TouchableOpacity>

        {/* Title block — asimetris, ep num di atas */}
        <View style={{ flex: 1, gap: 1 }}>
          <Text style={{
            color: COLORS.gold,
            fontSize: 9,
            fontWeight: '900',
            letterSpacing: 2,
            textTransform: 'uppercase',
            opacity: 0.9,
          }}>
            EPS {currentEpNum}
          </Text>
          <Text
            style={{ color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 0.1 }}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>

        {/* Nobar + Bookmark — dikecilkan, cluster kanan */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onNobar(); }}
            style={{
              width: 32, height: 32, borderRadius: 8,
              backgroundColor: isInRoom ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.08)',
              alignItems: 'center', justifyContent: 'center',
              borderWidth: isInRoom ? 1 : 0, borderColor: '#4ade80',
            }}
          >
            <Ionicons name="people-outline" size={16} color={isInRoom ? '#4ade80' : 'rgba(255,255,255,0.7)'} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onBookmark}
            style={{
              width: 32, height: 32, borderRadius: 8,
              backgroundColor: isFavorited ? `${COLORS.gold}20` : 'rgba(255,255,255,0.08)',
              alignItems: 'center', justifyContent: 'center',
              borderWidth: isFavorited ? 1 : 0, borderColor: COLORS.gold,
            }}
          >
            <Ionicons name={isFavorited ? 'bookmark' : 'bookmark-outline'} size={16} color={COLORS.gold} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
