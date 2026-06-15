// profile.tsx — Modern Glassmorphism Profile Screen
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import firestore from '@react-native-firebase/firestore';

import { useTheme } from '@/hooks/theme';
import { signInWithGoogle, isAdmin, onAuthStateChanged } from '@/hooks/auth';
import { xpStorage, XPData } from '@/hooks/xp';
import { historyStorage, favoritStorage, storageMain, syncFromFirestore } from '@/hooks/storage/storage';
import { HistoryItem, Anime } from '@/types';

import { UserCard }         from '@/features/profile/components/UserCard';
import { XPCard }           from '@/features/profile/components/XPCard';
import { HistoryCard }      from '@/features/profile/components/HistoryCard';
import { FavoritCard }      from '@/features/profile/components/FavoritCard';
import { SettingsCard }     from '@/features/profile/components/SettingsCard';
import { ThemePickerModal } from '@/features/profile/components/ThemePickerModal';
import { TentangModal }     from '@/features/profile/components/TentangModal';
import { AdminPanel }       from '@/features/profile/components/admin/AdminPanel';
import { SectionLabel, Card, SettingRow } from '@/features/profile/components/shared';

const PIP_KEY  = 'nefusoft_pip';
const INFO_KEY = 'nefusoft_info';

export default function ProfileScreen() {
  const theme = useTheme();

  const [authReady, setAuthReady] = useState(false);
  const [user, setUser]           = useState<any>(null);
  const [xpData, setXpData]       = useState<XPData>({ xp: 0, level: 1, streak: 0, lastWatchDate: '', _todayXP: 0 });
  const [history, setHistory]     = useState<HistoryItem[]>([]);
  const [favorites, setFavorites] = useState<Anime[]>([]);
  const [loading, setLoading]     = useState(false);
  const [admin, setAdmin]         = useState(false);
  const [allUsers, setAllUsers]   = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [pip, setPip]   = useState(() => storageMain.getBoolean(PIP_KEY)  ?? false);
  const [info, setInfo] = useState(() => storageMain.getBoolean(INFO_KEY) ?? false);

  const [showTheme, setShowTheme]     = useState(false);
  const [showTentang, setShowTentang] = useState(false);
  const [showAdmin, setShowAdmin]     = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(async (u: any) => {
      setUser(u ?? null);
      setAdmin(isAdmin());
      setAuthReady(true);

      if (u) {
        try {
          await syncFromFirestore();
          const synced = await xpStorage.syncFromFirestore();
          if (synced) setXpData(synced);
          setHistory(historyStorage.getAll()?.slice(0, 5) ?? []);
          setFavorites(favoritStorage.getAll() ?? []);
        } catch {}
      }
    });
    return unsub;
  }, []);

  useFocusEffect(useCallback(() => {
    try { setXpData(xpStorage.get()); } catch {}
    try { setHistory(historyStorage.getAll()?.slice(0, 5) ?? []); } catch {}
  }, []));

  useEffect(() => {
    if (!user) { setFavorites([]); return; }
    try { setFavorites(favoritStorage.getAll() ?? []); } catch {}
  }, [user]);

  const handleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try { await signInWithGoogle(); } catch {}
    setLoading(false);
  };

  const loadAllUsers = async () => {
    setUsersLoading(true);
    try {
      const snap = await firestore().collection('users').get();
      const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      users.sort((a: any, b: any) => (b.lastLoginAt ?? 0) - (a.lastLoginAt ?? 0));
      setAllUsers(users);
    } catch (e) {
      Alert.alert('Error', 'Gagal memuat data user: ' + String(e));
    }
    setUsersLoading(false);
  };

  const openAdmin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowAdmin(true);
    loadAllUsers();
  };

  if (!authReady) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >

        {/* ── Header ── */}
        <View style={{
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <View>
            <Text style={{
              color: theme.subtext,
              fontSize: 10,
              fontWeight: '700',
              letterSpacing: 2.5,
              textTransform: 'uppercase',
              marginBottom: 2,
            }}>
              Akun
            </Text>
            <Text style={{
              color: theme.text,
              fontWeight: '900',
              fontSize: 26,
              letterSpacing: -0.5,
            }}>
              Profil
            </Text>
          </View>

          {admin && (
            <TouchableOpacity
              onPress={openAdmin}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: `${theme.accent}20`,
                borderWidth: 1,
                borderColor: `${theme.accent}40`,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 12,
              }}
            >
              <Ionicons name="shield" size={12} color={theme.accent} />
              <Text style={{ color: theme.accent, fontSize: 11, fontWeight: '800' }}>Admin</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Thin accent line under header ── */}
        <View style={{
          height: 1,
          marginHorizontal: 20,
          marginBottom: 12,
          backgroundColor: `${theme.accent}15`,
          borderRadius: 1,
        }} />

        {user ? (
          <Animated.View entering={FadeIn.duration(300)}>
            <UserCard user={user} admin={admin} xpData={xpData} />
            <XPCard xpData={xpData} />
            <FavoritCard favorites={favorites} />
            <HistoryCard history={history} />
            <SettingsCard
              pip={pip} info={info}
              setPip={setPip} setInfo={setInfo}
              onThemePress={() => setShowTheme(true)}
              onTentangPress={() => setShowTentang(true)}
            />
          </Animated.View>
        ) : (
          <>
            {/* Login card */}
            <Animated.View
              entering={FadeInDown.delay(60).springify()}
              style={{
                marginHorizontal: 16,
                marginBottom: 12,
                borderRadius: 20,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: `${theme.accent}25`,
                backgroundColor: theme.card,
              }}
            >
              <LinearGradient
                colors={[`${theme.accent}18`, 'transparent', `${theme.accent}10`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ position: 'absolute', inset: 0 }}
              />
              <View style={{ padding: 32, alignItems: 'center', gap: 8 }}>
                <View style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: `${theme.accent}15`,
                  borderWidth: 1,
                  borderColor: `${theme.accent}30`,
                  marginBottom: 4,
                }}>
                  <Ionicons name="person-outline" size={32} color={theme.accent} />
                </View>
                <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800' }}>
                  Belum Login
                </Text>
                <Text style={{ color: theme.subtext, fontSize: 12, textAlign: 'center' }}>
                  Login untuk simpan history & XP kamu
                </Text>
                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={loading}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: theme.accent,
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 14,
                    marginTop: 8,
                    shadowColor: theme.accent,
                    shadowOpacity: 0.4,
                    shadowRadius: 12,
                    elevation: 6,
                  }}
                >
                  <Ionicons name="logo-google" size={16} color={theme.bg} />
                  <Text style={{ color: theme.bg, fontWeight: '800', fontSize: 14 }}>
                    {loading ? 'Memuat...' : 'Login dengan Google'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

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

      <ThemePickerModal visible={showTheme}   onClose={() => setShowTheme(false)} />
      <TentangModal     visible={showTentang} onClose={() => setShowTentang(false)} />
      <AdminPanel
        visible={showAdmin}
        onClose={() => setShowAdmin(false)}
        allUsers={allUsers}
        loading={usersLoading}
      />
    </SafeAreaView>
  );
}
