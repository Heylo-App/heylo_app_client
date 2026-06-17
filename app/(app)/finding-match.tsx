import { useEffect } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
  withDelay,
} from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Avatar } from '@/components/ui/Avatar';

import { Text, Heading } from '@/components/ui/Text';
import { useAuthSession } from '@/hooks/useAuth';
import { Routes } from '@/constants/routes';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

const Wave = ({ delay }: { delay: number }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, {
          duration: 3000,
          easing: Easing.out(Easing.ease),
        }),
        -1, // Infinite repeat
        false // Do not reverse
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: interpolate(progress.value, [0, 1], [1, 4]) }],
      opacity: interpolate(progress.value, [0, 0.8, 1], [0.8, 0, 0]),
    };
  });

  return <Animated.View style={[styles.wave, animatedStyle]} />;
};

export default function FindingMatchScreen() {
  const router = useRouter();
  const { mood } = useLocalSearchParams<{ mood: string }>();
  const { user } = useAuthSession();

  useEffect(() => {
    const timer = setTimeout(() => {
      // Navigate to the chat screen with a dummy ID
      router.replace({ pathname: Routes.app.chat as any, params: { id: 'chat-mock-123' } });
    }, 4000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.mainContainer}>
      <LinearGradient
        colors={['#18181B', '#000000']}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.cancelBtn}>
            <Ionicons name="close" size={28} color="white" />
          </Pressable>
        </View>

        <View style={styles.container}>
          <View style={styles.radarContainer}>
            <Wave delay={0} />
            <Wave delay={1000} />
            <Wave delay={2000} />
            <View style={styles.avatarWrapper}>
              <Avatar
                avatarId={user?.avatarId || 'avatar-1'}
                alias={user?.alias || 'You'}
                size={96}
              />
            </View>
          </View>

          <View style={styles.textContainer}>
            <Heading level={2} style={styles.title}>Finding connection...</Heading>
            <Text style={styles.subtitle}>
              Searching for someone with a matching vibe.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
    alignItems: 'flex-end',
  },
  cancelBtn: {
    padding: spacing.xs,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  radarContainer: {
    width: 96,
    height: 96,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing['4xl'],
  },
  avatarWrapper: {
    zIndex: 10,
    backgroundColor: colors.background,
    borderRadius: 48,
    padding: 4,
  },
  wave: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 45, 85, 0.4)', // Pink tint matching the new PINK_ACCENT
    zIndex: 1,
  },
  textContainer: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
});
