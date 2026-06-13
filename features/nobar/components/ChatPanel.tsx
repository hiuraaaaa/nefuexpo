import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';\nimport { COLORS } from '@/constants';
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
  const [text, setText] = useState('');
  const listRef         = useRef<FlatList>(null);

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
    const isMe       = item.uid === currentUid;
    const prev       = messages[index - 1];
    const showAvatar = !isMe && (!prev || prev.uid !== item.uid);
    const showName   = !isMe && showAvatar;

    return (
      <View style={{
        flexDirection: isMe ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        marginBottom: 4,
        marginTop: showName ? 10 : 2,
        paddingHorizontal: 14,
      }}>
        {/* Avatar slot — others only */}
        {!isMe && (
          <View style={{ width: 30, marginRight: 6, marginBottom: 2 }}>
            {showAvatar && (
              item.avatar
                ? <Image source={{ uri: item.avatar }} style={{ width: 30, height: 30, borderRadius: 15 }} contentFit="cover" />
                : (
                  <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(246,207,128,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(246,207,128,0.3)' }}>
                    <Text style={{ color: COLORS.gold, fontSize: 12, fontWeight: '900' }}>{item.display_name.charAt(0).toUpperCase()}</Text>
                  </View>
                )
            )}
          </View>
        )}

        <View style={{ maxWidth: '72%' }}>
          {showName && (
            <Text style={{ color: COLORS.gold, fontSize: 10, fontWeight: '700', marginBottom: 3, marginLeft: 2, opacity: 0.85 }}>
              {item.display_name}
            </Text>
          )}
          <View style={{
            paddingHorizontal: 12, paddingVertical: 8,
            borderRadius: 18,
            borderBottomRightRadius: isMe ? 4 : 18,
            borderBottomLeftRadius:  isMe ? 18 : 4,
            backgroundColor: isMe
              ? COLORS.gold
              : 'rgba(255,255,255,0.09)',
            borderWidth: isMe ? 0 : 1,
            borderColor: 'rgba(255,255,255,0.07)',
          }}>
            <Text style={{ color: isMe ? '#1a1208' : 'rgba(255,255,255,0.88)', fontSize: 13, fontWeight: isMe ? '700' : '400', lineHeight: 19 }}>
              {item.text}
            </Text>
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.18)', fontSize: 9, marginTop: 3, alignSelf: isMe ? 'flex-end' : 'flex-start', marginHorizontal: 2 }}>
            {formatTime(item.sent_at)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      style={{ flex: 1 }}
    >
      {/* Messages — flex:1 supaya isi ruang yang tersisa */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 10, flexGrow: 1, justifyContent: messages.length === 0 ? 'center' : 'flex-start' }}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        ListEmptyComponent={() => (
          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <Text style={{ fontSize: 32 }}>💬</Text>
            <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 8, fontWeight: '600' }}>Mulai obrolan nobar!</Text>
          </View>
        )}
      />

      {/* Input — sticky di bawah */}
      <View style={{
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.07)',
        paddingHorizontal: 12,
        paddingVertical: 10,
        paddingBottom: Platform.OS === 'android' ? 12 : 10,
        backgroundColor: 'rgba(18,15,10,0.95)',
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
      }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Ketik pesan..."
          placeholderTextColor="rgba(255,255,255,0.2)"
          multiline
          maxLength={200}
          style={{
            flex: 1,
            color: '#fff',
            fontSize: 14,
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderRadius: 22,
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: 10,
            borderWidth: 1,
            borderColor: text.trim() ? `${COLORS.gold}50` : 'rgba(255,255,255,0.08)',
            maxHeight: 90,
            lineHeight: 19,
          }}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          blurOnSubmit={false}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!text.trim()}
          style={{
            width: 42, height: 42, borderRadius: 21,
            backgroundColor: text.trim() ? COLORS.gold : 'rgba(255,255,255,0.07)',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 1,
          }}
        >
          <Ionicons name="send" size={17} color={text.trim() ? '#1a1208' : 'rgba(255,255,255,0.25)'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
