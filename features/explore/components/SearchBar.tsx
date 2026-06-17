// features/explore/components/SearchBar.tsx
//
// Signature: bukan kotak / card wrapper. Satu garis bawah yang tegas,
// teks input langsung tanpa container — kayak form editorial majalah,
// bukan UI component kit.
import React, { useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Pressable } from 'react-native';
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
    <Pressable
      onPress={() => inputRef.current?.focus()}
      style={{ paddingHorizontal: 22, paddingBottom: 16 }}
    >
      {/* Label kecil di atas — muncul saat ada input, jadi ada motion feedback */}
      <Text style={{
        color: value.length > 0 ? theme.accent : 'transparent',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 2.5,
        textTransform: 'uppercase',
        marginBottom: 6,
      }}>
        Pencarian
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {/* Teks "/ " sebagai prefix — editorial, bukan icon */}
        <Text style={{
          color: theme.accent,
          fontSize: 22,
          fontWeight: '300',
          lineHeight: 28,
          marginBottom: 2,
        }}>/</Text>

        <TextInput
          ref={inputRef}
          style={{
            flex: 1,
            color: theme.text,
            fontWeight: '700',
            fontSize: 18,
            paddingVertical: 0,
            letterSpacing: -0.3,
          }}
          placeholder="Cari anime..."
          placeholderTextColor={`${theme.subtext}80`}
          value={value}
          onChangeText={onChangeText}
          returnKeyType="search"
          selectionColor={theme.accent}
          autoCorrect={false}
        />

        {/* Clear: teks "×" plain, bukan icon dalam circle */}
        {value.length > 0 && (
          <TouchableOpacity
            onPress={handleClear}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={{
              color: theme.subtext,
              fontSize: 22,
              fontWeight: '300',
              lineHeight: 28,
            }}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Underline — tebal saat aktif (ada value), tipis saat idle */}
      <View style={{
        height: value.length > 0 ? 2 : 1,
        backgroundColor: value.length > 0 ? theme.accent : `${theme.subtext}30`,
        marginTop: 8,
        // Offset ke kiri — tidak simetris
        marginRight: value.length > 0 ? 40 : 0,
        borderRadius: 2,
      }} />
    </Pressable>
  );
}
