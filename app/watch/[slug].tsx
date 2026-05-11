import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, Share, Dimensions, StatusBar,
  Modal, Alert, TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Video, ResizeMode, AVPlaybackStatus, Audio } from 'expo-av';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import FastImage from 'react-native-fast-image';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSequence, FadeIn, FadeOut,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, API_BASE } from '@/constants';
import { api, getAnimeSlug, decodeAnimeId, formatTime } from '@/hooks/api';
import { historyStorage, progressStorage, favoritStorage } from '@/hooks/storage';
import { xpStorage } from '@/hooks/xp';
import { AnimeDetail, Episode, Server, Anime } from '@/types';
import { WatchSkeleton } from '@/components/Skeleton';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUser } from '@/hooks/auth';

const { width } = Dimensions.get('window');
const PIP_KEY = 'nefusoft_pip';

// Episode grid — selalu pas, ga ada sisa kosong
const EP_COLS    = 6;
const EP_GAP     = 6;
const EP_PADDING = 16;
const EP_SIZE    = Math.floor((width - EP_PADDING * 2 - EP_GAP * (EP_COLS - 1)) / EP_COLS);

// Seek amount double tap
const SEEK_SEC = 10;

type ServerGroup = { [quality: string]: Server[] };

// ── Icons ──────────────────────────────────────────────────────────────────────

const IconPrev = ({ color = '#fff', size = 28 }: { color?: string; size?: number }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
    <View style={{ width: 3, height: size * 0.75, backgroundColor: color, borderRadius: 2 }} />
    <View style={{ flexDirection: 'row' }}>
      <View style={{ width: 0, height: 0,
        borderTopWidth: size * 0.4, borderBottomWidth: size * 0.4, borderRightWidth: size * 0.5,
        borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: color }} />
      <View style={{ width: 0, height: 0,
        borderTopWidth: size * 0.4, borderBottomWidth: size * 0.4, borderRightWidth: size * 0.5,
        borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: color,
        marginLeft: -size * 0.2 }} />
    </View>
  </View>
);

const IconNext = ({ color = '#fff', size = 28 }: { color?: string; size?: number }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
    <View style={{ flexDirection: 'row' }}>
      <View style={{ width: 0, height: 0,
        borderTopWidth: size * 0.4, borderBottomWidth: size * 0.4, borderLeftWidth: size * 0.5,
        borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: color }} />
      <View style={{ width: 0, height: 0,
        borderTopWidth: size * 0.4, borderBottomWidth: size * 0.4, borderLeftWidth: size * 0.5,
        borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: color,
        marginLeft: -size * 0.2 }} />
    </View>
    <View style={{ width: 3, height: size * 0.75, backgroundColor: color, borderRadius: 2 }} />
  </View>
);

const IconPlay = ({ size = 28 }: { size?: number }) => (
  <View style={{ width: 0, height: 0,
    borderTopWidth: size * 0.55, borderBottomWidth: size * 0.55, borderLeftWidth: size * 0.9,
    borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: '#fff',
    marginLeft: size * 0.2 }} />
);

const IconPause = ({ size = 28 }: { size?: number }) => (
  <View style={{ flexDirection: 'row', gap: size * 0.25 }}>
    <View style={{ width: size * 0.22, height: size * 0.9, backgroundColor: '#fff', borderRadius: 3 }} />
    <View style={{ width: size * 0.22, height: size * 0.9, backgroundColor: '#fff', borderRadius: 3 }} />
  </View>
);

