import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
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
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 11,
      paddingHorizontal: 12,
      marginBottom: 2,
      borderRadius: 8,
      backgroundColor: isActive ? `${COLORS.gold}12` : 'transparent',
      overflow: 'hidden',
    }}
  >
    {/* Accent bar kiri — hanya aktif */}
    {isActive && (
      <View style={{
        position: 'absolute', left: 0, top: 8, bottom: 8,
        width: 3, backgroundColor: COLORS.gold, borderRadius: 99,
      }} />
    )}

    {/* Nomor besar sebagai watermark */}
    <Text style={{
      fontSize: 28,
      fontWeight: '900',
      color: isActive
        ? `${COLORS.gold}40`
        : isWatched
          ? 'rgba(255,255,255,0.08)'
          : 'rgba(255,255,255,0.06)',
      width: 44,
      marginLeft: 6,
      letterSpacing: -1,
      fontVariant: ['tabular-nums'],
    }}>
      {item.index}
    </Text>

    {/* Info */}
    <View style={{ flex: 1, marginLeft: 4 }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: isActive ? '800' : '600',
          color: isActive ? '#fff' : isWatched ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.75)',
          letterSpacing: 0.1,
        }}
        numberOfLines={1}
      >
        {item.title || `Episode ${item.index}`}
      </Text>
      {(item as any).date ? (
        <Text style={{
          fontSize: 10,
          color: 'rgba(255,255,255,0.2)',
          marginTop: 2,
          fontVariant: ['tabular-nums'],
        }}>
          {(item as any).date}
          {(item as any).views
            ? `  ·  ${Number((item as any).views).toLocaleString('id-ID')}`
            : ''}
        </Text>
      ) : null}
    </View>

    {/* Status kanan */}
    {isActive ? (
      <View style={{
        width: 6, height: 6, borderRadius: 3,
        backgroundColor: COLORS.gold,
        marginRight: 4,
      }} />
    ) : isWatched && progress === 0 ? (
      <View style={{
        width: 6, height: 6, borderRadius: 3,
        backgroundColor: `${COLORS.gold}40`,
        marginRight: 4,
      }} />
    ) : null}

    {/* Progress bar bawah */}
    {!isActive && progress > 0 && (
      <View style={{
        position: 'absolute', bottom: 0, left: 44, right: 0,
        height: 1.5, backgroundColor: 'rgba(255,255,255,0.04)',
      }}>
        <View style={{
          width: `${progress * 100}%`, height: '100%',
          backgroundColor: `${COLORS.gold}70`, borderRadius: 99,
        }} />
      </View>
    )}
  </TouchableOpacity>
));
