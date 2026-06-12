// index.tsx
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
import { historyStorage, favoritStorage, storageMain } from '@/hooks/storage/storage';
import { HistoryItem, Anime } from '@/types';

import { UserCard }         from './_components/UserCard';
import { XPCard }           from './_components/XPCard';
import { HistoryCard }      from './_components/HistoryCard';
import { FavoritCard }      from './_components/FavoritCard';
import { SettingsCard }     from './_components/SettingsCard';
import { ThemePickerModal } from './_components/ThemePickerModal';
import { TentangModal }     from './_components/TentangModal';
import { AdminPanel }       from './_components/admin/AdminPanel';
import { SectionLabel, Card, SettingRow } from './_components/shared';

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
    const unsub = onAuthStateChanged((u: any) => {
      setUser(u ?? null);
      setAdmin(isAdmin());
      setAuthReady(true);  // ← auth state sudah resolved
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

  // Tunggu auth state resolved dulu sebelum render
  if (!authReady) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: theme.text, fontWeight: '900', fontSize: 28, letterSpacing: -0.5 }}>PROFILE</Text>
          {admin && (
            <TouchableOpacity
              onPress={openAdmin}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.accent, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
            >
              <Ionicons name="shield" size={13} color={theme.bg} />
              <Text style={{ color: theme.bg, fontSize: 11, fontWeight: '900' }}>Admin</Text>
            </TouchableOpacity>
          )}
        </View>

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
              <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800', marginTop: 4 }}>Belum Login</Text>
              <Text style={{ color: theme.subtext, fontSize: 12, textAlign: 'center' }}>Login untuk simpan history & XP kamu</Text>
              <TouchableOpacity
                onPress={handleLogin} disabled={loading}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.accent, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, marginTop: 8 }}
              >
                <Ionicons name="logo-google" size={16} color={theme.bg} />
                <Text style={{ color: theme.bg, fontWeight: '800', fontSize: 14 }}>
                  {loading ? 'Memuat...' : 'Login dengan Google'}
                </Text>
              </TouchableOpacity>
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