const IconFullscreen = ({ exit = false }: { exit?: boolean }) => {
  const c = '#fff'; const s = 7; const t = 2;
  if (exit) return (
    <View style={{ width: 18, height: 18 }}>
      <View style={{ position: 'absolute', top: s-t, left: 0, width: s, height: t, backgroundColor: c }} />
      <View style={{ position: 'absolute', top: 0, left: s-t, width: t, height: s, backgroundColor: c }} />
      <View style={{ position: 'absolute', top: s-t, right: 0, width: s, height: t, backgroundColor: c }} />
      <View style={{ position: 'absolute', top: 0, right: s-t, width: t, height: s, backgroundColor: c }} />
      <View style={{ position: 'absolute', bottom: s-t, left: 0, width: s, height: t, backgroundColor: c }} />
      <View style={{ position: 'absolute', bottom: 0, left: s-t, width: t, height: s, backgroundColor: c }} />
      <View style={{ position: 'absolute', bottom: s-t, right: 0, width: s, height: t, backgroundColor: c }} />
      <View style={{ position: 'absolute', bottom: 0, right: s-t, width: t, height: s, backgroundColor: c }} />
    </View>
  );
  return (
    <View style={{ width: 18, height: 18 }}>
      <View style={{ position: 'absolute', top: 0, left: 0, width: s, height: t, backgroundColor: c }} />
      <View style={{ position: 'absolute', top: 0, left: 0, width: t, height: s, backgroundColor: c }} />
      <View style={{ position: 'absolute', top: 0, right: 0, width: s, height: t, backgroundColor: c }} />
      <View style={{ position: 'absolute', top: 0, right: 0, width: t, height: s, backgroundColor: c }} />
      <View style={{ position: 'absolute', bottom: 0, left: 0, width: s, height: t, backgroundColor: c }} />
      <View style={{ position: 'absolute', bottom: 0, left: 0, width: t, height: s, backgroundColor: c }} />
      <View style={{ position: 'absolute', bottom: 0, right: 0, width: s, height: t, backgroundColor: c }} />
      <View style={{ position: 'absolute', bottom: 0, right: 0, width: t, height: s, backgroundColor: c }} />
    </View>
  );
};

// ── Seek Toast ─────────────────────────────────────────────────────────────────

