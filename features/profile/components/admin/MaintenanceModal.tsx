// MaintenanceModal.tsx — Glassmorphism
import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, Switch, TextInput, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import firestore from '@react-native-firebase/firestore';
import { useTheme } from '@/hooks/theme';

const DANGER = '#e63946';

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
          backgroundColor: theme.card,
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          padding: 24, paddingBottom: 48,
          borderWidth: 1, borderColor: `${DANGER}25`,
          overflow: 'hidden',
        }}>
          {/* Danger glass shimmer */}
          <LinearGradient
            colors={[`${DANGER}10`, 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', inset: 0 }}
            pointerEvents="none"
          />

          {/* Handle */}
          <View style={{
            width: 36, height: 4, borderRadius: 2,
            backgroundColor: `${DANGER}30`,
            alignSelf: 'center', marginBottom: 20,
          }} />

          {/* Title row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <View style={{
              width: 42, height: 42, borderRadius: 13,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: `${DANGER}18`,
              borderWidth: 1, borderColor: `${DANGER}30`,
            }}>
              <Ionicons name="construct-outline" size={20} color={DANGER} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontWeight: '900', fontSize: 16 }}>Mode Maintenance</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isActive ? DANGER : '#2ecc71' }} />
                <Text style={{ color: isActive ? DANGER : '#2ecc71', fontSize: 10, fontWeight: '700' }}>
                  {isActive ? 'Aktif — user tidak bisa akses' : 'Nonaktif'}
                </Text>
              </View>
            </View>
            <Switch
              value={isActive}
              onValueChange={val => { Haptics.selectionAsync(); setIsActive(val); }}
              trackColor={{ false: `${theme.accent}20`, true: `${DANGER}70` }}
              thumbColor={isActive ? DANGER : theme.subtext}
            />
          </View>

          {/* Pesan */}
          <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Pesan</Text>
          <TextInput
            value={message} onChangeText={setMessage}
            placeholder="Pesan untuk user..." placeholderTextColor={theme.subtext}
            multiline numberOfLines={3}
            style={{
              backgroundColor: theme.bg, color: theme.text,
              borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
              fontSize: 13, borderWidth: 1, borderColor: `${DANGER}20`,
              marginBottom: 14, textAlignVertical: 'top', minHeight: 80,
            }}
          />

          {/* Estimasi */}
          <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Estimasi Selesai</Text>
          <TextInput
            value={estimasi} onChangeText={setEstimasi}
            placeholder="Contoh: 14:00 WIB" placeholderTextColor={theme.subtext}
            style={{
              backgroundColor: theme.bg, color: theme.text,
              borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
              fontSize: 13, borderWidth: 1, borderColor: `${DANGER}20`,
              marginBottom: 20,
            }}
          />

          {/* Save */}
          <TouchableOpacity
            onPress={handleSave} disabled={saving}
            style={{
              backgroundColor: isActive ? DANGER : theme.accent,
              paddingVertical: 15, borderRadius: 14,
              alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
              shadowColor: isActive ? DANGER : theme.accent,
              shadowOpacity: 0.5, shadowRadius: 12, elevation: 6,
            }}
          >
            <Ionicons name={isActive ? 'construct' : 'checkmark-circle'} size={16} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </Modal>
  );
}
