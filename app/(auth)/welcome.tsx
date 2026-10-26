import { useEffect } from 'react';
import { StyleSheet, View, Pressable, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInDown,
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Text, Heading } from '@/components/ui/Text';
import { Routes } from '@/constants/routes';
import { spacing } from '@/theme/spacing';
import { colors } from '@/theme/colors';

const { width } = Dimensions.get('window');
const EMERALD = '#10B981';

const FloatingBadge = ({
  icon,
  color,
  style,
  delay,
}: {
  icon: any;
  color: string;
  style: any;
  delay: number;
}) => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2000 + delay, easing: Easing.inOut(Easing.ease) }),
        withTiming(8, { duration: 2000 + delay, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [delay, translateY]);

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
              {/* Center Logo with subtle ambient glow */}
              <Animated.View
                entering={FadeInDown.duration(800).delay(200)}
                style={styles.logoContainer}
              >
                <View style={styles.logoGlow} />
                <Image
                  source={require('@/assets/heylo-logo.png')}
                  style={styles.mainLogo}
                  resizeMode="contain"
                />
              </Animated.View>

              {/* Floating badges */}
              <FloatingBadge
                icon="heart"
                color={colors.primary}
                style={{ top: '6%', right: '18%' }}
                delay={0}
              />
              <FloatingBadge
                icon="chatbubble-ellipses"
                color={colors.primary}
                style={{ bottom: '16%', left: '10%' }}
                delay={500}
              />
              <FloatingBadge
                icon="shield-checkmark"
                color={EMERALD}
                style={{ bottom: '8%', right: '14%' }}
                delay={1000}
              />
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
          </View>

          {/* ── Bottom Actions ──────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(500).delay(600)} style={styles.actions}>
            <Pressable style={styles.primaryBtn} onPress={() => router.push(Routes.auth.register)}>
              <LinearGradient
                colors={colors.primaryGradient}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              <Ionicons name="heart-outline" size={20} color="white" />
              <Text style={styles.primaryBtnText}>Create Account</Text>
            </Pressable>

            <Pressable style={styles.secondaryBtn} onPress={() => router.push(Routes.auth.login)}>
              <Text style={styles.secondaryBtnText}>
                Already have an account? <Text style={styles.linkText}>Log In</Text>
              </Text>
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

const LOGO_SIZE = Math.min(width * 0.48, 190);

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
    color: colors.primary,
    letterSpacing: -1,
  },
  illustrationArea: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  logoContainer: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
  },
  logoGlow: {
    position: 'absolute',
    width: LOGO_SIZE * 0.85,
    height: LOGO_SIZE * 0.85,
    borderRadius: (LOGO_SIZE * 0.85) / 2,
    backgroundColor: colors.primary,
    opacity: 0.35,
    transform: [{ scale: 1.15 }],
  },
  mainLogo: {
    width: '100%',
    height: '100%',
  },

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
    color: colors.primary,
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
