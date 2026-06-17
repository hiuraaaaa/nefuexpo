// features/library/components/LibraryListItem.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/theme';
import { Anime, HistoryItem } from '@/types';

interface FavoritItemProps {
  kind: 'favorit';
  anime: Anime;
  onRemove: (anime: Anime) => void;
}

interface HistoryItemProps {
  kind: 'history';
  item: HistoryItem;
}

type Props = (FavoritItemProps | HistoryItemProps) & { last?: boolean };

export function LibraryListItem(props: Props) {
  const theme  = useTheme();
  const router = useRouter();

  const anime = props.kind === 'favorit' ? props.anime : props.item.anime;

  const subtitle =
    props.kind === 'favorit'
      ? `${anime.type ?? '-'} • ${anime.status ?? '-'}`
      : `Episode ${props.item.episodeIndex}`;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/watch/${anime.id}`);
      }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: props.last ? 0 : 1,
        borderBottomColor: `${theme.accent}10`,
      }}
    >
      <View style={{
        shadowColor: theme.accent,
        shadowOpacity: props.kind === 'favorit' ? 0.4 : 0.3,
        shadowRadius: props.kind === 'favorit' ? 6 : 5,
        elevation: props.kind === 'favorit' ? 4 : 3,
      }}>
        <Image
          source={{ uri: anime.image_poster, priority: props.kind === 'favorit' ? 'normal' : 'low' }}
          style={{
            width: 46,
            aspectRatio: 3 / 4.5,
            borderRadius: 9,
            borderWidth: 1,
            borderColor: `${theme.accent}${props.kind === 'favorit' ? '25' : '20'}`,
          }}
          contentFit="cover"
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>
          {anime.title}
        </Text>
        <Text style={{ color: theme.subtext, fontSize: 11, marginTop: 2 }}>
          {subtitle}
        </Text>
      </View>

      {props.kind === 'favorit' ? (
        <TouchableOpacity
          onPress={() => { Haptics.selectionAsync(); props.onRemove(anime); }}
          style={{
            width: 30, height: 30, borderRadius: 9,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: `${theme.accent}15`,
          }}
        >
          <Ionicons name="bookmark" size={14} color={theme.accent} />
        </TouchableOpacity>
      ) : (
        <View style={{
          width: 30, height: 30, borderRadius: 9,
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: `${theme.accent}10`,
        }}>
          <Ionicons name="time-outline" size={14} color={theme.subtext} />
        </View>
      )}
    </TouchableOpacity>
  );
}

