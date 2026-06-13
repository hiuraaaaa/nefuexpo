import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { VideoView, isPictureInPictureSupported } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { COLORS } from '@/constants';
import { Episode, Server } from '@/types';
import { SeekToast } from './SeekToast';
import { PlayerTopBar } from './PlayerTopBar';
import { PlayerBottomBar } from './PlayerBottomBar';
import { IconPrev, IconNext, IconPlay, IconPause } from '../shared/Icons';

const { width } = Dimensions.get('window');

interface Props {
  player: any;
  selectedServer: Server | null;
  isEpLoading: boolean;
  isBuffering: boolean;
  isPlaying: boolean;
  isFullscreen: boolean;
  showControls: boolean;
  seekLeft: boolean;
  seekRight: boolean;
  controlsStyle: any;
  position: number;
  duration: number;
  selectedQuality: string;
  pipEnabled: boolean;
  infoEnabled: boolean;
  insetTop: number;
  title: string;
  currentEpNum: number;
  isFavorited: boolean;
  epIndex: number;
  episodesLength: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  resetControlsTimer: () => void;
  togglePlayPause: () => void;
  toggleFullscreen: () => void;
  handleTapLeft: () => void;
  handleTapRight: () => void;
  handlePrev: () => void;
  handleNext: () => void;
  onBack: () => void;
  onBookmark: () => void;
  onQualityPress: () => void;
  onSlidingComplete: (val: number) => void;
}

export function VideoPlayer({
  player, selectedServer, isEpLoading, isBuffering, isPlaying,
  isFullscreen, showControls, seekLeft, seekRight, controlsStyle,
  position, duration, selectedQuality, pipEnabled, infoEnabled,
  insetTop, title, currentEpNum, isFavorited,
  canGoPrev, canGoNext,
  resetControlsTimer, togglePlayPause, toggleFullscreen,
  handleTapLeft, handleTapRight, handlePrev, handleNext,
  onBack, onBookmark, onQualityPress, onSlidingComplete,
}: Props) {
  const videoRef    = useRef<VideoView>(null);
  const pipSupported = isPictureInPictureSupported();
  const videoHeight  = isFullscreen ? Dimensions.get('window').height : width * (9 / 16);

  return (
    <View style={{ width: '100%', height: videoHeight, backgroundColor: '#000', marginTop: isFullscreen ? 0 : insetTop }}>
      {selectedServer && !isEpLoading ? (
        <VideoView
          ref={videoRef}
          player={player}
          style={{ width: '100%', height: '100%' }}
          contentFit="contain"
          nativeControls={false}
          allowsFullscreen
          allowsPictureInPicture={pipEnabled}
          startsPictureInPictureAutomatically={false}
        />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={COLORS.gold} size="large" />
          <Text style={{ color: COLORS.gold, fontSize: 12, marginTop: 10, fontWeight: '700' }}>
            {isEpLoading ? 'Memuat episode...' : 'Video tidak tersedia'}
          </Text>
        </View>
      )}

      {isBuffering && !isEpLoading && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <ActivityIndicator color={COLORS.gold} size="large" />
        </View>
      )}

      <TouchableOpacity activeOpacity={1} onPress={handleTapLeft}      style={{ position: 'absolute', top: 0, left: 0, width: '40%', bottom: 0 }} />
      <TouchableOpacity activeOpacity={1} onPress={resetControlsTimer} style={{ position: 'absolute', top: 0, left: '40%', width: '20%', bottom: 0 }} />
      <TouchableOpacity activeOpacity={1} onPress={handleTapRight}     style={{ position: 'absolute', top: 0, right: 0, width: '40%', bottom: 0 }} />

      <SeekToast direction="left"  visible={seekLeft}  />
      <SeekToast direction="right" visible={seekRight} />

      {selectedServer && !isEpLoading && (
        <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, controlsStyle]} pointerEvents={showControls ? 'box-none' : 'none'}>
          <LinearGradient colors={['rgba(0,0,0,0.7)', 'transparent']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80 }} pointerEvents="none" />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 90 }} pointerEvents="none" />

          <PlayerTopBar
            title={title}
            currentEpNum={currentEpNum}
            isFullscreen={isFullscreen}
            isFavorited={isFavorited}
            infoEnabled={infoEnabled}
            onBack={onBack}
            onBookmark={onBookmark}
          />

          {/* Center controls */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 36 }} pointerEvents="box-none">
            <TouchableOpacity onPress={() => { handlePrev(); resetControlsTimer(); }} disabled={!canGoPrev}
              style={{ opacity: canGoPrev ? 1 : 0.25, width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }}>
              <IconPrev color={COLORS.gold} size={26} />
            </TouchableOpacity>
            <TouchableOpacity onPress={togglePlayPause} style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' }}>
              {isPlaying ? <IconPause size={26} /> : <IconPlay size={26} />}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { handleNext(); resetControlsTimer(); }} disabled={!canGoNext}
              style={{ opacity: canGoNext ? 1 : 0.25, width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }}>
              <IconNext color={COLORS.gold} size={26} />
            </TouchableOpacity>
          </View>

          <PlayerBottomBar
            position={position}
            duration={duration}
            selectedQuality={selectedQuality}
            isFullscreen={isFullscreen}
            pipEnabled={pipEnabled}
            pipSupported={pipSupported}
            videoRef={videoRef}
            player={player}
            onSlidingComplete={onSlidingComplete}
            onQualityPress={onQualityPress}
            onFullscreen={toggleFullscreen}
            onPip={() => {}}
            resetControlsTimer={resetControlsTimer}
          />
        </Animated.View>
      )}
    </View>
  );
}
