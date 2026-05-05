import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Image,
  ActivityIndicator, FlatList, Share, Alert,
  Dimensions, StatusBar, Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Video, ResizeMode, AVPlaybackStatus, Audio } from 'expo-av';
import * as ScreenOrientation from 'expo-screen-orientation';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { COLORS } from '@/constants';
import { api, getProxyUrl, getAnimeSlug, decodeAnimeId, formatTime } from '@/hooks/api';
import { historyStorage } from '@/hooks/storage';
import { AnimeDetail, Episode, Server, Anime } from '@/types';
import { WatchSkeleton } from '@/components/Skeleton';

const { width } = Dimensions.get('window');

// Kelompokkan server per resolusi: { '720p': [s1, s2], '480p': [...] }
type ServerGroup = { [quality: string]: Server[] };

export default function WatchScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const epParam = useLocalSearchParams<{ ep?: string }>().ep;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const videoRef = useRef<Video>(null);

  // slug format: "{id}--{title-kebab}" — split("--")[0] untuk ambil id asli
  // slug format: "{base64(id)}--{title-kebab}" — decode base64 untuk ambil id asli
  const animeId = decodeAnimeId(slug ?? '');

  const [anime, setAnime] = useState<AnimeDetail | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpId, setCurrentEpId] = useState<string | null>(null);
  const [serverGroup, setServerGroup] = useState<ServerGroup>({});
  const [selectedQuality, setSelectedQuality] = useState<string>('');
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [recommendations, setRecommendations] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEpLoading, setIsEpLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoNext, setAutoNext] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showServerModal, setShowServerModal] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);

  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Disable Android media session notification
  useEffect(() => {
    Audio.setAudioModeAsync({
      staysActiveInBackground: false,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
      allowsRecordingIOS: false,
      interruptionModeIOS: 0,
      interruptionModeAndroid: 1,
    }).catch(() => {});
  }, []);

  // Load detail
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

  // Load episode servers
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
          // Kelompokkan per resolusi — pakai SEMUA server, tidak filter ekstensi
          const allServers: Server[] = res.data.server || [];
          const group: ServerGroup = {};
          allServers.forEach((s: Server, i: number) => {
            const q = s.quality || 'AUTO';
            if (!group[q]) group[q] = [];
            group[q].push({ ...s, id: String(i) });
          });
          setServerGroup(group);

          // Pilih kualitas terbaik secara default
          const qualities = ['1080p', '720p', '480p', '360p'];
          const bestQ = qualities.find(q => group[q]?.length > 0) || Object.keys(group)[0];
          if (bestQ && group[bestQ]?.length > 0) {
            setSelectedQuality(bestQ);
            setSelectedServer(group[bestQ][0]);
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

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  const epIndex = episodes.findIndex(e => e.id === currentEpId);
  const currentEpNum = episodes.find(e => e.id === currentEpId)?.index || 0;
  const availableQualities = Object.keys(serverGroup).filter(q => serverGroup[q]?.length > 0);

  const changeEpisode = (ep: Episode) => setCurrentEpId(ep.id);
  const handlePrev = () => { if (epIndex < episodes.length - 1) changeEpisode(episodes[epIndex + 1]); };
  const handleNext = () => { if (epIndex > 0) changeEpisode(episodes[epIndex - 1]); };

  const selectQualityAndServer = (quality: string, server: Server) => {
    const cur = position;
    setSelectedQuality(quality);
    setSelectedServer(server);
    setShowServerModal(false);
    setTimeout(() => videoRef.current?.setPositionAsync(cur * 1000), 300);
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

  const videoHeight = isFullscreen ? Dimensions.get('window').height : width * (9 / 16);

  const handlePlaybackStatus = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setIsPlaying(status.isPlaying);
    setPosition(status.positionMillis / 1000);
    setDuration((status.durationMillis || 0) / 1000);
    setIsBuffering(status.isBuffering);
    if (status.didJustFinish && autoNext) handleNext();
  };

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

      {/* Server/Quality Picker Modal */}
      <Modal visible={showServerModal} transparent animationType="slide" onRequestClose={() => setShowServerModal(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} activeOpacity={1} onPress={() => setShowServerModal(false)}>
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 }}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
              Pilih Kualitas & Server
            </Text>
            {availableQualities.map(quality => (
              <View key={quality} style={{ marginBottom: 16 }}>
                <Text style={{ color: COLORS.gold, fontWeight: '900', fontSize: 12, marginBottom: 8 }}>{quality}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {serverGroup[quality].map((s, idx) => {
                    const isActive = selectedServer?.id === s.id;
                    return (
                      <TouchableOpacity
                        key={s.id}
                        onPress={() => selectQualityAndServer(quality, s)}
                        style={{
                          paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8,
                          backgroundColor: isActive ? COLORS.gold : COLORS.bg,
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
        </TouchableOpacity>
      </Modal>

      {/* Video Player */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={resetControlsTimer}
        style={{ width: '100%', height: videoHeight, backgroundColor: '#000', position: 'relative' }}
      >
        {selectedServer && !isEpLoading ? (
          <Video
            ref={videoRef}
            source={{ uri: getProxyUrl(selectedServer.link) }}
            style={{ width: '100%', height: '100%' }}
            resizeMode={ResizeMode.CONTAIN}
            useNativeControls={false}
            shouldPlay={false}
            onPlaybackStatusUpdate={handlePlaybackStatus}
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={COLORS.gold} />
            <Text style={{ color: COLORS.gold, fontSize: 12, marginTop: 8, fontWeight: '700' }}>
              {isEpLoading ? 'Memuat episode...' : 'Video tidak tersedia'}
            </Text>
          </View>
        )}

        {/* Controls overlay */}
        {showControls && selectedServer && !isEpLoading && (
          <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <TouchableOpacity
              onPress={() => { if (isFullscreen) toggleFullscreen(); else router.back(); }}
              style={{ position: 'absolute', top: 16, left: 16, width: 36, height: 36,
                backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 18,
                alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 0, height: 0, borderTopWidth: 7, borderBottomWidth: 7, borderRightWidth: 11,
                borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: '#fff', marginRight: 2 }} />
            </TouchableOpacity>

            <View style={{ position: 'absolute', top: 16, left: 60, right: 60 }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13 }} numberOfLines={1}>
                {anime?.title} — Eps {currentEpNum}
              </Text>
            </View>

            <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 32 }}>
              <TouchableOpacity onPress={handlePrev} disabled={epIndex >= episodes.length - 1}
                style={{ opacity: epIndex >= episodes.length - 1 ? 0.3 : 1, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 4, height: 22, backgroundColor: COLORS.gold, borderRadius: 2, marginRight: 4 }} />
                  <View style={{ width: 0, height: 0, borderTopWidth: 11, borderBottomWidth: 11, borderRightWidth: 14, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: COLORS.gold }} />
                  <View style={{ width: 0, height: 0, borderTopWidth: 11, borderBottomWidth: 11, borderRightWidth: 14, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: COLORS.gold, marginLeft: -5 }} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => { if (isPlaying) videoRef.current?.pauseAsync(); else videoRef.current?.playAsync(); }}
                style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)' }}>
                {isPlaying ? (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ width: 6, height: 26, backgroundColor: '#fff', borderRadius: 3 }} />
                    <View style={{ width: 6, height: 26, backgroundColor: '#fff', borderRadius: 3 }} />
                  </View>
                ) : (
                  <View style={{ width: 0, height: 0, borderTopWidth: 15, borderBottomWidth: 15, borderLeftWidth: 24, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: '#fff', marginLeft: 5 }} />
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={handleNext} disabled={epIndex <= 0}
                style={{ opacity: epIndex <= 0 ? 0.3 : 1, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 0, height: 0, borderTopWidth: 11, borderBottomWidth: 11, borderLeftWidth: 14, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: COLORS.gold }} />
                  <View style={{ width: 0, height: 0, borderTopWidth: 11, borderBottomWidth: 11, borderLeftWidth: 14, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: COLORS.gold, marginLeft: -5 }} />
                  <View style={{ width: 4, height: 22, backgroundColor: COLORS.gold, borderRadius: 2, marginLeft: 4 }} />
                </View>
              </TouchableOpacity>
            </View>

            {isBuffering && (
              <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={COLORS.gold} size="large" />
              </View>
            )}

            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 }}>
              <Slider
                style={{ width: '100%', height: 20 }}
                minimumValue={0}
                maximumValue={duration || 1}
                value={position}
                minimumTrackTintColor={COLORS.gold}
                maximumTrackTintColor="rgba(255,255,255,0.3)"
                thumbTintColor={COLORS.gold}
                onSlidingComplete={val => videoRef.current?.setPositionAsync(val * 1000)}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
                  {formatTime(position)} / {formatTime(duration)}
                </Text>
                <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                  {/* Tombol kualitas — buka modal pilih resolusi & server */}
                  <TouchableOpacity onPress={() => setShowServerModal(true)}
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: `${COLORS.gold}80` }}>
                    <Text style={{ color: COLORS.gold, fontSize: 11, fontWeight: '900' }}>
                      {selectedQuality || 'AUTO'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={toggleFullscreen} style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ width: 18, height: 18, position: 'relative' }}>
                      <View style={{ position: 'absolute', top: 0, left: 0, width: 7, height: 2, backgroundColor: '#fff' }} />
                      <View style={{ position: 'absolute', top: 0, left: 0, width: 2, height: 7, backgroundColor: '#fff' }} />
                      <View style={{ position: 'absolute', top: 0, right: 0, width: 7, height: 2, backgroundColor: '#fff' }} />
                      <View style={{ position: 'absolute', top: 0, right: 0, width: 2, height: 7, backgroundColor: '#fff' }} />
                      <View style={{ position: 'absolute', bottom: 0, left: 0, width: 7, height: 2, backgroundColor: '#fff' }} />
                      <View style={{ position: 'absolute', bottom: 0, left: 0, width: 2, height: 7, backgroundColor: '#fff' }} />
                      <View style={{ position: 'absolute', bottom: 0, right: 0, width: 7, height: 2, backgroundColor: '#fff' }} />
                      <View style={{ position: 'absolute', bottom: 0, right: 0, width: 2, height: 7, backgroundColor: '#fff' }} />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {!isFullscreen && (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Episode nav */}
          <View style={{ flexDirection: 'row', gap: 12, padding: 16 }}>
            <TouchableOpacity onPress={handlePrev} disabled={epIndex >= episodes.length - 1}
              style={{ flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 12,
                paddingVertical: 14, alignItems: 'center', opacity: epIndex >= episodes.length - 1 ? 0.3 : 1 }}>
              <Text style={{ color: '#fff', fontWeight: '900' }}>‹ Sebelumnya</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNext} disabled={epIndex <= 0}
              style={{ flex: 1, borderWidth: 1, borderColor: `${COLORS.gold}60`, borderRadius: 12,
                paddingVertical: 14, alignItems: 'center', opacity: epIndex <= 0 ? 0.3 : 1 }}>
              <Text style={{ color: COLORS.gold, fontWeight: '900' }}>Selanjutnya ›</Text>
            </TouchableOpacity>
          </View>

          {/* AutoNext toggle */}
          <TouchableOpacity onPress={() => setAutoNext(p => !p)}
            style={{ marginHorizontal: 16, marginBottom: 16, paddingVertical: 14, borderRadius: 12,
              borderWidth: 1, borderColor: autoNext ? `${COLORS.gold}60` : 'rgba(255,255,255,0.1)', alignItems: 'center' }}>
            <Text style={{ color: autoNext ? COLORS.gold : 'rgba(255,255,255,0.4)', fontWeight: '900', fontSize: 13 }}>
              AutoNext {autoNext ? 'ON' : 'OFF'}
            </Text>
            <Text style={{ color: autoNext ? `${COLORS.gold}80` : 'rgba(255,255,255,0.2)', fontSize: 10, marginTop: 2 }}>
              hidupkan untuk memutar otomatis episode selanjutnya
            </Text>
          </TouchableOpacity>

          {/* Server selector (below video, non-fullscreen) */}
          {availableQualities.length > 0 && (
            <View style={{ marginHorizontal: 16, backgroundColor: COLORS.card, borderRadius: 12,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', padding: 16, marginBottom: 16 }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                Pilih Server
              </Text>
              {availableQualities.map(quality => (
                <View key={quality} style={{ marginBottom: 12 }}>
                  <Text style={{ color: COLORS.gold, fontWeight: '900', fontSize: 11, marginBottom: 6 }}>{quality}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {serverGroup[quality].map((s, idx) => {
                      const isActive = selectedServer?.id === s.id;
                      return (
                        <TouchableOpacity key={s.id}
                          onPress={() => selectQualityAndServer(quality, s)}
                          style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
                            backgroundColor: isActive ? COLORS.gold : COLORS.bg,
                            borderWidth: 1, borderColor: isActive ? COLORS.gold : 'rgba(255,255,255,0.1)' }}>
                          <Text style={{ color: isActive ? '#000' : '#fff', fontSize: 11, fontWeight: '900' }}>
                            Server {idx + 1}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Episode list */}
          <View style={{ marginHorizontal: 16, backgroundColor: COLORS.card, borderRadius: 12,
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', padding: 16, marginBottom: 16 }}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
              Daftar Episode
            </Text>
            <FlatList
              data={[...episodes].reverse()}
              keyExtractor={e => e.id}
              numColumns={6}
              scrollEnabled={false}
              columnWrapperStyle={{ gap: 6, marginBottom: 6 }}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => changeEpisode(item)}
                  style={{ flex: 1, aspectRatio: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: currentEpId === item.id ? COLORS.gold : COLORS.bg,
                    borderWidth: 1, borderColor: currentEpId === item.id ? COLORS.gold : 'rgba(255,255,255,0.05)' }}>
                  <Text style={{ fontSize: 11, fontWeight: '900', color: currentEpId === item.id ? '#000' : 'rgba(255,255,255,0.5)' }}>
                    {item.index}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>

          {/* Anime info */}
          {anime && (
            <View style={{ marginHorizontal: 16, backgroundColor: COLORS.card, borderRadius: 12,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', padding: 16, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <Image source={{ uri: anime.image_poster }} style={{ width: 100, borderRadius: 8 }}
                  resizeMode="cover" aspectRatio={3 / 4.2} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, marginBottom: 4 }} numberOfLines={2}>
                    {anime.title}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
                    <View style={{ backgroundColor: COLORS.gold, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }}>
                      <Text style={{ color: '#000', fontSize: 9, fontWeight: '900' }}>{anime.type}</Text>
                    </View>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '700' }}>{anime.status}</Text>
                    </View>
                  </View>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, lineHeight: 16 }} numberOfLines={4}>
                    {anime.synopsis}
                  </Text>
                </View>
              </View>
              {anime.genre && (
                <Text style={{ color: COLORS.gold, fontSize: 11, fontWeight: '700', marginTop: 12 }}>
                  {anime.genre.replace(/,/g, ', ')}
                </Text>
              )}
            </View>
          )}

          {/* Share */}
          <TouchableOpacity onPress={handleShare}
            style={{ marginHorizontal: 16, marginBottom: 16, paddingVertical: 14, borderRadius: 12,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', flexDirection: 'row',
              justifyContent: 'center', gap: 8 }}>
            <Text style={{ fontSize: 16 }}>↗</Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '900', fontSize: 13 }}>Bagikan Anime Ini</Text>
          </TouchableOpacity>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <View style={{ marginHorizontal: 16 }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13, marginBottom: 12,
                textTransform: 'uppercase', letterSpacing: 1 }}>Rekomendasi Lainnya</Text>
              {recommendations.map(a => (
                <TouchableOpacity key={a.id}
                  onPress={() => router.replace(`/watch/${getAnimeSlug(a)}`)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12,
                    backgroundColor: COLORS.card, borderRadius: 12, padding: 12,
                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}
                  activeOpacity={0.8}>
                  <Image source={{ uri: a.image_poster }} style={{ width: 48, borderRadius: 8 }}
                    resizeMode="cover" aspectRatio={3 / 4.2} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }} numberOfLines={1}>{a.title}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 4 }}>
                      {a.type} • {a.status}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
