// UserDetailModal.tsx
//
// Signature: tabs reuse the underline-word pattern from the Library screen
// (three words side by side, active one bigger, underline keyed to word
// length) instead of three equal pill tabs. Mini stats are a sentence, not
// boxed tiles. History/Favorit rows reuse the directory-list language —
// hairline divider, no per-row card.
import React, { useState, useEffect } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView,
  TextInput, Alert, FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import firestore from '@react-native-firebase/firestore';
import { useTheme } from '@/hooks/theme';
import { LEVELS, clampXP, MAX_XP } from '@/hooks/xp';
import { HistoryItem, Anime } from '@/types';

interface Props {
  visible:     boolean;
  user:        any;
  onClose:     () => void;
  onXPUpdated: (uid: string, xp: number, level: number) => void;
}

type Tab = 'info' | 'history' | 'favorit';
const TAB_ORDER: Tab[] = ['info', 'history', 'favorit'];
const TAB_LABEL: Record<Tab, string> = { info: 'Info', history: 'Riwayat', favorit: 'Favorit' };

export function UserDetailModal({ visible, user, onClose, onXPUpdated }: Props) {
  const theme = useTheme();

  const [tab, setTab]         = useState<Tab>('info');
  const [xpInput, setXpInput] = useState('');
  const [saving, setSaving]   = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [favorit, setFavorit] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);

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
      setHistory(Array.isArray(data?.history)   ? data.history   : []);
      setFavorit(Array.isArray(data?.favorites) ? data.favorites : []);
    } catch {}
    setLoading(false);
  };

  const handleSetXP = async () => {
    if (!user || !xpInput) return;
    const parsed = parseInt(xpInput, 10);
    if (isNaN(parsed)) {
      Alert.alert('Error', 'Masukkan angka XP yang valid');
      return;
    }

    const newXp = clampXP(parsed);
    const wasClamped = newXp !== parsed;

    setSaving(true);
    try {
      let newLevel = 1;
      for (const l of LEVELS) { if (newXp >= l.min) newLevel = l.level; }
      await firestore().collection('users').doc(user.id).update({ xp: newXp, level: newLevel });
      onXPUpdated(user.id, newXp, newLevel);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Berhasil',
        wasClamped
          ? `XP ${user.displayName} disesuaikan ke ${newXp.toLocaleString('id-ID')} (maksimum ${MAX_XP.toLocaleString('id-ID')})`
          : `XP ${user.displayName} diubah ke ${newXp.toLocaleString('id-ID')}`
      );
      onClose();
    } catch {
      Alert.alert('Error', 'Gagal update XP');
    }
    setSaving(false);
  };

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (!user) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <BlurView intensity={30} tint="dark" style={{ flex: 1, justifyContent: 'flex-end' }}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={{
          backgroundColor: theme.bg,
          borderTopLeftRadius: 22, borderTopRightRadius: 22,
          maxHeight: '88%',
          paddingTop: 10,
        }}>
          {/* Handle */}
          <View style={{
            width: 32, height: 4, backgroundColor: `${theme.accent}30`,
            borderRadius: 2, alignSelf: 'center', marginBottom: 18,
          }} />

          {/* User header — small avatar offset right, name as headline, level as subtitle */}
          <View style={{ paddingHorizontal: 22, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
            <View style={{ flex: 1, paddingRight: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <Text style={{ color: theme.text, fontWeight: '900', fontSize: 21, letterSpacing: -0.5 }} numberOfLines={1}>
                  {user.displayName}
                </Text>
                {user.isAdmin && (
                  <Text style={{ color: theme.accent, fontSize: 10, fontWeight: '900', fontStyle: 'italic' }}>admin</Text>
                )}
              </View>
              <Text style={{ color: theme.subtext, fontSize: 11.5, marginTop: 2 }} numberOfLines={1}>
                {user.email}
              </Text>
              <Text style={{ color: theme.subtext, fontSize: 12, marginTop: 8 }}>
                Level <Text style={{ color: theme.accent, fontWeight: '800' }}>{user.level ?? 1}</Text>
                {'  ·  '}
                {(user.xp ?? 0).toLocaleString('id-ID')} xp
                {'  ·  '}
                {history.length} riwayat
                {'  ·  '}
                {favorit.length} favorit
              </Text>
            </View>

            <View style={{ width: 46, height: 46 }}>
              <Image
                source={{ uri: user.photoURL ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName ?? 'User')}` }}
                style={{ width: 46, height: 46, borderRadius: 7 }}
              />
            </View>
          </View>

          {/* Underline word-tabs, same language as the Library screen */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 16, paddingHorizontal: 22, marginBottom: 8 }}>
            {TAB_ORDER.map(t => {
              const active = tab === t;
              return (
                <TouchableOpacity key={t} onPress={() => { Haptics.selectionAsync(); setTab(t); }} activeOpacity={0.7}>
                  <Text style={{
                    color: active ? theme.text : theme.subtext,
                    fontWeight: '900',
                    fontSize: active ? 17 : 13,
                    marginBottom: active ? 0 : 2,
                  }}>
                    {TAB_LABEL[t]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={{
            height: 2,
            width: tab === 'info' ? 34 : tab === 'history' ? 50 : 48,
            backgroundColor: theme.accent,
            borderRadius: 1,
            marginLeft: 22 + (tab === 'history' ? 70 : tab === 'favorit' ? 134 : 0),
            marginBottom: 14,
          }} />

          {/* ── Info tab ── */}
          {tab === 'info' && (
            <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 40 }}>
              {user.lastLoginAt && (
                <Text style={{ color: theme.subtext, fontSize: 12, marginBottom: 18 }}>
                  Terakhir login {formatDate(user.lastLoginAt)}
                </Text>
              )}

              <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
                Ubah XP
              </Text>
              <TextInput
                value={xpInput}
                onChangeText={setXpInput}
                keyboardType="numeric"
                placeholder="Jumlah XP"
                placeholderTextColor={theme.subtext}
                maxLength={String(MAX_XP).length}
                style={{
                  color: theme.text, fontSize: 16, fontWeight: '700',
                  borderBottomWidth: 1.5, borderBottomColor: `${theme.accent}40`,
                  paddingVertical: 8, marginBottom: 8,
                }}
              />
              <Text style={{ color: theme.subtext, fontSize: 10, lineHeight: 15, marginBottom: 4 }}>
                {LEVELS.map(l => `Lv${l.level} ${l.min.toLocaleString('id-ID')}`).join('   ')}
              </Text>
              <Text style={{ color: `${theme.accent}90`, fontSize: 10, fontWeight: '700', marginBottom: 20 }}>
                Maksimum {MAX_XP.toLocaleString('id-ID')} XP
              </Text>

              <TouchableOpacity onPress={handleSetXP} disabled={saving} activeOpacity={0.7}>
                <Text style={{ color: theme.accent, fontWeight: '900', fontSize: 15 }}>
                  {saving ? 'Menyimpan…' : 'Simpan XP →'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* ── History tab ── */}
          {tab === 'history' && (
            <FlatList
              data={history}
              keyExtractor={(_, i) => String(i)}
              contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 40 }}
              ListEmptyComponent={
                <Text style={{ color: theme.subtext, fontSize: 13, paddingVertical: 30 }}>
                  {loading ? 'Memuat…' : 'Belum ada riwayat'}
                </Text>
              }
              renderItem={({ item, index }) => (
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  paddingVertical: 10,
                  borderTopWidth: index === 0 ? 1 : 0,
                  borderBottomWidth: 1,
                  borderColor: `${theme.accent}12`,
                }}>
                  <Text style={{ color: `${theme.accent}70`, fontSize: 11, fontWeight: '900', width: 16 }}>{index + 1}</Text>
                  <Image source={{ uri: item.anime?.image_poster }} style={{ width: 32, aspectRatio: 2 / 3, borderRadius: 5 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontSize: 12.5, fontWeight: '600' }} numberOfLines={1}>{item.anime?.title}</Text>
                    <Text style={{ color: theme.subtext, fontSize: 10.5, marginTop: 2 }}>
                      Eps {item.episodeIndex}{item.timestamp ? `  ·  ${formatDate(item.timestamp)}` : ''}
                    </Text>
                  </View>
                </View>
              )}
            />
          )}

          {/* ── Favorit tab ── */}
          {tab === 'favorit' && (
            <FlatList
              data={favorit}
              keyExtractor={(_, i) => String(i)}
              contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 40 }}
              ListEmptyComponent={
                <Text style={{ color: theme.subtext, fontSize: 13, paddingVertical: 30 }}>
                  {loading ? 'Memuat…' : 'Belum ada favorit'}
                </Text>
              }
              renderItem={({ item, index }) => (
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  paddingVertical: 10,
                  borderTopWidth: index === 0 ? 1 : 0,
                  borderBottomWidth: 1,
                  borderColor: `${theme.accent}12`,
                }}>
                  <Image source={{ uri: item.image_poster }} style={{ width: 32, aspectRatio: 2 / 3, borderRadius: 5 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontSize: 12.5, fontWeight: '600' }} numberOfLines={1}>{item.title}</Text>
                    <Text style={{ color: theme.subtext, fontSize: 10.5, marginTop: 2 }}>{item.type} · {item.status}</Text>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </BlurView>
    </Modal>
  );
}
