import { useRouter } from 'expo-router';
import { memo, useMemo, useCallback } from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet, Alert } from 'react-native';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { usersService } from '@/services/users.service';

type Variant = keyof typeof typography;

interface MentionTextProps extends RNTextProps {
  content: string;
  variant?: Variant;
  muted?: boolean;
  onPressMention?: (username: string) => void;
}

export const MentionText = memo(function MentionText({
  content,
  variant = 'body',
  muted,
  style,
  onPressMention,
  ...props
}: MentionTextProps) {
  const router = useRouter();

  const handleMentionPress = useCallback(
    async (username: string) => {
      if (onPressMention) {
        onPressMention(username);
        return;
      }
      try {
        const user = await usersService.getUserByUsername(username);
        if (user && user.id) {
          router.push(`/(app)/users/${user.id}`);
        } else {
          Alert.alert('User Not Found', `@${username} could not be found.`);
        }
      } catch {
        Alert.alert('User Not Found', `@${username} could not be found.`);
      }
    },
    [onPressMention, router],
  );

  const parsedElements = useMemo(() => {
    if (!content) return null;

    // Matches @username where username contains letters, numbers, underscores, periods, hyphens
    const regex = /(@[a-zA-Z0-9_.-]+)/g;
    const parts = content.split(regex);

    return parts.map((part, index) => {
      if (part.startsWith('@') && part.length > 1) {
        const cleanUsername = part.substring(1);
        return (
          <RNText
            key={index}
            style={styles.mention}
            onPress={() => handleMentionPress(cleanUsername)}
          >
            {part}
          </RNText>
        );
      }
      return part;
    });
  }, [content, handleMentionPress]);

  return (
    <RNText
      style={[typography[variant], muted && { color: colors.foregroundSecondary }, style]}
      {...props}
    >
      {parsedElements}
    </RNText>
  );
});

const styles = StyleSheet.create({
  mention: {
    color: colors.primary,
    fontWeight: '600',
  },
});
