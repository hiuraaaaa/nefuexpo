import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS } from '@/constants';
import { AnimeDetail } from '@/types';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Text>
      <Text style={{ color: COLORS.gold, fontSize: 12, fontWeight: '700', maxWidth: '60%', textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

export function AnimeInfo({ anime }: { anime: AnimeDetail }) {
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);

  return (
    <View style={{ marginHorizontal: 16, marginBottom: 16, borderRadius: 16, overflow: 'hidden', backgroundColor: COLORS.card, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
      <View style={{ height: 200, alignItems: 'center', justifyContent: 'flex-end' }}>
        <Image source={{ uri: anime.image_cover || anime.image_poster }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.25 }} contentFit="cover" />
        <LinearGradient colors={['transparent', COLORS.card]} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' }} />
        <Image source={{ uri: anime.image_poster }} style={{ width: 110, aspectRatio: 3 / 4.2, borderRadius: 10 }} contentFit="cover" />
      </View>
      <View style={{ padding: 16 }}>
        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18, textAlign: 'center', marginBottom: 12, lineHeight: 24 }}>{anime.title}</Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          {anime.type ? (
            <View style={{ backgroundColor: COLORS.gold, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
              <Text style={{ color: '#000', fontSize: 11, fontWeight: '900' }}>{anime.type}</Text>
            </View>
          ) : null}
          {anime.status ? (
            <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700' }}>{anime.status}</Text>
            </View>
          ) : null}
          {anime.aired_start ? (
            <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700' }}>{anime.aired_start}</Text>
            </View>
          ) : null}
          {(anime as any).rating ? (
            <View style={{ backgroundColor: 'rgba(255,200,0,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: `${COLORS.gold}50`, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 11 }}>⭐</Text>
              <Text style={{ color: COLORS.gold, fontSize: 11, fontWeight: '900' }}>{(anime as any).rating}</Text>
            </View>
          ) : null}
        </View>

        {anime.synopsis ? (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 18, textAlign: 'center' }} numberOfLines={synopsisExpanded ? undefined : 3}>
              {anime.synopsis}
            </Text>
            {anime.synopsis.length > 100 && (
              <TouchableOpacity onPress={() => { Haptics.selectionAsync(); setSynopsisExpanded(p => !p); }} style={{ marginTop: 6, alignItems: 'center' }}>
                <Text style={{ color: COLORS.gold, fontSize: 11, fontWeight: '700' }}>{synopsisExpanded ? 'Sembunyikan ▲' : 'Selengkapnya ▼'}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }}>
          {anime.studio ? <InfoRow label="Studio" value={anime.studio} /> : null}
          {anime.year   ? <InfoRow label="Tahun"  value={anime.year}   /> : null}
          {(anime as any).total_episode ? <InfoRow label="Total Episode" value={String((anime as any).total_episode)} /> : null}
          {anime.genre ? (
            <View style={{ paddingVertical: 12 }}>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Genre</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {anime.genre.split(',').map((g, i) => (
                  <View key={i} style={{ backgroundColor: `${COLORS.gold}20`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: `${COLORS.gold}40` }}>
                    <Text style={{ color: COLORS.gold, fontSize: 10, fontWeight: '700' }}>{g.trim()}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
