import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Dimensions,
  StatusBar, Modal, ScrollView, BackHandler,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, withRepeat, withSequence,
  cancelAnimation, runOnJS, Easing, FadeIn,
} from 'react-native-reanimated';
import { COLORS, LOGO_URL } from '@/constants';
import { api } from '@/hooks/api';
import { signInWithGoogle, onAuthStateChanged } from '@/hooks/auth';
import { Anime } from '@/types';
import { storageMain } from '@/hooks/storage';
import { prefetchHome } from '@/hooks/prefetch';

const { width, height } = Dimensions.get('window');

// ── Versi dari app.config.ts — ubah di sana aja ──────────────────────────────
const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

// ── Poster grid config ────────────────────────────────────────────────────────
const NUM_COLS     = 4;
const CARD_GAP     = 6;
const CARD_W       = (width * 1.3) / NUM_COLS - CARD_GAP;
const CARD_H       = CARD_W * 1.45;
const STEP         = CARD_H + CARD_GAP;
const GRID_H       = height * 0.68;
const REPEAT_COUNT = 4;
const COL_OFFSETS   = [0, -(STEP * 0.6), -(STEP * 0.2), -(STEP * 0.8)] as const;
const COL_DURATIONS = [3800, 4400, 3400, 4800] as const;
const DISCLAIMER_KEY = 'nefusoft_disclaimer_accepted';

// ── Poster components ─────────────────────────────────────────────────────────
const PosterCard = React.memo(({ item }: { item: Anime }) => (
  <View style={{
    width: CARD_W, height: CARD_H, borderRadius: 8,
    overflow: 'hidden', backgroundColor: COLORS.card,
  }}>
    {item.image_poster ? (
      <Image
        source={{ uri: item.image_poster, priority: 'low' }}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        transition={200}
      />
    ) : null}
  </View>
));

const PosterColumn = React.memo(({ items, offsetY, duration }: {
  items: Anime[]; offsetY: number; duration: number;
}) => {
  const translateY = useSharedValue(offsetY);
  const repeated = useMemo(
    () => Array.from({ length: REPEAT_COUNT }, () => items).flat(),
    [items]
  );

  useEffect(() => {
    if (!items.length) return;
    translateY.value = offsetY;
    translateY.value = withRepeat(
      withSequence(
        withTiming(offsetY - STEP, { duration, easing: Easing.linear }),
        withTiming(offsetY, { duration: 0 }),
      ),
      -1, false,
    );
    return () => cancelAnimation(translateY);
  }, [items.length]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[{ width: CARD_W, gap: CARD_GAP }, animStyle]}>
      {repeated.map((a, i) => <PosterCard key={`${a.id}-${i}`} item={a} />)}
    </Animated.View>
  );
});

