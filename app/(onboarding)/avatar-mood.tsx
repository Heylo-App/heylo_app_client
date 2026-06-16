import { FlatList, Pressable, ScrollView, StyleSheet, View, SafeAreaView } from 'react-native';
import Animated, { FadeIn, Easing } from 'react-native-reanimated';

import { AVATAR_OPTIONS, Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { MoodChip } from '@/components/ui/MoodChip';
import { Text, Heading } from '@/components/ui/Text';
import { MOOD_OPTIONS } from '@/constants/moods';
import { useCompleteOnboarding } from '@/hooks/useAuth';
import { useOnboardingStore } from '@/store/onboarding.store';
import { colors } from '@/theme/colors';
import { spacing, borderRadius } from '@/theme/spacing';

export default function AvatarMoodScreen() {
  const { username, alias, avatarId, mood, language, age, setAvatarId, setMood } = useOnboardingStore();
  const completeOnboarding = useCompleteOnboarding();
  const fastEase = Easing.out(Easing.quad);

  const displayAlias = alias || 'You';

  const handleFinish = () => {
    if (!mood) return;
    completeOnboarding.mutate({
      username,
      alias,
      avatarId,
      mood,
      language,
      age,
    });
  };

  return (
    <GradientBackground mood={mood ?? undefined}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(400).easing(fastEase)} style={styles.header}>
          <Heading level={2} style={styles.title}>Complete Profile</Heading>
          <Text variant="bodySmall" style={styles.subtitle}>
            Select your avatar and current mood. This helps us find the best connections for you.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeIn.duration(400).easing(fastEase).delay(100)} style={styles.section}>
          <Text style={styles.sectionLabel}>AVATAR</Text>
          <View style={styles.sectionContent}>
            <FlatList
              data={AVATAR_OPTIONS}
              numColumns={3}
              scrollEnabled={false}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.grid}
              columnWrapperStyle={styles.row}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => setAvatarId(item)}
                  style={[styles.avatarItem, avatarId === item && styles.avatarSelected]}
                >
                  <Avatar avatarId={item} alias={displayAlias} size={72} />
                </Pressable>
              )}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.duration(400).easing(fastEase).delay(200)} style={styles.section}>
          <Text style={styles.sectionLabel}>CURRENT MOOD</Text>
          <View style={[styles.sectionContent, styles.chips]}>
            {MOOD_OPTIONS.map((option) => (
              <MoodChip
                key={option.id}
                mood={option}
                selected={mood === option.id}
                onPress={setMood}
              />
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.duration(400).easing(fastEase).delay(300)} style={styles.submitContainer}>
          <Button
            title="Complete Setup"
            loading={completeOnboarding.isPending}
            disabled={!mood}
            onPress={handleFinish}
          />
        </Animated.View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  header: {
    marginBottom: spacing['2xl'],
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.foregroundSecondary,
  },
  section: {
    marginBottom: spacing['2xl'],
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.foregroundMuted,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  sectionContent: {
    paddingTop: spacing.xs,
  },
  grid: {
    paddingVertical: spacing.xs,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  avatarItem: {
    padding: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarSelected: {
    borderColor: colors.white,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  submitContainer: {
    marginTop: 'auto',
    paddingTop: spacing.xl,
  },
});
