// features/library/components/LibraryEmptyState.tsx
//
// Signature: no centered icon-in-circle. Empty state reads like a torn ticket
// stub — big oversized punctuation mark set off-axis, left-aligned copy,
// asymmetric single CTA that isn't full-width or centered.
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/theme';
import { LibraryTab } from '../hooks/useLibraryData';

interface Props {
  tab: LibraryTab;
  loggedIn: boolean;
}

export function LibraryEmptyState({ tab, loggedIn }: Props) {
  const theme  = useTheme();
  const router = useRouter();
  const isFavorit = tab === 'favorit';

  const title = !loggedIn
    ? 'Login dulu'
    : isFavorit
      ? 'Belum ada favorit'
      : 'Belum ada riwayat';

  const subtitle = !loggedIn
    ? 'Favorit dan riwayat tontonan kamu tersimpan begitu login.'
    : isFavorit
      ? 'Tekan tanda simpan di halaman anime — judulnya akan muncul di sini.'
      : 'Episode yang kamu tonton tercatat otomatis di sini.';

  const ctaLabel = !loggedIn ? 'Login' : isFavorit ? 'Cari anime' : null;

  return (
    <View style={{ flex: 1, paddingHorizontal: 26, paddingTop: 40 }}>
      {/* Oversized mark, pushed left, slight rotation — not centered, not a stock icon */}
      <Text style={{
        color: `${theme.accent}30`,
        fontSize: 96,
        fontWeight: '900',
        lineHeight: 96,
        marginLeft: -6,
        transform: [{ rotate: '-4deg' }],
      }}>
        {isFavorit ? '⌘' : '∿'}
      </Text>

      <Text style={{
        color: theme.text, fontSize: 19, fontWeight: '800',
        marginTop: 4, marginBottom: 8,
      }}>
        {title}
      </Text>

      <Text style={{
        color: theme.subtext, fontSize: 13, lineHeight: 19,
        maxWidth: 260,
      }}>
        {subtitle}
      </Text>

      {ctaLabel && (
        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            router.push(!loggedIn ? '/profile' : '/');
          }}
          style={{
            alignSelf: 'flex-start',
            marginTop: 22,
            borderBottomWidth: 2,
            borderBottomColor: theme.accent,
            paddingBottom: 4,
          }}
        >
          <Text style={{ color: theme.text, fontWeight: '800', fontSize: 14 }}>
            {ctaLabel} →
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
