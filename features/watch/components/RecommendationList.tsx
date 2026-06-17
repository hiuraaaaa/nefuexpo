import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants';
import { Anime } from '@/types';
import { getAnimeSlug } from '@/hooks/api/api';

export function RecommendationList({ items }: { items: Anime[] }) {
  const router = useRouter();
  if (!items.length) return null;

  return (
    <View style={{ marginHorizontal: 16, marginBottom: 32 }}>
      {/* Label — kecil, uppercase, letter-spacing */}
      <Text style={{
        color: 'rgba(255,255,255,0.2)',
        fontSize: 9, fontWeight: '900',
        letterSpacing: 2.5, textTransform: 'uppercase',
        marginBottom: 14,
      }}>
        Lainnya
      </Text>

      {items.map((a, idx) => (
        <TouchableOpacity
          key={a.id}
          onPress={() => router.replace(`/watch/${getAnimeSlug(a)}`)}
          activeOpacity={0.7}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingVertical: 10,
            borderTopWidth: idx === 0 ? 0 : 1,
            borderTopColor: 'rgba(255,255,255,0.04)',
          }}
        >
          {/* Poster — sedikit lebih besar, no border-radius besar */}
          <Image
            source={{ uri: a.image_poster }}
            style={{ width: 48, aspectRatio: 3 / 4.2, borderRadius: 6 }}
            contentFit="cover"
          />

          {/* Info — left aligned, no chevron */}
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{
              color: 'rgba(255,255,255,0.85)',
              fontWeight: '700', fontSize: 13,
              letterSpacing: 0.1,
            }}
              numberOfLines={1}
            >
              {a.title}
            </Text>
            <Text style={{
              color: 'rgba(255,255,255,0.25)',
              fontSize: 10, fontWeight: '500',
            }}>
              {[a.type, a.status].filter(Boolean).join('  ·  ')}
            </Text>
          </View>

          {/* Index number sebagai visual weight pengganti chevron */}
          <Text style={{
            color: 'rgba(255,255,255,0.07)',
            fontSize: 22, fontWeight: '900',
            fontVariant: ['tabular-nums'],
            letterSpacing: -1,
          }}>
            {String(idx + 1).padStart(2, '0')}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
