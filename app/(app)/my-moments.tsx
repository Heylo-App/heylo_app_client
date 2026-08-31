import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, FlatList, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { Text, Heading } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { spacing } from '@/theme/spacing';
import { colors } from '@/theme/colors';
import { useAuthStore } from '@/store/auth.store';
import { momentsService } from '@/services/moments.service';
import { socketService } from '@/services/socket.service';
import type { Moment } from '@/types/moment';

const MyMomentCard = ({ item, onLike }: { item: Moment; onLike: () => void }) => {
  const scale = useSharedValue(1);

  const handleLike = () => {
    scale.value = withSequence(withSpring(1.3, { damping: 2, stiffness: 150 }), withSpring(1));
    onLike();
  };

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Avatar avatarId={item.author.avatarId} alias={item.author.name} size={36} />
        <View style={styles.cardAuthorInfo}>
          <Text style={styles.cardAuthorName}>{item.author.name}</Text>
          <Text style={styles.cardTimestamp}>
            {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Just now'}
          </Text>
        </View>
      </View>

      <Text style={styles.cardContent}>{item.content}</Text>

      <View style={styles.cardActions}>
        <Pressable style={styles.actionBtn} onPress={handleLike}>
          <Animated.View style={heartStyle}>
            <Ionicons
              name={item.isLiked ? 'heart' : 'heart-outline'}
              size={18}
              color={item.isLiked ? colors.primary : 'rgba(255,255,255,0.45)'}
            />
          </Animated.View>
          <Text style={[styles.actionCount, item.isLiked && { color: colors.primary }]}>
            {item.likes}
          </Text>
        </Pressable>

        <View style={styles.actionBtn}>
          <Ionicons name="chatbubble-outline" size={17} color="rgba(255,255,255,0.45)" />
          <Text style={styles.actionCount}>{item.comments?.length || 0}</Text>
        </View>
      </View>
    </View>
  );
};

export default function MyMomentsScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [moments, setMoments] = useState<Moment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const myName = user?.alias || user?.name || 'Me';
  const myAvatar = user?.avatarId || 'avatar-1';

  const fetchMyMoments = useCallback(async () => {
    try {
      const data = await momentsService.getFeed();
      // Filter for only the current user's moments
      setMoments(data.filter((m) => m.isMine));
    } catch (error) {
      console.error('Failed to fetch my moments', error);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchMyMoments();
    setIsRefreshing(false);
  }, [fetchMyMoments]);

  useEffect(() => {
    setIsLoading(true);
    fetchMyMoments().finally(() => setIsLoading(false));
  }, [fetchMyMoments]);

  useEffect(() => {
    if (!socketService.isConnected) {
      useAuthStore.getState().token && socketService.connect(useAuthStore.getState().token!);
    }

    const handleMomentCreated = (newMoment: Moment) => {
      setMoments((prev) => {
        if (!newMoment.isMine || prev.find((m) => m.id === newMoment.id)) return prev;
        return [newMoment, ...prev];
      });
    };

    const handleMomentUpdated = (update: { id: string; likes: number; comments: any[] }) => {
      setMoments((prev) =>
        prev.map((m) => {
          if (m.id === update.id) {
            return { ...m, likes: update.likes, comments: update.comments };
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

  const toggleLike = async (id: string) => {
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

  const myMomentCount = moments.length;
  const totalLikes = moments.reduce((sum, m) => sum + m.likes, 0);

  return (
    <View style={styles.mainContainer}>
      <LinearGradient colors={['#18181B', '#000000']} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={moments}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="rgba(255,255,255,0.5)"
            />
          }
          ListHeaderComponent={
            <Animated.View entering={FadeIn.duration(500)}>
              {/* Back + Title */}
              <View style={styles.headerBar}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                  <Ionicons name="arrow-back" size={24} color="white" />
                </Pressable>
                <Heading level={1} style={styles.title}>
                  My Moments
                </Heading>
                <View style={{ width: 40 }} />
              </View>

              {/* Profile summary */}
              <View style={styles.profileSection}>
                <Avatar avatarId={myAvatar} alias={myName} size={56} />
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{myName}</Text>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{myMomentCount}</Text>
                      <Text style={styles.statLabel}>Posts</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{totalLikes}</Text>
                      <Text style={styles.statLabel}>Likes</Text>
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyState}>
                <Ionicons name="albums-outline" size={48} color="rgba(255,255,255,0.15)" />
                <Text style={styles.emptyText}>You haven&apos;t posted any moments yet</Text>
              </View>
            ) : null
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.duration(400).delay(index * 80)}>
              <MyMomentCard item={item} onLike={() => toggleLike(item.id)} />
            </Animated.View>
          )}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },
  listContent: { paddingBottom: spacing['4xl'] * 2 },

  // Header
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '800', color: 'white' },

  // Profile
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing.xl,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    marginBottom: spacing.sm,
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: '700', color: 'white', marginBottom: 10 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 18, fontWeight: '800', color: 'white' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  statDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.08)' },

  // Card
  card: {
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: 10,
  },
  cardAuthorInfo: { flex: 1 },
  cardAuthorName: { fontSize: 15, fontWeight: '700', color: 'white' },
  cardTimestamp: { fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 1 },
  cardContent: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionCount: { fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: '500' },

  separator: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },

  // Empty
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: 'rgba(255,255,255,0.3)' },
});
