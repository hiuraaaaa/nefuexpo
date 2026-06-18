// XPCard.tsx
//
// Signature: the XP number sits inside a bold color block (not floating on
// black), so it reads as a poster-style statistic. Rank ticks get real fill
// color variation per tier instead of one flat accent — passed/current ticks
// are warmer, future ticks are dim. MAX state gets its own distinct treatment
// (solid filled bar + "MAX" tag) instead of just 10 identical lit ticks.
import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/theme';
import { XPData, getLevelData, LEVELS } from '@/hooks/xp';

export function XPCard({ xpData }: { xpData: XPData }) {
  const theme = useTheme();
  const { current, next } = getLevelData(xpData.xp);
  const currentRankIndex = LEVELS.findIndex(l => l.level === current.level);
  const isMax = !next;

  return (
    <View style={{ marginBottom: 30 }}>
      <View style={{ paddingHorizontal: 22, marginBottom: 12 }}>
        <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '700', letterSpacing: 3, textTransform: 'uppercase' }}>
          Pangkat
        </Text>
      </View>

      {/* Poster-style stat block: colored gradient panel, full-bleed, not boxed
          in a card matching every other card on the screen */}
      <LinearGradient
        colors={[`${theme.accent}28`, `${theme.accent}08`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 22, paddingVertical: 20 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
          <Text style={{ color: theme.text, fontSize: 36, fontWeight: '900', letterSpacing: -1.2 }}>
            {xpData.xp.toLocaleString('id-ID')}
          </Text>
          {next && (
            <>
              <Text style={{ color: theme.subtext, fontSize: 18, fontWeight: '300', marginHorizontal: 6 }}>/</Text>
              <Text style={{ color: theme.subtext, fontSize: 18, fontWeight: '700' }}>
                {next.min.toLocaleString('id-ID')}
              </Text>
            </>
          )}
          {isMax && (
            <Text style={{
              color: theme.bg, backgroundColor: theme.accent,
              fontSize: 11, fontWeight: '900', marginLeft: 10,
              paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4,
            }}>
              MAX
            </Text>
          )}
        </View>

        <Text style={{ color: theme.subtext, fontSize: 12.5, marginTop: 4 }}>
          {next
            ? `${(next.min - xpData.xp).toLocaleString('id-ID')} XP ke ${next.title}`
            : `Pangkat tertinggi tercapai — ${current.title}`}
        </Text>

        {/* Rank rule */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 4 }}>
          {LEVELS.map((lvl, i) => {
            const isPast    = i < currentRankIndex;
            const isCurrent = i === currentRankIndex;
            const filled    = isPast || isCurrent || isMax;
            return (
              <View
                key={lvl.level}
                style={{
                  flex: 1,
                  height: isCurrent && !isMax ? 7 : 4,
                  borderRadius: 2,
                  backgroundColor: filled ? theme.accent : `${theme.text}14`,
                  opacity: filled ? (isPast ? 0.55 : 1) : 1,
                }}
              />
            );
          })}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          <Text style={{ color: theme.text, fontSize: 11, fontWeight: '800' }}>
            Lv.{current.level} {current.title}
          </Text>
          <Text style={{ color: theme.text, fontSize: 11, fontWeight: '800' }}>
            🔥 {xpData.streak} hari beruntun
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}
