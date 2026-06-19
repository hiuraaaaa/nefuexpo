import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useState, useCallback, useRef, Component, ReactNode } from 'react';
import { Text, ScrollView, TouchableOpacity, AppState, AppStateStatus } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import Constants from 'expo-constants';
import { initSession } from '@/hooks/api/api';
import NetInfo from '@react-native-community/netinfo';
import { loadSavedTheme, useTheme } from '@/hooks/theme';
import { isAdmin, onAuthStateChanged } from '@/hooks/auth';
import DebugOverlay from '@/components/DebugOverlay';
import MaintenancePage from '@/components/MaintenancePage';
import OfflinePage from '@/components/OfflinePage';
import UpdatePage from '@/components/UpdatePage';
import firestore from '@react-native-firebase/firestore';
import { refreshDomain } from '@/hooks/scraper';
import { SystemBars } from 'react-native-edge-to-edge';
import { useRouter } from 'expo-router';
import { RoomProvider } from '@/contexts/RoomContext';
import { rescheduleNotifs, useNotifTapHandler, sendTestNotif } from '@/hooks/notifications';
import '../global.css';

SplashScreen.preventAutoHideAsync();

// ─── Error Boundary ───────────────────────────────────────────────────────────
class RootErrorBoundary extends Component<
  { children: ReactNode },
  { error: string | null }
> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) {
    return { error: e.message + '\n\n' + e.stack };
  }
  render() {
    if (this.state.error) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: '#000' }}
          contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
          <Text style={{ color: '#e63946', fontSize: 14, fontWeight: '900', marginBottom: 8 }}>
            🔴 JS CRASH
          </Text>
          <Text style={{ color: '#fff', fontSize: 11, fontFamily: 'monospace', lineHeight: 18 }}>
            {this.state.error}
          </Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface MaintenanceData {
  isActive: boolean;
  message?: string;
  estimasi?: string;
}

// ─── AppLayout ────────────────────────────────────────────────────────────────
function AppLayout() {
  const theme  = useTheme();
  const router = useRouter();
  const [maintenance, setMaintenance] = useState<MaintenanceData | null>(null);
  const [adminUser, setAdminUser]     = useState(false);
  const [isOffline, setIsOffline]     = useState(false);
  const [updateInfo, setUpdateInfo]   = useState<{ storeUrl: string; latestVersion: string } | null>(null);

  // FIX: Track apakah SplashScreen sudah di-hide, supaya tidak dipanggil dua kali
  const splashHiddenRef = useRef(false);
  const hideSplash = useCallback(async () => {
    if (splashHiddenRef.current) return;
    splashHiddenRef.current = true;
    try { await SplashScreen.hideAsync(); } catch {}
  }, []);

  useEffect(() => { loadSavedTheme(); refreshDomain(); initSession(); }, []);
  useEffect(() => { rescheduleNotifs(); }, []);
  useNotifTapHandler(router);

  // ── Offline detection ──────────────────────────────────────────────────────
  useEffect(() => {
    NetInfo.fetch().then(state => {
      setIsOffline(!state.isConnected);
    });
    const unsub = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const handler = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        NetInfo.fetch().then(state => setIsOffline(!state.isConnected));
      }
    };
    const sub = AppState.addEventListener('change', handler);
    return () => sub.remove();
  }, []);

  // ── Update check via GitHub Releases ─────────────────────────────────────
  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const res = await fetch(
          'https://api.github.com/repos/hiuraaaaa/nefuexpo/releases/latest',
          { headers: { 'Accept': 'application/vnd.github.v3+json' } }
        );
        if (!res.ok) return;
        const data = await res.json();

        const latestTag = (data.tag_name as string ?? '').replace(/^v/, '');
        const current   = Constants.expoConfig?.version ?? '0.0.0';

        const toNum = (v: string) =>
          v.split('.').map(Number).reduce((a, b, i) => a + b * Math.pow(1000, 2 - i), 0);

        if (toNum(current) < toNum(latestTag)) {
          const downloadUrl = `https://github.com/hiuraaaaa/nefuexpo/releases/download/v${latestTag}/NefuSoft.apk`;
          setUpdateInfo({ storeUrl: downloadUrl, latestVersion: latestTag });
        } else {
          setUpdateInfo(null);
        }
      } catch {
        setUpdateInfo(null);
      }
    };

    checkUpdate();
  }, []);

  const handleRetry = useCallback(() => {
    NetInfo.fetch().then(state => setIsOffline(!state.isConnected));
  }, []);

  // ── Auth ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(() => { setAdminUser(isAdmin()); });
    return unsub;
  }, []);

  // ── Maintenance ────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = firestore()
      .collection('config')
      .doc('maintenance')
      .onSnapshot(snap => {
        const data = snap.data() as MaintenanceData | undefined;
        if (data?.isActive && !adminUser) setMaintenance(data);
        else setMaintenance(null);
      }, () => { setMaintenance(null); });
    return unsub;
  }, [adminUser]);

  const statusBarStyle  = theme.tint === 'light' ? 'dark' : 'light';
  const systemBarsStyle = theme.tint === 'light' ? 'dark' : 'light';

  // FIX: Untuk layar maintenance/offline/update — hide splash di sini
  // karena app/index.tsx tidak akan pernah render di kasus ini
  if (isOffline) {
    hideSplash();
    return (
      <>
        <SystemBars style="light" />
        <StatusBar style="light" />
        <OfflinePage onRetry={handleRetry} />
      </>
    );
  }

  if (updateInfo) {
    hideSplash();
    return (
      <>
        <SystemBars style="light" />
        <StatusBar style="light" />
        {/* FIX: Auto-close (BackHandler.exitApp setelah download dimulai) dihapus.
            User yang mutusin sendiri kapan nutup app setelah update di-download. */}
        <UpdatePage
          storeUrl={updateInfo.storeUrl}
          latestVersion={updateInfo.latestVersion}
        />
      </>
    );
  }

  if (maintenance) {
    hideSplash();
    return (
      <>
        <SystemBars style={systemBarsStyle} />
        <StatusBar style={statusBarStyle} />
        <MaintenancePage message={maintenance.message} estimasi={maintenance.estimasi} />
      </>
    );
  }

  // Normal flow: splash akan di-hide oleh app/index.tsx setelah LoadingScreen render
  return (
    <>
      <SystemBars style={systemBarsStyle} />
      <StatusBar style={statusBarStyle} />
      <Stack screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.bg },
        animation: 'fade',
      }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="watch/[slug]" options={{ animation: 'slide_from_bottom' }} />
      </Stack>
      {__DEV__ && <DebugOverlay />}
      {__DEV__ && (
        <TouchableOpacity
          onPress={sendTestNotif}
          style={{
            position: 'absolute', bottom: 120, right: 16, zIndex: 9999,
            backgroundColor: '#e63946', borderRadius: 999,
            paddingHorizontal: 16, paddingVertical: 10,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12 }}>Test Notif</Text>
        </TouchableOpacity>
      )}
    </>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function RootLayout() {
  return (
    <RootErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RoomProvider>
          <AppLayout />
        </RoomProvider>
      </GestureHandlerRootView>
    </RootErrorBoundary>
  );
}
