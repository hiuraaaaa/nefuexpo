// features/explore/components/SearchBar.tsx
//
// Search bar biasa & jelas — kotak input dengan ikon kaca pembesar,
// bukan lagi konsep "judul yang disentuh" (terlalu ambigu, orang gak
// langsung sadar itu bisa di-tap buat search).
import React, { useRef } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface Props {
  value: string;
  onChangeText: (t: string) => void;
  onClear: () => void;
  theme: any;
}

export default function SearchBar({ value, onChangeText, onClear, theme }: Props) {
  const inputRef = useRef<TextInput>(null);

  const handleClear = () => {
    Haptics.selectionAsync();
    onClear();
    inputRef.current?.focus();
  };

  return (
    <View style={{ paddingHorizontal: 22, paddingTop: 8, paddingBottom: 16 }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: `${theme.subtext}12`,
        borderWidth: 1, borderColor: theme.border,
        borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11,
      }}>
        <Ionicons name="search-outline" size={18} color={theme.subtext} />
        <TextInput
          ref={inputRef}
          style={{
            flex: 1,
            color: theme.text,
            fontFamily: 'PlusJakartaSans_600SemiBold',
            fontSize: 14,
            paddingVertical: 0,
          }}
          placeholder="Cari judul anime..."
          placeholderTextColor={theme.subtext}
          value={value}
          onChangeText={onChangeText}
          returnKeyType="search"
          selectionColor={theme.accent}
          autoCorrect={false}
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={handleClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle" size={17} color={`${theme.subtext}90`} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
