import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, Pressable } from 'react-native';
import Animated, { FadeIn, Easing } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { Input } from '@/components/ui/Input';
import { Text, Heading } from '@/components/ui/Text';
import { Routes } from '@/constants/routes';
import { profileDetailsSchema, type ProfileDetailsFormData } from '@/features/auth/validation';
import { useOnboardingStore } from '@/store/onboarding.store';
import { spacing } from '@/theme/spacing';
import { colors } from '@/theme/colors';

export default function ProfileDetailsScreen() {
  const router = useRouter();
  const setProfileDetails = useOnboardingStore((s) => s.setProfileDetails);
  const fastEase = Easing.out(Easing.quad);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileDetailsFormData>({
    resolver: zodResolver(profileDetailsSchema),
    defaultValues: {
      username: '',
      alias: '',
      language: '',
      age: '',
    },
  });

  const onSubmit = handleSubmit((data) => {
    setProfileDetails({
      username: data.username,
      alias: data.alias,
      language: data.language,
      age: data.age,
    });
    router.push(Routes.onboarding.avatarMood);
  });

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn.duration(400).easing(fastEase)} style={styles.header}>
            <Heading level={2} style={styles.title}>Your Identity</Heading>
            <Text variant="bodySmall" style={styles.subtitle}>
              Set up your anonymous identity.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeIn.duration(400).easing(fastEase).delay(100)} style={styles.fields}>
            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, onBlur, value } }) => (
                <View>
                  <Input
                    label="Username"
                    placeholder="e.g. user_123"
                    autoCapitalize="none"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.username?.message}
                  />
                  <Text style={styles.fieldNote}>Used for uniquely identifying you.</Text>
                </View>
              )}
            />

            <Controller
              control={control}
              name="alias"
              render={({ field: { onChange, onBlur, value } }) => (
                <View>
                  <Input
                    label="Anonymous Alias"
                    placeholder="e.g. QuietRiver"
                    autoCapitalize="none"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.alias?.message}
                  />
                  <Text style={styles.fieldNote}>This is how others will see you.</Text>
                </View>
              )}
            />

            <Controller
              control={control}
              name="language"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Language Preference"
                  placeholder="e.g. English"
                  autoCapitalize="words"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.language?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="age"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Age"
                  placeholder="e.g. 21"
                  keyboardType="number-pad"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.age?.message}
                />
              )}
            />
          </Animated.View>

          <Animated.View entering={FadeIn.duration(400).easing(fastEase).delay(200)} style={styles.submitContainer}>
            <Button 
              title="Continue" 
              onPress={onSubmit} 
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing['4xl'],
    paddingBottom: spacing['4xl'],
  },
  header: {
    gap: spacing.xs,
    marginBottom: spacing['2xl'],
    paddingTop: spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    lineHeight: 24,
    fontSize: 16,
    color: colors.foregroundSecondary,
  },
  fields: {
    gap: spacing.xl,
  },
  fieldNote: {
    color: colors.foregroundMuted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  submitContainer: {
    marginTop: spacing['3xl'],
    gap: spacing.lg,
  },
});
