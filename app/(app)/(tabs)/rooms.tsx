import { useState } from 'react';
import { StyleSheet, View, FlatList, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { Text, Heading } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { spacing } from '@/theme/spacing';
import { colors } from '@/theme/colors';

const PURPLE = '#7C3AED';

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
  const [rooms] = useState(DUMMY_ROOMS);

  const handleJoinRoom = (id: string) => {
    router.push({ pathname: '/(app)/voice-room/[id]', params: { id } });
  };

  const renderRoom = ({ item, index }: { item: VoiceRoom, index: number }) => (
    <Animated.View entering={FadeInDown.duration(400).delay(index * 100)}>
      <Pressable style={styles.roomCard} onPress={() => handleJoinRoom(item.id)}>
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
          <Pressable style={styles.fab} onPress={() => handleJoinRoom('new')}>
            <LinearGradient colors={[PURPLE, '#9333EA']} style={StyleSheet.absoluteFillObject} />
            <Ionicons name="add" size={32} color="white" />
          </Pressable>
        </Animated.View>
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
    borderColor: PURPLE,
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
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
