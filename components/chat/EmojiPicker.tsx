import React, { useState, memo } from 'react';
import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onBackspace?: () => void;
  onClose?: () => void;
}

interface EmojiCategory {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  emojis: string[];
}

const CATEGORIES: EmojiCategory[] = [
  {
    id: 'quick',
    name: 'Top',
    icon: 'flame',
    emojis: [
      '👍',
      '❤️',
      '😂',
      '🔥',
      '😍',
      '👏',
      '🎉',
      '✨',
      '💯',
      '🚀',
      '🙌',
      '🥳',
      '😎',
      '👀',
      '🥺',
      '🙏',
    ],
  },
  {
    id: 'smileys',
    name: 'Smileys',
    icon: 'happy-outline',
    emojis: [
      '😀',
      '😃',
      '😄',
      '😁',
      '😆',
      '😅',
      '🤣',
      '😂',
      '🙂',
      '🙃',
      '😉',
      '😊',
      '😇',
      '🥰',
      '😍',
      '🤩',
      '😘',
      '😗',
      '😚',
      '😙',
      '😋',
      '😛',
      '😜',
      '🤪',
      '😝',
      '🤑',
      '🤗',
      '🤭',
      '🤫',
      '🤔',
      '🤐',
      '🤨',
      '😐',
      '😑',
      '😶',
      '😏',
      '😒',
      '🙄',
      '😬',
      '🤥',
      '😌',
      '😔',
      '😪',
      '🤤',
      '😴',
      '😷',
      '🤒',
      '🤕',
      '🤢',
      '🤮',
      '🤧',
      '🥵',
      '🥶',
      '🥴',
      '😵',
      '🤯',
      '🤠',
      '🥳',
      '🥸',
      '😎',
      '🤓',
      '🧐',
      '😕',
      '😟',
      '🙁',
      '😮',
      '😯',
      '😲',
      '😳',
      '🥺',
      '😦',
      '😧',
      '😨',
      '😰',
      '😥',
      '😢',
      '😭',
      '😱',
      '😖',
      '😣',
      '😞',
      '😓',
      '😩',
      '😫',
      '🥱',
      '😤',
      '😡',
      '😠',
      '🤬',
      '😈',
      '👿',
      '💀',
      '☠️',
      '💩',
      '🤡',
      '👻',
    ],
  },
  {
    id: 'people',
    name: 'Hands',
    icon: 'hand-right-outline',
    emojis: [
      '👋',
      '🤚',
      '🖐️',
      '✋',
      '🖖',
      '👌',
      '🤌',
      '🤏',
      '✌️',
      '🤞',
      '🤟',
      '🤘',
      '🤙',
      '👈',
      '👉',
      '👆',
      '🖕',
      '👇',
      '☝️',
      '👍',
      '👎',
      '✊',
      '👊',
      '🤛',
      '🤜',
      '👏',
      '🙌',
      '👐',
      '🤲',
      '🤝',
      '🙏',
      '✍️',
      '💅',
      '🤳',
      '💪',
      '🦾',
      '🧠',
      '🫀',
      '🫁',
      '🦷',
      '🦴',
      '👀',
      '👁️',
      '👅',
      '👄',
      '👶',
      '🧒',
      '👦',
    ],
  },
  {
    id: 'hearts',
    name: 'Hearts',
    icon: 'heart-outline',
    emojis: [
      '❤️',
      '🧡',
      '💛',
      '💚',
      '💙',
      '💜',
      '🖤',
      '🤍',
      '🤎',
      '💔',
      '❤️‍🔥',
      '❤️‍🩹',
      '❣️',
      '💕',
      '💞',
      '💓',
      '💗',
      '💖',
      '💘',
      '💝',
      '💟',
      '💌',
      '💋',
      '💐',
      '🌸',
      '🌹',
      '🌺',
      '🌻',
      '🌼',
      '🌷',
      '🌱',
      '🌿',
      '☘️',
      '🍀',
      '✨',
      '⭐',
    ],
  },
  {
    id: 'fun',
    name: 'Fun',
    icon: 'sparkles-outline',
    emojis: [
      '🎉',
      '🎊',
      '🎈',
      '🎁',
      '🏆',
      '🥇',
      '🥈',
      '🥉',
      '⚽',
      '🏀',
      '🏈',
      '⚾',
      '🎾',
      '🏐',
      '🏉',
      '🎱',
      '🎮',
      '🎲',
      '🎯',
      '🎨',
      '🎭',
      '🎪',
      '🎤',
      '🎧',
      '🎼',
      '🎹',
      '🥁',
      '🎷',
      '🎺',
      '🎸',
      '🍿',
      '🎬',
      '🎳',
      '🏎️',
      '✈️',
      '🚀',
    ],
  },
  {
    id: 'food',
    name: 'Food',
    icon: 'fast-food-outline',
    emojis: [
      '🍕',
      '🍔',
      '🍟',
      '🌭',
      '🍿',
      '🥓',
      '🍳',
      '🧇',
      '🥞',
      '🧈',
      '🍞',
      '🥐',
      '🥨',
      '🥯',
      '🧀',
      '🥗',
      '☕',
      '🍵',
      '🧃',
      '🥤',
      '🧋',
      '🍺',
      '🍻',
      '🥂',
      '🍷',
      '🥃',
      '🍸',
      '🍹',
      '🍫',
      '🍬',
      '🍭',
      '🍩',
      '🍪',
      '🎂',
      '🍰',
      '🧁',
    ],
  },
];

