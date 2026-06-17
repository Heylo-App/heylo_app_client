import { useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Dimensions, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, Easing, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, interpolateColor } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Text, Heading } from '@/components/ui/Text';
import { Avatar, AVATAR_OPTIONS } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/auth.store';
import { Routes } from '@/constants/routes';
import { spacing } from '@/theme/spacing';
import { colors } from '@/theme/colors';

const { width } = Dimensions.get('window');
const PINK = '#FF2D55';
const PURPLE = '#7C3AED';
const BLUE = '#3B82F6';
const EMERALD = '#10B981';
const AMBER = '#F59E0B';
const CYAN = '#06B6D4';

// ── Floating Icon ──────────────────────────────────────────────
const FloatingIcon = ({ name, color, delay, size = 24 }: { name: any; color: string; delay: number; size?: number }) => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 2000 + delay, easing: Easing.inOut(Easing.ease) }),
        withTiming(6, { duration: 2000 + delay, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000 + delay, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.floatingIconContainer, animatedStyle]}>
      <View style={[styles.iconGlow, { backgroundColor: color }]} />
      <View style={[styles.iconSolid, { backgroundColor: color }]}>
        <Ionicons name={name} size={size} color="white" />
      </View>
    </Animated.View>
  );
};

// ── Pulse Dot ──────────────────────────────────────────────────
const PulseDot = ({ color }: { color: string }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.6, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: 2 - scale.value, // fades as it scales
  }));

  return (
    <View style={{ width: 8, height: 8, marginRight: spacing.sm }}>
      <Animated.View style={[{ position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: color }, animatedStyle]} />
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
    </View>
  );
};

// ── Spotlight Data ─────────────────────────────────────────────
const SPOTLIGHT_DATA = [
  { id: '1', avatarId: 'avatar-1', alias: 'Luna', mood: '😊 Happy', gradientColors: ['#FF2D55', '#A855F7'] as const },
  { id: '2', avatarId: 'avatar-2', alias: 'Shadow', mood: '🎵 Chill', gradientColors: ['#0EA5E9', '#6366F1'] as const },
  { id: '3', avatarId: 'avatar-3', alias: 'Nova', mood: '🔥 Excited', gradientColors: ['#F59E0B', '#EF4444'] as const },
  { id: '4', avatarId: 'avatar-4', alias: 'Echo', mood: '💜 Calm', gradientColors: ['#8B5CF6', '#EC4899'] as const },
  { id: '5', avatarId: 'avatar-5', alias: 'Drift', mood: '🌙 Dreamy', gradientColors: ['#14B8A6', '#3B82F6'] as const },
];

// ── Quick Action Data ──────────────────────────────────────────
const QUICK_ACTIONS = [
  { id: 'match', icon: 'heart', label: 'Match', color: PINK },
  { id: 'explore', icon: 'compass', label: 'Explore', color: BLUE },
  { id: 'events', icon: 'calendar', label: 'Events', color: PURPLE },
  { id: 'mood', icon: 'happy', label: 'Mood', color: AMBER },
];

// ── Mood Streak Data ───────────────────────────────────────────
const STREAK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const STREAK_ACTIVE = [true, true, true, true, false, false, false]; // first 4 days active

