// features/home/components/ShareBanner.tsx
//
// Eyebrow + judul tetap editorial (Unbounded/JetBrains Mono), tapi 2 CTA
// sekarang jadi tombol icon+label sejajar (flex:1 dua-duanya, jadi selalu
// pas berdampingan di lebar layar berapapun — gak akan numpuk/kepotong).
import React from 'react';
import { View, Text, TouchableOpacity, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

// TODO: ganti ke domain asli kamu — sebelumnya file ini pakai 2 domain
// beda (nefusoft.app vs nefusoft.eu.cc) di dua fungsi berbeda, jadi
// disatuin dulu ke satu placeholder biar konsisten.
const SHARE_URL = 'https://lunar.app';

interface Props {
  theme: any;
  onCopySuccess: () => void;
}

export function ShareBanner({ theme, onCopySuccess }: Props) {
  const handleCopy = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Clipboard.setStringAsync(SHARE_URL);
    onCopySuccess();
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `Ajak temanmu nonton anime favorit bareng di Lunar, gratis dan tanpa iklan!!\n\n${SHARE_URL}`,
        title: 'Lunar',
      });
    } catch {}
  };

  return (
    <View style={{
      marginTop: 36,
      paddingHorizontal: 22, paddingVertical: 22,
      borderTopWidth: 1,
      borderColor: theme.border,
    }}>
      <Text style={{
        color: theme.subtext, fontSize: 9, fontFamily: 'JetBrainsMono_600SemiBold',
        letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6,
      }}>
        Ajak Teman
      </Text>
      <Text style={{
        color: theme.text, fontSize: 19, fontFamily: 'Unbounded_700Bold',
        letterSpacing: -0.3, lineHeight: 25, marginBottom: 8,
      }}>
        Sebarkan Keseruan Ini
      </Text>
      <Text style={{ color: theme.subtext, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11.5, lineHeight: 17, marginBottom: 18 }}>
        Ajak teman-temanmu marathon anime favorit bareng di Lunar.
      </Text>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity
          onPress={handleCopy}
          activeOpacity={0.8}
          style={{
            flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
            backgroundColor: theme.accent, borderRadius: 12, paddingVertical: 12,
          }}
        >
          <Ionicons name="copy-outline" size={15} color={theme.tint === 'light' ? '#fff' : '#000'} />
          <Text style={{
            color: theme.tint === 'light' ? '#fff' : '#000',
            fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, letterSpacing: 0.2,
          }} numberOfLines={1}>
            Salin Link
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleShare}
          activeOpacity={0.8}
          style={{
            flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
            backgroundColor: `${theme.subtext}12`, borderWidth: 1, borderColor: theme.border,
            borderRadius: 12, paddingVertical: 12,
          }}
        >
          <Ionicons name="share-social-outline" size={15} color={theme.text} />
          <Text style={{
            color: theme.text, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, letterSpacing: 0.2,
          }} numberOfLines={1}>
            Bagikan
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
