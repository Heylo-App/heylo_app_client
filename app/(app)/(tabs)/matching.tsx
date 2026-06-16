import { useState } from 'react';
import { StyleSheet, View, SafeAreaView, ScrollView } from 'react-native';
import Animated, { FadeIn, Easing } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { MoodChip } from '@/components/ui/MoodChip';
import { Text, Heading } from '@/components/ui/Text';
import { MOOD_OPTIONS } from '@/constants/moods';
import { spacing, borderRadius } from '@/theme/spacing';
import { colors } from '@/theme/colors';
import { Ionicons } from '@expo/vector-icons';

export default function MatchingScreen() {
  const [targetMood, setTargetMood] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const fastEase = Easing.out(Easing.quad);

  const handleStartSearch = () => {
    setIsSearching(true);
    // Mock search delay
    setTimeout(() => {
      setIsSearching(false);
      alert('Match found! Initiating secure, anonymous connection...');
    }, 2000);
  };

  return (
    <GradientBackground mood={targetMood as any ?? undefined}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeIn.duration(400).easing(fastEase)} style={styles.header}>
            <Heading level={2} style={styles.title}>Find a Connection</Heading>
            <Text variant="bodySmall" style={styles.subtitle}>
              Match instantly based on how you feel. No profiles, no history, just real-time anonymous conversation.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeIn.duration(400).easing(fastEase).delay(100)} style={styles.section}>
            <Text style={styles.sectionLabel}>THEIR VIBE</Text>
            <View style={styles.chips}>
              {MOOD_OPTIONS.map((option) => (
                <MoodChip
                  key={option.id}
                  mood={option}
                  selected={targetMood === option.id}
                  onPress={setTargetMood}
                />
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeIn.duration(400).easing(fastEase).delay(200)} style={styles.infoBox}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.primaryLight} />
            <Text style={styles.infoText}>
              Your chats are end-to-end encrypted and instantly deleted when the session ends.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeIn.duration(400).easing(fastEase).delay(300)} style={styles.actionContainer}>
            <Text style={styles.helperText}>
              {targetMood 
                ? "Searching securely for someone matching this mood."
                : "Select a vibe to begin your private session."}
            </Text>
            <Button
              title={isSearching ? "Establishing Secure Link..." : "Start Finding Match"}
              loading={isSearching}
              disabled={!targetMood}
              onPress={handleStartSearch}
              size="lg"
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
    paddingTop: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  header: {
    marginBottom: spacing['3xl'],
    gap: spacing.xs,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
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
    marginBottom: spacing.lg,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    gap: spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: colors.primaryLight,
  },
  actionContainer: {
    marginTop: 'auto',
    gap: spacing.lg,
    paddingTop: spacing['3xl'],
  },
  helperText: {
    textAlign: 'center',
    color: colors.foregroundMuted,
    fontSize: 14,
  },
});
