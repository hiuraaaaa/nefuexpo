import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Share, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import auth from '@react-native-firebase/auth';
import { COLORS } from '@/constants';
import { decodeAnimeId } from '@/hooks/api/api';
import { historyStorage, favoritStorage, storageMain } from '@/hooks/storage/storage';
import { getCurrentUser } from '@/hooks/auth';
import { WatchSkeleton } from '@/components/Skeleton';
import { useRoomContext } from '@/contexts/RoomContext';

import { useWatchData }       from './hooks/useWatchData';
import { useEpisodeLoader }   from './hooks/useEpisodeLoader';
import { usePlayerSync }      from './hooks/usePlayerSync';
import { useProgressTracker } from './hooks/useProgressTracker';
import { useEpisodeNav }      from './hooks/useEpisodeNav';

import { VideoPlayer }        from './components/VideoPlayer';
import { EpisodeList }        from './components/EpisodeList';
import { AnimeInfo }          from './components/AnimeInfo';
import { ServerModal }        from './components/ServerModal';
import { RecommendationList } from './components/RecommendationList';

// FIX BUG 1: hapus useRoom dari sini, semua state dari useRoomContext aja
import { useSync, RoomModal, NobarBar } from '@/features/nobar';

export default function WatchScreen() {
  const { slug }  = useLocalSearchParams<{ slug: string }>();
  const epParam   = useLocalSearchParams<{ ep?: string }>().ep;
  const router    = useRouter();
  const insets    = useSafeAreaInsets();
  const animeId   = decodeAnimeId(slug ?? '');

  const [showServerModal, setShowServerModal] = useState(false);
  const [showRoomModal, setShowRoomModal]     = useState(false);
  const [isFavorited, setIsFavorited]         = useState(false);
  const [autoNext, setAutoNext]               = useState(() => historyStorage.getAutoNext());
  const [pipEnabled, setPipEnabled]           = useState(() => storageMain.getBoolean('nefusoft_pip')  ?? false);
  const [infoEnabled, setInfoEnabled]         = useState(() => storageMain.getBoolean('nefusoft_info') ?? false);

  const currentUid = auth().currentUser?.uid ?? '';

  useFocusEffect(useCallback(() => {
    setPipEnabled(storageMain.getBoolean('nefusoft_pip')   ?? false);
    setInfoEnabled(storageMain.getBoolean('nefusoft_info') ?? false);
  }, []));

  const watchData = useWatchData(animeId, epParam);
  const epLoader  = useEpisodeLoader(watchData.currentEpId);
  const epNav     = useEpisodeNav(watchData.episodes, watchData.currentEpId, watchData.setCurrentEpId);

  const handleAutoNext = useCallback(() => {
    epNav.handleNext();
  }, [epNav]);

  const playerSync = usePlayerSync(epLoader.player, () => { if (autoNext) handleAutoNext(); });

  // ── Nobar — semua dari context, satu sumber kebenaran ────────────────────
  const {
    roomCode, room, members, messages,
    isHost, loading: roomLoading, error: roomError,
    createRoom, joinRoom, leaveRoom,
    sendMessage, updatePlayback,
  } = useRoomContext();

  const { hostTogglePlay, hostSeek } = useSync({
    room,
    isHost,
    player:    epLoader.player,
    isPlaying: playerSync.isPlaying,
    position:  playerSync.position,
    updatePlayback,
    onEpisodeChange: (episodeId, episodeNum) => {
      const ep = watchData.episodes.find(e => e.id === episodeId);
      if (ep) epNav.changeEpisode(ep);
    },
  });

  // FIX BUG 4: capture isPlaying SEBELUM toggle, bukan setelah
  const handleTogglePlay = useCallback(() => {
    const nextPlaying = !playerSync.isPlaying; // capture dulu sebelum toggle
    playerSync.togglePlayPause();
    if (isHost && roomCode) {
      hostTogglePlay(nextPlaying);
    }
  }, [playerSync, isHost, roomCode, hostTogglePlay]);

  // Wrap onSlidingComplete — host sync seek ke room
  const handleSlidingComplete = useCallback((val: number) => {
    if (epLoader.player) {
      epLoader.player.seekBy(val - (epLoader.player.currentTime ?? 0));
    }
    if (isHost && roomCode) {
      hostSeek(val);
    }
  }, [epLoader.player, isHost, roomCode, hostSeek]);

  // ─────────────────────────────────────────────────────────────────────────

  useProgressTracker({
    currentEpId: watchData.currentEpId,
    position:    playerSync.position,
    duration:    playerSync.duration,
    setEpProgress: watchData.setEpProgress,
    setWatchedEps: watchData.setWatchedEps,
  });

  // Save history
  React.useEffect(() => {
    if (!watchData.anime || !watchData.currentEpId) return;
    const ep = watchData.episodes.find(e => e.id === watchData.currentEpId);
    if (ep) historyStorage.add(watchData.anime, ep.index);
  }, [watchData.currentEpId, watchData.anime]);

  // Favorit state
  React.useEffect(() => {
    if (!watchData.anime) return;
    setIsFavorited(favoritStorage.isFavorited(watchData.anime.id));
  }, [watchData.anime]);

  // Host: sync episode ke room saat ganti episode
  React.useEffect(() => {
    if (!isHost || !roomCode || !watchData.currentEpId) return;
    updatePlayback({
      episode_id:  watchData.currentEpId,
      episode_num: epNav.currentEpNum,
      position:    0,
    });
  }, [watchData.currentEpId]); // eslint-disable-line

  const handleBack = useCallback(() => {
    if (playerSync.isFullscreen) playerSync.toggleFullscreen();
    else if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }, [playerSync.isFullscreen, playerSync.toggleFullscreen]);

  const handleBookmark = useCallback(() => {
    if (!getCurrentUser()) { Alert.alert('Login Dulu', 'Login untuk menyimpan favorit'); return; }
    if (!watchData.anime) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsFavorited(favoritStorage.toggle(watchData.anime as any));
  }, [watchData.anime]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({ message: `Tonton ${watchData.anime?.title || 'Anime'} di NefuSoft, Gratis & Tanpa Iklan!\nhttps://nefusoft.cloud`, title: 'NefuSoft' });
    } catch {}
  }, [watchData.anime]);

  const toggleAutoNext = useCallback(() => {
    setAutoNext(prev => { const n = !prev; historyStorage.setAutoNext(n); return n; });
  }, []);

  // ── Handle join room — redirect ke anime host kalau beda ─────────────────
  const handleJoinRoom = useCallback(async (code: string) => {
    const result = await joinRoom(code);
    if (result.success && result.room) {
      const { anime_id, episode_id } = result.room;
      setShowRoomModal(false);

      if (anime_id !== watchData.anime?.id) {
        router.replace(`/watch/${anime_id}`);
      } else {
        const ep = watchData.episodes.find(e => e.id === episode_id);
        if (ep) epNav.changeEpisode(ep);
      }
    }
  }, [joinRoom, watchData.anime, watchData.episodes, epNav, router]);

  if (watchData.isLoading) {
    return <View style={{ flex: 1, backgroundColor: COLORS.bg }}><WatchSkeleton /></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar hidden={playerSync.isFullscreen} barStyle="light-content" />

      <ServerModal
        visible={showServerModal}
        serverGroup={epLoader.serverGroup}
        availableQualities={epLoader.availableQualities}
        selectedServer={epLoader.selectedServer}
        onClose={() => setShowServerModal(false)}
        onSelect={(q, s) => { epLoader.selectQualityAndServer(q, s, playerSync.position); setShowServerModal(false); }}
      />

      <RoomModal
        visible={showRoomModal}
        loading={roomLoading}
        error={roomError}
        currentRoomCode={roomCode}
        animeTitle={watchData.anime?.title ?? ''}
        onClose={() => setShowRoomModal(false)}
        onCreate={() => createRoom({
          anime_id:     watchData.anime?.id ?? '',
          anime_title:  watchData.anime?.title ?? '',
          anime_poster: watchData.anime?.image_poster ?? '',
          episode_id:   watchData.currentEpId ?? '',
          episode_num:  epNav.currentEpNum,
        })}
        onJoin={handleJoinRoom}
        onLeave={leaveRoom}
      />

      <VideoPlayer
        player={epLoader.player}
        selectedServer={epLoader.selectedServer}
        isEpLoading={epLoader.isEpLoading}
        isBuffering={playerSync.isBuffering}
        isPlaying={playerSync.isPlaying}
        isFullscreen={playerSync.isFullscreen}
        showControls={playerSync.showControls}
        seekLeft={playerSync.seekLeft}
        seekRight={playerSync.seekRight}
        controlsStyle={playerSync.controlsStyle}
        position={playerSync.position}
        duration={playerSync.duration}
        selectedQuality={epLoader.selectedQuality}
        pipEnabled={pipEnabled}
        infoEnabled={infoEnabled}
        insetTop={insets.top}
        title={watchData.anime?.title ?? ''}
        currentEpNum={epNav.currentEpNum}
        isFavorited={isFavorited}
        epIndex={epNav.epIndex}
        episodesLength={watchData.episodes.length}
        canGoPrev={epNav.canGoPrev}
        canGoNext={epNav.canGoNext}
        isInRoom={!!roomCode}
        resetControlsTimer={playerSync.resetControlsTimer}
        toggleControls={playerSync.toggleControls}
        togglePlayPause={handleTogglePlay}
        toggleFullscreen={playerSync.toggleFullscreen}
        handleTapLeft={playerSync.handleTapLeft}
        handleTapRight={playerSync.handleTapRight}
        handlePrev={epNav.handlePrev}
        handleNext={epNav.handleNext}
        onBack={handleBack}
        onBookmark={handleBookmark}
        onNobar={() => setShowRoomModal(true)}
        onQualityPress={() => setShowServerModal(true)}
        onSlidingComplete={handleSlidingComplete}
      />

      {!playerSync.isFullscreen && (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

          {roomCode && (
            <NobarBar
              roomCode={roomCode}
              isHost={isHost}
              members={members}
              messages={messages}
              currentUid={currentUid}
              onOpenRoomModal={() => setShowRoomModal(true)}
              onSend={sendMessage}
            />
          )}

          {/* Nav prev/next — asimetris */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 16 }}>
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); epNav.handlePrev(); }}
              disabled={!epNav.canGoPrev}
              style={{ opacity: epNav.canGoPrev ? 1 : 0.2, paddingVertical: 8 }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.45)', fontWeight: '700', fontSize: 13 }}>‹ Sebelumnya</Text>
            </TouchableOpacity>

            <View style={{ flex: 1 }} />

            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); epNav.handleNext(); }}
              disabled={!epNav.canGoNext}
              style={{
                opacity: epNav.canGoNext ? 1 : 0.2,
                backgroundColor: COLORS.gold,
                paddingHorizontal: 20, paddingVertical: 10,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: '#000', fontWeight: '900', fontSize: 13 }}>Selanjutnya ›</Text>
            </TouchableOpacity>
          </View>

          {/* AutoNext — row kecil, toggle switch style */}
          <TouchableOpacity
            onPress={() => { Haptics.selectionAsync(); toggleAutoNext(); }}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row', alignItems: 'center',
              marginHorizontal: 16, marginBottom: 20,
              paddingVertical: 6, gap: 10,
            }}
          >
            <Text style={{
              color: 'rgba(255,255,255,0.3)',
              fontSize: 10, fontWeight: '700',
              letterSpacing: 1, textTransform: 'uppercase', flex: 1,
            }}>
              Putar otomatis
            </Text>
            {/* Toggle pill */}
            <View style={{
              width: 36, height: 20, borderRadius: 10,
              backgroundColor: autoNext ? COLORS.gold : 'rgba(255,255,255,0.1)',
              justifyContent: 'center',
              paddingHorizontal: 2,
            }}>
              <View style={{
                width: 16, height: 16, borderRadius: 8,
                backgroundColor: autoNext ? '#000' : 'rgba(255,255,255,0.4)',
                alignSelf: autoNext ? 'flex-end' : 'flex-start',
              }} />
            </View>
          </TouchableOpacity>

          <EpisodeList
            episodes={watchData.episodes}
            filteredEps={watchData.filteredEps}
            currentEpId={watchData.currentEpId}
            watchedEps={watchData.watchedEps}
            epProgress={watchData.epProgress}
            epSearch={watchData.epSearch}
            epPage={watchData.epPage}
            setEpSearch={watchData.setEpSearch}
            setEpPage={watchData.setEpPage}
            onSelectEp={epNav.changeEpisode}
          />

          {watchData.anime && <AnimeInfo anime={watchData.anime} />}

          <TouchableOpacity onPress={handleShare} style={{ marginHorizontal: 16, marginBottom: 16, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '900', fontSize: 13 }}>Bagikan Anime Ini</Text>
          </TouchableOpacity>

          <RecommendationList items={watchData.recommendations} />

        </ScrollView>
      )}
    </View>
  );
}
