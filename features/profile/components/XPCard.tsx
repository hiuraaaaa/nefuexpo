// XPCard.tsx
//
// Signature: progress is shown as a typeset fraction (current XP / target XP)
// the way a scoreboard or page-counter reads, plus a tick-marked rule where
// each tick is one rank from the LEVELS table — not a smooth gradient bar.
// Streak is folded into the same line as plain text, not a separate pill.
import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/hooks/theme';
import { XPData, getLevelData, LEVELS } from '@/hooks/xp';

export function XPCard({ xpData }: { xpData: XPData }) {
  const theme = useTheme();
  const { current, next, progress } = getLevelData(xpData.xp);
  const currentRankIndex = LEVELS.findIndex(l => l.level === current.level);

  return (
    <View style={{ paddingHorizontal: 22, marginBottom: 26 }}>
      <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '700', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>
        Pangkat
      </Text>

      {/* Fraction line: big current XP, small slash, smaller target XP — reads
          like a scoreboard, not a percentage bar with a caption */}
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <Text style={{ color: theme.text, fontSize: 34, fontWeight: '900', letterSpacing: -1 }}>
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
      </View>

      <Text style={{ color: theme.subtext, fontSize: 12, marginTop: 3 }}>
        {next
          ? `${(next.min - xpData.xp).toLocaleString('id-ID')} XP ke ${next.title}`
          : `Pangkat tertinggi tercapai`}
      </Text>

      {/* Rank rule: one tick per level in the table, ticks before current rank
          filled solid, current rank tick enlarged, future ranks hollow.
          This literally encodes the 10-rank progression instead of decorating
          a generic 0-100% bar. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 18, gap: 5 }}>
        {LEVELS.map((lvl, i) => {
          const isPast    = i < currentRankIndex;
          const isCurrent = i === currentRankIndex;
          return (
            <View
              key={lvl.level}
              style={{
                flex: 1,
                height: isCurrent ? 5 : 3,
                borderRadius: 2,
                backgroundColor: isPast || isCurrent ? theme.accent : `${theme.accent}1f`,
              }}
            />
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '600' }}>
          Lv.{current.level} {current.title}
        </Text>
        <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '600' }}>
          🔥 {xpData.streak} hari beruntun
        </Text>
      </View>
    </View>
  );
}
