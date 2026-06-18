// AdminPanel.tsx
//
// v2 — adds visual weight that v1 was missing on real devices: a tinted wash
// behind the header (matches the Profile screen), three colored numeral
// stats instead of one flat sentence, a tinted danger strip behind the
// Maintenance action so it reads as clickable/important, level numbers in
// a small filled chip instead of bare text, and a footer wordmark so the
// screen doesn't trail into dead empty space when the user list is short.
import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/theme';
import { MaintenanceModal }  from './MaintenanceModal';
import { AnnouncementModal } from './AnnouncementModal';
import { UserDetailModal }   from './UserDetailModal';

const DANGER = '#e15c5c';

interface Props {
  visible:  boolean;
  onClose:  () => void;
  allUsers: any[];
  loading:  boolean;
}

export function AdminPanel({ visible, onClose, allUsers: initialUsers, loading }: Props) {
  const theme = useTheme();

  const [allUsers, setAllUsers]                 = useState(initialUsers);
  const [showMaintenance, setShowMaintenance]   = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [selectedUser, setSelectedUser]         = useState<any>(null);
  const [showUserDetail, setShowUserDetail]     = useState(false);

  React.useEffect(() => { setAllUsers(initialUsers); }, [initialUsers]);

  const handleXPUpdated = (uid: string, xp: number, level: number) => {
    setAllUsers(prev => prev.map(u => u.id === uid ? { ...u, xp, level } : u));
  };

  const active7d   = allUsers.filter(u => Date.now() - (u.lastLoginAt ?? 0) < 7 * 24 * 60 * 60 * 1000).length;
  const adminCount = allUsers.filter(u => u.isAdmin).length;

  const openMaintenance  = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowMaintenance(true); };
  const openAnnouncement = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowAnnouncement(true); };

  return (
    <>
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>

          {/* ── Header with tinted wash, matches Profile screen language ── */}
          <View>
            <LinearGradient
              colors={[`${theme.accent}1c`, `${theme.accent}00`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 200 }}
              pointerEvents="none"
            />

            <View style={{ paddingHorizontal: 22, paddingTop: 6, paddingBottom: 4 }}>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8 }} style={{ marginBottom: 16 }}>
                <Text style={{ color: theme.subtext, fontSize: 13, fontWeight: '700' }}>‹ Kembali</Text>
              </TouchableOpacity>

              <Text style={{ color: theme.accent, fontSize: 10, fontWeight: '800', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>
                Khusus admin
              </Text>
              <Text style={{ color: theme.text, fontWeight: '900', fontSize: 30, letterSpacing: -0.8, marginBottom: 18 }}>
                Dashboard
              </Text>

              {/* Three colored numeral stats — each its own visual weight,
                  not three identical tiles and not one flat sentence */}
              <View style={{ flexDirection: 'row', gap: 26, marginBottom: 22 }}>
                <View>
                  <Text style={{ color: theme.text, fontWeight: '900', fontSize: 30, letterSpacing: -1 }}>{allUsers.length}</Text>
                  <Text style={{ color: theme.subtext, fontSize: 10.5, fontWeight: '600', marginTop: 2 }}>user terdaftar</Text>
                </View>
                <View>
                  <Text style={{ color: theme.accent, fontWeight: '900', fontSize: 30, letterSpacing: -1 }}>{active7d}</Text>
                  <Text style={{ color: theme.subtext, fontSize: 10.5, fontWeight: '600', marginTop: 2 }}>aktif 7 hari</Text>
                </View>
                <View>
                  <Text style={{ color: '#e0a93f', fontWeight: '900', fontSize: 30, letterSpacing: -1 }}>{adminCount}</Text>
                  <Text style={{ color: theme.subtext, fontSize: 10.5, fontWeight: '600', marginTop: 2 }}>admin</Text>
                </View>
              </View>
            </View>
          </View>

          <FlatList
            data={allUsers}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 60 }}
            removeClippedSubviews
            maxToRenderPerBatch={10}
            windowSize={5}
            ListHeaderComponent={() => (
              <>
                {/* ── Maintenance gets a tinted danger strip behind it so it
                    reads as a real actionable control, not floating text ── */}
                <View style={{ paddingHorizontal: 22, marginBottom: 28 }}>
                  <TouchableOpacity onPress={openMaintenance} activeOpacity={0.75}>
                    <View style={{
                      borderRadius: 14,
                      overflow: 'hidden',
                      marginBottom: 14,
                    }}>
                      <LinearGradient
                        colors={[`${DANGER}22`, `${DANGER}06`]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                      />
                      {/* Accent edge as its own solid bar, not a border fighting the radius */}
                      <View style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, backgroundColor: DANGER }} />

                      <View style={{ paddingHorizontal: 18, paddingVertical: 14 }}>
                        <Text style={{ color: DANGER, fontWeight: '900', fontSize: 17, letterSpacing: -0.3 }}>
                          Mode maintenance
                        </Text>
                        <Text style={{ color: theme.subtext, fontSize: 11.5, marginTop: 3 }}>
                          Matikan akses sementara untuk semua user
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={openAnnouncement} activeOpacity={0.7}>
                    <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15 }}>
                      Kirim announcement →
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* ── User list heading ── */}
                <View style={{
                  flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between',
                  paddingHorizontal: 22, marginBottom: 6,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                    <Text style={{ color: `${theme.accent}90`, fontSize: 11, fontWeight: '900', fontStyle: 'italic' }}>03</Text>
                    <Text style={{ color: theme.subtext, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                      Pengguna
                    </Text>
                  </View>
                </View>
              </>
            )}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                activeOpacity={0.6}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedUser(item);
                  setShowUserDetail(true);
                }}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  paddingHorizontal: 22, paddingVertical: 13,
                  borderTopWidth: index === 0 ? 1 : 0,
                  borderBottomWidth: 1,
                  borderColor: `${theme.accent}12`,
                }}
              >
                <Image
                  source={{ uri: item.photoURL ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(item.displayName ?? 'User')}` }}
                  style={{
                    width: 40, height: 40, borderRadius: 7,
                    borderWidth: item.isAdmin ? 1.5 : 0,
                    borderColor: theme.accent,
                  }}
                />

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                    <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13.5 }} numberOfLines={1}>
                      {item.displayName}
                    </Text>
                    {item.isAdmin && (
                      <Text style={{
                        color: theme.bg, backgroundColor: theme.accent,
                        fontSize: 8.5, fontWeight: '900',
                        paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 3,
                        overflow: 'hidden',
                      }}>
                        ADMIN
                      </Text>
                    )}
                  </View>
                  <Text style={{ color: theme.subtext, fontSize: 10.5, marginTop: 2 }} numberOfLines={1}>
                    {item.email}
                  </Text>
                </View>

                {/* Level in a small filled chip — not bare text, not a big pill */}
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={{
                    backgroundColor: `${theme.accent}1c`,
                    paddingHorizontal: 8, paddingVertical: 3,
                    borderRadius: 6, marginBottom: 3,
                  }}>
                    <Text style={{ color: theme.accent, fontWeight: '900', fontSize: 12.5 }}>
                      Lv.{item.level ?? 1}
                    </Text>
                  </View>
                  <Text style={{ color: theme.subtext, fontSize: 9.5 }}>
                    {(item.xp ?? 0).toLocaleString('id-ID')} xp
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              loading ? (
                <View style={{ paddingHorizontal: 22, paddingVertical: 40 }}>
                  <Text style={{ color: theme.subtext, fontWeight: '600', fontSize: 13 }}>Memuat data…</Text>
                </View>
              ) : null
            }
            ListFooterComponent={
              allUsers.length > 0 ? (
                <View style={{ paddingHorizontal: 22, marginTop: 36 }}>
                  <Text style={{
                    color: `${theme.accent}10`,
                    fontSize: 46, fontWeight: '900',
                    letterSpacing: -2, lineHeight: 46,
                  }}>
                    ADMIN PANEL
                  </Text>
                </View>
              ) : null
            }
          />
        </SafeAreaView>
      </Modal>

      <MaintenanceModal  visible={showMaintenance}  onClose={() => setShowMaintenance(false)} />
      <AnnouncementModal visible={showAnnouncement} onClose={() => setShowAnnouncement(false)} />
      <UserDetailModal
        visible={showUserDetail}
        user={selectedUser}
        onClose={() => setShowUserDetail(false)}
        onXPUpdated={handleXPUpdated}
      />
    </>
  );
}
