import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { Text, Heading } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { PulseDot } from '@/components/ui/PulseDot';
import { MOOD_OPTIONS } from '@/constants/moods';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { usersService, UserProfile } from '@/services/users.service';
import { chatsService } from '@/services/chats.service';
import { socketService } from '@/services/socket.service';
import { useAuthStore } from '@/store/auth.store';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const currentUserId = user?.id || (user as any)?._id || '';
  const isMe = currentUserId === id;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [hasRequestedConnect, setHasRequestedConnect] = useState(false);

  useEffect(() => {
    if (!id) return;
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const data = await usersService.getUserProfile(id);
        setProfile(data);
      } catch (err: any) {
        console.error('Failed to load user profile:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [id]);

  const handleMessage = async () => {
    if (isMe) {
      router.push('/(app)/(tabs)/profile');
      return;
    }

    if (!id) return;

    if (profile?.existingChatId) {
      router.push(`/(app)/chat/${profile.existingChatId}`);
      return;
    }

    setIsStartingChat(true);
    try {
      const chat = await chatsService.createOrGetChat(id);
      if (chat?._id) {
        router.push(`/(app)/chat/${chat._id}`);
      }
    } catch (err: any) {
      console.error('Failed to start chat:', err);
      Alert.alert(
        'Error',
        err?.response?.data?.message || 'Could not start chat. Please try again.',
      );
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleSendConnect = () => {
    if (!currentUserId || !id) return;
    socketService.sendConnectRequest(currentUserId, id);
    setHasRequestedConnect(true);
    Alert.alert(
      'Request Sent',
      `Connection request sent to ${profile?.alias || 'user'}. They have 15s to accept!`,
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['#18181B', '#000000']} style={StyleSheet.absoluteFillObject} />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.notFoundContainer}>
        <LinearGradient colors={['#18181B', '#000000']} style={StyleSheet.absoluteFillObject} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>
          </View>
          <View style={styles.notFoundBody}>
            <Ionicons name="person-circle-outline" size={64} color="rgba(255,255,255,0.3)" />
            <Heading level={2} style={styles.notFoundTitle}>
              User Not Found
            </Heading>
            <Text style={styles.notFoundSub}>
              This user may have deleted their account or changed handle.
            </Text>
            <Pressable onPress={() => router.back()} style={styles.notFoundBackBtn}>
              <Text style={styles.notFoundBackBtnText}>Go Back</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const moodOption = MOOD_OPTIONS.find((m) => m.id === profile.mood) || MOOD_OPTIONS[0];

  return (
    <View style={styles.mainContainer}>
      <LinearGradient
        colors={['#1F1D2B', '#111115', '#000000']}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea}>
        {/* Navigation Header */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
          <Text style={styles.headerTitle}>{profile.alias}</Text>
          <View style={{ width: 44 }} />
        </Animated.View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Hero Profile Card */}
          <Animated.View entering={FadeInDown.duration(500)} style={styles.heroCard}>
            <LinearGradient
              colors={['rgba(255, 45, 85, 0.15)', 'rgba(255, 45, 85, 0.03)']}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.avatarWrapper}>
              <Avatar avatarId={profile.avatarId || 'avatar-1'} alias={profile.alias} size={92} />
              {profile.isActive && (
                <View style={styles.onlineBadge}>
                  <PulseDot color="#10B981" />
                </View>
              )}
            </View>

            <Heading level={1} style={styles.aliasName}>
              {profile.alias}
            </Heading>
            {profile.username ? (
              <Text style={styles.usernameHandle}>@{profile.username}</Text>
            ) : null}

            {/* Mood pill */}
            <View style={styles.moodPill}>
              <Text style={styles.moodEmoji}>{moodOption?.emoji ?? '✨'}</Text>
              <Text style={styles.moodLabel}>{moodOption?.label ?? 'Chilling'}</Text>
            </View>

            {/* Active Vibe callout if active */}
            {profile.isActive && profile.activeVibe ? (
              <View style={styles.vibeBox}>
                <Ionicons name="sparkles" size={16} color={colors.primary} />
                <Text style={styles.vibeBoxText}>&quot;{profile.activeVibe}&quot;</Text>
              </View>
            ) : null}

            {/* Primary Action Button: Message */}
            <View style={styles.actionsContainer}>
              <Pressable
                onPress={handleMessage}
                disabled={isStartingChat}
                style={styles.primaryMessageBtn}
              >
                <LinearGradient
                  colors={colors.primaryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryMessageGradient}
                >
                  {isStartingChat ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons
                        name={isMe ? 'person' : 'chatbubble-ellipses'}
                        size={20}
                        color="white"
                        style={{ marginRight: spacing.xs }}
                      />
                      <Text style={styles.primaryMessageText}>
                        {isMe ? 'Edit Profile' : 'Message'}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>

              {/* If active on Explore and not me, option to send 15s instant connect request */}
              {profile.isActive && !isMe && (
                <Pressable
                  onPress={handleSendConnect}
                  disabled={hasRequestedConnect}
                  style={[styles.secondaryConnectBtn, hasRequestedConnect && { opacity: 0.5 }]}
                >
                  <Ionicons
                    name="flash"
                    size={18}
                    color={colors.primary}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.secondaryConnectText}>
                    {hasRequestedConnect ? 'Requested' : 'Instant Connect'}
                  </Text>
                </Pressable>
              )}
            </View>
          </Animated.View>

          {/* Details Section */}
          <Animated.View entering={FadeInDown.duration(500).delay(150)} style={styles.sectionCard}>
            <Heading level={3} style={styles.sectionTitle}>
              Identity & Details
            </Heading>

            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <View style={styles.detailIconBg}>
                  <Ionicons name="language" size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Language</Text>
                  <Text style={styles.detailValue}>{profile.language || 'English'}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <View style={styles.detailIconBg}>
                  <Ionicons name="calendar-outline" size={18} color="#38BDF8" />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Age</Text>
                  <Text style={styles.detailValue}>{profile.age || 'Not specified'}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <View style={styles.detailIconBg}>
                  <Text style={{ fontSize: 16 }}>{moodOption?.emoji ?? '✨'}</Text>
                </View>
                <View>
                  <Text style={styles.detailLabel}>Mood</Text>
                  <Text style={styles.detailValue}>
                    {moodOption?.label ?? profile.mood ?? 'Chilling'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <View style={styles.detailIconBg}>
                  <Ionicons name="time-outline" size={18} color="#A78BFA" />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Member Since</Text>
                  <Text style={styles.detailValue}>
                    {profile.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString([], {
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Recently'}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Needs / Looking For Chips */}
          {profile.needs && profile.needs.length > 0 && (
            <Animated.View
              entering={FadeInDown.duration(500).delay(250)}
              style={styles.sectionCard}
            >
              <Heading level={3} style={styles.sectionTitle}>
                Looking For
              </Heading>
              <View style={styles.needsChipsRow}>
                {profile.needs.map((need, idx) => (
                  <View key={idx} style={styles.needChip}>
                    <Text style={styles.needChipText}>{need}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}
        </ScrollView>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: 'white',
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  heroCard: {
    backgroundColor: '#18181D',
    borderRadius: 28,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 45, 85, 0.15)',
    overflow: 'hidden',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#18181D',
    borderRadius: 12,
    padding: 3,
  },
  aliasName: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
  },
  usernameHandle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  moodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginTop: spacing.sm,
    gap: 6,
  },
  moodEmoji: {
    fontSize: 14,
  },
  moodLabel: {
    fontSize: 13,
    color: 'white',
    fontWeight: '600',
  },
  vibeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255, 45, 85, 0.1)',
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 45, 85, 0.25)',
  },
  vibeBoxText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontStyle: 'italic',
  },
  actionsContainer: {
    width: '100%',
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  primaryMessageBtn: {
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    width: '100%',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryMessageGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryMessageText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryConnectBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 45, 85, 0.3)',
  },
  secondaryConnectText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#18181D',
    borderRadius: 24,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: 'white',
    marginBottom: spacing.md,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  detailItem: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: spacing.md,
    borderRadius: 16,
  },
  detailIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
    marginTop: 2,
  },
  needsChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  needChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  needChipText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  notFoundContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  notFoundBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  notFoundTitle: {
    fontSize: 22,
    color: 'white',
    fontWeight: '700',
  },
  notFoundSub: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  notFoundBackBtn: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  notFoundBackBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
});