function SeekToast({ direction, visible }: { direction: 'left' | 'right'; visible: boolean }) {
  if (!visible) return null;
  return (
    <Animated.View
      entering={FadeIn.duration(100)}
      exiting={FadeOut.duration(200)}
      style={{
        position: 'absolute',
        [direction === 'left' ? 'left' : 'right']: width * 0.05,
        top: '35%',
        alignItems: 'center', gap: 4,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 16, paddingVertical: 10,
        borderRadius: 10,
      }}
    >
      <Ionicons
        name={direction === 'left' ? 'play-back' : 'play-forward'}
        size={22} color="#fff"
      />
      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
        {direction === 'left' ? `-${SEEK_SEC}s` : `+${SEEK_SEC}s`}
      </Text>
    </Animated.View>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function WatchScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const epParam  = useLocalSearchParams<{ ep?: string }>().ep;
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const videoRef = useRef<Video>(null);

  const animeId = decodeAnimeId(slug ?? '');

  const [anime, setAnime]                     = useState<AnimeDetail | null>(null);
  const [episodes, setEpisodes]               = useState<Episode[]>([]);
  const [filteredEps, setFilteredEps]         = useState<Episode[]>([]);
  const [epSearch, setEpSearch]               = useState('');
  const [currentEpId, setCurrentEpId]         = useState<string | null>(null);
  const [serverGroup, setServerGroup]         = useState<ServerGroup>({});
  const [selectedQuality, setSelectedQuality] = useState<string>('');
  const [selectedServer, setSelectedServer]   = useState<Server | null>(null);
  const [recommendations, setRecommendations] = useState<Anime[]>([]);
  const [isLoading, setIsLoading]             = useState(true);
  const [isEpLoading, setIsEpLoading]         = useState(false);
  const [isFullscreen, setIsFullscreen]       = useState(false);
  const [autoNext, setAutoNext]               = useState(false);
  const [showControls, setShowControls]       = useState(true);
  const [showServerModal, setShowServerModal] = useState(false);
  const [isFavorited, setIsFavorited]         = useState(false);

  const [isPlaying, setIsPlaying]     = useState(false);
  const [position, setPosition]       = useState(0);
  const [duration, setDuration]       = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);

  // Double tap seek toast
  const [seekLeft, setSeekLeft]   = useState(false);
  const [seekRight, setSeekRight] = useState(false);
  const seekLeftTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seekRightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Double tap detection
  const lastTapLeft  = useRef(0);
  const lastTapRight = useRef(0);

  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── PiP setup ────────────────────────────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(PIP_KEY).then(v => {
      Audio.setAudioModeAsync({
        staysActiveInBackground: v === 'true',
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
        allowsRecordingIOS: false,
        interruptionModeIOS: 0,
        interruptionModeAndroid: 1,
      }).catch(() => {});
    });
  }, []);

  // ── Load detail ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!animeId) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const [detailRes, recRes] = await Promise.all([
          api.detail(animeId),
          api.popular(),
        ]);
        if (detailRes.status && detailRes.data) {
          setAnime(detailRes.data);
          const eps = detailRes.data.episode_list || [];
          setEpisodes(eps);
          setFilteredEps(eps);
          const target = epParam
            ? eps.find(e => e.index.toString() === epParam)
            : eps[eps.length - 1];
          if (target) setCurrentEpId(target.id);
        }
        setRecommendations((recRes.data || []).slice(0, 5));
      } catch {}
      setIsLoading(false);
    };
    load();
  }, [animeId]);

  // ── Episode search filter ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!epSearch.trim()) {
      setFilteredEps(episodes);
    } else {
      setFilteredEps(episodes.filter(e =>
        String(e.index).includes(epSearch.trim())
      ));
    }
  }, [epSearch, episodes]);

  // ── Load episode servers + resume progress ────────────────────────────────────
  useEffect(() => {
    if (!currentEpId) return;
    const load = async () => {
      setIsEpLoading(true);
      setServerGroup({});
      setSelectedQuality('');
      setSelectedServer(null);
      setPosition(0);
      setIsPlaying(false);
      try {
        const res = await api.episode(currentEpId);
        if (res.status && res.data) {
          const allServers: Server[] = res.data.server || [];
          const group: ServerGroup = {};
          allServers.forEach((s: Server, i: number) => {
            const q = s.quality || 'AUTO';
            if (!group[q]) group[q] = [];
            group[q].push({ ...s, id: String(i) });
          });
          setServerGroup(group);
          const qualities = ['1080p', '720p', '480p', '360p'];
          const bestQ = qualities.find(q => group[q]?.length > 0) || Object.keys(group)[0];
          if (bestQ && group[bestQ]?.length > 0) {
            setSelectedQuality(bestQ);
            setSelectedServer(group[bestQ][0]);

            // Resume progress
            const saved = await progressStorage.get(currentEpId);
            if (saved && saved > 5) {
              setTimeout(() => videoRef.current?.setPositionAsync(saved * 1000), 800);
            }
          }
        }
      } catch {}
      setIsEpLoading(false);
    };
    load();
  }, [currentEpId]);

  // ── History & XP ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!anime || !currentEpId) return;
    const ep = episodes.find(e => e.id === currentEpId);
    if (ep) {
      historyStorage.add(anime, ep.index);
      xpStorage.add(10);
    }
  }, [currentEpId, anime]);

  // ── Favorit state ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!anime) return;
    favoritStorage.isFavorited(anime.id).then(setIsFavorited);
  }, [anime]);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 3500);
  }, []);

  const epIndex      = episodes.findIndex(e => e.id === currentEpId);
  const currentEpNum = episodes.find(e => e.id === currentEpId)?.index || 0;
  const availableQualities = Object.keys(serverGroup).filter(q => serverGroup[q]?.length > 0);

  const changeEpisode = (ep: Episode) => {
    setEpSearch('');
    setCurrentEpId(ep.id);
  };
  const handlePrev = () => { if (epIndex < episodes.length - 1) changeEpisode(episodes[epIndex + 1]); };
  const handleNext = () => { if (epIndex > 0) changeEpisode(episodes[epIndex - 1]); };

  const selectQualityAndServer = (quality: string, server: Server) => {
    const cur = position;
    setSelectedQuality(quality);
    setSelectedServer(server);
    setShowServerModal(false);
    setTimeout(() => videoRef.current?.setPositionAsync(cur * 1000), 300);
  };

  const togglePlayPause = () => {
    if (isPlaying) videoRef.current?.pauseAsync();
    else videoRef.current?.playAsync();
    resetControlsTimer();
  };

  const toggleFullscreen = async () => {
    if (isFullscreen) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      setIsFullscreen(false);
      StatusBar.setHidden(false);
    } else {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      setIsFullscreen(true);
      StatusBar.setHidden(true);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Tonton ${anime?.title || 'Anime'} di NefuSoft, Gratis & Tanpa Iklan!\nhttps://nefusoft.cloud`,
        title: 'NefuSoft',
      });
    } catch {}
  };

  const handleBookmark = async () => {
    if (!getCurrentUser()) {
      Alert.alert('Login Dulu', 'Login untuk menyimpan favorit');
      return;
    }
    if (!anime) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await favoritStorage.toggle(anime as any);
    setIsFavorited(result);
  };

  // ── Double tap seek ───────────────────────────────────────────────────────────
  const handleTapLeft = () => {
    const now = Date.now();
    if (now - lastTapLeft.current < 300) {
      // Double tap — mundur
      const newPos = Math.max(0, position - SEEK_SEC);
      videoRef.current?.setPositionAsync(newPos * 1000);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSeekLeft(true);
      if (seekLeftTimer.current) clearTimeout(seekLeftTimer.current);
      seekLeftTimer.current = setTimeout(() => setSeekLeft(false), 800);
      resetControlsTimer();
    } else {
      resetControlsTimer();
    }
    lastTapLeft.current = now;
  };

  const handleTapRight = () => {
    const now = Date.now();
    if (now - lastTapRight.current < 300) {
      // Double tap — maju
      const newPos = Math.min(duration, position + SEEK_SEC);
      videoRef.current?.setPositionAsync(newPos * 1000);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSeekRight(true);
      if (seekRightTimer.current) clearTimeout(seekRightTimer.current);
      seekRightTimer.current = setTimeout(() => setSeekRight(false), 800);
      resetControlsTimer();
    } else {
      resetControlsTimer();
    }
    lastTapRight.current = now;
  };

  // ── Playback status ───────────────────────────────────────────────────────────
  const handlePlaybackStatus = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setIsPlaying(status.isPlaying);
    setPosition(status.positionMillis / 1000);
    setDuration((status.durationMillis || 0) / 1000);
    setIsBuffering(status.isBuffering);
    if (status.didJustFinish && autoNext) handleNext();

    // Simpan progress tiap 5 detik saat playing
    if (status.isPlaying && currentEpId &&
      Math.floor(status.positionMillis / 1000) % 5 === 0) {
      progressStorage.save(
        currentEpId,
        status.positionMillis / 1000,
        (status.durationMillis || 0) / 1000,
      );
    }
  };

  const videoHeight = isFullscreen ? Dimensions.get('window').height : width * (9 / 16);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <WatchSkeleton />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar hidden={isFullscreen} barStyle="light-content" />

      {/* ── Server/Quality Modal ── */}
      <Modal visible={showServerModal} transparent animationType="slide"
        onRequestClose={() => setShowServerModal(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }}
          activeOpacity={1} onPress={() => setShowServerModal(false)}>
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0,
            backgroundColor: COLORS.card, borderTopLeftRadius: 16, borderTopRightRadius: 16,
            padding: 20, paddingBottom: 40 }}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14, marginBottom: 16,
              textTransform: 'uppercase', letterSpacing: 1 }}>
              Pilih Kualitas & Server
            </Text>
            {availableQualities.map(quality => (
              <View key={quality} style={{ marginBottom: 16 }}>
                <Text style={{ color: COLORS.gold, fontWeight: '900', fontSize: 12, marginBottom: 8 }}>
                  {quality}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {serverGroup[quality].map((s, idx) => {
                    const isActive = selectedServer?.id === s.id;
                    return (
                      <TouchableOpacity key={s.id} onPress={() => selectQualityAndServer(quality, s)}
                        style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8,
                          backgroundColor: isActive ? COLORS.gold : COLORS.bg,
                          borderWidth: 1, borderColor: isActive ? COLORS.gold : 'rgba(255,255,255,0.1)' }}>
                        <Text style={{ color: isActive ? '#000' : '#fff', fontWeight: '900', fontSize: 12 }}>
                          Server {idx + 1}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Video Player ── */}
      <View style={{ width: '100%', height: videoHeight, backgroundColor: '#000',
        marginTop: isFullscreen ? 0 : insets.top }}>

        {selectedServer && !isEpLoading ? (
          <Video
            ref={videoRef}
            source={{ uri: selectedServer.link }}
            style={{ width: '100%', height: '100%' }}
            resizeMode={ResizeMode.CONTAIN}
            useNativeControls={false}
            shouldPlay={false}
            onPlaybackStatusUpdate={handlePlaybackStatus}
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={COLORS.gold} size="large" />
            <Text style={{ color: COLORS.gold, fontSize: 12, marginTop: 10, fontWeight: '700' }}>
              {isEpLoading ? 'Memuat episode...' : 'Video tidak tersedia'}
            </Text>
          </View>
        )}

        {/* Buffering */}
        {isBuffering && !isEpLoading && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <ActivityIndicator color={COLORS.gold} size="large" />
          </View>
        )}

        {/* ── Double tap zones ── */}
        {/* Kiri — mundur */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleTapLeft}
          style={{ position: 'absolute', top: 0, left: 0, width: '40%', bottom: 0 }}
        />
        {/* Tengah — toggle controls */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={resetControlsTimer}
          style={{ position: 'absolute', top: 0, left: '40%', width: '20%', bottom: 0 }}
        />
        {/* Kanan — maju */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleTapRight}
          style={{ position: 'absolute', top: 0, right: 0, width: '40%', bottom: 0 }}
        />

        {/* Seek toast */}
        <SeekToast direction="left" visible={seekLeft} />
        <SeekToast direction="right" visible={seekRight} />

        {/* ── Controls Overlay ── */}
        {showControls && selectedServer && !isEpLoading && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            pointerEvents="box-none">

            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80,
              backgroundColor: 'rgba(0,0,0,0.55)' }} pointerEvents="none" />
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 90,
              backgroundColor: 'rgba(0,0,0,0.65)' }} pointerEvents="none" />

            {/* Top bar */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0,
              flexDirection: 'row', alignItems: 'center',
              paddingHorizontal: 12, paddingTop: 12, gap: 10 }}>
              <TouchableOpacity
                onPress={() => { if (isFullscreen) toggleFullscreen(); else router.back(); }}
                style={{ width: 36, height: 36, borderRadius: 18,
                  backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 0, height: 0,
                  borderTopWidth: 7, borderBottomWidth: 7, borderRightWidth: 10,
                  borderTopColor: 'transparent', borderBottomColor: 'transparent',
                  borderRightColor: '#fff', marginRight: 2 }} />
              </TouchableOpacity>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13, flex: 1 }} numberOfLines={1}>
                {anime?.title}
                <Text style={{ color: COLORS.gold, fontWeight: '900' }}>  Eps {currentEpNum}</Text>
              </Text>
              <TouchableOpacity onPress={handleBookmark}
                style={{ width: 36, height: 36, borderRadius: 18,
                  backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={isFavorited ? 'bookmark' : 'bookmark-outline'}
                  size={18} color={COLORS.gold} />
              </TouchableOpacity>
            </View>

            {/* Center controls */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 36 }}
              pointerEvents="box-none">
              <TouchableOpacity onPress={() => { handlePrev(); resetControlsTimer(); }}
                disabled={epIndex >= episodes.length - 1}
                style={{ opacity: epIndex >= episodes.length - 1 ? 0.25 : 1,
                  width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }}>
                <IconPrev color={COLORS.gold} size={26} />
              </TouchableOpacity>
              <TouchableOpacity onPress={togglePlayPause}
                style={{ width: 72, height: 72, borderRadius: 36,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)',
                  alignItems: 'center', justifyContent: 'center' }}>
                {isPlaying ? <IconPause size={26} /> : <IconPlay size={26} />}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { handleNext(); resetControlsTimer(); }}
                disabled={epIndex <= 0}
                style={{ opacity: epIndex <= 0 ? 0.25 : 1,
                  width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }}>
                <IconNext color={COLORS.gold} size={26} />
              </TouchableOpacity>
            </View>

            {/* Bottom bar */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0,
              paddingHorizontal: 12, paddingBottom: 10 }}>
              <Slider
                style={{ width: '100%', height: 20 }}
                minimumValue={0}
                maximumValue={duration || 1}
                value={position}
                minimumTrackTintColor={COLORS.gold}
                maximumTrackTintColor="rgba(255,255,255,0.25)"
                thumbTintColor={COLORS.gold}
                onSlidingComplete={val => {
                  videoRef.current?.setPositionAsync(val * 1000);
                  resetControlsTimer();
                }}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between',
                alignItems: 'center', marginTop: 2 }}>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11,
                  fontWeight: '700', letterSpacing: 0.5 }}>
                  {formatTime(position)}
                  <Text style={{ color: 'rgba(255,255,255,0.4)' }}> / </Text>
                  {formatTime(duration)}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <TouchableOpacity onPress={() => { setShowServerModal(true); resetControlsTimer(); }}
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10,
                      paddingVertical: 4, borderRadius: 6,
                      borderWidth: 1, borderColor: `${COLORS.gold}90` }}>
                    <Text style={{ color: COLORS.gold, fontSize: 11, fontWeight: '900' }}>
                      {selectedQuality || 'AUTO'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={toggleFullscreen}
                    style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                    <IconFullscreen exit={isFullscreen} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* ── Konten bawah ── */}
      {!isFullscreen && (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>

          {/* Episode nav */}
          <View style={{ flexDirection: 'row', gap: 12, padding: 16 }}>
            <TouchableOpacity onPress={handlePrev} disabled={epIndex >= episodes.length - 1}
              style={{ flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
                borderRadius: 10, paddingVertical: 14, alignItems: 'center',
                opacity: epIndex >= episodes.length - 1 ? 0.3 : 1 }}>
              <Text style={{ color: '#fff', fontWeight: '900' }}>‹ Sebelumnya</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNext} disabled={epIndex <= 0}
              style={{ flex: 1, borderWidth: 1, borderColor: `${COLORS.gold}60`,
                borderRadius: 10, paddingVertical: 14, alignItems: 'center',
                opacity: epIndex <= 0 ? 0.3 : 1 }}>
              <Text style={{ color: COLORS.gold, fontWeight: '900' }}>Selanjutnya ›</Text>
            </TouchableOpacity>
          </View>

          {/* AutoNext */}
          <TouchableOpacity onPress={() => {
            Haptics.selectionAsync();
            setAutoNext(p => !p);
          }}
            style={{ marginHorizontal: 16, marginBottom: 16, paddingVertical: 14,
              borderRadius: 10, borderWidth: 1,
              borderColor: autoNext ? `${COLORS.gold}60` : 'rgba(255,255,255,0.1)',
              alignItems: 'center' }}>
            <Text style={{ color: autoNext ? COLORS.gold : 'rgba(255,255,255,0.4)',
              fontWeight: '900', fontSize: 13 }}>
              AutoNext {autoNext ? 'ON' : 'OFF'}
            </Text>
            <Text style={{ color: autoNext ? `${COLORS.gold}80` : 'rgba(255,255,255,0.2)',
              fontSize: 10, marginTop: 2 }}>
              hidupkan untuk memutar otomatis episode selanjutnya
            </Text>
          </TouchableOpacity>

          {/* ── Daftar Episode ── */}
          <View style={{ marginHorizontal: 16, backgroundColor: COLORS.card, borderRadius: 12,
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
            padding: EP_PADDING, marginBottom: 16 }}>

            {/* Header + search */}
            <View style={{ flexDirection: 'row', alignItems: 'center',
              justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13,
                textTransform: 'uppercase', letterSpacing: 1 }}>
                Daftar Episode
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '700' }}>
                {episodes.length} eps
              </Text>
            </View>

            {/* Search input */}
            {episodes.length > 5 && (
              <View style={{ flexDirection: 'row', alignItems: 'center',
                backgroundColor: COLORS.bg, borderRadius: 8, paddingHorizontal: 10,
                paddingVertical: 7, borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.07)', marginBottom: 12, gap: 8 }}>
                <Ionicons name="search-outline" size={14} color="rgba(255,255,255,0.3)" />
                <TextInput
                  value={epSearch}
                  onChangeText={setEpSearch}
                  placeholder="Cari episode..."
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  keyboardType="numeric"
                  style={{ flex: 1, color: '#fff', fontSize: 13,
                    fontWeight: '600', paddingVertical: 0 }}
                />
                {epSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setEpSearch('')}>
                    <Ionicons name="close-circle" size={14} color="rgba(255,255,255,0.3)" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Grid episode — selalu pas, ga ada kosong */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: EP_GAP }}>
              {filteredEps.length === 0 ? (
                <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12,
                  fontWeight: '600', paddingVertical: 8 }}>
                  Episode tidak ditemukan
                </Text>
              ) : (
                filteredEps.map(item => {
                  const isActive = currentEpId === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => {
                        Haptics.selectionAsync();
                        changeEpisode(item);
                      }}
                      style={{
                        width: EP_SIZE, height: EP_SIZE,
                        borderRadius: 6, alignItems: 'center', justifyContent: 'center',
                        backgroundColor: isActive ? COLORS.gold : COLORS.bg,
                        borderWidth: 1,
                        borderColor: isActive ? COLORS.gold : 'rgba(255,255,255,0.05)',
                      }}>
                      <Text style={{ fontSize: 11, fontWeight: '900',
                        color: isActive ? '#000' : 'rgba(255,255,255,0.5)' }}>
                        {item.index}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </View>

          {/* Info Anime */}
          {anime && (
            <View style={{ marginHorizontal: 16, backgroundColor: COLORS.card, borderRadius: 12,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', padding: 16, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 14 }}>
                <FastImage
                  source={{ uri: anime.image_poster, priority: FastImage.priority.normal }}
                  style={{ width: 96, aspectRatio: 3/4.2, borderRadius: 8 }}
                  resizeMode={FastImage.resizeMode.cover}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15,
                    marginBottom: 6 }} numberOfLines={2}>
                    {anime.title}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
                    <View style={{ backgroundColor: COLORS.gold, paddingHorizontal: 8,
                      paddingVertical: 3, borderRadius: 4 }}>
                      <Text style={{ color: '#000', fontSize: 9, fontWeight: '900' }}>{anime.type}</Text>
                    </View>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8,
                      paddingVertical: 3, borderRadius: 4 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9,
                        fontWeight: '700' }}>{anime.status}</Text>
                    </View>
                  </View>
                  <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11,
                    lineHeight: 16 }} numberOfLines={4}>
                    {anime.synopsis}
                  </Text>
                </View>
              </View>
              {anime.genre ? (
                <Text style={{ color: COLORS.gold, fontSize: 11, fontWeight: '700', marginTop: 12 }}>
                  {anime.genre.replace(/,/g, ' · ')}
                </Text>
              ) : null}
            </View>
          )}

          {/* Share */}
          <TouchableOpacity onPress={handleShare}
            style={{ marginHorizontal: 16, marginBottom: 16, paddingVertical: 14,
              borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
              alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            <Ionicons name="share-social-outline" size={16} color="rgba(255,255,255,0.5)" />
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '900', fontSize: 13 }}>
              Bagikan Anime Ini
            </Text>
          </TouchableOpacity>

          {/* Debug ID */}
