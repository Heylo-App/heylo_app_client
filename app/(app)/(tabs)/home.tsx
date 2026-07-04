import { useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Dimensions, FlatList, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, Easing, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, interpolateColor } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Text, Heading } from '@/components/ui/Text';
import { Avatar, AVATAR_OPTIONS } from '@/components/ui/Avatar';
import { MoodChip } from '@/components/ui/MoodChip';
import { PulseDot } from '@/components/ui/PulseDot';
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
            <Pressable onPress={() => router.push(Routes.app.about)}>
              <Avatar avatarId={user?.avatarId || 'avatar-1'} alias={user?.alias} size={56} showOnline />
            </Pressable>
          </Animated.View>

          {/* ── Active Status Pill ─────────────────────────── */}
          <Animated.View entering={FadeIn.duration(600).delay(100)} style={styles.statusPill}>
            <PulseDot color={EMERALD} />
            <Text style={styles.statusText}>1,204 vibes active right now</Text>
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



          {/* ── Two‑up: Moments + Rooms ──────────────────── */}
          <View style={styles.row}>
            <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.flex1}>
              <Pressable style={styles.smallCard} onPress={() => router.push(Routes.app.moments)}>
                <FloatingIcon name="albums" color={PURPLE} delay={500} />
                <Heading level={3} style={styles.cardTitle}>Moments</Heading>
                <Text style={styles.cardSubtitle}>Share your world</Text>
              </Pressable>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(500).delay(450)} style={styles.flex1}>
              <Pressable style={styles.smallCard} onPress={() => router.push(Routes.app.rooms)}>
                <FloatingIcon name="mic" color={BLUE} delay={1000} />
                <Heading level={3} style={styles.cardTitle}>Rooms</Heading>
                <Text style={styles.cardSubtitle}>Join live rooms</Text>
              </Pressable>
            </Animated.View>
          </View>

          {/* ── Ask Me Anonymously Card ──────────────────────── */}
          <Animated.View entering={FadeInDown.duration(500).delay(500)}>
            <View style={styles.askCard}>
              <LinearGradient
                colors={['rgba(124,58,237,0.18)', 'rgba(59,130,246,0.10)']}
                style={StyleSheet.absoluteFillObject}
              />
              {/* Top badge row */}
              <View style={styles.askBadgeRow}>
                <View style={styles.askBadge}>
                  <Ionicons name="heart-outline" size={14} color={PURPLE} />
                  <Text style={styles.askBadgeText}>Anonymous Feedback</Text>
                </View>
                <View style={styles.askLiveDot} />
              </View>

              {/* Headline */}
              <Heading level={2} style={styles.askTitle}>How do your friends{`\n`}really feel about you? 💌</Heading>
              <Text style={styles.askSubtitle}>
                Share a link — friends leave honest, anonymous feedback about you. No names, just truth.
              </Text>

              {/* Preview feedback chips */}
              <View style={styles.askPreviewRow}>
                {['You make me smile 😊', 'You\'re so real', 'I miss talking to you'].map((q) => (
                  <View key={q} style={styles.askPreviewChip}>
                    <Text style={styles.askPreviewChipText}>{q}</Text>
                  </View>
                ))}
              </View>

              {/* CTA */}
              <Pressable
                style={styles.askCta}
                onPress={() =>
                  Share.share({
                    message: `Tell me anonymously how you feel about me 💌\nhttps://heylo.app/feedback/${user?.alias?.toLowerCase() || 'me'}`,
                    title: 'Anonymous Feedback',
                  })
                }
              >
                <LinearGradient colors={[PURPLE, '#9333EA']} style={StyleSheet.absoluteFillObject} />
                <Ionicons name="link" size={18} color="white" />
                <Text style={styles.askCtaText}>Share My Feedback Link</Text>
                <Ionicons name="share-social" size={16} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </View>
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

  // ── Ask Me Anonymously Card ───────────────────────────────
  askCard: {
    borderRadius: 28,
    padding: spacing.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.25)',
    gap: spacing.md,
  },
  askBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  askBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(124,58,237,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  askBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: PURPLE,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  askLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: EMERALD,
  },
  askTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
    marginTop: 4,
  },
  askSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 20,
  },
  askPreviewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  askPreviewChip: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  askPreviewChipText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },
  askCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 20,
    overflow: 'hidden',
    paddingVertical: 14,
    marginTop: 4,
  },
  askCtaText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
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

