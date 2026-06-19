// features/explore/components/SearchBar.tsx
//
// Varian A — Headline Search.
// Label "Anime" / title section bukan teks statis lagi — dia ADALAH
// input field-nya. Ngetik = headline berubah jadi query secara langsung.
// Tidak ada box, tidak ada icon kaca pembesar generik. Cuma teks besar,
// cursor blink alami dari TextInput, dan underline gradient tipis.
import React, { useRef, useState } from 'react';
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
  const [focused, setFocused] = useState(false);

  const active = value.length > 0 || focused;

  const handleClear = () => {
    Haptics.selectionAsync();
    onClear();
    inputRef.current?.focus();
  };

  return (
    <Pressable
      onPress={() => inputRef.current?.focus()}
      style={{ paddingHorizontal: 22, paddingTop: 2, paddingBottom: 18 }}
    >
      {/* Eyebrow — berubah teks tergantung state */}
      <Text style={{
        color: theme.subtext,
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 2.5,
        textTransform: 'uppercase',
        marginBottom: 6,
      }}>
        {active ? 'Mencari' : 'Temukan'}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextInput
          ref={inputRef}
          style={{
            flex: 1,
            color: active ? theme.accent : theme.text,
            fontWeight: '900',
            fontSize: 32,
            letterSpacing: -1.2,
            fontStyle: active ? 'italic' : 'normal',
            paddingVertical: 0,
          }}
          placeholder="Anime"
          placeholderTextColor={theme.text}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          returnKeyType="search"
          selectionColor={theme.accent}
          autoCorrect={false}
        />

        {value.length > 0 && (
          <TouchableOpacity
            onPress={handleClear}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{ paddingLeft: 8 }}
          >
            <Text style={{
              color: theme.subtext,
              fontSize: 24,
              fontWeight: '300',
            }}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Underline — solid accent kalau aktif, redup & lebih pendek kalau idle */}
      <View style={{
        height: 2,
        marginTop: 10,
        borderRadius: 2,
        backgroundColor: active ? theme.accent : `${theme.subtext}35`,
        width: active ? '100%' : '55%',
      }} />

      {!active && (
        <Text style={{
          color: `${theme.subtext}90`,
          fontSize: 10.5,
          fontWeight: '600',
          marginTop: 8,
        }}>
          Sentuh judul di atas untuk mulai mencari
        </Text>
      )}
    </Pressable>
  );
}
