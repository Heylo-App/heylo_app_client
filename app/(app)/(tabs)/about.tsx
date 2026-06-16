import { StyleSheet, View, SafeAreaView, ScrollView } from 'react-native';
import Animated, { FadeIn, Easing } from 'react-native-reanimated';

import { Avatar } from '@/components/ui/Avatar';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { Text, Heading } from '@/components/ui/Text';
import { useAuthStore } from '@/store/auth.store';
import { useLogout } from '@/hooks/useAuth';
import { spacing, borderRadius } from '@/theme/spacing';
import { colors } from '@/theme/colors';
import { Button } from '@/components/ui/Button';
import { Ionicons } from '@expo/vector-icons';

export default function AboutScreen() {
  const { user } = useAuthStore();
  const logout = useLogout();
  const fastEase = Easing.out(Easing.quad);

  if (!user) return null;

  return (
    <GradientBackground mood={user.mood ?? undefined}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeIn.duration(400).easing(fastEase)} style={styles.profileHeader}>
            <View style={styles.avatarWrapper}>
              <Avatar avatarId={user.avatarId} alias={user.alias} size={100} />
            </View>
            <Heading level={2} style={styles.alias}>{user.alias}</Heading>
            <Text style={styles.joinDate}>Current Session Identity</Text>
          </Animated.View>

          <Animated.View entering={FadeIn.duration(400).easing(fastEase).delay(100)} style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primaryLight} />
            <Text style={styles.infoText}>
              This data is stored locally on your device to help pair you with compatible connections. We do not store your profile on our servers.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeIn.duration(400).easing(fastEase).delay(200)} style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Current Mood</Text>
              <Text style={styles.detailValue}>{user.mood || 'Not set'}</Text>
            </View>
            <View style={styles.divider} />
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Language</Text>
              <Text style={styles.detailValue}>{user.language || 'Any'}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Age</Text>
              <Text style={styles.detailValue}>{user.age ? `${user.age} yrs` : 'Not specified'}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Session Trust Score</Text>
              <Text style={[styles.detailValue, { color: colors.primaryLight }]}>{user.reputation || 0}</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeIn.duration(400).easing(fastEase).delay(300)} style={styles.actionContainer}>
            <Text style={styles.logoutDisclaimer}>
              Ending your session will destroy your current alias and disconnect you completely.
            </Text>
            <Button
              title="End Session & Log Out"
              variant="danger"
              onPress={() => logout.mutate()}
            />
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
    flexGrow: 1,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing['3xl'],
    paddingBottom: spacing['4xl'],
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  avatarWrapper: {
    marginBottom: spacing.lg,
    padding: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.border,
  },
  alias: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  joinDate: {
    fontSize: 14,
    color: colors.primaryLight,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: colors.foregroundSecondary,
  },
  detailsCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xl,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foregroundSecondary,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.foreground,
    textTransform: 'capitalize',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  actionContainer: {
    marginTop: spacing['3xl'],
    gap: spacing.md,
  },
  logoutDisclaimer: {
    textAlign: 'center',
    color: colors.foregroundMuted,
    fontSize: 13,
    paddingHorizontal: spacing.md,
  },
});
