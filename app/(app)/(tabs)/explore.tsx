import {
  StyleSheet,
  View,
  FlatList,
  Pressable,
  Switch,
  TextInput,
  Dimensions,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeIn,
  SlideInDown,
  LinearTransition,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useRouter, useFocusEffect } from 'expo-router';

import { Text, Heading } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { MoodChip } from '@/components/ui/MoodChip';
import { Button } from '@/components/ui/Button';
import { PulseDot } from '@/components/ui/PulseDot';
import { MOOD_OPTIONS, MoodType } from '@/constants/moods';
import { useAuthStore } from '@/store/auth.store';
import { useConnectionStore } from '@/store/connection.store';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { usersService, ActiveUser } from '@/services/users.service';
import { socketService } from '@/services/socket.service';

const { height } = Dimensions.get('window');

export default function ExploreScreen() {
  const { user } = useAuthStore();
  const { incomingRequests, removeRequest } = useConnectionStore();

  const myUserId = user?.id || (user as any)?._id || '';

  // States
  const [isActive, setIsActive] = useState(false);
  const [showActiveSetup, setShowActiveSetup] = useState(false);
  const [showRequests, setShowRequests] = useState(false);

  // Setup forms
  const [myMood, setMyMood] = useState<MoodType | null>(null);
  const [myVibe, setMyVibe] = useState('');

  // Real data
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchActiveUsers = useCallback(async () => {
    try {
      const res = await usersService.getActiveUsers();
      setActiveUsers(res.users);

      // Sync active state from backend
      if (res.myStatus?.isActive) {
        setIsActive(true);
        if (res.myStatus.moodId) setMyMood(res.myStatus.moodId);
        if (res.myStatus.vibe) setMyVibe(res.myStatus.vibe);
      } else {
        setIsActive(false);
      }
    } catch (err) {
      console.error('Failed to fetch active users', err);
    }
  }, []);

  // Refresh whenever Explore tab gains focus
  useFocusEffect(
    useCallback(() => {
      fetchActiveUsers();
      if (myUserId) {
        socketService.registerUser(myUserId);
      }
    }, [fetchActiveUsers, myUserId]),
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchActiveUsers();
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchActiveUsers();

    const unsubUpdate = socketService.onActiveUsersUpdated(() => {
      fetchActiveUsers();
    });

    const unsubError = socketService.onConnectRequestError(({ message }) => {
      Alert.alert('Connection Notice', message);
    });

    return () => {
      unsubUpdate();
      unsubError();
    };
  }, [fetchActiveUsers]);

  const handleToggleActive = async (val: boolean) => {
    if (val) {
      setShowActiveSetup(true);
    } else {
      setIsActive(false);
      if (myUserId) {
        socketService.toggleActive(myUserId, '', '', false);
      }
      try {
        await usersService.toggleActive({ isActive: false });
      } catch (e) {
        console.error('Error toggling off active via API:', e);
      }
      fetchActiveUsers();
    }
  };

  const handleMakeActive = async () => {
    if (myMood && myVibe && myVibe.trim()) {
      const trimmedVibe = myVibe.trim();
      setIsActive(true);
      setShowActiveSetup(false);

      if (myUserId) {
        socketService.toggleActive(myUserId, myMood, trimmedVibe, true);
      }

      try {
        await usersService.toggleActive({
          moodId: myMood,
          vibe: trimmedVibe,
          isActive: true,
        });
      } catch (err) {
        console.error('Error toggling on active via API:', err);
      }
      fetchActiveUsers();
    } else {
      Alert.alert('Missing Info', 'Please select a mood and enter a vibe.');
    }
  };

  const renderActiveDashboard = () => {
    if (!isActive || !myMood) return null;
    const mood = MOOD_OPTIONS.find((m) => m.id === myMood) || MOOD_OPTIONS[0];

    return (
      <Animated.View entering={FadeInDown.duration(600)} style={styles.dashboardCard}>
        <LinearGradient
          colors={['rgba(255, 45, 85, 0.12)', 'rgba(255, 45, 85, 0.03)']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.dashboardInner}>
          <View style={styles.cardTopRow}>
            <Avatar avatarId={user?.avatarId || 'avatar-1'} alias={user?.alias} size={44} />
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Heading level={3} style={styles.alias}>
                {user?.alias || 'Me'}
              </Heading>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <PulseDot color={colors.primary} />
                <Text style={styles.dashStatusText}>Active & Visible ({mood?.emoji ?? '✨'})</Text>
              </View>
            </View>
          </View>

          <Text style={styles.vibeText}>&quot;{myVibe}&quot;</Text>

          <Pressable onPress={() => setShowRequests(true)} style={styles.dashRequestsBtn}>
            <LinearGradient
              colors={colors.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.dashRequestsGradient}
            >
              <Text style={styles.dashRequestsText}>View Requests</Text>
              {incomingRequests.length > 0 && (
                <View style={styles.dashRequestsBadge}>
                  <Text style={styles.dashRequestsBadgeText}>{incomingRequests.length}</Text>
                </View>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </Animated.View>
    );
  };

  const renderProfileCard = ({ item, index }: { item: ActiveUser; index: number }) => (
    <ProfileCard key={item._id} item={item} index={index} myUserId={myUserId} />
  );

  return (
    <View style={styles.mainContainer}>
      <LinearGradient colors={['#18181B', '#000000']} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
          <View style={styles.headerTop}>
            <Heading level={1} style={styles.title}>
              Explore
            </Heading>

            <View style={styles.headerRight}>
              {/* Active Toggle */}
              <View style={styles.activeToggleContainer}>
                <Text style={styles.activeToggleLabel}>Active</Text>
                <Switch
                  value={isActive}
                  onValueChange={handleToggleActive}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: colors.primary }}
                  thumbColor={'white'}
                  ios_backgroundColor="rgba(255,255,255,0.2)"
                  style={{ transform: [{ scale: 0.75 }] }}
                />
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Feed */}
        <FlatList
          data={activeUsers}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={renderActiveDashboard()}
          renderItem={renderProfileCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Ionicons name="people-outline" size={48} color="rgba(255,255,255,0.2)" />
              <Text style={{ color: 'rgba(255,255,255,0.4)', marginTop: 12 }}>
                No active users right now.
              </Text>
            </View>
          }
        />
      </SafeAreaView>

      <Modal
        visible={showActiveSetup}
        transparent
        animationType="none"
        onRequestClose={() => setShowActiveSetup(false)}
      >
        <Animated.View entering={FadeIn.duration(200)} style={styles.overlayWrapper}>
          <View style={styles.overlay}>
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />
            <Pressable style={styles.overlayClose} onPress={() => setShowActiveSetup(false)} />
            <Animated.View entering={SlideInDown.duration(350)} style={styles.sheetContent}>
              <View style={styles.sheetHandle} />
              <Heading level={2} style={styles.sheetTitle}>
                Go Active
              </Heading>
              <Text style={styles.sheetSubtitle}>
                Let others know what vibe you&apos;re bringing.
              </Text>

              <Text style={styles.inputLabel}>SELECT YOUR MOOD</Text>
              <View style={styles.moodGrid}>
                {MOOD_OPTIONS.map((mood) => (
                  <MoodChip
                    key={mood.id}
                    mood={mood}
                    selected={myMood === mood.id}
                    onPress={(id) => setMyMood(id as MoodType)}
                  />
                ))}
              </View>

              <Text style={styles.inputLabel}>YOUR VIBE</Text>
              <TextInput
                style={styles.textInput}
                placeholder="What are you looking for right now?"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={myVibe}
                onChangeText={setMyVibe}
                maxLength={60}
              />

              <Button
                title="Make me Active"
                size="lg"
                onPress={handleMakeActive}
                style={{ width: '100%', marginTop: spacing.md }}
              />
            </Animated.View>
          </View>
        </Animated.View>
      </Modal>

      <Modal
        visible={showRequests}
        transparent
        animationType="none"
        onRequestClose={() => setShowRequests(false)}
      >
        <Animated.View entering={FadeIn.duration(200)} style={styles.overlayWrapper}>
          <View style={styles.overlay}>
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />
            <Pressable style={styles.overlayClose} onPress={() => setShowRequests(false)} />
            <Animated.View
              entering={SlideInDown.duration(350)}
              style={[styles.sheetContent, { maxHeight: height * 0.85 }]}
            >
              <View style={styles.sheetHandle} />
              <Heading level={2} style={styles.sheetTitle}>
                Requests
              </Heading>
              <Text style={styles.sheetSubtitle}>People who want to connect with you</Text>

              <FlatList
                data={incomingRequests}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing['4xl'] }}
                ListEmptyComponent={
                  <Text
                    style={{
                      color: 'rgba(255,255,255,0.4)',
                      textAlign: 'center',
                      paddingVertical: spacing.xl,
                    }}
                  >
                    No requests right now.
                  </Text>
                }
                renderItem={({ item }) => (
                  <RequestCard
                    item={item}
                    onAccept={() => {
                      socketService.acceptConnectRequest(item.id);
                      removeRequest(item.id);
                      setShowRequests(false);
                    }}
                    onDecline={() => {
                      socketService.declineConnectRequest(item.id);
                      removeRequest(item.id);
                    }}
                  />
                )}
              />
            </Animated.View>
          </View>
        </Animated.View>
      </Modal>
    </View>
  );
}

