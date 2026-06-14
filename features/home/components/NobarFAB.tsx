import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal,
  TextInput, ActivityIndicator, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, FadeIn, FadeOut,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { COLORS } from '@/constants';

const { height: SCREEN_H } = Dimensions.get('window');

interface Props {
  activeRoomCode?: string | null;
  insetBottom: number;
}

export function NobarFAB({ activeRoomCode, insetBottom }: Props) {
  const router  = useRouter();
  const [open, setOpen]         = useState(false);
  const [code, setCode]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const scale = useSharedValue(1);
  const fabStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const isInRoom = !!activeRoomCode;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSpring(0.9, { damping: 10 }, () => { scale.value = withSpring(1); });
    if (isInRoom) {
      // Kalau udah di room, langsung ke watch anime yang lagi diputar
      // (akan di-handle sama useRoom listener)
      setOpen(true);
    } else {
      setOpen(true);
    }
  };

  const handleJoin = async () => {
    if (!code.trim() || code.length < 6) return;
    if (!auth().currentUser) { setError('Login dulu untuk bergabung'); return; }
    setLoading(true);
    setError(null);
    try {
      const snap = await firestore().collection('rooms').doc(code.toUpperCase()).get();
      if (!snap.exists) { setError('Room tidak ditemukan'); setLoading(false); return; }

      const roomData = snap.data() as any;

      // Join member
      await firestore()
        .collection('rooms').doc(code.toUpperCase())
        .collection('members').doc(auth().currentUser!.uid)
        .set({
          display_name: auth().currentUser!.displayName || 'User',
          avatar:       auth().currentUser!.photoURL || null,
          joined_at:    Date.now(),
          is_host:      false,
        });

      setOpen(false);
      setCode('');

      // Navigate ke anime host
      router.push(`/watch/${roomData.anime_id}`);
    } catch (e: any) {
      setError(e.message || 'Gagal bergabung');
    }
    setLoading(false);
  };

  return (
    <>
      {/* FAB */}
      <Animated.View style={[fabStyle, {
        position: 'absolute',
        bottom:   insetBottom + 90, // di atas tab bar
        right:    20,
        zIndex:   999,
      }]}>
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.9}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            paddingHorizontal: isInRoom ? 16 : 14,
            paddingVertical: 12,
            borderRadius: 999,
            backgroundColor: isInRoom ? '#4ade80' : COLORS.gold,
            shadowColor: isInRoom ? '#4ade80' : COLORS.gold,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <Ionicons
            name={isInRoom ? 'people' : 'people-outline'}
            size={20}
            color="#000"
          />
          {isInRoom ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#000' }} />
              <Text style={{ color: '#000', fontWeight: '900', fontSize: 12 }}>{activeRoomCode}</Text>
            </View>
          ) : (
            <Text style={{ color: '#000', fontWeight: '900', fontSize: 12 }}>Nobar</Text>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Modal join room */}
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} activeOpacity={1} onPress={() => setOpen(false)} />
          <View style={{
            backgroundColor: '#111',
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            padding: 24, paddingBottom: 40,
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
          }}>
            <View style={{ width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />

            {isInRoom ? (
              // Sudah di room — tampilkan kode aktif
              <View style={{ gap: 16 }}>
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18, textAlign: 'center' }}>Room Aktif 🎬</Text>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: `${COLORS.gold}40` }}>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' }}>Kode Room</Text>
                  <Text style={{ color: COLORS.gold, fontSize: 36, fontWeight: '900', letterSpacing: 8 }}>{activeRoomCode}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Kamu sedang nobar</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setOpen(false)}
                  style={{ paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: COLORS.gold }}
                >
                  <Text style={{ color: '#000', fontWeight: '900', fontSize: 15 }}>Tutup</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Belum di room — form join
              <View style={{ gap: 16 }}>
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18, textAlign: 'center' }}>Nobar Bareng 🍿</Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center' }}>
                  Masukkan kode room dari temanmu untuk nonton bareng
                </Text>

                {error && (
                  <View style={{ backgroundColor: '#e6394620', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e6394660' }}>
                    <Text style={{ color: '#e63946', fontSize: 12, fontWeight: '700', textAlign: 'center' }}>{error}</Text>
                  </View>
                )}

                <TextInput
                  value={code}
                  onChangeText={t => { setCode(t.toUpperCase().slice(0, 6)); setError(null); }}
                  placeholder="Kode Room (6 huruf)"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  autoCapitalize="characters"
                  maxLength={6}
                  autoFocus
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12,
                    paddingHorizontal: 16, paddingVertical: 16,
                    color: COLORS.gold, fontSize: 26, fontWeight: '900',
                    letterSpacing: 10, textAlign: 'center',
                    borderWidth: 1, borderColor: code.length === 6 ? `${COLORS.gold}60` : 'rgba(255,255,255,0.08)',
                  }}
                />

                <TouchableOpacity
                  onPress={handleJoin}
                  disabled={loading || code.length < 6}
                  style={{
                    paddingVertical: 16, borderRadius: 12, alignItems: 'center',
                    backgroundColor: code.length === 6 ? COLORS.gold : 'rgba(255,255,255,0.07)',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading
                    ? <ActivityIndicator color="#000" />
                    : <Text style={{ color: code.length === 6 ? '#000' : 'rgba(255,255,255,0.3)', fontWeight: '900', fontSize: 15 }}>
                        Gabung Sekarang
                      </Text>
                  }
                </TouchableOpacity>

                <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, textAlign: 'center' }}>
                  Untuk buat room baru, buka anime yang ingin ditonton dulu
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
