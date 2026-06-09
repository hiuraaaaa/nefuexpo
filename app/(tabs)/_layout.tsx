import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
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

const TAB_HEIGHT = 68;

const TABS = [
  { name: 'index',    label: 'Home',     iconActive: 'home',      iconInactive: 'home-outline'      },
  { name: 'explore',  label: 'Explore',  iconActive: 'compass',   iconInactive: 'compass-outline'   },
  { name: 'news',     label: 'News',     iconActive: 'newspaper', iconInactive: 'newspaper-outline', badge: 'NEW' },
  { name: 'schedule', label: 'Schedule', iconActive: 'calendar',  iconInactive: 'calendar-outline'  },
  { name: 'profile',  label: 'Profile',  iconActive: 'person',    iconInactive: 'person-outline'    },
] as const;

// ── Tab Icon — Pill Design ────────────────────────────────────────────────────
function TabIcon({
  focused, label, iconActive, iconInactive, badge, accent, accentDim, subtext,
}: {
  focused: boolean; label: string;
  iconActive: string; iconInactive: string;
  badge?: string; accent: string; accentDim: string; subtext: string;
}) {
  // Pill background
  const pillWidth   = useSharedValue(focused ? 54 : 0);
  const pillOpacity = useSharedValue(focused ? 1 : 0);
  const pillScale   = useSharedValue(focused ? 1 : 0.7);

  // Icon
  const iconScale   = useSharedValue(focused ? 1.1 : 1);

  // Label
  const labelOpacity   = useSharedValue(focused ? 1 : 0);
  const labelTranslate = useSharedValue(focused ? 0 : 4);

  // Content translateY (slight lift when active)
  const contentY = useSharedValue(focused ? 0 : 2);

  useEffect(() => {
    const spring = { damping: 15, stiffness: 220 };

    pillWidth.value   = withSpring(focused ? 60 : 0,   spring);
    pillOpacity.value = withTiming(focused ? 1 : 0,    { duration: 200 });
    pillScale.value   = withSpring(focused ? 1 : 0.7,  spring);

    iconScale.value   = withSpring(focused ? 1.1 : 1,  spring);

    labelOpacity.value   = withTiming(focused ? 1 : 0,  { duration: 150 });
    labelTranslate.value = withSpring(focused ? 0 : 4,  spring);

    contentY.value = withSpring(focused ? 0 : 2, spring);
  }, [focused]);

  const pillStyle = useAnimatedStyle(() => ({
    width:   pillWidth.value,
    opacity: pillOpacity.value,
    transform: [{ scale: pillScale.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity:   labelOpacity.value,
    transform: [{ translateY: labelTranslate.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentY.value }],
  }));

  return (
    <View style={styles.tabItem}>
      {/* Pill background */}
      <Animated.View
        style={[
          styles.pill,
          { backgroundColor: accentDim },
          pillStyle,
        ]}
      />

      {/* Icon + Label stack */}
      <Animated.View style={[styles.iconLabelStack, contentStyle]}>
        <Animated.View style={iconStyle}>
          <View>
            <Ionicons
              name={(focused ? iconActive : iconInactive) as any}
              size={23}
              color={focused ? accent : subtext}
            />
            {badge && (
              <View style={[styles.badge, { backgroundColor: accent }]}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Label — hanya muncul saat aktif */}
        <Animated.Text
          style={[styles.label, { color: accent }, labelStyle]}
          numberOfLines={1}
        >
          {label.toUpperCase()}
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

// ── Floating Tab Bar Background ───────────────────────────────────────────────
function TabBarBackground() {
  const theme = useTheme();
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: theme.card,
          borderRadius: 30,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.35,
          shadowRadius: 16,
          borderWidth: 1,
          borderColor: theme.border,
          overflow: 'hidden',
        },
      ]}
    />
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const theme  = useTheme();

  const MARGIN_H      = 20;
  const MARGIN_BOTTOM = Math.max(insets.bottom, 12) + 4;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle:  { backgroundColor: theme.bg },
        animation:   'fade',
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth:  0,
          height:          TAB_HEIGHT,
          paddingBottom:   0,
          paddingTop:      0,
          position:        'absolute',
          left:            MARGIN_H,
          right:           MARGIN_H,
          bottom:          MARGIN_BOTTOM,
          borderRadius:    30,
          elevation:       0,
        },
        tabBarItemStyle: {
          height:          TAB_HEIGHT,
          paddingVertical: 0,
          paddingBottom:   0,
          paddingTop:      0,
          marginVertical:  0,
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
    height:         TAB_HEIGHT,
    width:          '100%',
    position:       'relative',
  },
  pill: {
    position:     'absolute',
    height:       38,
    borderRadius: 19,
    // width dihandle via Animated
  },
  iconLabelStack: {
    alignItems:     'center',
    justifyContent: 'center',
    gap:            3,
    zIndex:         1,
  },
  label: {
    fontSize:      8,
    fontWeight:    '900',
    letterSpacing: 0.5,
    lineHeight:    10,
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
