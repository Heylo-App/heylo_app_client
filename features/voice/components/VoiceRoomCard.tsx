import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { MOOD_OPTIONS } from '@/constants/moods';
import { moodGradients } from '@/theme/gradients';
import type { VoiceRoom } from '@/types/voice';
import { colors } from '@/theme/colors';
import { spacing, borderRadius } from '@/theme/spacing';

interface VoiceRoomCardProps {
  room: VoiceRoom;
  onJoin: (id: string) => void;
}

export const VoiceRoomCard = memo(function VoiceRoomCard({ room, onJoin }: VoiceRoomCardProps) {
  const mood = MOOD_OPTIONS.find((m) => m.id === room.mood);
  const gradient = moodGradients[room.mood];

  return (
    <Card onPress={() => onJoin(room.id)} style={styles.card}>
      <LinearGradient
        colors={[...gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.accent}
      />
      <View style={styles.header}>
        {room.isLive ? (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text variant="caption" style={styles.liveText}>
              LIVE
            </Text>
          </View>
        ) : null}
        <Text variant="caption">
          {room.participantCount}/{room.maxParticipants}
        </Text>
      </View>
      <Text variant="h3" style={styles.title}>
        {room.title}
      </Text>
      <Text variant="bodySmall" muted>
        {room.topic}
      </Text>
      <View style={styles.footer}>
        <Text variant="caption">
          {mood?.emoji} {mood?.label} · hosted by {room.hostAlias}
        </Text>
        <Ionicons name="mic" size={20} color={colors.primaryLight} />
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.danger,
  },
  liveText: {
    color: colors.danger,
    fontWeight: '700',
  },
  title: {
    marginBottom: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
});
