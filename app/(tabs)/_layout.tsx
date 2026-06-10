// app/(tabs)/_layout.tsx
import React, { memo, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Home, Compass, Newspaper, Calendar, User, type LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/hooks/theme';

const FLOAT_MARGIN  = 16;
const TAB_HEIGHT    = 62;
const BORDER_RADIUS = 36;
const ICON_SIZE     = 24;

type TabName = 'index' | 'explore' | 'news' | 'schedule' | 'profile';
interface TabConfig { name: TabName; label: string; Icon: LucideIcon; badge?: string; }

const TABS: readonly TabConfig[] = [
  { name: 'index',    label: 'Home',     Icon: Home      },
  { name: 'explore',  label: 'Explore',  Icon: Compass   },
  { name: 'news',     label: 'News',     Icon: Newspaper, badge: 'NEW' },
  { name: 'schedule', label: 'Schedule', Icon: Calendar  },
  { name: 'profile',  label: 'Profile',  Icon: User      },
] as const;

// ── Background ────────────────────────────────────────────────────────────────
const TabBarBackground = memo<{ cardColor: string; borderColor: string }>(
  ({ cardColor, borderColor }) => (
    <View style={[StyleSheet.absoluteFill, { borderRadius: BORDER_RADIUS, overflow: 'hidden' }]}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
      ) : (
        <>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: 0.3 }]} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: cardColor, opacity: 0.55 }]} />
        </>
      )}
      <View style={[
        StyleSheet.absoluteFill,
        { borderRadius: BORDER_RADIUS, borderWidth: 0.8, borderColor, backgroundColor: 'rgba(255,255,255,0.03)' },
      ]} />
    </View>
  )
);
TabBarBackground.displayName = 'TabBarBackground';

// ── Tab Icon — icon only, no label, no underline ──────────────────────────────
const TabIcon = memo<{
  focused: boolean; Icon: LucideIcon; badge?: string;
  accent: string; subtext: string;
}>(({ focused, Icon, badge, accent, subtext }) => {
  const scale = useSharedValue(focused ? 1.15 : 1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.15 : 1, { damping: 12, stiffness: 180 });
  }, [focused]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={styles.tabItem}>
      <Animated.View style={animStyle}>
        <View>
          <Icon
            size={ICON_SIZE}
            color={focused ? accent : subtext}
            strokeWidth={focused ? 2.2 : 1.8}
            fill={focused ? accent + '28' : 'transparent'}
          />
          {badge != null && (
            <View style={[styles.badge, { backgroundColor: accent }]}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
});
TabIcon.displayName = 'TabIcon';

// ── Layout ────────────────────────────────────────────────────────────────────
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const theme  = useTheme();

  const bottomPad = Math.max(insets.bottom, 8);

  const tabBarBackground = React.useMemo(
    () => () => <TabBarBackground cardColor={theme.card} borderColor={theme.border} />,
    [theme.card, theme.border],
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle:  { backgroundColor: theme.bg },
        animation:   'fade',
        tabBarStyle: {
          position:        'absolute',
          bottom:          bottomPad + FLOAT_MARGIN,
          left:            FLOAT_MARGIN,
          right:           FLOAT_MARGIN,
          width:           undefined,
          height:          TAB_HEIGHT,
          paddingBottom:   0,
          paddingTop:      0,
          paddingLeft:     0,
          paddingRight:    0,
          marginLeft:      0,
          marginRight:     0,
          backgroundColor: 'transparent',
          borderTopWidth:  0,
          elevation:       0,
          borderRadius:    BORDER_RADIUS,
          shadowColor:     '#000',
          shadowOffset:    { width: 0, height: 8 },
          shadowOpacity:   0.4,
          shadowRadius:    20,
        },
        tabBarItemStyle: { height: TAB_HEIGHT, padding: 0, margin: 0, flex: 1 },
        tabBarBackground,
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
                Icon={tab.Icon}
                badge={tab.badge}
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
    width:          '100%',
    height:         TAB_HEIGHT,
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
