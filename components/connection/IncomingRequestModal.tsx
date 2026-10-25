import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

import { Text, Heading } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { MOOD_OPTIONS } from '@/constants/moods';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { socketService } from '@/services/socket.service';
import { useConnectionStore } from '@/store/connection.store';

export const IncomingRequestModal = () => {
  const { activeRequest, removeRequest } = useConnectionStore();
  const [timeLeft, setTimeLeft] = useState(15);

  useEffect(() => {
    if (!activeRequest) {
      setTimeLeft(15);
      return;
    }

    const expiresAtMs = new Date(activeRequest.expiresAt).getTime();

    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        socketService.declineConnectRequest(activeRequest.id);
        removeRequest(activeRequest.id);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeRequest, removeRequest]);

  if (!activeRequest) return null;

  const mood = MOOD_OPTIONS.find((m) => m.id === activeRequest.moodId) || MOOD_OPTIONS[0];

  const handleAccept = () => {
    socketService.acceptConnectRequest(activeRequest.id);
    removeRequest(activeRequest.id);
  };

  const handleDecline = () => {
    socketService.declineConnectRequest(activeRequest.id);
    removeRequest(activeRequest.id);
  };

  const progressPercent = Math.max(0, Math.min(100, (timeLeft / 15) * 100));

  return (
    <Modal
      visible={Boolean(activeRequest)}
      transparent
      animationType="none"
      onRequestClose={handleDecline}
    >
      <Animated.View entering={FadeIn.duration(200)} style={styles.overlayWrapper}>
        <View style={styles.overlay}>
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />

          <Animated.View entering={SlideInDown.duration(300)} style={styles.card}>
            {/* Header / Countdown Bar */}
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>

            <View style={styles.content}>
              <View style={styles.topRow}>
                <View style={styles.avatarGlow}>
                  <Avatar
                    avatarId={activeRequest.avatarId || 'avatar-1'}
                    alias={activeRequest.alias}
                    size={52}
                  />
                </View>
                <View style={styles.infoCol}>
                  <Heading level={3} style={styles.alias}>
                    {activeRequest.alias}
                  </Heading>
                  <Text style={styles.moodText}>
                    {mood?.emoji ?? '✨'} {mood?.label ?? 'Active'}
                  </Text>
                </View>
                <View style={styles.timerBadge}>
                  <Text style={styles.timerText}>{timeLeft}s</Text>
                </View>
              </View>

              {activeRequest.vibe ? (
                <Text style={styles.vibeText}>&quot;{activeRequest.vibe}&quot;</Text>
              ) : null}

              <Text style={styles.invitePrompt}>Wants to connect with you right now!</Text>

              {/* Actions */}
              <View style={styles.actionsRow}>
                <Pressable onPress={handleDecline} style={styles.declineBtn}>
                  <Text style={styles.declineText}>Decline</Text>
                </Pressable>

                <Pressable onPress={handleAccept} style={styles.acceptBtn}>
                  <LinearGradient
                    colors={colors.primaryGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.acceptGradient}
                  >
                    <Text style={styles.acceptText}>Accept ({timeLeft}s)</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayWrapper: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1E1E24',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 45, 85, 0.3)',
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  content: {
    padding: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarGlow: {
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.primary,
    padding: 2,
  },
  infoCol: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  alias: {
    fontSize: 18,
    color: 'white',
    fontWeight: '700',
  },
  moodText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  timerBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 45, 85, 0.2)',
  },
  timerText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  vibeText: {
    marginTop: spacing.md,
    fontSize: 14,
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.85)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: spacing.sm,
    borderRadius: 12,
  },
  invitePrompt: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  declineBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  declineText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  acceptBtn: {
    flex: 1.4,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  acceptGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
});
