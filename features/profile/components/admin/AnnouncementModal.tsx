// AnnouncementModal.tsx
//
// Signature: type selector is four text-chips of deliberately unequal size —
// weighted by real-world urgency (Maintenance biggest/reddest, Info smallest/
// quietest) instead of four identical icon tiles. List/create toggle reuses
// the underline word-tab language. List rows are left-bordered by type color
// at a width matching urgency, not a uniform colored left-strip.
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Modal, TouchableOpacity, Switch, TextInput, Alert, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import firestore from '@react-native-firebase/firestore';
import { useTheme } from '@/hooks/theme';

const TYPES = [
  { id: 'maintenance', label: 'Maintenance', color: '#e15c5c', weight: 17, edge: 4 },
  { id: 'warning',     label: 'Warning',     color: '#e0a93f', weight: 15, edge: 3 },
  { id: 'promo',       label: 'Promo',       color: '#3fae6a', weight: 14, edge: 2 },
  { id: 'info',        label: 'Info',        color: '#4a9eff', weight: 13, edge: 2 },
];

export function AnnouncementModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const theme = useTheme();

  const [title, setTitle]       = useState('');
  const [body, setBody]         = useState('');
  const [type, setType]         = useState('info');
  const [isActive, setIsActive] = useState(true);
  const [ctaText, setCtaText]   = useState('');
  const [ctaUrl, setCtaUrl]     = useState('');
  const [saving, setSaving]     = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [tab, setTab]           = useState<'list' | 'create'>('list');

  const loadAnnouncements = useCallback(async () => {
    const snap = await firestore().collection('announcements').orderBy('createdAt', 'desc').limit(10).get();
    setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, []);

  useEffect(() => { if (visible) loadAnnouncements(); }, [visible]);

  const handleSave = async () => {
    if (!title || !body) { Alert.alert('Error', 'Judul dan pesan wajib diisi'); return; }
    setSaving(true);
    try {
      await firestore().collection('announcements').add({
        title, body, type, isActive,
        ctaText: ctaText || null,
        ctaUrl:  ctaUrl  || null,
        createdAt: Date.now(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTitle(''); setBody(''); setCtaText(''); setCtaUrl('');
      setType('info'); setIsActive(true);
      await loadAnnouncements();
      setTab('list');
    } catch {
      Alert.alert('Error', 'Gagal menyimpan announcement');
    }
    setSaving(false);
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await firestore().collection('announcements').doc(id).update({ isActive: !current });
      await loadAnnouncements();
      Haptics.selectionAsync();
    } catch {}
  };

  const handleDelete = (id: string) => {
    Alert.alert('Hapus', 'Yakin mau hapus announcement ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => {
        await firestore().collection('announcements').doc(id).delete();
        await loadAnnouncements();
      }},
    ]);
  };

  const selectedType = TYPES.find(t => t.id === type)!;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>

        {/* Header */}
        <View style={{ paddingHorizontal: 22, paddingTop: 6, paddingBottom: 18 }}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8 }} style={{ marginBottom: 14 }}>
            <Text style={{ color: theme.subtext, fontSize: 13, fontWeight: '700' }}>‹ Kembali</Text>
          </TouchableOpacity>

          <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '700', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>
            Sistem
          </Text>
          <Text style={{ color: theme.text, fontWeight: '900', fontSize: 24, letterSpacing: -0.6 }}>
            Announcement
          </Text>

          {/* List / Buat underline word-tabs */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 16, marginTop: 18 }}>
            <TouchableOpacity onPress={() => setTab('list')} activeOpacity={0.7}>
              <Text style={{ color: tab === 'list' ? theme.text : theme.subtext, fontWeight: '900', fontSize: tab === 'list' ? 17 : 13 }}>
                Riwayat
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setTab('create')} activeOpacity={0.7}>
              <Text style={{ color: tab === 'create' ? theme.text : theme.subtext, fontWeight: '900', fontSize: tab === 'create' ? 17 : 13 }}>
                Buat baru
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{
            height: 2, width: tab === 'list' ? 52 : 70,
            backgroundColor: theme.accent, borderRadius: 1,
            marginLeft: tab === 'create' ? 68 : 0, marginTop: 6,
          }} />
        </View>

        {/* List */}
        {tab === 'list' ? (
          <FlatList
            data={announcements}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 48 }}
            ListEmptyComponent={
              <Text style={{ color: theme.subtext, fontSize: 13, paddingVertical: 30 }}>
                Belum ada announcement
              </Text>
            }
            renderItem={({ item, index }) => {
              const t = TYPES.find(x => x.id === item.type) ?? TYPES[3];
              return (
                <View style={{
                  paddingVertical: 13,
                  borderTopWidth: index === 0 ? 1 : 0,
                  borderBottomWidth: 1,
                  borderColor: `${theme.accent}12`,
                  borderLeftWidth: t.edge,
                  borderLeftColor: t.color,
                  paddingLeft: 12,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                    <Text style={{ color: t.color, fontSize: 10.5, fontWeight: '900', textTransform: 'uppercase' }}>{t.label}</Text>
                    <Text style={{ color: item.isActive ? '#3fae6a' : theme.subtext, fontSize: 10, fontWeight: '700' }}>
                      {item.isActive ? 'aktif' : 'nonaktif'}
                    </Text>
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity onPress={() => handleToggle(item.id, item.isActive)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                      <Text style={{ color: theme.accent, fontSize: 11, fontWeight: '700' }}>
                        {item.isActive ? 'pause' : 'aktifkan'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} style={{ marginLeft: 14 }}>
                      <Text style={{ color: '#e15c5c', fontSize: 11, fontWeight: '700' }}>hapus</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={{ color: theme.text, fontWeight: '800', fontSize: 13.5 }}>{item.title}</Text>
                  <Text style={{ color: theme.subtext, fontSize: 11.5, marginTop: 2, lineHeight: 16 }} numberOfLines={2}>{item.body}</Text>
                </View>
              );
            }}
          />
        ) : (
          <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 60 }}>

            {/* Type chips — unequal size by urgency, wrap naturally instead of a 4-grid */}
            <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>
              Tipe
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 24, alignItems: 'baseline' }}>
              {TYPES.map(t => (
                <TouchableOpacity key={t.id} onPress={() => { Haptics.selectionAsync(); setType(t.id); }} activeOpacity={0.7}>
                  <Text style={{
                    color: type === t.id ? t.color : theme.subtext,
                    fontWeight: '900',
                    fontSize: type === t.id ? t.weight + 3 : t.weight - 2,
                  }}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
              Judul
            </Text>
            <TextInput
              value={title} onChangeText={setTitle}
              placeholder="Judul announcement…" placeholderTextColor={theme.subtext}
              style={{
                color: theme.text, fontSize: 15, fontWeight: '700',
                borderBottomWidth: 1.5, borderBottomColor: `${theme.accent}30`,
                paddingVertical: 9, marginBottom: 22,
              }}
            />

            <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
              Pesan
            </Text>
            <TextInput
              value={body} onChangeText={setBody}
              placeholder="Isi pesan…" placeholderTextColor={theme.subtext}
              multiline numberOfLines={4}
              style={{
                color: theme.text, fontSize: 13,
                borderBottomWidth: 1.5, borderBottomColor: `${theme.accent}30`,
                paddingVertical: 9, marginBottom: 22, minHeight: 80, textAlignVertical: 'top',
              }}
            />

            <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
              Tombol CTA (opsional)
            </Text>
            <TextInput
              value={ctaText} onChangeText={setCtaText}
              placeholder="Teks tombol" placeholderTextColor={theme.subtext}
              style={{
                color: theme.text, fontSize: 13,
                borderBottomWidth: 1.5, borderBottomColor: `${theme.accent}30`,
                paddingVertical: 9, marginBottom: 14,
              }}
            />
            <TextInput
              value={ctaUrl} onChangeText={setCtaUrl}
              placeholder="URL tujuan" placeholderTextColor={theme.subtext}
              autoCapitalize="none"
              style={{
                color: theme.text, fontSize: 13,
                borderBottomWidth: 1.5, borderBottomColor: `${theme.accent}30`,
                paddingVertical: 9, marginBottom: 22,
              }}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <View>
                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13.5 }}>Langsung aktif</Text>
                <Text style={{ color: theme.subtext, fontSize: 11, marginTop: 1 }}>Tampilkan ke user sekarang</Text>
              </View>
              <Switch
                value={isActive} onValueChange={setIsActive}
                trackColor={{ false: `${theme.accent}25`, true: theme.accent }}
                thumbColor={theme.bg}
              />
            </View>

            <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.7}>
              <Text style={{ color: selectedType.color, fontWeight: '900', fontSize: 18 }}>
                {saving ? 'Menyimpan…' : 'Kirim announcement →'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}
