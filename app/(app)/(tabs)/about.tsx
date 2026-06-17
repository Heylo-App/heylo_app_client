import { StyleSheet, View, ScrollView, Pressable, Alert } from 'react-native';
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

const PINK = '#FF2D55';
const PURPLE = '#7C3AED';
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
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

          {/* ── Profile Header ──────────────────────────────── */}
          <Animated.View entering={FadeIn.duration(600)} style={styles.profileHeader}>
            <View style={styles.avatarRing}>
              <Avatar avatarId={user.avatarId} alias={user.alias} size={100} />
            </View>
            <Heading level={1} style={styles.aliasText}>{user.alias}</Heading>
            <Text style={styles.sessionTag}>Current Session Identity</Text>

            {/* Stats Row */}
            <View style={styles.profileStatsRow}>
              <View style={styles.profileStat}>
                <Text style={styles.profileStatValue}>{user.reputation || 0}</Text>
                <Text style={styles.profileStatLabel}>Trust Score</Text>
              </View>
              <View style={styles.profileStatDivider} />
              <View style={styles.profileStat}>
                <Text style={styles.profileStatValue}>{user.mood || '—'}</Text>
                <Text style={styles.profileStatLabel}>Mood</Text>
              </View>
              <View style={styles.profileStatDivider} />
              <View style={styles.profileStat}>
                <Text style={styles.profileStatValue}>{user.age || '—'}</Text>
                <Text style={styles.profileStatLabel}>Age</Text>
              </View>
            </View>

            {/* Edit Profile Button */}
            <Pressable style={styles.editProfileBtn} onPress={() => alert('Edit Profile coming soon!')}>
              <Ionicons name="pencil" size={16} color={PINK} />
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </Pressable>
          </Animated.View>

          {/* ── Account Section ─────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(500).delay(150)}>
            <Text style={styles.sectionLabel}>ACCOUNT</Text>
            <View style={styles.menuCard}>
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
                iconColor={PURPLE}
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
                iconColor={PINK}
                label="Change Avatar"
                onPress={() => alert('Avatar picker coming soon!')}
              />
              <View style={styles.menuDivider} />
              <MenuRow
                icon="notifications-outline"
                iconColor={AMBER}
                label="Notifications"
                onPress={() => alert('Notification settings coming soon!')}
              />
              <View style={styles.menuDivider} />
              <MenuRow
                icon="moon-outline"
                iconColor={PURPLE}
                label="Appearance"
                value="Dark"
                onPress={() => alert('Appearance settings coming soon!')}
              />
              <View style={styles.menuDivider} />
              <MenuRow
                icon="volume-medium-outline"
                iconColor={BLUE}
                label="Sounds & Haptics"
                onPress={() => alert('Sound settings coming soon!')}
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
                iconColor={PINK}
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
                iconColor={PURPLE}
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
              <Ionicons name="log-out-outline" size={22} color={PINK} />
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
    paddingTop: spacing['2xl'],
    paddingBottom: 120,
    gap: spacing['2xl'],
  },

  // ── Profile Header ───────────────────────────────────────
  profileHeader: {
    alignItems: 'center',
  },
  avatarRing: {
    padding: 4,
    borderRadius: 56,
    borderWidth: 2.5,
    borderColor: PINK,
    marginBottom: spacing.lg,
  },
  aliasText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 6,
  },
  sessionTag: {
    fontSize: 13,
    fontWeight: '600',
    color: PINK,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing['2xl'],
  },
  profileStatsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    paddingVertical: spacing.lg,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: spacing.xl,
  },
  profileStat: {
    flex: 1,
    alignItems: 'center',
  },
  profileStatValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  profileStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: PINK,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '700',
    color: PINK,
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
    paddingVertical: spacing.lg,
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
    color: PINK,
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
    color: PINK,
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

