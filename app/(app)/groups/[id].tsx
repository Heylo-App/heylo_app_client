import { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, Heading } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { GroupChatSkeleton } from '@/components/skeletons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { groupsService } from '@/services/groups.service';
import { socketService } from '@/services/socket.service';
import { audioPlayerService } from '@/services/audioPlayer.service';
import { useAuthStore } from '@/store/auth.store';
import { VoiceRecorder } from '@/components/chat/VoiceRecorder';
import { VoiceMessageBubble } from '@/components/chat/VoiceMessageBubble';
import { EmojiPicker } from '@/components/chat/EmojiPicker';
import type { Group, GroupMessage } from '@/types/groups';

export default function GroupChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();

  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(true);
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
    const fetchData = async () => {
      try {
        const groups = await groupsService.getGroups();
        const currentGroup = groups.find((g) => g._id === id);
        if (currentGroup) setGroup(currentGroup);

        const msgs = await groupsService.getMessages(id);
        setMessages(msgs);
      } catch (error) {
        console.error('Error fetching group chat', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Setup Socket
    socketService.joinGroupRoom(id);
    const unsubscribe = socketService.onReceiveGroupMessage((newMsg) => {
      if (newMsg.groupId === id) {
        setMessages((prev) => {
          // Prevent duplicate messages
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    });

    return () => {
      audioPlayerService.stop();
      unsubscribe();
      socketService.leaveGroupRoom(id);
    };
  }, [id]);

  const handleSend = () => {
    if (!inputText.trim() || !user) return;

    socketService.sendGroupMessage({
      groupId: id,
      senderId: user.id,
      text: inputText.trim(),
      senderAlias: user.alias,
      senderUsername: user.username,
      senderAvatarId: user.avatarId,
    });

    setInputText('');
  };

  const sendVoiceMessage = (audio: { dataUri: string; duration: number }) => {
    if (!user) return;
    setIsRecording(false);

    socketService.sendGroupMessage({
      groupId: id,
      senderId: user.id,
      text: '🎤 Voice message',
      messageType: 'audio',
      audioData: audio.dataUri,
      audioDuration: audio.duration,
      senderAlias: user.alias,
      senderUsername: user.username,
      senderAvatarId: user.avatarId,
    });
  };

  const renderMessage = ({ item }: { item: GroupMessage }) => {
    const isMe = item.senderId._id === user?.id;
    return (
      <View style={[styles.msgContainer, isMe ? styles.msgMe : styles.msgThem]}>
        {!isMe && (
          <Pressable
            onPress={() => item.senderId?._id && router.push(`/(app)/users/${item.senderId._id}`)}
            style={styles.msgAvatar}
          >
            <Avatar avatarId={item.senderId.avatarId} size={32} />
          </Pressable>
        )}
        <View style={styles.msgContentWrapper}>
          {!isMe && (
            <Pressable
              onPress={() => item.senderId?._id && router.push(`/(app)/users/${item.senderId._id}`)}
            >
              <Text style={styles.msgSenderName}>{item.senderId.alias}</Text>
            </Pressable>
          )}
          <View style={[styles.msgBubble, isMe ? styles.msgBubbleMe : styles.msgBubbleThem]}>
            {item.messageType === 'audio' && item.audioData ? (
              <VoiceMessageBubble
                messageId={item._id}
                audioData={item.audioData}
                duration={item.audioDuration}
                isMe={isMe}
              />
            ) : (
              <Text style={styles.msgText}>{item.text}</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <LinearGradient colors={['#18181B', '#000000']} style={StyleSheet.absoluteFillObject} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.chatArea}
      >
        <View style={{ flex: 1, paddingTop: insets.top }}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>
            <Pressable
              onPress={() => router.push(`/(app)/groups/info/${id}`)}
              style={styles.headerTitleContainer}
            >
              <Heading level={2} style={styles.headerTitle}>
                {group?.name || 'Group'}
              </Heading>
            </Pressable>
            <Pressable
              onPress={() => router.push(`/(app)/groups/info/${id}`)}
              style={styles.iconBtn}
            >
              <Ionicons name="information-circle" size={24} color="white" />
            </Pressable>
          </View>

          {loading ? (
            <GroupChatSkeleton />
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item._id}
              renderItem={renderMessage}
              contentContainerStyle={styles.messageList}
              onScrollBeginDrag={() => {
                Keyboard.dismiss();
                setShowEmojiPicker(false);
              }}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            />
          )}

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
              <View style={styles.inputContainer}>
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
                    value={inputText}
                    onChangeText={setInputText}
                    onFocus={() => setShowEmojiPicker(false)}
                    placeholder="Message group..."
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    multiline
                    maxLength={500}
                  />
                </View>

                {inputText.trim() ? (
                  <Pressable style={styles.sendBtn} onPress={handleSend}>
                    <LinearGradient
                      colors={colors.primaryGradient}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <Ionicons name="send" size={18} color="white" style={styles.sendIcon} />
                  </Pressable>
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
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.white },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },

  chatArea: { flex: 1 },
  messageList: { padding: spacing.md, paddingBottom: spacing.xl },

  msgContainer: { flexDirection: 'row', marginBottom: spacing.md, maxWidth: '85%' },
  msgMe: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  msgThem: { alignSelf: 'flex-start', justifyContent: 'flex-start' },
  msgAvatar: { marginRight: 8, justifyContent: 'flex-end' },
  msgContentWrapper: { flexShrink: 1 },
  msgSenderName: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4, marginLeft: 4 },
  msgBubble: { padding: 12, borderRadius: 18 },
  msgBubbleMe: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  msgBubbleThem: { backgroundColor: 'rgba(255,255,255,0.1)', borderBottomLeftRadius: 4 },
  msgText: { fontSize: 16, color: colors.white, lineHeight: 22 },

  footerContainer: {
    backgroundColor: '#18181B',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  recordingWrapper: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  inputContainer: {
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
    color: colors.white,
    fontSize: 15,
    paddingHorizontal: spacing.xs,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendIcon: {
    paddingLeft: 2,
  },
});
