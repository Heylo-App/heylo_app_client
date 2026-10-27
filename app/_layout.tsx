import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Alert, DeviceEventEmitter } from 'react-native';

import { AppProviders } from '@/components/providers/AppProviders';
import { useAuthStore } from '@/store/auth.store';
import { colors } from '@/theme/colors';

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const reset = useAuthStore((s) => s.reset);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Listen for session expiry events from the API client interceptor
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      'session:expired',
      (event?: { message?: string }) => {
        console.log('[RootLayout] Session expired — resetting auth state');
        reset();
        const message = event?.message || 'Your session has expired. Please log in again.';
        Alert.alert('Session Notice', message);
      },
    );
    return () => sub.remove();
  }, [reset]);

  return (
    <AppProviders>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      />
    </AppProviders>
  );
}
