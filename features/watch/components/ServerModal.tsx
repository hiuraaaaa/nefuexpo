import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { COLORS } from '@/constants';
import { Server } from '@/types';
import { ServerGroup } from '../hooks/useEpisodeLoader';

interface Props {
  visible: boolean;
  serverGroup: ServerGroup;
  availableQualities: string[];
  selectedServer: Server | null;
  onClose: () => void;
  onSelect: (quality: string, server: Server) => void;
}

export function ServerModal({ visible, serverGroup, availableQualities, selectedServer, onClose, onSelect }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose}>
        <BlurView intensity={30} tint="dark" style={{ flex: 1 }}>
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: `${COLORS.card}f0`, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
            <View style={{ width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Pilih Kualitas & Server</Text>
            {availableQualities.map(quality => (
              <View key={quality} style={{ marginBottom: 16 }}>
                <Text style={{ color: COLORS.gold, fontWeight: '900', fontSize: 12, marginBottom: 8 }}>{quality}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {serverGroup[quality].map((s, idx) => {
                    const isActive = selectedServer?.id === s.id;
                    return (
                      <TouchableOpacity key={s.id} onPress={() => { Haptics.selectionAsync(); onSelect(quality, s); }}
                        style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: isActive ? COLORS.gold : 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: isActive ? COLORS.gold : 'rgba(255,255,255,0.1)' }}>
                        <Text style={{ color: isActive ? '#000' : '#fff', fontWeight: '900', fontSize: 12 }}>Server {idx + 1}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        </BlurView>
      </TouchableOpacity>
    </Modal>
  );
}
