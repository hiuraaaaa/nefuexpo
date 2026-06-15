// XPCard.tsx — Glassmorphism XP card with glow bar
import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/theme';
import { XPBar } from '@/components/XPBar';
import { XPData, getLevelData } from '@/hooks/xp';

export function XPCard({ xpData }: { xpData: XPData }) {
  const theme = useTheme();
  const { current, next } = getLevelData(xpData.xp);

  return (
    <Animated.View
      entering={FadeInDown.delay(60).springify()}
      style={{
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: `${theme.accent}20`,
        backgroundColor: theme.card,
      }}
    >
      {/* subtle glass shimmer */}
      <LinearGradient
        colors={[`${theme.accent}12`, 'transparent', `${theme.accent}08`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', inset: 0 }}
      />

      <View style={{ padding: 16, gap: 14 }}>
        {/* Header row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ gap: 3 }}>
            <Text style={{
              color: theme.subtext,
              fontSize: 9,
              fontWeight: '800',
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}>
              Level & XP
            </Text>
            <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800' }}>
              {current.title}{!next ? ' (MAX)' : ''}
            </Text>
          </View>

          {/* Streak pill */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            backgroundColor: `${theme.accent}18`,
            borderWidth: 1,
            borderColor: `${theme.accent}30`,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 20,
          }}>
            <Text style={{ fontSize: 14 }}>🔥</Text>
            <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '800' }}>
              {xpData.streak} hari
            </Text>
          </View>
        </View>

        {/* XP bar */}
        <XPBar xp={xpData.xp} />
      </View>
    </Animated.View>
  );
}
