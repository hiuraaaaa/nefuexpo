// UserCard.tsx — Banner + Avatar overlap, Glassmorphism style
import React from 'react';
import { View, Text, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { signOut } from '@/hooks/auth';
import { useTheme } from '@/hooks/theme';
import { LevelBadge } from '@/components/LevelBadge';
import { XPData } from '@/hooks/xp';

const { width } = Dimensions.get('window');
const BANNER_HEIGHT = 110;
const AVATAR_SIZE   = 72;
const AVATAR_OFFSET = AVATAR_SIZE / 2;

interface Props {
  user:   any;
  admin:  boolean;
  xpData: XPData;
}

export function UserCard({ user, admin, xpData }: Props) {
  const theme = useTheme();

  if (!user) return null;

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Logout', 'Yakin mau logout?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: signOut },
    ]);
  };

  // derive a banner gradient from accent
  const bannerColors: [string, string, string] = [
    `${theme.accent}55`,
    `${theme.accent}22`,
    `${theme.bg}00`,
  ];

  return (
    <Animated.View
      entering={FadeInDown.delay(0).springify()}
      style={{
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: `${theme.accent}25`,
        backgroundColor: theme.card,
      }}
    >
      {/* ── Banner ── */}
      <View style={{ height: BANNER_HEIGHT, overflow: 'hidden' }}>
        {/* Blurred user avatar as banner bg */}
        <Image
          source={{ uri: user.photoURL ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName ?? 'U')}` }}
          style={{ position: 'absolute', width: '100%', height: '100%' }}
          contentFit="cover"
          blurRadius={28}
        />
        {/* Gradient overlay on top of blurred banner */}
        <LinearGradient
          colors={bannerColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', inset: 0 }}
        />
        {/* Extra dark bottom fade so avatar pops */}
        <LinearGradient
          colors={['transparent', `${theme.card}cc`]}
          start={{ x: 0, y: 0.3 }}
          end={{ x: 0, y: 1 }}
          style={{ position: 'absolute', inset: 0 }}
        />

        {/* Logout button top-right */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            position: 'absolute', top: 12, right: 12,
            width: 32, height: 32, borderRadius: 16,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.35)',
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <Ionicons name="log-out-outline" size={15} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        {/* Admin badge top-left */}
        {admin && (
          <View style={{
            position: 'absolute', top: 12, left: 12,
            flexDirection: 'row', alignItems: 'center', gap: 4,
            backgroundColor: `${theme.accent}cc`,
            paddingHorizontal: 8, paddingVertical: 4,
            borderRadius: 6,
          }}>
            <Ionicons name="shield-checkmark" size={10} color={theme.bg} />
            <Text style={{ color: theme.bg, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 }}>ADMIN</Text>
          </View>
        )}
      </View>

      {/* ── Avatar overlap ── */}
      <View style={{ marginTop: -AVATAR_OFFSET, paddingHorizontal: 16, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          {/* Avatar with glow ring */}
          <View style={{
            width: AVATAR_SIZE + 4,
            height: AVATAR_SIZE + 4,
            borderRadius: (AVATAR_SIZE + 4) / 2,
            padding: 2,
            backgroundColor: theme.card,
            shadowColor: theme.accent,
            shadowOpacity: 0.6,
            shadowRadius: 12,
            elevation: 8,
          }}>
            <Image
              source={{ uri: user.photoURL ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName ?? 'U')}` }}
              style={{
                width: AVATAR_SIZE,
                height: AVATAR_SIZE,
                borderRadius: AVATAR_SIZE / 2,
                borderWidth: 2,
                borderColor: theme.accent,
              }}
            />
          </View>

          {/* Level badge aligned to bottom-right of avatar row */}
          <View style={{ paddingBottom: 4 }}>
            <LevelBadge xp={xpData.xp} size="md" />
          </View>
        </View>

        {/* Name + email */}
        <View style={{ marginTop: 10, gap: 3 }}>
          <Text style={{ color: theme.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 }} numberOfLines={1}>
            {user.displayName ?? 'User'}
          </Text>
          <Text style={{ color: theme.subtext, fontSize: 11 }} numberOfLines={1}>
            {user.email ?? ''}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
