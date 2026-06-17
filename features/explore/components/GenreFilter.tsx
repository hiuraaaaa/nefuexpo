// features/explore/components/GenreFilter.tsx
//
// Signature: tab strip editorial — active word besar & cerah, inactive kecil
// & redup, underline offset ke kiri di bawah active (persis LibraryHeader).
// Tidak ada pill bubble, tidak ada border radius 20, tidak ada card wrapper.
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Genre } from '@/types';

interface Props {
  genres: Genre[];
  selectedGenres: string[];
  onToggle: (id: string) => void;
  onClearAll: () => void;
  theme: any;
}

export default function GenreFilter({ genres, selectedGenres, onToggle, onClearAll, theme }: Props) {
  if (genres.length === 0) return null;

  const allActive = selectedGenres.length === 0;

  return (
    <View style={{ marginBottom: 8 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 22, gap: 20, paddingBottom: 4 }}
      >
        {/* "Semua" */}
        <TouchableOpacity
          onPress={() => { Haptics.selectionAsync(); onClearAll(); }}
          activeOpacity={0.7}
        >
          <Text style={{
            color: allActive ? theme.text : theme.subtext,
            fontWeight: '900',
            fontSize: allActive ? 16 : 12,
            letterSpacing: -0.3,
          }}>
            Semua
          </Text>
          {allActive && (
            <View style={{
              height: 3,
              width: 28,
              backgroundColor: theme.accent,
              borderRadius: 2,
              marginTop: 5,
            }} />
          )}
        </TouchableOpacity>

        {genres.map(g => {
          const active = selectedGenres.includes(g.id);
          return (
            <TouchableOpacity
              key={g.id}
              onPress={() => onToggle(g.id)}
              activeOpacity={0.7}
            >
              <Text style={{
                color: active ? theme.text : theme.subtext,
                fontWeight: active ? '900' : '600',
                fontSize: active ? 16 : 12,
                letterSpacing: -0.3,
              }}>
                {g.name}
              </Text>
              {active && (
                <View style={{
                  height: 3,
                  // Width tidak seragam — ikutin panjang teks approximate
                  width: g.name.length * 7.5,
                  backgroundColor: theme.accent,
                  borderRadius: 2,
                  marginTop: 5,
                }} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
