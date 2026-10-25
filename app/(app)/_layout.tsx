import { useEffect } from 'react';
import { Redirect, Stack, useRouter } from 'expo-router';

import { Routes } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { useConnectionStore } from '@/store/connection.store';
import { colors } from '@/theme/colors';
import { socketService } from '@/services/socket.service';
import { IncomingRequestModal } from '@/components/connection/IncomingRequestModal';

export default function AppLayout() {
  const router = useRouter();
  const { isAuthenticated, isOnboarded, token, user } = useAuthStore();
  const addRequest = useConnectionStore((s) => s.addRequest);
  const removeRequest = useConnectionStore((s) => s.removeRequest);

  const userId = user?.id || (user as any)?._id;

  // Connect socket globally when authenticated
  useEffect(() => {
    if (isAuthenticated && userId) {
      socketService.connect(token || undefined, userId);
      socketService.registerUser(userId);
    }
  }, [isAuthenticated, token, userId]);

  // Global listeners for connect requests & accept navigation
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubReq = socketService.onReceiveConnectRequest((req) => {
      console.log('[AppLayout] Received connect request:', req);
      addRequest(req);
    });

    const unsubCancel = socketService.onConnectRequestCancelled(({ requestId }) => {
      console.log('[AppLayout] Connect request cancelled:', requestId);
      if (requestId) {
        removeRequest(requestId);
      }
    });

    const unsubAccept = socketService.onConnectRequestAccepted(({ chatId, requestId }) => {
      console.log('[AppLayout] Connect request accepted! ChatId:', chatId);
      if (requestId) {
        removeRequest(requestId);
      }
      router.push(`/(app)/chat/${chatId}`);
    });

    return () => {
      unsubReq();
      unsubCancel();
      unsubAccept();
    };
  }, [isAuthenticated, addRequest, removeRequest, router]);

  if (!isAuthenticated) {
    return <Redirect href={Routes.auth.welcome} />;
  }

  if (!isOnboarded) {
    return <Redirect href={Routes.onboarding.avatarMood} />;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="my-moments" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="chat/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="groups/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="groups/info/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="groups/requests" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="groups/invite/[code]" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="feedbacks" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="users/[id]" options={{ animation: 'slide_from_right' }} />
      </Stack>
      <IncomingRequestModal />
    </>
  );
}
