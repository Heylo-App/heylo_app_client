import { Ionicons } from '@expo/vector-icons';
import { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { MoodChip } from '@/components/ui/MoodChip';
import { Text } from '@/components/ui/Text';
import { MOOD_OPTIONS } from '@/constants/moods';
import type { Moment } from '@/types/moment';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { formatRelativeTime } from '@/utils/date';

interface MomentCardProps {
  moment: Moment;
  onLike: (id: string, isLiked: boolean) => void;
  onPress?: (id: string) => void;
}

export const MomentCard = memo(function MomentCard({ moment, onLike, onPress }: MomentCardProps) {
  const moodOption = MOOD_OPTIONS.find((m) => m.id === moment.mood);

  const handleLike = useCallback(() => {
    onLike(moment.id, moment.isLiked);
  }, [moment.id, moment.isLiked, onLike]);

  const handlePress = useCallback(() => {
    onPress?.(moment.id);
  }, [moment.id, onPress]);

  return (
    <Card onPress={handlePress} style={styles.card}>
      <View style={styles.header}>
        <Avatar avatarId={moment.authorAvatarId} alias={moment.authorAlias} mood={moment.mood} size={44} />
        <View style={styles.meta}>
          <Text variant="label">{moment.authorAlias}</Text>
          <Text variant="caption">{formatRelativeTime(moment.createdAt)}</Text>
        </View>
        {moodOption ? <MoodChip mood={moodOption} compact selected /> : null}
      </View>
      <Text variant="body" style={styles.content}>
        {moment.content}
      </Text>
      <View style={styles.actions}>
        <View style={styles.action} onTouchEnd={handleLike}>
          <Ionicons
            name={moment.isLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={moment.isLiked ? colors.accent : colors.foregroundMuted}
          />
          <Text variant="caption">{moment.likesCount}</Text>
        </View>
        <View style={styles.action}>
          <Ionicons name="chatbubble-outline" size={18} color={colors.foregroundMuted} />
          <Text variant="caption">{moment.commentsCount}</Text>
        </View>
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  content: {
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.lg,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
