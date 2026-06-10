// app/(tabs)/_layout.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Production-ready Floating Bottom Navigation untuk Expo Router.
//
// Arsitektur:
//   TabBarBackground  → Visual-only: glassmorphism blur + border
//   TabIcon           → Visual-only: mengonsumsi animasi dari useTabAnimation
//   TabLayout         → Root: merakit semua komponen + konfigurasi Expo Router
//
// Semua logika animasi ada di hooks/useTabAnimation.ts
// Semua konstanta ada di constants/tabConfig.ts
// Semua token warna ada di hooks/theme.ts
// ─────────────────────────────────────────────────────────────────────────────

import React, { memo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

// ✅ Gunakan useTheme dari hooks Anda yang sudah ada (AsyncStorage + global listener)
// Tipe Theme dari @/constants sudah punya semua field yang dibutuhkan tab bar
import { useTheme } from '@/hooks/theme';
import { type Theme } from '@/constants';
import { useTabAnimation } from '@/hooks/useTabAnimation';
import { TABS, TAB_BAR, type TabConfig } from '@/constants/tabConfig';

// ─────────────────────────────────────────────────────────────────────────────
// TabBarBackground
// Komponen murni visual — tidak memiliki state apapun.
// Menggunakan BlurView untuk efek glassmorphism + overlay warna dinamis.
// ─────────────────────────────────────────────────────────────────────────────

interface TabBarBackgroundProps {
  cardColor: string;
  borderColor: string;
}

const TabBarBackground = memo<TabBarBackgroundProps>(({ cardColor, borderColor }) => (
  <View style={[StyleSheet.absoluteFill, styles.tabBarBg]}>
    {/*
      BlurView hanya dirender di iOS karena di Android hasilnya tidak konsisten.
      Di Android kita gantiakan dengan overlay semi-transparan yang cukup.
    */}
    {Platform.OS === 'ios' ? (
      <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill} />
    ) : null}

    {/* Overlay warna + border — dirender di atas blur */}
    <View
      style={[
        StyleSheet.absoluteFill,
        styles.tabBarOverlay,
        {
          // Di Android, opacity lebih tinggi karena tidak ada blur di bawahnya
          backgroundColor: Platform.OS === 'ios' ? cardColor + 'cc' : cardColor + 'f0',
          borderColor,
        },
      ]}
    />
  </View>
));

TabBarBackground.displayName = 'TabBarBackground';

// ─────────────────────────────────────────────────────────────────────────────
// TabIcon
// Komponen visual untuk satu item tab.
// Menerima semua data sebagai props — tidak tahu tentang navigasi.
// Animasi didelegasikan ke useTabAnimation hook.
// ─────────────────────────────────────────────────────────────────────────────

interface TabIconProps
  extends Pick<TabConfig, 'label' | 'iconActive' | 'iconInactive' | 'badge'> {
  focused:   boolean;
  accent:    string;
  accentDim: string;
  subtext:   string;
}

