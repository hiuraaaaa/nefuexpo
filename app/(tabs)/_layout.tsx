import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/theme';

const TAB_HEIGHT = 64;
const BUBBLE_SIZE = 58;

const TABS = [
  { name: 'index',    label: 'Home',     iconActive: 'home',           iconInactive: 'home-outline' },
  { name: 'explore',  label: 'Explore',  iconActive: 'compass',        iconInactive: 'compass-outline' },
  { name: 'ongoing',  label: 'Ongoing',  iconActive: 'play-circle',    iconInactive: 'play-circle-outline' },
  { name: 'schedule', label: 'Schedule', iconActive: 'calendar',       iconInactive: 'calendar-outline' },
  { name: 'profile',  label: 'Profile',  iconActive: 'person',         iconInactive: 'person-outline' },
] as const;

function TabIcon({ focused, label, iconActive, iconInactive }: {
  focused: boolean;
  label: string;
  iconActive: string;
  iconInactive: string;
}) {
  const theme = useTheme();
  const scale = useRef(new Animated.Value(focused ? 1 : 0.85)).current;
  const translateY = useRef(new Animated.Value(focused ? 0 : 4)).current;
  const opacity = useRef(new Animated.Value(focused ? 1 : 0.6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1 : 0.85,
        useNativeDriver: true,
        tension: 120,
        friction: 8,
      }),
      Animated.spring(translateY, {
        toValue: focused ? 0 : 4,
        useNativeDriver: true,
        tension: 120,
        friction: 8,
      }),
      Animated.timing(opacity, {
        toValue: focused ? 1 : 0.6,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  if (focused) {
    return (
      <Animated.View style={[
        styles.activeBubbleWrapper,
        { transform: [{ scale }, { translateY }] },
      ]}>
        <View style={[styles.activeBubble, {
          backgroundColor: theme.accent,
          shadowColor: theme.accent,
        }]}>
          <Ionicons name={iconActive as any} size={26} color={theme.bg} />
        </View>
        <Animated.Text style={[styles.activeLabel, { opacity, color: theme.accent }]}>
          {label.toUpperCase()}
        </Animated.Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[
      styles.inactiveWrapper,
      { opacity, transform: [{ scale }, { translateY }] },
    ]}>
      <Ionicons name={iconInactive as any} size={24} color={theme.subtext} />
    </Animated.View>
  );
}

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
          backgroundColor: theme.bg,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          height: TAB_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 0,
        },
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

      {/* Hidden tabs */}
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
    shadowOpacity: 0.45,
    shadowRadius: 14,
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
