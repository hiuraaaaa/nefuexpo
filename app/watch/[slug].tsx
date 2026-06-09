import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, Share, Dimensions, StatusBar,
  Modal, Alert, TextInput, useWindowDimensions,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { VideoView, useVideoPlayer, isPictureInPictureSupported } from 'expo-video';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, FadeIn, FadeOut,
} from 'react-native-reanimated';
import { useBatteryLevel, useBatteryState, BatteryState } from 'expo-battery';
import { COLORS } from '@/constants';
import { api, getAnimeSlug, decodeAnimeId, formatTime } from '@/hooks/api';
import { historyStorage, progressStorage, favoritStorage, storageMain } from '@/hooks/storage';
import { xpStorage } from '@/hooks/xp';
import { AnimeDetail, Episode, Server, Anime } from '@/types';
import { WatchSkeleton } from '@/components/Skeleton';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUser } from '@/hooks/auth';

const { width } = Dimensions.get('window');

const SEEK_SEC     = 10;
const EP_PAGE_SIZE = 100;

type ServerGroup = { [quality: string]: Server[] };

// ── Battery Icon ───────────────────────────────────────────────────────────────
function BatteryIndicator() {
  const level = useBatteryLevel();
  const state = useBatteryState();

  const isCharging = state === BatteryState.CHARGING || state === BatteryState.FULL;
  const pct        = level !== null ? Math.round(level * 100) : null;
  const color      = isCharging
    ? '#4ade80'
    : pct !== null && pct <= 20 ? '#e63946' : 'rgba(255,255,255,0.75)';

  const iconName = isCharging
    ? 'battery-charging'
    : pct !== null && pct > 80 ? 'battery-full'
    : pct !== null && pct > 50 ? 'battery-half'
    : pct !== null && pct > 20 ? 'battery-low'
    : 'battery-dead';

  if (pct === null) return null;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      <Ionicons name={iconName as any} size={14} color={color} />
      <Text style={{ color, fontSize: 11, fontWeight: '700' }}>
        {pct}%{isCharging ? ' ⚡' : ''}
      </Text>
    </View>
  );
}

// ── Clock ──────────────────────────────────────────────────────────────────────
function Clock() {
  const [time, setTime] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '700' }}>
      {time}
    </Text>
  );
}

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
  const c = '#fff'; const sz = 7; const t = 2;
  if (exit) return (
    <View style={{ width: 18, height: 18 }}>
      <View style={{ position: 'absolute', top: sz-t, left: 0, width: sz, height: t, backgroundColor: c }} />
      <View style={{ position: 'absolute', top: 0, left: sz-t, width: t, height: sz, backgroundColor: c }} />
      <View style={{ position: 'absolute', top: sz-t, right: 0, width: sz, height: t, backgroundColor: c }} />
      <View style={{ position: 'absolute', top: 0, right: sz-t, width: t, height: sz, backgroundColor: c }} />
      <View style={{ position: 'absolute', bottom: sz-t, left: 0, width: sz, height: t, backgroundColor: c }} />
      <View style={{ position: 'absolute', bottom: 0, left: sz-t, width: t, height: sz, backgroundColor: c }} />
      <View style={{ position: 'absolute', bottom: sz-t, right: 0, width: sz, height: t, backgroundColor: c }} />
      <View style={{ position: 'absolute', bottom: 0, right: sz-t, width: t, height: sz, backgroundColor: c }} />
    </View>
  );
  return (
    <View style={{ width: 18, height: 18 }}>
      <View style={{ position: 'absolute', top: 0, left: 0, width: sz, height: t, backgroundColor: c }} />
      <View style={{ position: 'absolute', top: 0, left: 0, width: t, height: sz, backgroundColor: c }} />
      <View style={{ position: 'absolute', top: 0, right: 0, width: sz, height: t, backgroundColor: c }} />
      <View style={{ position: 'absolute', top: 0, right: 0, width: t, height: sz, backgroundColor: c }} />
      <View style={{ position: 'absolute', bottom: 0, left: 0, width: sz, height: t, backgroundColor: c }} />
      <View style={{ position: 'absolute', bottom: 0, left: 0, width: t, height: sz, backgroundColor: c }} />
      <View style={{ position: 'absolute', bottom: 0, right: 0, width: sz, height: t, backgroundColor: c }} />
      <View style={{ position: 'absolute', bottom: 0, right: 0, width: t, height: sz, backgroundColor: c }} />
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
        overflow: 'hidden', borderRadius: 10,
      }}
    >
      <BlurView intensity={60} tint="dark"
        style={{ paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center', gap: 4 }}>
        <Ionicons name={direction === 'left' ? 'play-back' : 'play-forward'} size={22} color="#fff" />
        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
          {direction === 'left' ? `-${SEEK_SEC}s` : `+${SEEK_SEC}s`}
        </Text>
      </BlurView>
    </Animated.View>
  );
}

