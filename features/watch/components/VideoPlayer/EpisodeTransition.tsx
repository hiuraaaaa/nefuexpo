import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Dimensions, Image } from 'react-native';
import { LOGO_URL } from '@/constants';

const { width, height } = Dimensions.get('window');

interface Props {
  visible: boolean;
}

export function EpisodeTransition({ visible }: Props) {
  const opacity     = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale   = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (visible) {
      // Flash hitam dulu
      Animated.timing(opacity, {
        toValue: 1, duration: 150, useNativeDriver: true,
      }).start(() => {
        // Logo fade in + scale up
        Animated.parallel([
          Animated.timing(logoOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.spring(logoScale, { toValue: 1, tension: 120, friction: 8, useNativeDriver: true }),
        ]).start();
      });
    } else {
      // Fade out semua sekaligus
      Animated.parallel([
        Animated.timing(opacity,     { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start(() => {
        logoScale.setValue(0.85);
      });
    }
  }, [visible]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: '#000',
        opacity,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99,
      }}
    >
      <Animated.View style={{
        alignItems: 'center', gap: 12,
        opacity: logoOpacity,
        transform: [{ scale: logoScale }],
      }}>
        <Image
          source={{ uri: LOGO_URL }}
          style={{ width: 48, height: 48, borderRadius: 12 }}
          resizeMode="contain"
        />
        <Text style={{
          color: 'rgba(255,255,255,0.35)',
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
        }}>
          Memuat episode...
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

