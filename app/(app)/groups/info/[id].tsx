import { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Text, Heading } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { groupsService } from '@/services/groups.service';

interface MemberInfo {
  _id: string;
  alias: string;
  username: string;
  avatarId: string;
  mood?: string;
}

interface GroupInfoData {
  _id: string;
  name: string;
  description?: string;
  inviteCode: string;
  adminId: MemberInfo;
  members: MemberInfo[];
  createdAt: string;
}

export default function GroupInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [info, setInfo] = useState<GroupInfoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const data = await groupsService.getGroupInfo(id);
        setInfo(data);
      } catch (error) {
        console.error('Failed to load group info', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!info) {
    return (
      <View style={styles.center}>
        <Text style={{ color: 'rgba(255,255,255,0.5)' }}>Could not load group info.</Text>
      </View>
    );
  }

  const renderMember = ({ item, index }: { item: MemberInfo; index: number }) => {
    const isAdmin = item._id === info.adminId._id;
    return (
      <Animated.View entering={FadeInDown.delay(index * 60).duration(300)} style={styles.memberRow}>
        <Avatar avatarId={item.avatarId} size={44} />
        <View style={styles.memberInfo}>
          <View style={styles.memberNameRow}>
            <Text style={styles.memberAlias}>{item.alias}</Text>
            {isAdmin && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            )}
          </View>
          <Text style={styles.memberUsername}>@{item.username}</Text>
        </View>
        {item.mood && (
          <View style={styles.moodChip}>
            <Text style={styles.moodText}>{item.mood}</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  const ListHeader = () => (
    <Animated.View entering={FadeIn.duration(400)}>
      {/* Group Icon & Name */}
      <View style={styles.heroSection}>
        <View style={styles.groupIconLg}>
          <Ionicons name="people" size={56} color={colors.primary} />
        </View>
        <Heading level={1} style={styles.groupName}>
          {info.name}
        </Heading>
        {info.description ? <Text style={styles.groupDesc}>{info.description}</Text> : null}
        <Text style={styles.memberCount}>
          {info.members.length} member{info.members.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Admin Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Created by</Text>
      </View>
      <View style={styles.adminCard}>
        <Avatar avatarId={info.adminId.avatarId} size={48} />
        <View style={styles.adminInfo}>
          <Text style={styles.adminName}>{info.adminId.alias}</Text>
          <Text style={styles.adminUsername}>@{info.adminId.username}</Text>
        </View>
        <View style={styles.crownBadge}>
          <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
        </View>
      </View>

      {/* Members Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Members</Text>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.mainContainer}>
      <LinearGradient colors={['#18181B', '#000000']} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
          <Heading level={2} style={styles.headerTitle}>
            Group Info
          </Heading>
          <View style={{ width: 44 }} />
        </View>

        <FlatList
          data={info.members}
          keyExtractor={(item) => item._id}
          renderItem={renderMember}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },
  center: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.white },

  listContent: { paddingBottom: 40 },

  // Hero
  heroSection: { alignItems: 'center', paddingVertical: 32 },
  groupIconLg: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: 'rgba(236, 72, 153, 0.2)',
  },
  groupName: { fontSize: 28, fontWeight: '800', color: colors.white, textAlign: 'center' },
  groupDesc: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xl,
  },
  memberCount: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.3)',
    marginTop: spacing.sm,
    fontWeight: '600',
  },

  // Section
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Admin card
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    backgroundColor: 'rgba(236, 72, 153, 0.08)',
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.15)',
  },
  adminInfo: { flex: 1, marginLeft: spacing.md },
  adminName: { fontSize: 16, fontWeight: '700', color: colors.white },
  adminUsername: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  crownBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Members
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  memberInfo: { flex: 1, marginLeft: spacing.md },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  memberAlias: { fontSize: 16, fontWeight: '600', color: colors.white },
  memberUsername: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  adminBadge: {
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  adminBadgeText: { fontSize: 11, color: colors.primary, fontWeight: '700' },
  moodChip: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  moodText: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
});
