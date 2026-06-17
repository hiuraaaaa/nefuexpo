// features/library/components/LibraryListItem.tsx
//
// Signature: poster runs full-bleed against the left edge of the row (no card
// padding around it), so the row reads like a contact sheet strip rather than
// a boxed list cell. Favorit rows get a folded-corner triangle instead of a
// bookmark icon. History rows get a typeset index number instead of a clock
// icon — the number is the actual watch order, doing real information work.
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/theme';
import { Anime, HistoryItem } from '@/types';

interface FavoritItemProps {
  kind: 'favorit';
  anime: Anime;
  onRemove: (anime: Anime) => void;
  index: number;
}

interface HistoryProps {
  kind: 'history';
  item: HistoryItem;
  index: number;
}

type Props = FavoritItemProps | HistoryProps;

export function LibraryListItem(props: Props) {
  const theme  = useTheme();
  const router = useRouter();

  const anime = props.kind === 'favorit' ? props.anime : props.item.anime;
  const isFav = props.kind === 'favorit';

  // Edge weight tapers as you go down the list — first item reads heaviest,
  // a quiet hierarchy cue instead of identical borders on every row.
  const edgeWidth = props.index === 0 ? 4 : props.index <= 2 ? 3 : 2;

  const timeAgo = !isFav ? formatRelative((props as HistoryProps).item.timestamp) : null;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/watch/${anime.id}`);
      }}
      style={{
        flexDirection: 'row',
        // odd rows nudge right slightly — breaks the perfectly-flush left edge
        // without breaking tap targets or alignment of the text column
        marginLeft: props.index % 2 === 0 ? 0 : 10,
        marginBottom: 14,
        borderLeftWidth: edgeWidth,
        borderLeftColor: isFav ? theme.accent : `${theme.accent}55`,
      }}
    >
      {/* Poster — taller than a typical thumbnail, flush against the accent edge */}
      <View style={{ width: 64, aspectRatio: 2 / 3 }}>
        <Image
          source={{ uri: anime.image_poster, priority: isFav ? 'normal' : 'low' }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />

        {isFav && (
          // folded-corner triangle — replaces the bookmark icon, sits flush
          // in the actual corner of the image rather than floating in a circle
          <View style={{
            position: 'absolute', top: 0, right: 0,
            width: 0, height: 0,
            borderTopWidth: 18, borderRightWidth: 18,
            borderTopColor: theme.accent, borderRightColor: 'transparent',
          }} />
        )}
      </View>

      {/* Text column */}
      <View style={{ flex: 1, paddingLeft: 13, paddingVertical: 2, justifyContent: 'center' }}>
        <Text
          style={{ color: theme.text, fontSize: 14, fontWeight: '700', lineHeight: 18 }}
          numberOfLines={2}
        >
          {anime.title}
        </Text>

        {isFav ? (
          <Text style={{ color: theme.subtext, fontSize: 11.5, marginTop: 5 }}>
            {(anime.type ?? '—')}{anime.status ? `  ·  ${anime.status}` : ''}
          </Text>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 5 }}>
            <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '800' }}>
              Eps {(props as HistoryProps).item.episodeIndex}
            </Text>
            {timeAgo && (
              <Text style={{ color: theme.subtext, fontSize: 11 }}>{timeAgo}</Text>
            )}
          </View>
        )}
      </View>

      {/* Right-hand mark: watch-order index for history, remove tap for favorit.
          Neither is a stock icon glyph in a circle. */}
      {isFav ? (
        <TouchableOpacity
          onPress={() => { Haptics.selectionAsync(); (props as FavoritItemProps).onRemove(anime); }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ paddingHorizontal: 12, justifyContent: 'center' }}
        >
          <Text style={{ color: theme.subtext, fontSize: 18, fontWeight: '300' }}>×</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ paddingHorizontal: 14, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{
            color: `${theme.accent}60`,
            fontSize: 20,
            fontWeight: '900',
            fontStyle: 'italic',
          }}>
            {String(props.index + 1).padStart(2, '0')}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function formatRelative(ts: number): string {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const min  = Math.floor(diff / 60000);
  const hr   = Math.floor(min / 60);
  const day  = Math.floor(hr / 24);
  if (min < 1)  return 'baru saja';
  if (min < 60) return `${min}m lalu`;
  if (hr < 24)  return `${hr}j lalu`;
  if (day < 7)  return `${day}h lalu`;
  return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}
