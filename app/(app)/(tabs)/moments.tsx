import { useState, useRef } from 'react';
import { StyleSheet, View, FlatList, Pressable, TextInput, Share, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, SlideInDown, SlideOutDown, useAnimatedStyle, useSharedValue, withSpring, withSequence } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';

import { Text, Heading } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { spacing } from '@/theme/spacing';
import { colors } from '@/theme/colors';
import { useAuthStore } from '@/store/auth.store';

const PINK = '#FF2D55';
const SHEET_BG = '#111115';
const SHEET_SURFACE = 'rgba(255,255,255,0.06)';
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Types ──────────────────────────────────────────────
interface Comment {
  id: string;
  author: string;
  avatarId: string;
  text: string;
  timestamp: string;
}

interface Moment {
  id: string;
  author: {
    name: string;
    handle: string;
    avatarId: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: Comment[];
  reposts: number;
  isLiked: boolean;
  isReposted: boolean;
  isMine: boolean;
  originalAuthor?: {
    name: string;
    handle: string;
    avatarId: string;
  };
}

// ─── Mock Data ──────────────────────────────────────────
const INITIAL_MOMENTS: Moment[] = [
  {
    id: '1',
    author: { name: 'Sarah Jenkins', handle: '@sarahj', avatarId: 'avatar-1' },
    content: 'Just had the best coffee at the new place downtown! ☕️ Anyone else been there yet?',
    timestamp: '2h ago',
    likes: 24, comments: [
      { id: 'c1', author: 'Mike', avatarId: 'avatar-2', text: 'Which place? I need to try it!', timestamp: '1h ago' },
    ], reposts: 2, isLiked: false, isReposted: false, isMine: false,
  },
  {
    id: '2',
    author: { name: 'Mike Ross', handle: '@mikeross', avatarId: 'avatar-2' },
    content: 'Learning React Native Reanimated. The learning curve is real but the results are so worth it. 🚀',
    timestamp: '4h ago',
    likes: 112, comments: [
      { id: 'c2', author: 'Elena', avatarId: 'avatar-3', text: 'So true! Check out William Candillon\'s channel.', timestamp: '3h ago' },
      { id: 'c3', author: 'David', avatarId: 'avatar-4', text: 'Stick with it! Gets easier.', timestamp: '2h ago' },
    ], reposts: 12, isLiked: true, isReposted: false, isMine: false,
  },
  {
    id: '3',
    author: { name: 'Elena Gilbert', handle: '@elenag', avatarId: 'avatar-3' },
    content: 'Looking for podcast recommendations! I love true crime and tech. Drop your favorites below 👇',
    timestamp: '5h ago',
    likes: 45, comments: [], reposts: 0, isLiked: false, isReposted: false, isMine: false,
  },
  {
    id: '4',
    author: { name: 'David Kim', handle: '@dkim', avatarId: 'avatar-4' },
    content: 'What a beautiful sunset tonight! Sometimes you just have to stop and appreciate the little things.',
    timestamp: '1d ago',
    likes: 89, comments: [], reposts: 5, isLiked: false, isReposted: false, isMine: false,
  }
];

// ═══════════════════════════════════════════════════════
// MomentItem Component
// ═══════════════════════════════════════════════════════
const MomentItem = ({ item, onLike, onComment, onRepost, onShare }: {
  item: Moment;
  onLike: () => void;
  onComment: () => void;
  onRepost: () => void;
  onShare: () => void;
}) => {
  const scale = useSharedValue(1);

  const handleLike = () => {
    scale.value = withSequence(
      withSpring(1.3, { damping: 2, stiffness: 150 }),
      withSpring(1)
    );
    onLike();
  };

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <View style={styles.momentCard}>
      {/* Repost credit banner */}
      {item.originalAuthor && (
        <View style={styles.repostCreditRow}>
          <Ionicons name="repeat" size={14} color="#10B981" />
          <Text style={styles.repostCreditText}>
            {item.author.name} reposted from
          </Text>
          <Text style={styles.repostCreditAuthor}>{item.originalAuthor.name}</Text>
        </View>
      )}

      <View style={styles.momentHeader}>
        {/* Show original author avatar+info when it's a repost, otherwise show post author */}
        {item.originalAuthor ? (
          <>
            <Avatar avatarId={item.originalAuthor.avatarId} alias={item.originalAuthor.name} size={40} />
            <View style={styles.authorInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.authorName}>{item.originalAuthor.name}</Text>
                <Text style={styles.timestamp}>· {item.timestamp}</Text>
              </View>
              <Text style={styles.authorHandle}>{item.originalAuthor.handle}</Text>
            </View>
          </>
        ) : (
          <>
            <Avatar avatarId={item.author.avatarId} alias={item.author.name} size={40} />
            <View style={styles.authorInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.authorName}>{item.author.name}</Text>
                <Text style={styles.timestamp}>· {item.timestamp}</Text>
              </View>
              <Text style={styles.authorHandle}>{item.author.handle}</Text>
            </View>
          </>
        )}
      </View>
      
      <Text style={styles.momentContent}>{item.content}</Text>
      
      {/* Action Row: Like → Comment → Repost → Share */}
      <View style={styles.actionsRow}>
        <Pressable style={styles.actionButton} onPress={handleLike}>
          <Animated.View style={heartStyle}>
            <Ionicons 
              name={item.isLiked ? "heart" : "heart-outline"} 
              size={20} 
              color={item.isLiked ? PINK : "rgba(255,255,255,0.5)"} 
            />
          </Animated.View>
          <Text style={[styles.actionText, item.isLiked && { color: PINK }]}>
            {item.likes}
          </Text>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={onComment}>
          <Ionicons name="chatbubble-outline" size={19} color="rgba(255,255,255,0.5)" />
          <Text style={styles.actionText}>{item.comments.length}</Text>
        </Pressable>
        
        <Pressable style={styles.actionButton} onPress={onRepost}>
          <Ionicons 
            name={item.isReposted ? "repeat" : "repeat-outline"} 
            size={21} 
            color={item.isReposted ? '#10B981' : "rgba(255,255,255,0.5)"} 
          />
          <Text style={[styles.actionText, item.isReposted && { color: '#10B981' }]}>
            {item.reposts}
          </Text>
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
export default function MomentsScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [moments, setMoments] = useState(INITIAL_MOMENTS);

  // Comment sheet state
  const [commentMomentId, setCommentMomentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const commentInputRef = useRef<TextInput>(null);

  // Create moment modal state
  const [showCreate, setShowCreate] = useState(false);
  const [newContent, setNewContent] = useState('');

  const myName = user?.alias || 'Me';
  const myAvatar = user?.avatarId || 'avatar-1';

  // ─── Handlers ───────────────────────────────────────
  const toggleLike = (id: string) => {
    setMoments(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, isLiked: !m.isLiked, likes: m.isLiked ? m.likes - 1 : m.likes + 1 };
      }
      return m;
    }));
  };

  const openComments = (id: string) => {
    setCommentMomentId(id);
    setCommentText('');
    setTimeout(() => commentInputRef.current?.focus(), 400);
  };

  const postComment = () => {
    if (!commentText.trim() || !commentMomentId) return;
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      author: myName,
      avatarId: myAvatar,
      text: commentText.trim(),
      timestamp: 'Just now',
    };
    setMoments(prev => prev.map(m => {
      if (m.id === commentMomentId) {
        return { ...m, comments: [...m.comments, newComment] };
      }
      return m;
    }));
    setCommentText('');
  };

  const handleRepost = (id: string) => {
    const original = moments.find(m => m.id === id);
    if (!original || original.isReposted) return;

    setMoments(prev => {
      const updated = prev.map(m => {
        if (m.id === id) return { ...m, isReposted: true, reposts: m.reposts + 1 };
        return m;
      });
      // Create repost with original author credit
      const repost: Moment = {
        id: `repost-${Date.now()}`,
        author: { name: myName, handle: `@${myName.toLowerCase().replace(/\s/g, '')}`, avatarId: myAvatar },
        originalAuthor: original.originalAuthor || original.author,
        content: original.content,
        timestamp: 'Just now',
        likes: 0, comments: [], reposts: 0,
        isLiked: false, isReposted: true, isMine: true,
      };
      return [repost, ...updated];
    });
  };

  const handleShare = async (item: Moment) => {
    try {
      await Share.share({
        message: `${item.author.name}: "${item.content}" — shared from Heylo`,
      });
    } catch (_) { /* cancelled */ }
  };

  const handleCreateMoment = () => {
    if (!newContent.trim()) return;
    const newMoment: Moment = {
      id: `my-${Date.now()}`,
      author: { name: myName, handle: `@${myName.toLowerCase().replace(/\s/g, '')}`, avatarId: myAvatar },
      content: newContent.trim(),
      timestamp: 'Just now',
      likes: 0, comments: [], reposts: 0,
      isLiked: false, isReposted: false, isMine: true,
    };
    setMoments(prev => [newMoment, ...prev]);
    setNewContent('');
    setShowCreate(false);
  };

  // ─── Comment Sheet (current moment) ─────────────────
  const commentMoment = moments.find(m => m.id === commentMomentId);

  // ─── Header ─────────────────────────────────────────
  const listHeader = (
    <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
      <View style={styles.headerRow}>
        <View>
          <Heading level={1} style={styles.title}>Moments</Heading>
          <Text style={styles.subtitle}>See what others are thinking</Text>
        </View>
        <Pressable
          style={styles.myMomentsBtn}
          onPress={() => router.push('/(app)/my-moments')}
        >
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
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.duration(400).delay(index * 80)}>
              <MomentItem
                item={item}
                onLike={() => toggleLike(item.id)}
                onComment={() => openComments(item.id)}
                onRepost={() => handleRepost(item.id)}
                onShare={() => handleShare(item)}
              />
            </Animated.View>
          )}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="albums-outline" size={48} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyText}>No moments yet</Text>
            </View>
          }
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
        
        {/* FAB */}
        <Animated.View entering={FadeInDown.duration(500).delay(500)} style={styles.fabContainer}>
          <Pressable style={styles.fab} onPress={() => setShowCreate(true)}>
            <LinearGradient colors={[PINK, '#E11D48']} style={StyleSheet.absoluteFillObject} />
            <Ionicons name="add" size={32} color="white" />
          </Pressable>
        </Animated.View>

        {/* ─── Create Moment Modal ─────────────────────── */}
        {showCreate && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.overlayWrapper}>
            <BlurView intensity={60} tint="dark" style={styles.overlay}>
              <Pressable style={styles.overlayDismiss} onPress={() => setShowCreate(false)} />
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
                <Animated.View entering={SlideInDown.duration(350)} style={styles.createSheet}>
                  <View style={styles.sheetHandle} />
                  <Heading level={2} style={styles.sheetTitle}>New Moment</Heading>
                  <Text style={styles.sheetSubtitle}>Share what's on your mind</Text>

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
                      style={[styles.postBtn, !newContent.trim() && styles.postBtnDisabled]}
                      onPress={handleCreateMoment}
                      disabled={!newContent.trim()}
                    >
                      <LinearGradient
                        colors={newContent.trim() ? [PINK, '#E11D48'] : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.1)']}
                        style={StyleSheet.absoluteFillObject}
                      />
                      <Text style={styles.postBtnText}>Post</Text>
                    </Pressable>
                  </View>
                </Animated.View>
              </KeyboardAvoidingView>
            </BlurView>
          </Animated.View>
        )}

        {/* ─── Comment Sheet ───────────────────────────── */}
        {commentMomentId && commentMoment && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.overlayWrapper}>
            <BlurView intensity={60} tint="dark" style={styles.overlay}>
              <Pressable style={styles.overlayDismiss} onPress={() => setCommentMomentId(null)} />
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
                <Animated.View entering={SlideInDown.duration(350)} style={styles.commentSheet}>
                  <View style={styles.sheetHandle} />
                  <View style={styles.commentSheetHeader}>
                    <Heading level={3} style={styles.sheetTitle}>Comments</Heading>
                    <Pressable onPress={() => setCommentMomentId(null)}>
                      <Ionicons name="close" size={24} color="rgba(255,255,255,0.6)" />
                    </Pressable>
                  </View>

                  {/* Existing comments */}
                  <FlatList
                    data={commentMoment.comments}
                    keyExtractor={(c) => c.id}
                    style={styles.commentList}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                      <View style={styles.noComments}>
                        <Text style={styles.noCommentsText}>No comments yet. Be the first!</Text>
                      </View>
                    }
                    renderItem={({ item: c }) => (
                      <View style={styles.commentItem}>
                        <Avatar avatarId={c.avatarId} alias={c.author} size={28} />
                        <View style={styles.commentBody}>
                          <View style={styles.commentNameRow}>
                            <Text style={styles.commentAuthor}>{c.author}</Text>
                            <Text style={styles.commentTime}>{c.timestamp}</Text>
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
                    />
                    <Pressable
                      onPress={postComment}
                      disabled={!commentText.trim()}
                      style={[styles.commentSendBtn, !commentText.trim() && { opacity: 0.3 }]}
                    >
                      <Ionicons name="send" size={20} color={PINK} />
                    </Pressable>
                  </View>
                </Animated.View>
              </KeyboardAvoidingView>
            </BlurView>
          </Animated.View>
        )}

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

  // Repost credit
  repostCreditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
    paddingLeft: 4,
  },
  repostCreditText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  repostCreditAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
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
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    shadowColor: PINK, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },

  // Overlay shared
  overlayWrapper: { ...StyleSheet.absoluteFillObject, zIndex: 100 },
  overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  overlayDismiss: { ...StyleSheet.absoluteFillObject },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: 'white', textAlign: 'center' },
  sheetSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 4, marginBottom: spacing.xl },

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

  // Comment sheet — dark theme
  commentSheet: {
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    maxHeight: SCREEN_HEIGHT * 0.65,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  commentSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  commentList: { maxHeight: SCREEN_HEIGHT * 0.35 },
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
