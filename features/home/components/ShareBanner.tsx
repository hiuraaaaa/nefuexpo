// features/home/components/ShareBanner.tsx
//
// Editorial: tanpa rounded card, tanpa background image overlay,
// tanpa pill button dengan Ionicons. Dua CTA jadi underline links
// bersebelahan, konsisten sama HeroBanner CTA "Tonton Sekarang".
import React from 'react';
import { View, Text, TouchableOpacity, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

interface Props {
  theme: any;
  onCopySuccess: () => void;
}

export function ShareBanner({ theme, onCopySuccess }: Props) {
  const handleCopy = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Clipboard.setStringAsync('https://nefusoft.eu.cc');
    onCopySuccess();
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: 'Ajak temanmu nonton anime favorit bareng di NefuSoft, gratis dan tanpa iklan!!\n\nhttps://nefusoft.eu.cc',
        title: 'NefuSoft',
      });
    } catch {}
  };

  return (
    <View style={{
      marginTop: 36,
      paddingHorizontal: 22, paddingVertical: 22,
      borderTopWidth: 1, borderBottomWidth: 1,
      borderColor: `${theme.subtext}15`,
    }}>
      <Text style={{
        color: theme.subtext, fontSize: 9, fontWeight: '800',
        letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 6,
      }}>
        Ajak Teman
      </Text>
      <Text style={{
        color: theme.text, fontSize: 19, fontWeight: '900',
        letterSpacing: -0.5, lineHeight: 24, marginBottom: 8,
      }}>
        Sebarkan Keseruan Ini
      </Text>
      <Text style={{ color: theme.subtext, fontSize: 11.5, lineHeight: 17, marginBottom: 20 }}>
        Ajak teman-temanmu marathon anime favorit bareng di NefuSoft.
      </Text>

      <View style={{ flexDirection: 'row', gap: 28 }}>
        <TouchableOpacity
          onPress={handleCopy}
          style={{ borderBottomWidth: 2, borderBottomColor: theme.accent, paddingBottom: 6 }}
        >
          <Text style={{ color: theme.text, fontWeight: '900', fontSize: 12.5, letterSpacing: 0.3 }}>
            SALIN LINK
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleShare}
          style={{ borderBottomWidth: 2, borderBottomColor: `${theme.subtext}40`, paddingBottom: 6 }}
        >
          <Text style={{ color: theme.subtext, fontWeight: '900', fontSize: 12.5, letterSpacing: 0.3 }}>
            BAGIKAN
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
