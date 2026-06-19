// features/home/components/SectionHeader.tsx
//
// Dua-layer typography: eyebrow kecil uppercase + title besar.
// Link kanan teks polos "Semua →", bukan chevron icon dalam circle.
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
    <View style={{
      paddingHorizontal: 22, marginBottom: 16,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    }}>
      <View>
        <Text style={{
          color: theme.subtext, fontSize: 9, fontWeight: '800',
          letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 4,
        }}>
          {subtitle}
        </Text>
        <Text style={{
          color: theme.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.6,
        }}>
          {title}
        </Text>
      </View>

      <TouchableOpacity onPress={onPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={{
          color: theme.accent, fontSize: 11, fontWeight: '800', paddingBottom: 3,
        }}>
          Semua →
        </Text>
      </TouchableOpacity>
    </View>
  );
}
