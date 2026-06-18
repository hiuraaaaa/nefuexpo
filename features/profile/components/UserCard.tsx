// UserCard.tsx
//
// Signature: name reads as a byline/masthead, level title as a subtitle line.
// Avatar gets a real frame — colored ring + slight rotation tag — so it reads
// as a designed object instead of a bare square thumbnail floating in empty
// space. Background gets a soft radial tint behind the name so the header
// doesn't sit on flat black.
import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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
    <View style={{ paddingTop: 14, marginBottom: 28 }}>
      {/* Soft tinted wash behind the header instead of flat black */}
      <LinearGradient
        colors={[`${theme.accent}1c`, `${theme.accent}00`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 210 }}
        pointerEvents="none"
      />

      <View style={{ paddingHorizontal: 22, flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, paddingRight: 18 }}>
          <Text style={{ color: theme.accent, fontSize: 10, fontWeight: '800', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>
            {admin ? 'Admin · Akun' : 'Akun'}
          </Text>

          <Text
            style={{ color: theme.text, fontWeight: '900', fontSize: 30, letterSpacing: -0.8, lineHeight: 34 }}
            numberOfLines={1}
          >
            {user.displayName ?? 'User'}
          </Text>

          {/* Level title as a colored chip-on-baseline, not a pill, but with
              actual fill behind it so it isn't bare text floating alone */}
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <Text style={{
              color: theme.bg, backgroundColor: theme.accent,
              fontSize: 12.5, fontWeight: '900',
              paddingHorizontal: 9, paddingVertical: 4,
              borderRadius: 5, overflow: 'hidden',
              transform: [{ rotate: '-1.5deg' }],
            }}>
              {current.title.toUpperCase()}
            </Text>
          </View>

          <Text style={{ color: theme.subtext, fontSize: 11.5, marginTop: 10 }} numberOfLines={1}>
            {user.email ?? ''}
          </Text>
        </View>

        {/* Avatar with a real frame: colored ring offset + slight tilt */}
        <View style={{ width: 64, height: 64, marginTop: 2 }}>
          <View style={{
            position: 'absolute', top: -4, left: -4, right: 4, bottom: 4,
            borderRadius: 12, borderWidth: 1.5, borderColor: `${theme.accent}50`,
            transform: [{ rotate: '4deg' }],
          }} />
          <Image
            source={{ uri: user.photoURL ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName ?? 'U')}` }}
            style={{ width: 64, height: 64, borderRadius: 12, borderWidth: 2, borderColor: theme.bg }}
            contentFit="cover"
          />
        </View>
      </View>

      <View style={{ paddingHorizontal: 22, marginTop: 20 }}>
        <View style={{ height: 2, width: 36, backgroundColor: theme.accent, borderRadius: 1, marginBottom: 14 }} />
        <TouchableOpacity onPress={handleLogout} hitSlop={{ top: 6, bottom: 6 }}>
          <Text style={{ color: theme.subtext, fontSize: 12, fontWeight: '600' }}>
            Keluar dari akun
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
