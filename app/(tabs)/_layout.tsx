import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/constants';

// ─── Icon Components ───────────────────────────────────────────────────────────

function HomeIcon({ color }: { color: string }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 22, height: 22 }}>
      {/* Roof */}
      <View style={{ width: 0, height: 0, borderLeftWidth: 11, borderRightWidth: 11, borderBottomWidth: 9, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: color }} />
      {/* Body */}
      <View style={{ width: 16, height: 11, backgroundColor: color, borderBottomLeftRadius: 2, borderBottomRightRadius: 2, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 0 }}>
        {/* Door */}
        <View style={{ width: 5, height: 7, backgroundColor: color === COLORS.gold ? '#0a0a0c' : '#0a0a0c', borderTopLeftRadius: 2, borderTopRightRadius: 2, marginBottom: 0 }} />
      </View>
    </View>
  );
}

function SearchIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 13, height: 13, borderRadius: 7, borderWidth: 2.5, borderColor: color }} />
      <View style={{
        position: 'absolute', bottom: 2, right: 2,
        width: 7, height: 2.5, backgroundColor: color,
        borderRadius: 2, transform: [{ rotate: '45deg' }],
      }} />
    </View>
  );
}

function PlayIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 0, height: 0, borderTopWidth: 5, borderBottomWidth: 5, borderLeftWidth: 8, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: color, marginLeft: 2 }} />
      </View>
    </View>
  );
}

function CalendarIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 18, height: 16, borderWidth: 2, borderColor: color, borderRadius: 3, overflow: 'hidden' }}>
        {/* Header */}
        <View style={{ height: 5, backgroundColor: color }} />
        {/* Grid dots */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: 2 }}>
          <View style={{ width: 2.5, height: 2.5, borderRadius: 1, backgroundColor: color }} />
          <View style={{ width: 2.5, height: 2.5, borderRadius: 1, backgroundColor: color }} />
          <View style={{ width: 2.5, height: 2.5, borderRadius: 1, backgroundColor: color }} />
        </View>
      </View>
      {/* Hooks */}
      <View style={{ position: 'absolute', top: 0, left: 4, width: 2, height: 5, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ position: 'absolute', top: 0, right: 4, width: 2, height: 5, backgroundColor: color, borderRadius: 1 }} />
    </View>
  );
}

function HistoryIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
        {/* Clock hands */}
        <View style={{ position: 'absolute', width: 2, height: 5, backgroundColor: color, borderRadius: 1, bottom: '50%', left: '50%', marginLeft: -1, transformOrigin: 'bottom', transform: [{ rotate: '0deg' }] }} />
        <View style={{ position: 'absolute', width: 2, height: 4, backgroundColor: color, borderRadius: 1, bottom: '50%', left: '50%', marginLeft: -1, transform: [{ rotate: '90deg' }, { translateY: -2 }] }} />
      </View>
    </View>
  );
}

// ─── Tab Icon Wrapper ──────────────────────────────────────────────────────────

function TabIcon({ focused, label }: { focused: boolean; label: string }) {
  const color = focused ? COLORS.gold : 'rgba(255,255,255,0.35)';

  const Icon = () => {
    switch (label) {
      case 'Home':     return <HomeIcon color={color} />;
      case 'Explore':  return <SearchIcon color={color} />;
      case 'Ongoing':  return <PlayIcon color={color} />;
      case 'Schedule': return <CalendarIcon color={color} />;
      case 'History':  return <HistoryIcon color={color} />;
      default:         return null;
    }
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', gap: 4 }}>
      <View style={{
        padding: 6, borderRadius: 12,
        backgroundColor: focused ? `${COLORS.gold}18` : 'transparent',
      }}>
        <Icon />
      </View>
      {focused && (
        <Text style={{ color: COLORS.gold, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 }}>
          {label.toUpperCase()}
        </Text>
      )}
    </View>
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
          backgroundColor: 'rgba(10,10,12,0.92)',
          borderTopColor: 'rgba(255,255,255,0.06)',
          borderTopWidth: 1,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 10,
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 10,
          borderRadius: 28,
          shadowColor: '#000',
          shadowOpacity: 0.4,
          shadowRadius: 24,
          elevation: 24,
        },
        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.3)',
        tabBarShowLabel: false,
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
