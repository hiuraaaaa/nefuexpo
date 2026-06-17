import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '@/constants';
import { formatTime } from '@/hooks/api/api';
import { IconFullscreen } from '../shared/Icons';
import type { VideoView } from 'expo-video';

interface Props {
  position: number;
  duration: number;
  selectedQuality: string;
  isFullscreen: boolean;
  pipEnabled: boolean;
  pipSupported: boolean;
  videoRef: React.RefObject<VideoView>;
  player: any;
  onSlidingComplete: (val: number) => void;
  onQualityPress: () => void;
  onFullscreen: () => void;
  onPip: () => void;
  resetControlsTimer: () => void;
}

export function PlayerBottomBar({
  position, duration, selectedQuality, isFullscreen,
  pipEnabled, pipSupported, videoRef, player,
  onSlidingComplete, onQualityPress, onFullscreen, onPip, resetControlsTimer,
}: Props) {
  const [scrubbing, setScrubbing] = useState(false);
  const [scrubVal, setScrubVal]   = useState(0);

  const BAR_H      = 3;
  const BAR_H_ACT  = 5;
  const THUMB_SIZE = 14;

  const progress = duration > 0
    ? Math.min((scrubbing ? scrubVal : position) / duration, 1)
    : 0;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder:  () => true,
    onPanResponderGrant: (e, gs) => {
      setScrubbing(true);
      resetControlsTimer();
    },
    onPanResponderMove: (e, gs) => {
      // width approximation — full width minus padding
      const barWidth = 280;
      const raw = Math.max(0, Math.min(1, gs.moveX / barWidth));
      setScrubVal(raw * duration);
    },
    onPanResponderRelease: (e, gs) => {
      onSlidingComplete(scrubVal);
      setScrubbing(false);
      resetControlsTimer();
    },
    onPanResponderTerminate: () => setScrubbing(false),
  });

  return (
    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 10 }}>

      {/* Progress bar — thick, menempel bottom, no horizontal padding */}
      <View
        style={{
          height: scrubbing ? BAR_H_ACT + 12 : BAR_H + 12,
          justifyContent: 'center',
          paddingHorizontal: 14,
        }}
        {...panResponder.panHandlers}
      >
        {/* Track background */}
        <View style={{
          height: scrubbing ? BAR_H_ACT : BAR_H,
          backgroundColor: 'rgba(255,255,255,0.15)',
          borderRadius: 99,
          overflow: 'hidden',
        }}>
          {/* Fill */}
          <View style={{
            height: '100%',
            width: `${progress * 100}%`,
            backgroundColor: COLORS.gold,
            borderRadius: 99,
          }} />
        </View>

        {/* Thumb — hanya muncul saat scrubbing */}
        {scrubbing && (
          <View style={{
            position: 'absolute',
            left: 14 + progress * (/* bar width approx */ 300 - THUMB_SIZE),
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            borderRadius: THUMB_SIZE / 2,
            backgroundColor: '#fff',
            shadowColor: '#000',
            shadowOpacity: 0.4,
            shadowRadius: 4,
            elevation: 4,
          }} />
        )}
      </View>

      {/* Bottom row */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 14,
        marginTop: -2,
      }}>
        {/* Timestamp — kiri, beda opacity */}
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
          <Text style={{
            color: '#fff', fontSize: 12, fontWeight: '700',
            fontVariant: ['tabular-nums'],
          }}>
            {formatTime(position)}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '500' }}>
            /
          </Text>
          <Text style={{
            color: 'rgba(255,255,255,0.35)', fontSize: 10,
            fontVariant: ['tabular-nums'],
          }}>
            {duration > 0 ? formatTime(duration) : '--:--'}
          </Text>
        </View>

        {/* Controls kanan */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          {pipEnabled && pipSupported && (
            <TouchableOpacity
              onPress={() => { Haptics.selectionAsync(); videoRef.current?.startPictureInPicture(); resetControlsTimer(); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="tablet-portrait-outline" size={18} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          )}

          {/* Quality — monospace, no background, accent color */}
          <TouchableOpacity
            onPress={() => { Haptics.selectionAsync(); onQualityPress(); resetControlsTimer(); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={{
              color: COLORS.gold,
              fontSize: 11,
              fontWeight: '900',
              letterSpacing: 0.5,
              fontVariant: ['tabular-nums'],
            }}>
              {selectedQuality || 'AUTO'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onFullscreen}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <IconFullscreen exit={isFullscreen} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