const EmojiItem = memo(({ emoji, onSelect }: { emoji: string; onSelect: (e: string) => void }) => {
  return (
    <Pressable
      onPress={() => onSelect(emoji)}
      style={styles.emojiBtn}
      android_ripple={{ color: 'rgba(255,255,255,0.1)', borderless: true }}
    >
      <Text style={styles.emojiChar}>{emoji}</Text>
    </Pressable>
  );
});

EmojiItem.displayName = 'EmojiItem';

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  onSelectEmoji,
  onBackspace,
  onClose,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('quick');

  const selectedCat = CATEGORIES.find((c) => c.id === activeCategory) || CATEGORIES[0]!;

  const handleSelect = (emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectEmoji(emoji);
  };

  const handleBackspace = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBackspace?.();
  };

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={styles.container}
    >
      {/* Category selector row */}
      <View style={styles.topRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const isActive = cat.id === activeCategory;
            return (
              <Pressable
                key={cat.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveCategory(cat.id);
                }}
                style={[styles.categoryTab, isActive && styles.categoryTabActive]}
              >
                <Ionicons
                  name={cat.icon}
                  size={16}
                  color={isActive ? '#FFFFFF' : 'rgba(255,255,255,0.4)'}
                />
                <Text style={[styles.categoryTabText, isActive && styles.categoryTabTextActive]}>
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Backspace & Close Actions */}
        <View style={styles.actionsRow}>
          {onBackspace && (
            <Pressable
              onPress={handleBackspace}
              style={styles.iconActionBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="backspace-outline" size={20} color="rgba(255,255,255,0.7)" />
            </Pressable>
          )}
          {onClose && (
            <Pressable
              onPress={onClose}
              style={styles.iconActionBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.7)" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Grid of Emojis */}
      <ScrollView
        style={styles.emojiGridScroll}
        contentContainerStyle={styles.emojiGrid}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
      >
        {selectedCat.emojis.map((emoji, index) => (
          <EmojiItem
            key={`${selectedCat.id}-${emoji}-${index}`}
            emoji={emoji}
            onSelect={handleSelect}
          />
        ))}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 250,
    backgroundColor: '#121215',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  categoryScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingRight: spacing.sm,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  categoryTabActive: {
    backgroundColor: colors.primary,
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 4,
  },
  iconActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  emojiGridScroll: {
    flex: 1,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.sm,
    justifyContent: 'flex-start',
  },
  emojiBtn: {
    width: '12.5%', // 8 emojis per row
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  emojiChar: {
    fontSize: 26,
  },
});
