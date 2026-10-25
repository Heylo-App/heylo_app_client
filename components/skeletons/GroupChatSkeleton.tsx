import { View, StyleSheet } from 'react-native';
import { SkeletonBox } from './SkeletonBox';
import { spacing } from '@/theme/spacing';

/**
 * Skeleton for the group chat message screen.
 * Mimics alternating left/right chat bubbles with avatars.
 */

interface BubbleProps {
  isMe: boolean;
  width: number | string;
  lines?: number;
}

const Bubble = ({ isMe, width, lines = 1 }: BubbleProps) => (
  <View style={[styles.msgRow, isMe ? styles.msgMe : styles.msgThem]}>
    {!isMe && (
      <SkeletonBox
        width={32}
        height={32}
        borderRadius={16}
        style={{ marginRight: 8, alignSelf: 'flex-end' }}
      />
    )}
    <View style={styles.bubbleContent}>
      {!isMe && <SkeletonBox width={60} height={10} borderRadius={4} style={{ marginBottom: 4 }} />}
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
        <SkeletonBox width={width} height={14} borderRadius={4} />
        {lines >= 2 && (
          <SkeletonBox width="60%" height={14} borderRadius={4} style={{ marginTop: 6 }} />
        )}
      </View>
    </View>
  </View>
);

export const GroupChatSkeleton = () => (
  <View style={styles.container}>
    <Bubble isMe={false} width={180} />
    <Bubble isMe width={140} />
    <Bubble isMe={false} width={200} lines={2} />
    <Bubble isMe width={100} />
    <Bubble isMe={false} width={160} />
    <Bubble isMe width={220} lines={2} />
    <Bubble isMe={false} width={120} />

    {/* Input bar skeleton */}
    <View style={styles.inputBar}>
      <SkeletonBox width="80%" height={40} borderRadius={20} />
      <SkeletonBox width={44} height={44} borderRadius={22} style={{ marginLeft: spacing.sm }} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'flex-end',
  },
  msgRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    maxWidth: '85%',
  },
  msgMe: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  msgThem: {
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
  },
  bubbleContent: {
    flexShrink: 1,
  },
  bubble: {
    padding: 12,
    borderRadius: 18,
  },
  bubbleMe: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderBottomLeftRadius: 4,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
});
