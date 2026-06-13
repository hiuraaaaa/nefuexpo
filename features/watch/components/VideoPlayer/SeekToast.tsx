import React from 'react';
import { Text, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const SEEK_SEC = 10;

export function SeekToast({ direction, visible }: { direction: 'left' | 'right'; visible: boolean }) {
  if (!visible) return null;
  return (
    <Animated.View
      entering={FadeIn.duration(100)} exiting={FadeOut.duration(200)}
      style={{ position: 'absolute', [direction === 'left' ? 'left' : 'right']: width * 0.05, top: '35%', alignItems: 'center', gap: 4, overflow: 'hidden', borderRadius: 10 }}
    >
      <BlurView intensity={60} tint="dark" style={{ paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center', gap: 4 }}>
        <Ionicons name={direction === 'left' ? 'play-back' : 'play-forward'} size={22} color="#fff" />
        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{direction === 'left' ? `-${SEEK_SEC}s` : `+${SEEK_SEC}s`}</Text>
      </BlurView>
    </Animated.View>
  );
}
