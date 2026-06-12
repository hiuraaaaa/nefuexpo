// UserCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { signOut } from '@/hooks/auth';
import { useTheme } from '@/hooks/theme';
import { LevelBadge } from '@/components/LevelBadge';
import { XPData } from '@/hooks/xp';

interface Props {
  user:    any;
  admin:   boolean;
  xpData:  XPData;
}

export function UserCard({ user, admin, xpData }: Props) {
  const theme = useTheme();

  if (!user) return null;  // ← guard, jangan render kalau user null

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Logout', 'Yakin mau logout?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(0).springify()}
      style={{
        marginHorizontal: 16, marginBottom: 8, borderRadius: 16,
        overflow: 'hidden', backgroundColor: theme.card,
        borderWidth: 1, borderColor: theme.border,
      }}
    >
      <LinearGradient
        colors={[theme.accentDim, 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}>
        <Image
          source={{ uri: user.photoURL ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName ?? 'User')}` }}
          style={{ width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderColor: theme.accent }}
        />
        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800' }} numberOfLines={1}>
              {user.displayName ?? 'User'}
            </Text>
            {admin && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: theme.accent, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 }}>
                <Ionicons name="shield-checkmark" size={9} color={theme.bg} />
                <Text style={{ color: theme.bg, fontSize: 8, fontWeight: '900' }}>ADMIN</Text>
              </View>
            )}
          </View>
          <Text style={{ color: theme.subtext, fontSize: 11 }} numberOfLines={1}>
            {user.email ?? ''}
          </Text>
          <LevelBadge xp={xpData.xp} size="sm" />
        </View>
        <TouchableOpacity
          onPress={handleLogout}
          style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' }}
        >
          <Ionicons name="log-out-outline" size={18} color={theme.subtext} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}
