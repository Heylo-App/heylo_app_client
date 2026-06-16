import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View, KeyboardAvoidingView, Platform, SafeAreaView, Pressable } from 'react-native';
import Animated, { FadeIn, Easing } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { Input } from '@/components/ui/Input';
import { Text, Heading } from '@/components/ui/Text';
import { otpSchema, type OtpFormData } from '@/features/auth/validation';
import { useVerifyOtp } from '@/hooks/useAuth';
import { spacing } from '@/theme/spacing';
import { colors } from '@/theme/colors';
import { getApiErrorMessage } from '@/api/client';

export default function VerifyOtpScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const verifyOtp = useVerifyOtp();
  const router = useRouter();
  const fastEase = Easing.out(Easing.quad);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  const onSubmit = handleSubmit(async (data) => {
    await verifyOtp.mutateAsync({ email: email ?? '', otp: data.otp });
  });

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.headerBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          <Animated.View entering={FadeIn.duration(400).easing(fastEase)}>
            <Heading level={2} style={styles.title}>Enter security code</Heading>
            <Text variant="bodySmall" style={styles.subtitle}>
              We sent a 6-digit code to <Text style={styles.highlight}>{email}</Text>.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeIn.duration(400).easing(fastEase).delay(100)} style={styles.form}>
            <Controller
              control={control}
              name="otp"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="6-digit code"
                  placeholder="000000"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.otp?.message}
                  style={styles.input}
                />
              )}
            />
            {verifyOtp.isError ? (
              <Text variant="caption" style={styles.error}>
                {getApiErrorMessage(verifyOtp.error)}
              </Text>
            ) : null}
            <Text style={styles.mockNote}>
              Developer mode: Any 6 digits will work.
            </Text>
          </Animated.View>
        </View>

        <Animated.View entering={FadeIn.duration(400).easing(fastEase).delay(200)} style={styles.footer}>
          <Button title="Verify Code" loading={verifyOtp.isPending} onPress={onSubmit} />
        </Animated.View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['4xl'],
  },
  headerBar: {
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
  content: {
    flex: 1,
    paddingTop: spacing.xl,
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
    marginBottom: spacing['3xl'],
  },
  highlight: {
    color: colors.foreground,
    fontWeight: '600',
  },
  form: {
    gap: spacing.sm,
  },
  input: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 4,
    fontWeight: '600',
  },
  error: {
    color: colors.danger,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  mockNote: {
    color: colors.foregroundMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  footer: {
    paddingTop: spacing.xl,
  },
});
