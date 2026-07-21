import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  KeyboardAvoidingView, 
  Platform, 
  Pressable, 
  TextInput, 
  FlatList,
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp, Easing, Layout } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Avatar } from '@/components/ui/Avatar';
import { Text, Heading } from '@/components/ui/Text';
import { spacing } from '@/theme/spacing';
import { colors } from '@/theme/colors';
import { useAuthSession } from '@/hooks/useAuth';


interface Message {
  id: string;
  text: string;
  sender: 'me' | 'them';
  timestamp: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    text: "Hey there! The vibe check said we'd be a good match.",
    sender: 'them',
    timestamp: '10:00 AM'
  },
  {
    id: '2',
    text: "Hey! Haha yeah, I was just looking for someone to chat with.",
    sender: 'me',
    timestamp: '10:02 AM'
  },
  {
    id: '3',
    text: "Awesome. I love that this is totally anonymous. Takes the pressure off.",
    sender: 'them',
    timestamp: '10:05 AM'
  }
];

export default function ChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthSession();
  
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Mock matched user details
  const matchedUser = {
    alias: 'QuietRiver',
    avatarId: 'avatar-4',
    mood: 'chill'
  };

  const sendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');

    // Simulate reply after 2 seconds
    setTimeout(() => {
      const replyMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "That's cool! Tell me more about it.",
        sender: 'them',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, replyMessage]);
    }, 2000);
  };

  useEffect(() => {
    // Scroll to bottom on new message
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.sender === 'me';
    
    return (
      <Animated.View 
        entering={FadeInUp.duration(400).delay(index * 100)}
        layout={Layout.springify().damping(16).stiffness(120)}
        style={[
          styles.messageRow,
          isMe ? styles.messageRowMe : styles.messageRowThem
        ]}
      >
        {!isMe && (
          <View style={styles.messageAvatar}>
            <Avatar avatarId={matchedUser.avatarId} alias={matchedUser.alias} size={28} />
          </View>
        )}
        
        <View style={styles.messageContent}>
          <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleThem]}>
            {isMe && (
              <LinearGradient 
                colors={colors.primaryGradient} 
                style={StyleSheet.absoluteFillObject} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 1 }} 
              />
            )}
            <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextThem]}>
              {item.text}
            </Text>
          </View>
          <Text style={[styles.timestamp, isMe ? styles.timestampMe : styles.timestampThem]}>
            {item.timestamp}
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
                <Avatar avatarId={matchedUser.avatarId} alias={matchedUser.alias} size={40} />
                <View style={styles.onlineDot} />
              </View>
              <View>
                <Heading level={3} style={styles.headerName}>{matchedUser.alias}</Heading>
                <Text style={styles.headerMood}>feeling {matchedUser.mood}</Text>
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
            keyExtractor={(item) => item.id}
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

            <Animated.View style={inputText.trim() ? styles.sendBtnActiveWrapper : styles.sendBtnInactiveWrapper}>
              <Pressable 
                style={styles.sendBtn} 
                onPress={sendMessage}
                disabled={!inputText.trim()}
              >
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
                  color={inputText.trim() ? "white" : "rgba(255,255,255,0.3)"} 
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
