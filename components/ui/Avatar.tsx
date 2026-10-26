import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { StyleSheet, View, Image } from 'react-native';

import { moodGradients } from '@/theme/gradients';
import { colors } from '@/theme/colors';
import type { MoodType } from '@/constants/moods';

export interface ProfessionalAvatar {
  id: string;
  name: string;
  seed: string;
  role: string;
  colors: readonly [string, string];
}

export const PROFESSIONAL_AVATARS: Record<string, ProfessionalAvatar> = {
  'avatar-1': {
    id: 'avatar-1',
    name: 'Alexander',
    seed: 'Alexander',
    role: 'Executive',
    colors: ['#3B82F6', '#1E40AF'], // Executive Blue
  },
  'avatar-2': {
    id: 'avatar-2',
    name: 'Sophia',
    seed: 'Sophia',
    role: 'Product Lead',
    colors: ['#8B5CF6', '#6D28D9'], // Royal Violet
  },
  'avatar-3': {
    id: 'avatar-3',
    name: 'Marcus',
    seed: 'Marcus',
    role: 'Tech Lead',
    colors: ['#10B981', '#047857'], // Modern Emerald
  },
  'avatar-4': {
    id: 'avatar-4',
    name: 'Elena',
    seed: 'Elena',
    role: 'Consultant',
    colors: ['#EC4899', '#BE185D'], // Rose Professional
  },
  'avatar-5': {
    id: 'avatar-5',
    name: 'David',
    seed: 'David',
    role: 'Designer',
    colors: ['#F59E0B', '#B45309'], // Warm Amber
  },
  'avatar-6': {
    id: 'avatar-6',
    name: 'Maya',
    seed: 'Maya',
    role: 'Strategist',
    colors: ['#06B6D4', '#0E7490'], // Cyan Corporate
  },
  'avatar-7': {
    id: 'avatar-7',
    name: 'James',
    seed: 'James',
    role: 'Engineer',
    colors: ['#6366F1', '#4338CA'], // Indigo Professional
  },
  'avatar-8': {
    id: 'avatar-8',
    name: 'Chloe',
    seed: 'Chloe',
    role: 'Analyst',
    colors: ['#14B8A6', '#0F766E'], // Teal Modern
  },
  'avatar-9': {
    id: 'avatar-9',
    name: 'Lucas',
    seed: 'Lucas',
    role: 'Founder',
    colors: ['#64748B', '#334155'], // Slate Steel
  },
  'avatar-10': {
    id: 'avatar-10',
    name: 'Zara',
    seed: 'Zara',
    role: 'Director',
    colors: ['#F43F5E', '#9F1239'], // Crimson Executive
  },
};

interface AvatarProps {
  avatarId: string;
  alias?: string;
  size?: number;
  mood?: MoodType;
  showOnline?: boolean;
}

export const Avatar = memo(function Avatar({
  avatarId,
  alias,
  size = 48,
  mood,
  showOnline,
}: AvatarProps) {
  const DEFAULT_GRADIENT = ['#3B82F6', '#1E40AF'] as const;

  const profAvatar = PROFESSIONAL_AVATARS[avatarId];
  const gradientColors = (mood ? moodGradients[mood] : profAvatar?.colors) ?? DEFAULT_GRADIENT;
  const [colorStart, colorEnd] = gradientColors;

  const seed = profAvatar?.seed || avatarId || alias || 'Alexander';
  const uri = `https://api.dicebear.com/9.x/avataaars/png?seed=${seed}&backgroundColor=transparent`;

  return (
    <View style={{ width: size, height: size }}>
      <LinearGradient
        colors={[colorStart ?? DEFAULT_GRADIENT[0], colorEnd ?? DEFAULT_GRADIENT[1]]}
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2, overflow: 'hidden' },
        ]}
      >
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      </LinearGradient>
      {showOnline ? <View style={[styles.online, { right: 0, bottom: 0 }]} /> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  online: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.background,
  },
});

export const AVATAR_OPTIONS = Object.keys(PROFESSIONAL_AVATARS);
