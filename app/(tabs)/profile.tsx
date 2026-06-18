// app/(tabs)/profile.tsx
//
// Header is a left-aligned masthead, not a centered title with a symmetric
// admin pill on the right. Logged-out state mirrors the same left-aligned,
// no-icon-circle language as the rest of the screen.
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import firestore from '@react-native-firebase/firestore';

import { useTheme } from '@/hooks/theme';
import { signInWithGoogle, isAdmin, onAuthStateChanged } from '@/hooks/auth';
import { xpStorage, XPData } from '@/hooks/xp';
import { storageMain, syncFromFirestore } from '@/hooks/storage/storage';

import { UserCard }         from '@/features/profile/components/UserCard';
import { XPCard }           from '@/features/profile/components/XPCard';
import { SettingsCard }     from '@/features/profile/components/SettingsCard';
import { ThemePickerModal } from '@/features/profile/components/ThemePickerModal';
import { TentangModal }     from '@/features/profile/components/TentangModal';
import { AdminPanel }       from '@/features/profile/components/admin/AdminPanel';

const PIP_KEY  = 'nefusoft_pip';
const INFO_KEY = 'nefusoft_info';

export default function ProfileScreen() {
  const theme = useTheme();

  const [authReady, setAuthReady] = useState(false);
  const [user, setUser]           = useState<any>(null);
  const [xpData, setXpData]       = useState<XPData>({ xp: 0, level: 1, streak: 0, lastWatchDate: '', _todayXP: 0 });
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
        } catch {}
      }
    });
    return unsub;
  }, []);

  useFocusEffect(useCallback(() => {
    try { setXpData(xpStorage.get()); } catch {}
  }, []));

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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {user ? (
          <>
            <UserCard user={user} admin={admin} xpData={xpData} />
            <XPCard xpData={xpData} />

            {admin && (
              <View style={{ paddingHorizontal: 22, marginBottom: 26 }}>
                <TouchableOpacity
                  onPress={openAdmin}
                  style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}
                  hitSlop={{ top: 6, bottom: 6 }}
                >
                  <Text style={{ color: theme.text, fontWeight: '800', fontSize: 14 }}>
                    Panel admin
                  </Text>
                  <Text style={{ color: theme.subtext, fontSize: 16, fontWeight: '300' }}>→</Text>
                </TouchableOpacity>
              </View>
            )}

            <SettingsCard
              pip={pip} info={info}
              setPip={setPip} setInfo={setInfo}
              onThemePress={() => setShowTheme(true)}
              onTentangPress={() => setShowTentang(true)}
            />

            {/* Footer: oversized faded wordmark instead of trailing into bare
                empty space — gives the screen a deliberate ending */}
            <View style={{ paddingHorizontal: 22, marginTop: 48 }}>
              <Text style={{
                color: `${theme.accent}12`,
                fontSize: 54,
                fontWeight: '900',
                letterSpacing: -2,
                lineHeight: 54,
              }}>
                NEFUSOFT
              </Text>
              <Text style={{ color: theme.subtext, fontSize: 10.5, marginTop: 6, fontWeight: '600' }}>
                v1.0.0 · dibuat dengan 🔥
              </Text>
            </View>
          </>
        ) : (
          <View style={{ paddingHorizontal: 22, paddingTop: 24 }}>
            <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '700', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>
              Akun
            </Text>
            <Text style={{ color: theme.text, fontWeight: '900', fontSize: 27, letterSpacing: -0.7, marginBottom: 8 }}>
              Belum login
            </Text>
            <Text style={{ color: theme.subtext, fontSize: 13, lineHeight: 19, maxWidth: 280, marginBottom: 22 }}>
              Login untuk menyimpan progres XP, riwayat tontonan, dan daftar favoritmu.
            </Text>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              style={{
                alignSelf: 'flex-start',
                borderBottomWidth: 2,
                borderBottomColor: theme.accent,
                paddingBottom: 5,
              }}
            >
              <Text style={{ color: theme.text, fontWeight: '800', fontSize: 15 }}>
                {loading ? 'Memuat…' : 'Login dengan Google →'}
              </Text>
            </TouchableOpacity>

            <View style={{ marginTop: 40 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                <Text style={{ color: `${theme.accent}90`, fontSize: 11, fontWeight: '900', fontStyle: 'italic' }}>01</Text>
                <Text style={{ color: theme.subtext, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  Tentang
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => { Haptics.selectionAsync(); setShowTentang(true); }}
                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 }}
              >
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>Tentang aplikasi</Text>
                  <Text style={{ color: theme.subtext, fontSize: 11, marginTop: 2 }}>Versi, kebijakan privasi & lainnya</Text>
                </View>
                <Text style={{ color: theme.subtext, fontSize: 16, fontWeight: '300' }}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
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
