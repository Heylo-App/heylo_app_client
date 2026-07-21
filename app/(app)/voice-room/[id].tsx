import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Pressable, Platform, TextInput, FlatList, KeyboardAvoidingView, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { Text, Heading } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { spacing } from '@/theme/spacing';
import { colors } from '@/theme/colors';
import { useAuthStore } from '@/store/auth.store';

const RED = '#EF4444';

interface ChatMessage {
  id: string;
  author: string;
  avatarId: string;
  text: string;
  time: string;
}

export default function VoiceRoomScreen() {
  const { id, isHost, title, topic } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();

  const [joinStatus, setJoinStatus] = useState<'waiting' | 'joined'>(isHost === 'true' ? 'joined' : 'waiting');
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false); // Default to off
  
  // Chat state
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', author: 'NeonDrift', avatarId: 'avatar-1', text: 'Welcome to the room everyone!', time: '10:00 AM' },
    { id: '2', author: 'Sarah J.', avatarId: 'avatar-2', text: 'Hey! Good to be here.', time: '10:01 AM' },
    { id: '3', author: 'David K.', avatarId: 'avatar-4', text: 'Can\'t wait to discuss today\'s topic.', time: '10:02 AM' },
    { id: '4', author: 'Elena G.', avatarId: 'avatar-3', text: 'Same here!', time: '10:02 AM' },
  ]);
  const flatListRef = useRef<FlatList>(null);

  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);

  // Mock waiting approval if not host
  useEffect(() => {
    if (isHost === 'true') return;

    pulseScale.value = withRepeat(withSequence(
      withTiming(1.2, { duration: 1000 }),
      withTiming(1, { duration: 1000 })
    ), -1, true);

    pulseOpacity.value = withRepeat(withSequence(
      withTiming(0.4, { duration: 1000 }),
      withTiming(1, { duration: 1000 })
    ), -1, true);

    const timer = setTimeout(() => {
      setJoinStatus('joined');
    }, 3000); // 3 seconds wait time

    return () => clearTimeout(timer);
  }, [isHost]);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      author: user?.alias || 'Me',
      avatarId: user?.avatarId || 'avatar-1',
      text: chatMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, newMessage]);
    setChatMessage('');
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleLeaveRoom = () => {
    if (isHost === 'true') {
      Alert.alert(
        'End Room',
        'Are you sure you want to leave? The room will be ended for everyone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'End Room', style: 'destructive', onPress: () => router.back() }
        ]
      );
    } else {
      Alert.alert(
        'Leave Room',
        'Are you sure you want to leave this room?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Leave', style: 'destructive', onPress: () => router.back() }
        ]
      );
    }
  };

  // Simplified Roles: One Host, rest Public
  const host = isHost === 'true' 
    ? { id: 'me', name: user?.alias || 'Me', avatarId: user?.avatarId || 'avatar-1', isSpeaking: true, role: 'Host' }
    : { id: '1', name: 'NeonDrift', avatarId: 'avatar-1', isSpeaking: true, role: 'Host' };
  
  const publicUsers = isHost === 'true' ? [] : [
    { id: '2', name: 'Sarah J.', avatarId: 'avatar-2' },
    { id: '3', name: 'David K.', avatarId: 'avatar-4' },
    { id: '4', name: 'Elena G.', avatarId: 'avatar-3' },
    { id: '5', name: 'Alex M.', avatarId: 'avatar-5' },
    { id: '6', name: 'Sam R.', avatarId: 'avatar-6' },
    { id: 'me', name: user?.alias || 'Me', avatarId: user?.avatarId || 'avatar-1' },
  ];

  const allMembers = [host, ...publicUsers];

  if (joinStatus === 'waiting') {
    return (
      <View style={styles.mainContainer}>
        <LinearGradient colors={['#18181B', '#000000']} style={StyleSheet.absoluteFillObject} />
        <SafeAreaView style={[styles.safeArea, styles.centeredArea]}>
          <Pressable style={styles.iconButtonLeft} onPress={() => router.back()}>
            <Ionicons name="close" size={28} color="white" />
          </Pressable>
          <Animated.View style={[styles.pulseCircle, animatedPulseStyle]}>
            <Ionicons name="lock-closed" size={48} color={colors.primary} />
          </Animated.View>
          <Text style={styles.waitingTitle}>Waiting for Admin</Text>
          <Text style={styles.waitingSubtitle}>The host has been notified you want to join.</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <LinearGradient colors={['#18181B', '#000000']} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        
        {/* Header */}
        <Animated.View entering={FadeInUp.duration(400)} style={styles.header}>
          <View style={styles.headerLeft}>
            <Heading level={3} style={styles.headerTitle} numberOfLines={1}>
              {title || 'Live Room'}
            </Heading>
          </View>
          <Pressable style={styles.leaveHeaderButton} onPress={handleLeaveRoom}>
            <Text style={styles.leaveHeaderText}>Leave</Text>
          </Pressable>
        </Animated.View>

        {/* Top Members Bar */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.membersBarContainer}>
          {/* Stacked Avatars - capped at 5 to prevent overflow */}
          <View style={styles.avatarStackRow}>
            {allMembers.slice(0, 5).map((member, index) => (
              <View
                key={member.id}
                style={[styles.avatarStackItem, { marginLeft: index > 0 ? -10 : 0, zIndex: 5 - index }]}
              >
                <View style={[styles.avatarWrapperCompact, member.role === 'Host' && styles.speakingRingCompact]}>
                  <Avatar avatarId={member.avatarId} alias={member.name} size={32} />
                  {member.role === 'Host' && (
                    <View style={styles.hostBadgeCompact}>
                      <Ionicons name="star" size={7} color="white" />
                    </View>
                  )}
                </View>
              </View>
            ))}
            {allMembers.length > 5 && (
              <View style={[styles.avatarStackItem, { marginLeft: -10, zIndex: 0 }]}>
                <View style={styles.overflowBubble}>
                  <Text style={styles.overflowBubbleText}>+{allMembers.length - 5}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Member Count Badge */}
          <Pressable style={styles.memberCountBadge} onPress={() => setShowAllMembers(true)}>
            <Ionicons name="people-outline" size={14} color="rgba(255,255,255,0.85)" />
            <Text style={styles.memberCountText}>{allMembers.length}</Text>
            <Ionicons name="chevron-down" size={12} color="rgba(255,255,255,0.5)" />
          </Pressable>
        </Animated.View>

        {/* Main Chat Area */}
        <KeyboardAvoidingView 
          style={styles.chatArea} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.chatListContent}
            renderItem={({ item }) => {
              const isMe = item.author === (user?.alias || 'Me');
              return (
                <Animated.View entering={FadeInDown.duration(300)} style={[styles.chatMessageItem, isMe && styles.chatMessageItemMe]}>
                  {!isMe && <Avatar avatarId={item.avatarId} alias={item.author} size={36} />}
                  <View style={[styles.chatBubble, isMe ? styles.chatBubbleMe : styles.chatBubbleOther]}>
                    {!isMe && (
                      <View style={styles.chatMessageHeader}>
                        <Text style={styles.chatMessageAuthor}>{item.author}</Text>
                        <Text style={styles.chatMessageTime}>{item.time}</Text>
                      </View>
                    )}
                    <Text style={styles.chatMessageText}>{item.text}</Text>
                    {isMe && <Text style={styles.chatMessageTimeMe}>{item.time}</Text>}
                  </View>
                </Animated.View>
              );
            }}
          />

          {/* Bottom Input Area */}
          <Animated.View entering={FadeInUp.duration(400).delay(200)} style={styles.inputArea}>
            <Pressable 
              style={[styles.micButton, isMicOn && styles.micButtonActive]}
              onPress={() => setIsMicOn(!isMicOn)}
            >
              <Ionicons name={isMicOn ? "mic" : "mic-off-outline"} size={22} color={isMicOn ? "white" : RED} />
            </Pressable>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.chatInput}
                placeholder="Message room..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={chatMessage}
                onChangeText={setChatMessage}
                multiline
              />
              <Pressable 
                style={[styles.sendBtn, !chatMessage.trim() && { opacity: 0.5 }]} 
                onPress={handleSendMessage}
                disabled={!chatMessage.trim()}
              >
                <Ionicons name="send" size={18} color={colors.primary} />
              </Pressable>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>

        {/* All Members Expanded Modal */}
        {showAllMembers && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.overlayWrapper}>
            <BlurView intensity={80} tint="dark" style={styles.overlay}>
              <Pressable style={styles.overlayDismiss} onPress={() => setShowAllMembers(false)} />
              <Animated.View entering={SlideInDown.duration(350)} style={styles.membersSheet}>
                <View style={styles.sheetHandle} />
                <View style={styles.sheetHeader}>
                  <Heading level={3} style={styles.sheetTitle}>Room Members ({allMembers.length})</Heading>
                  <Pressable onPress={() => setShowAllMembers(false)}>
                    <Ionicons name="close" size={24} color="rgba(255,255,255,0.6)" />
                  </Pressable>
                </View>

                {/* Clean Vertical List View for Members */}
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.membersListContent}>
                  {allMembers.map((member, index) => (
                    <Animated.View 
                      key={member.id} 
                      entering={FadeInDown.duration(300).delay(index * 40)} 
                      style={styles.memberListItem}
                    >
                      <View style={styles.memberListLeft}>
                        <View style={member.role === 'Host' && styles.avatarHostRing}>
                          <Avatar avatarId={member.avatarId} alias={member.name} size={48} />
                        </View>
                        <View style={styles.memberListInfo}>
                          <Text style={styles.memberListName}>{member.name}</Text>
                          <Text style={styles.memberListRole}>{member.role || 'Public'}</Text>
                        </View>
                      </View>
                      {member.role === 'Host' && (
                        <View style={styles.hostBadgeList}>
                          <Ionicons name="star" size={10} color="white" />
                          <Text style={styles.hostBadgeText}>Host</Text>
                        </View>
                      )}
                    </Animated.View>
                  ))}
                </ScrollView>
              </Animated.View>
            </BlurView>
          </Animated.View>
        )}

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },
  centeredArea: { justifyContent: 'center', alignItems: 'center' },
  
  // Waiting State
  iconButtonLeft: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
  pulseCircle: {
    width: 120, height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2xl'],
    borderWidth: 2,
    borderColor: 'rgba(124, 58, 237, 0.4)',
  },
  waitingTitle: { fontSize: 24, fontWeight: '800', color: 'white', marginBottom: spacing.sm },
  waitingSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.5)', textAlign: 'center', paddingHorizontal: 40 },

  // Room Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20, fontWeight: '800', color: colors.white,
  },
  headerSubtitle: {
    fontSize: 13, color: colors.primary, fontWeight: '600', marginTop: 2,
  },
  leaveHeaderButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  leaveHeaderText: {
    color: RED,
    fontWeight: '700',
    fontSize: 14,
  },

  // Members Bar (Top)
  membersBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  avatarStackRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarStackItem: {
    // each avatar in the stack
  },
  overflowBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: '#18181B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overflowBubbleText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '700',
  },
  avatarWrapperCompact: {
    position: 'relative',
    borderRadius: 19,
    borderWidth: 2,
    borderColor: '#18181B',
  },
  speakingRingCompact: {
    borderColor: colors.primary,
  },
  hostBadgeCompact: {
    position: 'absolute',
    bottom: -3, right: -3,
    backgroundColor: colors.primary,
    borderRadius: 7,
    width: 14, height: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#18181B',
  },
  memberCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  memberCountText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
  // Legacy styles (kept for compatibility)
  membersScroll: {
    paddingRight: spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
  },
  memberAvatarCompact: {},
  expandMembersBtn: {},
  expandMembersText: {},

  // Main Chat Area
  chatArea: {
    flex: 1,
  },
  chatListContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  chatMessageItem: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    maxWidth: '85%',
  },
  chatMessageItemMe: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  chatBubble: {
    padding: spacing.md,
    borderRadius: 20,
  },
  chatBubbleOther: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderBottomLeftRadius: 4,
  },
  chatBubbleMe: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  chatMessageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  chatMessageAuthor: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
  chatMessageTime: { fontSize: 11, color: 'rgba(255,255,255,0.3)' },
  chatMessageTimeMe: { fontSize: 11, color: 'rgba(255,255,255,0.6)', alignSelf: 'flex-end', marginTop: 4 },
  chatMessageText: { fontSize: 15, color: 'white', lineHeight: 22 },

  // Input Area
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md,
    backgroundColor: '#0A0A0F',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    gap: spacing.sm,
  },
  micButton: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.1)', 
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  micButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 22,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    minHeight: 44,
  },
  chatInput: {
    flex: 1,
    color: 'white',
    fontSize: 15,
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },

  // Members Sheet (Clean Layout)
  overlayWrapper: { ...StyleSheet.absoluteFillObject, zIndex: 100 },
  overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  overlayDismiss: { ...StyleSheet.absoluteFillObject },
  membersSheet: {
    backgroundColor: '#111115',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg, paddingBottom: spacing.xl,
    height: '75%',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
    width: '100%',
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center', marginBottom: spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: 'white' },
  membersListContent: {
    paddingBottom: spacing['4xl'],
    paddingTop: spacing.sm,
  },
  memberListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  memberListLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarHostRing: {
    borderRadius: 26,
    borderWidth: 2,
    borderColor: colors.primary,
    padding: 2,
  },
  memberListInfo: {
    justifyContent: 'center',
  },
  memberListName: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  memberListRole: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  hostBadgeList: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  hostBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
  },
});
