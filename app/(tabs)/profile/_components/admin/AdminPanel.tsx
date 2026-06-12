import React, { useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, FlatList, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import firestore from '@react-native-firebase/firestore';
import { useTheme } from '@/hooks/theme';
import { MaintenanceModal } from './MaintenanceModal';
import { AnnouncementModal } from './AnnouncementModal';
import { UserDetailModal } from './UserDetailModal';

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

  // Sync initialUsers ke state kalau prop berubah
  React.useEffect(() => { setAllUsers(initialUsers); }, [initialUsers]);

  const handleXPUpdated = (uid: string, xp: number, level: number) => {
    setAllUsers(prev => prev.map(u => u.id === uid ? { ...u, xp, level } : u));
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.card }}
            >
              <Ionicons name="arrow-back" size={20} color={theme.text} />
            </TouchableOpacity>
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: '900', flex: 1 }}>Admin Panel</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: theme.accent, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
              <Ionicons name="shield-checkmark" size={11} color={theme.bg} />
              <Text style={{ color: theme.bg, fontSize: 10, fontWeight: '900' }}>ADMIN</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 16 }}>
            {[
              { label: 'Total User', value: allUsers.length },
              { label: 'Aktif 7 Hari', value: allUsers.filter(u => Date.now() - (u.lastLoginAt ?? 0) < 7 * 24 * 60 * 60 * 1000).length },
            ].map((s, i) => (
              <View key={i} style={{ flex: 1, backgroundColor: theme.card, borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
                <Text style={{ color: theme.accent, fontSize: 28, fontWeight: '900' }}>{s.value}</Text>
                <Text style={{ color: theme.subtext, fontSize: 11, fontWeight: '700', marginTop: 2 }}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* System */}
          <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', paddingHorizontal: 16, marginBottom: 10 }}>System</Text>
          <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' }}>
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowMaintenance(true); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: theme.border }}
            >
              <View style={{ width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(230,57,70,0.15)' }}>
                <Ionicons name="construct-outline" size={17} color="#e63946" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>Maintenance</Text>
                <Text style={{ color: theme.subtext, fontSize: 10, marginTop: 1 }}>Toggle mode maintenance</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.subtext} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowAnnouncement(true); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}
            >
              <View style={{ width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(74,158,255,0.15)' }}>
                <Ionicons name="megaphone-outline" size={17} color="#4a9eff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>Announcement</Text>
                <Text style={{ color: theme.subtext, fontSize: 10, marginTop: 1 }}>Kirim pesan ke semua user</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.subtext} />
            </TouchableOpacity>
          </View>

          {/* User list */}
          <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', paddingHorizontal: 16, marginBottom: 10 }}>Semua User</Text>

          {loading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: theme.accent, fontWeight: '700' }}>Memuat...</Text>
            </View>
          ) : (
            <FlatList
              data={allUsers}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 8 }}
              removeClippedSubviews maxToRenderPerBatch={10} windowSize={5}
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
                    setShowUserDetail(true);
                  }}
                >
                  <Image
                    source={{ uri: item.photoURL ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(item.displayName ?? 'User')}` }}
                    style={{ width: 40, height: 40, borderRadius: 20 }}
                  />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }} numberOfLines={1}>{item.displayName}</Text>
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
                  <Ionicons name="chevron-forward" size={14} color={theme.subtext} />
                </TouchableOpacity>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>

      <MaintenanceModal visible={showMaintenance} onClose={() => setShowMaintenance(false)} />
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
