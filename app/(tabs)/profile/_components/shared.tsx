import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/theme';

export function SectionLabel({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <Text style={{
      color: theme.subtext, fontSize: 10, fontWeight: '800',
      letterSpacing: 1.5, textTransform: 'uppercase',
      marginBottom: 10, marginTop: 4, paddingHorizontal: 16,
    }}>{label}</Text>
  );
}

export function SettingRow({ icon, label, subtitle, onPress, right, last = false }: {
  icon: string; label: string; subtitle?: string;
  onPress?: () => void; right?: React.ReactNode; last?: boolean;
}) {
  const theme = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: last ? 0 : 1, borderBottomColor: theme.border,
      }}
    >
      <View style={{
        width: 34, height: 34, borderRadius: 9,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: theme.accentDim,
      }}>
        <Ionicons name={icon as any} size={17} color={theme.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }}>{label}</Text>
        {subtitle && <Text style={{ color: theme.subtext, fontSize: 10, marginTop: 1 }}>{subtitle}</Text>}
      </View>
      {right ?? <Ionicons name="chevron-forward" size={16} color={theme.subtext} />}
    </TouchableOpacity>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  const theme = useTheme();
  return (
    <View style={[{
      marginHorizontal: 16, marginBottom: 8,
      backgroundColor: theme.card, borderRadius: 16,
      borderWidth: 1, borderColor: theme.border, overflow: 'hidden',
    }, style]}>{children}</View>
  );
}
