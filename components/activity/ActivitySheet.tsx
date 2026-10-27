import React from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  FlatList,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

import { Text, Heading } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { useActivityStore } from '@/store/activity.store';
import type { ActivityItem, ActivityType } from '@/types/activity';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function formatRelativeTime(dateString: string): string {
  try {
    const now = Date.now();
    const date = new Date(dateString).getTime();
    const diffSeconds = Math.max(0, Math.floor((now - date) / 1000));

    if (diffSeconds < 60) return 'Just now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

function getActivityMeta(type: ActivityType) {
  switch (type) {
    case 'like_moment':
      return {
        icon: 'heart' as const,
        iconColor: '#EF4444',
        badgeBg: 'rgba(239, 68, 68, 0.2)',
        actionLabel: 'liked your moment',
      };
    case 'comment_moment':
      return {
        icon: 'chatbubble' as const,
        iconColor: '#3B82F6',
        badgeBg: 'rgba(59, 130, 246, 0.2)',
        actionLabel: 'commented on your moment',
      };
    case 'reply_comment':
      return {
        icon: 'return-up-back' as const,
        iconColor: '#8B5CF6',
        badgeBg: 'rgba(139, 92, 246, 0.2)',
        actionLabel: 'replied to your comment',
      };
    case 'like_comment':
      return {
        icon: 'heart' as const,
        iconColor: '#EC4899',
        badgeBg: 'rgba(236, 72, 153, 0.2)',
        actionLabel: 'liked your comment',
      };
    case 'mention':
      return {
        icon: 'at-circle' as const,
        iconColor: '#F59E0B',
        badgeBg: 'rgba(245, 158, 11, 0.2)',
        actionLabel: 'mentioned you in a comment',
      };
    default:
      return {
        icon: 'sparkles' as const,
        iconColor: colors.primary,
        badgeBg: 'rgba(255, 45, 85, 0.2)',
        actionLabel: 'interacted with your post',
      };
  }
}

interface ActivitySheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectMoment: (momentId: string, commentId?: string | null) => void;
}

export const ActivitySheet: React.FC<ActivitySheetProps> = ({
  visible,
  onClose,
  onSelectMoment,
}) => {
  const { activities, unreadCount, isLoading, fetchActivities, markAllAsRead, markItemAsRead } =
    useActivityStore();

  const handleItemPress = (item: ActivityItem) => {
    if (!item.isRead) {
      markItemAsRead(item.id);
    }
    onClose();
    onSelectMoment(item.momentId, item.commentId);
  };

  const renderActivityItem = ({ item }: { item: ActivityItem }) => {
    const meta = getActivityMeta(item.type);

    return (
      <Pressable
        style={[styles.activityItem, !item.isRead && styles.activityItemUnread]}
        onPress={() => handleItemPress(item)}
      >
        <View style={styles.avatarWrapper}>
          <Avatar
            avatarId={item.actor?.avatarId || 'avatar-1'}
            alias={item.actor?.alias || 'Someone'}
            size={46}
          />
          <View style={[styles.typeBadge, { backgroundColor: meta.iconColor }]}>
            <Ionicons name={meta.icon} size={11} color="white" />
          </View>
        </View>

        <View style={styles.activityContent}>
          <Text style={styles.activityHeaderLine} numberOfLines={2}>
            <Text style={styles.actorName}>{item.actor?.alias || 'Someone'} </Text>
            <Text style={styles.actionText}>{meta.actionLabel}</Text>
          </Text>

          {item.snippet ? (
            <Text style={styles.snippetText} numberOfLines={2}>
              &ldquo;{item.snippet}&rdquo;
            </Text>
          ) : null}

          <Text style={styles.timestampText}>{formatRelativeTime(item.createdAt)}</Text>
        </View>

        <View style={styles.activityRight}>
          {!item.isRead && <View style={styles.unreadDot} />}
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.2)" />
        </View>
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(200)} style={styles.overlay}>
        <BlurView intensity={65} tint="dark" style={StyleSheet.absoluteFillObject} />
        <Pressable style={styles.backdrop} onPress={onClose} />

        <Animated.View entering={SlideInDown.duration(320)} style={styles.sheetContainer}>
          <SafeAreaView edges={['bottom']} style={styles.sheetContent}>
            {/* Handle bar */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <Heading level={2} style={styles.title}>
                  Activity
                </Heading>
                {unreadCount > 0 ? (
                  <View style={styles.unreadCountBadge}>
                    <Text style={styles.unreadCountText}>
                      {unreadCount} {unreadCount === 1 ? 'new' : 'new'}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.headerActions}>
                {unreadCount > 0 && (
                  <Pressable style={styles.markReadBtn} onPress={markAllAsRead}>
                    <Ionicons name="checkmark-done" size={15} color={colors.primary} />
                    <Text style={styles.markReadText}>Mark read</Text>
                  </Pressable>
                )}

                <Pressable style={styles.closeBtn} onPress={onClose}>
                  <Ionicons name="close" size={20} color="rgba(255,255,255,0.8)" />
                </Pressable>
              </View>
            </View>

            {/* List */}
            {isLoading && activities.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={colors.primary} size="large" />
              </View>
            ) : (
              <FlatList
                data={activities}
                keyExtractor={(item) => item.id}
                renderItem={renderActivityItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={isLoading}
                    onRefresh={fetchActivities}
                    tintColor="rgba(255,255,255,0.6)"
                  />
                }
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <LinearGradient
                      colors={['rgba(255,45,85,0.15)', 'rgba(59,130,246,0.1)']}
                      style={styles.emptyIconBg}
                    >
                      <Ionicons name="notifications-outline" size={36} color={colors.primary} />
                    </LinearGradient>
                    <Heading level={3} style={styles.emptyTitle}>
                      No Activity Yet
                    </Heading>
                    <Text style={styles.emptySubtitle}>
                      When people like your moments, comment, reply, or mention you, you&apos;ll see
                      them here in real time.
                    </Text>
                  </View>
                }
              />
            )}
          </SafeAreaView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    maxHeight: SCREEN_HEIGHT * 0.85,
    height: SCREEN_HEIGHT * 0.78,
    backgroundColor: '#121216',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  sheetContent: {
    flex: 1,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
  },
  unreadCountBadge: {
    backgroundColor: 'rgba(255,45,85,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,45,85,0.3)',
  },
  unreadCountText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  markReadText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingVertical: spacing.sm,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  activityItemUnread: {
    backgroundColor: 'rgba(255,45,85,0.04)',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: spacing.md,
  },
  typeBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#121216',
  },
  activityContent: {
    flex: 1,
    gap: 2,
  },
  activityHeaderLine: {
    fontSize: 14,
    lineHeight: 19,
  },
  actorName: {
    fontWeight: '700',
    color: colors.white,
  },
  actionText: {
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '400',
  },
  snippetText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    fontStyle: 'italic',
    marginTop: 1,
  },
  timestampText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 2,
    fontWeight: '500',
  },
  activityRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginLeft: spacing.sm,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['3xl'],
    paddingTop: 80,
    gap: spacing.sm,
  },
  emptyIconBg: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,45,85,0.2)',
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.white,
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
  },
});
