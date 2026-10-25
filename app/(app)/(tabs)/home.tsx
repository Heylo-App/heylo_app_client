import { useState, useRef, useEffect, useCallback } from 'react';
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
import { spacing } from '@/theme/spacing';
import { colors } from '@/theme/colors';
import { useAuthStore } from '@/store/auth.store';
import { momentsService } from '@/services/moments.service';
import type { Moment } from '@/types/moment';
import { HomeSkeleton } from '@/components/skeletons';

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

      <Text style={styles.momentContent}>{item.content}</Text>

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
  const commentInputRef = useRef<TextInput>(null);

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
    setTimeout(() => commentInputRef.current?.focus(), 300);
  };

  const closeComments = () => {
    Keyboard.dismiss();
    setCommentMomentId(null);
  };

  const postComment = async () => {
    if (!commentText.trim() || !commentMomentId || isCommenting) return;
    setIsCommenting(true);
    try {
      const updatedMoment = await momentsService.addComment(commentMomentId, commentText.trim());
      setMoments((prev) => prev.map((m) => (m.id === commentMomentId ? updatedMoment : m)));
      setCommentText('');
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
    if (!newContent.trim() || isPosting) return;
    setIsPosting(true);
    try {
      const newMoment = await momentsService.createMoment({ content: newContent.trim() });
      setMoments((prev) => [newMoment, ...prev]);
      setNewContent('');
      setShowCreate(false);
    } catch (error) {
      console.error('Failed to create moment', error);
    } finally {
      setIsPosting(false);
    }
  };

  // ─── Comment Sheet (current moment) ─────────────────
  const commentMoment = moments.find((m) => m.id === commentMomentId);

  // ─── Header ─────────────────────────────────────────
  const listHeader = (
    <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
      <View style={styles.headerRow}>
        <View>
          <Heading level={1} style={styles.title}>
            Home
          </Heading>
          <Text style={styles.subtitle}>See what others are thinking</Text>
        </View>
        <Pressable style={styles.myMomentsBtn} onPress={() => router.push('/(app)/my-moments')}>
          <Ionicons name="person" size={14} color="rgba(255,255,255,0.6)" />
          <Text style={styles.myMomentsBtnText}>My Moments</Text>
        </Pressable>
      </View>
    </Animated.View>
  );

  // ─── Render ─────────────────────────────────────────
  return (
    <View style={styles.mainContainer}>
      <LinearGradient colors={['#18181B', '#000000']} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={moments}
          keyExtractor={(item) => item.id}
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
          ListHeaderComponent={listHeader}
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
                  placeholder="What's happening?"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={newContent}
                  onChangeText={setNewContent}
                  multiline
                  maxLength={280}
                  autoFocus
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
                  data={commentMoment?.comments}
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
                    <View style={styles.commentItem}>
                      <Pressable
                        onPress={() => {
                          if (c.authorId) {
                            setCommentMomentId(null);
                            router.push(`/(app)/users/${c.authorId}`);
                          }
                        }}
                      >
                        <Avatar avatarId={c.avatarId} alias={c.author} size={28} />
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
                          <Text style={styles.commentTime}>
                            {c.timestamp ? new Date(c.timestamp).toLocaleDateString() : 'Just now'}
                          </Text>
                        </View>
                        <Text style={styles.commentText}>{c.text}</Text>
                      </View>
                    </View>
                  )}
                />

                {/* Input */}
                <View style={styles.commentInputRow}>
                  <Avatar avatarId={myAvatar} alias={myName} size={28} />
                  <TextInput
                    ref={commentInputRef}
                    style={styles.commentInput}
                    placeholder="Add a comment..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={commentText}
                    onChangeText={setCommentText}
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
  container: { paddingBottom: spacing['4xl'] * 2 },

  // Header
  header: {
    paddingHorizontal: spacing['2xl'],
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: { fontSize: 32, fontWeight: '800', color: colors.white },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 4 },

  myMomentsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  myMomentsBtnText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },

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
  commentBody: { flex: 1 },
  commentNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  commentAuthor: { fontSize: 14, fontWeight: '700', color: 'white' },
  commentTime: { fontSize: 12, color: 'rgba(255,255,255,0.25)' },
  commentText: { fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 20, marginTop: 3 },

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
