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

const TABS = [
  { name: 'index',    label: 'Home',     iconActive: 'home',      iconInactive: 'home-outline'      },
  { name: 'explore',  label: 'Explore',  iconActive: 'compass',   iconInactive: 'compass-outline'   },
  { name: 'news',     label: 'News',     iconActive: 'newspaper', iconInactive: 'newspaper-outline', badge: 'NEW' },
  { name: 'schedule', label: 'Schedule', iconActive: 'calendar',  iconInactive: 'calendar-outline'  },
  { name: 'profile',  label: 'Profile',  iconActive: 'person',    iconInactive: 'person-outline'    },
] as const;

// ── Tab Icon ──────────────────────────────────────────────────────────────────
function TabIcon({
  focused, label, iconActive, iconInactive, badge, accent, accentDim, subtext,
}: {
  focused: boolean; label: string;
  iconActive: string; iconInactive: string;
  badge?: string; accent: string; accentDim: string; subtext: string;
}) {
  const iconScale      = useSharedValue(focused ? 1.08 : 1);
  const labelOpacity   = useSharedValue(focused ? 1 : 0);
  const labelTranslate = useSharedValue(focused ? 0 : 3);
  const pillOpacity    = useSharedValue(focused ? 1 : 0);
  const pillScale      = useSharedValue(focused ? 1 : 0.6);

  useEffect(() => {
    const sp = { damping: 14, stiffness: 200 };
    iconScale.value      = withSpring(focused ? 1.08 : 1, sp);
    labelOpacity.value   = withTiming(focused ? 1 : 0, { duration: 160 });
    labelTranslate.value = withSpring(focused ? 0 : 3, sp);
    pillOpacity.value    = withTiming(focused ? 1 : 0, { duration: 180 });
    pillScale.value      = withSpring(focused ? 1 : 0.6, sp);
  }, [focused]);

  const iconStyle  = useAnimatedStyle(() => ({ transform: [{ scale: iconScale.value }] }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    transform: [{ translateY: labelTranslate.value }],
  }));
  const pillStyle  = useAnimatedStyle(() => ({
    opacity: pillOpacity.value,
    transform: [{ scale: pillScale.value }],
  }));

  return (
    <View style={styles.tabItem}>
      {/* Pill glow behind icon */}
      <Animated.View style={[styles.pill, { backgroundColor: accentDim }, pillStyle]} />

      {/* Icon */}
      <Animated.View style={iconStyle}>
        <View>
          <Ionicons
            name={(focused ? iconActive : iconInactive) as any}
            size={22}
            color={focused ? accent : subtext}
          />
          {badge && (
            <View style={[styles.badge, { backgroundColor: accent }]}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
      </Animated.View>

      {/* Label — always rendered, opacity animates */}
      <Animated.Text style={[styles.label, { color: accent }, labelStyle]} numberOfLines={1}>
        {label.toUpperCase()}
      </Animated.Text>
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
          backgroundColor: theme.card,
          borderTopLeftRadius:  20,
          borderTopRightRadius: 20,
          borderTopWidth: 1,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: theme.border,
          // Shadow iOS
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          // Shadow Android
          elevation: 24,
        },
      ]}
    />
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const theme  = useTheme();

  // Tab bar nempel bawah, tinggi = 58px + safe area bottom
  const TAB_BAR_HEIGHT = 58 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle:  { backgroundColor: theme.bg },
        animation:   'fade',
        tabBarStyle: {
          position:        'absolute',
          bottom:          0,
          left:            0,
          right:           0,
          height:          TAB_BAR_HEIGHT,
          paddingBottom:   insets.bottom,
          paddingTop:      0,
          backgroundColor: 'transparent',
          borderTopWidth:  0,
          elevation:       0,
        },
        tabBarItemStyle: {
          height:          58,
          paddingVertical: 0,
          paddingTop:      0,
          paddingBottom:   0,
          marginTop:       0,
        },
        tabBarBackground:        () => <TabBarBackground />,
        tabBarShowLabel:         false,
        tabBarActiveTintColor:   theme.accent,
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
                accent={theme.accent}
                accentDim={theme.accentDim}
                subtext={theme.subtext}
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
    alignItems:     'center',
    justifyContent: 'center',
    width:          '100%',
    height:         58,
    gap:            4,
    position:       'relative',
  },
  pill: {
    position:     'absolute',
    width:        48,
    height:       48,
    borderRadius: 14,
  },
  label: {
    fontSize:      9,
    fontWeight:    '800',
    letterSpacing: 0.4,
    lineHeight:    11,
  },
  badge: {
    position:          'absolute',
    top:               -4,
    right:             -10,
    borderRadius:      4,
    paddingHorizontal: 3,
    paddingVertical:   1,
  },
  badgeText: {
    fontSize:      6,
    fontWeight:    '900',
    color:         '#000',
    letterSpacing: 0.3,
  },
});
