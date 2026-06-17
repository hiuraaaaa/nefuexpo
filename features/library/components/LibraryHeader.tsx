// features/library/components/LibraryHeader.tsx
//
// Signature: two stacked labels read like a film canister tag — big serif-weight
// title on top, the inactive tab demoted to a small sideways-anchored caption
// underneath instead of a symmetric pill switcher. Tapping the caption swaps
// which side is "loaded". Underline is a single thick stroke offset to the left
// of whichever word is active, not a centered pill.
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/theme';
import { LibraryTab } from '../hooks/useLibraryData';

interface Props {
  tab: LibraryTab;
  onChange: (tab: LibraryTab) => void;
  favoritCount: number;
  historyCount: number;
  onClearHistory?: () => void;
}

export function LibraryHeader({ tab, onChange, favoritCount, historyCount, onClearHistory }: Props) {
  const theme = useTheme();
  const isFav = tab === 'favorit';

  return (
    <View style={{ paddingHorizontal: 22, paddingTop: 14, paddingBottom: 10 }}>
      {/* Eyebrow — left-anchored, not centered, deliberately short measure */}
      <Text style={{
        color: theme.subtext, fontSize: 10, fontWeight: '700',
        letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6,
      }}>
        Koleksimu
      </Text>

      {/* Two words side by side, unequal weight — active word large & bright,
          inactive word small, lowered, and pushed to baseline like a subtitle */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 14 }}>
        <TouchableOpacity
          onPress={() => { if (!isFav) { Haptics.selectionAsync(); onChange('favorit'); } }}
          activeOpacity={0.7}
        >
          <Text style={{
            color: isFav ? theme.text : theme.subtext,
            fontWeight: '900',
            fontSize: isFav ? 30 : 17,
            letterSpacing: -0.8,
            marginBottom: isFav ? 0 : 3,
          }}>
            Favorit
          </Text>
        </TouchableOpacity>

        <Text style={{ color: theme.subtext, fontSize: 17, fontWeight: '300', marginBottom: isFav ? 4 : 3 }}>/</Text>

        <TouchableOpacity
          onPress={() => { if (isFav) { Haptics.selectionAsync(); onChange('history'); } }}
          activeOpacity={0.7}
        >
          <Text style={{
            color: !isFav ? theme.text : theme.subtext,
            fontWeight: '900',
            fontSize: !isFav ? 30 : 17,
            letterSpacing: -0.8,
            marginBottom: !isFav ? 0 : 3,
          }}>
            Riwayat
          </Text>
        </TouchableOpacity>
      </View>

      {/* Underline offset to the left under the active word only — width keyed
          to word length, not a uniform-width bar */}
      <View style={{
        height: 3,
        width: isFav ? 58 : 64,
        backgroundColor: theme.accent,
        borderRadius: 2,
        marginTop: 8,
      }} />

      {/* Status line: count + clear action share one row, ranged left, no card wrapper */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 14,
      }}>
        <Text style={{ color: theme.subtext, fontSize: 11.5, fontWeight: '500' }}>
          {isFav
            ? favoritCount === 0 ? 'Kosong' : `${favoritCount} judul disimpan`
            : historyCount === 0 ? 'Belum ada tontonan' : `${historyCount} episode terakhir`}
        </Text>

        {!isFav && historyCount > 0 && onClearHistory && (
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onClearHistory(); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={{ color: '#e15c5c', fontSize: 11.5, fontWeight: '700' }}>
              Bersihkan
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
