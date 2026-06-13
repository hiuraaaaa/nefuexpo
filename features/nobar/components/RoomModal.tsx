import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  Modal, ActivityIndicator, Share, Clipboard,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '@/constants';

const { height: SCREEN_H } = Dimensions.get('window');

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
    Clipboard.setString(currentRoomCode);
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
      {/* Backdrop tap to close */}
      <View style={{ flex: 1 }}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Bottom sheet panel */}
        <View style={{
          backgroundColor: '#111',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 40,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
          maxHeight: SCREEN_H * 0.75,
        }}>
          {/* Handle */}
          <View style={{ width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />

          {/* Jika sudah di room */}
          {currentRoomCode ? (
            <View style={{ gap: 16 }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18, textAlign: 'center' }}>Room Aktif 🎬</Text>

              <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: `${COLORS.gold}40` }}>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' }}>Kode Room</Text>
                <Text style={{ color: COLORS.gold, fontSize: 36, fontWeight: '900', letterSpacing: 8 }}>{currentRoomCode}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Bagikan ke teman untuk nobar bareng</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity onPress={handleCopy} style={{
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  gap: 8, paddingVertical: 14, borderRadius: 12,
                  backgroundColor: copied ? '#4ade8020' : 'rgba(255,255,255,0.07)',
                  borderWidth: 1, borderColor: copied ? '#4ade80' : 'rgba(255,255,255,0.1)',
                }}>
                  <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color={copied ? '#4ade80' : '#fff'} />
                  <Text style={{ color: copied ? '#4ade80' : '#fff', fontWeight: '700' }}>{copied ? 'Tersalin!' : 'Salin'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleShare} style={{
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  gap: 8, paddingVertical: 14, borderRadius: 12,
                  backgroundColor: `${COLORS.gold}15`, borderWidth: 1, borderColor: `${COLORS.gold}50`,
                }}>
                  <Ionicons name="share-outline" size={18} color={COLORS.gold} />
                  <Text style={{ color: COLORS.gold, fontWeight: '700' }}>Bagikan</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={onLeave} style={{
                paddingVertical: 14, borderRadius: 12, alignItems: 'center',
                backgroundColor: '#e6394620', borderWidth: 1, borderColor: '#e6394660',
              }}>
                <Text style={{ color: '#e63946', fontWeight: '900' }}>Keluar dari Room</Text>
              </TouchableOpacity>
            </View>

          ) : (
            <View style={{ gap: 16 }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18, textAlign: 'center' }}>Nobar Bareng 🍿</Text>

              {/* Tab */}
              <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4 }}>
                {(['create', 'join'] as const).map(t => (
                  <TouchableOpacity key={t} onPress={() => setTab(t)} style={{
                    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
                    backgroundColor: tab === t ? COLORS.gold : 'transparent',
                  }}>
                    <Text style={{ color: tab === t ? '#000' : 'rgba(255,255,255,0.5)', fontWeight: '900', fontSize: 13 }}>
                      {t === 'create' ? 'Buat Room' : 'Join Room'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {error && (
                <View style={{ backgroundColor: '#e6394620', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e6394660' }}>
                  <Text style={{ color: '#e63946', fontSize: 12, fontWeight: '700', textAlign: 'center' }}>{error}</Text>
                </View>
              )}

              {tab === 'create' ? (
                <View style={{ gap: 12 }}>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 4 }}>Anime yang ditonton</Text>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }} numberOfLines={1}>{animeTitle || 'Tidak ada anime'}</Text>
                  </View>
                  <TouchableOpacity onPress={onCreate} disabled={loading} style={{
                    paddingVertical: 16, borderRadius: 12, alignItems: 'center',
                    backgroundColor: COLORS.gold, opacity: loading ? 0.6 : 1,
                  }}>
                    {loading
                      ? <ActivityIndicator color="#000" />
                      : <Text style={{ color: '#000', fontWeight: '900', fontSize: 15 }}>Buat Room Sekarang</Text>}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  <TextInput
                    value={joinCode}
                    onChangeText={t => setJoinCode(t.toUpperCase().slice(0, 6))}
                    placeholder="Masukkan kode room"
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    autoCapitalize="characters"
                    maxLength={6}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12,
                      paddingHorizontal: 16, paddingVertical: 14,
                      color: COLORS.gold, fontSize: 22, fontWeight: '900',
                      letterSpacing: 8, textAlign: 'center',
                      borderWidth: 1, borderColor: joinCode.length === 6 ? `${COLORS.gold}60` : 'rgba(255,255,255,0.08)',
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => { Haptics.selectionAsync(); onJoin(joinCode); }}
                    disabled={loading || joinCode.length < 6}
                    style={{
                      paddingVertical: 16, borderRadius: 12, alignItems: 'center',
                      backgroundColor: joinCode.length === 6 ? COLORS.gold : 'rgba(255,255,255,0.07)',
                      opacity: loading ? 0.6 : 1,
                    }}>
                    {loading
                      ? <ActivityIndicator color="#000" />
                      : <Text style={{ color: joinCode.length === 6 ? '#000' : 'rgba(255,255,255,0.3)', fontWeight: '900', fontSize: 15 }}>Gabung Sekarang</Text>}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
