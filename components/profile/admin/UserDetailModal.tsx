import React, { useState, useEffect } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView,
  TextInput, Alert, FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import firestore from '@react-native-firebase/firestore';
import { useTheme } from '@/hooks/theme';
import { LEVELS } from '@/hooks/xp';
import { HistoryItem, Anime } from '@/types';

interface Props {
  visible:      boolean;
  user:         any;
  onClose:      () => void;
  onXPUpdated:  (uid: string, xp: number, level: number) => void;
}

type Tab = 'info' | 'history' | 'favorit';

export function UserDetailModal({ visible, user, onClose, onXPUpdated }: Props) {
  const theme = useTheme();

  const [tab, setTab]           = useState<Tab>('info');
  const [xpInput, setXpInput]   = useState('');
  const [saving, setSaving]     = useState(false);
  const [history, setHistory]   = useState<HistoryItem[]>([]);
  const [favorit, setFavorit]   = useState<Anime[]>([]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!visible || !user) return;
    setXpInput(String(user.xp ?? 0));
    setTab('info');
    loadUserData();
  }, [visible, user?.id]);

  const loadUserData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const snap = await firestore().collection('users').doc(user.id).get();
      const data = snap.data();
      setHistory(Array.isArray(data?.history)   ? data.history  : []);
      setFavorit(Array.isArray(data?.favorites) ? data.favorites : []);
    } catch {}
    setLoading(false);
  };

  const handleSetXP = async () => {
    if (!user || !xpInput) return;
    const newXp = parseInt(xpInput);
    if (isNaN(newXp)) return;
    setSaving(true);
    try {
      let newLevel = 1;
      for (const l of LEVELS) { if (newXp >= l.min) newLevel = l.level; }
      await firestore().collection('users').doc(user.id).update({ xp: newXp, level: newLevel });
      onXPUpdated(user.id, newXp, newLevel);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Berhasil', `XP ${user.displayName} diubah ke ${newXp}`);
      onClose();
    } catch {
      Alert.alert('Error', 'Gagal update XP');
    }
    setSaving(false);
  };

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (!user) return null;

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'info',    label: 'Info',    icon: 'person-outline'   },
    { key: 'history', label: 'History', icon: 'time-outline'     },
    { key: 'favorit', label: 'Favorit', icon: 'bookmark-outline' },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <BlurView intensity={30} tint="dark" style={{ flex: 1, justifyContent: 'flex-end' }}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={{
          backgroundColor: theme.card,
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          maxHeight: '85%',
          borderWidth: 1, borderColor: theme.border,
        }}>
          {/* Handle */}
          <View style={{ width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 16 }} />

          {/* User header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, marginBottom: 16 }}>
            <Image
              source={{ uri: user.photoURL ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName ?? 'User')}` }}
              style={{ width: 46, height: 46, borderRadius: 23 }}
            />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: theme.text, fontWeight: '800', fontSize: 15 }} numberOfLines={1}>{user.displayName}</Text>
                {user.isAdmin && (
                  <View style={{ backgroundColor: theme.accent, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ color: theme.bg, fontSize: 8, fontWeight: '900' }}>ADMIN</Text>
                  </View>
                )}
              </View>
              <Text style={{ color: theme.subtext, fontSize: 11, marginTop: 2 }}>{user.email}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: theme.accent, fontWeight: '900', fontSize: 14 }}>Lv {user.level ?? 1}</Text>
              <Text style={{ color: theme.subtext, fontSize: 10, marginTop: 2 }}>{user.xp ?? 0} XP</Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16 }}>
            {TABS.map(t => (
              <TouchableOpacity
                key={t.key}
                onPress={() => { Haptics.selectionAsync(); setTab(t.key); }}
                style={{
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  gap: 4, paddingVertical: 8, borderRadius: 10,
                  backgroundColor: tab === t.key ? theme.accent : theme.bg,
                  borderWidth: 1, borderColor: tab === t.key ? theme.accent : theme.border,
                }}
              >
                <Ionicons name={t.icon as any} size={13} color={tab === t.key ? theme.bg : theme.subtext} />
                <Text style={{ color: tab === t.key ? theme.bg : theme.subtext, fontSize: 11, fontWeight: '800' }}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab Content */}
          {tab === 'info' && (
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 12 }}>
              {/* Stats */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {[
                  { label: 'History', value: history.length },
                  { label: 'Favorit', value: favorit.length },
                  { label: 'Streak', value: `${user.streak ?? 0}🔥` },
                ].map((s, i) => (
                  <View key={i} style={{ flex: 1, backgroundColor: theme.bg, borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
                    <Text style={{ color: theme.accent, fontSize: 18, fontWeight: '900' }}>{s.value}</Text>
                    <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '700', marginTop: 2 }}>{s.label}</Text>
                  </View>
                ))}
              </View>

              {/* Last login */}
              {user.lastLoginAt && (
                <View style={{ backgroundColor: theme.bg, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: theme.border }}>
                  <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Terakhir Login</Text>
                  <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }}>{formatDate(user.lastLoginAt)}</Text>
                </View>
              )}

              {/* Set XP */}
              <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>Set XP</Text>
              <TextInput
                value={xpInput} onChangeText={setXpInput} keyboardType="numeric"
                placeholder="Masukkan jumlah XP" placeholderTextColor={theme.subtext}
                style={{ backgroundColor: theme.bg, color: theme.text, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, borderWidth: 1, borderColor: theme.border }}
              />
              <Text style={{ color: theme.subtext, fontSize: 10, lineHeight: 16 }}>
                {LEVELS.map(l => `Lv${l.level}: ${l.min} XP`).join('  ·  ')}
              </Text>
              <TouchableOpacity
                onPress={handleSetXP} disabled={saving}
                style={{ backgroundColor: theme.accent, paddingVertical: 14, borderRadius: 10, alignItems: 'center' }}
              >
                <Text style={{ color: theme.bg, fontWeight: '900', fontSize: 14 }}>
                  {saving ? 'Menyimpan...' : 'Simpan XP'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {tab === 'history' && (
            <FlatList
              data={history}
              keyExtractor={(_, i) => String(i)}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 8 }}
              ListEmptyComponent={
                loading ? (
                  <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                    <Text style={{ color: theme.subtext, fontWeight: '600' }}>Memuat...</Text>
                  </View>
                ) : (
                  <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                    <Ionicons name="time-outline" size={36} color={theme.subtext} />
                    <Text style={{ color: theme.subtext, marginTop: 10, fontWeight: '600' }}>Belum ada history</Text>
                  </View>
                )
              }
              renderItem={({ item, index }) => (
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  backgroundColor: theme.bg, borderRadius: 12, padding: 12,
                  borderWidth: 1, borderColor: theme.border,
                }}>
                  <Text style={{ color: theme.subtext, fontSize: 11, fontWeight: '700', width: 20, textAlign: 'center' }}>{index + 1}</Text>
                  <Image
                    source={{ uri: item.anime?.image_poster }}
                    style={{ width: 36, aspectRatio: 3 / 4.5, borderRadius: 6 }}
                    contentFit="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontSize: 12, fontWeight: '600' }} numberOfLines={1}>{item.anime?.title}</Text>
                    <Text style={{ color: theme.subtext, fontSize: 10, marginTop: 2 }}>
                      Episode {item.episodeIndex}
                      {item.timestamp ? `  ·  ${formatDate(item.timestamp)}` : ''}
                    </Text>
                  </View>
                </View>
              )}
            />
          )}

          {tab === 'favorit' && (
            <FlatList
              data={favorit}
              keyExtractor={(_, i) => String(i)}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 8 }}
              ListEmptyComponent={
                loading ? (
                  <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                    <Text style={{ color: theme.subtext, fontWeight: '600' }}>Memuat...</Text>
                  </View>
                ) : (
                  <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                    <Ionicons name="bookmark-outline" size={36} color={theme.subtext} />
                    <Text style={{ color: theme.subtext, marginTop: 10, fontWeight: '600' }}>Belum ada favorit</Text>
                  </View>
                )
              }
              renderItem={({ item }) => (
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  backgroundColor: theme.bg, borderRadius: 12, padding: 12,
                  borderWidth: 1, borderColor: theme.border,
                }}>
                  <Image
                    source={{ uri: item.image_poster }}
                    style={{ width: 36, aspectRatio: 3 / 4.5, borderRadius: 6 }}
                    contentFit="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontSize: 12, fontWeight: '600' }} numberOfLines={1}>{item.title}</Text>
                    <Text style={{ color: theme.subtext, fontSize: 10, marginTop: 2 }}>{item.type} • {item.status}</Text>
                  </View>
                  <Ionicons name="bookmark" size={14} color={theme.accent} />
                </View>
              )}
            />
          )}
        </View>
      </BlurView>
    </Modal>
  );
}
