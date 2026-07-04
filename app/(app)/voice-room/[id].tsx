import { StyleSheet, View, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Text, Heading } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { spacing } from '@/theme/spacing';
import { colors } from '@/theme/colors';

const PURPLE = '#7C3AED';
const RED = '#EF4444';

export default function VoiceRoomScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // Dummy speakers based on the room ID, but we just hardcode some here
  const speakers = [
    { id: '1', name: 'NeonDrift', avatarId: 'avatar-1', isSpeaking: true, role: 'Host' },
    { id: '2', name: 'Sarah J.', avatarId: 'avatar-2', isSpeaking: false, role: 'Speaker' },
    { id: '3', name: 'David K.', avatarId: 'avatar-4', isSpeaking: false, role: 'Speaker' },
    { id: '4', name: 'Elena G.', avatarId: 'avatar-3', isSpeaking: false, role: 'Speaker' },
  ];

  const listeners = [
    { id: '5', avatarId: 'avatar-5' },
    { id: '6', avatarId: 'avatar-6' },
    { id: '7', avatarId: 'avatar-1' },
    { id: '8', avatarId: 'avatar-2' },
    { id: '9', avatarId: 'avatar-3' },
    { id: '10', avatarId: 'avatar-4' },
    { id: '11', avatarId: 'avatar-5' },
    { id: '12', avatarId: 'avatar-6' },
  ];

  return (
    <View style={styles.mainContainer}>
      <LinearGradient
        colors={['#18181B', '#000000']}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <Animated.View entering={FadeInUp.duration(400)} style={styles.header}>
          <Pressable style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="chevron-down" size={28} color="white" />
          </Pressable>
          <View style={styles.headerCenter}>
            <Heading level={3} style={styles.headerTitle}>Live Room</Heading>
          </View>
          <Pressable style={styles.iconButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="white" />
          </Pressable>
        </Animated.View>

        {/* Room Info */}
        <Animated.View entering={FadeIn.duration(500).delay(100)} style={styles.roomInfo}>
          <Text style={styles.roomTopic}>Music & Vibes</Text>
          <Text style={styles.roomTitle}>Late Night Chill & Lo-Fi 🎵</Text>
        </Animated.View>

        {/* Speakers Grid */}
        <View style={styles.stageArea}>
          <Text style={styles.sectionTitle}>Stage</Text>
          <View style={styles.speakersGrid}>
            {speakers.map((speaker, index) => (
              <Animated.View 
                key={speaker.id} 
                entering={FadeInDown.duration(400).delay(200 + index * 50)} 
                style={styles.speakerItem}
              >
                <View style={[styles.avatarWrapper, speaker.isSpeaking && styles.speakingRing]}>
                  <Avatar avatarId={speaker.avatarId} alias={speaker.name} size={72} />
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>{speaker.role}</Text>
                  </View>
                </View>
                <Text style={styles.speakerName} numberOfLines={1}>{speaker.name}</Text>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Listeners Grid */}
        <View style={styles.listenersArea}>
          <Text style={styles.sectionTitle}>Listening ({listeners.length + 42})</Text>
          <View style={styles.listenersGrid}>
            {listeners.map((listener, index) => (
              <Animated.View 
                key={listener.id} 
                entering={FadeInDown.duration(400).delay(400 + index * 30)} 
                style={styles.listenerItem}
              >
                <Avatar avatarId={listener.avatarId} alias="L" size={48} />
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Bottom Controls */}
        <Animated.View entering={FadeInUp.duration(500).delay(600)} style={styles.bottomControls}>
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)', '#000']}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.controlsRow}>
            <Pressable style={[styles.controlButton, styles.leaveButton]} onPress={() => router.back()}>
              <Text style={styles.leaveText}>✌️ Leave Quietly</Text>
            </Pressable>
            
            <View style={styles.rightControls}>
              <Pressable style={styles.roundButton}>
                <Ionicons name="add" size={24} color="white" />
              </Pressable>
              <Pressable style={styles.roundButton}>
                <Ionicons name="hand-right-outline" size={24} color="white" />
              </Pressable>
              <Pressable style={[styles.roundButton, styles.micButton]}>
                <Ionicons name="mic-off" size={24} color="white" />
              </Pressable>
            </View>
          </View>
        </Animated.View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1, justifyContent: 'space-between' },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  
  roomInfo: {
    paddingHorizontal: spacing['2xl'],
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  roomTopic: {
    fontSize: 14,
    color: PURPLE,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  roomTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.white,
  },

  stageArea: {
    paddingHorizontal: spacing['2xl'],
    marginBottom: spacing['2xl'],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: spacing.lg,
  },
  speakersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xl,
    justifyContent: 'center',
  },
  speakerItem: {
    alignItems: 'center',
    width: 80,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: spacing.sm,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  speakingRing: {
    borderColor: PURPLE,
  },
  roleBadge: {
    position: 'absolute',
    bottom: -4,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  roleText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  speakerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },

  listenersArea: {
    paddingHorizontal: spacing['2xl'],
    flex: 1,
  },
  listenersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'flex-start',
  },
  listenerItem: {
    marginBottom: spacing.sm,
  },

  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing['2xl'],
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 40,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leaveButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  leaveText: {
    color: RED,
    fontWeight: '700',
    fontSize: 16,
  },
  rightControls: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  roundButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});
