import React, { useState, useCallback } from 'react';
import {
  View, Text, Modal, TouchableOpacity, TextInput,
  ActivityIndicator, Share, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { COLORS } from '@/constants';
import { getCurrentUser } from '@/hooks/auth';

interface Props {
  visible:      boolean;
  isInRoom:     boolean;
  isHost:       boolean;
  roomCode:     string | null;
  memberCount:  number;
  isLoading:    boolean;
  error:        string | null;
  onCreateRoom: () => void;
  onJoinRoom:   (code: string) => void;
  onLeaveRoom:  () => void;
  onClose:      () => void;
}

export function RoomModal({
  visible, isInRoom, isHost, roomCode, memberCount,
  isLoading, error, onCreateRoom, onJoinRoom, onLeaveRoom, onClose,
}: Props) {
  const [inputCode, setInputCode] = useState('');
  const user = getCurrentUser();

  const handleJoin = useCallback(() => {
    if (inputCode.trim().length < 4) return;
    onJoinRoom(inputCode.trim().toUpperCase());
    setInputCode('');
  }, [inputCode, onJoinRoom]);

  const handleShare = useCallback(async () => {
    if (!roomCode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Share.share({ message: `Gabung nobar sama gue! Kode room: ${roomCode}` });
  }, [roomCode]);

  const handleCopy = useCallback(async () => {
    if (!roomCode) return;
    await Clipboard.setStringAsync(roomCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [roomCode]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />

        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          <Text style={styles.title}>🍿 Nobar Room</Text>

          {!user ? (
            <Text style={styles.hint}>Login dulu untuk buat / join room.</Text>
          ) : isInRoom ? (
            /* ── Sudah di dalam room ── */
            <View style={styles.section}>
              <Text style={styles.label}>{isHost ? '👑 Kamu Host' : '🎬 Kamu Member'}</Text>

              {/* Kode room */}
              <View style={styles.codeRow}>
                <Text style={styles.codeText}>{roomCode}</Text>
                <TouchableOpacity onPress={handleCopy} style={styles.codeBtn}>
                  <Text style={styles.codeBtnText}>Copy</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleShare} style={styles.codeBtn}>
                  <Text style={styles.codeBtnText}>Share</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.hint}>
                {memberCount} orang lagi nonton bareng
              </Text>

              {!isHost && (
                <Text style={styles.hint}>Host yang kontrol play/pause/seek.</Text>
              )}

              <TouchableOpacity
                style={[styles.btn, styles.btnDanger]}
                onPress={onLeaveRoom}
              >
                <Text style={styles.btnText}>
                  {isHost ? 'Tutup Room' : 'Keluar Room'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ── Belum di room ── */
            <View style={styles.section}>
              {error ? (
                <Text style={styles.error}>{error}</Text>
              ) : null}

              {/* Buat room baru */}
              <TouchableOpacity
                style={[styles.btn, styles.btnAccent, isLoading && styles.btnDisabled]}
                onPress={onCreateRoom}
                disabled={isLoading}
              >
                {isLoading
                  ? <ActivityIndicator color="#000" size="small" />
                  : <Text style={[styles.btnText, { color: '#000' }]}>Buat Room Baru</Text>
                }
              </TouchableOpacity>

              <Text style={styles.orText}>— atau —</Text>

              {/* Join room */}
              <TextInput
                style={styles.input}
                placeholder="Masukkan kode room (6 digit)"
                placeholderTextColor={COLORS.whiteDim}
                value={inputCode}
                onChangeText={t => setInputCode(t.toUpperCase())}
                autoCapitalize="characters"
                maxLength={8}
              />
              <TouchableOpacity
                style={[styles.btn, inputCode.length < 4 && styles.btnDisabled]}
                onPress={handleJoin}
                disabled={inputCode.length < 4 || isLoading}
              >
                {isLoading
                  ? <ActivityIndicator color={COLORS.gold} size="small" />
                  : <Text style={styles.btnText}>Join Room</Text>
                }
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius:  20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 40, height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: { gap: 12 },
  label: {
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
  },
  codeText: {
    color: COLORS.gold,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 6,
    flex: 1,
    textAlign: 'center',
  },
  codeBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  codeBtnText: { color: COLORS.white, fontSize: 12, fontWeight: '600' },
  hint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    textAlign: 'center',
  },
  orText: {
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    color: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    letterSpacing: 3,
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  btn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnAccent: { backgroundColor: COLORS.gold },
  btnDanger: { backgroundColor: 'rgba(230,57,70,0.2)', borderWidth: 1, borderColor: 'rgba(230,57,70,0.4)' },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  error: { color: '#e63946', fontSize: 13, textAlign: 'center' },
});
