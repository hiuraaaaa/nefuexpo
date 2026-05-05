import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Image,
  ActivityIndicator, Share,
  Dimensions, StatusBar, Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import * as ScreenOrientation from 'expo-screen-orientation';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { COLORS } from '@/constants';
import { api, getProxyUrl, getAnimeSlug, decodeAnimeId, formatTime } from '@/hooks/api';
import { historyStorage } from '@/hooks/storage';
import { AnimeDetail, Episode, Server, Anime } from '@/types';
import { WatchSkeleton } from '@/components/Skeleton';

const { width } = Dimensions.get('window');

type ServerGroup = { [quality: string]: Server[] };

export default function WatchScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const epParam = useLocalSearchParams<{ ep?: string }>().ep;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const videoRef = useRef<Video>(null);

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

  useEffect(() => {
    if (!animeId) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const [detailRes, recRes] = await Promise.all([api.detail(animeId), api.popular()]);
        if (detailRes.status && detailRes.data) {
          setAnime(detailRes.data);
          const eps = detailRes.data.episode_list || [];
          setEpisodes(eps);
          const target = epParam ? eps.find(e => e.index.toString() === epParam) : eps[eps.length - 1];
          if (target) setCurrentEpId(target.id);
        }
        setRecommendations((recRes.data || []).slice(0, 5));
      } catch {}
      setIsLoading(false);
    };
    load();
  }, [animeId]);

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

      {/* ── Quality/Server Modal ── */}
      <Modal visible={showServerModal} transparent animationType="slide" onRequestClose={() => setShowServerModal(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' }}
          activeOpacity={1}
          onPress={() => setShowServerModal(false)}
        >
          <View style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            backgroundColor: '#1a1a1f',
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            padding: 24, paddingBottom: 40,
            borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
          }}>
            {/* Handle bar */}
            <View style={{ width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15, marginBottom: 20, letterSpacing: 0.5 }}>
              Pilih Kualitas & Server
            </Text>
            {availableQualities.map(quality => (
              <View key={quality} style={{ marginBottom: 18 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <View style={{ width: 3, height: 14, backgroundColor: COLORS.gold, borderRadius: 2, marginRight: 8 }} />
                  <Text style={{ color: COLORS.gold, fontWeight: '900', fontSize: 12, letterSpacing: 1 }}>{quality}</Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {serverGroup[quality].map((s, idx) => {
                    const isActive = selectedServer?.id === s.id;
                    return (
                      <TouchableOpacity
                        key={s.id}
                        onPress={() => selectQualityAndServer(quality, s)}
                        style={{
                          paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10,
                          backgroundColor: isActive ? COLORS.gold : 'rgba(255,255,255,0.05)',
                          borderWidth: 1,
                          borderColor: isActive ? COLORS.gold : 'rgba(255,255,255,0.08)',
                        }}>
                        <Text style={{ color: isActive ? '#000' : 'rgba(255,255,255,0.7)', fontWeight: '800', fontSize: 12 }}>
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
      <TouchableOpacity
        activeOpacity={1}
        onPress={resetControlsTimer}
        style={{ width: '100%', height: videoHeight, backgroundColor: '#000' }}
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
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <ActivityIndicator color={COLORS.gold} size="large" />
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '600' }}>
              {isEpLoading ? 'Memuat episode...' : 'Video tidak tersedia'}
            </Text>
          </View>
        )}

        {/* Controls overlay */}
        {showControls && selectedServer && !isEpLoading && (
          <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)' }}>

            {/* Top bar */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 }}>
              <TouchableOpacity
                onPress={() => { if (isFullscreen) toggleFullscreen(); else router.back(); }}
                style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 18, lineHeight: 20 }}>‹</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }} numberOfLines={1}>
                  {anime?.title}
                </Text>
                <Text style={{ color: COLORS.gold, fontWeight: '700', fontSize: 11, marginTop: 1 }}>
                  Episode {currentEpNum}
                </Text>
              </View>
            </View>

            {/* Center controls */}
            <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 36 }}>
              {/* Prev */}
              <TouchableOpacity
                onPress={handlePrev}
                disabled={epIndex >= episodes.length - 1}
                style={{ opacity: epIndex >= episodes.length - 1 ? 0.3 : 1, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 3, height: 20, backgroundColor: '#fff', borderRadius: 2, marginRight: 3 }} />
                  <View style={{ width: 0, height: 0, borderTopWidth: 10, borderBottomWidth: 10, borderRightWidth: 14, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: '#fff' }} />
                  <View style={{ width: 0, height: 0, borderTopWidth: 10, borderBottomWidth: 10, borderRightWidth: 14, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: '#fff', marginLeft: -5 }} />
                </View>
              </TouchableOpacity>

              {/* Play/Pause */}
              <TouchableOpacity
                onPress={() => { if (isPlaying) videoRef.current?.pauseAsync(); else videoRef.current?.playAsync(); }}
                style={{
                  width: 68, height: 68, borderRadius: 34,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                {isPlaying ? (
                  <View style={{ flexDirection: 'row', gap: 7 }}>
                    <View style={{ width: 5, height: 24, backgroundColor: '#fff', borderRadius: 2 }} />
                    <View style={{ width: 5, height: 24, backgroundColor: '#fff', borderRadius: 2 }} />
                  </View>
                ) : (
                  <View style={{ width: 0, height: 0, borderTopWidth: 14, borderBottomWidth: 14, borderLeftWidth: 22, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: '#fff', marginLeft: 4 }} />
                )}
              </TouchableOpacity>

              {/* Next */}
              <TouchableOpacity
                onPress={handleNext}
                disabled={epIndex <= 0}
                style={{ opacity: epIndex <= 0 ? 0.3 : 1, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 0, height: 0, borderTopWidth: 10, borderBottomWidth: 10, borderLeftWidth: 14, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: '#fff' }} />
                  <View style={{ width: 0, height: 0, borderTopWidth: 10, borderBottomWidth: 10, borderLeftWidth: 14, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: '#fff', marginLeft: -5 }} />
                  <View style={{ width: 3, height: 20, backgroundColor: '#fff', borderRadius: 2, marginLeft: 3 }} />
                </View>
              </TouchableOpacity>
            </View>

            {isBuffering && (
              <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={COLORS.gold} size="large" />
              </View>
            )}

            {/* Bottom bar */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 12, paddingBottom: 8 }}>
              <Slider
                style={{ width: '100%', height: 20 }}
                minimumValue={0}
                maximumValue={duration || 1}
                value={position}
                minimumTrackTintColor={COLORS.gold}
                maximumTrackTintColor="rgba(255,255,255,0.2)"
                thumbTintColor={COLORS.gold}
                onSlidingComplete={val => videoRef.current?.setPositionAsync(val * 1000)}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: -4 }}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700' }}>
                  {formatTime(position)} / {formatTime(duration)}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => setShowServerModal(true)}
                    style={{
                      backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 4,
                      borderRadius: 6, borderWidth: 1, borderColor: `${COLORS.gold}60`,
                    }}>
                    <Text style={{ color: COLORS.gold, fontSize: 11, fontWeight: '900' }}>
                      {selectedQuality || 'AUTO'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={toggleFullscreen} style={{ padding: 4 }}>
                    <Text style={{ color: '#fff', fontSize: 16 }}>{isFullscreen ? '⛶' : '⛶'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* ── Content below player ── */}
      {!isFullscreen && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

          {/* Episode nav buttons */}
          <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 }}>
            <TouchableOpacity
              onPress={handlePrev}
              disabled={epIndex >= episodes.length - 1}
              style={{
                flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
                opacity: epIndex >= episodes.length - 1 ? 0.35 : 1,
              }}>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontWeight: '800', fontSize: 13 }}>‹ Sebelumnya</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleNext}
              disabled={epIndex <= 0}
              style={{
                flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center',
                backgroundColor: `${COLORS.gold}18`,
                borderWidth: 1, borderColor: `${COLORS.gold}50`,
                opacity: epIndex <= 0 ? 0.35 : 1,
              }}>
              <Text style={{ color: COLORS.gold, fontWeight: '800', fontSize: 13 }}>Selanjutnya ›</Text>
            </TouchableOpacity>
          </View>

          {/* AutoNext + Share row */}
          <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 10 }}>
            <TouchableOpacity
              onPress={() => setAutoNext(p => !p)}
              style={{
                flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
                backgroundColor: autoNext ? `${COLORS.gold}18` : 'rgba(255,255,255,0.04)',
                borderWidth: 1, borderColor: autoNext ? `${COLORS.gold}50` : 'rgba(255,255,255,0.07)',
                flexDirection: 'row', justifyContent: 'center', gap: 6,
              }}>
              <View style={{
                width: 10, height: 10, borderRadius: 5,
                backgroundColor: autoNext ? COLORS.gold : 'rgba(255,255,255,0.2)',
              }} />
              <Text style={{ color: autoNext ? COLORS.gold : 'rgba(255,255,255,0.4)', fontWeight: '800', fontSize: 12 }}>
                Auto Next {autoNext ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShare}
              style={{
                paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
                flexDirection: 'row', alignItems: 'center', gap: 6,
              }}>
              <Text style={{ fontSize: 14 }}>↗</Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '800', fontSize: 12 }}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* Server selector */}
          {availableQualities.length > 0 && (
            <View style={{
              marginHorizontal: 16, marginBottom: 12,
              backgroundColor: '#13131a', borderRadius: 16,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden',
            }}>
              <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8 }}>
                  <View style={{ width: 3, height: 16, backgroundColor: COLORS.gold, borderRadius: 2 }} />
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 }}>PILIH SERVER</Text>
                </View>
                {availableQualities.map(quality => (
                  <View key={quality} style={{ marginBottom: 14 }}>
                    <Text style={{ color: COLORS.gold, fontWeight: '800', fontSize: 11, marginBottom: 8, letterSpacing: 1 }}>
                      {quality}
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {serverGroup[quality].map((s, idx) => {
                        const isActive = selectedServer?.id === s.id;
                        return (
                          <TouchableOpacity
                            key={s.id}
                            onPress={() => selectQualityAndServer(quality, s)}
                            style={{
                              paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10,
                              backgroundColor: isActive ? COLORS.gold : 'rgba(255,255,255,0.05)',
                              borderWidth: 1,
                              borderColor: isActive ? COLORS.gold : 'rgba(255,255,255,0.08)',
                            }}>
                            <Text style={{ color: isActive ? '#000' : 'rgba(255,255,255,0.65)', fontWeight: '800', fontSize: 12 }}>
                              Server {idx + 1}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Episode list */}
          <View style={{
            marginHorizontal: 16, marginBottom: 12,
            backgroundColor: '#13131a', borderRadius: 16,
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden',
          }}>
            <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8 }}>
                <View style={{ width: 3, height: 16, backgroundColor: COLORS.gold, borderRadius: 2 }} />
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 }}>DAFTAR EPISODE</Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {[...episodes].reverse().map(item => {
                  const isActive = currentEpId === item.id;
                  const chipSize = (width - 32 - 32 - 6 * 5) / 6;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => changeEpisode(item)}
                      style={{
                        width: chipSize, height: chipSize, borderRadius: 8,
                        alignItems: 'center', justifyContent: 'center',
                        backgroundColor: isActive ? COLORS.gold : 'rgba(255,255,255,0.05)',
                        borderWidth: 1,
                        borderColor: isActive ? COLORS.gold : 'rgba(255,255,255,0.06)',
                      }}>
                      <Text style={{
                        fontSize: 11, fontWeight: '900',
                        color: isActive ? '#000' : 'rgba(255,255,255,0.45)',
                      }}>
                        {item.index}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Anime info card */}
          {anime && (
            <View style={{
              marginHorizontal: 16, marginBottom: 12,
              backgroundColor: '#13131a', borderRadius: 16,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden',
            }}>
              {/* Cover banner */}
              <View style={{ height: 90, overflow: 'hidden' }}>
                <Image
                  source={{ uri: anime.image_cover || anime.image_poster }}
                  style={{ width: '100%', height: '100%', opacity: 0.35 }}
                  resizeMode="cover"
                />
                <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(19,19,26,0.5)' }} />
              </View>

              <View style={{ padding: 16, marginTop: -30 }}>
                <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-end' }}>
                  <Image
                    source={{ uri: anime.image_poster }}
                    style={{ width: 80, borderRadius: 10, aspectRatio: 3 / 4.2, borderWidth: 2, borderColor: '#13131a' }}
                    resizeMode="cover"
                  />
                  <View style={{ flex: 1, paddingBottom: 4 }}>
                    <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15, marginBottom: 6 }} numberOfLines={2}>
                      {anime.title}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                      {anime.type ? (
                        <View style={{ backgroundColor: COLORS.gold, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 }}>
                          <Text style={{ color: '#000', fontSize: 9, fontWeight: '900' }}>{anime.type}</Text>
                        </View>
                      ) : null}
                      {anime.status ? (
                        <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 }}>
                          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '700' }}>{anime.status}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>

                {anime.synopsis ? (
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 18, marginTop: 14 }} numberOfLines={4}>
                    {anime.synopsis}
                  </Text>
                ) : null}

                {anime.genre ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                    {anime.genre.split(',').map((g, i) => (
                      <View key={i} style={{ backgroundColor: `${COLORS.gold}15`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: `${COLORS.gold}30` }}>
                        <Text style={{ color: COLORS.gold, fontSize: 10, fontWeight: '700' }}>{g.trim()}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            </View>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <View style={{ marginHorizontal: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
                <View style={{ width: 3, height: 16, backgroundColor: COLORS.gold, borderRadius: 2 }} />
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 }}>REKOMENDASI</Text>
              </View>
              {recommendations.map(a => (
                <TouchableOpacity
                  key={a.id}
                  onPress={() => router.replace(`/watch/${getAnimeSlug(a)}`)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10,
                    backgroundColor: '#13131a', borderRadius: 14, padding: 12,
                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
                  }}
                  activeOpacity={0.8}>
                  <Image
                    source={{ uri: a.image_poster }}
                    style={{ width: 48, borderRadius: 8, aspectRatio: 3 / 4.2 }}
                    resizeMode="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }} numberOfLines={1}>{a.title}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 4 }}>
                      {a.type}{a.status ? ` • ${a.status}` : ''}
                    </Text>
                  </View>
                  <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 18 }}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
