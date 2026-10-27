import { useEffect } from 'react';
import { Redirect, Stack, useRouter } from 'expo-router';

import { Routes } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { useConnectionStore } from '@/store/connection.store';
import { useActivityStore } from '@/store/activity.store';
import { colors } from '@/theme/colors';
import { socketService } from '@/services/socket.service';
import { IncomingRequestModal } from '@/components/connection/IncomingRequestModal';

export default function AppLayout() {
  const router = useRouter();
  const { isAuthenticated, isOnboarded, token, user } = useAuthStore();
  const addRequest = useConnectionStore((s) => s.addRequest);
  const removeRequest = useConnectionStore((s) => s.removeRequest);
  const fetchActivities = useActivityStore((s) => s.fetchActivities);
  const addRealtimeActivity = useActivityStore((s) => s.addRealtimeActivity);

  const userId = user?.id || (user as any)?._id;

  // Connect socket globally when authenticated
  useEffect(() => {
    if (isAuthenticated && userId) {
      socketService.connect(token || undefined, userId);
      socketService.registerUser(userId);
      fetchActivities();
    }
  }, [isAuthenticated, token, userId, fetchActivities]);

  // Global listeners for connect requests, accept navigation, and realtime activities
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

    const unsubActivity = socketService.onActivityNew(({ activity, unreadCount }) => {
      console.log('[AppLayout] Realtime activity received:', activity.type, unreadCount);
      addRealtimeActivity(activity, unreadCount);
    });

    return () => {
      unsubReq();
      unsubCancel();
      unsubAccept();
      unsubActivity();
    };
  }, [isAuthenticated, addRequest, removeRequest, router, addRealtimeActivity]);

  if (!isAuthenticated) {
    return <Redirect href={Routes.auth.welcome} />;
  }

  if (!isOnboarded) {
    return <Redirect href={Routes.onboarding.profileDetails} />;
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
