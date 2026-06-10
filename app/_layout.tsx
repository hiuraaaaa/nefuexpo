import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useState, Component, ReactNode } from 'react';
import { Text, ScrollView } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { loadSavedTheme, useTheme } from '@/hooks/theme';
import { isAdmin, onAuthStateChanged } from '@/hooks/auth';
import DebugOverlay from '@/components/DebugOverlay';
import MaintenancePage from '@/components/MaintenancePage';
import firestore from '@react-native-firebase/firestore';
import { refreshDomain } from '@/hooks/scraper';
import { SystemBars } from 'react-native-edge-to-edge';
import { useRouter } from 'expo-router';
import { rescheduleNotifs, useNotifTapHandler } from '@/hooks/notifications';
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

  useEffect(() => { loadSavedTheme(); refreshDomain(); }, []);

  // Reschedule notif tiap app buka
  useEffect(() => {
    rescheduleNotifs();
  }, []);

  // Handle tap notif → navigate
  useNotifTapHandler(router);

  useEffect(() => {
    const unsub = onAuthStateChanged(() => { setAdminUser(isAdmin()); });
    return unsub;
  }, []);

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

  if (maintenance) {
    return (
      <>
        <SystemBars style="light" />
        <StatusBar style={theme.id === 'pure-white' ? 'dark' : 'light'} />
        <MaintenancePage message={maintenance.message} estimasi={maintenance.estimasi} />
      </>
    );
  }

  return (
    <>
      <SystemBars style="light" />
      <StatusBar style={theme.id === 'pure-white' ? 'dark' : 'light'} />
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
    </>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function RootLayout() {
  return (
    <RootErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AppLayout />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </RootErrorBoundary>
  );
}
