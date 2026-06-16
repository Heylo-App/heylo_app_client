import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, SafeAreaView, Pressable } from 'react-native';
import Animated, { FadeIn, Easing } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { Input } from '@/components/ui/Input';
import { Text, Heading } from '@/components/ui/Text';
import { Routes } from '@/constants/routes';
import { registerSchema, type RegisterFormData } from '@/features/auth/validation';
import { useSendOtp } from '@/hooks/useAuth';
import { spacing } from '@/theme/spacing';
import { colors } from '@/theme/colors';
import { getApiErrorMessage } from '@/api/client';

export default function RegisterScreen() {
  const router = useRouter();
  const sendOtp = useSendOtp();
  const fastEase = Easing.out(Easing.quad);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      // NOTE: backend currently doesn't accept password in /auth/otp/send or might need to be updated.
      // But we proceed as requested for the UI flow.
      await sendOtp.mutateAsync({ email: data.email });
      router.push({ pathname: Routes.auth.verifyOtp, params: { email: data.email } });
    } catch (error) {
      console.error(getApiErrorMessage(error));
    }
  });

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.headerBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn.duration(400).easing(fastEase)} style={styles.header}>
            <Heading level={2} style={styles.title}>Join heylo</Heading>
            <Text variant="bodySmall" style={styles.subtitle}>
              Set up your anonymous identity to connect with others.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeIn.duration(400).easing(fastEase).delay(100)} style={styles.fields}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View>
                  <Input
                    label="Email address"
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.email?.message}
                  />
                  <Text style={styles.fieldNote}>Never shared publicly.</Text>
                </View>
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="At least 8 characters"
                  secureTextEntry
                  autoCapitalize="none"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirm Password"
                  placeholder="Re-enter your password"
                  secureTextEntry
                  autoCapitalize="none"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                />
              )}
            />

            {sendOtp.isError ? (
              <Text variant="caption" style={styles.error}>
                {getApiErrorMessage(sendOtp.error)}
              </Text>
            ) : null}
          </Animated.View>

          <Animated.View entering={FadeIn.duration(400).easing(fastEase).delay(200)} style={styles.submitContainer}>
            <Text style={styles.termsText}>
              By registering, you agree to our Terms of Service and Privacy Policy.
            </Text>
            <Button 
              title="Continue" 
              loading={sendOtp.isPending} 
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
  headerBar: {
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.lg,
  },
  backBtn: {
    paddingVertical: spacing.sm,
  },
  backText: {
    color: colors.foregroundSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing['2xl'],
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
  error: {
    color: colors.danger,
    marginTop: spacing.sm,
  },
  submitContainer: {
    marginTop: spacing['3xl'],
    gap: spacing.lg,
  },
  termsText: {
    color: colors.foregroundMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
