import { useState, useEffect, useRef, useCallback } from 'react';
import { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'react-native';
import type { VideoPlayer } from 'expo-video';

const SEEK_SEC = 10;

export function usePlayerSync(player: VideoPlayer | null, onPlayToEnd: () => void) {
  const [isPlaying, setIsPlaying]     = useState(false);
  const [position, setPosition]       = useState(0);
  const [duration, setDuration]       = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [seekLeft, setSeekLeft]       = useState(false);
  const [seekRight, setSeekRight]     = useState(false);

  const controlsTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seekLeftTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seekRightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapLeft    = useRef(0);
  const lastTapRight   = useRef(0);
  const durationPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const controlsOpacity = useSharedValue(1);
  const controlsStyle   = useAnimatedStyle(() => ({ opacity: controlsOpacity.value }));

  // Poll duration
  useEffect(() => {
    if (durationPollRef.current) clearInterval(durationPollRef.current);
    if (!player) return;
    durationPollRef.current = setInterval(() => {
      const dur = player.duration ?? 0;
      if (dur > 0 && isFinite(dur)) {
        setDuration(dur);
        clearInterval(durationPollRef.current!);
        durationPollRef.current = null;
      }
    }, 500);
    return () => { if (durationPollRef.current) clearInterval(durationPollRef.current); };
  }, [player]);

  // Reset duration when player changes
  useEffect(() => {
    setDuration(0);
    setPosition(0);
    setIsPlaying(false);
  }, [player]);

  // Player listeners
  useEffect(() => {
    if (!player) return;
    const statusSub   = player.addListener('statusChange', ({ status }) => setIsBuffering(status === 'loading'));
    const playingSub  = player.addListener('playingChange', ({ isPlaying: p }) => setIsPlaying(p));
    const durationSub = player.addListener('durationChange' as any, ({ duration: dur }: { duration: number }) => {
      if (dur && dur > 0 && isFinite(dur)) setDuration(dur);
    });
    const timeSub = player.addListener('timeUpdate', ({ currentTime }) => {
      setPosition(currentTime);
      const dur = player.duration ?? 0;
      if (dur > 0 && isFinite(dur)) setDuration(dur);
    });
    const endSub = player.addListener('playToEnd', onPlayToEnd);
    return () => { statusSub.remove(); playingSub.remove(); durationSub.remove(); timeSub.remove(); endSub.remove(); };
  }, [player, onPlayToEnd]);

  useEffect(() => {
    controlsOpacity.value = withTiming(showControls ? 1 : 0, { duration: 250 });
  }, [showControls]);

  useEffect(() => {
    if (isPlaying) activateKeepAwakeAsync();
    else deactivateKeepAwake();
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (controlsTimer.current)  clearTimeout(controlsTimer.current);
      if (seekLeftTimer.current)  clearTimeout(seekLeftTimer.current);
      if (seekRightTimer.current) clearTimeout(seekRightTimer.current);
      if (durationPollRef.current) clearInterval(durationPollRef.current);
      deactivateKeepAwake();
    };
  }, []);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 3500);
  }, []);

  const togglePlayPause = useCallback(() => {
    if (!player) return;
    if (isPlaying) player.pause(); else player.play();
    resetControlsTimer();
  }, [isPlaying, player, resetControlsTimer]);

  const toggleFullscreen = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isFullscreen) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      setIsFullscreen(false);
      StatusBar.setHidden(false);
    } else {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      setIsFullscreen(true);
      StatusBar.setHidden(true);
    }
  }, [isFullscreen]);

  const handleTapLeft = useCallback(() => {
    const now = Date.now();
    if (now - lastTapLeft.current < 300) {
      if (player) player.seekBy(-SEEK_SEC);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSeekLeft(true);
      if (seekLeftTimer.current) clearTimeout(seekLeftTimer.current);
      seekLeftTimer.current = setTimeout(() => setSeekLeft(false), 800);
      resetControlsTimer();
    } else { resetControlsTimer(); }
    lastTapLeft.current = now;
  }, [player, resetControlsTimer]);

  const handleTapRight = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRight.current < 300) {
      if (player) player.seekBy(SEEK_SEC);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSeekRight(true);
      if (seekRightTimer.current) clearTimeout(seekRightTimer.current);
      seekRightTimer.current = setTimeout(() => setSeekRight(false), 800);
      resetControlsTimer();
    } else { resetControlsTimer(); }
    lastTapRight.current = now;
  }, [player, resetControlsTimer]);

  return {
    isPlaying, position, duration, isBuffering,
    isFullscreen, showControls, seekLeft, seekRight,
    controlsStyle, resetControlsTimer,
    togglePlayPause, toggleFullscreen,
    handleTapLeft, handleTapRight,
  };
}
