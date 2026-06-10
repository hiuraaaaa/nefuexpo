// hooks/useTabAnimation.ts
// ─────────────────────────────────────────────────────────────────────────────
// Custom hook yang mengisolasi semua logika animasi tab dari komponen visual.
// Prinsip: komponen UI hanya "mengonsumsi" animated styles, tidak tahu
// cara animasi dibuat — ini adalah Clean Architecture untuk animasi.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SPRING_CONFIG, TIMING_CONFIG } from '@/constants/tabConfig';

export interface TabAnimatedStyles {
  iconStyle:  ReturnType<typeof useAnimatedStyle>;
  labelStyle: ReturnType<typeof useAnimatedStyle>;
  pillStyle:  ReturnType<typeof useAnimatedStyle>;
}

/**
 * Mengelola semua shared values dan animated styles untuk satu tab item.
 *
 * @param focused - Apakah tab ini sedang aktif/focused
 * @returns Object berisi tiga animated style siap pakai
 */
export function useTabAnimation(focused: boolean): TabAnimatedStyles {
  // ── Shared Values ────────────────────────────────────────────────────────
  // Inisialisasi sesuai state awal agar tidak ada "flash" saat pertama render
  const iconScale      = useSharedValue(focused ? 1.1 : 1);
  const labelOpacity   = useSharedValue(focused ? 1 : 0);
  const labelTranslate = useSharedValue(focused ? 0 : 4);
  const pillOpacity    = useSharedValue(focused ? 1 : 0);
  const pillScale      = useSharedValue(focused ? 1 : 0.5);

  // ── Efek Animasi ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (focused) {
      // === TAB DIAKTIFKAN ===
      iconScale.value      = withSpring(1.1, SPRING_CONFIG.ICON);
      labelOpacity.value   = withTiming(1,   { duration: TIMING_CONFIG.LABEL_OPACITY });
      labelTranslate.value = withSpring(0,   SPRING_CONFIG.LABEL);
      pillOpacity.value    = withTiming(1,   { duration: TIMING_CONFIG.PILL_OPACITY });
      pillScale.value      = withSpring(1,   SPRING_CONFIG.ICON);
    } else {
      // === TAB DINONAKTIFKAN ===
      iconScale.value      = withSpring(1,   SPRING_CONFIG.ICON);
      labelOpacity.value   = withTiming(0,   { duration: TIMING_CONFIG.LABEL_OPACITY });
      labelTranslate.value = withSpring(4,   SPRING_CONFIG.LABEL);
      pillOpacity.value    = withTiming(0,   { duration: TIMING_CONFIG.PILL_OPACITY });
      pillScale.value      = withSpring(0.5, SPRING_CONFIG.ICON);
    }
  }, [focused]);

  // ── Animated Styles ──────────────────────────────────────────────────────
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity:   labelOpacity.value,
    transform: [{ translateY: labelTranslate.value }],
  }));

  const pillStyle = useAnimatedStyle(() => ({
    opacity:   pillOpacity.value,
    transform: [{ scale: pillScale.value }],
  }));

  return { iconStyle, labelStyle, pillStyle };
}

