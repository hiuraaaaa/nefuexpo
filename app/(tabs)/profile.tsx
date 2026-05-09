import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  Switch, StyleSheet, Alert, Modal, TextInput, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { COLORS } from '@/constants';
import { signInWithGoogle, signOut, onAuthStateChanged, isAdmin } from '@/hooks/auth';
import { xpStorage, XPData, LEVELS } from '@/hooks/xp';
import { historyStorage, favoritStorage } from '@/hooks/storage';
import { XPBar } from '@/components/XPBar';
import { LevelBadge } from '@/components/LevelBadge';
import { HistoryItem, Anime } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';

const PIP_KEY = 'nefusoft_pip';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [xpData, setXpData] = useState<XPData>({ xp: 0, level: 1, streak: 0, lastWatchDate: '' });
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [favorites, setFavorites] = useState<Anime[]>([]);
  const [pip, setPip] = useState(false);
  const [loading, setLoading] = useState(false);
  const [admin, setAdmin] = useState(false);

  // Admin state
  const [showAdmin, setShowAdmin] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [xpInput, setXpInput] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(u => {
      setUser(u);
      setAdmin(isAdmin());
    });
    return unsub;
  }, []);

  useFocusEffect(useCallback(() => {
    xpStorage.get().then(setXpData);
    historyStorage.getAll().then(h => setHistory(h.slice(0, 5)));
    AsyncStorage.getItem(PIP_KEY).then(v => setPip(v === 'true'));
    if (user) favoritStorage.getAll().then(setFavorites);
  }, [user]));

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

  const loadAllUsers = async () => {
    setAdminLoading(true);
    try {
      const snap = await firestore().collection('users').orderBy('lastLoginAt', 'desc').get();
      setAllUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch {}
    setAdminLoading(false);
  };

  const handleSetXP = async () => {
    if (!selectedUser || !xpInput) return;
    const newXp = parseInt(xpInput);
    if (isNaN(newXp)) return;
    try {
      let newLevel = 1;
      for (const l of LEVELS) { if (newXp >= l.min) newLevel = l.level; }
      await firestore().collection('users').doc(selectedUser.id).update({
        xp: newXp, level: newLevel,
      });
      setAllUsers(prev => prev.map(u =>
        u.id === selectedUser.id ? { ...u, xp: newXp, level: newLevel } : u
      ));
      setShowUserModal(false);
      setXpInput('');
      Alert.alert('Berhasil', `XP ${selectedUser.displayName} diubah ke ${newXp}`);
    } catch {
      Alert.alert('Error', 'Gagal update XP');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          {admin && (
            <TouchableOpacity
              onPress={() => { setShowAdmin(true); loadAllUsers(); }}
              style={styles.adminBtn}
            >
              <Ionicons name="shield" size={14} color="#000" />
              <Text style={styles.adminBtnText}>Admin</Text>
            </TouchableOpacity>
          )}
        </View>

        {user ? (
          <>
            {/* User card */}
            <View style={styles.userCard}>
              <Image
                source={{ uri: user.photoURL ?? 'https://ui-avatars.com/api/?name=' + user.displayName }}
                style={styles.avatar}
              />
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.userName} numberOfLines={1}>{user.displayName}</Text>
                  {admin && (
                    <View style={styles.adminFlag}>
                      <Ionicons name="shield-checkmark" size={10} color="#000" />
                      <Text style={styles.adminFlagText}>ADMIN</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
                <LevelBadge xp={xpData.xp} size="sm" />
              </View>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </View>

            {/* XP & Level */}
            <View style={styles.section}>
              <View style={styles.xpHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Level & XP</Text>
                  <Text style={styles.streakText}>🔥 {xpData.streak} hari streak</Text>
                </View>
                <LevelBadge xp={xpData.xp} size="md" />
              </View>
              <XPBar xp={xpData.xp} />
            </View>

            {/* Favorit */}
            {favorites.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Favorit</Text>
                <View style={{ gap: 10, marginTop: 10 }}>
                  {favorites.slice(0, 5).map((a, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.historyItem}
                      onPress={() => router.push(`/watch/${a.id}`)}
                    >
                      <Image source={{ uri: a.image_poster }} style={styles.historyThumb} resizeMode="cover" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.historyTitle} numberOfLines={1}>{a.title}</Text>
                        <Text style={styles.historyEp}>{a.type} • {a.status}</Text>
                      </View>
                      <Ionicons name="bookmark" size={16} color={COLORS.gold} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* History */}
            {history.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Terakhir Ditonton</Text>
                <View style={{ gap: 10, marginTop: 10 }}>
                  {history.map((h, i) => (
                    <View key={i} style={styles.historyItem}>
                      <Image source={{ uri: h.anime.image_poster }} style={styles.historyThumb} resizeMode="cover" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.historyTitle} numberOfLines={1}>{h.anime.title}</Text>
                        <Text style={styles.historyEp}>Episode {h.episodeIndex}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        ) : (
          <View style={styles.loginBox}>
            <Ionicons name="person-circle-outline" size={64} color="rgba(255,255,255,0.1)" />
            <Text style={styles.loginTitle}>Belum Login</Text>
            <Text style={styles.loginSub}>Login untuk simpan history & XP kamu</Text>
            <TouchableOpacity onPress={handleLogin} disabled={loading} style={styles.loginBtn}>
              <Ionicons name="logo-google" size={18} color="#000" />
              <Text style={styles.loginBtnText}>{loading ? 'Memuat...' : 'Login dengan Google'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Settings */}
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

      {/* Admin Panel Modal */}
      <Modal visible={showAdmin} animationType="slide" onRequestClose={() => setShowAdmin(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
            <TouchableOpacity onPress={() => setShowAdmin(false)}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>Admin Panel</Text>
            <View style={styles.adminFlag}>
              <Ionicons name="shield-checkmark" size={10} color="#000" />
              <Text style={styles.adminFlagText}>ADMIN</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 16 }}>
            <View style={[styles.statCard, { flex: 1 }]}>
              <Text style={styles.statNum}>{allUsers.length}</Text>
              <Text style={styles.statLabel}>Total User</Text>
            </View>
            <View style={[styles.statCard, { flex: 1 }]}>
              <Text style={styles.statNum}>
                {allUsers.filter(u => {
                  const diff = Date.now() - (u.lastLoginAt ?? 0);
                  return diff < 7 * 24 * 60 * 60 * 1000;
                }).length}
              </Text>
              <Text style={styles.statLabel}>Aktif 7 Hari</Text>
            </View>
          </View>

          {/* User List */}
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700',
            letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 16, marginBottom: 8 }}>
            Semua User
          </Text>
          {adminLoading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: COLORS.gold }}>Memuat...</Text>
            </View>
          ) : (
            <FlatList
              data={allUsers}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.userRow}
                  onPress={() => { setSelectedUser(item); setXpInput(String(item.xp ?? 0)); setShowUserModal(true); }}
                >
                  <Image
                    source={{ uri: item.photoURL ?? `https://ui-avatars.com/api/?name=${item.displayName}` }}
                    style={{ width: 40, height: 40, borderRadius: 20 }}
                  />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }} numberOfLines={1}>
                        {item.displayName}
                      </Text>
                      {item.isAdmin && (
                        <View style={styles.adminFlag}>
                          <Text style={styles.adminFlagText}>ADMIN</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>{item.email}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: COLORS.gold, fontWeight: '900', fontSize: 12 }}>
                      Lv {item.level ?? 1}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>
                      {item.xp ?? 0} XP
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* Edit User XP Modal */}
      <Modal visible={showUserModal} transparent animationType="slide" onRequestClose={() => setShowUserModal(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }}
          activeOpacity={1} onPress={() => setShowUserModal(false)}>
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0,
            backgroundColor: COLORS.card, borderTopLeftRadius: 20, borderTopRightRadius: 20,
            padding: 24, paddingBottom: 40 }}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, marginBottom: 4 }}>
              {selectedUser?.displayName}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 20 }}>
              {selectedUser?.email}
            </Text>

            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700',
              textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
              Set XP
            </Text>
            <TextInput
              value={xpInput}
              onChangeText={setXpInput}
              keyboardType="numeric"
              placeholder="Masukkan jumlah XP"
              placeholderTextColor="rgba(255,255,255,0.2)"
              style={{ backgroundColor: COLORS.bg, color: '#fff', borderRadius: 10,
                paddingHorizontal: 14, paddingVertical: 12, fontSize: 16,
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 16 }}
            />

            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginBottom: 16 }}>
              {LEVELS.map(l => `Lv${l.level}: ${l.min} XP`).join('  •  ')}
            </Text>

            <TouchableOpacity onPress={handleSetXP} style={styles.loginBtn}>
              <Text style={styles.loginBtnText}>Simpan</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  adminBtn: { flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.gold, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  adminBtnText: { color: '#000', fontSize: 11, fontWeight: '900' },
  adminFlag: { flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: COLORS.gold, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  adminFlagText: { color: '#000', fontSize: 9, fontWeight: '900' },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginBottom: 16, backgroundColor: COLORS.card,
    borderRadius: 14, padding: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  userName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  userEmail: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  logoutBtn: { padding: 4 },
  section: { marginHorizontal: 16, marginBottom: 16,
    backgroundColor: COLORS.card, borderRadius: 14, padding: 16 },
  sectionTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 11,
    fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 12 },
  streakText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 },
  historyItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  historyThumb: { width: 36, aspectRatio: 3 / 4.5, borderRadius: 6 },
  historyTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
  historyEp: { color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 2 },
  loginBox: { alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 16,
    backgroundColor: COLORS.card, borderRadius: 14, padding: 32 },
  loginTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 8 },
  loginSub: { color: 'rgba(255,255,255,0.35)', fontSize: 12, textAlign: 'center' },
  loginBtn: { flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.gold, paddingHorizontal: 20,
    paddingVertical: 12, borderRadius: 12, marginTop: 8, justifyContent: 'center' },
  loginBtnText: { color: '#000', fontWeight: '800', fontSize: 14 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600' },
  settingDesc: { color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 1 },
  statCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, alignItems: 'center' },
  statNum: { color: COLORS.gold, fontSize: 28, fontWeight: '900' },
  statLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '700', marginTop: 2 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.card, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
});
