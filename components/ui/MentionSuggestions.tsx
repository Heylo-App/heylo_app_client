import { memo } from 'react';
import { StyleSheet, View, Pressable, ScrollView, ActivityIndicator } from 'react-native';

import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export interface MentionUser {
  id: string;
  username: string;
  alias: string;
  avatarId: string;
}

interface MentionSuggestionsProps {
  suggestions: MentionUser[];
  isLoading?: boolean;
  onSelect: (user: MentionUser) => void;
}

export const MentionSuggestions = memo(function MentionSuggestions({
  suggestions,
  isLoading,
  onSelect,
}: MentionSuggestionsProps) {
  if (!isLoading && suggestions.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="caption" style={styles.headerText}>
          Mention user
        </Text>
        {isLoading && <ActivityIndicator size="small" color={colors.primary} />}
      </View>
      <ScrollView
        style={styles.list}
        keyboardShouldPersistTaps="always"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        {suggestions.map((item) => (
          <Pressable
            key={item.id || item.username}
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            onPress={() => onSelect(item)}
          >
            <Avatar avatarId={item.avatarId} alias={item.alias} size={28} />
            <View style={styles.info}>
              <Text variant="label" style={styles.name} numberOfLines={1}>
                {item.alias || item.username}
              </Text>
              <Text variant="caption" style={styles.username} numberOfLines={1}>
                @{item.username}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#18181D',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    maxHeight: 180,
    marginBottom: spacing.xs,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  list: {
    maxHeight: 140,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  itemPressed: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  info: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  username: {
    color: colors.primary,
    fontSize: 12,
  },
});