const RequestCard = ({
  item,
  onAccept,
  onDecline,
}: {
  item: any;
  onAccept: () => void;
  onDecline: () => void;
}) => {
  const router = useRouter();
  const mood = MOOD_OPTIONS.find((m) => m.id === item.moodId) || MOOD_OPTIONS[0];
  const [timeLeft, setTimeLeft] = useState(15);

  useEffect(() => {
    const expiresAtMs = new Date(item.expiresAt).getTime();
    const updateTime = () => {
      const remaining = Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        onDecline();
      }
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [item.expiresAt, onDecline]);

  return (
    <View style={styles.requestCard}>
      {/* 15s Progress bar */}
      <View style={styles.progressBarBg}>
        <Animated.View style={[styles.progressBarFill, { width: `${(timeLeft / 15) * 100}%` }]} />
      </View>

      <Pressable
        style={[styles.requestTopRow, { marginTop: 8 }]}
        onPress={() => item.senderId && router.push(`/(app)/users/${item.senderId}`)}
      >
        <Avatar avatarId={item.avatarId} alias={item.alias} size={40} />
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Heading level={3} style={{ fontSize: 16, color: 'white' }}>
            {item.alias}
          </Heading>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
            {mood?.label ?? 'Chilling'} {mood?.emoji ?? '✨'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
      </Pressable>
      {item.vibe ? (
        <Text style={[styles.vibeText, { marginTop: 4, marginBottom: spacing.sm }]}>
          &quot;{item.vibe}&quot;
        </Text>
      ) : null}
      <View style={styles.requestActions}>
        <Pressable onPress={onDecline} style={styles.reqBtnDecline}>
          <Text style={styles.reqBtnDeclineText}>Decline</Text>
        </Pressable>
        <Pressable onPress={onAccept} style={styles.reqBtnAccept}>
          <Text style={styles.reqBtnAcceptText}>Accept ({timeLeft}s)</Text>
        </Pressable>
      </View>
    </View>
  );
};

const ProfileCard = ({
  item,
  index,
  myUserId,
}: {
  item: ActiveUser;
  index: number;
  myUserId: string;
}) => {
  const router = useRouter();
  const mood = MOOD_OPTIONS.find((m) => m.id === item.moodId) || MOOD_OPTIONS[0];
  const [requested, setRequested] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [activeReqId, setActiveReqId] = useState<string | null>(null);

  const targetUserId =
    (item.userId as any)?._id ||
    (item.userId as any)?.id ||
    (typeof item.userId === 'string' ? item.userId : '');

  useEffect(() => {
    if (!requested) {
      setCountdown(0);
      return;
    }
    setCountdown(15);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setRequested(false);
          setActiveReqId(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [requested]);

  useEffect(() => {
    const unsubSent = socketService.onConnectRequestSent((payload) => {
      if (payload.receiverId === targetUserId) {
        setActiveReqId(payload.requestId);
      }
    });

    const unsubCancelled = socketService.onConnectRequestCancelled((payload) => {
      if (!activeReqId || payload.requestId === activeReqId) {
        setRequested(false);
        setCountdown(0);
        setActiveReqId(null);
      }
    });

    const unsubError = socketService.onConnectRequestError((payload) => {
      if (!payload.requestId || payload.requestId === activeReqId) {
        setRequested(false);
        setCountdown(0);
        setActiveReqId(null);
      }
    });

    return () => {
      unsubSent();
      unsubCancelled();
      unsubError();
    };
  }, [activeReqId, targetUserId]);

  const handleConnect = () => {
    if (!targetUserId || !myUserId) {
      Alert.alert('Notice', 'Cannot send request right now. Please verify your connection.');
      return;
    }
    console.log(`[ProfileCard] Sending connect request from ${myUserId} to ${targetUserId}`);
    socketService.sendConnectRequest(myUserId, targetUserId);
    setRequested(true);
  };

  const handleCancel = () => {
    if (activeReqId) {
      socketService.cancelConnectRequest(activeReqId);
    }
    setRequested(false);
    setCountdown(0);
    setActiveReqId(null);
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(500).delay(index * 50)}
      layout={LinearTransition.springify()}
      style={styles.card}
    >
      <Pressable
        style={styles.cardTopRow}
        onPress={() => {
          if (targetUserId) {
            router.push(`/(app)/users/${targetUserId}`);
          }
        }}
      >
        <Avatar
          avatarId={item.userId?.avatarId || 'avatar-1'}
          alias={item.userId?.alias || 'Anonymous'}
          size={44}
        />
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Heading level={3} style={styles.alias}>
            {item.userId?.alias || 'Anonymous'}
          </Heading>
          <Text style={styles.cardMoodLabel}>
            {mood?.label ?? 'Chilling'} {mood?.emoji ?? '✨'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
      </Pressable>

      <Text style={styles.vibeText}>&quot;{item.vibe}&quot;</Text>

      {/* Countdown progress bar */}
      {requested && countdown > 0 && (
        <View style={[styles.progressBarBg, { marginBottom: spacing.sm }]}>
          <Animated.View
            style={[styles.progressBarFill, { width: `${(countdown / 15) * 100}%` }]}
          />
        </View>
      )}

      <View style={styles.cardActions}>
        <Pressable
          onPress={handleConnect}
          style={[styles.connectBtn, requested && styles.connectingBtn]}
          disabled={requested}
        >
          <Text style={styles.connectBtnText}>
            {requested ? `Waiting... (${countdown}s)` : 'Connect'}
          </Text>
        </Pressable>

        {requested && (
          <Pressable onPress={handleCancel} style={styles.cancelRequestBtn}>
            <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
};

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
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  activeToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingLeft: spacing.md,
    paddingRight: 4,
    paddingVertical: 4,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  activeToggleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: spacing['2xl'],
    paddingBottom: 120,
    gap: spacing.lg,
  },

  // Active Dashboard Layout
  dashboardCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 45, 85, 0.3)',
    marginBottom: spacing.md,
  },
  dashboardInner: {
    padding: spacing.lg,
  },
  dashStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dashRequestsBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  dashRequestsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: spacing.sm,
  },
  dashRequestsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  dashRequestsBadge: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 4,
  },
  dashRequestsBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },

  // Standard Profile Card
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  alias: {
    fontSize: 17,
    fontWeight: '700',
    color: 'white',
  },
  cardMoodLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 1,
  },
  vibeText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
    lineHeight: 21,
    marginBottom: spacing.md,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  skipBtn: {
    flex: 1,
    paddingVertical: 11,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    alignItems: 'center',
  },
  skipBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  connectBtn: {
    flex: 1,
    paddingVertical: 11,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  connectingBtn: {
    backgroundColor: 'rgba(255, 45, 85, 0.4)',
  },
  connectBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  cancelRequestBtn: {
    height: 40,
    width: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Overlays
  overlayWrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayClose: {
    flex: 1,
  },
  sheetContent: {
    backgroundColor: '#18181B',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.md,
    paddingBottom: spacing['4xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  sheetSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: spacing['2xl'],
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: spacing.lg,
    color: 'white',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: spacing.xl,
  },

  // Request Cards
  requestCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  requestTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  requestMsg: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  reqBtnDecline: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    alignItems: 'center',
  },
  reqBtnDeclineText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  reqBtnAccept: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  reqBtnAcceptText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
});
