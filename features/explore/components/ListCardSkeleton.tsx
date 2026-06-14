import React from 'react';
import { View } from 'react-native';

export default function ListCardSkeleton({ theme }: { theme: any }) {
  return (
    <View style={{
      flexDirection: 'row', backgroundColor: theme.card,
      borderRadius: 14, borderWidth: 1, borderColor: theme.border,
      overflow: 'hidden', marginBottom: 10, height: 130,
    }}>
      <View style={{ width: 100, backgroundColor: theme.border }} />
      <View style={{ flex: 1, padding: 10, gap: 8 }}>
        <View style={{ height: 10, width: '60%', backgroundColor: theme.border, borderRadius: 6 }} />
        <View style={{ height: 14, width: '90%', backgroundColor: theme.border, borderRadius: 6 }} />
        <View style={{ height: 14, width: '70%', backgroundColor: theme.border, borderRadius: 6 }} />
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {[40, 50, 35].map((w, i) => (
            <View key={i} style={{ height: 16, width: w, backgroundColor: theme.border, borderRadius: 5 }} />
          ))}
        </View>
        <View style={{ height: 10, width: '80%', backgroundColor: theme.border, borderRadius: 6 }} />
      </View>
    </View>
  );
}
