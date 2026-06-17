import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { VideoView, isPictureInPictureSupported } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import Reanimated from 'react-native-reanimated';
import { COLORS } from '@/constants';
import { Server } from '@/types';
import { SeekToast } from './SeekToast';
import { PlayerTopBar } from './PlayerTopBar';
import { PlayerBottomBar } from './PlayerBottomBar';
import { EpisodeTransition } from './EpisodeTransition';
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
  isInRoom: boolean;
  epIndex: number;
  episodesLength: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  resetControlsTimer: () => void;
  toggleControls: () => void;
  togglePlayPause: () => void;
  toggleFullscreen: () => void;
  handleTapLeft: () => void;
  handleTapRight: () => void;
  handlePrev: () => void;
  handleNext: () => void;
  onBack: () => void;
  onBookmark: () => void;
  onNobar: () => void;
  onQualityPress: () => void;
  onSlidingComplete: (val: number) => void;
}

type FitMode = 'contain' | 'cover';

export function VideoPlayer({
  player, selectedServer, isEpLoading, isBuffering, isPlaying,
  isFullscreen, showControls, seekLeft, seekRight, controlsStyle,
  position, duration, selectedQuality, pipEnabled, infoEnabled,
  insetTop, title, currentEpNum, isFavorited, isInRoom,
  canGoPrev, canGoNext,
  resetControlsTimer, toggleControls, togglePlayPause, toggleFullscreen,
  handleTapLeft, handleTapRight, handlePrev, handleNext,
  onBack, onBookmark, onNobar, onQualityPress, onSlidingComplete,
}: Props) {
  const videoRef     = useRef<VideoView>(null);
  const pipSupported = isPictureInPictureSupported();
  const videoHeight  = isFullscreen ? Dimensions.get('window').height : width * (9 / 16);

  const [fitMode, setFitMode]           = useState<FitMode>('contain');
  const [showTransition, setShowTransition] = useState(false);

  // Track server link untuk detect ganti episode
  const prevLinkRef = useRef<string | null>(null);

  useEffect(() => {
    const newLink = selectedServer?.link ?? null;
    if (newLink && newLink !== prevLinkRef.current) {
      // Trigger transition
      setShowTransition(true);
      const timer = setTimeout(() => setShowTransition(false), 900);
      prevLinkRef.current = newLink;
      return () => clearTimeout(timer);
    }
  }, [selectedServer?.link]);

  const toggleFit = () => {
    setFitMode(p => p === 'contain' ? 'cover' : 'contain');
    resetControlsTimer();
  };

  return (
    <View style={{ width: '100%', height: videoHeight, backgroundColor: '#000', marginTop: isFullscreen ? 0 : insetTop }}>

      {/* Video */}
      {selectedServer && !isEpLoading ? (
        <VideoView
          ref={videoRef}
          player={player}
          style={{ width: '100%', height: '100%' }}
          contentFit={fitMode}
          nativeControls={false}
          allowsFullscreen
          allowsPictureInPicture={pipEnabled}
          startsPictureInPictureAutomatically={false}
        />
      ) : (
        // Loading state awal (sebelum server ready) — minimal
        <View style={{ flex: 1 }} />
      )}

      {/* Buffering indicator — horizontal bar tipis di atas, bukan spinner */}
      {isBuffering && !isEpLoading && !showTransition && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 2, pointerEvents: 'none',
          overflow: 'hidden',
        }}>
          <Animated.View style={{
            position: 'absolute', top: 0, bottom: 0,
            width: '40%',
            backgroundColor: COLORS.gold,
            opacity: 0.85,
          }} />
        </View>
      )}

      {/* Episode transition overlay — flash hitam + logo */}
      <EpisodeTransition visible={showTransition || isEpLoading} />

      {/* Tap zones */}
      <TouchableOpacity activeOpacity={1} onPress={handleTapLeft}  style={{ position: 'absolute', top: 0, left: 0, width: '40%', bottom: 0 }} />
      <TouchableOpacity activeOpacity={1} onPress={toggleControls} style={{ position: 'absolute', top: 0, left: '40%', width: '20%', bottom: 0 }} />
      <TouchableOpacity activeOpacity={1} onPress={handleTapRight} style={{ position: 'absolute', top: 0, right: 0, width: '40%', bottom: 0 }} />

      <SeekToast direction="left"  visible={seekLeft}  />
      <SeekToast direction="right" visible={seekRight} />

      {selectedServer && !isEpLoading && (
        <Reanimated.View
          style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, controlsStyle]}
          pointerEvents={showControls ? 'box-none' : 'none'}
        >
          {/* Gradient top */}
          <LinearGradient
            colors={['rgba(0,0,0,0.75)', 'transparent']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 90 }}
            pointerEvents="none"
          />
          {/* Gradient bottom */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.85)']}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 }}
            pointerEvents="none"
          />

          <PlayerTopBar
            title={title}
            currentEpNum={currentEpNum}
            isFullscreen={isFullscreen}
            isFavorited={isFavorited}
            infoEnabled={infoEnabled}
            isInRoom={isInRoom}
            onBack={onBack}
            onBookmark={onBookmark}
            onNobar={onNobar}
          />

          {/* Fit toggle — pojok kanan atas, di bawah top bar, minimal */}
          <TouchableOpacity
            onPress={toggleFit}
            style={{
              position: 'absolute', top: 50, right: 14,
              flexDirection: 'row', alignItems: 'center', gap: 4,
              opacity: fitMode === 'cover' ? 1 : 0.45,
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={{
              color: fitMode === 'cover' ? COLORS.gold : '#fff',
              fontSize: 9, fontWeight: '900',
              letterSpacing: 1.5, textTransform: 'uppercase',
            }}>
              {fitMode === 'cover' ? 'FULL' : 'FIT'}
            </Text>
          </TouchableOpacity>

          {/* Center controls — asimetris: prev < play > next */}
          <View style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 40,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0,
          }} pointerEvents="box-none">

            {/* Prev — lebih kecil */}
            <TouchableOpacity
              onPress={() => { handlePrev(); resetControlsTimer(); }}
              disabled={!canGoPrev}
              style={{
                opacity: canGoPrev ? 1 : 0.2,
                width: 56, height: 56,
                alignItems: 'center', justifyContent: 'center',
                marginRight: 8,
              }}
            >
              <IconPrev color="rgba(255,255,255,0.85)" size={22} />
            </TouchableOpacity>

            {/* Play/Pause — dominan, sedikit offset ke kiri dari benar-benar center */}
            <TouchableOpacity
              onPress={togglePlayPause}
              style={{
                width: 68, height: 68,
                borderRadius: 34,
                backgroundColor: 'rgba(255,255,255,0.12)',
                borderWidth: 1.5,
                borderColor: 'rgba(255,255,255,0.5)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 8,
              }}
            >
              {isPlaying
                ? <IconPause size={24} />
                : <IconPlay  size={24} />
              }
            </TouchableOpacity>

            {/* Next — lebih besar dari prev */}
            <TouchableOpacity
              onPress={() => { handleNext(); resetControlsTimer(); }}
              disabled={!canGoNext}
              style={{
                opacity: canGoNext ? 1 : 0.2,
                width: 64, height: 64,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <IconNext color="#fff" size={28} />
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
        </Reanimated.View>
      )}
    </View>
  );
}
