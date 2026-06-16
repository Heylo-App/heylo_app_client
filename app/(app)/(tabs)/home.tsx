import { StyleSheet, View, SafeAreaView, ScrollView } from 'react-native';
import Animated, { FadeIn, Easing } from 'react-native-reanimated';

import { Text, Heading } from '@/components/ui/Text';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { useAuthStore } from '@/store/auth.store';
import { spacing, borderRadius } from '@/theme/spacing';
import { colors } from '@/theme/colors';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const fastEase = Easing.out(Easing.quad);

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeIn.duration(400).easing(fastEase)} style={styles.header}>
            <Heading level={2} style={styles.title}>
              Welcome, {user?.alias || 'Traveler'}.
            </Heading>
            <Text variant="bodySmall" style={styles.subtitle}>
              Your fully private space for authentic connection.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeIn.duration(400).easing(fastEase).delay(100)} style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Ionicons name="people-outline" size={24} color={colors.primaryLight} />
              <Text style={styles.statValue}>1,204</Text>
              <Text style={styles.statLabel}>Online Now</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="shield-checkmark-outline" size={24} color={colors.primaryLight} />
              <Text style={styles.statValue}>100%</Text>
              <Text style={styles.statLabel}>Anonymous</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeIn.duration(400).easing(fastEase).delay(200)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="eye-off-outline" size={20} color={colors.foreground} />
              <Heading level={3} style={styles.cardTitle}>Zero Data. Pure Privacy.</Heading>
            </View>
            <Text style={styles.cardText}>
              Heylo is built differently. We do not track you, we do not store your chat history, and we do not sell your data. Every connection is ephemeral, end-to-end encrypted, and completely anonymous.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeIn.duration(400).easing(fastEase).delay(300)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="heart-half-outline" size={20} color={colors.foreground} />
              <Heading level={3} style={styles.cardTitle}>How It Works</Heading>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>1.</Text>
              <Text style={styles.cardText}>Set your temporary alias and current mood.</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>2.</Text>
              <Text style={styles.cardText}>Find someone who matches your vibe.</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>3.</Text>
              <Text style={styles.cardText}>Chat safely. When you disconnect, the chat is gone forever.</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.xl,
    paddingBottom: spacing['4xl'],
    gap: spacing['2xl'],
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: colors.foregroundSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.foreground,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.foregroundMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
  },
  cardText: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.foregroundSecondary,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  bullet: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.primaryLight,
    fontWeight: '700',
  },
});
