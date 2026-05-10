import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  Switch, StyleSheet, Alert, Modal, TextInput, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { COLORS, THEMES } from '@/constants';
import { signInWithGoogle, signOut, onAuthStateChanged, isAdmin } from '@/hooks/auth';
import { xpStorage, XPData, LEVELS } from '@/hooks/xp';
import { historyStorage, favoritStorage } from '@/hooks/storage';
import { useTheme, setGlobalTheme } from '@/hooks/theme';
import { XPBar } from '@/components/XPBar';
import { LevelBadge } from '@/components/LevelBadge';
import { HistoryItem, Anime } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';

const PIP_KEY = 'nefusoft_pip';

export default function ProfileScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [user, setUser] = useState<any>(null);
  const [xpData, setXpData] = useState<XPData>({ xp: 0, level: 1, streak: 0, lastWatchDate: '' });
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [favorites, setFavorites] = useState<Anime[]>([]);
  const [pip, setPip] = useState(false);
  const [loading, setLoading] = useState(false);
  const [admin, setAdmin] = useState(false);

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
      await firestore().collection('users').doc(selectedUser.id).update({ xp: newXp, level: newLevel });
      setAllUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, xp: newXp, level: newLevel } : u));
      setShowUserModal(false);
      setXpInput('');
      Alert.alert('Berhasil', `XP ${selectedUser.displayName} diubah ke ${newXp}`);
    } catch {
      Alert.alert('Error', 'Gagal update XP');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
          {admin && (
            <TouchableOpacity
              onPress={() => { setShowAdmin(true); loadAllUsers(); }}
              style={[styles.adminBtn, { backgroundColor: theme.accent }]}
            >
              <Ionicons name="shield" size={14} color="#000" />
              <Text style={styles.adminBtnText}>Admin</Text>
            </TouchableOpacity>
          )}
        </View>

        {user ? (
          <>
            {/* User card */}
            <View style={[styles.userCard, { backgroundColor: theme.card }]}>
              <Image
                source={{ uri: user.photoURL ?? 'https://ui-avatars.com/api/?name=' + user.displayName }}
                style={styles.avatar}
              />
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>{user.displayName}</Text>
                  {admin && (
                    <View style={[styles.adminFlag, { backgroundColor: theme.accent }]}>
                      <Ionicons name="shield-checkmark" size={10} color="#000" />
                      <Text style={styles.adminFlagText}>ADMIN</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.userEmail, { color: theme.subtext }]} numberOfLines={1}>{user.email}</Text>
                <LevelBadge xp={xpData.xp} size="sm" />
              </View>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                <Ionicons name="log-out-outline" size={20} color={theme.subtext} />
              </TouchableOpacity>
            </View>

            {/* XP & Level */}
            <View style={[styles.section, { backgroundColor: theme.card }]}>
              <View style={styles.xpHeader}>
                <View>
                  <Text style={[styles.sectionTitle, { color: theme.subtext }]}>Level & XP</Text>
                  <Text style={[styles.streakText, { color: theme.subtext }]}>🔥 {xpData.streak} hari streak</Text>
                </View>
                <LevelBadge xp={xpData.xp} size="md" />
              </View>
              <XPBar xp={xpData.xp} />
            </View>

            {/* Favorit */}
            {favorites.length > 0 && (
              <View style={[styles.section, { backgroundColor: theme.card }]}>
                <Text style={[styles.sectionTitle, { color: theme.subtext }]}>Favorit</Text>
                <View style={{ gap: 10, marginTop: 10 }}>
                  {favorites.slice(0, 5).map((a, i) => (
                    <TouchableOpacity key={i} style={styles.historyItem} onPress={() => router.push(`/watch/${a.id}`)}>
                      <Image source={{ uri: a.image_poster }} style={styles.historyThumb} resizeMode="cover" />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.historyTitle, { color: theme.text }]} numberOfLines={1}>{a.title}</Text>
                        <Text style={[styles.historyEp, { color: theme.subtext }]}>{a.type} • {a.status}</Text>
                      </View>
                      <Ionicons name="bookmark" size={16} color={theme.accent} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* History */}
            {history.length > 0 && (
              <View style={[styles.section, { backgroundColor: theme.card }]}>
                <Text style={[styles.sectionTitle, { color: theme.subtext }]}>Terakhir Ditonton</Text>
                <View style={{ gap: 10, marginTop: 10 }}>
                  {history.map((h, i) => (
                    <View key={i} style={styles.historyItem}>
                      <Image source={{ uri: h.anime.image_poster }} style={styles.historyThumb} resizeMode="cover" />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.historyTitle, { color: theme.text }]} numberOfLines={1}>{h.anime.title}</Text>
                        <Text style={[styles.historyEp, { color: theme.subtext }]}>Episode {h.episodeIndex}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        ) : (
          <View style={[styles.loginBox, { backgroundColor: theme.card }]}>
            <Ionicons name="person-circle-outline" size={64} color={theme.subtext} />
            <Text style={[styles.loginTitle, { color: theme.text }]}>Belum Login</Text>
            <Text style={[styles.loginSub, { color: theme.subtext }]}>Login untuk simpan history & XP kamu</Text>
            <TouchableOpacity onPress={handleLogin} disabled={loading} style={[styles.loginBtn, { backgroundColor: theme.accent }]}>
              <Ionicons name="logo-google" size={18} color="#000" />
              <Text style={styles.loginBtnText}>{loading ? 'Memuat...' : 'Login dengan Google'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Settings */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.subtext }]}>Pengaturan</Text>

          {/* PiP */}
          <View style={[styles.settingRow, { marginBottom: 16 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="picture-in-picture-outline" size={18} color={theme.subtext} />
              <View>
                <Text style={[styles.settingLabel, { color: theme.text }]}>Picture in Picture</Text>
                <Text style={[styles.settingDesc, { color: theme.subtext }]}>Video tetap jalan saat minimize</Text>
              </View>
            </View>
            <Switch
              value={pip}
              onValueChange={togglePip}
              trackColor={{ false: theme.border, true: theme.accent }}
              thumbColor={pip ? '#000' : theme.subtext}
            />
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: theme.border, marginBottom: 16 }} />

          {/* Tema */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Ionicons name="color-palette-outline" size={18} color={theme.subtext} />
            <Text style={[styles.settingLabel, { color: theme.text }]}>Tema</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {THEMES.map(t => (
              <TouchableOpacity
                key={t.id}
                onPress={() => setGlobalTheme(t.id)}
                style={[
                  styles.themeCard,
                  {
                    backgroundColor: t.bg,
                    borderColor: theme.id === t.id ? t.accent : 'transparent',
                    borderWidth: theme.id === t.id ? 2 : 1,
                  }
                ]}
              >
                {/* Mini preview */}
                <View style={{ gap: 4 }}>
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: t.accent, width: '70%' }} />
                  <View style={{ height: 4, borderRadius: 2, backgroundColor: t.card, width: '100%' }} />
                  <View style={{ height: 4, borderRadius: 2, backgroundColor: t.card, width: '80%' }} />
                </View>
                {/* Dot accent */}
                <View style={{ flexDirection: 'row', gap: 3, marginTop: 4 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.accent }} />
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.card }} />
                </View>
                {/* Checkmark */}
                {theme.id === t.id && (
                  <View style={[styles.themeCheck, { backgroundColor: t.accent }]}>
                    <Ionicons name="checkmark" size={8} color="#000" />
                  </View>
                )}
                <Text style={{ color: t.text, fontSize: 9, fontWeight: '700', marginTop: 4 }} numberOfLines={1}>
                  {t.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* Admin Panel Modal */}
      <Modal visible={showAdmin} animationType="slide" onRequestClose={() => setShowAdmin(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
            <TouchableOpacity onPress={() => setShowAdmin(false)}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: '900' }}>Admin Panel</Text>
            <View style={[styles.adminFlag, { backgroundColor: theme.accent }]}>
              <Ionicons name="shield-checkmark" size={10} color="#000" />
              <Text style={styles.adminFlagText}>ADMIN</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 16 }}>
            <View style={[styles.statCard, { flex: 1, backgroundColor: theme.card }]}>
              <Text style={[styles.statNum, { color: theme.accent }]}>{allUsers.length}</Text>
              <Text style={[styles.statLabel, { color: theme.subtext }]}>Total User</Text>
            </View>
            <View style={[styles.statCard, { flex: 1, backgroundColor: theme.card }]}>
              <Text style={[styles.statNum, { color: theme.accent }]}>
                {allUsers.filter(u => Date.now() - (u.lastLoginAt ?? 0) < 7 * 24 * 60 * 60 * 1000).length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.subtext }]}>Aktif 7 Hari</Text>
            </View>
          </View>

          <Text style={{ color: theme.subtext, fontSize: 11, fontWeight: '700',
            letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 16, marginBottom: 8 }}>
            Semua User
          </Text>
          {adminLoading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: theme.accent }}>Memuat...</Text>
            </View>
          ) : (
            <FlatList
              data={allUsers}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.userRow, { backgroundColor: theme.card, borderColor: theme.border }]}
                  onPress={() => { setSelectedUser(item); setXpInput(String(item.xp ?? 0)); setShowUserModal(true); }}
                >
                  <Image
                    source={{ uri: item.photoURL ?? `https://ui-avatars.com/api/?name=${item.displayName}` }}
                    style={{ width: 40, height: 40, borderRadius: 20 }}
                  />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }} numberOfLines={1}>
                        {item.displayName}
                      </Text>
                      {item.isAdmin && (
                        <View style={[styles.adminFlag, { backgroundColor: theme.accent }]}>
                          <Text style={styles.adminFlagText}>ADMIN</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: theme.subtext, fontSize: 10 }}>{item.email}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: theme.accent, fontWeight: '900', fontSize: 12 }}>Lv {item.level ?? 1}</Text>
                    <Text style={{ color: theme.subtext, fontSize: 10 }}>{item.xp ?? 0} XP</Text>
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
            backgroundColor: theme.card, borderTopLeftRadius: 20, borderTopRightRadius: 20,
            padding: 24, paddingBottom: 40 }}>
            <Text style={{ color: theme.text, fontWeight: '900', fontSize: 16, marginBottom: 4 }}>
              {selectedUser?.displayName}
            </Text>
            <Text style={{ color: theme.subtext, fontSize: 11, marginBottom: 20 }}>
              {selectedUser?.email}
            </Text>
            <Text style={{ color: theme.subtext, fontSize: 11, fontWeight: '700',
              textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Set XP</Text>
            <TextInput
              value={xpInput}
              onChangeText={setXpInput}
              keyboardType="numeric"
              placeholder="Masukkan jumlah XP"
              placeholderTextColor={theme.subtext}
              style={{ backgroundColor: theme.bg, color: theme.text, borderRadius: 10,
                paddingHorizontal: 14, paddingVertical: 12, fontSize: 16,
                borderWidth: 1, borderColor: theme.border, marginBottom: 16 }}
            />
            <Text style={{ color: theme.subtext, fontSize: 11, marginBottom: 16 }}>
              {LEVELS.map(l => `Lv${l.level}: ${l.min} XP`).join('  •  ')}
            </Text>
            <TouchableOpacity onPress={handleSetXP} style={[styles.loginBtn, { backgroundColor: theme.accent }]}>
              <Text style={styles.loginBtnText}>Simpan</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  adminBtn: { flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  adminBtnText: { color: '#000', fontSize: 11, fontWeight: '900' },
  adminFlag: { flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  adminFlagText: { color: '#000', fontSize: 9, fontWeight: '900' },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginBottom: 16, borderRadius: 14, padding: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  userName: { fontSize: 15, fontWeight: '700' },
  userEmail: { fontSize: 11 },
  logoutBtn: { padding: 4 },
  section: { marginHorizontal: 16, marginBottom: 16, borderRadius: 14, padding: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8,
    textTransform: 'uppercase', marginBottom: 12 },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 12 },
  streakText: { fontSize: 11, marginTop: 2 },
  historyItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  historyThumb: { width: 36, aspectRatio: 3 / 4.5, borderRadius: 6 },
  historyTitle: { fontSize: 12, fontWeight: '600' },
  historyEp: { fontSize: 10, marginTop: 2 },
  loginBox: { alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 16,
    borderRadius: 14, padding: 32 },
  loginTitle: { fontSize: 18, fontWeight: '800', marginTop: 8 },
  loginSub: { fontSize: 12, textAlign: 'center' },
  loginBtn: { flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 8, justifyContent: 'center' },
  loginBtnText: { color: '#000', fontWeight: '800', fontSize: 14 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingLabel: { fontSize: 13, fontWeight: '600' },
  settingDesc: { fontSize: 10, marginTop: 1 },
  statCard: { borderRadius: 12, padding: 16, alignItems: 'center' },
  statNum: { fontSize: 28, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, padding: 12, borderWidth: 1 },
  themeCard: { width: 72, borderRadius: 10, padding: 8, position: 'relative' },
  themeCheck: { position: 'absolute', top: 4, right: 4, width: 14, height: 14,
    borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
});
