import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import { Episode } from '@/types';

interface Props {
  item: Episode;
  isActive: boolean;
  isWatched: boolean;
  progress: number;
  onPress: () => void;
}

export const EpisodeButton = React.memo(({ item, isActive, isWatched, progress, onPress }: Props) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={{
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 13,
    borderRadius: 10, marginBottom: 6,
    backgroundColor: isActive ? `${COLORS.gold}18` : 'transparent',
    borderWidth: 1,
    borderColor: isActive ? COLORS.gold : isWatched ? `${COLORS.gold}30` : 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  }}>
    {isActive && <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: COLORS.gold, borderRadius: 999 }} />}
    <Text style={{ width: 32, fontSize: 14, fontWeight: '900', color: isActive ? COLORS.gold : isWatched ? `${COLORS.gold}99` : 'rgba(255,255,255,0.35)', marginRight: 10 }}>
      {item.index}
    </Text>
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 13, fontWeight: isActive ? '800' : '600', color: isActive ? '#fff' : isWatched ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.7)' }} numberOfLines={1}>
        {item.title || `Episode ${item.index}`}
      </Text>
      {(item as any).date ? (
        <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>
          {(item as any).date}{(item as any).views ? `  ·  ${(item as any).views.toLocaleString()} views` : ''}
        </Text>
      ) : null}
    </View>
    {isActive ? (
      <Ionicons name="play-circle" size={18} color={COLORS.gold} />
    ) : isWatched && progress === 0 ? (
      <Ionicons name="checkmark-circle" size={16} color={`${COLORS.gold}80`} />
    ) : null}
    {!isActive && progress > 0 && (
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: 'rgba(255,255,255,0.06)' }}>
        <View style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: COLORS.gold, borderRadius: 999 }} />
      </View>
    )}
  </TouchableOpacity>
));
