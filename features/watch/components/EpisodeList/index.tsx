import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS } from '@/constants';
import { Episode } from '@/types';
import { EpisodeButton } from './EpisodeButton';

const EP_PAGE_SIZE = 100;

interface Props {
  episodes: Episode[];
  filteredEps: Episode[];
  currentEpId: string | null;
  watchedEps: Set<string>;
  epProgress: Record<string, number>;
  epSearch: string;
  epPage: number;
  setEpSearch: (v: string) => void;
  setEpPage: (v: number) => void;
  onSelectEp: (ep: Episode) => void;
}

export function EpisodeList({
  episodes, filteredEps, currentEpId, watchedEps,
  epProgress, epSearch, epPage, setEpSearch, setEpPage, onSelectEp,
}: Props) {
  const isSearching = epSearch.trim().length > 0;
  const totalPages  = Math.ceil(episodes.length / EP_PAGE_SIZE);
  const pageEps     = isSearching
    ? filteredEps
    : episodes.slice(epPage * EP_PAGE_SIZE, (epPage + 1) * EP_PAGE_SIZE);

  return (
    <View style={{ marginHorizontal: 16, marginBottom: 16 }}>

      {/* Header — label kiri, count + search kanan */}
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 14, gap: 8 }}>
        <Text style={{
          color: '#fff', fontWeight: '900', fontSize: 12,
          textTransform: 'uppercase', letterSpacing: 2, flex: 1,
        }}>
          Episode
        </Text>
        <Text style={{
          color: 'rgba(255,255,255,0.2)', fontSize: 10,
          fontWeight: '700', fontVariant: ['tabular-nums'],
        }}>
          {episodes.length} eps
        </Text>
      </View>

      {/* Search — underline style, bukan box */}
      {episodes.length > 5 && (
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: epSearch.length > 0
            ? `${COLORS.gold}60`
            : 'rgba(255,255,255,0.08)',
          paddingBottom: 7, marginBottom: 14, gap: 8,
        }}>
          <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>{'#'}</Text>
          <TextInput
            value={epSearch}
            onChangeText={t => { setEpSearch(t); setEpPage(0); }}
            placeholder="cari nomor episode..."
            placeholderTextColor="rgba(255,255,255,0.18)"
            keyboardType="numeric"
            style={{
              flex: 1, color: '#fff', fontSize: 13,
              fontWeight: '600', paddingVertical: 0,
            }}
          />
          {epSearch.length > 0 && (
            <TouchableOpacity onPress={() => setEpSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Page selector — compact chips */}
      {!isSearching && totalPages > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 12 }}
          contentContainerStyle={{ gap: 6 }}
        >
          {Array.from({ length: totalPages }, (_, i) => {
            const from = i * EP_PAGE_SIZE + 1;
            const to   = Math.min((i + 1) * EP_PAGE_SIZE, episodes.length);
            const isActive = epPage === i;
            return (
              <TouchableOpacity
                key={i}
                onPress={() => { Haptics.selectionAsync(); setEpPage(i); }}
                style={{
                  paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4,
                  backgroundColor: isActive ? COLORS.gold : 'transparent',
                  borderWidth: 1,
                  borderColor: isActive ? COLORS.gold : 'rgba(255,255,255,0.1)',
                }}
              >
                <Text style={{
                  fontSize: 10, fontWeight: '800',
                  color: isActive ? '#000' : 'rgba(255,255,255,0.4)',
                  fontVariant: ['tabular-nums'],
                }}>
                  {from}–{to}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Divider tipis di atas list */}
      <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 4 }} />

      {/* Episode items */}
      <View>
        {pageEps.length === 0 ? (
          <Text style={{
            color: 'rgba(255,255,255,0.2)', fontSize: 12,
            fontWeight: '600', paddingVertical: 16,
          }}>
            Episode tidak ditemukan
          </Text>
        ) : pageEps.map(item => (
          <EpisodeButton
            key={item.id}
            item={item}
            isActive={currentEpId === item.id}
            isWatched={watchedEps.has(item.id)}
            progress={epProgress[item.id] ?? 0}
            onPress={() => { Haptics.selectionAsync(); onSelectEp(item); }}
          />
        ))}
      </View>
    </View>
  );
}