<TouchableOpacity
  onPress={() => Alert.alert('Anime ID', animeId)}
  style={{ marginHorizontal: 16, marginBottom: 8, padding: 12,
    backgroundColor: 'blue', borderRadius: 8, alignItems: 'center' }}
>
  <Text style={{ color: '#fff', fontWeight: '900' }}>SHOW ID</Text>
</TouchableOpacity>

{/* Debug Detail */}
<TouchableOpacity
  onPress={async () => {
  try {
    const epId = episodes[0]?.id ?? 'kosong';
    const url = `${API_BASE}/episode?url=${encodeURIComponent(epId)}&reso=720p`;
    Alert.alert('Episode URL', url);
    const res = await fetch(url);
    const json = await res.json();
    Alert.alert('Episode Response', JSON.stringify(json).substring(0, 600));
  } catch (e: any) {
    Alert.alert('Error', e.message);
  }
}}
  style={{ marginHorizontal: 16, marginBottom: 8, padding: 12,
    backgroundColor: 'red', borderRadius: 8, alignItems: 'center' }}
>
  <Text style={{ color: '#fff', fontWeight: '900' }}>DEBUG</Text>
</TouchableOpacity>

          {/* Rekomendasi */}
          {recommendations.length > 0 && (
            <View style={{ marginHorizontal: 16 }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13, marginBottom: 12,
                textTransform: 'uppercase', letterSpacing: 1 }}>
                Rekomendasi Lainnya
              </Text>
              {recommendations.map(a => (
                <TouchableOpacity key={a.id}
                  onPress={() => router.replace(`/watch/${getAnimeSlug(a)}`)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12,
                    marginBottom: 10, backgroundColor: COLORS.card, borderRadius: 10,
                    padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}
                  activeOpacity={0.8}>
                  <FastImage
                    source={{ uri: a.image_poster, priority: FastImage.priority.low }}
                    style={{ width: 44, aspectRatio: 3/4.2, borderRadius: 6 }}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}
                      numberOfLines={1}>{a.title}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 3 }}>
                      {a.type} · {a.status}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.2)" />
                </TouchableOpacity>
              ))}
            </View>
          )}

        </ScrollView>
      )}
    </View>
  );
}
