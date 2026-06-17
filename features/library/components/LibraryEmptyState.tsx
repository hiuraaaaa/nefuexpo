// features/library/components/LibraryEmptyState.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
    ? 'Belum Login'
    : isFavorit
      ? 'Belum Ada Favorit'
      : 'Belum Ada Riwayat';

  const subtitle = !loggedIn
    ? 'Login untuk menyimpan favorit & riwayat tontonan kamu'
    : isFavorit
      ? 'Tap ikon bookmark di halaman anime untuk menyimpannya di sini'
      : 'Anime yang kamu tonton akan muncul di sini secara otomatis';

  return (
    <View style={{ alignItems: 'center', paddingVertical: 80, paddingHorizontal: 32 }}>
      <View style={{
        width: 72, height: 72, borderRadius: 22,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: `${theme.accent}12`,
        borderWidth: 1, borderColor: `${theme.accent}25`,
        marginBottom: 16,
      }}>
        <Ionicons
          name={!loggedIn ? 'person-outline' : isFavorit ? 'bookmark-outline' : 'time-outline'}
          size={32}
          color={`${theme.accent}80`}
        />
      </View>
      <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800', marginBottom: 6 }}>
        {title}
      </Text>
      <Text style={{ color: theme.subtext, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
        {subtitle}
      </Text>

      {!loggedIn && (
        <TouchableOpacity
          onPress={() => { Haptics.selectionAsync(); router.push('/profile'); }}
          style={{
            marginTop: 18,
            backgroundColor: theme.accent,
            paddingHorizontal: 22, paddingVertical: 11,
            borderRadius: 13,
          }}
        >
          <Text style={{ color: theme.bg, fontWeight: '800', fontSize: 13 }}>Login Sekarang</Text>
        </TouchableOpacity>
      )}

      {loggedIn && isFavorit && (
        <TouchableOpacity
          onPress={() => { Haptics.selectionAsync(); router.push('/'); }}
          style={{
            marginTop: 18,
            backgroundColor: `${theme.accent}15`,
            borderWidth: 1, borderColor: `${theme.accent}30`,
            paddingHorizontal: 22, paddingVertical: 11,
            borderRadius: 13,
          }}
        >
          <Text style={{ color: theme.accent, fontWeight: '800', fontSize: 13 }}>Jelajahi Anime</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

