import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface Props {
  title: string;
  subtitle: string;
  onPress: () => void;
  theme: any;
}

export function SectionHeader({ title, subtitle, onPress, theme }: Props) {
  return (
    <TouchableOpacity onPress={onPress} style={{ paddingHorizontal: 16, marginBottom: 14 }} activeOpacity={0.7}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ color: theme.text, fontWeight: '900', fontSize: 16, textTransform: 'uppercase', letterSpacing: -0.5 }}>{title}</Text>
        <Text style={{ color: theme.subtext, fontSize: 16, fontWeight: '900' }}>›</Text>
      </View>
      <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginTop: 2 }}>{subtitle}</Text>
    </TouchableOpacity>
  );
}
