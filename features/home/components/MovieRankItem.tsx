import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Anime } from '@/types';

interface Props {
  anime: Anime;
  index: number;
  onPress: () => void;
  theme: any;
}

export function MovieRankItem({ anime, index, onPress, theme }: Props) {
  const scale     = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 300 }); Haptics.selectionAsync(); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
        activeOpacity={1}
        style={{
          marginBottom: 12, borderRadius: 16, overflow: 'hidden',
          flexDirection: 'row', alignItems: 'center', height: 88, paddingHorizontal: 16,
          backgroundColor: theme.card, borderWidth: 1,
          borderColor: index < 3 ? theme.accentDim : theme.border,
        }}
      >
        <Image
          source={{ uri: anime.image_cover || anime.image_poster }}
          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '55%', opacity: 0.6 }}
          contentFit="cover"
        />
        <LinearGradient
          colors={[theme.card, theme.card, 'transparent']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '75%' }}
        />
        <View style={{
          width: 40, height: 40, borderRadius: 20,
          alignItems: 'center', justifyContent: 'center', marginRight: 16, zIndex: 1,
          backgroundColor: index < 3 ? theme.accent : theme.border,
          borderWidth: index < 3 ? 0 : 1, borderColor: theme.border,
        }}>
          <Text style={{
            fontWeight: '900', fontSize: 14,
            color: index < 3 ? (theme.tint === 'light' ? '#fff' : '#000') : theme.subtext,
          }}>
            {index + 1}
          </Text>
        </View>
        <View style={{ flex: 1, zIndex: 1 }}>
          <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }} numberOfLines={1}>{anime.title}</Text>
          {anime.year ? (
            <Text style={{ color: theme.subtext, fontSize: 10, marginTop: 3 }}>
              {anime.year}{anime.studio ? ` · ${anime.studio}` : ''}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
