import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/theme';

const TAB_HEIGHT = 60;

const TABS = [
  { name: 'index', label: 'Home', iconActive: 'home', iconInactive: 'home-outline' },
  { name: 'explore', label: 'Explore', iconActive: 'compass', iconInactive: 'compass-outline' },
  { name: 'news', label: 'News', iconActive: 'newspaper', iconInactive: 'newspaper-outline', badge: 'NEW' },
  { name: 'schedule', label: 'Schedule', iconActive: 'calendar', iconInactive: 'calendar-outline' },
  { name: 'profile', label: 'Profile', iconActive: 'person', iconInactive: 'person-outline' },
] as const;

// ── Tab Icon ───────────────────────────────────────────────────────────────────
function TabIcon({
  focused,
  label,
  iconActive,
  iconInactive,
  badge,
}: {
  focused: boolean;
  label: string;
  iconActive: string;
  iconInactive: string;
  badge?: string;
}) {
  const theme = useTheme();

  const pillWidth = useSharedValue(focused ? 72 : 36);
  const dotScale = useSharedValue(focused ? 1 : 0);
  const iconColor = useSharedValue(focused ? 1 : 0);
  const translateY = useSharedValue(focused ? -1 : 2);

  useEffect(() => {
    pillWidth.value = withSpring(focused ? 72 : 36, { damping: 18, stiffness: 200 });
    dotScale.value = withSpring(focused ? 1 : 0, { damping: 16, stiffness: 240 });
    translateY.value = withSpring(focused ? -1 : 2, { damping: 16, stiffness: 200 });
    iconColor.value = withTiming(focused ? 1 : 0, { duration: 180 });
  }, [focused]);

  const pillStyle = useAnimatedStyle(() => ({
    width: pillWidth.value,
    backgroundColor: `${theme.accent}${Math.round(iconColor.value * 0x22)
      .toString(16)
      .padStart(2, '0')}`,
  }));

  const iconWrapStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
    opacity: dotScale.value,
  }));

  return (
    <View style={styles.tabItem}>
      {/* Pill indicator */}
      <Animated.View style={[styles.pill, pillStyle]} />

      {/* Icon */}
      <Animated.View style={[styles.iconWrap, iconWrapStyle]}>
        <View>
          <Ionicons
            name={(focused ? iconActive : iconInactive) as any}
            size={22}
            color={focused ? theme.accent : theme.subtext}
          />
          {badge && (
            <View style={[styles.badge, { backgroundColor: theme.accent }]}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
      </Animated.View>

      {/* Label — disembunyikan dengan opacity agar tidak memicu crash fontSize 0 */}
      <Text
        style={[
          styles.label,
          {
            color: focused ? theme.accent : 'transparent',
            fontSize: 9, // selalu 9, tidak pernah 0
            opacity: focused ? 1 : 0, // sembunyi aman tanpa mengubah layout
          },
        ]}
        numberOfLines={1}
      >
        {label.toUpperCase()}
      </Text>

      {/* Bottom dot */}
      <Animated.View style={[styles.dot, { backgroundColor: theme.accent }, dotStyle]} />
    </View>
  );
}

// ── Tab Bar Background ────────────────────────────────────────────────────────
function TabBarBackground() {
  const theme = useTheme();
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: theme.bg,
          borderTopWidth: 1,
          borderTopColor: theme.border,
        },
      ]}
    />
  );
}

// ── Layout ─────────────────────────────────────────────────────────────────────
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.bg },
        animation: 'fade',
        tabBarStyle: {
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
      {TABS.map((tab) => (
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
                badge={(tab as any).badge}
              />
            ),
          }}
        />
      ))}

      <Tabs.Screen name="ongoing" options={{ href: null }} />
      <Tabs.Screen name="history" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    height: TAB_HEIGHT,
    width: 64,
    gap: 3,
  },
  pill: {
    position: 'absolute',
    top: 8,
    height: 32,
    borderRadius: 16,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
  },
  label: {
    fontWeight: '800',
    letterSpacing: 0.6,
    lineHeight: 11,
  },
  dot: {
    position: 'absolute',
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    borderRadius: 5,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  badgeText: {
    fontSize: 6,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.3,
  },
});