// ── Disclaimer Modal ──────────────────────────────────────────────────────────
function DisclaimerModal({ visible, onAccept, onDecline }: {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  // Block hardware back button saat disclaimer tampil
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 20 }}>
        <Animated.View entering={FadeIn.duration(250)} style={{
          backgroundColor: '#18181c',
          borderRadius: 20,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.07)',
          overflow: 'hidden',
          maxHeight: height * 0.72,
        }}>
          {/* Blob decorations */}
          <View style={{
            position: 'absolute', top: -60, right: -60,
            width: 200, height: 200, borderRadius: 100,
            backgroundColor: `${COLORS.gold}12`,
          }} />
          <View style={{
            position: 'absolute', bottom: -40, left: -40,
            width: 150, height: 150, borderRadius: 75,
            backgroundColor: `${COLORS.gold}08`,
          }} />

          <ScrollView
            contentContainerStyle={{ padding: 28, paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={{
              color: '#fff', fontSize: 22, fontWeight: '900',
              letterSpacing: -0.5, marginBottom: 16,
            }}>
              Disclaimer
            </Text>
            {[
              'NefuSoft adalah aplikasi streaming anime pihak ketiga. Semua konten yang ditampilkan bersumber dari server eksternal dan tidak dihosting, dimiliki, atau berafiliasi dengan NefuSoft.',
              'Dengan menggunakan aplikasi ini, Anda mengakui dan menyetujui bahwa:',
            ].map((t, i) => (
              <Text key={i} style={{
                color: 'rgba(255,255,255,0.6)', fontSize: 13,
                lineHeight: 20, marginBottom: 10,
              }}>{t}</Text>
            ))}
            {[
              'NefuSoft tidak menghosting, mengunggah, atau mendistribusikan konten media apa pun.',
              'Semua anime, video streaming, dan metadata disediakan oleh sumber pihak ketiga.',
              'Pengembang NefuSoft tidak bertanggung jawab atas konten, ketersediaan, atau legalitas aliran video.',
              'Aplikasi ini adalah search engine untuk menemukan anime di berbagai sumber.',
              'Anda bertanggung jawab penuh untuk mematuhi hukum di wilayah hukum Anda.',
              'Kami tidak mengumpulkan, menyimpan, atau mengirimkan data pribadi ke server eksternal.',
            ].map((item, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                <Text style={{ color: COLORS.gold, fontSize: 13, lineHeight: 20 }}>•</Text>
                <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 20, flex: 1 }}>
                  {item}
                </Text>
              </View>
            ))}
            <Text style={{
              color: 'rgba(255,255,255,0.4)', fontSize: 12,
              lineHeight: 18, marginTop: 8, marginBottom: 4,
            }}>
              Jika Anda tidak menyetujui persyaratan ini, silakan tutup aplikasi.
            </Text>
          </ScrollView>

          {/* Buttons */}
          <View style={{ padding: 20, paddingTop: 12, gap: 8 }}>
            <TouchableOpacity
              onPress={onAccept}
              activeOpacity={0.85}
              style={{
                backgroundColor: COLORS.gold,
                paddingVertical: 15, borderRadius: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#000', fontWeight: '900', fontSize: 14 }}>Setuju</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onDecline}
              activeOpacity={0.85}
              style={{
                paddingVertical: 15, borderRadius: 12,
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
              }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontWeight: '700', fontSize: 14 }}>Tolak</Text>
            </TouchableOpacity>
            <Text style={{
              color: 'rgba(255,255,255,0.2)', fontSize: 10,
              textAlign: 'center', marginTop: 4,
            }}>
              NefuSoft v{APP_VERSION}
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Login Sheet ───────────────────────────────────────────────────────────────
function LoginModal({ visible, onSuccess }: {
  visible: boolean;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      if (user) onSuccess();
    } catch {}
    setLoading(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <Animated.View entering={FadeIn.duration(200)} style={{
          backgroundColor: '#18181c',
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
          overflow: 'hidden',
        }}>
          {/* Blob decorations */}
          <View style={{
            position: 'absolute', top: -80, right: -80,
            width: 240, height: 240, borderRadius: 120,
            backgroundColor: `${COLORS.gold}10`,
          }} />
          <View style={{
            position: 'absolute', top: 20, left: -60,
            width: 180, height: 180, borderRadius: 90,
            backgroundColor: `${COLORS.gold}06`,
          }} />

          <SafeAreaView edges={['bottom']}>
            <View style={{ padding: 32, paddingBottom: 40 }}>
              {/* Handle */}
              <View style={{
                width: 40, height: 4, borderRadius: 2,
                backgroundColor: 'rgba(255,255,255,0.15)',
                alignSelf: 'center', marginBottom: 32,
              }} />

              <Image
                source={{ uri: LOGO_URL, priority: 'high' }}
                style={{ width: 52, height: 52, borderRadius: 14, marginBottom: 20 }}
                contentFit="contain"
              />

              <Text style={{
                color: '#fff', fontSize: 26, fontWeight: '900',
                letterSpacing: -0.5, marginBottom: 6,
              }}>
                Selamat datang
              </Text>
              <Text style={{
                color: 'rgba(255,255,255,0.4)', fontSize: 13,
                lineHeight: 20, marginBottom: 36,
              }}>
                Masuk untuk simpan progress,{'\n'}favorit, dan XP kamu.
              </Text>

              {/* Google Button */}
              <TouchableOpacity
                onPress={handleGoogle}
                disabled={loading}
                activeOpacity={0.85}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  justifyContent: 'center', gap: 10,
                  backgroundColor: '#fff',
                  paddingVertical: 16, borderRadius: 14,
                  marginBottom: 12,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {/* Google G icon */}
                <View style={{
                  width: 20, height: 20, borderRadius: 10,
                  backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: '#4285F4' }}>G</Text>
                </View>
                <Text style={{ color: '#000', fontWeight: '800', fontSize: 14 }}>
                  {loading ? 'Memuat...' : 'Masuk dengan Google'}
                </Text>
              </TouchableOpacity>

              <Text style={{
                color: 'rgba(255,255,255,0.2)', fontSize: 10,
                textAlign: 'center', marginTop: 8,
              }}>
                NefuSoft v{APP_VERSION}
              </Text>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function WelcomeScreen() {
  const router = useRouter();
  const [posters, setPosters]             = useState<Anime[]>([]);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showLogin, setShowLogin]           = useState(false);
  const [checkingAuth, setCheckingAuth]     = useState(true);

  const opacity        = useSharedValue(0);
  const translateY     = useSharedValue(20);
  const overlayOpacity = useSharedValue(1); // mulai dari 1 (hitam) → fade in biar ga blink

  const cols = useMemo(
    () => [0, 1, 2, 3].map(i => posters.filter((_, idx) => idx % 4 === i)),
    [posters]
  );

  // ── Cek auth state dulu sebelum tampil apapun ────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged((user) => {
      if (user) {
        // Udah login — langsung ke tabs tanpa tampil welcome
        router.replace('/(tabs)');
      } else {
        setCheckingAuth(false);
      }
    });
    return unsub;
  }, []);

  // ── Load posters & animasi masuk ─────────────────────────────────────────
  useEffect(() => {
    if (checkingAuth) return;

    const disclaimerAccepted = storageMain.getBoolean(DISCLAIMER_KEY) ?? false;

    // Prefetch home data di background sambil user baca disclaimer/login
    prefetchHome();

    api.ongoing().then(r => {
      setPosters(r.data?.slice(0, 32) || []);
    }).catch(() => {});

    // Fade in dari hitam — anti blink
    overlayOpacity.value = withTiming(0, { duration: 500 });
    opacity.value        = withTiming(1, { duration: 600 });
    translateY.value     = withSpring(0, { damping: 16, stiffness: 100 });

    // Langsung show disclaimer kalau belum pernah setuju
    if (!disclaimerAccepted) {
      setTimeout(() => setShowDisclaimer(true), 400);
    }
  }, [checkingAuth]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));

  const goMain = useCallback(() => router.replace('/(tabs)'), [router]);

  const navigateTo = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    overlayOpacity.value = withTiming(1, { duration: 250 }, (done) => {
      if (done) runOnJS(goMain)();
    });
  }, [goMain]);

  const handleDisclaimerAccept = useCallback(() => {
    storageMain.set(DISCLAIMER_KEY, true);
    setShowDisclaimer(false);
    setTimeout(() => setShowLogin(true), 200);
  }, []);

  const handleDisclaimerDecline = useCallback(() => {
    BackHandler.exitApp();
  }, []);

  const handleLoginSuccess = useCallback(() => {
    setShowLogin(false);
    navigateTo();
  }, [navigateTo]);

  const handleMulaiNonton = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const disclaimerAccepted = storageMain.getBoolean(DISCLAIMER_KEY) ?? false;
    if (!disclaimerAccepted) {
      setShowDisclaimer(true);
    } else {
      setShowLogin(true);
    }
  }, []);

  // Jangan render apapun saat cek auth
  if (checkingAuth) {
    return <View style={{ flex: 1, backgroundColor: '#08080a' }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#08080a' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Poster grid */}
      <View style={{
        position: 'absolute',
        top: -height * 0.05,
        left: -(width * 0.15),
        width: width * 1.3,
        height: GRID_H,
        overflow: 'hidden',
        transform: [{ rotate: '-10deg' }],
      }}>
        <View style={{ flexDirection: 'row', gap: CARD_GAP, paddingHorizontal: CARD_GAP }}>
          {cols.map((col, i) => (
            <PosterColumn
              key={i}
              items={col.length >= 4 ? col : posters.slice(i * 4, i * 4 + 8)}
              offsetY={COL_OFFSETS[i]}
              duration={COL_DURATIONS[i]}
            />
          ))}
        </View>
      </View>

      {/* Gradient fade */}
      <LinearGradient
        colors={['transparent', 'rgba(8,8,10,0.5)', 'rgba(8,8,10,0.92)', '#08080a']}
        locations={[0, 0.35, 0.6, 0.8]}
        style={{
          position: 'absolute', left: 0, right: 0,
          top: GRID_H * 0.15, height: GRID_H * 0.9,
        }}
      />

      {/* Bottom content */}
      <Animated.View style={[{
        position: 'absolute', bottom: 0, left: 0, right: 0,
      }, contentStyle]}>
        <SafeAreaView edges={['bottom']}>
          <View style={{ paddingHorizontal: 28, paddingBottom: 36 }}>

            <View style={{ marginBottom: 20 }}>
              <Image
                source={{ uri: LOGO_URL, priority: 'high' }}
                style={{ width: 56, height: 56, borderRadius: 14 }}
                contentFit="contain"
              />
            </View>

            <Text style={{
              color: '#fff', fontSize: 36, fontWeight: '900',
              letterSpacing: -1, lineHeight: 42, marginBottom: 6,
            }}>
              Tonton Anime
            </Text>
            <Text style={{
              color: COLORS.gold, fontSize: 36, fontWeight: '900',
              letterSpacing: -1, lineHeight: 42, marginBottom: 14,
            }}>
              Favorit Kamu
            </Text>

            <Text style={{
              color: 'rgba(255,255,255,0.38)', fontSize: 13,
              lineHeight: 21, marginBottom: 32, fontWeight: '500',
            }}>
              Ribuan judul anime subtitle Indonesia.{'\n'}Gratis, tanpa iklan, kualitas hingga 1080p.
            </Text>

            <TouchableOpacity
              onPress={handleMulaiNonton}
              activeOpacity={0.85}
              style={{
                backgroundColor: COLORS.gold,
                paddingVertical: 16, borderRadius: 14,
                alignItems: 'center', marginBottom: 10,
                elevation: 8,
              }}
            >
              <Text style={{ color: '#000', fontWeight: '900', fontSize: 15, letterSpacing: 0.2 }}>
                Mulai Nonton
              </Text>
            </TouchableOpacity>

            <Text style={{
              color: 'rgba(255,255,255,0.15)', fontSize: 11,
              textAlign: 'center', marginTop: 8,
            }}>
              v{APP_VERSION}
            </Text>

          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Overlay anti-blink — hitam di awal, fade ke transparan */}
      <Animated.View style={[{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: '#08080a', pointerEvents: 'none',
      }, overlayStyle]} />

      {/* Modals */}
      <DisclaimerModal
        visible={showDisclaimer}
        onAccept={handleDisclaimerAccept}
        onDecline={handleDisclaimerDecline}
      />
      <LoginModal
        visible={showLogin}
        onSuccess={handleLoginSuccess}
      />
    </View>
  );
}