const TabIcon = memo<TabIconProps>(({
  focused,
  label,
  iconActive,
  iconInactive,
  badge,
  accent,
  accentDim,
  subtext,
}) => {
  // Semua logika animasi ada di hook — komponen ini hanya render
  const { iconStyle, labelStyle, pillStyle } = useTabAnimation(focused);

  return (
    <View style={styles.tabItem}>
      {/* Pill highlight di belakang ikon */}
      <Animated.View
        style={[
          styles.pill,
          { backgroundColor: accentDim },
          pillStyle,
        ]}
      />

      {/* Ikon dengan animasi scale */}
      <Animated.View style={iconStyle}>
        <View>
          <Ionicons
            name={(focused ? iconActive : iconInactive) as any}
            size={22}
            color={focused ? accent : subtext}
            // accessibilityLabel untuk screen reader
            accessibilityLabel={label}
          />

          {/* Badge opsional — misalnya "NEW" atau angka notifikasi */}
          {badge != null && (
            <View
              style={[styles.badge, { backgroundColor: accent }]}
              accessibilityLabel={`${label}, ${badge}`}
            >
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
      </Animated.View>

      {/* Label — hanya muncul (fade in) saat tab aktif */}
      <Animated.Text
        style={[styles.label, { color: accent }, labelStyle]}
        numberOfLines={1}
        accessibilityElementsHidden={!focused} // sembunyikan dari a11y saat tidak aktif
      >
        {label.toUpperCase()}
      </Animated.Text>
    </View>
  );
});

TabIcon.displayName = 'TabIcon';

// ─────────────────────────────────────────────────────────────────────────────
// buildTabBarBackground
// Factory function untuk prop tabBarBackground — menggunakan closure
// agar tidak membuat komponen baru setiap render TabLayout.
// ─────────────────────────────────────────────────────────────────────────────

function buildTabBarBackground(theme: Theme) {
  return () => (
    <TabBarBackground cardColor={theme.card} borderColor={theme.border} />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TabLayout (Root Export)
// Merakit semua komponen dan mengkonfigurasi Expo Router Tabs.
// ─────────────────────────────────────────────────────────────────────────────

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const theme  = useTheme();

  // Pastikan bottom padding setidaknya 8px walau di perangkat tanpa notch
  const bottomPad = Math.max(insets.bottom, 8);

  // Kalkulasi posisi bottom tab bar:
  // posisi dari bawah = safe area bottom + margin melayang
  const tabBarBottom = bottomPad + TAB_BAR.FLOAT_MARGIN;

  // Memoize tab bar background factory agar tidak re-create saat re-render
  // (tema berubah akan tetap trigger re-render yang benar karena closure)
  const tabBarBackground = React.useMemo(
    () => buildTabBarBackground(theme),
    [theme.card, theme.border],
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        // Warna background scene — sesuai tema
        sceneStyle: { backgroundColor: theme.bg },

        // Animasi transisi antar halaman
        animation: 'fade',

        // ── Posisi & Ukuran Tab Bar ──────────────────────────────────────
        tabBarStyle: {
          position:        'absolute',
          bottom:          tabBarBottom,
          left:            TAB_BAR.FLOAT_MARGIN,
          right:           TAB_BAR.FLOAT_MARGIN,
          height:          TAB_BAR.HEIGHT,
          // Reset padding default React Navigation
          paddingBottom:   0,
          paddingTop:      0,
          // Transparan agar TabBarBackground yang handle visual
          backgroundColor: 'transparent',
          borderTopWidth:  0,
          elevation:       0,
          borderRadius:    TAB_BAR.BORDER_RADIUS,
          // Shadow untuk iOS
          shadowColor:     '#000',
          shadowOffset:    { width: 0, height: 8 },
          shadowOpacity:   0.35,
          shadowRadius:    20,
        },

        // ── Per-Item Style ───────────────────────────────────────────────
        tabBarItemStyle: {
          height:          TAB_BAR.HEIGHT,
          paddingVertical: 0,
          paddingTop:      0,
          paddingBottom:   0,
          marginTop:       0,
          flex:            1,
        },

        // Render background glassmorphism
        tabBarBackground,

        // Sembunyikan label default React Navigation — kita render sendiri
        tabBarShowLabel: false,

        // Warna tint (meski label kita custom, ini tetap dibutuhkan RN Navigation)
        tabBarActiveTintColor:   theme.accent,
        tabBarInactiveTintColor: theme.subtext,
      }}
    >
      {/* Render semua tab dari konfigurasi */}
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            // tabBarIcon menerima focused dari React Navigation
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

      {/*
        Route tersembunyi — tidak ditampilkan di tab bar.
        Tetap terdaftar agar navigasi programatik ke route ini tidak error.
      */}
      <Tabs.Screen name="ongoing" options={{ href: null }} />
      <Tabs.Screen name="history" options={{ href: null }} />
    </Tabs>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── TabBarBackground ──────────────────────────────────────────────────────
  tabBarBg: {
    borderRadius: TAB_BAR.BORDER_RADIUS,
    overflow:     'hidden',
  },
  tabBarOverlay: {
    borderRadius: TAB_BAR.BORDER_RADIUS,
    borderWidth:  1,
    // inset agar tidak overlap dengan blur layer
    ...StyleSheet.absoluteFillObject,
  },

  // ── TabIcon ───────────────────────────────────────────────────────────────
  tabItem: {
    alignItems:     'center',
    justifyContent: 'center',
    width:          '100%',
    height:         TAB_BAR.HEIGHT,
    gap:            3,
    // paddingTop sedikit mendorong konten ke tengah vertikal
    paddingTop:     12,
  },
  pill: {
    position:     'absolute',
    width:        TAB_BAR.PILL_WIDTH,
    height:       TAB_BAR.PILL_HEIGHT,
    borderRadius: TAB_BAR.PILL_RADIUS,
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
