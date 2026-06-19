import React, { useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Linking, Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, withSpring,
  Easing, FadeIn,
} from 'react-native-reanimated';
import { COLORS, LOGO_URL } from '@/constants';

const { width } = Dimensions.get('window');

interface Props {
  storeUrl?: string;
  latestVersion?: string;
}

export default function UpdatePage({ storeUrl, latestVersion }: Props) {
  const floatY  = useSharedValue(0);
  const scale   = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value   = withSpring(1, { damping: 14, stiffness: 120 });
    opacity.value = withTiming(1, { duration: 400 });
    floatY.value  = withRepeat(withSequence(
      withTiming(-10, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      withTiming(0,   { duration: 1800, easing: Easing.inOut(Easing.ease) }),
    ), -1, false);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: floatY.value }],
    opacity: opacity.value,
  }));

  // FIX: Auto-close dihapus — cuma buka URL download, app tetap kebuka.
  const handleUpdate = async () => {
    if (!storeUrl) return;
    try {
      await Linking.openURL(storeUrl);
    } catch {}
  };

  return (
    <Animated.View entering={FadeIn.duration(300)} style={s.root}>

      <View style={[s.blob, { top: -80, left: -80, width: 260, height: 260, borderRadius: 130, backgroundColor: `${COLORS.gold}06` }]} />
      <View style={[s.blob, { bottom: 60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: `${COLORS.gold}08` }]} />

      <Animated.View style={[s.center, containerStyle]}>

        <Image
          source={{ uri: LOGO_URL }}
          style={s.logo}
          contentFit="contain"
        />

        <View style={s.iconWrap}>
          <Text style={s.iconEmoji}>🚀</Text>
        </View>

        <Text style={s.title}>Update Tersedia!</Text>

        {latestVersion && (
          <View style={s.versionBadge}>
            <Text style={s.versionText}>Versi {latestVersion}</Text>
          </View>
        )}

        <Text style={s.subtitle}>
          Ada versi baru NefuSoft yang lebih{'\n'}stabil dan berfitur lengkap.{'\n'}Update sekarang untuk melanjutkan.
        </Text>

        <View style={s.featureWrap}>
          {['Performa lebih cepat', 'Bug fixes & improvements', 'Fitur terbaru'].map((f, i) => (
            <View key={i} style={s.featureRow}>
              <Text style={s.featureDot}>✦</Text>
              <Text style={s.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity onPress={handleUpdate} activeOpacity={0.85} style={s.btn}>
          <Text style={s.btnText}>Update & Install Sekarang</Text>
        </TouchableOpacity>

        {/* FIX: Hint lama soal auto-close dihapus karena fiturnya udah gak ada */}
        <Text style={s.hint}>
          Download akan dibuka lewat browser/download manager
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#08080a', alignItems: 'center', justifyContent: 'center' },
  blob: { position: 'absolute' },
  center: { alignItems: 'center', paddingHorizontal: 36, width: '100%' },
  logo: { width: 56, height: 56, borderRadius: 14, marginBottom: 20 },
  iconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: `${COLORS.gold}30`,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  iconEmoji: { fontSize: 32 },
  title: { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: -0.5, marginBottom: 10, textAlign: 'center' },
  versionBadge: {
    backgroundColor: `${COLORS.gold}20`, borderWidth: 1, borderColor: `${COLORS.gold}40`,
    paddingHorizontal: 14, paddingVertical: 4, borderRadius: 999, marginBottom: 16,
  },
  versionText: { color: COLORS.gold, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  subtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 21, textAlign: 'center', marginBottom: 20, fontWeight: '500' },
  featureWrap: {
    alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14, padding: 16, gap: 10, marginBottom: 28,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureDot: { color: COLORS.gold, fontSize: 10 },
  featureText: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '600' },
  btn: {
    backgroundColor: COLORS.gold, paddingHorizontal: 48, paddingVertical: 16,
    borderRadius: 14, marginBottom: 14, width: '100%', alignItems: 'center',
    elevation: 8, shadowColor: COLORS.gold, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12,
  },
  btnText: { color: '#000', fontWeight: '900', fontSize: 15, letterSpacing: 0.3 },
  hint: { color: 'rgba(255,255,255,0.15)', fontSize: 10, fontWeight: '600', textAlign: 'center', lineHeight: 16 },
});
