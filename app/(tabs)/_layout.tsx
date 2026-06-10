// app/(tabs)/_layout.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Floating Bottom Navigation — style Fukunime
//
// Perubahan dari versi sebelumnya:
//   • Label SELALU visible di semua tab (tidak fade in/out)
//   • Tinggi tab bar lebih besar (64px) — lebih lega
//   • Margin floating lebih kecil (12px) — tab bar lebih lebar
//   • Ikon lebih besar (24px)
//   • Label font lebih besar dan readable (10px)
//   • Aktif: ikon filled + label bold + warna accent
//   • Tidak aktif: ikon outline + label normal + warna subtext
//   • Animasi: scale ikon saja — simpel & clean seperti Fukunime
// ─────────────────────────────────────────────────────────────────────────────

import React, { memo, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

import { useTheme } from '@/hooks/theme';
import { type Theme } from '@/constants';
import { TABS, TAB_BAR, type TabConfig } from '@/constants/tabConfig';

// ── Konstanta Layout ──────────────────────────────────────────────────────────
const FLOAT_MARGIN  = 16;   // jarak dari tepi layar — seperti Fukunime
const TAB_HEIGHT    = 62;
const BORDER_RADIUS = 20;
const ICON_SIZE     = 23;

// ─────────────────────────────────────────────────────────────────────────────
// TabBarBackground — Glassmorphism background
// ─────────────────────────────────────────────────────────────────────────────

interface TabBarBgProps { cardColor: string; borderColor: string; }

const TabBarBackground = memo<TabBarBgProps>(({ cardColor, borderColor }) => (
  <View style={[StyleSheet.absoluteFill, { borderRadius: BORDER_RADIUS, overflow: 'hidden' }]}>
    {Platform.OS === 'ios' && (
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
    )}
    <View style={[
      StyleSheet.absoluteFill,
      {
        backgroundColor: Platform.OS === 'ios' ? cardColor + 'd0' : cardColor + 'f5',
        borderRadius:    BORDER_RADIUS,
        borderWidth:     1,
        borderColor,
      }
    ]} />
  </View>
));
TabBarBackground.displayName = 'TabBarBackground';

// ─────────────────────────────────────────────────────────────────────────────
// TabIcon — Satu item tab
// Label SELALU visible, animasi hanya pada skala ikon
// ─────────────────────────────────────────────────────────────────────────────

interface TabIconProps extends Pick<TabConfig, 'label' | 'iconActive' | 'iconInactive' | 'badge'> {
  focused:   boolean;
  accent:    string;
  accentDim: string;
  subtext:   string;
}

const TabIcon = memo<TabIconProps>(({
  focused, label, iconActive, iconInactive, badge, accent, accentDim, subtext,
}) => {
  // Animasi scale ikon — bounce saat diaktifkan
  const scale    = useSharedValue(focused ? 1.15 : 1);
  // Animasi warna label via opacity dua layer (active/inactive overlay)
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    scale.value    = withSpring(focused ? 1.15 : 1, { damping: 12, stiffness: 180 });
    progress.value = withTiming(focused ? 1 : 0, { duration: 180 });
  }, [focused]);

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Pill indicator di bawah ikon (subtle dot / underline effect)
  const pillStyle = useAnimatedStyle(() => ({
    opacity:   interpolate(progress.value, [0, 1], [0, 1]),
    transform: [{ scaleX: interpolate(progress.value, [0, 1], [0.3, 1]) }],
  }));

  const iconColor  = focused ? accent : subtext;
  const labelColor = focused ? accent : subtext;
  const labelWeight = focused ? '700' : '500';

  return (
    <View style={styles.tabItem}>
      {/* Ikon dengan animasi scale */}
      <Animated.View style={iconAnimStyle}>
        <View>
          <Ionicons
            name={(focused ? iconActive : iconInactive) as any}
            size={ICON_SIZE}
            color={iconColor}
            accessibilityLabel={label}
          />
          {/* Badge (misalnya "NEW") */}
          {badge != null && (
            <View style={[styles.badge, { backgroundColor: accent }]}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
      </Animated.View>

      {/* Label — SELALU visible, hanya warna & weight yang berubah */}
      <Text
        style={[styles.label, { color: labelColor, fontWeight: labelWeight }]}
        numberOfLines={1}
      >
        {label}
      </Text>

      {/* Pill indicator bawah ikon saat aktif */}
      <Animated.View style={[styles.activePill, { backgroundColor: accent }, pillStyle]} />
    </View>
  );
});
TabIcon.displayName = 'TabIcon';

// ─────────────────────────────────────────────────────────────────────────────
// TabLayout
// ─────────────────────────────────────────────────────────────────────────────

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
          height:          TAB_HEIGHT,
          paddingBottom:   0,
          paddingTop:      0,
          backgroundColor: 'transparent',
          borderTopWidth:  0,
          elevation:       0,
          borderRadius:    BORDER_RADIUS,
          shadowColor:     '#000',
          shadowOffset:    { width: 0, height: 6 },
          shadowOpacity:   0.3,
          shadowRadius:    16,
        },

        tabBarItemStyle: {
          height:        TAB_HEIGHT,
          padding:       0,
          margin:        0,
          flex:          1,
        },

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
                label={tab.label}
                iconActive={tab.iconActive}
                iconInactive={tab.iconInactive}
                badge={tab.badge}
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

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabItem: {
    alignItems:     'center',
    justifyContent: 'center',
    width:          '100%',
    height:         TAB_HEIGHT,
    gap:            3,
    // Tidak ada paddingTop/Bottom — biarkan justifyContent center yang bekerja
  },
  label: {
    fontSize:      10,
    letterSpacing: 0.2,
    lineHeight:    13,
  },
  // Pill kecil di bawah label sebagai active indicator
  activePill: {
    position:     'absolute',
    bottom:       4,
    width:        20,
    height:       3,
    borderRadius: 2,
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
