import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { File } from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { Text } from '@/components/ui/Text';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

interface VoiceRecorderProps {
  onSend: (audioData: { dataUri: string; duration: number }) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSend, onCancel }) => {
  const [durationSec, setDurationSec] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pulse animation for recording dot
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    pulseOpacity.value = withRepeat(withTiming(0.2, { duration: 600 }), -1, true);

    startRecording();

    return () => {
      cleanupRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const cleanupRecording = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch {
        // Ignore if already stopped
      }
      recordingRef.current = null;
    }
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    } catch {
      // Ignore
    }
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert(
          'Microphone Permission Required',
          'Please allow microphone access in settings to send voice messages.',
          [{ text: 'OK', onPress: onCancel }],
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      recordingRef.current = recording;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      setDurationSec(0);
      timerRef.current = setInterval(() => {
        setDurationSec((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('[VoiceRecorder] Failed to start recording:', err);
      Alert.alert('Error', 'Could not start audio recording.');
      onCancel();
    }
  };

  const handleCancel = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await cleanupRecording();
    onCancel();
  };

  const handleSend = async () => {
    if (!recordingRef.current || isProcessing) return;

    if (durationSec < 1) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      await cleanupRecording();
      onCancel();
      return;
    }

    try {
      setIsProcessing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const recording = recordingRef.current;
      const status = await recording.getStatusAsync();
      const recordedDurationSec = Math.max(
        1,
        Math.round((status.durationMillis || durationSec * 1000) / 1000),
      );

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;

      if (!uri) {
        throw new Error('Recording produced no URI');
      }

      // Convert recorded audio to base64 using modern Expo FileSystem
      const file = new File(uri);
      const base64 = await file.base64();
      const dataUri = `data:audio/m4a;base64,${base64}`;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      onSend({
        dataUri,
        duration: recordedDurationSec,
      });
    } catch (err) {
      console.error('[VoiceRecorder] Failed to process recording:', err);
      Alert.alert('Error', 'Failed to send voice message.');
      await cleanupRecording();
      onCancel();
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={styles.container}
    >
      <Pressable
        onPress={handleCancel}
        style={styles.cancelBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        disabled={isProcessing}
      >
        <Ionicons name="trash-outline" size={22} color="#FF453A" />
      </Pressable>

      <View style={styles.recordingIndicator}>
        <Animated.View style={[styles.redDot, pulseStyle]} />
        <Text style={styles.timerText}>{formatTimer(durationSec)}</Text>
        <Text style={styles.recordingLabel}>Recording...</Text>
      </View>

      <Pressable
        onPress={handleSend}
        style={styles.sendBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        disabled={isProcessing}
      >
        <LinearGradient
          colors={colors.primaryGradient}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Ionicons name="paper-plane" size={20} color="#FFFFFF" style={{ marginLeft: 2 }} />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E22',
    borderRadius: 24,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    justifyContent: 'center',
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF453A',
  },
  timerText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  recordingLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    marginLeft: 4,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});
