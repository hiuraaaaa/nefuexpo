// app/(tabs)/library.tsx — Favorit & Riwayat (replaces old "News" tab)
import React, { useState } from 'react';
import { View, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useTheme } from '@/hooks/theme';
import { useLibraryData, LibraryTab } from '@/features/library/hooks/useLibraryData';
import { LibraryHeader }    from '@/features/library/components/LibraryHeader';
import { LibraryListItem }  from '@/features/library/components/LibraryListItem';
import { LibraryEmptyState } from '@/features/library/components/LibraryEmptyState';
import { Anime, HistoryItem } from '@/types';

export default function LibraryScreen() {
  const theme = useTheme();
  const [tab, setTab] = useState<LibraryTab>('favorit');

  const { user, favorites, history, removeFavorite, clearHistory } = useLibraryData();

  const loggedIn  = !!user;
  const data       = tab === 'favorit' ? favorites : history;
  const isEmpty    = data.length === 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <LibraryHeader
        tab={tab}
        onChange={setTab}
        favoritCount={favorites.length}
        historyCount={history.length}
        onClearHistory={clearHistory}
      />

      <View style={{
        height: 1,
        marginHorizontal: 20,
        marginBottom: 4,
        backgroundColor: `${theme.accent}15`,
        borderRadius: 1,
      }} />

      {!loggedIn || isEmpty ? (
        <LibraryEmptyState tab={tab} loggedIn={loggedIn} />
      ) : (
        <Animated.View key={tab} entering={FadeIn.duration(180)} style={{ flex: 1 }}>
          <FlatList
            data={data}
            keyExtractor={(item: Anime | HistoryItem, i) =>
              tab === 'favorit' ? (item as Anime).id : `${(item as HistoryItem).anime.id}-${i}`
            }
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 100,
            }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) =>
              tab === 'favorit' ? (
                <View style={{
                  backgroundColor: theme.card,
                  borderRadius: 16,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: `${theme.accent}15`,
                  overflow: 'hidden',
                }}>
                  <LibraryListItem kind="favorit" anime={item as Anime} onRemove={removeFavorite} last />
                </View>
              ) : (
                <View style={{
                  backgroundColor: theme.card,
                  borderRadius: 16,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: `${theme.accent}15`,
                  overflow: 'hidden',
                }}>
                  <LibraryListItem kind="history" item={item as HistoryItem} last />
                </View>
              )
            }
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

