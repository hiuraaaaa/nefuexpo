import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useRef, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/theme';

const TAB_HEIGHT  = 64;
const BUBBLE_SIZE = 58;

const TABS = [
  { name: 'index',    label: 'Home',     iconActive: 'home',        iconInactive: 'home-outline' },
  { name: 'explore',  label: 'Explore',  iconActive: 'compass',     iconInactive: 'compass-outline' },
  { name: 'ongoing',  label: 'Ongoing',  iconActive: 'play-circle', iconInactive: 'play-circle-outline' },
  { name: 'schedule', label: 'Schedule', iconActive: 'calendar',    iconInactive: 'calendar-outline' },
  { name: 'profile',  label: 'Profile',  iconActive: 'person',      iconInactive: 'person-outline' },
] as const;

// ── Tab Icon ───────────────────────────────────────────────────────────────────
function TabIcon({ focused, label, iconActive, iconInactive }: {
  focused: boolean;
  label: string;
  iconActive: string;
  iconInactive: string;
}) {
  const theme = useTheme();

  // ✅ reanimated — UI thread, ga blocking JS
  const scale     = useSharedValue(focused ? 1 : 0.85);
  const translateY = useSharedValue(focused ? 0 : 4);
  const opacity   = useSharedValue(focused ? 1 : 0.6);

  useEffect(() => {
    scale.value      = withSpring(focused ? 1 : 0.85,  { damping: 14, stiffness: 120 });
    translateY.value = withSpring(focused ? 0 : 4,     { damping: 14, stiffness: 120 });
    opacity.value    = withTiming(focused ? 1 : 0.6,   { duration: 200 });
  }, [focused]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (focused) {
    return (
      <Animated.View style={[styles.activeBubbleWrapper, animStyle]}>
        {/* ✅ Bubble pake BlurView + glow border */}
        <View style={[styles.activeBubble, {
          shadowColor: theme.accent,
          borderColor: `${theme.accent}60`,
        }]}>
          <BlurView
            intensity={40}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          {/* Accent overlay biar warna tetap keliatan */}
          <View style={[
            StyleSheet.absoluteFill,
            { backgroundColor: `${theme.accent}30`, borderRadius: BUBBLE_SIZE / 2 },
          ]} />
          <Ionicons name={iconActive as any} size={26} color={theme.accent} />
        </View>
        <Text style={[styles.activeLabel, { color: theme.accent }]}>
          {label.toUpperCase()}
        </Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.inactiveWrapper, animStyle]}>
      <Ionicons name={iconInactive as any} size={24} color={theme.subtext} />
    </Animated.View>
  );
}

// ── Tab Bar Background ─────────────────────────────────────────────────────────
function TabBarBackground() {
  const theme = useTheme();
  return (
    <View style={StyleSheet.absoluteFill}>
      {/* ✅ BlurView buat glassmorphism */}
      <BlurView
        intensity={60}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />
      {/* Border top tipis */}
      <View style={[
        StyleSheet.absoluteFill,
        {
          borderTopWidth: 1,
          borderTopColor: `${theme.accent}20`,
          backgroundColor: `${theme.bg}70`,
        },
      ]} />
    </View>
  );
}

// ── Layout ─────────────────────────────────────────────────────────────────────
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const theme  = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.bg },
        animation: 'fade',
        tabBarStyle: {
          // ✅ transparent biar BlurView keliatan
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: TAB_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 0,
          position: 'absolute',
          elevation: 0,
        },
        tabBarBackground: () => <TabBarBackground />,
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.subtext,
      }}
    >
      {TABS.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                focused={focused}
                label={tab.label}
                iconActive={tab.iconActive}
                iconInactive={tab.iconInactive}
              />
            ),
          }}
        />
      ))}

      <Tabs.Screen name="history" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeBubbleWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: -(BUBBLE_SIZE / 2 + 4),
  },
  activeBubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    // glow
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
  },
  activeLabel: {
    fontSize: 9,
    fontWeight: '900',
    marginTop: 5,
    letterSpacing: 0.5,
  },
  inactiveWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
});
