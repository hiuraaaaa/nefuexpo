// components/SearchModal.tsx
//
// Modal search — muncul dari HomeScreen (searchOpen state). Punya state
// query sendiri (bukan nerima `value` dari luar), jadi gak akan pernah
// undefined. Submit -> push ke /explore?q=... lalu tutup modal & reset.
import React, { useRef, useState, useEffect } from 'react';
import {
  Modal, View, TextInput, TouchableOpacity, Text,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

interface Props {
  visible: boolean;
  onClose: () => void;
  theme: any;
}

export default function SearchModal({ visible, onClose, theme }: Props) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Reset & auto-focus tiap kali modal dibuka
  useEffect(() => {
    if (visible) {
      setQuery('');
      const t = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [visible]);

  const handleClear = () => {
    Haptics.selectionAsync();
    setQuery('');
    inputRef.current?.focus();
  };

  const handleSubmit = () => {
    const q = query.trim();
    if (!q) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    router.push(`/(tabs)/explore?q=${encodeURIComponent(q)}`);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: `${theme.bg}f2`, justifyContent: 'flex-start' }}
      >
        <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 22 }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 10,
            backgroundColor: `${theme.subtext}12`,
            borderWidth: 1, borderColor: theme.border,
            borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11,
          }}>
            <Ionicons name="search-outline" size={18} color={theme.subtext} />
            <TextInput
              ref={inputRef}
              style={{
                flex: 1,
                color: theme.text,
                fontFamily: 'PlusJakartaSans_600SemiBold',
                fontSize: 14,
                paddingVertical: 0,
              }}
              placeholder="Cari judul anime..."
              placeholderTextColor={theme.subtext}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSubmit}
              returnKeyType="search"
              selectionColor={theme.accent}
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={handleClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle" size={17} color={`${theme.subtext}90`} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ paddingLeft: 4 }}
            >
              <Text style={{ color: theme.accent, fontSize: 13, fontWeight: '700' }}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
