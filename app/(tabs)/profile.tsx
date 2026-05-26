import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Switch,
  Alert, Modal, TextInput, FlatList, Dimensions,
  Linking, StyleSheet,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <Text style={{
      color: theme.subtext, fontSize: 10, fontWeight: '800',
      letterSpacing: 1.5, textTransform: 'uppercase',
      marginBottom: 10, marginTop: 4,
      paddingHorizontal: 16,
    }}>
      {label}
    </Text>
  );
}

function SettingRow({
  icon, label, subtitle, onPress, right, last = false,
}: {
  icon: string; label: string; subtitle?: string;
  onPress?: () => void; right?: React.ReactNode; last?: boolean;
}) {
  const theme = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: last ? 0 : 1, borderBottomColor: theme.border,
      }}
    >
      <View style={{
        width: 34, height: 34, borderRadius: 9,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: theme.accentDim,
      }}>
        <Ionicons name={icon as any} size={17} color={theme.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }}>{label}</Text>
        {subtitle && (
          <Text style={{ color: theme.subtext, fontSize: 10, marginTop: 1 }}>{subtitle}</Text>
        )}
      </View>
      {right ?? <Ionicons name="chevron-forward" size={16} color={theme.subtext} />}
    </TouchableOpacity>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  const theme = useTheme();
  return (
    <View style={[{
      marginHorizontal: 16, marginBottom: 8,
      backgroundColor: theme.card, borderRadius: 16,
      borderWidth: 1, borderColor: theme.border,
      overflow: 'hidden',
    }, style]}>
      {children}
    </View>
  );
}

// ── Theme Picker Modal ────────────────────────────────────────────────────────

function ThemePickerModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const theme = useTheme();
  const CARD_W = 110;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose}>
        <BlurView intensity={40} tint="dark" style={{ flex: 1, justifyContent: 'flex-end' }}>
          <TouchableOpacity activeOpacity={1}>
            <View style={{
              backgroundColor: theme.card,
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              paddingBottom: 40, paddingTop: 16,
              borderWidth: 1, borderColor: theme.border,
            }}>
              {/* Handle */}
              <View style={{
                width: 40, height: 4, borderRadius: 2,
                backgroundColor: 'rgba(255,255,255,0.15)',
                alignSelf: 'center', marginBottom: 20,
              }} />

              <Text style={{
                color: theme.text, fontSize: 16, fontWeight: '900',
                paddingHorizontal: 20, marginBottom: 16,
              }}>
                Pilih Tema
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
              >
                {THEMES.map(t => {
                  const isActive = theme.id === t.id;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setGlobalTheme(t.id);
                      }}
                      style={{
                        width: CARD_W, borderRadius: 14, padding: 12,
                        backgroundColor: t.bg,
                        borderWidth: isActive ? 2 : 1,
                        borderColor: isActive ? t.accent : 'rgba(255,255,255,0.06)',
                      }}
                    >
                      {/* Preview */}
                      <View style={{ gap: 4, marginBottom: 8 }}>
                        <View style={{ height: 6, borderRadius: 3, backgroundColor: t.accent, width: '75%' }} />
                        <View style={{ height: 3, borderRadius: 2, backgroundColor: t.card, width: '100%' }} />
                        <View style={{ height: 3, borderRadius: 2, backgroundColor: t.card, width: '60%' }} />
                        <View style={{ flexDirection: 'row', gap: 4, marginTop: 2 }}>
                          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: t.accent }} />
                          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: t.card }} />
                        </View>
                      </View>
                      <Text style={{ color: t.text, fontSize: 10, fontWeight: '700' }} numberOfLines={1}>
                        {t.name}
                      </Text>
                      {isActive && (
                        <View style={{
                          position: 'absolute', top: 6, right: 6,
                          width: 16, height: 16, borderRadius: 8,
                          backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Ionicons name="checkmark" size={10} color={t.bg} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </BlurView>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Tentang Modal ─────────────────────────────────────────────────────────────

function TentangModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const theme = useTheme();
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
              <View style={{
                width: 40, height: 4, borderRadius: 2,
                backgroundColor: 'rgba(255,255,255,0.15)',
                alignSelf: 'center', marginBottom: 24,
              }} />

              <Text style={{
                color: theme.text, fontSize: 18, fontWeight: '900',
                marginBottom: 4, textAlign: 'center',
              }}>
                NefuSoft
              </Text>
              <Text style={{
                color: theme.subtext, fontSize: 12, textAlign: 'center',
                marginBottom: 24,
              }}>
                Versi 1.0.0
              </Text>

              {[
                { icon: 'document-text-outline', label: 'Kebijakan Privasi', onPress: () => Linking.openURL('https://nefusoft.cloud/privacy') },
                { icon: 'shield-checkmark-outline', label: 'Syarat & Ketentuan', onPress: () => Linking.openURL('https://nefusoft.cloud/terms') },
                { icon: 'globe-outline', label: 'Website', onPress: () => Linking.openURL('https://nefusoft.cloud') },
                { icon: 'logo-instagram', label: 'Instagram', onPress: () => Linking.openURL('https://instagram.com/nefusoft') },
              ].map((item, i, arr) => (
                <TouchableOpacity
                  key={item.label}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    paddingVertical: 14,
                    borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                    borderBottomColor: theme.border,
                  }}
                >
                  <View style={{
                    width: 34, height: 34, borderRadius: 9,
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: theme.accentDim,
                  }}>
                    <Ionicons name={item.icon as any} size={17} color={theme.accent} />
                  </View>
                  <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600', flex: 1 }}>
                    {item.label}
                  </Text>
                  <Ionicons name="open-outline" size={14} color={theme.subtext} />
                </TouchableOpacity>
              ))}

              <Text style={{
                color: theme.subtext, fontSize: 10, textAlign: 'center',
                marginTop: 24,
              }}>
                Made with ♥ by NefuSoft Team
              </Text>
            </View>
          </TouchableOpacity>
        </BlurView>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const theme  = useTheme();

  const [user, setUser]           = useState<any>(null);
  const [xpData, setXpData]       = useState<XPData>({ xp: 0, level: 1, streak: 0, lastWatchDate: '', _todayXP: 0 });
  const [history, setHistory]     = useState<HistoryItem[]>([]);
  const [favorites, setFavorites] = useState<Anime[]>([]);
  const [pip, setPip]             = useState(false);
  const [loading, setLoading]     = useState(false);
  const [admin, setAdmin]         = useState(false);

  const [showTheme, setShowTheme]   = useState(false);
  const [showTentang, setShowTentang] = useState(false);
  const [showAdmin, setShowAdmin]   = useState(false);
  const [allUsers, setAllUsers]     = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [xpInput, setXpInput]       = useState('');
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged((u: any) => {
      setUser(u);
      setAdmin(isAdmin());
    });
    return unsub;
  }, []);

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
        setHistory(Array.isArray(hist) ? (hist as HistoryItem[]).slice(0, 5) : []);
        setPip(pipVal === 'true');
      } catch {}
    };
    loadData();
    return () => { mounted = false; };
  }, []));

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
      const snap = await firestore().collection('users').get();
      const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      users.sort((a: any, b: any) => (b.lastLoginAt ?? 0) - (a.lastLoginAt ?? 0));
      setAllUsers(users);
    } catch (e) {
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

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
              <Ionicons name="shield" size={13} color={theme.bg} />
              <Text style={{ color: theme.bg, fontSize: 11, fontWeight: '900' }}>Admin</Text>
            </TouchableOpacity>
          )}
        </View>

        {user ? (
          <Animated.View entering={FadeIn.duration(300)}>

            {/* ── User Card ── */}
            <Animated.View
              entering={FadeInDown.delay(0).springify()}
              style={{
                marginHorizontal: 16, marginBottom: 8, borderRadius: 16,
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
                  style={{ width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderColor: theme.accent }}
                />
                <View style={{ flex: 1, gap: 3 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800' }} numberOfLines={1}>
                      {user.displayName}
                    </Text>
                    {admin && (
                      <View style={{
                        flexDirection: 'row', alignItems: 'center', gap: 3,
                        backgroundColor: theme.accent, paddingHorizontal: 5,
                        paddingVertical: 2, borderRadius: 4,
                      }}>
                        <Ionicons name="shield-checkmark" size={9} color={theme.bg} />
                        <Text style={{ color: theme.bg, fontSize: 8, fontWeight: '900' }}>ADMIN</Text>
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

            {/* ── XP Card ── */}
            <Animated.View entering={FadeInDown.delay(60).springify()}>
              <Card>
                <View style={{ padding: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View>
                      <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                        Level & XP
                      </Text>
                      <Text style={{ color: theme.subtext, fontSize: 11, marginTop: 3 }}>
                        🔥 {xpData.streak} hari streak
                      </Text>
                    </View>
                    <LevelBadge xp={xpData.xp} size="md" />
                  </View>
                  <XPBar xp={xpData.xp} />
                </View>
              </Card>
            </Animated.View>

            {/* ── Favorit ── */}
            {favorites.length > 0 && (
              <Animated.View entering={FadeInDown.delay(120).springify()}>
                <SectionLabel label="Favorit" />
                <Card>
                  {favorites.slice(0, 5).map((a, i) => (
                    <TouchableOpacity
                      key={`fav-${i}`}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 12,
                        paddingHorizontal: 14, paddingVertical: 12,
                        borderBottomWidth: i < Math.min(favorites.length, 5) - 1 ? 1 : 0,
                        borderBottomColor: theme.border,
                      }}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push(`/watch/${a.id}`);
                      }}
                    >
                      <FastImage
                        source={{ uri: a.image_poster, priority: FastImage.priority.normal }}
                        style={{ width: 38, aspectRatio: 3 / 4.5, borderRadius: 6 }}
                        resizeMode={FastImage.resizeMode.cover}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.text, fontSize: 12, fontWeight: '600' }} numberOfLines={1}>{a.title}</Text>
                        <Text style={{ color: theme.subtext, fontSize: 10, marginTop: 2 }}>{a.type} • {a.status}</Text>
                      </View>
                      <Ionicons name="bookmark" size={15} color={theme.accent} />
                    </TouchableOpacity>
                  ))}
                </Card>
              </Animated.View>
            )}

            {/* ── History ── */}
            {history.length > 0 && (
              <Animated.View entering={FadeInDown.delay(160).springify()}>
                <SectionLabel label="Terakhir Ditonton" />
                <Card>
                  {history.map((h, i) => (
                    <TouchableOpacity
                      key={`hist-${i}`}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 12,
                        paddingHorizontal: 14, paddingVertical: 12,
                        borderBottomWidth: i < history.length - 1 ? 1 : 0,
                        borderBottomColor: theme.border,
                      }}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push(`/watch/${h.anime.id}`);
                      }}
                    >
                      <FastImage
                        source={{ uri: h.anime.image_poster, priority: FastImage.priority.low }}
                        style={{ width: 38, aspectRatio: 3 / 4.5, borderRadius: 6 }}
                        resizeMode={FastImage.resizeMode.cover}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.text, fontSize: 12, fontWeight: '600' }} numberOfLines={1}>{h.anime.title}</Text>
                        <Text style={{ color: theme.subtext, fontSize: 10, marginTop: 2 }}>Episode {h.episodeIndex}</Text>
                      </View>
                      <Ionicons name="time-outline" size={14} color={theme.subtext} />
                    </TouchableOpacity>
                  ))}
                </Card>
              </Animated.View>
            )}

            {/* ── Pengaturan (hanya muncul kalau sudah login) ── */}
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <SectionLabel label="Pengaturan" />
              <Card>
                <SettingRow
                  icon="color-palette-outline"
                  label="Tema"
                  subtitle={`Sekarang: ${THEMES.find(t => t.id === theme.id)?.name ?? 'Gold'}`}
                  onPress={() => { Haptics.selectionAsync(); setShowTheme(true); }}
                />
                <SettingRow
                  icon="tv-outline"
                  label="Picture in Picture"
                  subtitle="Video tetap jalan saat minimize"
                  last
                  right={
                    <Switch
                      value={pip}
                      onValueChange={togglePip}
                      trackColor={{ false: theme.border, true: theme.accent }}
                      thumbColor={pip ? theme.bg : theme.subtext}
                    />
                  }
                />
              </Card>
            </Animated.View>

            {/* ── Tentang ── */}
            <Animated.View entering={FadeInDown.delay(240).springify()}>
              <SectionLabel label="Tentang" />
              <Card>
                <SettingRow
                  icon="information-circle-outline"
                  label="Tentang Aplikasi"
                  subtitle="Versi, kebijakan privasi, & lainnya"
                  last
                  onPress={() => { Haptics.selectionAsync(); setShowTentang(true); }}
                />
              </Card>
            </Animated.View>

          </Animated.View>
        ) : (
          <>
            {/* ── Login Box ── */}
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
                <Ionicons name="logo-google" size={16} color={theme.bg} />
                <Text style={{ color: theme.bg, fontWeight: '800', fontSize: 14 }}>
                  {loading ? 'Memuat...' : 'Login dengan Google'}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* ── Tentang (tetap muncul meski belum login) ── */}
            <Animated.View entering={FadeInDown.delay(120).springify()}>
              <SectionLabel label="Tentang" />
              <Card>
                <SettingRow
                  icon="information-circle-outline"
                  label="Tentang Aplikasi"
                  subtitle="Versi, kebijakan privasi, & lainnya"
                  last
                  onPress={() => { Haptics.selectionAsync(); setShowTentang(true); }}
                />
              </Card>
            </Animated.View>
          </>
        )}

      </ScrollView>

      {/* ── Theme Picker Modal ── */}
      <ThemePickerModal visible={showTheme} onClose={() => setShowTheme(false)} />

      {/* ── Tentang Modal ── */}
      <TentangModal visible={showTentang} onClose={() => setShowTentang(false)} />

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
              <Ionicons name="shield-checkmark" size={11} color={theme.bg} />
              <Text style={{ color: theme.bg, fontSize: 10, fontWeight: '900' }}>ADMIN</Text>
            </View>
          </View>

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
                <Text style={{ color: theme.accent, fontSize: 28, fontWeight: '900' }}>{s.value}</Text>
                <Text style={{ color: theme.subtext, fontSize: 11, fontWeight: '700', marginTop: 2 }}>{s.label}</Text>
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
              removeClippedSubviews
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
                      <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }} numberOfLines={1}>
                        {item.displayName}
                      </Text>
                      {item.isAdmin && (
                        <View style={{ backgroundColor: theme.accent, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 }}>
                          <Text style={{ color: theme.bg, fontSize: 8, fontWeight: '900' }}>ADMIN</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: theme.subtext, fontSize: 10, marginTop: 2 }}>{item.email}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: theme.accent, fontWeight: '900', fontSize: 13 }}>Lv {item.level ?? 1}</Text>
                    <Text style={{ color: theme.subtext, fontSize: 10, marginTop: 2 }}>{item.xp ?? 0} XP</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* ── Edit XP Modal ── */}
      <Modal visible={showUserModal} transparent animationType="slide" onRequestClose={() => setShowUserModal(false)}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowUserModal(false)}>
          <BlurView intensity={30} tint="dark" style={{ flex: 1 }}>
            <View style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              backgroundColor: `${theme.card}f5`,
              borderTopLeftRadius: 20, borderTopRightRadius: 20,
              padding: 24, paddingBottom: 40,
              borderWidth: 1, borderColor: theme.border,
            }}>
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
              <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
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
                style={{ backgroundColor: theme.accent, paddingVertical: 14, borderRadius: 10, alignItems: 'center' }}
              >
                <Text style={{ color: theme.bg, fontWeight: '900', fontSize: 14 }}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}
