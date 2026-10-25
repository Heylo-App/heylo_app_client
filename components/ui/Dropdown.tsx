import { memo, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { colors } from '@/theme/colors';
import { borderRadius, spacing } from '@/theme/spacing';

const BLUE = '#3B82F6';

export interface DropdownOption {
  label: string;
  value: string;
}

export interface DropdownProps {
  label?: string;
  placeholder?: string;
  value?: string;
  options: DropdownOption[];
  onSelect: (value: string) => void;
  error?: string;
  containerStyle?: ViewStyle;
  disabled?: boolean;
}

export const Dropdown = memo(function Dropdown({
  label,
  placeholder = 'Select an option',
  value,
  options,
  onSelect,
  error,
  containerStyle,
  disabled = false,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  const toggleDropdown = () => {
    if (disabled) return;
    Keyboard.dismiss();
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (optionValue: string) => {
    onSelect(optionValue);
    setIsOpen(false);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text variant="label">{label}</Text> : null}

      <Pressable
        accessibilityRole="combobox"
        accessibilityLabel={label}
        accessibilityState={{ expanded: isOpen }}
        disabled={disabled}
        onPress={toggleDropdown}
        style={[
          styles.trigger,
          isOpen && styles.triggerOpen,
          !!error && styles.triggerError,
          disabled && styles.triggerDisabled,
        ]}
      >
        <Text
          style={[styles.triggerText, !selectedOption && styles.placeholderText]}
          numberOfLines={1}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={isOpen ? BLUE : colors.foregroundMuted}
        />
      </Pressable>

      {isOpen && (
        <Animated.View
          entering={FadeInDown.duration(180)}
          exiting={FadeOut.duration(120)}
          style={styles.optionsContainer}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isLast = index === options.length - 1;

            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => handleSelect(option.value)}
                style={({ pressed }) => [
                  styles.optionItem,
                  isSelected && styles.optionItemSelected,
                  pressed && styles.optionItemPressed,
                  !isLast && styles.optionItemBorder,
                ]}
              >
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {option.label}
                </Text>

                {isSelected ? <Ionicons name="checkmark-circle" size={18} color={BLUE} /> : null}
              </Pressable>
            );
          })}
        </Animated.View>
      )}

      {error ? (
        <Text variant="caption" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  trigger: {
    height: 52,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerOpen: {
    borderColor: BLUE,
  },
  triggerError: {
    borderColor: colors.danger,
  },
  triggerDisabled: {
    opacity: 0.5,
  },
  triggerText: {
    fontSize: 16,
    color: colors.foreground,
  },
  placeholderText: {
    color: colors.muted,
  },
  optionsContainer: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginTop: 2,
  },
  optionItem: {
    height: 48,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionItemSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  optionItemPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  optionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  optionText: {
    fontSize: 15,
    color: colors.foregroundSecondary,
  },
  optionTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  error: {
    color: colors.danger,
  },
});
