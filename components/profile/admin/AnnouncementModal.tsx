import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Modal, TouchableOpacity, Switch, TextInput, Alert, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import firestore from '@react-native-firebase/firestore';
import { useTheme } from '@/hooks/theme';

const TYPES = [
  { id: 'info',        label: 'Info',        color: '#4a9eff' },
  { id: 'warning',     label: 'Warning',     color: '#F6CF80' },
  { id: 'promo',       label: 'Promo',       color: '#2ecc71' },
  { id: 'maintenance', label: 'Maintenance', color: '#e63946' },
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
  const [tab, setTab]           = useState<'create' | 'list'>('list');

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
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
          <TouchableOpacity onPress={onClose} style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.card }}>
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </TouchableOpacity>
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: '900', flex: 1 }}>Announcement</Text>
          <TouchableOpacity
            onPress={() => setTab(tab === 'list' ? 'create' : 'list')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.accent, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 }}
          >
            <Ionicons name={tab === 'list' ? 'add' : 'list'} size={14} color={theme.bg} />
            <Text style={{ color: theme.bg, fontSize: 12, fontWeight: '900' }}>{tab === 'list' ? 'Buat' : 'List'}</Text>
          </TouchableOpacity>
        </View>

        {tab === 'list' ? (
          <FlatList
            data={announcements}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: 40 }}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <Ionicons name="megaphone-outline" size={40} color={theme.subtext} />
                <Text style={{ color: theme.subtext, marginTop: 12, fontWeight: '600' }}>Belum ada announcement</Text>
              </View>
            }
            renderItem={({ item }) => {
              const t = TYPES.find(x => x.id === item.type) ?? TYPES[0];
              return (
                <View style={{ backgroundColor: theme.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: theme.border, borderLeftWidth: 3, borderLeftColor: t.color }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <View style={{ backgroundColor: `${t.color}20`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                      <Text style={{ color: t.color, fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>{t.label}</Text>
                    </View>
                    <Text style={{ color: item.isActive ? '#2ecc71' : theme.subtext, fontSize: 9, fontWeight: '700' }}>
                      {item.isActive ? '● Aktif' : '○ Nonaktif'}
                    </Text>
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity onPress={() => handleToggle(item.id, item.isActive)} style={{ padding: 4 }}>
                      <Ionicons name={item.isActive ? 'pause-circle-outline' : 'play-circle-outline'} size={18} color={theme.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 4 }}>
                      <Ionicons name="trash-outline" size={18} color="#e63946" />
                    </TouchableOpacity>
                  </View>
                  <Text style={{ color: theme.text, fontWeight: '800', fontSize: 13, marginBottom: 4 }}>{item.title}</Text>
                  <Text style={{ color: theme.subtext, fontSize: 11, lineHeight: 16 }} numberOfLines={2}>{item.body}</Text>
                </View>
              );
            }}
          />
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 60 }}>
            <View>
              <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Tipe</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {TYPES.map(t => (
                  <TouchableOpacity key={t.id} onPress={() => { Haptics.selectionAsync(); setType(t.id); }}
                    style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: type === t.id ? `${t.color}20` : theme.card, borderWidth: 1, borderColor: type === t.id ? t.color : theme.border }}>
                    <Text style={{ color: type === t.id ? t.color : theme.subtext, fontSize: 10, fontWeight: '800' }}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Judul</Text>
              <TextInput value={title} onChangeText={setTitle} placeholder="Judul announcement..." placeholderTextColor={theme.subtext}
                style={{ backgroundColor: theme.card, color: theme.text, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, borderWidth: 1, borderColor: theme.border }} />
            </View>

            <View>
              <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Pesan</Text>
              <TextInput value={body} onChangeText={setBody} placeholder="Isi pesan..." placeholderTextColor={theme.subtext}
                multiline numberOfLines={4}
                style={{ backgroundColor: theme.card, color: theme.text, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, borderWidth: 1, borderColor: theme.border, textAlignVertical: 'top', minHeight: 100 }} />
            </View>

            <View>
              <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Tombol CTA (Opsional)</Text>
              <TextInput value={ctaText} onChangeText={setCtaText} placeholder="Teks tombol, misal: Update Sekarang" placeholderTextColor={theme.subtext}
                style={{ backgroundColor: theme.card, color: theme.text, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, borderWidth: 1, borderColor: theme.border, marginBottom: 8 }} />
              <TextInput value={ctaUrl} onChangeText={setCtaUrl} placeholder="URL tujuan, misal: https://..." placeholderTextColor={theme.subtext}
                autoCapitalize="none"
                style={{ backgroundColor: theme.card, color: theme.text, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, borderWidth: 1, borderColor: theme.border }} />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: theme.border }}>
              <View>
                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>Langsung Aktif</Text>
                <Text style={{ color: theme.subtext, fontSize: 10, marginTop: 2 }}>Tampilkan ke user sekarang</Text>
              </View>
              <Switch value={isActive} onValueChange={setIsActive} trackColor={{ false: theme.border, true: theme.accent }} thumbColor={isActive ? theme.bg : theme.subtext} />
            </View>

            <TouchableOpacity onPress={handleSave} disabled={saving}
              style={{ backgroundColor: selectedType.color, paddingVertical: 14, borderRadius: 10, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>{saving ? 'Menyimpan...' : 'Kirim Announcement'}</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}