// ════════════════════════════════════════════════════════════════
export default function HomeScreen() {
  const { user } = useAuthStore();
  const router = useRouter();

  return (
    <View style={styles.mainContainer}>
      <LinearGradient
        colors={['#18181B', '#000000']}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

          {/* ── Header ─────────────────────────────────────── */}
          <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Heading level={1} style={styles.aliasText}>{user?.alias || 'Traveler'}</Heading>
            </View>
            <Avatar avatarId={user?.avatarId || 'avatar-1'} alias={user?.alias} size={56} showOnline />
          </Animated.View>

          {/* ── Active Status Pill ─────────────────────────── */}
          <Animated.View entering={FadeIn.duration(600).delay(100)} style={styles.statusPill}>
            <PulseDot color={EMERALD} />
            <Text style={styles.statusText}>1,204 vibes active right now</Text>
          </Animated.View>

          {/* ── Quick Actions Row ──────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(500).delay(150)} style={styles.quickActionsRow}>
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.id}
                style={styles.quickAction}
                onPress={() => {
                  if (action.id === 'match') router.push(Routes.app.matching);
                  else alert(`${action.label} coming soon!`);
                }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                  <Ionicons name={action.icon as any} size={22} color="white" />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </Pressable>
            ))}
          </Animated.View>

          {/* ── Hero Card: Find Connection ─────────────────── */}
          <Animated.View entering={FadeInDown.duration(600).delay(200)}>
            <Pressable
              style={styles.heroCard}
              onPress={() => router.push(Routes.app.matching)}
            >
              <LinearGradient colors={[PINK, '#E11D48']} style={StyleSheet.absoluteFillObject} />
              <View style={styles.cardOverlay} />
              <View style={styles.heroCardContent}>
                <View style={styles.heroTextWrapper}>
                  <Heading level={2} style={styles.cardTitleWhite}>Find Connection</Heading>
                  <Text style={styles.cardSubtitleWhite}>Slide to match with someone who shares your vibe</Text>
                </View>
                <FloatingIcon name="heart" color={PINK} delay={0} />
              </View>
            </Pressable>
          </Animated.View>

          {/* ── Spotlight: Active Vibes ─────────────────────── */}
          <Animated.View entering={FadeInDown.duration(500).delay(300)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Vibes</Text>
              <Pressable><Text style={styles.seeAllText}>See All</Text></Pressable>
            </View>
            <FlatList
              horizontal
              data={SPOTLIGHT_DATA}
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.spotlightList}
              renderItem={({ item }) => (
                <Pressable style={styles.spotlightCard} onPress={() => alert(`${item.alias} is vibing!`)}>
                  <LinearGradient colors={[...item.gradientColors]} style={styles.spotlightGradient}>
                    <View style={styles.spotlightAvatarRing}>
                      <Avatar avatarId={item.avatarId} alias={item.alias} size={56} />
                    </View>
                    <Text style={styles.spotlightName}>{item.alias}</Text>
                    <Text style={styles.spotlightMood}>{item.mood}</Text>
                  </LinearGradient>
                </Pressable>
              )}
            />
          </Animated.View>

          {/* ── Two‑up: Chats + Voice ──────────────────────── */}
          <View style={styles.row}>
            <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.flex1}>
              <Pressable style={styles.smallCard} onPress={() => alert('Messages coming soon!')}>
                <FloatingIcon name="chatbubbles" color={PURPLE} delay={500} />
                <Heading level={3} style={styles.cardTitle}>Chats</Heading>
                <Text style={styles.cardSubtitle}>Your private convos</Text>
              </Pressable>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(500).delay(450)} style={styles.flex1}>
              <Pressable style={styles.smallCard} onPress={() => alert('Voice Rooms coming soon!')}>
                <FloatingIcon name="mic" color={BLUE} delay={1000} />
                <Heading level={3} style={styles.cardTitle}>Voice</Heading>
                <Text style={styles.cardSubtitle}>Drop-in audio rooms</Text>
              </Pressable>
            </Animated.View>
          </View>

          {/* ── Daily Prompt ────────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(500).delay(500)}>
            <Pressable style={styles.promptCard} onPress={() => alert('Answer prompt coming soon!')}>
              <LinearGradient colors={['rgba(139,92,246,0.15)', 'rgba(59,130,246,0.08)']} style={StyleSheet.absoluteFillObject} />
              <View style={styles.promptBadge}>
                <Ionicons name="sparkles" size={16} color={AMBER} />
                <Text style={styles.promptBadgeText}>Daily Prompt</Text>
              </View>
              <Text style={styles.promptQuestion}>
                "What's one thing you've never told anyone?"
              </Text>
              <Text style={styles.promptCta}>Tap to answer anonymously →</Text>
            </Pressable>
          </Animated.View>

          {/* ── Mood Streak ─────────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(500).delay(550)}>
            <View style={styles.streakCard}>
              <View style={styles.streakHeader}>
                <View style={styles.streakTitleRow}>
                  <Ionicons name="flame" size={22} color={AMBER} />
                  <Heading level={3} style={styles.streakTitle}>4-Day Streak</Heading>
                </View>
                <Text style={styles.streakSubtext}>Keep matching daily!</Text>
              </View>
              <View style={styles.streakDays}>
                {STREAK_DAYS.map((day, idx) => (
                  <View key={idx} style={styles.streakDayItem}>
                    <View style={[
                      styles.streakCircle,
                      STREAK_ACTIVE[idx] ? styles.streakCircleActive : styles.streakCircleInactive,
                    ]}>
                      {STREAK_ACTIVE[idx] && <Ionicons name="checkmark" size={14} color="white" />}
                    </View>
                    <Text style={[
                      styles.streakDayLabel,
                      STREAK_ACTIVE[idx] && styles.streakDayLabelActive,
                    ]}>{day}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* ── Community Stats ─────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(500).delay(600)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Community</Text>
            </View>
            <View style={styles.communityRow}>
              <View style={styles.communityStat}>
                <Text style={styles.communityValue}>14.2K</Text>
                <Text style={styles.communityLabel}>Matches Today</Text>
              </View>
              <View style={styles.communityDivider} />
              <View style={styles.communityStat}>
                <Text style={styles.communityValue}>2.8K</Text>
                <Text style={styles.communityLabel}>Voice Sessions</Text>
              </View>
              <View style={styles.communityDivider} />
              <View style={styles.communityStat}>
                <Text style={styles.communityValue}>98%</Text>
                <Text style={styles.communityLabel}>Safe Rating</Text>
              </View>
            </View>
          </Animated.View>

          {/* ── Upcoming Events ─────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(500).delay(650)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
              <Pressable><Text style={styles.seeAllText}>View All</Text></Pressable>
            </View>

            <Pressable style={styles.eventCard} onPress={() => alert('Event details coming soon!')}>
              <LinearGradient colors={[CYAN, BLUE]} style={styles.eventGradientStrip} />
              <View style={styles.eventContent}>
                <View style={styles.eventDateBubble}>
                  <Text style={styles.eventDateDay}>21</Text>
                  <Text style={styles.eventDateMonth}>JUN</Text>
                </View>
                <View style={styles.eventTextContent}>
                  <Text style={styles.eventTitle}>Midnight Vibe Check</Text>
                  <Text style={styles.eventSubtitle}>Anonymous group chat party • 11PM</Text>
                </View>
                <View style={styles.eventJoinBadge}>
                  <Text style={styles.eventJoinText}>Join</Text>
                </View>
              </View>
            </Pressable>

            <Pressable style={[styles.eventCard, { marginTop: spacing.md }]} onPress={() => alert('Event details coming soon!')}>
              <LinearGradient colors={[PURPLE, PINK]} style={styles.eventGradientStrip} />
              <View style={styles.eventContent}>
                <View style={styles.eventDateBubble}>
                  <Text style={styles.eventDateDay}>28</Text>
                  <Text style={styles.eventDateMonth}>JUN</Text>
                </View>
                <View style={styles.eventTextContent}>
                  <Text style={styles.eventTitle}>Speed Matching Night</Text>
                  <Text style={styles.eventSubtitle}>5 minute convos • 8PM</Text>
                </View>
                <View style={styles.eventJoinBadge}>
                  <Text style={styles.eventJoinText}>Join</Text>
                </View>
              </View>
            </Pressable>
          </Animated.View>

          {/* ── Safety / Privacy Banner ─────────────────────── */}
          <Animated.View entering={FadeInDown.duration(500).delay(700)}>
            <Pressable style={styles.safetyCard} onPress={() => router.push(Routes.app.about)}>
              <View style={styles.safetyIconBg}>
                <Ionicons name="shield-checkmark" size={24} color={EMERALD} />
              </View>
              <View style={styles.safetyTextContent}>
                <Heading level={3} style={styles.cardTitleSafety}>100% Anonymous</Heading>
                <Text style={styles.cardSubtitle}>Zero data. End-to-end encrypted. Always.</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
            </Pressable>
          </Animated.View>

          {/* ── Invite Friends Banner ──────────────────────── */}
          <Animated.View entering={FadeInDown.duration(500).delay(750)}>
            <Pressable style={styles.inviteCard} onPress={() => alert('Share link coming soon!')}>
              <LinearGradient colors={['rgba(255,45,85,0.12)', 'rgba(124,58,237,0.08)']} style={StyleSheet.absoluteFillObject} />
              <View style={styles.inviteContent}>
                <View style={styles.inviteIconCircle}>
                  <Ionicons name="paper-plane" size={22} color="white" />
                </View>
                <View style={styles.inviteTextContent}>
                  <Text style={styles.inviteTitle}>Invite Friends</Text>
                  <Text style={styles.inviteSubtitle}>Share Heylo & earn exclusive badges</Text>
                </View>
              </View>
              <View style={styles.inviteArrow}>
                <Ionicons name="arrow-forward-circle" size={32} color={PINK} />
              </View>
            </Pressable>
          </Animated.View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.xl,
    paddingBottom: 120,
    gap: spacing['2xl'],
  },

  // ── Header ───────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  aliasText: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.5,
  },

  // ── Status Pill ──────────────────────────────────────────
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },

  // ── Quick Actions ────────────────────────────────────────
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },

  // ── Hero Card ────────────────────────────────────────────
  heroCard: {
    width: '100%',
    height: 140,
    borderRadius: 28,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  heroCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    zIndex: 2,
  },
  heroTextWrapper: {
    flex: 1,
    paddingRight: spacing.md,
  },
  cardTitleWhite: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 4,
  },
  cardSubtitleWhite: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
    zIndex: 1,
  },

  // ── Spotlight ────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: PINK,
  },
  spotlightList: {
    gap: spacing.md,
  },
  spotlightCard: {
    width: 110,
    height: 150,
    borderRadius: 22,
    overflow: 'hidden',
  },
  spotlightGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  spotlightAvatarRing: {
    padding: 3,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    marginBottom: spacing.sm,
  },
  spotlightName: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  spotlightMood: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  // ── Two‑up Cards ─────────────────────────────────────────
  row: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  flex1: {
    flex: 1,
  },
  smallCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 28,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginTop: spacing.lg,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 18,
  },

  // ── Daily Prompt ─────────────────────────────────────────
  promptCard: {
    borderRadius: 24,
    padding: spacing.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)',
  },
  promptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  promptBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: AMBER,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  promptQuestion: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
    lineHeight: 30,
    fontStyle: 'italic',
    marginBottom: spacing.lg,
  },
  promptCta: {
    fontSize: 14,
    fontWeight: '600',
    color: PURPLE,
  },

  // ── Streak ───────────────────────────────────────────────
  streakCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 24,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  streakHeader: {
    marginBottom: spacing.xl,
  },
  streakTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  streakTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
  },
  streakSubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginLeft: 30,
  },
  streakDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  streakDayItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  streakCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakCircleActive: {
    backgroundColor: AMBER,
  },
  streakCircleInactive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  streakDayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.3)',
  },
  streakDayLabelActive: {
    color: AMBER,
  },

  // ── Community Stats ──────────────────────────────────────
  communityRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 24,
    paddingVertical: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  communityStat: {
    flex: 1,
    alignItems: 'center',
  },
  communityValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 4,
  },
  communityLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  communityDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  // ── Events ───────────────────────────────────────────────
  eventCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  eventGradientStrip: {
    height: 4,
  },
  eventContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  eventDateBubble: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventDateDay: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.white,
    lineHeight: 22,
  },
  eventDateMonth: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
  },
  eventTextContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 2,
  },
  eventSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  eventJoinBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  eventJoinText: {
    fontSize: 13,
    fontWeight: '700',
    color: PINK,
  },

  // ── Safety Banner ────────────────────────────────────────
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 24,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  safetyIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(16,185,129,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  safetyTextContent: {
    flex: 1,
  },
  cardTitleSafety: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },

  // ── Invite Card ──────────────────────────────────────────
  inviteCard: {
    borderRadius: 24,
    padding: spacing.xl,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,45,85,0.15)',
  },
  inviteContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  inviteIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PINK,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  inviteTextContent: {
    flex: 1,
  },
  inviteTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 2,
  },
  inviteSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  inviteArrow: {
    marginLeft: spacing.md,
  },

  // ── Shared Icon Styles ───────────────────────────────────
  floatingIconContainer: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSolid: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  iconGlow: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    opacity: 0.35,
    transform: [{ scale: 1.45 }],
  },
});

