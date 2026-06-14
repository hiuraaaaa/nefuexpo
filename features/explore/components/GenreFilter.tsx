import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
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

  return (
    <Animated.View entering={FadeIn.duration(300)}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 12 }}
      >
        <TouchableOpacity
          onPress={onClearAll}
          style={{
            paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
            backgroundColor: selectedGenres.length === 0 ? theme.accent : theme.card,
            borderWidth: 1,
            borderColor: selectedGenres.length === 0 ? theme.accent : theme.border,
          }}
        >
          <Text style={{
            color: selectedGenres.length === 0 ? theme.bg : theme.subtext,
            fontSize: 11, fontWeight: '800',
          }}>Semua</Text>
        </TouchableOpacity>

        {genres.map(g => {
          const active = selectedGenres.includes(g.id);
          return (
            <TouchableOpacity
              key={g.id}
              onPress={() => onToggle(g.id)}
              style={{
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                backgroundColor: active ? theme.accent : theme.card,
                borderWidth: 1, borderColor: active ? theme.accent : theme.border,
              }}
            >
              <Text style={{
                color: active ? theme.bg : theme.subtext,
                fontSize: 11, fontWeight: '800',
              }}>{g.name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}
