import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { loadSavedTheme, useTheme } from '@/hooks/theme';
import { isAdmin, onAuthStateChanged } from '@/hooks/auth';
import DebugOverlay from '@/components/DebugOverlay';
import MaintenancePage from '@/components/MaintenancePage';
import firestore from '@react-native-firebase/firestore';
import '../global.css';

interface MaintenanceData {
  isActive: boolean;
  message?: string;
  estimasi?: string;
}

function AppLayout() {
  const theme = useTheme();
  const [maintenance, setMaintenance] = useState<MaintenanceData | null>(null);
  const [adminUser, setAdminUser]     = useState(false);

  useEffect(() => {
    loadSavedTheme();
  }, []);

  // Track auth state buat tau admin atau bukan
  useEffect(() => {
    const unsub = onAuthStateChanged(() => {
      setAdminUser(isAdmin());
    });
    return unsub;
  }, []);

  // Realtime listener maintenance
  useEffect(() => {
    const unsub = firestore()
      .collection('config')
      .doc('maintenance')
      .onSnapshot(snap => {
        const data = snap.data() as MaintenanceData | undefined;
        if (data?.isActive && !adminUser) {
          setMaintenance(data);
        } else {
          setMaintenance(null);
        }
      }, () => {
        // Kalau gagal fetch, jangan blok app
        setMaintenance(null);
      });
    return unsub;
  }, [adminUser]);

  // Kalau maintenance aktif dan bukan admin → tampil maintenance page
  if (maintenance) {
    return (
      <>
        <StatusBar style={theme.id === 'pure-white' ? 'dark' : 'light'} backgroundColor={theme.bg} />
        <MaintenancePage
          message={maintenance.message}
          estimasi={maintenance.estimasi}
        />
      </>
    );
  }

  return (
    <>
      <StatusBar style={theme.id === 'pure-white' ? 'dark' : 'light'} backgroundColor={theme.bg} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="watch/[slug]"
          options={{ animation: 'slide_from_bottom' }}
        />
      </Stack>
      <DebugOverlay />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppLayout />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
