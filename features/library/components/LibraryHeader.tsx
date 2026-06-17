// features/library/components/LibraryHeader.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/theme';
import { LibraryTab } from '../hooks/useLibraryData';

interface Props {
  tab: LibraryTab;
  onChange: (tab: LibraryTab) => void;
  favoritCount: number;
  historyCount: number;
  onClearHistory?: () => void;
}

export function LibraryHeader({ tab, onChange, favoritCount, historyCount, onClearHistory }: Props) {
  const theme = useTheme();

  const TABS: { key: LibraryTab; label: string; icon: string; count: number }[] = [
    { key: 'favorit', label: 'Favorit', icon: 'bookmark', count: favoritCount },
    { key: 'history', label: 'Riwayat', icon: 'time',     count: historyCount },
  ];

  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14 }}>
      {/* Title row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <View>
          <Text style={{
            color: theme.subtext, fontSize: 10, fontWeight: '700',
            letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 2,
          }}>
            Koleksi
          </Text>
          <Text style={{ color: theme.text, fontWeight: '900', fontSize: 26, letterSpacing: -0.5 }}>
            {tab === 'favorit' ? 'Favorit' : 'Riwayat'}
          </Text>
        </View>

        {tab === 'history' && historyCount > 0 && onClearHistory && (
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onClearHistory(); }}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 5,
              backgroundColor: `${theme.accent}15`,
              borderWidth: 1, borderColor: `${theme.accent}30`,
              paddingHorizontal: 12, paddingVertical: 7,
              borderRadius: 12,
            }}
          >
            <Ionicons name="trash-outline" size={12} color={theme.accent} />
            <Text style={{ color: theme.accent, fontSize: 11, fontWeight: '800' }}>Hapus</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tab pill switcher */}
      <View style={{
        flexDirection: 'row',
        backgroundColor: `${theme.accent}10`,
        borderRadius: 16,
        padding: 4,
        gap: 4,
      }}>
        {TABS.map(t => {
          const active = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => { Haptics.selectionAsync(); onChange(t.key); }}
              activeOpacity={0.8}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 11,
                borderRadius: 13,
                backgroundColor: active ? theme.accent : 'transparent',
              }}
            >
              <Ionicons
                name={(active ? t.icon : `${t.icon}-outline`) as any}
                size={14}
                color={active ? theme.bg : theme.subtext}
              />
              <Text style={{ color: active ? theme.bg : theme.subtext, fontSize: 13, fontWeight: '800' }}>
                {t.label}
              </Text>
              {t.count > 0 && (
                <View style={{
                  minWidth: 19, height: 19, borderRadius: 10,
                  alignItems: 'center', justifyContent: 'center',
                  paddingHorizontal: 4,
                  backgroundColor: active ? `${theme.bg}30` : `${theme.accent}25`,
                }}>
                  <Text style={{ color: active ? theme.bg : theme.accent, fontSize: 9, fontWeight: '900' }}>
                    {t.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

