import { StyleSheet, View, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, Easing } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Avatar } from '@/components/ui/Avatar';
import { Text, Heading } from '@/components/ui/Text';
import { useAuthStore } from '@/store/auth.store';
import { useLogout } from '@/hooks/useAuth';
import { spacing } from '@/theme/spacing';
import { colors } from '@/theme/colors';

const BLUE = '#3B82F6';
const EMERALD = '#10B981';
const AMBER = '#F59E0B';

// ── Menu Row Component ─────────────────────────────────────────
const MenuRow = ({
  icon,
  iconColor,
  label,
  value,
  onPress,
  showChevron = true,
  danger = false,
}: {
  icon: any;
  iconColor: string;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  danger?: boolean;
}) => (
  <Pressable style={styles.menuRow} onPress={onPress}>
    <View style={[styles.menuIconBg, { backgroundColor: `${iconColor}18` }]}>
      <Ionicons name={icon} size={20} color={iconColor} />
    </View>
    <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
    <View style={styles.menuRight}>
      {value ? <Text style={styles.menuValue}>{value}</Text> : null}
      {showChevron && <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.2)" />}
    </View>
  </Pressable>
);

// ════════════════════════════════════════════════════════════════
export default function AboutScreen() {
  const { user } = useAuthStore();
  const logout = useLogout();
  const router = useRouter();

  if (!user) return null;

  const handleLogout = () => {
    Alert.alert(
      'End Session',
      'This will destroy your current alias and disconnect you completely. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => logout.mutate() },
      ]
    );
  };

  return (
    <View style={styles.mainContainer}>
      <LinearGradient
        colors={['#18181B', '#000000']}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

          {/* ── Profile Header ──────────────────────────────── */}
          <Animated.View entering={FadeIn.duration(600)} style={styles.profileHeader}>
            <Pressable style={styles.topRightEditBtn} onPress={() => alert('Edit Profile coming soon!')}>
              <Ionicons name="pencil" size={16} color="rgba(255,255,255,0.8)" />
            </Pressable>

            <View style={styles.avatarRing}>
              <Avatar avatarId={user.avatarId} alias={user.alias} size={84} />
            </View>
            <Heading level={1} style={styles.aliasText}>{user.alias}</Heading>
          </Animated.View>

          {/* ── Account Section ─────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(500).delay(150)}>
            <Text style={styles.sectionLabel}>ACCOUNT</Text>
            <View style={styles.menuCard}>
              <MenuRow
                icon="heart-outline"
                iconColor={colors.primary}
                label="Anonymous Feedbacks"
                value="3 New"
                onPress={() => router.push('/(app)/feedbacks')}
              />
              <View style={styles.menuDivider} />
              <MenuRow
                icon="person-outline"
                iconColor={BLUE}
                label="Username"
                value={`@${user.alias?.toLowerCase().replace(/\s/g, '') || 'anon'}`}
                showChevron={false}
              />
              <View style={styles.menuDivider} />
              <MenuRow
                icon="language-outline"
                iconColor={colors.primary}
                label="Language"
                value={user.language || 'Any'}
                onPress={() => alert('Language settings coming soon!')}
              />
              <View style={styles.menuDivider} />
              <MenuRow
                icon="sparkles-outline"
                iconColor={AMBER}
                label="Current Mood"
                value={user.mood || 'Not set'}
                onPress={() => alert('Mood picker coming soon!')}
              />
            </View>
          </Animated.View>

          {/* ── Preferences Section ─────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(500).delay(250)}>
            <Text style={styles.sectionLabel}>PREFERENCES</Text>
            <View style={styles.menuCard}>
              <MenuRow
                icon="color-palette-outline"
                iconColor={colors.primary}
                label="Change Avatar"
                onPress={() => alert('Avatar picker coming soon!')}
              />
              <View style={styles.menuDivider} />
              <MenuRow
                icon="moon-outline"
                iconColor={colors.primary}
                label="Appearance"
                value="Dark"
                onPress={() => alert('Appearance settings coming soon!')}
              />
            </View>
          </Animated.View>

          {/* ── Privacy & Safety Section ─────────────────────── */}
          <Animated.View entering={FadeInDown.duration(500).delay(350)}>
            <Text style={styles.sectionLabel}>PRIVACY & SAFETY</Text>
            <View style={styles.menuCard}>
              <MenuRow
                icon="shield-checkmark-outline"
                iconColor={EMERALD}
                label="Privacy Policy"
                onPress={() => alert('Privacy Policy coming soon!')}
              />
              <View style={styles.menuDivider} />
              <MenuRow
                icon="lock-closed-outline"
                iconColor={BLUE}
                label="Blocked Users"
                value="0"
                onPress={() => alert('Blocked users list coming soon!')}
              />
              <View style={styles.menuDivider} />
              <MenuRow
                icon="flag-outline"
                iconColor={AMBER}
                label="Report a Problem"
                onPress={() => alert('Report form coming soon!')}
              />
              <View style={styles.menuDivider} />
              <MenuRow
                icon="trash-outline"
                iconColor={colors.primary}
                label="Delete Account"
                onPress={() => Alert.alert('Delete Account', 'This will permanently erase your data. This action cannot be undone.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => alert('Account deletion coming soon!') },
                ])}
              />
            </View>
          </Animated.View>

          {/* ── About Section ───────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(500).delay(450)}>
            <Text style={styles.sectionLabel}>ABOUT</Text>
            <View style={styles.menuCard}>
              <MenuRow
                icon="help-circle-outline"
                iconColor={BLUE}
                label="Help & Support"
                onPress={() => alert('Help center coming soon!')}
              />
              <View style={styles.menuDivider} />
              <MenuRow
                icon="star-outline"
                iconColor={AMBER}
                label="Rate Heylo"
                onPress={() => alert('Rate on App Store coming soon!')}
              />
              <View style={styles.menuDivider} />
              <MenuRow
                icon="share-social-outline"
                iconColor={colors.primary}
                label="Share Heylo"
                onPress={() => alert('Share link coming soon!')}
              />
              <View style={styles.menuDivider} />
              <MenuRow
                icon="document-text-outline"
                iconColor="rgba(255,255,255,0.5)"
                label="Terms of Service"
                onPress={() => alert('Terms coming soon!')}
              />
              <View style={styles.menuDivider} />
              <MenuRow
                icon="information-circle-outline"
                iconColor="rgba(255,255,255,0.5)"
                label="Version"
                value="1.0.0"
                showChevron={false}
              />
            </View>
          </Animated.View>

          {/* ── Logout Button ───────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(500).delay(550)}>
            <Pressable style={styles.logoutCard} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color={colors.primary} />
              <Text style={styles.logoutText}>End Session & Log Out</Text>
            </Pressable>
          </Animated.View>

          {/* ── Footer ──────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(500).delay(600)} style={styles.footer}>
            <Text style={styles.footerText}>Made with 💜 for real connections</Text>
            <Text style={styles.footerVersion}>Heylo v1.0.0</Text>
          </Animated.View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.xs,
    paddingBottom: 120,
    gap: spacing.md,
  },
  
  // ── Top Bar ────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Profile Header ───────────────────────────────────────
  profileHeader: {
    alignItems: 'center',
  },
  avatarRing: {
    padding: 3,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: colors.primary,
    marginBottom: spacing.sm,
  },
  aliasText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 6,
  },
  topRightEditBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },

  // ── Section Labels ───────────────────────────────────────
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1.5,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },

  // ── Menu Card ────────────────────────────────────────────
  menuCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  menuIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  menuLabelDanger: {
    color: colors.primary,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  menuValue: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'capitalize',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginLeft: 60,
  },

  // ── Logout ───────────────────────────────────────────────
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(255,45,85,0.08)',
    borderRadius: 22,
    paddingVertical: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,45,85,0.15)',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },

  // ── Footer ───────────────────────────────────────────────
  footer: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    gap: spacing.xs,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.3)',
  },
  footerVersion: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.15)',
  },
});

