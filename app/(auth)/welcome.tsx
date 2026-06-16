import { useRouter } from 'expo-router';
import { StyleSheet, View, SafeAreaView } from 'react-native';
import Animated, { FadeIn, Easing } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { Text, Heading } from '@/components/ui/Text';
import { Routes } from '@/constants/routes';
import { spacing } from '@/theme/spacing';
import { colors } from '@/theme/colors';

export default function WelcomeScreen() {
  const router = useRouter();

  const fastEase = Easing.out(Easing.quad);

  return (
    <GradientBackground>
      <View style={styles.container}>
        <Animated.View 
          entering={FadeIn.duration(400).easing(fastEase)} 
          style={styles.hero}
        >
          <Text style={styles.logo}>heylo.</Text>
          <Heading level={1} style={styles.title}>
            Authentic expression,{'\n'}zero judgment.
          </Heading>
          <Text variant="bodySmall" muted style={styles.subtitle}>
            Connect based on how you feel. Join encrypted voice rooms and chat safely.
          </Text>

          <View style={styles.features}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>100% Anonymous Identity</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>End-to-End Encryption</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Real-time Voice & Chat</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View 
          entering={FadeIn.duration(400).easing(fastEase).delay(150)} 
          style={styles.actions}
        >
          <Button title="Create Account" onPress={() => router.push(Routes.auth.register)} />
          <Button
            title="Log In"
            variant="ghost"
            onPress={() => router.push(Routes.auth.login)}
          />
          <Text variant="caption" style={styles.tos}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </Animated.View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing['6xl'],
    paddingBottom: spacing['2xl'],
  },
  hero: {
    gap: spacing.lg,
  },
  logo: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.foreground,
    letterSpacing: -1,
  },
  title: {
    lineHeight: 44,
    fontSize: 38,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -1,
    marginTop: spacing.md,
  },
  subtitle: {
    maxWidth: 320,
    lineHeight: 24,
    fontSize: 16,
    color: colors.foregroundSecondary,
    marginBottom: spacing.xl,
  },
  features: {
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureIcon: {
    color: colors.primaryLight,
    fontWeight: '700',
    fontSize: 16,
  },
  featureText: {
    color: colors.foregroundSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  actions: {
    gap: spacing.sm,
  },
  tos: {
    textAlign: 'center',
    color: colors.foregroundMuted,
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    lineHeight: 18,
  },
});
