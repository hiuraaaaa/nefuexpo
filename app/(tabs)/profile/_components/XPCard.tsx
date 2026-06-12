import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/theme';
import { XPBar } from '@/components/XPBar';
import { LevelBadge } from '@/components/LevelBadge';
import { XPData } from '@/hooks/xp';
import { Card } from './shared';

export function XPCard({ xpData }: { xpData: XPData }) {
  const theme = useTheme();
  return (
    <Animated.View entering={FadeInDown.delay(60).springify()}>
      <Card>
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View>
              <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                Level & XP
              </Text>
              <Text style={{ color: theme.subtext, fontSize: 11, marginTop: 3 }}>
                🔥 {xpData.streak} hari streak
              </Text>
            </View>
            <LevelBadge xp={xpData.xp} size="md" />
          </View>
          <XPBar xp={xpData.xp} />
        </View>
      </Card>
    </Animated.View>
  );
}
