import { Redirect, Stack } from 'expo-router';

import { Routes } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { colors } from '@/theme/colors';

export default function AppLayout() {
  const { isAuthenticated, isOnboarded } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href={Routes.auth.welcome} />;
  }

  if (!isOnboarded) {
    return <Redirect href={Routes.onboarding.avatarMood} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="chat/[id]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="voice-room/[id]" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      <Stack.Screen name="moderation" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
