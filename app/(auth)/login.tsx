import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Input } from '@/components/ui/Input';
import { Text, Heading } from '@/components/ui/Text';
import { Routes } from '@/constants/routes';
import { loginSchema, type LoginFormData } from '@/features/auth/validation';
import { useAuthStore } from '@/store/auth.store';
import { spacing } from '@/theme/spacing';
import { colors } from '@/theme/colors';

const PINK = '#FF2D55';

export default function LoginScreen() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const onSubmit = handleSubmit((data) => {
    // Demo mode: mock user as already onboarded, no API call
    setUser({
      id: 'demo-user-' + Date.now(),
      alias: data.identifier.split('@')[0],
      avatarId: 'avatar_1',
      mood: 'chill',
      needs: [],
      reputation: 0,
      createdAt: new Date().toISOString(),
      isOnboarded: true,
    });
    router.replace(Routes.app.home);
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
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            <Animated.View entering={FadeIn.duration(600)}>
              <Text style={styles.logo}>heylo.</Text>
              <Heading level={1} style={styles.title}>Welcome Back</Heading>
              <Text style={styles.subtitle}>
                Sign in to continue your anonymous journey.
              </Text>
            </Animated.View>

            {/* Form */}
            <Animated.View entering={FadeInDown.duration(500).delay(150)} style={styles.form}>
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

              {/* No error box needed in demo mode */}
            </Animated.View>

            {/* Footer */}
            <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.footer}>
              <View style={styles.securityPill}>
                <Ionicons name="lock-closed" size={14} color="#10B981" />
                <Text style={styles.securityText}>Your data is encrypted and never shared</Text>
              </View>

              <Pressable style={styles.submitBtn} onPress={onSubmit}>
                <LinearGradient colors={[PINK, '#E11D48']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                <>
                  <Text style={styles.submitBtnText}>Log In</Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </>
              </Pressable>

              <Pressable onPress={() => router.push(Routes.auth.register)}>
                <Text style={styles.switchText}>
                  Don't have an account? <Text style={styles.linkText}>Create one</Text>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['4xl'],
  },
  logo: {
    fontSize: 28,
    fontWeight: '800',
    color: PINK,
    letterSpacing: -1,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
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
  securityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  securityText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
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
