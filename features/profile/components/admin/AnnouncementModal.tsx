// AnnouncementModal.tsx — Glassmorphism
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Modal, TouchableOpacity, Switch, TextInput, Alert, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import firestore from '@react-native-firebase/firestore';
import { useTheme } from '@/hooks/theme';

const TYPES = [
  { id: 'info',        label: 'Info',        color: '#4a9eff', icon: 'information-circle-outline' },
  { id: 'warning',     label: 'Warning',     color: '#F6CF80', icon: 'warning-outline' },
  { id: 'promo',       label: 'Promo',       color: '#2ecc71', icon: 'gift-outline' },
  { id: 'maintenance', label: 'Maintenance', color: '#e63946', icon: 'construct-outline' },
];

export function AnnouncementModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const theme = useTheme();

  const [title, setTitle]     = useState('');
  const [body, setBody]       = useState('');
  const [type, setType]       = useState('info');
  const [isActive, setIsActive] = useState(true);
  const [ctaText, setCtaText] = useState('');
  const [ctaUrl, setCtaUrl]   = useState('');
  const [saving, setSaving]   = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [tab, setTab]         = useState<'list' | 'create'>('list');

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
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 36, height: 36, borderRadius: 11,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: theme.card,
                borderWidth: 1, borderColor: `${theme.accent}20`,
              }}
            >
              <Ionicons name="arrow-back" size={18} color={theme.text} />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.subtext, fontSize: 9, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' }}>Sistem</Text>
              <Text style={{ color: theme.text, fontSize: 18, fontWeight: '900', letterSpacing: -0.3 }}>Announcement</Text>
            </View>

            <TouchableOpacity
              onPress={() => setTab(tab === 'list' ? 'create' : 'list')}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 5,
                backgroundColor: theme.accent,
                paddingHorizontal: 12, paddingVertical: 8,
                borderRadius: 10,
                shadowColor: theme.accent, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
              }}
            >
              <Ionicons name={tab === 'list' ? 'add' : 'list'} size={14} color={theme.bg} />
              <Text style={{ color: theme.bg, fontSize: 11, fontWeight: '900' }}>{tab === 'list' ? 'Buat' : 'List'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* List */}
        {tab === 'list' ? (
          <FlatList
            data={announcements}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: 48 }}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingVertical: 64 }}>
                <View style={{
                  width: 64, height: 64, borderRadius: 20,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: `${theme.accent}12`,
                  borderWidth: 1, borderColor: `${theme.accent}20`,
                  marginBottom: 12,
                }}>
                  <Ionicons name="megaphone-outline" size={28} color={`${theme.accent}60`} />
                </View>
                <Text style={{ color: theme.subtext, fontWeight: '600', fontSize: 13 }}>Belum ada announcement</Text>
              </View>
            }
            renderItem={({ item }) => {
              const t = TYPES.find(x => x.id === item.type) ?? TYPES[0];
              return (
                <View style={{
                  backgroundColor: theme.card, borderRadius: 16, padding: 14,
                  borderWidth: 1, borderColor: `${t.color}25`,
                  borderLeftWidth: 3, borderLeftColor: t.color,
                  overflow: 'hidden',
                }}>
                  <LinearGradient
                    colors={[`${t.color}08`, 'transparent']}
                    style={{ position: 'absolute', inset: 0 }}
                    pointerEvents="none"
                  />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <View style={{ backgroundColor: `${t.color}18`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: `${t.color}30` }}>
                      <Text style={{ color: t.color, fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>{t.label}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: item.isActive ? '#2ecc71' : theme.subtext }} />
                      <Text style={{ color: item.isActive ? '#2ecc71' : theme.subtext, fontSize: 9, fontWeight: '700' }}>
                        {item.isActive ? 'Aktif' : 'Nonaktif'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity onPress={() => handleToggle(item.id, item.isActive)} style={{ padding: 4 }}>
                      <Ionicons name={item.isActive ? 'pause-circle-outline' : 'play-circle-outline'} size={20} color={theme.accent} />
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

            {/* Type selector */}
            <View>
              <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>Tipe</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {TYPES.map(t => (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => { Haptics.selectionAsync(); setType(t.id); }}
                    style={{
                      flex: 1, paddingVertical: 11, borderRadius: 12,
                      alignItems: 'center', gap: 3,
                      backgroundColor: type === t.id ? `${t.color}18` : theme.card,
                      borderWidth: 1, borderColor: type === t.id ? t.color : `${theme.accent}15`,
                    }}
                  >
                    <Ionicons name={t.icon as any} size={15} color={type === t.id ? t.color : theme.subtext} />
                    <Text style={{ color: type === t.id ? t.color : theme.subtext, fontSize: 9, fontWeight: '800' }}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Judul */}
            <View style={{ gap: 8 }}>
              <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 }}>Judul</Text>
              <TextInput
                value={title} onChangeText={setTitle}
                placeholder="Judul announcement..."
                placeholderTextColor={theme.subtext}
                style={{
                  backgroundColor: theme.card, color: theme.text,
                  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
                  fontSize: 13, borderWidth: 1, borderColor: `${theme.accent}20`,
                }}
              />
            </View>

            {/* Pesan */}
            <View style={{ gap: 8 }}>
              <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 }}>Pesan</Text>
              <TextInput
                value={body} onChangeText={setBody}
                placeholder="Isi pesan..." placeholderTextColor={theme.subtext}
                multiline numberOfLines={4}
                style={{
                  backgroundColor: theme.card, color: theme.text,
                  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
                  fontSize: 13, borderWidth: 1, borderColor: `${theme.accent}20`,
                  textAlignVertical: 'top', minHeight: 100,
                }}
              />
            </View>

            {/* CTA */}
            <View style={{ gap: 8 }}>
              <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 }}>Tombol CTA (Opsional)</Text>
              <TextInput
                value={ctaText} onChangeText={setCtaText}
                placeholder="Teks tombol, misal: Update Sekarang"
                placeholderTextColor={theme.subtext}
                style={{
                  backgroundColor: theme.card, color: theme.text,
                  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
                  fontSize: 13, borderWidth: 1, borderColor: `${theme.accent}20`,
                }}
              />
              <TextInput
                value={ctaUrl} onChangeText={setCtaUrl}
                placeholder="URL tujuan, misal: https://..."
                placeholderTextColor={theme.subtext}
                autoCapitalize="none"
                style={{
                  backgroundColor: theme.card, color: theme.text,
                  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
                  fontSize: 13, borderWidth: 1, borderColor: `${theme.accent}20`,
                }}
              />
            </View>

            {/* Active toggle */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: theme.card, borderRadius: 14, padding: 14,
              borderWidth: 1, borderColor: `${theme.accent}20`,
            }}>
              <View>
                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>Langsung Aktif</Text>
                <Text style={{ color: theme.subtext, fontSize: 10, marginTop: 2 }}>Tampilkan ke user sekarang</Text>
              </View>
              <Switch
                value={isActive} onValueChange={setIsActive}
                trackColor={{ false: `${theme.accent}20`, true: `${theme.accent}80` }}
                thumbColor={isActive ? theme.accent : theme.subtext}
              />
            </View>

            {/* Submit */}
            <TouchableOpacity
              onPress={handleSave} disabled={saving}
              style={{
                backgroundColor: selectedType.color,
                paddingVertical: 15, borderRadius: 14,
                alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
                shadowColor: selectedType.color, shadowOpacity: 0.5, shadowRadius: 12, elevation: 6,
              }}
            >
              <Ionicons name="megaphone" size={16} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>
                {saving ? 'Menyimpan...' : 'Kirim Announcement'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}
