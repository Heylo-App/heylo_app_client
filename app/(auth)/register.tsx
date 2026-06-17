import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Input } from '@/components/ui/Input';
import { Text, Heading } from '@/components/ui/Text';
import { Routes } from '@/constants/routes';
import { registerSchema, type RegisterFormData } from '@/features/auth/validation';
import { useSendOtp } from '@/hooks/useAuth';
import { spacing } from '@/theme/spacing';
import { colors } from '@/theme/colors';
import { getApiErrorMessage } from '@/api/client';

const PINK = '#FF2D55';

export default function RegisterScreen() {
  const router = useRouter();
  const sendOtp = useSendOtp();

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
      await sendOtp.mutateAsync({ email: data.email });
      router.push({ pathname: Routes.auth.verifyOtp, params: { email: data.email } });
    } catch (error) {
      console.error(getApiErrorMessage(error));
    }
  });

  return (
    <View style={styles.mainContainer}>
      <LinearGradient colors={['#18181B', '#000000']} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>
            <View style={styles.stepIndicator}>
              <View style={[styles.stepDot, styles.stepDotActive]} />
              <View style={styles.stepDot} />
              <View style={styles.stepDot} />
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            <Animated.View entering={FadeIn.duration(600)}>
              <View style={styles.iconCircle}>
                <Ionicons name="person-add-outline" size={28} color={PINK} />
              </View>
              <Heading level={1} style={styles.title}>Create Account</Heading>
              <Text style={styles.subtitle}>
                Start your anonymous journey. Your identity stays yours.
              </Text>
            </Animated.View>

            {/* Form */}
            <Animated.View entering={FadeInDown.duration(500).delay(150)} style={styles.form}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View>
                    <Input
                      label="Email Address"
                      placeholder="you@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.email?.message}
                    />
                    <View style={styles.fieldHint}>
                      <Ionicons name="eye-off-outline" size={14} color="rgba(255,255,255,0.3)" />
                      <Text style={styles.fieldHintText}>Never shared publicly</Text>
                    </View>
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
                    secureTextEntryToggle
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
                    secureTextEntryToggle
                    autoCapitalize="none"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.confirmPassword?.message}
                  />
                )}
              />

              {sendOtp.isError ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color={PINK} />
                  <Text style={styles.errorText}>{getApiErrorMessage(sendOtp.error)}</Text>
                </View>
              ) : null}
            </Animated.View>

            {/* Footer */}
            <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.footer}>
              <Text style={styles.termsText}>
                By registering, you agree to our <Text style={styles.linkText}>Terms of Service</Text> and <Text style={styles.linkText}>Privacy Policy</Text>.
              </Text>

              <Pressable style={styles.submitBtn} onPress={onSubmit}>
                <LinearGradient colors={[PINK, '#E11D48']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                {sendOtp.isPending ? (
                  <Text style={styles.submitBtnText}>Creating...</Text>
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>Continue</Text>
                    <Ionicons name="arrow-forward" size={20} color="white" />
                  </>
                )}
              </Pressable>

              <Pressable onPress={() => router.push(Routes.auth.login)}>
                <Text style={styles.switchText}>
                  Already have an account? <Text style={styles.linkText}>Log In</Text>
                </Text>
              </Pressable>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stepDot: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  stepDotActive: {
    backgroundColor: PINK,
    width: 32,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['4xl'],
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,45,85,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.white,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: spacing['3xl'],
  },
  form: {
    gap: spacing.xl,
  },
  fieldHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  fieldHintText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,45,85,0.08)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,45,85,0.15)',
  },
  errorText: {
    color: PINK,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  footer: {
    marginTop: spacing['3xl'],
    gap: spacing.lg,
  },
  termsText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  submitBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  switchText: {
    textAlign: 'center',
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  linkText: {
    color: PINK,
    fontWeight: '700',
  },
});
