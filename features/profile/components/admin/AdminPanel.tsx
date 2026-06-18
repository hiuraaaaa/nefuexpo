// AdminPanel.tsx
//
// Signature: stats read as a sentence ("142 user, 38 aktif, 3 admin") not
// three identical icon-tile cards. Quick actions are two stacked text-links
// of unequal size/weight (danger action bigger and red, the other quieter),
// not a row of icon tiles. The user list is a directory/log: name+email
// left, level as a plain right-aligned number, hairline divider between
// rows — no per-row card, no rounded-pill level badge, no glow shadow.
import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/theme';
import { MaintenanceModal }  from './MaintenanceModal';
import { AnnouncementModal } from './AnnouncementModal';
import { UserDetailModal }   from './UserDetailModal';

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

  const active7d    = allUsers.filter(u => Date.now() - (u.lastLoginAt ?? 0) < 7 * 24 * 60 * 60 * 1000).length;
  const adminCount  = allUsers.filter(u => u.isAdmin).length;

  const openMaintenance  = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowMaintenance(true); };
  const openAnnouncement = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowAnnouncement(true); };

  return (
    <>
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>

          {/* ── Header: back as text, title left, no symmetric badge on the right ── */}
          <View style={{ paddingHorizontal: 22, paddingTop: 6, paddingBottom: 18 }}>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8 }} style={{ marginBottom: 14 }}>
              <Text style={{ color: theme.subtext, fontSize: 13, fontWeight: '700' }}>‹ Kembali</Text>
            </TouchableOpacity>

            <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '700', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>
              Khusus admin
            </Text>
            <Text style={{ color: theme.text, fontWeight: '900', fontSize: 27, letterSpacing: -0.7 }}>
              Dashboard
            </Text>

            {/* Stats as a sentence, not three cards */}
            <Text style={{ color: theme.subtext, fontSize: 13, marginTop: 10, lineHeight: 19 }}>
              <Text style={{ color: theme.text, fontWeight: '900', fontSize: 15 }}>{allUsers.length}</Text> user terdaftar ·{' '}
              <Text style={{ color: theme.accent, fontWeight: '800' }}>{active7d}</Text> aktif 7 hari ·{' '}
              <Text style={{ color: theme.text, fontWeight: '800' }}>{adminCount}</Text> admin
            </Text>
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
                {/* ── Quick actions: two unequal stacked text-links ── */}
                <View style={{ paddingHorizontal: 22, marginBottom: 30, gap: 14 }}>
                  <TouchableOpacity onPress={openMaintenance} activeOpacity={0.7}>
                    <Text style={{ color: '#e15c5c', fontWeight: '900', fontSize: 19, letterSpacing: -0.3 }}>
                      Mode maintenance
                    </Text>
                    <Text style={{ color: theme.subtext, fontSize: 11.5, marginTop: 2 }}>
                      Matikan akses sementara untuk semua user
                    </Text>
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
                  style={{ width: 38, height: 38, borderRadius: 6 }}
                />

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                    <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13.5 }} numberOfLines={1}>
                      {item.displayName}
                    </Text>
                    {item.isAdmin && (
                      <Text style={{ color: theme.accent, fontSize: 9.5, fontWeight: '900', fontStyle: 'italic' }}>
                        admin
                      </Text>
                    )}
                  </View>
                  <Text style={{ color: theme.subtext, fontSize: 10.5, marginTop: 1 }} numberOfLines={1}>
                    {item.email}
                  </Text>
                </View>

                {/* Level as a plain number pair, right-aligned, no pill */}
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: theme.text, fontWeight: '900', fontSize: 15 }}>
                    {item.level ?? 1}
                  </Text>
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
