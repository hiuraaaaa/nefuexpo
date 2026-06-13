
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '@/constants';
import type { ChatMessage } from '../hooks/useRoom';

interface Props {
  messages: ChatMessage[];
  currentUid: string;
  onSend: (text: string) => void;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export function ChatPanel({ messages, currentUid, onSend }: Props) {
  const [text, setText]   = useState('');
  const listRef           = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = () => {
    if (!text.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSend(text.trim());
    setText('');
  };

  const renderItem = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isMe    = item.uid === currentUid;
    const prev    = messages[index - 1];
    const showAvatar = !isMe && (!prev || prev.uid !== item.uid);
    const showName   = !isMe && showAvatar;

    return (
      <View style={{
        flexDirection: isMe ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        marginBottom: 4,
        marginTop: showName ? 8 : 0,
        paddingHorizontal: 12,
      }}>
        {/* Avatar — only for others, first in group */}
        {!isMe && (
          <View style={{ width: 28, marginRight: 6, marginBottom: 2 }}>
            {showAvatar ? (
              item.avatar ? (
                <Image source={{ uri: item.avatar }} style={{ width: 28, height: 28, borderRadius: 14 }} contentFit="cover" />
              ) : (
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>{item.display_name.charAt(0).toUpperCase()}</Text>
                </View>
              )
            ) : null}
          </View>
        )}

        <View style={{ maxWidth: '70%' }}>
          {showName && (
            <Text style={{ color: COLORS.gold, fontSize: 10, fontWeight: '700', marginBottom: 3, marginLeft: 2 }}>
              {item.display_name}
            </Text>
          )}
          <View style={{
            paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16,
            borderBottomRightRadius: isMe ? 4 : 16,
            borderBottomLeftRadius:  isMe ? 16 : 4,
            backgroundColor: isMe ? COLORS.gold : 'rgba(255,255,255,0.1)',
          }}>
            <Text style={{ color: isMe ? '#000' : '#fff', fontSize: 13, fontWeight: isMe ? '700' : '400', lineHeight: 18 }}>
              {item.text}
            </Text>
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, marginTop: 3, alignSelf: isMe ? 'flex-end' : 'flex-start', marginHorizontal: 4 }}>
            {formatTime(item.sent_at)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
            Live Chat
          </Text>
        </View>

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 8 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <Text style={{ fontSize: 28 }}>💬</Text>
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 8 }}>Belum ada pesan</Text>
            </View>
          )}
        />

        {/* Input */}
        <BlurView intensity={40} tint="dark" style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 12, paddingVertical: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Ketik pesan..."
              placeholderTextColor="rgba(255,255,255,0.25)"
              multiline
              maxLength={200}
              style={{
                flex: 1, color: '#fff', fontSize: 14,
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10,
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
                maxHeight: 80,
              }}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!text.trim()}
              style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: text.trim() ? COLORS.gold : 'rgba(255,255,255,0.08)',
                alignItems: 'center', justifyContent: 'center',
              }}>
              <Ionicons name="send" size={18} color={text.trim() ? '#000' : 'rgba(255,255,255,0.3)'} />
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    </KeyboardAvoidingView>
  );
}
