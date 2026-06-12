import React from 'react';
import { View, Text, Modal, TouchableOpacity, Linking } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/theme';

export function TentangModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const theme = useTheme();

  const links = [
    { icon: 'document-text-outline', label: 'Kebijakan Privasi', url: 'https://nefusoft.cloud/privacy' },
    { icon: 'shield-checkmark-outline', label: 'Syarat & Ketentuan', url: 'https://nefusoft.cloud/terms' },
    { icon: 'globe-outline', label: 'Website', url: 'https://nefusoft.cloud' },
    { icon: 'logo-instagram', label: 'Instagram', url: 'https://instagram.com/nefusoft' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose}>
        <BlurView intensity={40} tint="dark" style={{ flex: 1, justifyContent: 'flex-end' }}>
          <TouchableOpacity activeOpacity={1}>
            <View style={{
              backgroundColor: theme.card,
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              paddingBottom: 48, paddingTop: 16, paddingHorizontal: 24,
              borderWidth: 1, borderColor: theme.border,
            }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginBottom: 24 }} />
              <Text style={{ color: theme.text, fontSize: 18, fontWeight: '900', marginBottom: 4, textAlign: 'center' }}>NefuSoft</Text>
              <Text style={{ color: theme.subtext, fontSize: 12, textAlign: 'center', marginBottom: 24 }}>Versi 1.0.0</Text>
              {links.map((item, i) => (
                <TouchableOpacity
                  key={item.label}
                  onPress={() => Linking.openURL(item.url)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    paddingVertical: 14,
                    borderBottomWidth: i < links.length - 1 ? 1 : 0,
                    borderBottomColor: theme.border,
                  }}
                >
                  <View style={{ width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.accentDim }}>
                    <Ionicons name={item.icon as any} size={17} color={theme.accent} />
                  </View>
                  <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600', flex: 1 }}>{item.label}</Text>
                  <Ionicons name="open-outline" size={14} color={theme.subtext} />
                </TouchableOpacity>
              ))}
              <Text style={{ color: theme.subtext, fontSize: 10, textAlign: 'center', marginTop: 24 }}>Made with ♥ by NefuSoft Team</Text>
            </View>
          </TouchableOpacity>
        </BlurView>
      </TouchableOpacity>
    </Modal>
  );
}
