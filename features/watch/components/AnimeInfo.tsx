import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS } from '@/constants';
import { AnimeDetail } from '@/types';

export function AnimeInfo({ anime }: { anime: AnimeDetail }) {
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);

  const genres = anime.genre
    ? anime.genre.split(',').map(g => g.trim()).filter(Boolean)
    : [];

  // Meta inline: studio · tahun · total eps
  const metaParts = [
    anime.studio,
    anime.year,
    (anime as any).total_episode ? `${(anime as any).total_episode} eps` : null,
  ].filter(Boolean);

  return (
    <View style={{ marginHorizontal: 16, marginBottom: 16 }}>

      {/* Poster kiri + info kanan */}
      <View style={{ flexDirection: 'row', gap: 14, marginBottom: 20 }}>

        {/* Poster — float left */}
        <View style={{ borderRadius: 10, overflow: 'hidden', width: 100, aspectRatio: 3 / 4.3, flexShrink: 0 }}>
          <Image
            source={{ uri: anime.image_poster }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
          {/* Subtle gradient di bawah poster */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)']}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%' }}
          />
        </View>

        {/* Info kanan */}
        <View style={{ flex: 1, paddingTop: 2, gap: 8 }}>
          <Text style={{
            color: '#fff', fontWeight: '900', fontSize: 16,
            lineHeight: 22, letterSpacing: -0.3,
          }}>
            {anime.title}
          </Text>

          {/* Badges — asimetris ukuran */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {anime.type ? (
              <View style={{
                backgroundColor: COLORS.gold,
                paddingHorizontal: 7, paddingVertical: 2,
                borderRadius: 4,
              }}>
                <Text style={{
                  color: '#000', fontSize: 9, fontWeight: '900',
                  letterSpacing: 1, textTransform: 'uppercase',
                }}>
                  {anime.type}
                </Text>
              </View>
            ) : null}
            {anime.status ? (
              <View style={{
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
                paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4,
              }}>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '600' }}>
                  {anime.status}
                </Text>
              </View>
            ) : null}
            {(anime as any).rating ? (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 3,
                paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4,
                backgroundColor: `${COLORS.gold}18`,
              }}>
                <Text style={{ fontSize: 9 }}>★</Text>
                <Text style={{
                  color: COLORS.gold, fontSize: 11, fontWeight: '900',
                  fontVariant: ['tabular-nums'],
                }}>
                  {(anime as any).rating}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Meta inline — studio · tahun */}
          {metaParts.length > 0 && (
            <Text style={{
              color: 'rgba(255,255,255,0.3)',
              fontSize: 10, fontWeight: '500',
              lineHeight: 15,
            }}>
              {metaParts.join('  ·  ')}
            </Text>
          )}

          {/* Genre — flow tags kecil */}
          {genres.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {genres.map((g, i) => (
                <Text key={i} style={{
                  color: `${COLORS.gold}80`,
                  fontSize: 9, fontWeight: '700',
                  letterSpacing: 0.5,
                }}>
                  {i > 0 ? '· ' : ''}{g}
                </Text>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Sinopsis — gradient fade, tap to expand */}
      {anime.synopsis ? (
        <TouchableOpacity
          onPress={() => { Haptics.selectionAsync(); setSynopsisExpanded(p => !p); }}
          activeOpacity={0.8}
        >
          <View style={{ overflow: 'hidden' }}>
            <Text style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: 12, lineHeight: 19,
              fontWeight: '400',
            }}
              numberOfLines={synopsisExpanded ? undefined : 4}
            >
              {anime.synopsis}
            </Text>
            {!synopsisExpanded && anime.synopsis.length > 120 && (
              <LinearGradient
                colors={['transparent', 'rgba(10,10,12,0.95)']}
                style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: 36,
                }}
                pointerEvents="none"
              />
            )}
          </View>
          {anime.synopsis.length > 120 && (
            <Text style={{
              color: `${COLORS.gold}90`,
              fontSize: 10, fontWeight: '700',
              marginTop: synopsisExpanded ? 6 : 2,
              letterSpacing: 0.5,
            }}>
              {synopsisExpanded ? 'SEMBUNYIKAN ▲' : 'BACA SELENGKAPNYA ▼'}
            </Text>
          )}
        </TouchableOpacity>
      ) : null}

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginTop: 20 }} />
    </View>
  );
}
