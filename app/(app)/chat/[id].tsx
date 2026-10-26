import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  FlatList,
  Keyboard,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInUp, Layout, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Avatar } from '@/components/ui/Avatar';
import { Text, Heading } from '@/components/ui/Text';
import { spacing } from '@/theme/spacing';
import { colors } from '@/theme/colors';
import { useAuthStore } from '@/store/auth.store';
import { socketService } from '@/services/socket.service';
import { chatsService, ChatMessage, ChatParticipant } from '@/services/chats.service';
import { audioPlayerService } from '@/services/audioPlayer.service';
import { VoiceRecorder } from '@/components/chat/VoiceRecorder';
import { VoiceMessageBubble } from '@/components/chat/VoiceMessageBubble';
import { EmojiPicker } from '@/components/chat/EmojiPicker';

export default function ChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>(); // This is the chatId
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();

  const currentUserId = user?.id || (user as any)?._id || '';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [otherUser, setOtherUser] = useState<ChatParticipant | null>(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isConnectionClosed, setIsConnectionClosed] = useState(false);
  const [connectionClosedReason, setConnectionClosedReason] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false),
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    // 1. Enter Chat - make inactive in explore pool to avoid duplicate requests
    if (currentUserId) {
      socketService.toggleActive(currentUserId, '', '', false);
    }

    // 2. Load Messages & Chat Details
    const loadChatData = async () => {
      try {
        const msgs = await chatsService.getMessages(id);
        setMessages(msgs);

        // Fetch single chat directly
        try {
          const chat = await chatsService.getChat(id);
          if (chat?.participants) {
            const partner = chat.participants.find(
              (p) => (p._id || (p as any).id) !== currentUserId,
            );
            if (partner) setOtherUser(partner);
          }
        } catch {
          // Fallback to chats list
          const allChats = await chatsService.getChats();
          const currentChat = allChats.find((c) => c._id === id);
          if (currentChat?.participants) {
            const participant = currentChat.participants.find(
              (p) => (p._id || (p as any).id) !== currentUserId,
            );
            if (participant) setOtherUser(participant);
          }
        }
      } catch (err) {
        console.error('Failed to load chat data', err);
      }
    };

    loadChatData();

    // 3. Socket Events
    socketService.joinChatRoom(id);

    const unsubReceive = socketService.onReceiveChatMessage((msg) => {
      if (msg.chatId === id) {
        setMessages((prev) => {
          // Avoid duplicate messages if already present
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    });

    const unsubPeerLeft = socketService.onPeerLeftChat((data) => {
      if (data.chatId === id) {
        setIsConnectionClosed(true);
        setConnectionClosedReason(data.message || 'Peer has left the chat.');
      }
    });

    const unsubChatClosed = socketService.onChatClosed((data) => {
      if (data.chatId === id) {
        setIsConnectionClosed(true);
        setConnectionClosedReason(data.message || 'Connection has been closed.');
      }
    });

    return () => {
      audioPlayerService.stop();
      socketService.leaveChatRoom(id);
      unsubReceive();
      unsubPeerLeft();
      unsubChatClosed();
    };
  }, [id, currentUserId]);

  const sendMessage = () => {
    if (!inputText.trim() || isConnectionClosed) return;

    const text = inputText.trim();
    setInputText('');

    socketService.sendChatMessage({
      chatId: id,
      senderId: currentUserId,
      text,
      senderAlias: user?.alias,
      senderAvatarId: user?.avatarId,
    });
  };

  const sendVoiceMessage = (audio: { dataUri: string; duration: number }) => {
    if (isConnectionClosed) return;
    setIsRecording(false);

    socketService.sendChatMessage({
      chatId: id,
      senderId: currentUserId,
      text: '🎤 Voice message',
      messageType: 'audio',
      audioData: audio.dataUri,
      audioDuration: audio.duration,
      senderAlias: user?.alias,
      senderAvatarId: user?.avatarId,
    });
  };

  const handleEndChat = () => {
    Alert.alert(
      'End Connection',
      'Are you sure you want to end this connection and close the chat?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Chat',
          style: 'destructive',
          onPress: () => {
            socketService.closeChat(id, currentUserId);
            socketService.leaveChatRoom(id);
            router.back();
          },
        },
      ],
    );
  };

  useEffect(() => {
    setTimeout(() => {
      if (messages.length > 0) {
        flatListRef.current?.scrollToEnd({ animated: true });
      }
    }, 150);
  }, [messages]);

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isMe =
      typeof item.senderId === 'string'
        ? item.senderId === currentUserId
        : (item.senderId as any)?._id === currentUserId ||
          (item.senderId as any)?.id === currentUserId;

    return (
      <Animated.View
        entering={FadeInUp.duration(300).delay(Math.min(index * 30, 300))}
        layout={Layout.springify().damping(16).stiffness(120)}
        style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowThem]}
      >
        {!isMe && (
          <Pressable
            style={styles.messageAvatar}
            onPress={() => {
              const partnerId = otherUser?._id || (otherUser as any)?.id;
              if (partnerId) {
                router.push(`/(app)/users/${partnerId}`);
              }
            }}
          >
            <Avatar
              avatarId={otherUser?.avatarId || 'avatar-1'}
              alias={otherUser?.alias}
              size={28}
            />
          </Pressable>
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
            {item.messageType === 'audio' && item.audioData ? (
              <VoiceMessageBubble
                messageId={item._id}
                audioData={item.audioData}
                duration={item.audioDuration}
                isMe={isMe}
              />
            ) : (
              <Text
                style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextThem]}
              >
                {item.text}
              </Text>
            )}
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

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ flex: 1, paddingTop: insets.top }}>
          {/* ── Header ──────────────────────────────────────────── */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="chevron-back" size={26} color="white" />
            </Pressable>

            <Pressable
              style={styles.headerProfile}
              onPress={() => {
                const partnerId = otherUser?._id || (otherUser as any)?.id;
                if (partnerId) {
                  router.push(`/(app)/users/${partnerId}`);
                }
              }}
            >
              <View style={styles.headerAvatarWrapper}>
                <Avatar
                  avatarId={otherUser?.avatarId || 'avatar-1'}
                  alias={otherUser?.alias || '...'}
                  size={40}
                />
                {!isConnectionClosed && <View style={styles.onlineDot} />}
              </View>
              <View>
                <Heading level={3} style={styles.headerName}>
                  {otherUser?.alias || 'Connected User'}
                </Heading>
                <Text style={styles.headerStatus}>
                  {isConnectionClosed ? 'Connection closed' : 'Live Connection'}
                </Text>
              </View>
            </Pressable>

            <Pressable onPress={handleEndChat} style={styles.endChatBtn}>
              <Ionicons name="close-circle-outline" size={24} color="#FF453A" />
            </Pressable>
          </View>

          {/* ── Closed Banner ───────────────────────────────────── */}
          {isConnectionClosed && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.closedBanner}>
              <Ionicons name="alert-circle" size={18} color="#FF453A" />
              <Text style={styles.closedBannerText}>
                {connectionClosedReason || 'This connection is closed.'}
              </Text>
            </Animated.View>
          )}

          {/* ── Messages List ───────────────────────────────────── */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, idx) => item._id || `msg-${idx}`}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={() => {
              Keyboard.dismiss();
              setShowEmojiPicker(false);
            }}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color="rgba(255,255,255,0.2)" />
                <Text style={styles.emptyText}>You are connected! Say heylo 👋</Text>
              </View>
            }
          />

          {/* ── Input Area ──────────────────────────────────────── */}
          {isConnectionClosed ? (
            <View
              style={[styles.closedFooter, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}
            >
              <Text style={styles.closedFooterText}>Connection has ended.</Text>
              <Pressable onPress={() => router.back()} style={styles.backToExploreBtn}>
                <Text style={styles.backToExploreText}>Back to Explore</Text>
              </Pressable>
            </View>
          ) : (
            <View
              style={[
                styles.footerContainer,
                {
                  paddingBottom:
                    isKeyboardVisible || showEmojiPicker
                      ? spacing.sm
                      : Math.max(insets.bottom, spacing.md),
                },
              ]}
            >
              {isRecording ? (
                <View style={styles.recordingWrapper}>
                  <VoiceRecorder onSend={sendVoiceMessage} onCancel={() => setIsRecording(false)} />
                </View>
              ) : (
                <View style={styles.inputArea}>
                  <View style={styles.inputRow}>
                    <Pressable
                      onPress={() => {
                        if (showEmojiPicker) {
                          setShowEmojiPicker(false);
                        } else {
                          Keyboard.dismiss();
                          setShowEmojiPicker(true);
                        }
                      }}
                      style={styles.emojiToggleBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name={showEmojiPicker ? 'keypad-outline' : 'happy-outline'}
                        size={24}
                        color={showEmojiPicker ? colors.primary : 'rgba(255,255,255,0.6)'}
                      />
                    </Pressable>

                    <TextInput
                      style={styles.input}
                      placeholder="Type a message..."
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={inputText}
                      onChangeText={setInputText}
                      onFocus={() => setShowEmojiPicker(false)}
                      multiline
                      maxLength={500}
                    />
                  </View>

                  {inputText.trim() ? (
                    <Animated.View style={styles.sendBtnActiveWrapper}>
                      <Pressable style={styles.sendBtn} onPress={sendMessage}>
                        <LinearGradient
                          colors={colors.primaryGradient}
                          style={StyleSheet.absoluteFillObject}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        />
                        <Ionicons
                          name="paper-plane"
                          size={20}
                          color="white"
                          style={{ marginLeft: 2 }}
                        />
                      </Pressable>
                    </Animated.View>
                  ) : (
                    <Pressable
                      style={styles.micBtn}
                      onPress={() => {
                        Keyboard.dismiss();
                        setShowEmojiPicker(false);
                        setIsRecording(true);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="mic" size={22} color="white" />
                    </Pressable>
                  )}
                </View>
              )}

              {showEmojiPicker && (
                <EmojiPicker
                  onSelectEmoji={(emoji) => setInputText((prev) => prev + emoji)}
                  onBackspace={() =>
                    setInputText((prev) => (prev.length > 0 ? prev.slice(0, -1) : ''))
                  }
                  onClose={() => setShowEmojiPicker(false)}
                />
              )}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerProfile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  headerAvatarWrapper: {
    position: 'relative',
    marginRight: spacing.sm,
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
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  headerStatus: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 1,
  },
  endChatBtn: {
    padding: spacing.xs,
  },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 69, 58, 0.25)',
  },
  closedBannerText: {
    color: '#FF6B6B',
    fontSize: 13,
    fontWeight: '600',
  },
  messagesContainer: {
    padding: spacing.lg,
    gap: spacing.md,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
    gap: spacing.sm,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.xs,
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageRowThem: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    marginRight: spacing.xs,
    marginBottom: 4,
  },
  messageContent: {
    maxWidth: '75%',
  },
  messageBubble: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 20,
    overflow: 'hidden',
  },
  messageBubbleMe: {
    borderBottomRightRadius: 4,
  },
  messageBubbleThem: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  messageTextMe: {
    color: 'white',
  },
  messageTextThem: {
    color: 'white',
  },
  timestamp: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
  },
  timestampMe: {
    alignSelf: 'flex-end',
  },
  timestampThem: {
    alignSelf: 'flex-start',
  },
  footerContainer: {
    backgroundColor: '#18181B',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  recordingWrapper: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  inputRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 24,
    paddingHorizontal: spacing.sm,
    paddingVertical: Platform.OS === 'ios' ? 6 : 2,
    maxHeight: 100,
  },
  emojiToggleBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 15,
    paddingHorizontal: spacing.xs,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendBtnActiveWrapper: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendBtnInactiveWrapper: {
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  closedFooter: {
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: '#18181B',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: spacing.sm,
  },
  closedFooterText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  backToExploreBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  backToExploreText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
});
