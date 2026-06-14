import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  value: string;
  onChangeText: (t: string) => void;
  onClear: () => void;
  theme: any;
}

export default function SearchBar({ value, onChangeText, onClear, theme }: Props) {
  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: theme.card, borderRadius: 16,
        paddingHorizontal: 14, paddingVertical: 12,
        borderWidth: 1, borderColor: theme.border, gap: 10,
      }}>
        <Ionicons name="search-outline" size={18} color={theme.accent} />
        <TextInput
          style={{ flex: 1, color: theme.text, fontWeight: '600', fontSize: 14, paddingVertical: 0 }}
          placeholder="Cari anime..."
          placeholderTextColor={theme.subtext}
          value={value}
          onChangeText={onChangeText}
          returnKeyType="search"
          selectionColor={theme.accent}
          autoCorrect={false}
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={20} color={theme.subtext} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