// ── Info Row ───────────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11,
        fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
        {label}
      </Text>
      <Text style={{ color: COLORS.gold, fontSize: 12, fontWeight: '700',
        maxWidth: '60%', textAlign: 'right' }}>
        {value}
      </Text>
    </View>
  );
}

// ── Episode Button ─────────────────────────────────────────────────────────────
const EpisodeButton = React.memo(({ item, isActive, isWatched, progress, onPress }: {
  item: Episode;
  isActive: boolean;
  isWatched: boolean;
  progress: number;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.75}
    style={{
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 14, paddingVertical: 13,
      borderRadius: 10, marginBottom: 6,
      backgroundColor: isActive ? `${COLORS.gold}18` : 'transparent',
      borderWidth: 1,
      borderColor: isActive ? COLORS.gold : isWatched ? `${COLORS.gold}30` : 'rgba(255,255,255,0.06)',
      overflow: 'hidden',
    }}
  >
    {isActive && (
      <View style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: 3, backgroundColor: COLORS.gold, borderRadius: 999,
      }} />
    )}
    <Text style={{
      width: 32, fontSize: 14, fontWeight: '900',
      color: isActive ? COLORS.gold : isWatched ? `${COLORS.gold}99` : 'rgba(255,255,255,0.35)',
      marginRight: 10,
    }}>
      {item.index}
    </Text>
    <Text style={{
      flex: 1, fontSize: 13,
      fontWeight: isActive ? '800' : '600',
      color: isActive ? '#fff' : isWatched ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.7)',
    }} numberOfLines={1}>
      {item.title || `Episode ${item.index}`}
    </Text>
    {isActive ? (
      <Ionicons name="play-circle" size={18} color={COLORS.gold} />
    ) : isWatched && progress === 0 ? (
      <Ionicons name="checkmark-circle" size={16} color={`${COLORS.gold}80`} />
    ) : null}
    {!isActive && progress > 0 && (
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
        backgroundColor: 'rgba(255,255,255,0.06)',
      }}>
        <View style={{
          width: `${progress * 100}%`, height: '100%',
          backgroundColor: COLORS.gold, borderRadius: 999,
        }} />
      </View>
    )}
  </TouchableOpacity>
));

