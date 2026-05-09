import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/constants';

const ACTIVE = COLORS.gold;
const INACTIVE = 'rgba(255,255,255,0.35)';
const BAR_BG = 'rgba(10,10,12,0.97)';
const LABEL_COLOR = COLORS.gold;
const TAB_HEIGHT = 64;
const BUBBLE_SIZE = 58;

// ─── Icons ────────────────────────────────────────────────────────────────────

function HomeIcon({ color }: { color: string }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 26, height: 26 }}>
      <View style={{ width: 0, height: 0, borderLeftWidth: 13, borderRightWidth: 13, borderBottomWidth: 11, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: color }} />
      <View style={{ width: 18, height: 13, backgroundColor: color, borderBottomLeftRadius: 2, borderBottomRightRadius: 2, alignItems: 'center', justifyContent: 'flex-end' }}>
        <View style={{ width: 6, height: 8, backgroundColor: BAR_BG, borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />
      </View>
    </View>
  );
}

function SearchIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 2.5, borderColor: color }} />
      <View style={{ position: 'absolute', bottom: 3, right: 3, width: 7, height: 2.5, backgroundColor: color, borderRadius: 2, transform: [{ rotate: '45deg' }] }} />
    </View>
  );
}

function PlayIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 0, height: 0, borderTopWidth: 5, borderBottomWidth: 5, borderLeftWidth: 8, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: color, marginLeft: 2 }} />
      </View>
    </View>
  );
}

function CalendarIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 20, height: 18, borderWidth: 2, borderColor: color, borderRadius: 3, overflow: 'hidden' }}>
        <View style={{ height: 6, backgroundColor: color }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: 2 }}>
          <View style={{ width: 2.5, height: 2.5, borderRadius: 1, backgroundColor: color }} />
          <View style={{ width: 2.5, height: 2.5, borderRadius: 1, backgroundColor: color }} />
          <View style={{ width: 2.5, height: 2.5, borderRadius: 1, backgroundColor: color }} />
        </View>
      </View>
      <View style={{ position: 'absolute', top: 0, left: 5, width: 2, height: 5, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ position: 'absolute', top: 0, right: 5, width: 2, height: 5, backgroundColor: color, borderRadius: 1 }} />
    </View>
  );
}

function HistoryIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ position: 'absolute', width: 2, height: 5, backgroundColor: color, borderRadius: 1, bottom: '50%', left: '50%', marginLeft: -1, transform: [{ rotate: '0deg' }] }} />
        <View style={{ position: 'absolute', width: 2, height: 4, backgroundColor: color, borderRadius: 1, bottom: '50%', left: '50%', marginLeft: -1, transform: [{ rotate: '90deg' }, { translateY: -2 }] }} />
      </View>
    </View>
  );
}

// ─── TabIcon dengan animasi ───────────────────────────────────────────────────

function TabIcon({ focused, label }: { focused: boolean; label: string }) {
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

  const iconColor = focused ? BAR_BG : INACTIVE;

  const Icon = () => {
    switch (label) {
      case 'Home':     return <HomeIcon color={iconColor} />;
      case 'Explore':  return <SearchIcon color={iconColor} />;
      case 'Ongoing':  return <PlayIcon color={iconColor} />;
      case 'Schedule': return <CalendarIcon color={iconColor} />;
      case 'History':  return <HistoryIcon color={iconColor} />;
      default:         return null;
    }
  };

  if (focused) {
    return (
      <Animated.View style={[
        styles.activeBubbleWrapper,
        { transform: [{ scale }, { translateY }] },
      ]}>
        <View style={styles.activeBubble}>
          <Icon />
        </View>
        <Animated.Text style={[styles.activeLabel, { opacity }]}>
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
      <Icon />
    </Animated.View>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: BAR_BG,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.06)',
          height: TAB_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 0,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
      }}
    >
      <Tabs.Screen name="index"    options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Home" /> }} />
      <Tabs.Screen name="explore"  options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Explore" /> }} />
      <Tabs.Screen name="ongoing"  options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Ongoing" /> }} />
      <Tabs.Screen name="schedule" options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Schedule" /> }} />
      <Tabs.Screen name="history"  options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="History" /> }} />
    </Tabs>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
    backgroundColor: ACTIVE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACTIVE,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
  },
  activeLabel: {
    color: LABEL_COLOR,
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
