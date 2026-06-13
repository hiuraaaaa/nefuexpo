import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Share, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS } from '@/constants';
import { decodeAnimeId } from '@/hooks/api/api';
import { historyStorage, favoritStorage, storageMain } from '@/hooks/storage/storage';
import { getCurrentUser } from '@/hooks/auth';
import { WatchSkeleton } from '@/components/Skeleton';

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

export default function WatchScreen() {
  const { slug }  = useLocalSearchParams<{ slug: string }>();
  const epParam   = useLocalSearchParams<{ ep?: string }>().ep;
  const router    = useRouter();
  const insets    = useSafeAreaInsets();
  const animeId   = decodeAnimeId(slug ?? '');

  const [showServerModal, setShowServerModal] = useState(false);
  const [isFavorited, setIsFavorited]         = useState(false);
  const [autoNext, setAutoNext]               = useState(() => historyStorage.getAutoNext());
  const [pipEnabled, setPipEnabled]           = useState(() => storageMain.getBoolean('nefusoft_pip')  ?? false);
  const [infoEnabled, setInfoEnabled]         = useState(() => storageMain.getBoolean('nefusoft_info') ?? false);

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
        resetControlsTimer={playerSync.resetControlsTimer}
        togglePlayPause={playerSync.togglePlayPause}
        toggleFullscreen={playerSync.toggleFullscreen}
        handleTapLeft={playerSync.handleTapLeft}
        handleTapRight={playerSync.handleTapRight}
        handlePrev={epNav.handlePrev}
        handleNext={epNav.handleNext}
        onBack={handleBack}
        onBookmark={handleBookmark}
        onQualityPress={() => setShowServerModal(true)}
        onSlidingComplete={val => { if (epLoader.player) epLoader.player.seekBy(val - (epLoader.player.currentTime ?? 0)); }}
      />

      {!playerSync.isFullscreen && (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

          <View style={{ flexDirection: 'row', gap: 12, padding: 16 }}>
            <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); epNav.handlePrev(); }}
              disabled={!epNav.canGoPrev}
              style={{ flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingVertical: 14, alignItems: 'center', opacity: epNav.canGoPrev ? 1 : 0.3 }}>
              <Text style={{ color: '#fff', fontWeight: '900' }}>‹ Sebelumnya</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); epNav.handleNext(); }}
              disabled={!epNav.canGoNext}
              style={{ flex: 1, borderWidth: 1, borderColor: `${COLORS.gold}60`, borderRadius: 10, paddingVertical: 14, alignItems: 'center', opacity: epNav.canGoNext ? 1 : 0.3 }}>
              <Text style={{ color: COLORS.gold, fontWeight: '900' }}>Selanjutnya ›</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => { Haptics.selectionAsync(); toggleAutoNext(); }}
            style={{ marginHorizontal: 16, marginBottom: 16, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: autoNext ? `${COLORS.gold}60` : 'rgba(255,255,255,0.1)', alignItems: 'center' }}>
            <Text style={{ color: autoNext ? COLORS.gold : 'rgba(255,255,255,0.4)', fontWeight: '900', fontSize: 13 }}>AutoNext {autoNext ? 'ON' : 'OFF'}</Text>
            <Text style={{ color: autoNext ? `${COLORS.gold}80` : 'rgba(255,255,255,0.2)', fontSize: 10, marginTop: 2 }}>hidupkan untuk memutar otomatis episode selanjutnya</Text>
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
