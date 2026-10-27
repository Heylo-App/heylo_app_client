import { useState, useRef, useEffect, useCallback, useMemo, MutableRefObject } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Pressable,
  TextInput,
  Share,
  Platform,
  Dimensions,
  RefreshControl,
  Modal,
  Keyboard,
  LayoutAnimation,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';

import { Text, Heading } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { MentionText } from '@/components/ui/MentionText';
import { MentionSuggestions } from '@/components/ui/MentionSuggestions';
import { useMentionLookup } from '@/hooks/useMentionLookup';
import { spacing } from '@/theme/spacing';
import { colors } from '@/theme/colors';
import { useAuthStore } from '@/store/auth.store';
import { useActivityStore } from '@/store/activity.store';
import { ActivitySheet } from '@/components/activity/ActivitySheet';
import { momentsService } from '@/services/moments.service';
import { socketService } from '@/services/socket.service';
import type { Moment, Comment } from '@/types/moment';
import { HomeSkeleton } from '@/components/skeletons';
import { getUserFriendlyError } from '@/utils/errorMessages';

const SHEET_BG = '#111115';
const SHEET_SURFACE = 'rgba(255,255,255,0.06)';
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════
// MomentItem Component
// ═══════════════════════════════════════════════════════
const MomentItem = ({
  item,
  onLike,
  onComment,
  onShare,
}: {
  item: Moment;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
}) => {
  const router = useRouter();
  const scale = useSharedValue(1);

  const handleLike = () => {
    scale.value = withSequence(withSpring(1.3, { damping: 2, stiffness: 150 }), withSpring(1));
    onLike();
  };

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleOpenAuthor = () => {
    if (item.author.id) {
      router.push(`/(app)/users/${item.author.id}`);
    }
  };

  return (
    <View style={styles.momentCard}>
      <Pressable onPress={handleOpenAuthor} style={styles.momentHeader}>
        <Avatar avatarId={item.author.avatarId} alias={item.author.name} size={40} />
        <View style={styles.authorInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.authorName}>{item.author.name}</Text>
            <Text style={styles.timestamp}>
              · {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Just now'}
            </Text>
          </View>
          <Text style={styles.authorHandle}>{item.author.handle}</Text>
        </View>
      </Pressable>

      <MentionText content={item.content} style={styles.momentContent} />

      {/* Action Row: Like → Comment → Share */}
      <View style={styles.actionsRow}>
        <Pressable style={styles.actionButton} onPress={handleLike}>
          <Animated.View style={heartStyle}>
            <Ionicons
              name={item.isLiked ? 'heart' : 'heart-outline'}
              size={20}
              color={item.isLiked ? colors.primary : 'rgba(255,255,255,0.5)'}
            />
          </Animated.View>
          <Text style={[styles.actionText, item.isLiked && { color: colors.primary }]}>
            {item.likes}
          </Text>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={onComment}>
          <Ionicons name="chatbubble-outline" size={19} color="rgba(255,255,255,0.5)" />
          <Text style={styles.actionText}>{item.comments?.length || 0}</Text>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={onShare}>
          <Ionicons name="share-outline" size={20} color="rgba(255,255,255,0.5)" />
        </Pressable>
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════
// Main Screen
// ═══════════════════════════════════════════════════════
export default function HomeScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [moments, setMoments] = useState<Moment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Comment sheet state
  const [commentMomentId, setCommentMomentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{
    commentId: string;
    authorId?: string;
    author: string;
    username?: string;
  } | null>(null);
  const commentInputRef = useRef<TextInput>(null);

  // Activity state
  const [showActivity, setShowActivity] = useState(false);
  const unreadCount = useActivityStore((s) => s.unreadCount);

  // Mention lookups
  const postMentions = useMentionLookup();
  const commentMentions = useMentionLookup();

  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      if (Platform.OS === 'ios') {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      if (Platform.OS === 'ios') {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Create moment modal state
  const [showCreate, setShowCreate] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const isPostingRef = useRef(false); // Ref-based guard against double-tap
  const locallyCreatedIds = useRef<Set<string>>(new Set()); // Track IDs we created locally

  const myName = user?.alias || user?.username || 'Me';
  const myAvatar = user?.avatarId || 'avatar-1';

  // ─── Data Fetching ──────────────────────────────────
  const fetchFeed = useCallback(async () => {
    try {
      const data = await momentsService.getFeed();
      setMoments(data);
    } catch (error) {
      console.error('Failed to fetch moments', error);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchFeed();
    setIsRefreshing(false);
  }, [fetchFeed]);

  useEffect(() => {
    setIsLoading(true);
    fetchFeed().finally(() => setIsLoading(false));
  }, [fetchFeed]);

  // Real-time socket sync for moments and comments
  useEffect(() => {
    const handleMomentCreated = (newMoment: Moment) => {
      // Skip if this moment was created locally by the current user
      // (already added to state via handleCreateMoment)
      if (locallyCreatedIds.current.has(newMoment.id)) {
        return;
      }

      setMoments((prev) => {
        // Extra safety: dedup check in case of race conditions
        if (prev.some((m) => m.id === newMoment.id)) return prev;
        return [newMoment, ...prev];
      });
    };

    const handleMomentUpdated = (payload: { id: string; likes: number; comments: any[] }) => {
      setMoments((prev) =>
        prev.map((m) => {
          if (m.id === payload.id) {
            return {
              ...m,
              likes: payload.likes,
              comments: payload.comments.map((c: any) => {
                const existing = m.comments?.find((ec) => ec.id === c.id);
                return {
                  ...c,
                  isLiked: existing?.isLiked ?? c.isLiked,
                };
              }),
            };
          }
          return m;
        }),
      );
    };

    socketService.on('moment:created', handleMomentCreated);
    socketService.on('moment:updated', handleMomentUpdated);

    return () => {
      socketService.off('moment:created', handleMomentCreated);
      socketService.off('moment:updated', handleMomentUpdated);
    };
  }, []);

  // ─── Handlers ───────────────────────────────────────
  const toggleLike = async (id: string) => {
    // Optimistic update
    setMoments((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          return { ...m, isLiked: !m.isLiked, likes: m.isLiked ? m.likes - 1 : m.likes + 1 };
        }
        return m;
      }),
    );
    try {
      await momentsService.toggleLike(id);
    } catch (error) {
      console.error('Failed to toggle like', error);
      // Revert on failure
      setMoments((prev) =>
        prev.map((m) => {
          if (m.id === id) {
            return { ...m, isLiked: !m.isLiked, likes: m.isLiked ? m.likes - 1 : m.likes + 1 };
          }
          return m;
        }),
      );
    }
  };

  const openComments = (id: string) => {
    setCommentMomentId(id);
    setCommentText('');
    setReplyingTo(null);
    commentMentions.resetMentions();
    setTimeout(() => commentInputRef.current?.focus(), 300);
  };

  const closeComments = () => {
    Keyboard.dismiss();
    setCommentMomentId(null);
    setReplyingTo(null);
    commentMentions.resetMentions();
  };

  const handleSelectActivityMoment = async (momentId: string, commentId?: string | null) => {
    const existing = moments.find((m) => m.id === momentId);
    if (!existing) {
      try {
        const fetched = await momentsService.getMoment(momentId);
        if (fetched) {
          setMoments((prev) => [fetched, ...prev]);
        }
      } catch (err) {
        console.error('Failed to load moment for activity:', err);
      }
    }
    openComments(momentId);
  };

  const handleReplyTo = (c: Comment) => {
    setReplyingTo({
      commentId: c.id,
      authorId: c.authorId,
      author: c.author,
      username: c.username,
    });
    commentInputRef.current?.focus();
  };

  const toggleCommentLike = async (momentId: string, commentId: string) => {
    // Optimistic update
    setMoments((prev) =>
      prev.map((m) => {
        if (m.id === momentId) {
          return {
            ...m,
            comments: m.comments.map((c) => {
              if (c.id === commentId) {
                const isLiked = !c.isLiked;
                const likes = isLiked ? (c.likes || 0) + 1 : Math.max(0, (c.likes || 0) - 1);
                return { ...c, isLiked, likes };
              }
              return c;
            }),
          };
        }
        return m;
      }),
    );

    try {
      const updatedMoment = await momentsService.toggleCommentLike(momentId, commentId);
      setMoments((prev) => prev.map((m) => (m.id === momentId ? updatedMoment : m)));
    } catch (error) {
      console.error('Failed to toggle comment like', error);
      // Revert on failure
      setMoments((prev) =>
        prev.map((m) => {
          if (m.id === momentId) {
            return {
              ...m,
              comments: m.comments.map((c) => {
                if (c.id === commentId) {
                  const isLiked = !c.isLiked;
                  const likes = isLiked ? (c.likes || 0) + 1 : Math.max(0, (c.likes || 0) - 1);
                  return { ...c, isLiked, likes };
                }
                return c;
              }),
            };
          }
          return m;
        }),
      );
    }
  };

  const postComment = async () => {
    if (!commentText.trim() || !commentMomentId || isCommenting) return;
    setIsCommenting(true);
    try {
      const parentId = replyingTo?.commentId || null;
      const replyToUser = replyingTo
        ? {
            id: replyingTo.authorId,
            username: replyingTo.username,
            name: replyingTo.author,
          }
        : null;

      const updatedMoment = await momentsService.addComment(
        commentMomentId,
        commentText.trim(),
        parentId,
        replyToUser,
      );
      setMoments((prev) => prev.map((m) => (m.id === commentMomentId ? updatedMoment : m)));
      setCommentText('');
      setReplyingTo(null);
      commentMentions.resetMentions();
    } catch (error) {
      console.error('Failed to post comment', error);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleShare = async (item: Moment) => {
    try {
      await Share.share({
        message: `${item.author.name}: "${item.content}" — shared from Heylo`,
      });
    } catch {
      /* cancelled */
    }
  };

  const handleCreateMoment = async () => {
    // Guard: prevent double-tap using both state and ref
    if (!newContent.trim() || isPosting || isPostingRef.current) return;
    setIsPosting(true);
    isPostingRef.current = true;
    try {
      const newMoment = await momentsService.createMoment({ content: newContent.trim() });
      // Track this ID so the socket listener doesn't duplicate it
      locallyCreatedIds.current.add(newMoment.id);
      // Clean up tracked ID after 10s (socket event should have arrived by then)
      setTimeout(() => locallyCreatedIds.current.delete(newMoment.id), 10000);

      setMoments((prev) => {
        // Final dedup check
        if (prev.some((m) => m.id === newMoment.id)) return prev;
        return [newMoment, ...prev];
      });
      setNewContent('');
      postMentions.resetMentions();
      setShowCreate(false);
    } catch (error) {
      console.error('Failed to create moment', error);
      Alert.alert('Unable to post moment', getUserFriendlyError(error));
    } finally {
      setIsPosting(false);
      isPostingRef.current = false;
    }
  };

  // ─── Comment Sheet (current moment) ─────────────────
  const commentMoment = moments.find((m) => m.id === commentMomentId);

  // Group root comments and direct replies into threaded sequence
  const organizedComments = useMemo(() => {
    if (!commentMoment?.comments) return [];
    const rootComments: Comment[] = [];
    const repliesByParent = new Map<string, Comment[]>();

    commentMoment.comments.forEach((c) => {
      if (c.parentId) {
        const list = repliesByParent.get(c.parentId) || [];
        list.push(c);
        repliesByParent.set(c.parentId, list);
      } else {
        rootComments.push(c);
      }
    });

    const result: Comment[] = [];
    rootComments.forEach((root) => {
      result.push(root);
      const replies = repliesByParent.get(root.id);
      if (replies) {
        result.push(...replies);
      }
    });

    // Also include any orphan replies if any
    commentMoment.comments.forEach((c) => {
      if (c.parentId && !result.some((r) => r.id === c.id)) {
        result.push(c);
      }
    });

    return result;
  }, [commentMoment?.comments]);

  // Deduplicate moments to prevent "two children with the same key" warning
  const dedupedMoments = useMemo(() => {
    const seen = new Set<string>();
    return moments.filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }, [moments]);

  // ─── Render ─────────────────────────────────────────
  return (
    <View style={styles.mainContainer}>
      <LinearGradient colors={['#18181B', '#000000']} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={styles.safeArea}>
        {/* Fixed App Bar */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <Heading level={1} style={styles.title}>
                Home
              </Heading>
            </View>

            <View style={styles.headerActions}>
              <Pressable
                style={styles.myMomentsBtn}
                onPress={() => router.push('/(app)/my-moments')}
              >
                <Ionicons name="person" size={13} color="rgba(255,255,255,0.7)" />
                <Text style={styles.myMomentsBtnText}>My Moments</Text>
              </Pressable>

              <Pressable
                style={[styles.activityBtn, unreadCount > 0 && styles.activityBtnActive]}
                onPress={() => setShowActivity(true)}
                hitSlop={6}
              >
                <Ionicons
                  name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
                  size={19}
                  color={unreadCount > 0 ? '#FFF' : 'rgba(255,255,255,0.8)'}
                />
                {unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>
          </View>
        </Animated.View>

        <FlatList
          data={dedupedMoments}
          keyExtractor={(item) => item.id}
          style={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="rgba(255,255,255,0.5)"
            />
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.duration(400).delay(index * 80)}>
              <MomentItem
                item={item}
                onLike={() => toggleLike(item.id)}
                onComment={() => openComments(item.id)}
                onShare={() => handleShare(item)}
              />
            </Animated.View>
          )}
          ListEmptyComponent={
            isLoading ? (
              <HomeSkeleton />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="albums-outline" size={48} color="rgba(255,255,255,0.2)" />
                <Text style={styles.emptyText}>No moments yet</Text>
              </View>
            )
          }
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />

        {/* FAB */}
        <Animated.View entering={FadeInDown.duration(500).delay(500)} style={styles.fabContainer}>
          <Pressable style={styles.fab} onPress={() => setShowCreate(true)}>
            <LinearGradient colors={colors.primaryGradient} style={StyleSheet.absoluteFillObject} />
            <Ionicons name="add" size={32} color="white" />
          </Pressable>
        </Animated.View>

        {/* ─── Create Moment Modal ─────────────────────── */}
        <Modal
          visible={showCreate}
          transparent
          animationType="none"
          onRequestClose={() => {
            Keyboard.dismiss();
            setShowCreate(false);
          }}
          statusBarTranslucent
        >
          <Animated.View entering={FadeIn.duration(200)} style={styles.overlayWrapper}>
            <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFillObject} />
            <Pressable
              style={styles.overlayDismiss}
              onPress={() => {
                Keyboard.dismiss();
                setShowCreate(false);
              }}
            />

            <View
              style={[
                styles.sheetContainer,
                {
                  paddingBottom: keyboardHeight > 0 ? keyboardHeight : 0,
                },
              ]}
              pointerEvents="box-none"
            >
              <Animated.View
                entering={SlideInDown.duration(350)}
                style={[
                  styles.createSheet,
                  {
                    paddingBottom:
                      keyboardHeight > 0 ? spacing.lg : Math.max(insets.bottom, spacing.lg),
                  },
                ]}
              >
                <View style={styles.sheetHandle} />
                <Heading level={2} style={styles.sheetTitle}>
                  New Moment
                </Heading>
                <Text style={styles.sheetSubtitle}>Share what&apos;s on your mind</Text>

                <View style={styles.createAuthorRow}>
                  <Avatar avatarId={myAvatar} alias={myName} size={36} />
                  <Text style={styles.createAuthorName}>{myName}</Text>
                </View>

                <TextInput
                  style={styles.createInput}
                  placeholder="What's happening? (Use @ to tag)"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={newContent}
                  onChangeText={(text) => {
                    setNewContent(text);
                    postMentions.handleTextChange(text);
                  }}
                  multiline
                  maxLength={280}
                  autoFocus
                />

                <MentionSuggestions
                  suggestions={postMentions.suggestions}
                  isLoading={postMentions.isLoading}
                  onSelect={(u) => postMentions.selectUser(u, newContent, setNewContent)}
                />

                <View style={styles.createFooter}>
                  <Text style={styles.charCount}>{newContent.length}/280</Text>
                  <Pressable
                    style={[
                      styles.postBtn,
                      (!newContent.trim() || isPosting) && styles.postBtnDisabled,
                    ]}
                    onPress={handleCreateMoment}
                    disabled={!newContent.trim() || isPosting}
                  >
                    <LinearGradient
                      colors={
                        newContent.trim() && !isPosting
                          ? colors.primaryGradient
                          : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.1)']
                      }
                      style={StyleSheet.absoluteFillObject}
                    />
                    <Text style={styles.postBtnText}>{isPosting ? 'Posting...' : 'Post'}</Text>
                  </Pressable>
                </View>
              </Animated.View>
            </View>
          </Animated.View>
        </Modal>

        {/* ─── Comment Sheet ───────────────────────────── */}
        <Modal
          visible={!!commentMomentId && !!commentMoment}
          transparent
          animationType="none"
          onRequestClose={closeComments}
          statusBarTranslucent
        >
          <Animated.View entering={FadeIn.duration(200)} style={styles.overlayWrapper}>
            <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFillObject} />
            <Pressable style={styles.overlayDismiss} onPress={closeComments} />

            <View
              style={[
                styles.sheetContainer,
                {
                  paddingBottom: keyboardHeight > 0 ? keyboardHeight : 0,
                },
              ]}
              pointerEvents="box-none"
            >
              <Animated.View
                entering={SlideInDown.duration(350)}
                style={[
                  styles.commentSheet,
                  {
                    maxHeight: Math.max(
                      240,
                      SCREEN_HEIGHT - (keyboardHeight > 0 ? keyboardHeight : 0) - insets.top - 40,
                    ),
                    paddingBottom:
                      keyboardHeight > 0 ? spacing.md : Math.max(insets.bottom, spacing.md),
                  },
                ]}
              >
                <View style={styles.sheetHandle} />
                <View style={styles.commentSheetHeader}>
                  <Heading level={3} style={styles.sheetTitle}>
                    Comments
                  </Heading>
                  <Pressable onPress={closeComments} hitSlop={12}>
                    <Ionicons name="close" size={24} color="rgba(255,255,255,0.6)" />
                  </Pressable>
                </View>

                {/* Existing comments */}
                <FlatList
                  data={organizedComments}
                  keyExtractor={(c) => c.id}
                  style={styles.commentList}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                  ListEmptyComponent={
                    <View style={styles.noComments}>
                      <Text style={styles.noCommentsText}>No comments yet. Be the first!</Text>
                    </View>
                  }
                  renderItem={({ item: c }) => (
                    <View style={[styles.commentItem, !!c.parentId && styles.replyCommentItem]}>
                      <Pressable
                        onPress={() => {
                          if (c.authorId) {
                            setCommentMomentId(null);
                            router.push(`/(app)/users/${c.authorId}`);
                          }
                        }}
                      >
                        <Avatar
                          avatarId={c.avatarId}
                          alias={c.author}
                          size={c.parentId ? 24 : 28}
                        />
                      </Pressable>
                      <View style={styles.commentBody}>
                        <View style={styles.commentNameRow}>
                          <Pressable
                            onPress={() => {
                              if (c.authorId) {
                                setCommentMomentId(null);
                                router.push(`/(app)/users/${c.authorId}`);
                              }
                            }}
                          >
                            <Text style={styles.commentAuthor}>{c.author}</Text>
                          </Pressable>
                          {c.username ? (
                            <Text style={styles.commentUsername}>@{c.username}</Text>
                          ) : null}
                          <Text style={styles.commentTime}>
                            ·{' '}
                            {c.timestamp ? new Date(c.timestamp).toLocaleDateString() : 'Just now'}
                          </Text>
                        </View>

                        {c.replyToUser ? (
                          <View style={styles.replyIndicator}>
                            <Ionicons
                              name="return-down-forward"
                              size={11}
                              color="rgba(255,255,255,0.4)"
                            />
                            <Text style={styles.replyIndicatorText}>
                              replying to{' '}
                              <Text style={styles.replyIndicatorUser}>
                                @{c.replyToUser.username || c.replyToUser.name}
                              </Text>
                            </Text>
                          </View>
                        ) : null}

                        <MentionText content={c.text} style={styles.commentText} />

                        {/* Comment Actions: Like & Reply */}
                        <View style={styles.commentActionsRow}>
                          <Pressable
                            style={styles.commentActionBtn}
                            onPress={() =>
                              commentMomentId && toggleCommentLike(commentMomentId, c.id)
                            }
                            hitSlop={8}
                          >
                            <Ionicons
                              name={c.isLiked ? 'heart' : 'heart-outline'}
                              size={13}
                              color={c.isLiked ? colors.primary : 'rgba(255,255,255,0.4)'}
                            />
                            {(c.likes || 0) > 0 && (
                              <Text
                                style={[
                                  styles.commentActionText,
                                  c.isLiked && { color: colors.primary },
                                ]}
                              >
                                {c.likes}
                              </Text>
                            )}
                          </Pressable>

                          <Pressable
                            style={styles.commentActionBtn}
                            onPress={() => handleReplyTo(c)}
                            hitSlop={8}
                          >
                            <Ionicons
                              name="arrow-undo-outline"
                              size={13}
                              color="rgba(255,255,255,0.4)"
                            />
                            <Text style={styles.commentActionText}>Reply</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  )}
                />

                {/* Replying banner */}
                {replyingTo && (
                  <View style={styles.replyingBar}>
                    <View style={styles.replyingInfo}>
                      <Ionicons name="return-down-forward" size={13} color={colors.primary} />
                      <Text style={styles.replyingText}>
                        Replying to{' '}
                        <Text style={styles.replyingTarget}>
                          @{replyingTo.username || replyingTo.author}
                        </Text>
                      </Text>
                    </View>
                    <Pressable onPress={() => setReplyingTo(null)} hitSlop={10}>
                      <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.4)" />
                    </Pressable>
                  </View>
                )}

                {/* Mention suggestions while typing comment */}
                <MentionSuggestions
                  suggestions={commentMentions.suggestions}
                  isLoading={commentMentions.isLoading}
                  onSelect={(u) => commentMentions.selectUser(u, commentText, setCommentText)}
                />

                {/* Input */}
                <View style={styles.commentInputRow}>
                  <Avatar avatarId={myAvatar} alias={myName} size={28} />
                  <TextInput
                    ref={commentInputRef}
                    style={styles.commentInput}
                    placeholder={
                      replyingTo
                        ? `Reply to @${replyingTo.username || replyingTo.author}...`
                        : 'Add a comment (use @ to tag)...'
                    }
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={commentText}
                    onChangeText={(text) => {
                      setCommentText(text);
                      commentMentions.handleTextChange(text);
                    }}
                    maxLength={200}
                    returnKeyType="send"
                    onSubmitEditing={postComment}
                  />
                  <Pressable
                    onPress={postComment}
                    disabled={!commentText.trim() || isCommenting}
                    style={[
                      styles.commentSendBtn,
                      (!commentText.trim() || isCommenting) && { opacity: 0.3 },
                    ]}
                  >
                    <Ionicons name="send" size={20} color={colors.primary} />
                  </Pressable>
                </View>
              </Animated.View>
            </View>
          </Animated.View>
        </Modal>

        {/* Activity Sheet */}
        <ActivitySheet
          visible={showActivity}
          onClose={() => setShowActivity(false)}
          onSelectMoment={handleSelectActivityMoment}
        />
      </SafeAreaView>
    </View>
  );
}

// ═══════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════
const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },
  list: { flex: 1 },
  container: {
    paddingTop: spacing.xs,
    paddingBottom: spacing['4xl'] * 2,
  },

  // Header
  header: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 32, fontWeight: '800', color: colors.white },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 4 },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  myMomentsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  myMomentsBtnText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },

  activityBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activityBtnActive: {
    backgroundColor: 'rgba(255,45,85,0.15)',
    borderColor: 'rgba(255,45,85,0.4)',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#000',
  },
  unreadBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },

  // Moment card
  momentCard: {
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.lg,
  },
  momentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  authorInfo: { flex: 1, marginLeft: spacing.md },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  authorName: { fontSize: 16, fontWeight: '700', color: colors.white },
  timestamp: { fontSize: 14, color: 'rgba(255,255,255,0.4)', marginLeft: 4 },
  authorHandle: { fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 2 },

  momentContent: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: spacing.xl,
  },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },

  separator: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },

  // Empty state
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: 'rgba(255,255,255,0.35)' },

  // FAB
  fabContainer: { position: 'absolute', bottom: spacing['2xl'], right: spacing['2xl'] },
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

  // Overlay shared
  overlayWrapper: { ...StyleSheet.absoluteFillObject, zIndex: 100 },
  overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  overlayDismiss: { ...StyleSheet.absoluteFillObject },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: 'white', textAlign: 'center' },
  sheetSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.xl,
  },

  // Create sheet — dark theme
  createSheet: {
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
    paddingBottom: spacing['2xl'],
    minHeight: 340,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  createAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing.md,
  },
  createAuthorName: { fontSize: 15, fontWeight: '600', color: 'white' },
  createInput: {
    color: 'white',
    fontSize: 17,
    lineHeight: 26,
    minHeight: 100,
    textAlignVertical: 'top',
    paddingVertical: spacing.sm,
  },
  createFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: spacing.md,
  },
  charCount: { fontSize: 13, color: 'rgba(255,255,255,0.25)' },
  postBtn: {
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  postBtnDisabled: { opacity: 0.5 },
  postBtnText: { fontSize: 15, fontWeight: '700', color: 'white' },

  sheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
  },
  commentSheet: {
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  commentSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  commentList: {
    flexShrink: 1,
  },
  noComments: { paddingVertical: 30, alignItems: 'center' },
  noCommentsText: { fontSize: 14, color: 'rgba(255,255,255,0.25)' },

  commentItem: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  replyCommentItem: {
    marginLeft: 26,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255,255,255,0.1)',
    paddingLeft: 10,
  },
  commentBody: { flex: 1 },
  commentNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  commentAuthor: { fontSize: 13, fontWeight: '700', color: 'white' },
  commentUsername: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  commentTime: { fontSize: 12, color: 'rgba(255,255,255,0.25)' },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    marginBottom: 2,
  },
  replyIndicatorText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
  },
  replyIndicatorUser: {
    color: colors.primary,
    fontWeight: '600',
  },
  commentText: { fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 20, marginTop: 3 },
  commentActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 6,
  },
  commentActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentActionText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
  },

  replyingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    marginBottom: spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  replyingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  replyingText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  replyingTarget: {
    color: colors.primary,
    fontWeight: '600',
  },

  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    marginTop: spacing.sm,
  },
  commentInput: {
    flex: 1,
    color: 'white',
    fontSize: 15,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: SHEET_SURFACE,
  },
  commentSendBtn: { padding: 6 },
});
