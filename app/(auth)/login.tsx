import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, StyleSheet, View, ScrollView, Pressable } from 'react-native';
import Animated, { FadeIn, Easing } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { Input } from '@/components/ui/Input';
import { Text, Heading } from '@/components/ui/Text';
import { Routes } from '@/constants/routes';
import { loginSchema, type LoginFormData } from '@/features/auth/validation';
import { useSendOtp } from '@/hooks/useAuth';
import { spacing } from '@/theme/spacing';
import { colors } from '@/theme/colors';
import { getApiErrorMessage } from '@/api/client';

export default function LoginScreen() {
  const router = useRouter();
  const sendOtp = useSendOtp();
  const fastEase = Easing.out(Easing.quad);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      await sendOtp.mutateAsync({ email: data.identifier, password: data.password } as any);
      router.push({ pathname: Routes.auth.verifyOtp, params: { email: data.identifier } });
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
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn.duration(400).easing(fastEase)}>
            <Heading level={2} style={styles.title}>Log in</Heading>
            <Text variant="bodySmall" style={styles.subtitle}>
              Secure sign in. We'll verify your credentials.
            </Text>
          </Animated.View>
          
          <Animated.View entering={FadeIn.duration(400).easing(fastEase).delay(100)} style={styles.form}>
            <Controller
              control={control}
              name="identifier"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email or Username"
                  placeholder="you@example.com or username"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.identifier?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="Enter your password"
                  secureTextEntryToggle
                  secureTextEntry
                  autoCapitalize="none"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                />
              )}
            />

            {sendOtp.isError ? (
              <Text variant="caption" style={styles.error}>
                {getApiErrorMessage(sendOtp.error)}
              </Text>
            ) : null}
            <Text variant="caption" style={styles.microcopy}>
              Your information is secure and never shared with other users.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeIn.duration(400).easing(fastEase).delay(200)} style={styles.footer}>
            <Button
              title="Log In"
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
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['4xl'],
  },
  header: {
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

  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.foregroundSecondary,
    marginBottom: spacing['2xl'],
  },
  form: {
    gap: spacing.sm,
  },
  error: {
    color: colors.danger,
    marginTop: spacing.xs,
  },
  microcopy: {
    color: colors.foregroundMuted,
    marginTop: spacing.md,
    lineHeight: 18,
  },
  footer: {
    marginTop: spacing['3xl'],
  },
});
