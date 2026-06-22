import { useState } from 'react';
import { StyleSheet, View, FlatList, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withSpring, withSequence } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Text, Heading } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { spacing } from '@/theme/spacing';
import { colors } from '@/theme/colors';

const PINK = '#FF2D55';

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
  comments: number;
  reposts: number;
  isLiked: boolean;
}

const INITIAL_MOMENTS: Moment[] = [
  {
    id: '1',
    author: { name: 'Sarah Jenkins', handle: '@sarahj', avatarId: 'avatar-1' },
    content: 'Just had the best coffee at the new place downtown! ☕️ Anyone else been there yet?',
    timestamp: '2h ago',
    likes: 24,
    comments: 5,
    reposts: 2,
    isLiked: false,
  },
  {
    id: '2',
    author: { name: 'Mike Ross', handle: '@mikeross', avatarId: 'avatar-2' },
    content: 'Learning React Native Reanimated. The learning curve is real but the results are so worth it. 🚀',
    timestamp: '4h ago',
    likes: 112,
    comments: 18,
    reposts: 12,
    isLiked: true,
  },
  {
    id: '3',
    author: { name: 'Elena Gilbert', handle: '@elenag', avatarId: 'avatar-3' },
    content: 'Looking for podcast recommendations! I love true crime and tech. Drop your favorites below 👇',
    timestamp: '5h ago',
    likes: 45,
    comments: 32,
    reposts: 0,
    isLiked: false,
  },
  {
    id: '4',
    author: { name: 'David Kim', handle: '@dkim', avatarId: 'avatar-4' },
    content: 'What a beautiful sunset tonight! Sometimes you just have to stop and appreciate the little things.',
    timestamp: '1d ago',
    likes: 89,
    comments: 4,
    reposts: 5,
    isLiked: false,
  }
];

const MomentItem = ({ item, onLike }: { item: Moment, onLike: () => void }) => {
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
      <View style={styles.momentHeader}>
        <Avatar avatarId={item.author.avatarId} alias={item.author.name} size={40} />
        <View style={styles.authorInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.authorName}>{item.author.name}</Text>
            <Text style={styles.timestamp}>· {item.timestamp}</Text>
          </View>
          <Text style={styles.authorHandle}>{item.author.handle}</Text>
        </View>
        <Pressable style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="rgba(255,255,255,0.5)" />
        </Pressable>
      </View>
      
      <Text style={styles.momentContent}>{item.content}</Text>
      
      <View style={styles.actionsRow}>
        <Pressable style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={20} color="rgba(255,255,255,0.6)" />
          <Text style={styles.actionText}>{item.comments}</Text>
        </Pressable>
        
        <Pressable style={styles.actionButton}>
          <Ionicons name="repeat-outline" size={22} color="rgba(255,255,255,0.6)" />
          <Text style={styles.actionText}>{item.reposts}</Text>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={handleLike}>
          <Animated.View style={heartStyle}>
            <Ionicons 
              name={item.isLiked ? "heart" : "heart-outline"} 
              size={20} 
              color={item.isLiked ? PINK : "rgba(255,255,255,0.6)"} 
            />
          </Animated.View>
          <Text style={[styles.actionText, item.isLiked && { color: PINK }]}>
            {item.likes}
          </Text>
        </Pressable>
        
        <Pressable style={styles.actionButton}>
          <Ionicons name="share-outline" size={20} color="rgba(255,255,255,0.6)" />
        </Pressable>
      </View>
    </View>
  );
};

export default function MomentsScreen() {
  const [moments, setMoments] = useState(INITIAL_MOMENTS);

  const toggleLike = (id: string) => {
    setMoments(current => current.map(moment => {
      if (moment.id === id) {
        return {
          ...moment,
          isLiked: !moment.isLiked,
          likes: moment.isLiked ? moment.likes - 1 : moment.likes + 1
        };
      }
      return moment;
    }));
  };

  const ListHeader = () => (
    <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
      <Heading level={1} style={styles.title}>Moments</Heading>
      <Text style={styles.subtitle}>See what others are thinking</Text>
    </Animated.View>
  );

  return (
    <View style={styles.mainContainer}>
      <LinearGradient
        colors={['#18181B', '#000000']}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={moments}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.duration(400).delay(index * 100)}>
              <MomentItem item={item} onLike={() => toggleLike(item.id)} />
            </Animated.View>
          )}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
        
        {/* FAB */}
        <Animated.View entering={FadeInDown.duration(500).delay(500)} style={styles.fabContainer}>
          <Pressable style={styles.fab}>
            <LinearGradient colors={[PINK, '#E11D48']} style={StyleSheet.absoluteFillObject} />
            <Ionicons name="add" size={32} color="white" />
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },
  container: {
    paddingBottom: spacing['4xl'] * 2, // Extra padding for FAB
  },
  
  header: {
    paddingHorizontal: spacing['2xl'],
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.white,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
  },

  momentCard: {
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.lg,
  },
  momentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  authorInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  timestamp: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    marginLeft: 4,
  },
  authorHandle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  moreButton: {
    padding: spacing.xs,
  },
  
  momentContent: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: spacing.xl,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },

  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  fabContainer: {
    position: 'absolute',
    bottom: spacing['2xl'],
    right: spacing['2xl'],
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: PINK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
