import { useState } from 'react';
import { StyleSheet, View, FlatList, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withSpring, withSequence } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { Text, Heading } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { spacing } from '@/theme/spacing';
import { colors } from '@/theme/colors';
import { useAuthStore } from '@/store/auth.store';


interface MyMoment {
  id: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  reposts: number;
  isLiked: boolean;
  isRepost: boolean;
  originalAuthor?: { name: string; handle: string; avatarId: string };
}

// Mock data for demo — in production this would come from the store/API
const MY_MOMENTS_DATA: MyMoment[] = [
  {
    id: 'my-1',
    content: 'Just started using Heylo and already loving the vibe here ✨',
    timestamp: '1h ago',
    likes: 8, comments: 2, reposts: 0,
    isLiked: false, isRepost: false,
  },
  {
    id: 'my-2',
    content: 'Learning React Native Reanimated. The learning curve is real but the results are so worth it. 🚀',
    timestamp: '3h ago',
    likes: 3, comments: 0, reposts: 0,
    isLiked: false, isRepost: true,
    originalAuthor: { name: 'Mike Ross', handle: '@mikeross', avatarId: 'avatar-2' },
  },
  {
    id: 'my-3',
    content: 'Late night coding sessions hit different with lo-fi beats 🎧',
    timestamp: '1d ago',
    likes: 14, comments: 5, reposts: 1,
    isLiked: true, isRepost: false,
  },
];

const MyMomentCard = ({ item, myName, myAvatar, onLike }: {
  item: MyMoment;
  myName: string;
  myAvatar: string;
  onLike: () => void;
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
    <View style={styles.card}>
      {/* Repost credit */}
      {item.isRepost && item.originalAuthor && (
        <View style={styles.repostCreditRow}>
          <Ionicons name="repeat" size={14} color="#10B981" />
          <Text style={styles.repostCreditText}>Reposted from</Text>
          <Text style={styles.repostCreditAuthor}>{item.originalAuthor.name}</Text>
        </View>
      )}

      <View style={styles.cardHeader}>
        <Avatar
          avatarId={item.isRepost && item.originalAuthor ? item.originalAuthor.avatarId : myAvatar}
          alias={item.isRepost && item.originalAuthor ? item.originalAuthor.name : myName}
          size={36}
        />
        <View style={styles.cardAuthorInfo}>
          <Text style={styles.cardAuthorName}>
            {item.isRepost && item.originalAuthor ? item.originalAuthor.name : myName}
          </Text>
          <Text style={styles.cardTimestamp}>{item.timestamp}</Text>
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
          <Text style={[styles.actionCount, item.isLiked && { color: colors.primary }]}>{item.likes}</Text>
        </Pressable>

        <View style={styles.actionBtn}>
          <Ionicons name="chatbubble-outline" size={17} color="rgba(255,255,255,0.45)" />
          <Text style={styles.actionCount}>{item.comments}</Text>
        </View>

        <View style={styles.actionBtn}>
          <Ionicons name="repeat-outline" size={19} color="rgba(255,255,255,0.45)" />
          <Text style={styles.actionCount}>{item.reposts}</Text>
        </View>
      </View>
    </View>
  );
};

export default function MyMomentsScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [moments, setMoments] = useState(MY_MOMENTS_DATA);

  const myName = user?.alias || 'Me';
  const myAvatar = user?.avatarId || 'avatar-1';

  const toggleLike = (id: string) => {
    setMoments(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, isLiked: !m.isLiked, likes: m.isLiked ? m.likes - 1 : m.likes + 1 };
      }
      return m;
    }));
  };

  const myMomentCount = moments.filter(m => !m.isRepost).length;
  const repostCount = moments.filter(m => m.isRepost).length;

  return (
    <View style={styles.mainContainer}>
      <LinearGradient colors={['#18181B', '#000000']} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={moments}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <Animated.View entering={FadeIn.duration(500)}>
              {/* Back + Title */}
              <View style={styles.headerBar}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                  <Ionicons name="arrow-back" size={24} color="white" />
                </Pressable>
                <Heading level={1} style={styles.title}>My Moments</Heading>
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
                      <Text style={styles.statValue}>{repostCount}</Text>
                      <Text style={styles.statLabel}>Reposts</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{moments.reduce((sum, m) => sum + m.likes, 0)}</Text>
                      <Text style={styles.statLabel}>Likes</Text>
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="albums-outline" size={48} color="rgba(255,255,255,0.15)" />
              <Text style={styles.emptyText}>You haven't posted any moments yet</Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.duration(400).delay(index * 80)}>
              <MyMomentCard
                item={item}
                myName={myName}
                myAvatar={myAvatar}
                onLike={() => toggleLike(item.id)}
              />
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
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
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

  // Repost credit
  repostCreditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
    paddingLeft: 4,
  },
  repostCreditText: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  repostCreditAuthor: { fontSize: 12, fontWeight: '700', color: '#10B981' },

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
