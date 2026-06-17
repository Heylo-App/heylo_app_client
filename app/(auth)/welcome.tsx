import { useEffect } from 'react';
import { StyleSheet, View, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, Easing, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Text, Heading } from '@/components/ui/Text';
import { Routes } from '@/constants/routes';
import { spacing } from '@/theme/spacing';
import { colors } from '@/theme/colors';

const { width } = Dimensions.get('window');
const PINK = '#FF2D55';
const PURPLE = '#7C3AED';
const BLUE = '#3B82F6';
const EMERALD = '#10B981';

const FloatingBadge = ({ icon, color, style, delay }: { icon: any; color: string; style: any; delay: number }) => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2000 + delay, easing: Easing.inOut(Easing.ease) }),
        withTiming(8, { duration: 2000 + delay, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true
    );
  }, []);

  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  return (
    <Animated.View style={[styles.badge, style, anim]}>
      <View style={[styles.badgeInner, { backgroundColor: color }]}>
        <Ionicons name={icon} size={22} color="white" />
      </View>
    </Animated.View>
  );
};

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.mainContainer}>
      <LinearGradient colors={['#18181B', '#000000']} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>

          {/* ── Hero Area ───────────────────────────────────── */}
          <View style={styles.heroArea}>
            <Animated.View entering={FadeIn.duration(800)} style={styles.logoRow}>
              <Text style={styles.logo}>heylo.</Text>
            </Animated.View>

            {/* Floating illustration area */}
            <View style={styles.illustrationArea}>
              {/* Gradient cards like matching screen */}
              <Animated.View entering={FadeIn.duration(800).delay(200)} style={[styles.card, styles.leftCard]}>
                <LinearGradient colors={['#0EA5E9', '#A855F7']} style={styles.cardGradient} />
              </Animated.View>
              <Animated.View entering={FadeIn.duration(800).delay(300)} style={[styles.card, styles.rightCard]}>
                <LinearGradient colors={[PINK, '#E11D48']} style={styles.cardGradient} />
              </Animated.View>

              {/* Floating badges */}
              <FloatingBadge icon="heart" color={PINK} style={{ top: '5%', right: '25%' }} delay={0} />
              <FloatingBadge icon="chatbubble-ellipses" color={PURPLE} style={{ bottom: '20%', left: '5%' }} delay={500} />
              <FloatingBadge icon="shield-checkmark" color={EMERALD} style={{ bottom: '10%', right: '10%' }} delay={1000} />
            </View>

            {/* Title area */}
            <Animated.View entering={FadeInDown.duration(600).delay(400)}>
              <Heading level={1} style={styles.title}>
                Authentic expression,{'\n'}zero judgment.
              </Heading>
              <Text style={styles.subtitle}>
                Connect based on how you feel. Chat safely with real people, anonymously.
              </Text>
            </Animated.View>

            {/* Feature pills */}
            <Animated.View entering={FadeInDown.duration(500).delay(500)} style={styles.featurePills}>
              <View style={styles.pill}>
                <Ionicons name="lock-closed" size={14} color={EMERALD} />
                <Text style={styles.pillText}>End-to-End Encrypted</Text>
              </View>
              <View style={styles.pill}>
                <Ionicons name="eye-off" size={14} color={PURPLE} />
                <Text style={styles.pillText}>100% Anonymous</Text>
              </View>
              <View style={styles.pill}>
                <Ionicons name="flash" size={14} color={PINK} />
                <Text style={styles.pillText}>Instant Matching</Text>
              </View>
            </Animated.View>
          </View>

          {/* ── Bottom Actions ──────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(500).delay(600)} style={styles.actions}>
            <Pressable style={styles.primaryBtn} onPress={() => router.push(Routes.auth.register)}>
              <LinearGradient colors={[PINK, '#E11D48']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              <Ionicons name="heart-outline" size={20} color="white" />
              <Text style={styles.primaryBtnText}>Create Account</Text>
            </Pressable>

            <Pressable style={styles.secondaryBtn} onPress={() => router.push(Routes.auth.login)}>
              <Text style={styles.secondaryBtnText}>Already have an account? <Text style={styles.linkText}>Log In</Text></Text>
            </Pressable>

            <Text style={styles.tos}>
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </Text>
          </Animated.View>

        </View>
      </SafeAreaView>
    </View>
  );
}

const CARD_W = width * 0.4;
const CARD_H = CARD_W * 1.25;

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['2xl'],
    justifyContent: 'space-between',
  },

  // ── Hero ──────────────────────────────────────────────
  heroArea: { flex: 1 },
  logoRow: { marginTop: spacing['2xl'] },
  logo: {
    fontSize: 28,
    fontWeight: '800',
    color: PINK,
    letterSpacing: -1,
  },
  illustrationArea: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  card: {
    position: 'absolute',
    width: CARD_W,
    height: CARD_H,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  cardGradient: { flex: 1 },
  leftCard: { left: '8%', transform: [{ rotate: '-12deg' }], zIndex: 1 },
  rightCard: { right: '8%', transform: [{ rotate: '10deg' }], zIndex: 2, marginTop: 30 },

  badge: { position: 'absolute', zIndex: 10 },
  badgeInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },

  title: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.white,
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.6)',
    marginTop: spacing.md,
  },

  // ── Feature pills ─────────────────────────────────────
  featurePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },

  // ── Actions ───────────────────────────────────────────
  actions: { gap: spacing.lg },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  primaryBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  secondaryBtnText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
  },
  linkText: {
    color: PINK,
    fontWeight: '700',
  },
  tos: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.25)',
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: spacing.xl,
  },
});

