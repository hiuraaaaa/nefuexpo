import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  Switch, Alert, Modal, TextInput,
  FlatList, Dimensions,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
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

const { width } = Dimensions.get('window');
const PIP_KEY = 'nefusoft_pip';

const THEME_COLS = 4;
const THEME_GAP  = 10;
const THEME_PAD  = 16;
const THEME_W    = (width - THEME_PAD * 2 - THEME_GAP * (THEME_COLS - 1)) / THEME_COLS;

// ── Section Wrapper ────────────────────────────────────────────────────────────
function Section({ children, style, delay = 0 }: {
  children: React.ReactNode; style?: object; delay?: number;
}) {
  const theme = useTheme();
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      style={[{
        marginHorizontal: 16, marginBottom: 12, borderRadius: 16,
        backgroundColor: theme.card, padding: 16,
        borderWidth: 1, borderColor: theme.border,
      }, style]}
    >
      {children}
    </Animated.View>
  );
}

function SectionLabel({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <Text style={{
      color: theme.subtext, fontSize: 10, fontWeight: '800',
      letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14,
    }}>
      {label}
    </Text>
  );
}

function Divider() {
  const theme = useTheme();
  return <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 12 }} />;
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();
  const theme  = useTheme();

  // ✅ Safe default values — prevent crash kalau data belum ready
  const [user, setUser]         = useState<any>(null);
  const [xpData, setXpData]     = useState<XPData>({ xp: 0, level: 1, streak: 0, lastWatchDate: '', _todayXP: 0 });
  const [history, setHistory]   = useState<HistoryItem[]>([]);
  const [favorites, setFavorites] = useState<Anime[]>([]);
  const [pip, setPip]           = useState(false);
  const [loading, setLoading]   = useState(false);
  const [admin, setAdmin]       = useState(false);
  const [dataReady, setDataReady] = useState(false);

  const [showAdmin, setShowAdmin]           = useState(false);
  const [allUsers, setAllUsers]             = useState<any[]>([]);
  const [adminLoading, setAdminLoading]     = useState(false);
  const [selectedUser, setSelectedUser]     = useState<any>(null);
  const [xpInput, setXpInput]               = useState('');
  const [showUserModal, setShowUserModal]   = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged((u: any) => {
      setUser(u);
      setAdmin(isAdmin());
    });
    return unsub;
  }, []);

  // ✅ useFocusEffect dengan proper error handling — prevent FC dari async throw
  useFocusEffect(useCallback(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const [xp, hist, pipVal] = await Promise.all([
          xpStorage.get().catch(() => ({ xp: 0, level: 1, streak: 0, lastWatchDate: '', _todayXP: 0 })),
          Promise.resolve(historyStorage.getAll()).catch(() => []),
          AsyncStorage.getItem(PIP_KEY).catch(() => null),
        ]);

        if (!mounted) return;

        setXpData(xp as XPData);
        // ✅ guard array — historyStorage.getAll() bisa return null/undefined
        setHistory(Array.isArray(hist) ? (hist as HistoryItem[]).slice(0, 5) : []);
        setPip(pipVal === 'true');
      } catch {}

      if (!mounted) return;
      setDataReady(true);
    };

    loadData();
    return () => { mounted = false; };
  }, []));

  // ✅ Favorites di-load terpisah — butuh user, ga perlu blocking main load
  useEffect(() => {
    if (!user) { setFavorites([]); return; }
    let mounted = true;
    favoritStorage.getAll()
      .then(favs => { if (mounted) setFavorites(Array.isArray(favs) ? favs : []); })
      .catch(() => { if (mounted) setFavorites([]); });
    return () => { mounted = false; };
  }, [user]);

  const handleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try { await signInWithGoogle(); } catch {}
    setLoading(false);
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Logout', 'Yakin mau logout?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: signOut },
    ]);
  };

  const togglePip = async (val: boolean) => {
    Haptics.selectionAsync();
    setPip(val);
    await AsyncStorage.setItem(PIP_KEY, String(val));
  };

  const loadAllUsers = async () => {
    setAdminLoading(true);
    try {
      // Tanpa orderBy biar ga crash kalau ada doc lama yg ga punya field lastLoginAt
      const snap = await firestore().collection('users').get();
      const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort di client
      users.sort((a: any, b: any) => (b.lastLoginAt ?? 0) - (a.lastLoginAt ?? 0));
      setAllUsers(users);
    } catch (e) {
      console.error('[Admin] loadAllUsers error:', e);
      Alert.alert('Error', 'Gagal memuat data user: ' + String(e));
    }
    setAdminLoading(false);
  };

  const handleSetXP = async () => {
    if (!selectedUser || !xpInput) return;
    const newXp = parseInt(xpInput);
    if (isNaN(newXp)) return;
    try {
      let newLevel = 1;
      for (const l of LEVELS) { if (newXp >= l.min) newLevel = l.level; }
      await firestore().collection('users').doc(selectedUser.id)
        .update({ xp: newXp, level: newLevel });
      setAllUsers(prev => prev.map(u =>
        u.id === selectedUser.id ? { ...u, xp: newXp, level: newLevel } : u
      ));
      setShowUserModal(false);
      setXpInput('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Berhasil', `XP ${selectedUser.displayName} diubah ke ${newXp}`);
    } catch {
      Alert.alert('Error', 'Gagal update XP');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── Header ── */}
        <View style={{
          paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Text style={{ color: theme.text, fontWeight: '900', fontSize: 28, letterSpacing: -0.5 }}>
            Profile
          </Text>
          {admin && (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowAdmin(true);
                loadAllUsers();
              }}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                backgroundColor: theme.accent, paddingHorizontal: 10,
                paddingVertical: 6, borderRadius: 8,
              }}
            >
              <Ionicons name="shield" size={13} color="#000" />
              <Text style={{ color: '#000', fontSize: 11, fontWeight: '900' }}>Admin</Text>
            </TouchableOpacity>
          )}
        </View>

        {user ? (
          <>
            {/* ── User Card ── */}
            <Animated.View
              entering={FadeInDown.delay(0).springify()}
              style={{
                marginHorizontal: 16, marginBottom: 12, borderRadius: 16,
                overflow: 'hidden', backgroundColor: theme.card,
                borderWidth: 1, borderColor: theme.border,
              }}
            >
              <LinearGradient
                colors={[theme.accentDim, 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}>
                <FastImage
                  source={{ uri: user.photoURL ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName ?? 'User')}` }}
                  style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: theme.accent }}
                />
                <View style={{ flex: 1, gap: 3 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800' }}
                      numberOfLines={1}>{user.displayName}</Text>
                    {admin && (
                      <View style={{
                        flexDirection: 'row', alignItems: 'center', gap: 3,
                        backgroundColor: theme.accent, paddingHorizontal: 5,
                        paddingVertical: 2, borderRadius: 4,
                      }}>
                        <Ionicons name="shield-checkmark" size={9} color="#000" />
                        <Text style={{ color: '#000', fontSize: 8, fontWeight: '900' }}>ADMIN</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ color: theme.subtext, fontSize: 11 }} numberOfLines={1}>
                    {user.email}
                  </Text>
                  <LevelBadge xp={xpData.xp} size="sm" />
                </View>
                <TouchableOpacity
                  onPress={handleLogout}
                  style={{
                    width: 36, height: 36, borderRadius: 18, alignItems: 'center',
                    justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)',
                  }}
                >
                  <Ionicons name="log-out-outline" size={18} color={theme.subtext} />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* ── XP & Level ── */}
            <Section delay={60}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 14 }}>
                <View>
                  <SectionLabel label="Level & XP" />
                  <Text style={{ color: theme.subtext, fontSize: 11, marginTop: -10 }}>
                    🔥 {xpData.streak} hari streak
                  </Text>
                </View>
                <LevelBadge xp={xpData.xp} size="md" />
              </View>
              <XPBar xp={xpData.xp} />
            </Section>

            {/* ── Favorit ── */}
            {favorites.length > 0 && (
              <Section delay={120}>
                <SectionLabel label="Favorit" />
                <View style={{ gap: 12 }}>
                  {favorites.slice(0, 5).map((a, i) => (
                    <TouchableOpacity
                      key={`fav-${i}`}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push(`/watch/${a.id}`);
                      }}
                    >
                      <FastImage
                        source={{ uri: a.image_poster, priority: FastImage.priority.normal }}
                        style={{ width: 36, aspectRatio: 3/4.5, borderRadius: 6 }}
                        resizeMode={FastImage.resizeMode.cover}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.text, fontSize: 12, fontWeight: '600' }}
                          numberOfLines={1}>{a.title}</Text>
                        <Text style={{ color: theme.subtext, fontSize: 10, marginTop: 2 }}>
                          {a.type} • {a.status}
                        </Text>
                      </View>
                      <Ionicons name="bookmark" size={15} color={theme.accent} />
                    </TouchableOpacity>
                  ))}
                </View>
              </Section>
            )}

            {/* ── History ── */}
            {history.length > 0 && (
              <Section delay={180}>
                <SectionLabel label="Terakhir Ditonton" />
                <View style={{ gap: 12 }}>
                  {history.map((h, i) => (
                    <TouchableOpacity
                      key={`hist-${i}`}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push(`/watch/${h.anime.id}`);
                      }}
                    >
                      <FastImage
                        source={{ uri: h.anime.image_poster, priority: FastImage.priority.low }}
                        style={{ width: 36, aspectRatio: 3/4.5, borderRadius: 6 }}
                        resizeMode={FastImage.resizeMode.cover}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.text, fontSize: 12, fontWeight: '600' }}
                          numberOfLines={1}>{h.anime.title}</Text>
                        <Text style={{ color: theme.subtext, fontSize: 10, marginTop: 2 }}>
                          Episode {h.episodeIndex}
                        </Text>
                      </View>
                      <Ionicons name="time-outline" size={14} color={theme.subtext} />
                    </TouchableOpacity>
                  ))}
                </View>
              </Section>
            )}
          </>
        ) : (
          /* ── Login Box ── */
          <Animated.View
            entering={FadeInDown.delay(60).springify()}
            style={{
              marginHorizontal: 16, marginBottom: 12, borderRadius: 16,
              overflow: 'hidden', backgroundColor: theme.card,
              padding: 32, alignItems: 'center', gap: 8,
              borderWidth: 1, borderColor: theme.border,
            }}
          >
            <LinearGradient
              colors={[theme.accentDim, 'transparent']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <Ionicons name="person-circle-outline" size={64} color={theme.subtext} />
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800', marginTop: 4 }}>
              Belum Login
            </Text>
            <Text style={{ color: theme.subtext, fontSize: 12, textAlign: 'center' }}>
              Login untuk simpan history & XP kamu
            </Text>
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                backgroundColor: theme.accent, paddingHorizontal: 20,
                paddingVertical: 12, borderRadius: 10, marginTop: 8,
              }}
            >
              <Ionicons name="logo-google" size={16} color="#000" />
              <Text style={{ color: '#000', fontWeight: '800', fontSize: 14 }}>
                {loading ? 'Memuat...' : 'Login dengan Google'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── Pengaturan ── */}
        <Section delay={240}>
          <SectionLabel label="Pengaturan" />

          {/* PiP */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{
                width: 32, height: 32, borderRadius: 8, alignItems: 'center',
                justifyContent: 'center', backgroundColor: theme.border,
              }}>
                <Ionicons name="picture-in-picture-outline" size={16} color={theme.subtext} />
              </View>
              <View>
                <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }}>
                  Picture in Picture
                </Text>
                <Text style={{ color: theme.subtext, fontSize: 10, marginTop: 1 }}>
                  Video tetap jalan saat minimize
                </Text>
              </View>
            </View>
            <Switch
              value={pip}
              onValueChange={togglePip}
              trackColor={{ false: theme.border, true: theme.accent }}
              thumbColor={pip ? '#000' : theme.subtext}
            />
          </View>

          <Divider />

          {/* Tema */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <View style={{
              width: 32, height: 32, borderRadius: 8, alignItems: 'center',
              justifyContent: 'center', backgroundColor: theme.border,
            }}>
              <Ionicons name="color-palette-outline" size={16} color={theme.subtext} />
            </View>
            <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }}>Tema</Text>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: THEME_GAP }}>
            {THEMES.map(t => (
              <TouchableOpacity
                key={t.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  setGlobalTheme(t.id);
                }}
                style={{
                  width: THEME_W, borderRadius: 10, padding: 8,
                  backgroundColor: t.bg, position: 'relative',
                  borderWidth: theme.id === t.id ? 2 : 1,
                  borderColor: theme.id === t.id ? t.accent : 'rgba(255,255,255,0.06)',
                }}
              >
                <View style={{ gap: 3, marginBottom: 6 }}>
                  <View style={{ height: 5, borderRadius: 3, backgroundColor: t.accent, width: '70%' }} />
                  <View style={{ height: 3, borderRadius: 2, backgroundColor: t.card, width: '100%' }} />
                  <View style={{ height: 3, borderRadius: 2, backgroundColor: t.card, width: '80%' }} />
                </View>
                <View style={{ flexDirection: 'row', gap: 3 }}>
                  <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: t.accent }} />
                  <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: t.card }} />
                </View>
                <Text style={{ color: t.text, fontSize: 8, fontWeight: '700', marginTop: 5 }}
                  numberOfLines={1}>{t.name}</Text>
                {theme.id === t.id && (
                  <View style={{
                    position: 'absolute', top: 4, right: 4,
                    width: 14, height: 14, borderRadius: 7,
                    backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Ionicons name="checkmark" size={8} color="#000" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Section>

      </ScrollView>

      {/* ── Admin Panel Modal ── */}
      <Modal visible={showAdmin} animationType="slide" onRequestClose={() => setShowAdmin(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>

          <View style={{
            flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: 16, paddingVertical: 14, gap: 12,
          }}>
            <TouchableOpacity
              onPress={() => setShowAdmin(false)}
              style={{
                width: 36, height: 36, borderRadius: 10, alignItems: 'center',
                justifyContent: 'center', backgroundColor: theme.card,
              }}
            >
              <Ionicons name="arrow-back" size={20} color={theme.text} />
            </TouchableOpacity>
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: '900', flex: 1 }}>
              Admin Panel
            </Text>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 3,
              backgroundColor: theme.accent, paddingHorizontal: 8,
              paddingVertical: 4, borderRadius: 6,
            }}>
              <Ionicons name="shield-checkmark" size={11} color="#000" />
              <Text style={{ color: '#000', fontSize: 10, fontWeight: '900' }}>ADMIN</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 16 }}>
            {[
              { label: 'Total User', value: allUsers.length },
              {
                label: 'Aktif 7 Hari',
                value: allUsers.filter(u =>
                  Date.now() - (u.lastLoginAt ?? 0) < 7 * 24 * 60 * 60 * 1000
                ).length,
              },
            ].map((s, i) => (
              <View key={i} style={{
                flex: 1, backgroundColor: theme.card,
                borderRadius: 12, padding: 16, alignItems: 'center',
                borderWidth: 1, borderColor: theme.border,
              }}>
                <Text style={{ color: theme.accent, fontSize: 28, fontWeight: '900' }}>
                  {s.value}
                </Text>
                <Text style={{ color: theme.subtext, fontSize: 11, fontWeight: '700', marginTop: 2 }}>
                  {s.label}
                </Text>
              </View>
            ))}
          </View>

          <Text style={{
            color: theme.subtext, fontSize: 10, fontWeight: '800',
            letterSpacing: 1.5, textTransform: 'uppercase',
            paddingHorizontal: 16, marginBottom: 10,
          }}>
            Semua User
          </Text>

          {adminLoading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: theme.accent, fontWeight: '700' }}>Memuat...</Text>
            </View>
          ) : (
            <FlatList
              data={allUsers}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 8 }}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              windowSize={5}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    backgroundColor: theme.card, borderRadius: 12, padding: 12,
                    borderWidth: 1, borderColor: theme.border,
                  }}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedUser(item);
                    setXpInput(String(item.xp ?? 0));
                    setShowUserModal(true);
                  }}
                >
                  <FastImage
                    source={{ uri: item.photoURL ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(item.displayName ?? 'User')}` }}
                    style={{ width: 40, height: 40, borderRadius: 20 }}
                  />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}
                        numberOfLines={1}>{item.displayName}</Text>
                      {item.isAdmin && (
                        <View style={{
                          backgroundColor: theme.accent,
                          paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4,
                        }}>
                          <Text style={{ color: '#000', fontSize: 8, fontWeight: '900' }}>ADMIN</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: theme.subtext, fontSize: 10, marginTop: 2 }}>
                      {item.email}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: theme.accent, fontWeight: '900', fontSize: 13 }}>
                      Lv {item.level ?? 1}
                    </Text>
                    <Text style={{ color: theme.subtext, fontSize: 10, marginTop: 2 }}>
                      {item.xp ?? 0} XP
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* ── Edit XP Modal ── */}
      <Modal visible={showUserModal} transparent animationType="slide"
        onRequestClose={() => setShowUserModal(false)}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={() => setShowUserModal(false)}
        >
          {/* ✅ BlurView buat backdrop modal */}
          <BlurView intensity={30} tint="dark" style={{ flex: 1 }}>
            <View style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              backgroundColor: `${theme.card}f5`,
              borderTopLeftRadius: 20, borderTopRightRadius: 20,
              padding: 24, paddingBottom: 40,
              borderWidth: 1, borderColor: theme.border,
            }}>
              {/* Handle bar */}
              <View style={{
                width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.15)',
                borderRadius: 2, alignSelf: 'center', marginBottom: 16,
              }} />

              <Text style={{ color: theme.text, fontWeight: '900', fontSize: 16, marginBottom: 2 }}>
                {selectedUser?.displayName}
              </Text>
              <Text style={{ color: theme.subtext, fontSize: 11, marginBottom: 20 }}>
                {selectedUser?.email}
              </Text>

              <Text style={{
                color: theme.subtext, fontSize: 10, fontWeight: '800',
                textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
              }}>
                Set XP
              </Text>
              <TextInput
                value={xpInput}
                onChangeText={setXpInput}
                keyboardType="numeric"
                placeholder="Masukkan jumlah XP"
                placeholderTextColor={theme.subtext}
                style={{
                  backgroundColor: theme.bg, color: theme.text, borderRadius: 10,
                  paddingHorizontal: 14, paddingVertical: 12, fontSize: 16,
                  borderWidth: 1, borderColor: theme.border, marginBottom: 12,
                }}
              />
              <Text style={{ color: theme.subtext, fontSize: 10, marginBottom: 16, lineHeight: 16 }}>
                {LEVELS.map(l => `Lv${l.level}: ${l.min} XP`).join('  ·  ')}
              </Text>
              <TouchableOpacity
                onPress={handleSetXP}
                style={{
                  backgroundColor: theme.accent, paddingVertical: 14,
                  borderRadius: 10, alignItems: 'center',
                }}
              >
                <Text style={{ color: '#000', fontWeight: '900', fontSize: 14 }}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}
