import React from 'react';
import { View, Text, TouchableOpacity, Share } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
      marginHorizontal: 16, marginTop: 16,
      borderRadius: 16, overflow: 'hidden',
      backgroundColor: theme.card,
      borderWidth: 1, borderColor: theme.border,
    }}>
      <Image
        source={{ uri: 'https://raw.githubusercontent.com/alip-jmbd/alipp/main/bc.jpg' }}
        style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.15 }}
        contentFit="cover"
      />
      <LinearGradient
        colors={[theme.accentDim, 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View style={{ padding: 18 }}>
        <Text style={{ color: theme.text, fontWeight: '900', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>
          Sebarkan Keseruan Ini!
        </Text>
        <Text style={{ color: theme.subtext, fontSize: 11, marginBottom: 14 }}>
          Ajak teman-temanmu marathon anime favorit bareng di NefuSoft.
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={handleCopy}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, backgroundColor: theme.border, borderWidth: 1, borderColor: theme.border }}
          >
            <Ionicons name="copy-outline" size={12} color={theme.subtext} />
            <Text style={{ color: theme.text, fontWeight: '800', fontSize: 11 }}>Salin Link</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleShare}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, backgroundColor: theme.border, borderWidth: 1, borderColor: theme.border }}
          >
            <Ionicons name="share-outline" size={12} color={theme.subtext} />
            <Text style={{ color: theme.text, fontWeight: '800', fontSize: 11 }}>Lainnya</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
