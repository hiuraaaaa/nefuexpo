import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Dimensions,
  StatusBar, ScrollView, BackHandler,
} from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as SplashScreen from 'expo-splash-screen';
import Constants from 'expo-constants';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, withRepeat, withSequence,
  cancelAnimation, runOnJS, Easing, FadeIn, FadeOut,
} from 'react-native-reanimated';
import { COLORS, LOGO_URL } from '@/constants';
import { api } from '@/hooks/api/api';
import { signInWithGoogle, onAuthStateChanged } from '@/hooks/auth';
import auth from '@react-native-firebase/auth';
import { Anime } from '@/types';
import { storageMain } from '@/hooks/storage/storage';
import { prefetchHome } from '@/hooks/prefetch';

const { width, height } = Dimensions.get('window');
const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

// ── Poster grid config ────────────────────────────────────────────────────────
const NUM_COLS      = 4;
const CARD_GAP      = 6;
const CARD_W        = (width * 1.3) / NUM_COLS - CARD_GAP;
const CARD_H        = CARD_W * 1.45;
const STEP          = CARD_H + CARD_GAP;
const GRID_H        = height * 0.68;
const REPEAT_COUNT  = 4;
const COL_OFFSETS   = [0, -(STEP * 0.6), -(STEP * 0.2), -(STEP * 0.8)] as const;
const COL_DURATIONS = [3800, 4400, 3400, 4800] as const;
const DISCLAIMER_KEY = 'nefusoft_disclaimer_accepted';
const MAX_LOAD_MS    = 5000;

type Step = 'loading' | 'welcome' | 'disclaimer' | 'login';

// ── Poster components ─────────────────────────────────────────────────────────
const PosterCard = React.memo(({ item }: { item: Anime }) => (
  <View style={{
    width: CARD_W, height: CARD_H, borderRadius: 8,
    overflow: 'hidden', backgroundColor: COLORS.card,
  }}>
    {item.image_poster ? (
      <Image
        source={{ uri: item.image_poster }}
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
  const repeated   = useMemo(
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

// ── Loading Screen ─────────────────────────────────────────────────────────────
// FIX: Selalu render dari frame pertama supaya tidak ada celah hitam.
// SplashScreen.hideAsync() dipanggil di sini setelah komponen ini mount.
function LoadingScreen({ logoReady }: { logoReady: boolean }) {
  const scale   = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  // FIX: Hide splash screen segera saat LoadingScreen mount,
  // sehingga transisi langsung: Expo Splash → LoadingScreen (hitam) tanpa flash.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    if (!logoReady) return;
    scale.value   = withRepeat(withSequence(
      withTiming(1.08, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      withTiming(1,    { duration: 700, easing: Easing.inOut(Easing.ease) }),
    ), -1, false);
    opacity.value = withRepeat(withSequence(
      withTiming(1,   { duration: 700 }),
      withTiming(0.6, { duration: 700 }),
    ), -1, false);
  }, [logoReady]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity:   logoReady ? opacity.value : 0,
  }));

  return (
    <View style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      // FIX: Pastikan background hitam langsung ada sejak frame pertama
      // Ini yang mencegah flash hitam antara Expo splash dan app content
      backgroundColor: '#08080a',
      alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <Animated.View
        style={logoStyle}
        entering={logoReady ? FadeIn.duration(300) : undefined}
      >
        <Image
          source={{ uri: LOGO_URL }}
          style={{ width: 72, height: 72, borderRadius: 18 }}
          contentFit="contain"
        />
      </Animated.View>
      {logoReady && (
        <Animated.Text
          entering={FadeIn.duration(400).delay(150)}
          style={{
            color: 'rgba(255,255,255,0.2)', fontSize: 11,
            marginTop: 24, fontWeight: '600', letterSpacing: 1,
          }}
        >
          NefuSoft v{APP_VERSION}
        </Animated.Text>
      )}
    </View>
  );
}

// ── Disclaimer Screen ─────────────────────────────────────────────────────────
function DisclaimerScreen({ onAccept, onDecline }: {
  onAccept: () => void;
  onDecline: () => void;
}) {
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: '#08080a', zIndex: 50,
      }}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={{ flex: 1, padding: 24 }}>
          <View style={{ marginBottom: 24 }}>
            <Image
              source={{ uri: LOGO_URL }}
              style={{ width: 44, height: 44, borderRadius: 12, marginBottom: 16 }}
              contentFit="contain"
            />
            <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: -0.5 }}>
              Disclaimer
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>
              Baca sebelum melanjutkan
            </Text>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 20, marginBottom: 16 }}>
              NefuSoft adalah aplikasi streaming anime pihak ketiga. Semua konten yang ditampilkan bersumber dari server eksternal dan tidak dihosting, dimiliki, atau berafiliasi dengan NefuSoft.
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 20, marginBottom: 12 }}>
              Dengan menggunakan aplikasi ini, Anda mengakui dan menyetujui bahwa:
            </Text>
            {[
              'NefuSoft tidak menghosting, mengunggah, atau mendistribusikan konten media apa pun.',
              'Semua anime, video streaming, dan metadata disediakan oleh sumber pihak ketiga.',
              'Pengembang NefuSoft tidak bertanggung jawab atas konten, ketersediaan, atau legalitas aliran video.',
              'Aplikasi ini adalah search engine untuk menemukan anime di berbagai sumber.',
              'Anda bertanggung jawab penuh untuk mematuhi hukum di wilayah hukum Anda.',
              'Kami tidak mengumpulkan, menyimpan, atau mengirimkan data pribadi ke server eksternal.',
            ].map((item, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                <Text style={{ color: COLORS.gold, fontSize: 13, lineHeight: 20 }}>•</Text>
                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 20, flex: 1 }}>
                  {item}
                </Text>
              </View>
            ))}
            <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, lineHeight: 18, marginTop: 8 }}>
              Jika Anda tidak menyetujui persyaratan ini, silakan tutup aplikasi.
            </Text>
          </ScrollView>

          <View style={{ gap: 8, paddingTop: 16 }}>
            <TouchableOpacity
              onPress={onAccept}
              activeOpacity={0.85}
              style={{
                backgroundColor: COLORS.gold,
                paddingVertical: 16, borderRadius: 14, alignItems: 'center',
              }}
            >
              <Text style={{ color: '#000', fontWeight: '900', fontSize: 14 }}>Setuju & Lanjutkan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onDecline}
              activeOpacity={0.85}
              style={{
                paddingVertical: 16, borderRadius: 14, alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
              }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontWeight: '700', fontSize: 14 }}>Tolak & Keluar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

