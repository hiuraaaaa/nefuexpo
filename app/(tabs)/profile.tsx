import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  Switch, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { COLORS } from '@/constants';
import { signInWithGoogle, signOut, onAuthStateChanged } from '@/hooks/auth';
import { xpStorage, XPData } from '@/hooks/xp';
import { historyStorage } from '@/hooks/storage';
import { XPBar } from '@/components/XPBar';
import { LevelBadge } from '@/components/LevelBadge';
import { HistoryItem } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PIP_KEY = 'nefusoft_pip';

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [xpData, setXpData] = useState<XPData>({ xp: 0, level: 1, streak: 0, lastWatchDate: '' });
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [pip, setPip] = useState(false);
  const [loading, setLoading] = useState(false);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(u => setUser(u));
    return unsub;
  }, []);

  // Load data saat screen fokus
  useFocusEffect(useCallback(() => {
    xpStorage.get().then(setXpData);
    historyStorage.getAll().then(h => setHistory(h.slice(0, 5)));
    AsyncStorage.getItem(PIP_KEY).then(v => setPip(v === 'true'));
  }, []));

  const handleLogin = async () => {
    setLoading(true);
    await signInWithGoogle();
    setLoading(false);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Yakin mau logout?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: signOut },
    ]);
  };

  const togglePip = async (val: boolean) => {
    setPip(val);
    await AsyncStorage.setItem(PIP_KEY, String(val));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {user ? (
          <>
            {/* ── User card ── */}
            <View style={styles.userCard}>
              <Image
                source={{ uri: user.photoURL ?? 'https://ui-avatars.com/api/?name=' + user.displayName }}
                style={styles.avatar}
              />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.userName} numberOfLines={1}>{user.displayName}</Text>
                <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
                <LevelBadge xp={xpData.xp} size="sm" />
              </View>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </View>

            {/* ── XP & Level ── */}
            <View style={styles.section}>
              <View style={styles.xpHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Level & XP</Text>
                  <Text style={styles.streakText}>
                    🔥 {xpData.streak} hari streak
                  </Text>
                </View>
                <LevelBadge xp={xpData.xp} size="md" />
              </View>
              <XPBar xp={xpData.xp} />
            </View>

            {/* ── History singkat ── */}
            {history.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Terakhir Ditonton</Text>
                <View style={{ gap: 10, marginTop: 10 }}>
                  {history.map((h, i) => (
                    <View key={i} style={styles.historyItem}>
                      <Image
                        source={{ uri: h.anime.image_poster }}
                        style={styles.historyThumb}
                        resizeMode="cover"
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.historyTitle} numberOfLines={1}>
                          {h.anime.title}
                        </Text>
                        <Text style={styles.historyEp}>
                          Episode {h.episodeIndex}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        ) : (
          /* ── Login prompt ── */
          <View style={styles.loginBox}>
            <Ionicons name="person-circle-outline" size={64} color="rgba(255,255,255,0.1)" />
            <Text style={styles.loginTitle}>Belum Login</Text>
            <Text style={styles.loginSub}>Login untuk simpan history & XP kamu</Text>
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              style={styles.loginBtn}
            >
              <Ionicons name="logo-google" size={18} color="#000" />
              <Text style={styles.loginBtnText}>
                {loading ? 'Memuat...' : 'Login dengan Google'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Settings ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pengaturan</Text>
          <View style={styles.settingRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="picture-in-picture-outline" size={18} color="rgba(255,255,255,0.5)" />
              <View>
                <Text style={styles.settingLabel}>Picture in Picture</Text>
                <Text style={styles.settingDesc}>Video tetap jalan saat minimize</Text>
              </View>
            </View>
            <Switch
              value={pip}
              onValueChange={togglePip}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: COLORS.gold }}
              thumbColor={pip ? '#000' : 'rgba(255,255,255,0.5)'}
            />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: COLORS.card, borderRadius: 14,
    padding: 14,
  },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  userName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  userEmail: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  logoutBtn: { padding: 4 },
  section: {
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: COLORS.card, borderRadius: 14, padding: 16,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.5)', fontSize: 11,
    fontWeight: '700', letterSpacing: 0.8,
    textTransform: 'uppercase', marginBottom: 12,
  },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  streakText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 },
  historyItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  historyThumb: { width: 36, aspectRatio: 3 / 4.5, borderRadius: 6 },
  historyTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
  historyEp: { color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 2 },
  loginBox: {
    alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: COLORS.card, borderRadius: 14,
    padding: 32,
  },
  loginTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 8 },
  loginSub: { color: 'rgba(255,255,255,0.35)', fontSize: 12, textAlign: 'center' },
  loginBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.gold, paddingHorizontal: 20,
    paddingVertical: 12, borderRadius: 12, marginTop: 8,
  },
  loginBtnText: { color: '#000', fontWeight: '800', fontSize: 14 },
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600' },
  settingDesc: { color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 1 },
});
