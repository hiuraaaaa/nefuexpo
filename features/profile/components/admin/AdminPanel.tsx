// AdminPanel.tsx — Glassmorphism Admin Dashboard
import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
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

  const [allUsers, setAllUsers]               = useState(initialUsers);
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [selectedUser, setSelectedUser]       = useState<any>(null);
  const [showUserDetail, setShowUserDetail]   = useState(false);

  React.useEffect(() => { setAllUsers(initialUsers); }, [initialUsers]);

  const handleXPUpdated = (uid: string, xp: number, level: number) => {
    setAllUsers(prev => prev.map(u => u.id === uid ? { ...u, xp, level } : u));
  };

  const active7d = allUsers.filter(u => Date.now() - (u.lastLoginAt ?? 0) < 7 * 24 * 60 * 60 * 1000).length;
  const adminCount = allUsers.filter(u => u.isAdmin).length;

  const QUICK_ACTIONS = [
    { icon: 'construct-outline', label: 'Maintenance', color: '#e63946', onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowMaintenance(true); } },
    { icon: 'megaphone-outline', label: 'Announcement', color: '#4a9eff', onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowAnnouncement(true); } },
  ];

  return (
    <>
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>

          {/* ── Header ── */}
          <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity
                onPress={onClose}
                style={{
                  width: 36, height: 36, borderRadius: 11,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: theme.card,
                  borderWidth: 1, borderColor: `${theme.accent}20`,
                }}
              >
                <Ionicons name="arrow-back" size={18} color={theme.text} />
              </TouchableOpacity>

              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.subtext, fontSize: 9, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' }}>Dashboard</Text>
                <Text style={{ color: theme.text, fontSize: 20, fontWeight: '900', letterSpacing: -0.5 }}>Admin Panel</Text>
              </View>

              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                backgroundColor: `${theme.accent}20`,
                borderWidth: 1, borderColor: `${theme.accent}40`,
                paddingHorizontal: 10, paddingVertical: 6,
                borderRadius: 10,
              }}>
                <Ionicons name="shield-checkmark" size={11} color={theme.accent} />
                <Text style={{ color: theme.accent, fontSize: 10, fontWeight: '900' }}>ADMIN</Text>
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
                {/* ── Stats Row ── */}
                <Animated.View entering={FadeInDown.delay(0).springify()}>
                  <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 16 }}>
                    {[
                      { label: 'Total User', value: allUsers.length, icon: 'people-outline' },
                      { label: 'Aktif 7 Hari', value: active7d, icon: 'pulse-outline' },
                      { label: 'Admin', value: adminCount, icon: 'shield-outline' },
                    ].map((s, i) => (
                      <View
                        key={i}
                        style={{
                          flex: 1,
                          backgroundColor: theme.card,
                          borderRadius: 16,
                          padding: 14,
                          alignItems: 'center',
                          borderWidth: 1,
                          borderColor: `${theme.accent}20`,
                          overflow: 'hidden',
                        }}
                      >
                        <LinearGradient
                          colors={[`${theme.accent}10`, 'transparent']}
                          style={{ position: 'absolute', inset: 0 }}
                        />
                        <View style={{
                          width: 30, height: 30, borderRadius: 9,
                          alignItems: 'center', justifyContent: 'center',
                          backgroundColor: `${theme.accent}18`,
                          marginBottom: 6,
                        }}>
                          <Ionicons name={s.icon as any} size={14} color={theme.accent} />
                        </View>
                        <Text style={{ color: theme.accent, fontSize: 22, fontWeight: '900' }}>{s.value}</Text>
                        <Text style={{ color: theme.subtext, fontSize: 9, fontWeight: '700', marginTop: 2, textAlign: 'center' }}>{s.label}</Text>
                      </View>
                    ))}
                  </View>
                </Animated.View>

                {/* ── Quick Actions ── */}
                <Animated.View entering={FadeInDown.delay(60).springify()}>
                  <View style={{ paddingHorizontal: 20, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ width: 3, height: 11, borderRadius: 2, backgroundColor: theme.accent }} />
                    <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' }}>Aksi Cepat</Text>
                  </View>
                  <View style={{
                    marginHorizontal: 16,
                    marginBottom: 16,
                    backgroundColor: theme.card,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: `${theme.accent}20`,
                    overflow: 'hidden',
                  }}>
                    <LinearGradient
                      colors={[`${theme.accent}08`, 'transparent']}
                      style={{ position: 'absolute', inset: 0 }}
                      pointerEvents="none"
                    />
                    {QUICK_ACTIONS.map((a, i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={a.onPress}
                        activeOpacity={0.75}
                        style={{
                          flexDirection: 'row', alignItems: 'center', gap: 12,
                          padding: 14,
                          borderBottomWidth: i < QUICK_ACTIONS.length - 1 ? 1 : 0,
                          borderBottomColor: `${theme.accent}10`,
                        }}
                      >
                        <View style={{
                          width: 38, height: 38, borderRadius: 11,
                          alignItems: 'center', justifyContent: 'center',
                          backgroundColor: `${a.color}18`,
                          borderWidth: 1, borderColor: `${a.color}30`,
                        }}>
                          <Ionicons name={a.icon as any} size={17} color={a.color} />
                        </View>
                        <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700', flex: 1 }}>{a.label}</Text>
                        <View style={{
                          width: 26, height: 26, borderRadius: 8,
                          alignItems: 'center', justifyContent: 'center',
                          backgroundColor: `${theme.accent}12`,
                        }}>
                          <Ionicons name="chevron-forward" size={13} color={`${theme.accent}70`} />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Animated.View>

                {/* ── User List Header ── */}
                <Animated.View entering={FadeInDown.delay(100).springify()}>
                  <View style={{ paddingHorizontal: 20, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{ width: 3, height: 11, borderRadius: 2, backgroundColor: theme.accent }} />
                      <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' }}>Semua User</Text>
                    </View>
                    <Text style={{ color: `${theme.accent}80`, fontSize: 10, fontWeight: '700' }}>{allUsers.length} akun</Text>
                  </View>
                </Animated.View>
              </>
            )}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInDown.delay(Math.min(index * 30, 300)).springify()}>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    marginHorizontal: 16, marginBottom: 8,
                    backgroundColor: theme.card,
                    borderRadius: 16, padding: 12,
                    borderWidth: 1, borderColor: `${theme.accent}15`,
                    overflow: 'hidden',
                  }}
                  activeOpacity={0.75}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedUser(item);
                    setShowUserDetail(true);
                  }}
                >
                  {/* Avatar with glow */}
                  <View style={{
                    shadowColor: theme.accent,
                    shadowOpacity: 0.25,
                    shadowRadius: 6,
                    elevation: 3,
                  }}>
                    <Image
                      source={{ uri: item.photoURL ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(item.displayName ?? 'User')}` }}
                      style={{
                        width: 42, height: 42, borderRadius: 13,
                        borderWidth: 1.5,
                        borderColor: item.isAdmin ? theme.accent : `${theme.accent}20`,
                      }}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }} numberOfLines={1}>
                        {item.displayName}
                      </Text>
                      {item.isAdmin && (
                        <View style={{
                          backgroundColor: `${theme.accent}20`,
                          paddingHorizontal: 5, paddingVertical: 2,
                          borderRadius: 4, borderWidth: 1, borderColor: `${theme.accent}40`,
                        }}>
                          <Text style={{ color: theme.accent, fontSize: 7, fontWeight: '900', letterSpacing: 0.5 }}>ADMIN</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: theme.subtext, fontSize: 10, marginTop: 2 }} numberOfLines={1}>{item.email}</Text>
                  </View>

                  {/* Level + XP */}
                  <View style={{ alignItems: 'flex-end', gap: 2 }}>
                    <View style={{
                      backgroundColor: `${theme.accent}18`,
                      paddingHorizontal: 8, paddingVertical: 3,
                      borderRadius: 8, borderWidth: 1, borderColor: `${theme.accent}30`,
                    }}>
                      <Text style={{ color: theme.accent, fontWeight: '900', fontSize: 11 }}>Lv {item.level ?? 1}</Text>
                    </View>
                    <Text style={{ color: theme.subtext, fontSize: 9 }}>{(item.xp ?? 0).toLocaleString()} XP</Text>
                  </View>

                  <Ionicons name="chevron-forward" size={13} color={`${theme.accent}40`} />
                </TouchableOpacity>
              </Animated.View>
            )}
            ListEmptyComponent={
              loading ? (
                <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                  <Text style={{ color: theme.accent, fontWeight: '700' }}>Memuat...</Text>
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
