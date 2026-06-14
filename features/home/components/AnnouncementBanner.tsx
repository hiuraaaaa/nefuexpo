import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { useTheme } from '@/hooks/theme';

const TYPE_COLORS: Record<string, string> = {
  info:        '#4a9eff',
  warning:     '#F6CF80',
  promo:       '#2ecc71',
  maintenance: '#e63946',
};

const TYPE_ICONS: Record<string, string> = {
  info:        'information-circle-outline',
  warning:     'warning-outline',
  promo:       'gift-outline',
  maintenance: 'construct-outline',
};

interface Props {
  item: any;
  onDismiss: () => void;
}

export function AnnouncementBanner({ item, onDismiss }: Props) {
  const theme = useTheme();
  const color = TYPE_COLORS[item.type] ?? '#4a9eff';
  const icon  = TYPE_ICONS[item.type]  ?? 'information-circle-outline';

  return (
    <Animated.View
      entering={FadeInDown.duration(400).springify()}
      exiting={FadeOut.duration(200)}
      style={{
        marginHorizontal: 16, marginTop: 12,
        borderRadius: 14, overflow: 'hidden',
        backgroundColor: theme.card,
        borderWidth: 1, borderColor: theme.border,
        borderLeftWidth: 4, borderLeftColor: color,
      }}
    >
      <View style={{ padding: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <View style={{ width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: `${color}20` }}>
            <Ionicons name={icon as any} size={14} color={color} />
          </View>
          <Text style={{ color, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, flex: 1 }}>
            {item.type ?? 'Info'}
          </Text>
          <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={16} color={theme.subtext} />
          </TouchableOpacity>
        </View>
        <Text style={{ color: theme.text, fontWeight: '800', fontSize: 13, marginBottom: 4 }}>{item.title}</Text>
        <Text style={{ color: theme.subtext, fontSize: 11, lineHeight: 17 }}>{item.body}</Text>
        {item.ctaText && item.ctaUrl && (
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Linking.openURL(item.ctaUrl); }}
            style={{ marginTop: 10, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, backgroundColor: `${color}20`, borderWidth: 1, borderColor: `${color}40` }}
          >
            <Text style={{ color, fontSize: 11, fontWeight: '800' }}>{item.ctaText} →</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}