// ── Main ───────────────────────────────────────────────────────────────────────
export default function WatchScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const epParam  = useLocalSearchParams<{ ep?: string }>().ep;
  const router   = useRouter();
  const insets   = useSafeAreaInsets();

  const { width: screenWidth } = useWindowDimensions();
  const animeId = decodeAnimeId(slug ?? '');

  const [anime, setAnime]                       = useState<AnimeDetail | null>(null);
  const [episodes, setEpisodes]                 = useState<Episode[]>([]);
  const [filteredEps, setFilteredEps]           = useState<Episode[]>([]);
  const [epSearch, setEpSearch]                 = useState('');
  const [epPage, setEpPage]                     = useState(0);
  const [currentEpId, setCurrentEpId]           = useState<string | null>(null);
  const [serverGroup, setServerGroup]           = useState<ServerGroup>({});
  const [selectedQuality, setSelectedQuality]   = useState<string>('');
  const [selectedServer, setSelectedServer]     = useState<Server | null>(null);
  const [recommendations, setRecommendations]   = useState<Anime[]>([]);
  const [isLoading, setIsLoading]               = useState(true);
  const [isEpLoading, setIsEpLoading]           = useState(false);
  const [isFullscreen, setIsFullscreen]         = useState(false);
  const [autoNext, setAutoNext]                 = useState(
    () => historyStorage.getAutoNext()
  );
  const [showControls, setShowControls]         = useState(true);
  const [showServerModal, setShowServerModal]   = useState(false);
  const [isFavorited, setIsFavorited]           = useState(false);
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);

  const [epProgress, setEpProgress] = useState<Record<string, number>>({});
  const [watchedEps, setWatchedEps] = useState<Set<string>>(new Set());

  const [isPlaying, setIsPlaying]     = useState(false);
  const [position, setPosition]       = useState(0);
  const [duration, setDuration]       = useState(0);  // ← fix: state terpisah
  const [isBuffering, setIsBuffering] = useState(false);

  const [seekLeft, setSeekLeft]   = useState(false);
  const [seekRight, setSeekRight] = useState(false);

  const [pipEnabled, setPipEnabled]   = useState(() => storageMain.getBoolean('nefusoft_pip')  ?? false);
  const [infoEnabled, setInfoEnabled] = useState(() => storageMain.getBoolean('nefusoft_info') ?? false);

  useFocusEffect(useCallback(() => {
    setPipEnabled(storageMain.getBoolean('nefusoft_pip')  ?? false);
    setInfoEnabled(storageMain.getBoolean('nefusoft_info') ?? false);
  }, []));

  const seekLeftTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seekRightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapLeft    = useRef(0);
  const lastTapRight   = useRef(0);
  const controlsTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaveTime   = useRef(0);
  const xpAwardedEps   = useRef<Set<string>>(new Set());
  const videoRef       = useRef<VideoView>(null);

  const pipSupported = isPictureInPictureSupported();

  const controlsOpacity = useSharedValue(1);
  const controlsStyle   = useAnimatedStyle(() => ({ opacity: controlsOpacity.value }));

  // ── expo-video player ──────────────────────────────────────────────────────
  const player = useVideoPlayer(
    selectedServer?.link ? { uri: selectedServer.link } : null,
    p => { p.pause(); }
  );

  // ── Sync player state ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!player) return;

    const statusSub = player.addListener('statusChange', ({ status }) => {
      setIsBuffering(status === 'loading');
    });

    const playingSub = player.addListener('playingChange', ({ isPlaying: playing }) => {
      setIsPlaying(playing);
    });

    // FIX: durasi diambil dari event durationChange, bukan dari timeUpdate
    // player.duration di timeUpdate sering belum ready (return 0/NaN)
    const durationSub = player.addListener('durationChange' as any, ({ duration: dur }: { duration: number }) => {
      if (dur && dur > 0) setDuration(dur);
    });

    const timeSub = player.addListener('timeUpdate', ({ currentTime }) => {
      setPosition(currentTime);

      // Fallback: kalau durationChange belum fire, coba ambil dari player langsung
      const dur = player.duration ?? 0;
      if (dur > 0) setDuration(dur);

      if (currentEpId) {
        const now = Date.now();
        if (now - lastSaveTime.current > 5000) {
          lastSaveTime.current = now;
          progressStorage.save(currentEpId, currentTime, dur);
          if (dur > 0) {
            const prog = currentTime / dur;
            setEpProgress(prev => ({ ...prev, [currentEpId]: prog }));
            if (prog > 0.9) {
              setWatchedEps(prev => new Set([...prev, currentEpId]));
              setEpProgress(prev => { const n = { ...prev }; delete n[currentEpId]; return n; });
            }
            if (prog >= 0.7 && !xpAwardedEps.current.has(currentEpId)) {
              xpAwardedEps.current.add(currentEpId);
              xpStorage.add(10);
            }
          }
        }
      }
    });

    const endSub = player.addListener('playToEnd', () => {
      if (autoNext) handleNext();
    });

    return () => {
      statusSub.remove();
      playingSub.remove();
      durationSub.remove();
      timeSub.remove();
      endSub.remove();
    };
  }, [player, currentEpId, autoNext]);

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
      deactivateKeepAwake();
    };
  }, []);

  // ── Load anime detail ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!animeId) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const detailRes = await api.detail(animeId);
        if (detailRes.status && detailRes.data) {
          setAnime(detailRes.data);
          const eps = detailRes.data.episode_list || [];
          setEpisodes(eps);
          setFilteredEps(eps);

          const progressMap: Record<string, number> = {};
          const watched = new Set<string>();
          for (const ep of eps) {
            const saved = progressStorage.get(ep.id);
            if (saved && saved.position > 0) {
              const ratio = saved.duration > 0 ? saved.position / saved.duration : 0;
              if (ratio > 0.9) watched.add(ep.id);
              else progressMap[ep.id] = ratio;
            }
          }
          setEpProgress(progressMap);
          setWatchedEps(watched);

          const target = epParam
            ? eps.find((e: Episode) => e.index.toString() === epParam)
            : eps[eps.length - 1];
          if (target) setCurrentEpId(target.id);
        }
        setIsLoading(false);

        // FIX: ganti api.popular() → api.rekomendasi()
        api.rekomendasi().then(recRes => {
          setRecommendations((recRes.data || []).slice(0, 5));
        }).catch(() => {});

      } catch {
        setIsLoading(false);
      }
    };
    load();

    const unsubNet = NetInfo.addEventListener(state => {
      if (state.isConnected && !anime) load();
    });
    return () => unsubNet();
  }, [animeId]);

  useEffect(() => {
    if (!epSearch.trim()) setFilteredEps(episodes);
    else setFilteredEps(episodes.filter(e =>
      String(e.index).includes(epSearch.trim())
    ));
  }, [epSearch, episodes]);

  // ── Load episode servers ───────────────────────────────────────────────────
  useEffect(() => {
    if (!currentEpId) return;
    const load = async () => {
      setIsEpLoading(true);
      setServerGroup({});
      setSelectedQuality('');
      setSelectedServer(null);
      setPosition(0);
      setDuration(0); // reset durasi tiap ganti episode
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
            const saved = progressStorage.get(currentEpId);
            if (saved && saved.position > 5) {
              setTimeout(() => {
                if (player) player.seekBy(saved.position - (player.currentTime ?? 0));
              }, 800);
            }
          }
        }
      } catch {}
      setIsEpLoading(false);
    };
    load();
  }, [currentEpId]);

  useEffect(() => {
    if (!anime || !currentEpId) return;
    const ep = episodes.find(e => e.id === currentEpId);
    if (ep) historyStorage.add(anime, ep.index);
  }, [currentEpId, anime]);

  useEffect(() => {
    if (!anime) return;
    setIsFavorited(favoritStorage.isFavorited(anime.id));
  }, [anime]);

  const toggleAutoNext = useCallback(() => {
    setAutoNext(prev => {
      const next = !prev;
      historyStorage.setAutoNext(next);
      return next;
    });
  }, []);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 3500);
  }, []);

  const epIndex      = episodes.findIndex(e => e.id === currentEpId);
  const currentEpNum = episodes.find(e => e.id === currentEpId)?.index || 0;
  const availableQualities = Object.keys(serverGroup).filter(q => serverGroup[q]?.length > 0);

  const changeEpisode = useCallback((ep: Episode) => {
    setEpSearch('');
    setCurrentEpId(ep.id);
  }, []);

  useEffect(() => {
    if (!currentEpId) return;
    setEpSearch('');
    setFilteredEps(episodes);
    const idx = episodes.findIndex(e => e.id === currentEpId);
    if (idx >= 0) setEpPage(Math.floor(idx / EP_PAGE_SIZE));
  }, [currentEpId, episodes]);

  const handlePrev = useCallback(() => {
    if (epIndex < episodes.length - 1) changeEpisode(episodes[epIndex + 1]);
  }, [epIndex, episodes, changeEpisode]);

  const handleNext = useCallback(() => {
    if (epIndex > 0) changeEpisode(episodes[epIndex - 1]);
  }, [epIndex, episodes, changeEpisode]);

  const selectQualityAndServer = useCallback((quality: string, server: Server) => {
    const cur = position;
    setSelectedQuality(quality);
    setSelectedServer(server);
    setShowServerModal(false);
    setTimeout(() => {
      if (player) player.seekBy(cur - (player.currentTime ?? 0));
    }, 300);
  }, [position, player]);

  const togglePlayPause = useCallback(() => {
    if (!player) return;
    if (isPlaying) player.pause();
    else player.play();
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

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Tonton ${anime?.title || 'Anime'} di NefuSoft, Gratis & Tanpa Iklan!\nhttps://nefusoft.cloud`,
        title: 'NefuSoft',
      });
    } catch {}
  }, [anime]);

  const handleBookmark = useCallback(() => {
    if (!getCurrentUser()) { Alert.alert('Login Dulu', 'Login untuk menyimpan favorit'); return; }
    if (!anime) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = favoritStorage.toggle(anime as any);
    setIsFavorited(result);
  }, [anime]);

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

      {/* ── Server Modal ── */}
      <Modal visible={showServerModal} transparent animationType="slide"
        onRequestClose={() => setShowServerModal(false)}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1}
          onPress={() => setShowServerModal(false)}>
          <BlurView intensity={30} tint="dark" style={{ flex: 1 }}>
            <View style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              backgroundColor: `${COLORS.card}f0`, borderTopLeftRadius: 20,
              borderTopRightRadius: 20, padding: 20, paddingBottom: 40,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
            }}>
              <View style={{ width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.15)',
                borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14, marginBottom: 16,
                textTransform: 'uppercase', letterSpacing: 1 }}>Pilih Kualitas & Server</Text>
              {availableQualities.map(quality => (
                <View key={quality} style={{ marginBottom: 16 }}>
                  <Text style={{ color: COLORS.gold, fontWeight: '900', fontSize: 12, marginBottom: 8 }}>
                    {quality}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {serverGroup[quality].map((s, idx) => {
                      const isActive = selectedServer?.id === s.id;
                      return (
                        <TouchableOpacity key={s.id}
                          onPress={() => { Haptics.selectionAsync(); selectQualityAndServer(quality, s); }}
                          style={{
                            paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8,
                            backgroundColor: isActive ? COLORS.gold : 'rgba(255,255,255,0.07)',
                            borderWidth: 1,
                            borderColor: isActive ? COLORS.gold : 'rgba(255,255,255,0.1)',
                          }}>
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
          </BlurView>
        </TouchableOpacity>
      </Modal>

      {/* ── Video Player ── */}
      <View style={{ width: '100%', height: videoHeight, backgroundColor: '#000',
        marginTop: isFullscreen ? 0 : insets.top }}>

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
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <ActivityIndicator color={COLORS.gold} size="large" />
          </View>
        )}

        <TouchableOpacity activeOpacity={1} onPress={handleTapLeft}
          style={{ position: 'absolute', top: 0, left: 0, width: '40%', bottom: 0 }} />
        <TouchableOpacity activeOpacity={1} onPress={resetControlsTimer}
          style={{ position: 'absolute', top: 0, left: '40%', width: '20%', bottom: 0 }} />
        <TouchableOpacity activeOpacity={1} onPress={handleTapRight}
          style={{ position: 'absolute', top: 0, right: 0, width: '40%', bottom: 0 }} />

        <SeekToast direction="left"  visible={seekLeft}  />
        <SeekToast direction="right" visible={seekRight} />

        {selectedServer && !isEpLoading && (
          <Animated.View style={[
            { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
            controlsStyle,
          ]} pointerEvents={showControls ? 'box-none' : 'none'}>

            <LinearGradient colors={['rgba(0,0,0,0.7)', 'transparent']}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80 }}
              pointerEvents="none" />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 90 }}
              pointerEvents="none" />

            {/* Top bar */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0,
              paddingHorizontal: 12, paddingTop: 10, gap: 6 }}>
              {infoEnabled && (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Clock />
                  <BatteryIndicator />
                </View>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (isFullscreen) toggleFullscreen();
                    else if (router.canGoBack()) router.back();
                    else router.replace('/(tabs)');
                  }}
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
                  <Ionicons name={isFavorited ? 'bookmark' : 'bookmark-outline'} size={18} color={COLORS.gold} />
                </TouchableOpacity>
              </View>
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

            {/* Bottom controls */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0,
              paddingHorizontal: 12, paddingBottom: 10 }}>
              <Slider style={{ width: '100%', height: 20 }}
                minimumValue={0}
                maximumValue={duration > 0 ? duration : 1}
                value={position}
                minimumTrackTintColor={COLORS.gold}
                maximumTrackTintColor="rgba(255,255,255,0.25)"
                thumbTintColor={COLORS.gold}
                onSlidingComplete={val => {
                  if (player) player.seekBy(val - (player.currentTime ?? 0));
                  resetControlsTimer();
                }}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between',
                alignItems: 'center', marginTop: 2 }}>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11,
                  fontWeight: '700', letterSpacing: 0.5 }}>
                  {formatTime(position)}
                  <Text style={{ color: 'rgba(255,255,255,0.4)' }}> / </Text>
                  {duration > 0 ? formatTime(duration) : '--:--'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  {pipEnabled && pipSupported && (
                    <TouchableOpacity
                      onPress={() => { Haptics.selectionAsync(); videoRef.current?.startPictureInPicture(); resetControlsTimer(); }}
                      style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="tablet-portrait-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => { Haptics.selectionAsync(); setShowServerModal(true); resetControlsTimer(); }}
                    style={{ overflow: 'hidden', borderRadius: 6 }}>
                    <BlurView intensity={50} tint="dark"
                      style={{ paddingHorizontal: 10, paddingVertical: 4,
                        borderWidth: 1, borderColor: `${COLORS.gold}90`, borderRadius: 6 }}>
                      <Text style={{ color: COLORS.gold, fontSize: 11, fontWeight: '900' }}>
                        {selectedQuality || 'AUTO'}
                      </Text>
                    </BlurView>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={toggleFullscreen}
                    style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                    <IconFullscreen exit={isFullscreen} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Animated.View>
        )}
      </View>

      {/* ── Konten bawah ── */}
      {!isFullscreen && (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

          <View style={{ flexDirection: 'row', gap: 12, padding: 16 }}>
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handlePrev(); }}
              disabled={epIndex >= episodes.length - 1}
              style={{ flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
                borderRadius: 10, paddingVertical: 14, alignItems: 'center',
                opacity: epIndex >= episodes.length - 1 ? 0.3 : 1 }}>
              <Text style={{ color: '#fff', fontWeight: '900' }}>‹ Sebelumnya</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleNext(); }}
              disabled={epIndex <= 0}
              style={{ flex: 1, borderWidth: 1, borderColor: `${COLORS.gold}60`,
                borderRadius: 10, paddingVertical: 14, alignItems: 'center',
                opacity: epIndex <= 0 ? 0.3 : 1 }}>
              <Text style={{ color: COLORS.gold, fontWeight: '900' }}>Selanjutnya ›</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => { Haptics.selectionAsync(); toggleAutoNext(); }}
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
          {(() => {
            const isSearching = epSearch.trim().length > 0;
            const totalPages  = Math.ceil(episodes.length / EP_PAGE_SIZE);
            const pageEps     = isSearching
              ? filteredEps
              : episodes.slice(epPage * EP_PAGE_SIZE, (epPage + 1) * EP_PAGE_SIZE);

            return (
              <View style={{ marginHorizontal: 16, backgroundColor: COLORS.card, borderRadius: 12,
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
                padding: 16, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center',
                  justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13,
                    textTransform: 'uppercase', letterSpacing: 1 }}>Daftar Episode</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '700' }}>
                    {episodes.length} eps
                  </Text>
                </View>

                {episodes.length > 5 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center',
                    backgroundColor: COLORS.bg, borderRadius: 8, paddingHorizontal: 10,
                    paddingVertical: 7, borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.07)', marginBottom: 12, gap: 8 }}>
                    <Ionicons name="search-outline" size={14} color="rgba(255,255,255,0.3)" />
                    <TextInput
                      value={epSearch}
                      onChangeText={t => { setEpSearch(t); setEpPage(0); }}
                      placeholder="Cari episode..."
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      keyboardType="numeric"
                      style={{ flex: 1, color: '#fff', fontSize: 13, fontWeight: '600', paddingVertical: 0 }}
                    />
                    {epSearch.length > 0 && (
                      <TouchableOpacity onPress={() => setEpSearch('')}>
                        <Ionicons name="close-circle" size={14} color="rgba(255,255,255,0.3)" />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {!isSearching && totalPages > 1 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 12 }}
                    contentContainerStyle={{ gap: 6, paddingRight: 4 }}>
                    {Array.from({ length: totalPages }, (_, i) => {
                      const from = i * EP_PAGE_SIZE + 1;
                      const to   = Math.min((i + 1) * EP_PAGE_SIZE, episodes.length);
                      const isActive = epPage === i;
                      return (
                        <TouchableOpacity key={i}
                          onPress={() => { Haptics.selectionAsync(); setEpPage(i); }}
                          style={{
                            paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
                            backgroundColor: isActive ? COLORS.gold : COLORS.bg,
                            borderWidth: 1,
                            borderColor: isActive ? COLORS.gold : 'rgba(255,255,255,0.1)',
                          }}>
                          <Text style={{ fontSize: 11, fontWeight: '800',
                            color: isActive ? '#000' : 'rgba(255,255,255,0.5)' }}>
                            {from}–{to}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}

                <View>
                  {pageEps.length === 0 ? (
                    <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12,
                      fontWeight: '600', paddingVertical: 8 }}>Episode tidak ditemukan</Text>
                  ) : pageEps.map(item => (
                    <EpisodeButton
                      key={item.id}
                      item={item}
                      isActive={currentEpId === item.id}
                      isWatched={watchedEps.has(item.id)}
                      progress={epProgress[item.id] ?? 0}
                      onPress={() => { Haptics.selectionAsync(); changeEpisode(item); }}
                    />
                  ))}
                </View>
              </View>
            );
          })()}

          {/* ── Info Anime ── */}
          {anime && (
            <View style={{ marginHorizontal: 16, marginBottom: 16, borderRadius: 16,
              overflow: 'hidden', backgroundColor: COLORS.card,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
              <View style={{ height: 200, alignItems: 'center', justifyContent: 'flex-end' }}>
                {/* FIX: hapus priority dari source */}
                <Image
                  source={{ uri: anime.image_cover || anime.image_poster }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.25 }}
                  contentFit="cover"
                />
                <LinearGradient
                  colors={['transparent', COLORS.card]}
                  style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' }}
                />
                <Image
                  source={{ uri: anime.image_poster }}
                  style={{ width: 110, aspectRatio: 3 / 4.2, borderRadius: 10 }}
                  contentFit="cover"
                />
              </View>
              <View style={{ padding: 16 }}>
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18,
                  textAlign: 'center', marginBottom: 12, lineHeight: 24 }}>
                  {anime.title}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap',
                  justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                  {anime.type ? (
                    <View style={{ backgroundColor: COLORS.gold, paddingHorizontal: 10,
                      paddingVertical: 4, borderRadius: 6 }}>
                      <Text style={{ color: '#000', fontSize: 11, fontWeight: '900' }}>{anime.type}</Text>
                    </View>
                  ) : null}
                  {anime.status ? (
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10,
                      paddingVertical: 4, borderRadius: 6, borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.15)' }}>
                      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700' }}>
                        {anime.status}
                      </Text>
                    </View>
                  ) : null}
                  {anime.aired_start ? (
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10,
                      paddingVertical: 4, borderRadius: 6, borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.15)' }}>
                      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700' }}>
                        {anime.aired_start}
                      </Text>
                    </View>
                  ) : null}
                </View>
                {anime.synopsis ? (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12,
                      lineHeight: 18, textAlign: 'center' }}
                      numberOfLines={synopsisExpanded ? undefined : 3}>
                      {anime.synopsis}
                    </Text>
                    {anime.synopsis.length > 100 && (
                      <TouchableOpacity
                        onPress={() => { Haptics.selectionAsync(); setSynopsisExpanded(p => !p); }}
                        style={{ marginTop: 6, alignItems: 'center' }}>
                        <Text style={{ color: COLORS.gold, fontSize: 11, fontWeight: '700' }}>
                          {synopsisExpanded ? 'Sembunyikan ▲' : 'Selengkapnya ▼'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : null}
                <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }}>
                  {anime.studio ? <InfoRow label="Studio" value={anime.studio} /> : null}
                  {anime.year   ? <InfoRow label="Tahun"  value={anime.year}   /> : null}
                  {anime.genre  ? (
                    <View style={{ paddingVertical: 12 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11,
                        fontWeight: '700', textTransform: 'uppercase',
                        letterSpacing: 1, marginBottom: 8 }}>Genre</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {anime.genre.split(',').map((g, i) => (
                          <View key={i} style={{ backgroundColor: `${COLORS.gold}20`,
                            paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
                            borderWidth: 1, borderColor: `${COLORS.gold}40` }}>
                            <Text style={{ color: COLORS.gold, fontSize: 10, fontWeight: '700' }}>
                              {g.trim()}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          )}

          <TouchableOpacity onPress={handleShare}
            style={{ marginHorizontal: 16, marginBottom: 16, paddingVertical: 14,
              borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
              alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            <Ionicons name="share-social-outline" size={16} color="rgba(255,255,255,0.5)" />
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '900', fontSize: 13 }}>
              Bagikan Anime Ini
            </Text>
          </TouchableOpacity>

          {recommendations.length > 0 && (
            <View style={{ marginHorizontal: 16 }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13, marginBottom: 12,
                textTransform: 'uppercase', letterSpacing: 1 }}>Rekomendasi Lainnya</Text>
              {recommendations.map(a => (
                <TouchableOpacity key={a.id}
                  onPress={() => router.replace(`/watch/${getAnimeSlug(a)}`)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12,
                    marginBottom: 10, backgroundColor: COLORS.card, borderRadius: 10,
                    padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}
                  activeOpacity={0.8}>
                  {/* FIX: hapus priority dari source */}
                  <Image
                    source={{ uri: a.image_poster }}
                    style={{ width: 44, aspectRatio: 3 / 4.2, borderRadius: 6 }}
                    contentFit="cover"
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
