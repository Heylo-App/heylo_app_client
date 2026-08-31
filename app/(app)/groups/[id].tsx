import { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Share,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';

import { Text, Heading } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { groupsService } from '@/services/groups.service';
import { socketService } from '@/services/socket.service';
import { useAuthStore } from '@/store/auth.store';
import type { Group, GroupMessage } from '@/types/groups';

export default function GroupChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberUsername, setMemberUsername] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const flatListRef = useRef<FlatList>(null);

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
      }
    };

    fetchData();

    // Setup Socket
    socketService.joinGroupRoom(id);
    const unsubscribe = socketService.onReceiveGroupMessage((newMsg) => {
      if (newMsg.groupId === id) {
        setMessages((prev) => [...prev, newMsg]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    });

    return () => {
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

  const handleSettings = () => {
    if (!group || !user) return;

    const isAdmin = group.adminId === user.id;

    Alert.alert(group.name, 'Group Settings', [
      {
        text: 'Copy Invite Link',
        onPress: () => {
          Clipboard.setStringAsync(`heylo://groups/invite/${group.inviteCode}`);
          Alert.alert('Copied!', 'Invite link copied to clipboard.');
        },
      },
      { text: 'Add Member', onPress: () => setShowAddMember(true) },
      { text: 'Cancel', style: 'cancel' },
      isAdmin
        ? { text: 'Delete Group', style: 'destructive', onPress: handleDelete }
        : { text: 'Leave Group', style: 'destructive', onPress: handleLeave },
    ]);
  };

  const handleDelete = async () => {
    Alert.alert('Delete Group', 'Are you sure you want to delete this group?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await groupsService.deleteGroup(id);
          router.back();
        },
      },
    ]);
  };

  const handleLeave = async () => {
    Alert.alert('Leave Group', 'Are you sure you want to leave?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            await groupsService.leaveGroup(id);
            router.back();
          } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.message || 'Could not leave group');
          }
        },
      },
    ]);
  };

  const handleAddMemberSubmit = async () => {
    if (!memberUsername.trim()) return;
    setIsAddingMember(true);
    try {
      await groupsService.addMember(id, memberUsername.trim());
      Alert.alert('Success', 'Member added successfully');
      setShowAddMember(false);
      setMemberUsername('');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not add member');
    } finally {
      setIsAddingMember(false);
    }
  };

  const renderMessage = ({ item }: { item: GroupMessage }) => {
    const isMe = item.senderId._id === user?.id;
    return (
      <View style={[styles.msgContainer, isMe ? styles.msgMe : styles.msgThem]}>
        {!isMe && (
          <View style={styles.msgAvatar}>
            <Avatar avatarId={item.senderId.avatarId} size={32} />
          </View>
        )}
        <View style={styles.msgContentWrapper}>
          {!isMe && <Text style={styles.msgSenderName}>{item.senderId.alias}</Text>}
          <View style={[styles.msgBubble, isMe ? styles.msgBubbleMe : styles.msgBubbleThem]}>
            <Text style={styles.msgText}>{item.text}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <LinearGradient colors={['#18181B', '#000000']} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={styles.safeArea}>
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
            <Text style={styles.headerSubtitle}>Tap for group info</Text>
          </Pressable>
          <Pressable onPress={handleSettings} style={styles.iconBtn}>
            <Ionicons name="ellipsis-vertical" size={24} color="white" />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.chatArea}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item._id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Message group..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              multiline
            />
            <Pressable
              style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <LinearGradient
                colors={colors.primaryGradient}
                style={StyleSheet.absoluteFillObject}
              />
              <Ionicons name="send" size={20} color="white" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>

        {showAddMember && (
          <View
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: 'rgba(0,0,0,0.7)',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 100,
              },
            ]}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ width: '80%' }}
            >
              <View style={{ backgroundColor: '#18181B', padding: 24, borderRadius: 16 }}>
                <Heading level={3} style={{ color: 'white', marginBottom: 16 }}>
                  Add Member
                </Heading>
                <TextInput
                  style={styles.input}
                  value={memberUsername}
                  onChangeText={setMemberUsername}
                  placeholder="Enter username"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  autoCapitalize="none"
                  autoFocus
                />
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    marginTop: 24,
                    gap: 16,
                  }}
                >
                  <Pressable onPress={() => setShowAddMember(false)}>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleAddMemberSubmit}
                    disabled={isAddingMember || !memberUsername.trim()}
                  >
                    <Text
                      style={{
                        color:
                          !memberUsername.trim() || isAddingMember
                            ? 'rgba(236,72,153,0.5)'
                            : colors.primary,
                        fontWeight: '700',
                      }}
                    >
                      {isAddingMember ? 'Adding...' : 'Add'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        )}
      </SafeAreaView>
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

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    color: colors.white,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 40,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
    overflow: 'hidden',
  },
});
