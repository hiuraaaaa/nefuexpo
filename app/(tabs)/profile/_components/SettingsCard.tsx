import React from 'react';
import { Switch } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/theme';
import { THEMES } from '@/constants';
import { storageMain } from '@/hooks/storage';
import { SectionLabel, SettingRow, Card } from './shared';

const PIP_KEY  = 'nefusoft_pip';
const INFO_KEY = 'nefusoft_info';

interface Props {
  pip:           boolean;
  info:          boolean;
  setPip:        (v: boolean) => void;
  setInfo:       (v: boolean) => void;
  onThemePress:  () => void;
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

  return (
    <>
      <Animated.View entering={FadeInDown.delay(200).springify()}>
        <SectionLabel label="Pengaturan" />
        <Card>
          <SettingRow
            icon="color-palette-outline"
            label="Tema"
            subtitle={`Sekarang: ${THEMES.find(t => t.id === theme.id)?.name ?? 'Gold'}`}
            onPress={() => { Haptics.selectionAsync(); onThemePress(); }}
          />
          <SettingRow
            icon="tv-outline"
            label="Picture in Picture"
            subtitle="Video tetap jalan saat minimize"
            right={
              <Switch
                value={pip} onValueChange={togglePip}
                trackColor={{ false: theme.border, true: theme.accent }}
                thumbColor={pip ? theme.bg : theme.subtext}
              />
            }
          />
          <SettingRow
            icon="information-circle-outline"
            label="Info di Video"
            subtitle="Tampilkan jam & baterai saat nonton"
            last
            right={
              <Switch
                value={info} onValueChange={toggleInfo}
                trackColor={{ false: theme.border, true: theme.accent }}
                thumbColor={info ? theme.bg : theme.subtext}
              />
            }
          />
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(240).springify()}>
        <SectionLabel label="Tentang" />
        <Card>
          <SettingRow
            icon="information-circle-outline"
            label="Tentang Aplikasi"
            subtitle="Versi, kebijakan privasi, & lainnya"
            last
            onPress={() => { Haptics.selectionAsync(); onTentangPress(); }}
          />
        </Card>
      </Animated.View>
    </>
  );
}
