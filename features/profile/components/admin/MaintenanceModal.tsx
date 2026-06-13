import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, Switch, TextInput, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import firestore from '@react-native-firebase/firestore';
import { useTheme } from '@/hooks/theme';

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
      <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose}>
        <BlurView intensity={40} tint="dark" style={{ flex: 1, justifyContent: 'flex-end' }}>
          <TouchableOpacity activeOpacity={1}>
            <View style={{
              backgroundColor: theme.card,
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              padding: 24, paddingBottom: 48,
              borderWidth: 1, borderColor: theme.border,
            }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginBottom: 20 }} />

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <View>
                  <Text style={{ color: theme.text, fontWeight: '900', fontSize: 16 }}>Mode Maintenance</Text>
                  <Text style={{ color: theme.subtext, fontSize: 11, marginTop: 2 }}>
                    {isActive ? '🔴 Aktif — user tidak bisa akses' : '🟢 Nonaktif'}
                  </Text>
                </View>
                <Switch
                  value={isActive}
                  onValueChange={val => { Haptics.selectionAsync(); setIsActive(val); }}
                  trackColor={{ false: theme.border, true: '#e63946' }}
                  thumbColor={isActive ? '#fff' : theme.subtext}
                />
              </View>

              <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Pesan</Text>
              <TextInput
                value={message} onChangeText={setMessage}
                placeholder="Pesan untuk user..." placeholderTextColor={theme.subtext}
                multiline numberOfLines={3}
                style={{ backgroundColor: theme.bg, color: theme.text, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, borderWidth: 1, borderColor: theme.border, marginBottom: 12, textAlignVertical: 'top', minHeight: 80 }}
              />

              <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Estimasi Selesai</Text>
              <TextInput
                value={estimasi} onChangeText={setEstimasi}
                placeholder="Contoh: 14:00 WIB" placeholderTextColor={theme.subtext}
                style={{ backgroundColor: theme.bg, color: theme.text, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, borderWidth: 1, borderColor: theme.border, marginBottom: 20 }}
              />

              <TouchableOpacity
                onPress={handleSave} disabled={saving}
                style={{ backgroundColor: isActive ? '#e63946' : theme.accent, paddingVertical: 14, borderRadius: 10, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </BlurView>
      </TouchableOpacity>
    </Modal>
  );
}
