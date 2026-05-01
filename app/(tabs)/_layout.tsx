import { Tabs } from 'expo-router';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/constants';

function TabIcon({ focused, label }: { focused: boolean; label: string }) {
  const icons: Record<string, string> = {
    'Home': '🏠', 'Explore': '🔍', 'Ongoing': '▶️', 'Schedule': '📅', 'History': '🕐',
  };
  return (
    <View className="items-center">
      <View className={`p-1.5 rounded-full ${focused ? 'bg-gold/20' : ''}`}>
        <Text style={{ fontSize: 18 }}>{icons[label]}</Text>
      </View>
      {focused && <Text style={{ color: COLORS.gold, fontSize: 9, fontWeight: '900', marginTop: 2 }}>{label}</Text>}
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(0,0,0,0.85)',
          borderTopColor: 'rgba(255,255,255,0.05)',
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 8,
          borderRadius: 30,
          shadowColor: '#000',
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 20,
        },
        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.3)',
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen name="index" options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Home" /> }} />
      <Tabs.Screen name="explore" options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Explore" /> }} />
      <Tabs.Screen name="ongoing" options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Ongoing" /> }} />
      <Tabs.Screen name="schedule" options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Schedule" /> }} />
      <Tabs.Screen name="history" options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="History" /> }} />
    </Tabs>
  );
}
