import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  theme: any;
}

export default function LoadMoreFooter({ loading, hasMore, onLoadMore, theme }: Props) {
  if (!hasMore) return (
    <View style={{ paddingVertical: 32, alignItems: 'center' }}>
      <Text style={{ color: theme.subtext, fontSize: 11, fontWeight: '600' }}>
        Semua anime sudah ditampilkan
      </Text>
    </View>
  );

  return (
    <TouchableOpacity
      onPress={onLoadMore}
      disabled={loading}
      style={{
        marginVertical: 16, paddingVertical: 14, borderRadius: 12,
        backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border,
        alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
      }}
    >
      {loading
        ? <ActivityIndicator size="small" color={theme.accent} />
        : <>
            <Ionicons name="add-circle-outline" size={18} color={theme.accent} />
            <Text style={{ color: theme.accent, fontWeight: '800', fontSize: 13 }}>Muat Lebih Banyak</Text>
          </>
      }
    </TouchableOpacity>
  );
}
