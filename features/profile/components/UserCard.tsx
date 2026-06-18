// UserCard.tsx
//
// Signature: name reads as a byline/masthead — large, left-anchored, with the
// level title set underneath it as a job-title line ("Senpai", "Kage no Ou"),
// not a colored pill badge. Avatar is small and pushed off to the side rather
// than centered or overlapping a banner. No drop shadow; a single accent
// underline rule does the separating work instead of a card boundary.
import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { signOut } from '@/hooks/auth';
import { useTheme } from '@/hooks/theme';
import { getLevelData } from '@/hooks/xp';
import { XPData } from '@/hooks/xp';

interface Props {
  user:   any;
  admin:  boolean;
  xpData: XPData;
}

export function UserCard({ user, admin, xpData }: Props) {
  const theme = useTheme();
  if (!user) return null;

  const { current } = getLevelData(xpData.xp);

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Logout', 'Yakin mau logout?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <View style={{ paddingHorizontal: 22, marginBottom: 22 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        {/* Avatar — small, square-ish, offset to the right of the text rather
            than leading the row. Breaks the avatar-always-comes-first pattern. */}
        <View style={{ flex: 1, paddingRight: 16 }}>
          <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '700', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>
            {admin ? 'Admin · Akun' : 'Akun'}
          </Text>

          <Text
            style={{ color: theme.text, fontWeight: '900', fontSize: 27, letterSpacing: -0.7, lineHeight: 31 }}
            numberOfLines={1}
          >
            {user.displayName ?? 'User'}
          </Text>

          {/* Level title set as a subtitle line, not a badge */}
          <Text style={{ color: theme.accent, fontSize: 14, fontWeight: '700', marginTop: 3 }}>
            {current.title}
          </Text>

          <Text style={{ color: theme.subtext, fontSize: 11.5, marginTop: 6 }} numberOfLines={1}>
            {user.email ?? ''}
          </Text>
        </View>

        <View style={{ width: 58, height: 58, marginTop: 2 }}>
          <Image
            source={{ uri: user.photoURL ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName ?? 'U')}` }}
            style={{ width: 58, height: 58, borderRadius: 8 }}
            contentFit="cover"
          />
        </View>
      </View>

      {/* Asymmetric rule: short, left-anchored, not full width */}
      <View style={{ height: 2, width: 36, backgroundColor: theme.accent, borderRadius: 1, marginTop: 16 }} />

      {/* Logout sits as a quiet text action below, not a floating icon button */}
      <TouchableOpacity onPress={handleLogout} style={{ marginTop: 14 }} hitSlop={{ top: 6, bottom: 6 }}>
        <Text style={{ color: theme.subtext, fontSize: 12, fontWeight: '600' }}>
          Keluar dari akun
        </Text>
      </TouchableOpacity>
    </View>
  );
}
