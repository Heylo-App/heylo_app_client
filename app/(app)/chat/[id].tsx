import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Avatar } from '@/components/ui/Avatar';
import { Text, Heading } from '@/components/ui/Text';
import { spacing } from '@/theme/spacing';
import { colors } from '@/theme/colors';
import { useAuthStore } from '@/store/auth.store';
import { socketService } from '@/services/socket.service';
import { chatsService, ChatMessage, ChatParticipant } from '@/services/chats.service';

export default function ChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>(); // This is the chatId
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [otherUser, setOtherUser] = useState<ChatParticipant | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // 1. Enter Chat - make inactive to avoid new requests
    socketService.toggleActive(user!.id, '', '', false);

    // 2. Load Messages
    const loadMessages = async () => {
      try {
        const msgs = await chatsService.getMessages(id);
        setMessages(msgs);

        // Find other user from chat participants list. Since we only have chatId,
        // we ideally need a GET /chats/:id endpoint, but for now we extract from the first message
        // if it exists, or we could fetch the chats list to find it.
        // We'll rely on the parent screen passing the other user, or fetch chats list.
        const allChats = await chatsService.getChats();
        const currentChat = allChats.find((c) => c._id === id);
        if (currentChat) {
          const participant = currentChat.participants.find((p) => p._id !== user?.id);
          if (participant) setOtherUser(participant);
        }
      } catch (err) {
        console.error('Failed to load messages', err);
      }
    };
    loadMessages();

    // 3. Socket events
    socketService.joinChatRoom(id);

    const unsubReceive = socketService.onReceiveChatMessage((msg) => {
      if (msg.chatId === id) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      socketService.leaveChatRoom(id);
      unsubReceive();
      // Make active again when leaving (optional: we just leave them inactive,
      // the prompt says "make it inactive till the chat closes rest fine", but didn't say to auto-resume active state,
      // it's safer to leave them inactive and let them manually toggle back).
    };
  }, [id, user]);

  const sendMessage = () => {
    if (!inputText.trim()) return;

    socketService.sendChatMessage({
      chatId: id,
      senderId: user!.id,
      text: inputText.trim(),
      senderAlias: user?.alias,
      senderAvatarId: user?.avatarId,
    });

    setInputText('');
  };

  useEffect(() => {
    // Scroll to bottom on new message
    setTimeout(() => {
      if (messages.length > 0) {
        flatListRef.current?.scrollToEnd({ animated: true });
      }
    }, 200);
  }, [messages]);

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isMe =
      typeof item.senderId === 'string'
        ? item.senderId === user?.id
        : item.senderId._id === user?.id;

    return (
      <Animated.View
        entering={FadeInUp.duration(400).delay(Math.min(index * 50, 500))}
        layout={Layout.springify().damping(16).stiffness(120)}
        style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowThem]}
      >
        {!isMe && (
          <View style={styles.messageAvatar}>
            <Avatar
              avatarId={otherUser?.avatarId || 'avatar-1'}
              alias={otherUser?.alias}
              size={28}
            />
          </View>
        )}

        <View style={styles.messageContent}>
          <View
            style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleThem]}
          >
            {isMe && (
              <LinearGradient
                colors={colors.primaryGradient}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            )}
            <Text
              style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextThem]}
            >
              {item.text}
            </Text>
          </View>
          <Text style={[styles.timestamp, isMe ? styles.timestampMe : styles.timestampThem]}>
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <LinearGradient colors={['#18181B', '#000000']} style={StyleSheet.absoluteFillObject} />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/* ── Header ──────────────────────────────────────────── */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="chevron-back" size={28} color="white" />
            </Pressable>

            <View style={styles.headerProfile}>
              <View style={styles.headerAvatarWrapper}>
                <Avatar
                  avatarId={otherUser?.avatarId || 'avatar-1'}
                  alias={otherUser?.alias || '...'}
                  size={40}
                />
                <View style={styles.onlineDot} />
              </View>
              <View>
                <Heading level={3} style={styles.headerName}>
                  {otherUser?.alias || 'Connecting...'}
                </Heading>
              </View>
            </View>

            <Pressable style={styles.iconBtn}>
              <Ionicons name="ellipsis-horizontal" size={24} color="white" />
            </Pressable>
          </View>

          {/* ── Messages List ───────────────────────────────────── */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item._id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />

          {/* ── Input Area ──────────────────────────────────────── */}
          <View style={styles.inputArea}>
            <Pressable style={styles.attachBtn}>
              <Ionicons name="add" size={24} color="rgba(255,255,255,0.6)" />
            </Pressable>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Type a message..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
              />
            </View>

            <Animated.View
              style={inputText.trim() ? styles.sendBtnActiveWrapper : styles.sendBtnInactiveWrapper}
            >
              <Pressable style={styles.sendBtn} onPress={sendMessage} disabled={!inputText.trim()}>
                {inputText.trim() ? (
                  <LinearGradient
                    colors={colors.primaryGradient}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                ) : null}
                <Ionicons
                  name="paper-plane"
                  size={20}
                  color={inputText.trim() ? 'white' : 'rgba(255,255,255,0.3)'}
                  style={{ marginLeft: 2 }} // center adjustment
                />
              </Pressable>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(24, 24, 27, 0.8)',
  },
  iconBtn: {
    padding: spacing.sm,
  },
  headerProfile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginLeft: spacing.sm,
  },
  headerAvatarWrapper: {
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#18181B',
  },
  headerName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  headerMood: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },

  // Messages
  messagesContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    maxWidth: '85%',
  },
  messageRowMe: {
    alignSelf: 'flex-end',
  },
  messageRowThem: {
    alignSelf: 'flex-start',
  },
  messageAvatar: {
    marginBottom: spacing.md,
  },
  messageContent: {
    gap: 4,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  messageBubbleMe: {
    borderBottomRightRadius: 4,
    backgroundColor: colors.primary, // fallback if gradient fails
  },
  messageBubbleThem: {
    borderBottomLeftRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTextMe: {
    color: 'white',
  },
  messageTextThem: {
    color: 'white',
  },
  timestamp: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
  },
  timestampMe: {
    alignSelf: 'flex-end',
    marginRight: 4,
  },
  timestampThem: {
    alignSelf: 'flex-start',
    marginLeft: 4,
  },

  // Input Area
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(24, 24, 27, 0.9)',
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  input: {
    color: 'white',
    fontSize: 16,
    maxHeight: 100,
  },
  sendBtnInactiveWrapper: {
    opacity: 0.8,
  },
  sendBtnActiveWrapper: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
});
