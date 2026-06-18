// MaintenanceModal.tsx
//
// Signature: no icon-in-rounded-square header, no gradient shimmer. The
// status line is set as plain typeset text with a colored dot, and the
// switch sits inline with the title the way a real settings list reads —
// not floated to one side of a symmetric row.
import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, Switch, TextInput, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import firestore from '@react-native-firebase/firestore';
import { useTheme } from '@/hooks/theme';

const DANGER = '#e15c5c';

export function MaintenanceModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const theme = useTheme();
  const [isActive, setIsActive] = useState(false);
  const [message, setMessage]   = useState('');
  const [estimasi, setEstimasi] = useState('');
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    if (!visible) return;
    firestore().collection('config').doc('maintenance').get().then(snap => {
      const d = snap.data();
      setIsActive(d?.isActive ?? false);
      setMessage(d?.message ?? '');
      setEstimasi(d?.estimasi ?? '');
    }).catch(() => {});
  }, [visible]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await firestore().collection('config').doc('maintenance').set({
        isActive, message, estimasi, updatedAt: Date.now(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Berhasil', `Maintenance ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`);
      onClose();
    } catch {
      Alert.alert('Error', 'Gagal menyimpan');
    }
    setSaving(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <BlurView intensity={40} tint="dark" style={{ flex: 1, justifyContent: 'flex-end' }}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={{
          backgroundColor: theme.bg,
          borderTopLeftRadius: 22, borderTopRightRadius: 22,
          padding: 24, paddingBottom: 44,
        }}>
          <View style={{
            width: 32, height: 4, backgroundColor: `${DANGER}30`,
            borderRadius: 2, alignSelf: 'center', marginBottom: 22,
          }} />

          {/* Title + switch sit inline, status as plain text + dot below */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ color: theme.text, fontWeight: '900', fontSize: 22, letterSpacing: -0.5 }}>
              Maintenance
            </Text>
            <Switch
              value={isActive}
              onValueChange={val => { Haptics.selectionAsync(); setIsActive(val); }}
              trackColor={{ false: `${theme.accent}25`, true: DANGER }}
              thumbColor={theme.bg}
            />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 26 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isActive ? DANGER : '#3fae6a' }} />
            <Text style={{ color: isActive ? DANGER : theme.subtext, fontSize: 12.5, fontWeight: '700' }}>
              {isActive ? 'Aktif — user tidak bisa mengakses aplikasi' : 'Nonaktif, semua user bisa akses normal'}
            </Text>
          </View>

          <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
            Pesan untuk user
          </Text>
          <TextInput
            value={message} onChangeText={setMessage}
            placeholder="Sedang ada perbaikan sistem…" placeholderTextColor={theme.subtext}
            multiline numberOfLines={3}
            style={{
              color: theme.text, fontSize: 13,
              borderBottomWidth: 1.5, borderBottomColor: `${DANGER}30`,
              paddingVertical: 9, marginBottom: 20, minHeight: 70, textAlignVertical: 'top',
            }}
          />

          <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
            Estimasi selesai
          </Text>
          <TextInput
            value={estimasi} onChangeText={setEstimasi}
            placeholder="Contoh: 14:00 WIB" placeholderTextColor={theme.subtext}
            style={{
              color: theme.text, fontSize: 13,
              borderBottomWidth: 1.5, borderBottomColor: `${DANGER}30`,
              paddingVertical: 9, marginBottom: 28,
            }}
          />

          <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.7}>
            <Text style={{ color: isActive ? DANGER : theme.accent, fontWeight: '900', fontSize: 17 }}>
              {saving ? 'Menyimpan…' : 'Simpan perubahan →'}
            </Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </Modal>
  );
}
