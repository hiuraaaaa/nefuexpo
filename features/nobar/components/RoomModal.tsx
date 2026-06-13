import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  Modal, ActivityIndicator, Share,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Keyboard } from 'react-native';
import { COLORS } from '@/constants';

interface Props {
  visible: boolean;
  loading: boolean;
  error: string | null;
  currentRoomCode: string | null;
  animeTitle: string;
  onClose: () => void;
  onCreate: () => void;
  onJoin: (code: string) => void;
  onLeave: () => void;
}

export function RoomModal({
  visible, loading, error, currentRoomCode,
  animeTitle, onClose, onCreate, onJoin, onLeave,
}: Props) {
  const [tab, setTab]           = useState<'create' | 'join'>('create');
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied]     = useState(false);

  const handleCopy = () => {
    if (!currentRoomCode) return;
    Clipboard.setStringAsync(currentRoomCode);
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!currentRoomCode) return;
    await Share.share({
      message: `Yuk nobar "${animeTitle}" bareng di NefuSoft!\nKode room: ${currentRoomCode}`,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Backdrop */}
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Bottom sheet — auto height, bukan fixed */}
        <View style={{
          backgroundColor: '#141210',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.07)',
          paddingBottom: Platform.OS === 'android' ? 24 : 36,
        }}>
          {/* Handle bar */}
          <View style={{ width: 36, height: 4, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 18 }} />

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 4 }}
          >
            {/* ── ROOM AKTIF ── */}
            {currentRoomCode ? (
              <View style={{ gap: 14 }}>
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 17, textAlign: 'center' }}>Room Aktif 🎬</Text>

                {/* Kode besar */}
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderRadius: 16, padding: 20,
                  alignItems: 'center', gap: 6,
                  borderWidth: 1, borderColor: `${COLORS.gold}35`,
                }}>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' }}>Kode Room</Text>
                  <Text style={{ color: COLORS.gold, fontSize: 34, fontWeight: '900', letterSpacing: 8 }}>{currentRoomCode}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>Bagikan ke teman untuk nobar bareng</Text>
                </View>

                {/* Salin + Share */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity onPress={handleCopy} style={{
                    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    gap: 7, paddingVertical: 13, borderRadius: 12,
                    backgroundColor: copied ? '#4ade8018' : 'rgba(255,255,255,0.06)',
                    borderWidth: 1, borderColor: copied ? '#4ade8080' : 'rgba(255,255,255,0.09)',
                  }}>
                    <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={17} color={copied ? '#4ade80' : 'rgba(255,255,255,0.7)'} />
                    <Text style={{ color: copied ? '#4ade80' : 'rgba(255,255,255,0.7)', fontWeight: '700', fontSize: 13 }}>{copied ? 'Tersalin!' : 'Salin'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleShare} style={{
                    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    gap: 7, paddingVertical: 13, borderRadius: 12,
                    backgroundColor: `${COLORS.gold}12`, borderWidth: 1, borderColor: `${COLORS.gold}45`,
                  }}>
                    <Ionicons name="share-outline" size={17} color={COLORS.gold} />
                    <Text style={{ color: COLORS.gold, fontWeight: '700', fontSize: 13 }}>Bagikan</Text>
                  </TouchableOpacity>
                </View>

                {/* Keluar */}
                <TouchableOpacity onPress={onLeave} style={{
                  paddingVertical: 13, borderRadius: 12, alignItems: 'center',
                  backgroundColor: '#e6394615', borderWidth: 1, borderColor: '#e6394650',
                }}>
                  <Text style={{ color: '#e63946', fontWeight: '900', fontSize: 14 }}>Keluar dari Room</Text>
                </TouchableOpacity>
              </View>

            ) : (
              /* ── BUAT / JOIN ── */
              <View style={{ gap: 14 }}>
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 17, textAlign: 'center' }}>Nobar Bareng 🍿</Text>

                {/* Tab switcher */}
                <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 3 }}>
                  {(['create', 'join'] as const).map(t => (
                    <TouchableOpacity
                      key={t}
                      onPress={() => { Haptics.selectionAsync(); Keyboard.dismiss(); setTab(t); }}
                      style={{
                        flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
                        backgroundColor: tab === t ? COLORS.gold : 'transparent',
                      }}
                    >
                      <Text style={{ color: tab === t ? '#1a1208' : 'rgba(255,255,255,0.45)', fontWeight: '900', fontSize: 13 }}>
                        {t === 'create' ? 'Buat Room' : 'Join Room'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Error */}
                {error && (
                  <View style={{ backgroundColor: '#e6394618', borderRadius: 10, padding: 11, borderWidth: 1, borderColor: '#e6394650' }}>
                    <Text style={{ color: '#e63946', fontSize: 12, fontWeight: '700', textAlign: 'center' }}>{error}</Text>
                  </View>
                )}

                {/* Buat Room */}
                {tab === 'create' ? (
                  <View style={{ gap: 12 }}>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
                      <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginBottom: 3 }}>Anime yang ditonton</Text>
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }} numberOfLines={1}>{animeTitle || 'Tidak ada anime'}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={onCreate}
                      disabled={loading}
                      style={{
                        paddingVertical: 15, borderRadius: 12, alignItems: 'center',
                        backgroundColor: COLORS.gold, opacity: loading ? 0.6 : 1,
                      }}
                    >
                      {loading
                        ? <ActivityIndicator color="#1a1208" />
                        : <Text style={{ color: '#1a1208', fontWeight: '900', fontSize: 15 }}>Buat Room Sekarang</Text>}
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* Join Room */
                  <View style={{ gap: 12 }}>
                    <TextInput
                      value={joinCode}
                      onChangeText={t => setJoinCode(t.toUpperCase().slice(0, 6))}
                      placeholder="Masukkan kode room"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      autoCapitalize="characters"
                      maxLength={6}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12,
                        paddingHorizontal: 16, paddingVertical: 16,
                        color: COLORS.gold, fontSize: 22, fontWeight: '900',
                        letterSpacing: 8, textAlign: 'center',
                        borderWidth: 1,
                        borderColor: joinCode.length === 6 ? `${COLORS.gold}55` : 'rgba(255,255,255,0.08)',
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => { Haptics.selectionAsync(); onJoin(joinCode); }}
                      disabled={loading || joinCode.length < 6}
                      style={{
                        paddingVertical: 15, borderRadius: 12, alignItems: 'center',
                        backgroundColor: joinCode.length === 6 ? COLORS.gold : 'rgba(255,255,255,0.06)',
                        opacity: loading ? 0.6 : 1,
                      }}
                    >
                      {loading
                        ? <ActivityIndicator color="#1a1208" />
                        : <Text style={{ color: joinCode.length === 6 ? '#1a1208' : 'rgba(255,255,255,0.25)', fontWeight: '900', fontSize: 15 }}>Gabung Sekarang</Text>}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
