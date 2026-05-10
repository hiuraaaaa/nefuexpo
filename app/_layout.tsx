import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { loadSavedTheme, useTheme } from '@/hooks/theme';
import '../global.css';

function AppLayout() {
  const theme = useTheme();

  useEffect(() => {
    loadSavedTheme();
  }, []);

  return (
    <>
      <StatusBar style={theme.id === 'pure-white' ? 'dark' : 'light'} backgroundColor={theme.bg} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="watch/[slug]"
          options={{
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
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
