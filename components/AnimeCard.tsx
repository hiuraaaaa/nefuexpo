import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { COLORS } from '@/constants';
import { Anime } from '@/types';

interface Props {
  anime: Anime;
  onPress: () => void;
  width?: number;
}

export default function AnimeCard({ anime, onPress, width }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={width ? { width } : { flex: 1 }}
    >
      <View style={{
        aspectRatio: 3 / 4.5,
        backgroundColor: COLORS.card,
        borderRadius: 4,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 4,
      }}>
        <Image
          source={{ uri: anime.image_poster }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>
      <Text
        style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '700', marginTop: 6 }}
        numberOfLines={1}
      >
        {anime.title?.toLowerCase()}
      </Text>
    </TouchableOpacity>
  );
}
