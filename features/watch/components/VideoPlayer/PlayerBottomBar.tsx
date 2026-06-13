import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
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
  return (
    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 12, paddingBottom: 10 }}>
      <Slider
        style={{ width: '100%', height: 20 }}
        minimumValue={0}
        maximumValue={duration > 0 ? duration : 1}
        value={Math.min(position, duration > 0 ? duration : 1)}
        minimumTrackTintColor={COLORS.gold}
        maximumTrackTintColor="rgba(255,255,255,0.25)"
        thumbTintColor={COLORS.gold}
        onSlidingComplete={val => { onSlidingComplete(val); resetControlsTimer(); }}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>
          {formatTime(position)}
          <Text style={{ color: 'rgba(255,255,255,0.4)' }}> / </Text>
          {duration > 0 ? formatTime(duration) : '--:--'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          {pipEnabled && pipSupported && (
            <TouchableOpacity
              onPress={() => { Haptics.selectionAsync(); videoRef.current?.startPictureInPicture(); resetControlsTimer(); }}
              style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="tablet-portrait-outline" size={20} color="#fff" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => { Haptics.selectionAsync(); onQualityPress(); resetControlsTimer(); }}
            style={{ overflow: 'hidden', borderRadius: 6 }}
          >
            <BlurView intensity={50} tint="dark" style={{ paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: `${COLORS.gold}90`, borderRadius: 6 }}>
              <Text style={{ color: COLORS.gold, fontSize: 11, fontWeight: '900' }}>{selectedQuality || 'AUTO'}</Text>
            </BlurView>
          </TouchableOpacity>
          <TouchableOpacity onPress={onFullscreen} style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
            <IconFullscreen exit={isFullscreen} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
