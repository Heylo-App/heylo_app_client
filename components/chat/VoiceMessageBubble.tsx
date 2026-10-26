import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Text } from '@/components/ui/Text';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { audioPlayerService } from '@/services/audioPlayer.service';

interface VoiceMessageBubbleProps {
  messageId: string;
  audioData: string;
  duration?: number;
  isMe: boolean;
}

export const VoiceMessageBubble: React.FC<VoiceMessageBubbleProps> = ({
  messageId,
  audioData,
  duration = 0,
  isMe,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPositionSec, setCurrentPositionSec] = useState(0);

  // Generate a deterministic pseudo-random waveform bar pattern based on messageId
  const barHeights = useMemo(() => {
    const bars = [];
    let seed = 0;
    for (let i = 0; i < messageId.length; i++) {
      seed = (seed * 31 + messageId.charCodeAt(i)) % 1000;
    }
    const totalBars = 22;
    for (let i = 0; i < totalBars; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      const rnd = seed / 233280;
      // Heights between 6 and 22
      bars.push(Math.round(6 + rnd * 16));
    }
    return bars;
  }, [messageId]);

  useEffect(() => {
    const unsubscribe = audioPlayerService.subscribe((status) => {
      if (status.messageId === messageId) {
        setIsPlaying(status.isPlaying);
        if (status.durationMillis > 0) {
          const ratio = Math.min(1, status.positionMillis / status.durationMillis);
          setProgress(ratio);
          setCurrentPositionSec(Math.floor(status.positionMillis / 1000));
        } else {
          setProgress(0);
          setCurrentPositionSec(0);
        }
      } else {
        setIsPlaying(false);
        setProgress(0);
        setCurrentPositionSec(0);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [messageId]);

  const handleTogglePlay = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await audioPlayerService.play(messageId, audioData);
    } catch (e) {
      console.error('[VoiceMessageBubble] toggle play error:', e);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const displayTime =
    isPlaying && currentPositionSec > 0 ? formatTime(currentPositionSec) : formatTime(duration);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handleTogglePlay}
        style={[styles.playBtn, isMe ? styles.playBtnMe : styles.playBtnThem]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={18}
          color={isMe ? colors.primary : '#FFFFFF'}
          style={!isPlaying ? { marginLeft: 2 } : undefined}
        />
      </Pressable>

      <View style={styles.waveformContainer}>
        <View style={styles.barsRow}>
          {barHeights.map((h, idx) => {
            const barProgress = (idx + 1) / barHeights.length;
            const isFilled = progress >= barProgress;
            return (
              <View
                key={idx}
                style={[
                  styles.bar,
                  { height: h },
                  isMe
                    ? isFilled
                      ? styles.barMeFilled
                      : styles.barMeUnfilled
                    : isFilled
                      ? styles.barThemFilled
                      : styles.barThemUnfilled,
                ]}
              />
            );
          })}
        </View>

        <View style={styles.metaRow}>
          <Text style={[styles.durationText, isMe ? styles.durationMe : styles.durationThem]}>
            {displayTime}
          </Text>
          <Ionicons
            name="mic"
            size={12}
            color={isMe ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)'}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: 2,
    minWidth: 190,
    maxWidth: 240,
  },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  playBtnMe: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  playBtnThem: {
    backgroundColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  waveformContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 24,
  },
  bar: {
    width: 3,
    borderRadius: 1.5,
  },
  barMeFilled: {
    backgroundColor: '#FFFFFF',
  },
  barMeUnfilled: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  barThemFilled: {
    backgroundColor: colors.primary,
  },
  barThemUnfilled: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '600',
  },
  durationMe: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  durationThem: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
});
