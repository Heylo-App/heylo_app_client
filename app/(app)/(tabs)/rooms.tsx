import { useState } from 'react';
import { StyleSheet, View, FlatList, Pressable, Platform, TextInput, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';

import { Text, Heading } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { spacing } from '@/theme/spacing';
import { colors } from '@/theme/colors';
import { useAuthStore } from '@/store/auth.store';


interface VoiceRoom {
  id: string;
  title: string;
  topic: string;
  host: {
    name: string;
    avatarId: string;
  };
  participants: number;
  maxParticipants: number;
  tags: string[];
}

const DUMMY_ROOMS: VoiceRoom[] = [
  {
    id: 'room-1',
    title: 'Late Night Chill & Lo-Fi 🎵',
    topic: 'Music',
    host: { name: 'NeonDrift', avatarId: 'avatar-1' },
    participants: 12,
    maxParticipants: 50,
    tags: ['chill', 'lofi', 'vibes'],
  },
  {
    id: 'room-2',
    title: 'Tech Talk: React Native & Expo',
    topic: 'Technology',
    host: { name: 'Sarah Jenkins', avatarId: 'avatar-2' },
    participants: 24,
    maxParticipants: 100,
    tags: ['coding', 'react-native', 'expo'],
  },
  {
    id: 'room-3',
    title: 'True Crime Podcast Discussion 🕵️‍♀️',
    topic: 'Podcasts',
    host: { name: 'Elena Gilbert', avatarId: 'avatar-3' },
    participants: 8,
    maxParticipants: 20,
    tags: ['truecrime', 'discussion'],
  },
  {
    id: 'room-4',
    title: 'Morning Coffee & Goals ☕',
    topic: 'Lifestyle',
    host: { name: 'David Kim', avatarId: 'avatar-4' },
    participants: 5,
    maxParticipants: 15,
    tags: ['morning', 'productivity'],
  }
];

export default function RoomsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [rooms, setRooms] = useState(DUMMY_ROOMS);
  
  // Create Room State
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [newRoomLimit, setNewRoomLimit] = useState('50');
  const [newRoomTags, setNewRoomTags] = useState('');

  const handleJoinRoom = (id: string, isHost: boolean = false, title: string = '', topic: string = '') => {
    router.push({ pathname: '/(app)/voice-room/[id]', params: { id, isHost: isHost ? 'true' : 'false', title, topic } });
  };

  const handlePressFab = () => {
    const currentUserName = user?.alias || 'Me';
    const activeRoom = rooms.find(r => r.host.name === currentUserName);

    if (activeRoom) {
      handleJoinRoom(activeRoom.id, true, activeRoom.title, activeRoom.topic);
    } else {
      setShowCreateRoom(true);
    }
  };

  const handleCreateRoom = () => {
    if (!newRoomTitle.trim()) return;

    const tagsArray = newRoomTags
      .split(',')
      .map(t => t.trim().toLowerCase().replace('#', ''))
      .filter(t => t.length > 0);

    const limit = parseInt(newRoomLimit, 10) || 50;
    
    const newRoom: VoiceRoom = {
      id: `room-${Date.now()}`,
      title: newRoomTitle.trim(),
      topic: 'General',
      host: { 
        name: user?.alias || 'Me', 
        avatarId: user?.avatarId || 'avatar-1' 
      },
      participants: 1,
      maxParticipants: limit,
      tags: tagsArray.length > 0 ? tagsArray : ['general'],
    };

    setRooms([newRoom, ...rooms]);
    setShowCreateRoom(false);
    
    // Reset form
    setNewRoomTitle('');
    setNewRoomLimit('50');
    setNewRoomTags('');

    // Navigate to new room
    handleJoinRoom(newRoom.id, true, newRoom.title, newRoom.topic);
  };

  const renderRoom = ({ item, index }: { item: VoiceRoom, index: number }) => (
    <Animated.View entering={FadeInDown.duration(400).delay(index * 100)}>
      <Pressable style={styles.roomCard} onPress={() => handleJoinRoom(item.id, item.host.name === (user?.alias || 'Me'), item.title, item.topic)}>
        <LinearGradient
          colors={['rgba(124, 58, 237, 0.1)', 'rgba(0, 0, 0, 0)']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.roomHeader}>
          <View style={styles.hostInfo}>
            <Avatar avatarId={item.host.avatarId} alias={item.host.name} size={32} />
            <Text style={styles.hostName}>{item.host.name} is hosting</Text>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        <Text style={styles.roomTitle}>{item.title}</Text>
        
        <View style={styles.tagsContainer}>
          {item.tags.map(tag => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>

        <View style={styles.roomFooter}>
          <View style={styles.participantsContainer}>
            <Ionicons name="people" size={16} color="rgba(255,255,255,0.6)" />
            <Text style={styles.participantsText}>
              {item.participants} / {item.maxParticipants}
            </Text>
          </View>
          <View style={styles.joinButton}>
            <Text style={styles.joinButtonText}>Join</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );

  const ListHeader = () => (
    <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
      <Heading level={1} style={styles.title}>Voice Rooms</Heading>
      <Text style={styles.subtitle}>Drop in and chat with similar people</Text>
    </Animated.View>
  );

  return (
    <View style={styles.mainContainer}>
      <LinearGradient
        colors={['#18181B', '#000000']}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.id}
          renderItem={renderRoom}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
        
        {/* FAB */}
        <Animated.View entering={FadeInDown.duration(500).delay(500)} style={styles.fabContainer}>
          <Pressable style={styles.fab} onPress={handlePressFab}>
            <LinearGradient colors={colors.primaryGradient} style={StyleSheet.absoluteFillObject} />
            <Ionicons name="add" size={32} color="white" />
          </Pressable>
        </Animated.View>

        {/* Create Room Modal */}
        {showCreateRoom && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.overlayWrapper}>
            <BlurView intensity={60} tint="dark" style={styles.overlay}>
              <Pressable style={styles.overlayDismiss} onPress={() => setShowCreateRoom(false)} />
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
                <Animated.View entering={SlideInDown.duration(350)} style={styles.createSheet}>
                  <View style={styles.sheetHandle} />
                  <Heading level={2} style={styles.sheetTitle}>Create a Room</Heading>
                  <Text style={styles.sheetSubtitle}>Host your own public conversation</Text>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Room Title</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="What do you want to talk about?"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      value={newRoomTitle}
                      onChangeText={setNewRoomTitle}
                      autoFocus
                    />
                  </View>

                  <View style={styles.formGroupRow}>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <Text style={styles.label}>Member Limit</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 50"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={newRoomLimit}
                        onChangeText={setNewRoomLimit}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Hashtags (comma separated)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="music, tech, chill"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      value={newRoomTags}
                      onChangeText={setNewRoomTags}
                    />
                  </View>

                  <Pressable
                    style={[styles.createBtn, !newRoomTitle.trim() && styles.createBtnDisabled]}
                    onPress={handleCreateRoom}
                    disabled={!newRoomTitle.trim()}
                  >
                    <LinearGradient
                      colors={newRoomTitle.trim() ? colors.primaryGradient : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.1)']}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <Text style={styles.createBtnText}>Start Room</Text>
                  </Pressable>
                </Animated.View>
              </KeyboardAvoidingView>
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
  container: {
    paddingBottom: spacing['4xl'] * 2, // Extra padding for FAB
  },
  
  header: {
    paddingHorizontal: spacing['2xl'],
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.white,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
  },

  roomCard: {
    marginHorizontal: spacing['2xl'],
    marginBottom: spacing.md,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: spacing.xl,
    overflow: 'hidden',
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  hostName: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  roomTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.lg,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  roomFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  participantsText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  joinButton: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  joinButtonText: {
    color: '#A78BFA',
    fontWeight: '700',
    fontSize: 14,
  },
  separator: {
    height: spacing.sm,
  },

  fabContainer: {
    position: 'absolute',
    bottom: spacing['2xl'],
    right: spacing['2xl'],
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },

  // Create Room Sheet
  overlayWrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  overlayDismiss: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  createSheet: {
    backgroundColor: '#111115',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
    paddingBottom: spacing['4xl'],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: 'white', textAlign: 'center' },
  sheetSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 4, marginBottom: spacing.xl },
  formGroup: {
    marginBottom: spacing.lg,
  },
  formGroupRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  label: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: 'white',
    fontSize: 16,
  },
  createBtn: {
    marginTop: spacing.md,
    borderRadius: 20,
    overflow: 'hidden',
    paddingVertical: 16,
    alignItems: 'center',
  },
  createBtnDisabled: { opacity: 0.5 },
  createBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