// ── Login Screen ──────────────────────────────────────────────────────────────
function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  // FIX: Tampilkan error kalau login gagal
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleGoogle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setLoginError(null);
    try {
      const user = await signInWithGoogle();
      if (user) {
        onSuccess();
      } else {
        // signInWithGoogle return null = user cancel atau gagal
        setLoginError('Login dibatalkan. Coba lagi.');
      }
    } catch {
      setLoginError('Gagal login. Periksa koneksi dan coba lagi.');
    }
    setLoading(false);
  };

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: '#08080a', zIndex: 50,
      }}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={{ flex: 1, padding: 28, justifyContent: 'flex-end', paddingBottom: 40 }}>
          <View style={{
            position: 'absolute', top: height * 0.1, right: -60,
            width: 240, height: 240, borderRadius: 120,
            backgroundColor: `${COLORS.gold}10`,
          }} />
          <View style={{
            position: 'absolute', top: height * 0.25, left: -60,
            width: 180, height: 180, borderRadius: 90,
            backgroundColor: `${COLORS.gold}06`,
          }} />

          <Image
            source={{ uri: LOGO_URL }}
            style={{ width: 56, height: 56, borderRadius: 14, marginBottom: 24 }}
            contentFit="contain"
          />
          <Text style={{ color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: -1, marginBottom: 6 }}>
            Selamat datang
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 20, marginBottom: 40 }}>
            Masuk untuk simpan progress,{'\n'}favorit, dan XP kamu.
          </Text>

          {/* FIX: Tampilkan pesan error kalau login gagal */}
          {loginError && (
            <Animated.View
              entering={FadeIn.duration(200)}
              style={{
                backgroundColor: 'rgba(230,57,70,0.12)',
                borderWidth: 1, borderColor: 'rgba(230,57,70,0.3)',
                borderRadius: 10, padding: 12, marginBottom: 16,
              }}
            >
              <Text style={{ color: '#e63946', fontSize: 12, fontWeight: '700', textAlign: 'center' }}>
                {loginError}
              </Text>
            </Animated.View>
          )}

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
            <View style={{
              width: 20, height: 20, borderRadius: 10,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 14, fontWeight: '900', color: '#4285F4' }}>G</Text>
            </View>
            <Text style={{ color: '#000', fontWeight: '800', fontSize: 14 }}>
              {loading ? 'Memuat...' : 'Masuk dengan Google'}
            </Text>
          </TouchableOpacity>

          <Text style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10, textAlign: 'center', marginTop: 16 }}>
            NefuSoft v{APP_VERSION}
          </Text>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function WelcomeScreen() {
  const router = useRouter();
  // FIX: Dipakai untuk gate navigasi — jangan replace() sebelum Root Layout
  // (Stack di _layout.tsx) selesai mount & ke-attach ke navigation container.
  const rootNavigationState = useRootNavigationState();
  const [step, setStep]           = useState<Step>('loading');
  const [posters, setPosters]     = useState<Anime[]>([]);
  const [logoReady, setLogoReady] = useState(false);

  const overlayOpacity = useSharedValue(1);
  const contentOpacity = useSharedValue(0);
  const contentY       = useSharedValue(20);

  const cols = useMemo(
    () => [0, 1, 2, 3].map(i => posters.filter((_, idx) => idx % 4 === i)),
    [posters]
  );

  // Prefetch logo
  useEffect(() => {
    Image.prefetch(LOGO_URL)
      .then(() => setLogoReady(true))
      .catch(() => setLogoReady(true));
  }, []);

  // ── FIX: Auto Login ──────────────────────────────────────────────────────
  // Cek auth().currentUser dulu secara synchronous — kalau udah ada sesi aktif
  // (user pernah login), langsung redirect tanpa tunggu welcome screen render.
  // Ini bikin "auto login" terasa instan.
  //
  // FIX (crash): auth().currentUser resolve synchronous dari cache Firebase,
  // jadi efek ini bisa nembak router.replace() SEBELUM Root Layout (Stack)
  // selesai mount & register ke navigation container expo-router → crash
  // "Attempted to navigate before mounting the Root Layout component".
  // Solusinya: gate dengan rootNavigationState?.key, baru navigasi kalau
  // navigator beneran udah ready.
  useEffect(() => {
    if (!rootNavigationState?.key) return; // ⛔ navigator belum siap, jangan navigasi dulu

    // Cek synchronous dulu (dari cache lokal Firebase)
    const syncUser = auth().currentUser;
    if (syncUser) {
      router.replace('/(tabs)');
      return;
    }

    // Kalau null, tunggu Firebase restore session dari storage async
    const unsub = onAuthStateChanged(async (user) => {
      if (user) {
        // FIX: User sudah login sebelumnya — langsung ke tabs, skip semua welcome flow
        router.replace('/(tabs)');
        return;
      }

      // User belum login — load posters sambil background fetch
      try {
        const timeout  = new Promise<void>(r => setTimeout(r, MAX_LOAD_MS));
        const fetchAll = async () => {
          const [postersRes] = await Promise.all([
            api.ongoing(),
            prefetchHome(),
          ]);
          setPosters(postersRes.data?.slice(0, 32) || []);
        };
        await Promise.race([fetchAll(), timeout]);
      } catch {}

      setStep('welcome');
      overlayOpacity.value = withTiming(0, { duration: 400 });
      contentOpacity.value = withTiming(1, { duration: 600 });
      contentY.value       = withSpring(0, { damping: 16, stiffness: 100 });
    });

    return unsub;
  }, [rootNavigationState?.key]);

  const goMain = useCallback(() => router.replace('/(tabs)'), [router]);

  const navigateTo = useCallback(() => {
    overlayOpacity.value = withTiming(1, { duration: 250 }, (done) => {
      if (done) runOnJS(goMain)();
    });
  }, [goMain]);

  const handleMulaiNonton = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // FIX: Cek apakah user sudah pernah accept disclaimer
    // Kalau sudah, langsung ke login — disclaimer tidak perlu ditampilkan lagi
    const sudahAccept = storageMain.getBoolean(DISCLAIMER_KEY);
    setStep(sudahAccept ? 'login' : 'disclaimer');
  }, []);

  const handleDisclaimerAccept = useCallback(() => {
    storageMain.set(DISCLAIMER_KEY, true);
    setStep('login');
  }, []);

  const handleDisclaimerDecline = useCallback(() => {
    BackHandler.exitApp();
  }, []);

  const handleLoginSuccess = useCallback(() => {
    navigateTo();
  }, [navigateTo]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity:   contentOpacity.value,
    transform: [{ translateY: contentY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  return (
    <View style={{ flex: 1, backgroundColor: '#08080a' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Poster grid */}
      <View style={{
        position: 'absolute',
        top: -height * 0.05, left: -(width * 0.15),
        width: width * 1.3, height: GRID_H,
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

      {/* Gradient */}
      <LinearGradient
        colors={['transparent', 'rgba(8,8,10,0.5)', 'rgba(8,8,10,0.92)', '#08080a']}
        locations={[0, 0.35, 0.6, 0.8]}
        style={{
          position: 'absolute', left: 0, right: 0,
          top: GRID_H * 0.15, height: GRID_H * 0.9,
        }}
      />

      {/* Welcome content */}
      <Animated.View style={[{
        position: 'absolute', bottom: 0, left: 0, right: 0,
      }, contentStyle]}>
        <SafeAreaView edges={['bottom']}>
          <View style={{ paddingHorizontal: 28, paddingBottom: 36 }}>
            <View style={{ marginBottom: 20 }}>
              <Image
                source={{ uri: LOGO_URL }}
                style={{ width: 56, height: 56, borderRadius: 14 }}
                contentFit="contain"
              />
            </View>
            <Text style={{ color: '#fff', fontSize: 36, fontWeight: '900', letterSpacing: -1, lineHeight: 42, marginBottom: 6 }}>
              Tonton Anime
            </Text>
            <Text style={{ color: COLORS.gold, fontSize: 36, fontWeight: '900', letterSpacing: -1, lineHeight: 42, marginBottom: 14 }}>
              Favorit Kamu
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, lineHeight: 21, marginBottom: 32, fontWeight: '500' }}>
              Ribuan judul anime subtitle Indonesia.{'\n'}Gratis, tanpa iklan, kualitas hingga 1080p.
            </Text>
            <TouchableOpacity
              onPress={handleMulaiNonton}
              activeOpacity={0.85}
              style={{
                backgroundColor: COLORS.gold,
                paddingVertical: 16, borderRadius: 14,
                alignItems: 'center', marginBottom: 10, elevation: 8,
              }}
            >
              <Text style={{ color: '#000', fontWeight: '900', fontSize: 15, letterSpacing: 0.2 }}>
                Mulai Nonton
              </Text>
            </TouchableOpacity>
            <Text style={{ color: 'rgba(255,255,255,0.15)', fontSize: 11, textAlign: 'center', marginTop: 8 }}>
              v{APP_VERSION}
            </Text>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Overlay anti-blink */}
      <Animated.View style={[{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: '#08080a', pointerEvents: 'none',
      }, overlayStyle]} />

      {/* FIX: LoadingScreen selalu ada saat step === 'loading'.
          SplashScreen.hideAsync() dipanggil di dalam LoadingScreen saat mount
          sehingga transisi Expo Splash → LoadingScreen hitam mulus tanpa flash. */}
      {step === 'loading' && <LoadingScreen logoReady={logoReady} />}

      {step === 'disclaimer' && (
        <DisclaimerScreen
          onAccept={handleDisclaimerAccept}
          onDecline={handleDisclaimerDecline}
        />
      )}

      {step === 'login' && (
        <LoginScreen onSuccess={handleLoginSuccess} />
      )}
    </View>
  );
}
