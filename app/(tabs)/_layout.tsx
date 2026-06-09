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

const TAB_HEIGHT = 64;

const TABS = [
  { name: 'index',    label: 'Home',     iconActive: 'home',      iconInactive: 'home-outline'      },
  { name: 'explore',  label: 'Explore',  iconActive: 'compass',   iconInactive: 'compass-outline'   },
  { name: 'news',     label: 'News',     iconActive: 'newspaper', iconInactive: 'newspaper-outline', badge: 'NEW' },
  { name: 'schedule', label: 'Schedule', iconActive: 'calendar',  iconInactive: 'calendar-outline'  },
  { name: 'profile',  label: 'Profile',  iconActive: 'person',    iconInactive: 'person-outline'    },
] as const;

// ── Tab Icon ───────────────────────────────────────────────────────────────────
function TabIcon({
  focused, label, iconActive, iconInactive, badge, accent, subtext,
}: {
  focused: boolean; label: string;
  iconActive: string; iconInactive: string;
  badge?: string; accent: string; subtext: string;
}) {
  const iconScale  = useSharedValue(focused ? 1.1 : 1);
  const labelOpacity = useSharedValue(focused ? 1 : 0);
  const translateY = useSharedValue(focused ? 0 : 4);

  useEffect(() => {
    iconScale.value    = withSpring(focused ? 1.1 : 1,  { damping: 15, stiffness: 200 });
    labelOpacity.value = withTiming(focused ? 1 : 0,    { duration: 150 });
    translateY.value   = withSpring(focused ? 0 : 4,    { damping: 15, stiffness: 200 });
  }, [focused]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity:   labelOpacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={styles.tabItem}>
      <Animated.View style={iconStyle}>
        <View>
          <Ionicons
            name={(focused ? iconActive : iconInactive) as any}
            size={24}
            color={focused ? accent : subtext}
          />
          {badge && (
            <View style={[styles.badge, { backgroundColor: accent }]}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
      </Animated.View>

      {/* Label muncul di bawah icon saat aktif */}
      <Animated.Text
        style={[styles.label, { color: accent }, labelStyle]}
        numberOfLines={1}
      >
        {label.toUpperCase()}
      </Animated.Text>
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
          // Shadow Android
          elevation: 20,
          // Shadow iOS
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.35,
          shadowRadius: 16,
          // Border tipis
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

  const MARGIN_H      = 20;  // margin kiri kanan tab bar
  const MARGIN_BOTTOM = Math.max(insets.bottom, 12) + 4; // jarak dari bawah layar

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
          // Floating: margin kiri kanan + jarak dari bawah
          left:            MARGIN_H,
          right:           MARGIN_H,
          bottom:          MARGIN_BOTTOM,
          borderRadius:    30,
          elevation:       0, // handled di background
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
    width:          56,
    gap:            3,
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
    borderRadius:      5,
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
