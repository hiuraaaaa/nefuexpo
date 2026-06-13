import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
    <View style={{ marginHorizontal: 16, backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', padding: 16, marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>Daftar Episode</Text>
        <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '700' }}>{episodes.length} eps</Text>
      </View>

      {episodes.length > 5 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', marginBottom: 12, gap: 8 }}>
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={{ gap: 6, paddingRight: 4 }}>
          {Array.from({ length: totalPages }, (_, i) => {
            const from = i * EP_PAGE_SIZE + 1;
            const to   = Math.min((i + 1) * EP_PAGE_SIZE, episodes.length);
            const isActive = epPage === i;
            return (
              <TouchableOpacity key={i} onPress={() => { Haptics.selectionAsync(); setEpPage(i); }}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: isActive ? COLORS.gold : COLORS.bg, borderWidth: 1, borderColor: isActive ? COLORS.gold : 'rgba(255,255,255,0.1)' }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: isActive ? '#000' : 'rgba(255,255,255,0.5)' }}>{from}–{to}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <View>
        {pageEps.length === 0 ? (
          <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: '600', paddingVertical: 8 }}>Episode tidak ditemukan</Text>
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
