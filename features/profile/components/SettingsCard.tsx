// SettingsCard.tsx
//
// Signature: a flush left-aligned list, each row separated by a hairline rule
// only (no card boundary, no icon-in-rounded-square on every line). Switches
// sit in their natural reading position at the end of the label line, the
// way a settings list in a text-first app would read, not a row of identical
// icon tiles. Numbers in section headers ("01 Tampilan", "02 Tentang") give
// the sections real sequence rather than decorative section pills.
import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/theme';
import { THEMES } from '@/constants';
import { storageMain } from '@/hooks/storage/storage';

const PIP_KEY  = 'nefusoft_pip';
const INFO_KEY = 'nefusoft_info';

interface Props {
  pip:            boolean;
  info:           boolean;
  setPip:         (v: boolean) => void;
  setInfo:        (v: boolean) => void;
  onThemePress:   () => void;
  onTentangPress: () => void;
}

export function SettingsCard({ pip, info, setPip, setInfo, onThemePress, onTentangPress }: Props) {
  const theme = useTheme();

  const togglePip = (val: boolean) => {
    Haptics.selectionAsync();
    setPip(val);
    storageMain.set(PIP_KEY, val);
  };

  const toggleInfo = (val: boolean) => {
    Haptics.selectionAsync();
    setInfo(val);
    storageMain.set(INFO_KEY, val);
  };

  const themeName = THEMES.find(t => t.id === theme.id)?.name ?? 'Gold';

  return (
    <View style={{ paddingHorizontal: 22 }}>

      {/* Section 01 — Tampilan */}
      <SectionHeading index="01" label="Tampilan" />

      <Row
        label="Tema"
        value={themeName}
        onPress={() => { Haptics.selectionAsync(); onThemePress(); }}
      />

      <Row
        label="Picture in Picture"
        sub="Video tetap jalan saat minimize"
        right={
          <Switch
            value={pip}
            onValueChange={togglePip}
            trackColor={{ false: `${theme.accent}25`, true: theme.accent }}
            thumbColor={theme.bg}
            ios_backgroundColor={`${theme.accent}25`}
          />
        }
      />

      <Row
        label="Info saat menonton"
        sub="Jam & baterai tampil di layar video"
        last
        right={
          <Switch
            value={info}
            onValueChange={toggleInfo}
            trackColor={{ false: `${theme.accent}25`, true: theme.accent }}
            thumbColor={theme.bg}
            ios_backgroundColor={`${theme.accent}25`}
          />
        }
      />

      {/* Section 02 — Tentang */}
      <SectionHeading index="02" label="Tentang" />

      <Row
        label="Tentang aplikasi"
        sub="Versi, kebijakan privasi & lainnya"
        last
        onPress={() => { Haptics.selectionAsync(); onTentangPress(); }}
      />
    </View>
  );
}

function SectionHeading({ index, label }: { index: string; label: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 28, marginBottom: 4 }}>
      <Text style={{ color: `${theme.accent}90`, fontSize: 11, fontWeight: '900', fontStyle: 'italic' }}>
        {index}
      </Text>
      <Text style={{ color: theme.subtext, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
        {label}
      </Text>
    </View>
  );
}

function Row({ label, sub, value, onPress, right, last = false }: {
  label: string;
  sub?: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  last?: boolean;
}) {
  const theme = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.6 : 1}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: `${theme.accent}12`,
      }}
    >
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>{label}</Text>
        {sub && <Text style={{ color: theme.subtext, fontSize: 11, marginTop: 2 }}>{sub}</Text>}
      </View>

      {right ?? (
        value ? (
          <Text style={{ color: theme.accent, fontSize: 13, fontWeight: '700' }}>{value}</Text>
        ) : onPress ? (
          <Text style={{ color: theme.subtext, fontSize: 16, fontWeight: '300' }}>›</Text>
        ) : null
      )}
    </TouchableOpacity>
  );
}
