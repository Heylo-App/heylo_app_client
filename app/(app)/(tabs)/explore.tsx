import { StyleSheet, View, FlatList, Pressable, Switch, TextInput, Dimensions } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';

import { Text, Heading } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { MoodChip } from '@/components/ui/MoodChip';
import { Button } from '@/components/ui/Button';
import { PulseDot } from '@/components/ui/PulseDot';
import { MOOD_OPTIONS, MoodType } from '@/constants/moods';
import { useAuthStore } from '@/store/auth.store';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

const PINK_ACCENT = '#FF2D55';
const { height } = Dimensions.get('window');

const MOCK_PROFILES = [
  { id: '1', alias: 'Luna', avatarId: 'avatar-4', moodId: 'excited', vibe: 'Looking for someone to chat about space and stars 🌌' },
  { id: '2', alias: 'Shadow', avatarId: 'avatar-7', moodId: 'reflective', vibe: 'Deep conversations about life and books 📚' },
  { id: '3', alias: 'Nova', avatarId: 'avatar-2', moodId: 'happy', vibe: 'Just chilling, want to listen to some music together 🎵' },
  { id: '4', alias: 'Zephyr', avatarId: 'avatar-9', moodId: 'calm', vibe: 'Need a quiet space to co-work ☕' },
  { id: '5', alias: 'Echo', avatarId: 'avatar-5', moodId: 'hopeful', vibe: "Excited about the future, let's share dreams ✨" },
];

const MOCK_REQUESTS = [
  { id: 'req1', alias: 'Orion', avatarId: 'avatar-8', moodId: 'lonely', message: 'Hey, saw your vibe and would love to connect!' },
  { id: 'req2', alias: 'Lyra', avatarId: 'avatar-3', moodId: 'happy', message: 'Music sounds great right now!' },
];

export default function ExploreScreen() {
  const { user } = useAuthStore();
  
  // States
  const [isActive, setIsActive] = useState(false);
  const [showActiveSetup, setShowActiveSetup] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  
  // Setup forms
  const [myMood, setMyMood] = useState<MoodType | null>(null);
  const [myVibe, setMyVibe] = useState('');
  
  // Active state profile
  const [activeProfile, setActiveProfile] = useState<{ moodId: MoodType, vibe: string } | null>(null);

  const handleToggleActive = (val: boolean) => {
    if (val) {
      setShowActiveSetup(true);
    } else {
      setIsActive(false);
      setActiveProfile(null);
    }
  };

  const handleMakeActive = () => {
    if (myMood && myVibe) {
      setActiveProfile({ moodId: myMood, vibe: myVibe });
      setIsActive(true);
      setShowActiveSetup(false);
    } else {
      alert('Please select a mood and enter a vibe.');
    }
  };

  const handleRequestJoin = (profileId: string) => {
    alert('Match request sent!');
  };

  const renderActiveDashboard = () => {
    if (!activeProfile) return null;
    const mood = MOOD_OPTIONS.find((m) => m.id === activeProfile.moodId) || MOOD_OPTIONS[0];

    return (
      <Animated.View entering={FadeInDown.duration(600)} style={styles.dashboardCard}>
        <LinearGradient 
          colors={['rgba(255, 45, 85, 0.12)', 'rgba(255, 45, 85, 0.03)']} 
          style={StyleSheet.absoluteFillObject} 
        />
        <View style={styles.dashboardInner}>
          <View style={styles.cardTopRow}>
            <Avatar avatarId={user?.avatarId || 'avatar-1'} alias={user?.alias} size={44} />
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Heading level={3} style={styles.alias}>{user?.alias || 'Me'}</Heading>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <PulseDot color={PINK_ACCENT} />
                <Text style={styles.dashStatusText}>Active & Visible</Text>
              </View>
            </View>
          </View>

          <Text style={styles.vibeText}>"{activeProfile.vibe}"</Text>

          <Pressable onPress={() => setShowRequests(true)} style={styles.dashRequestsBtn}>
            <LinearGradient
              colors={[PINK_ACCENT, '#E11D48']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.dashRequestsGradient}
            >
              <Text style={styles.dashRequestsText}>View Requests</Text>
              {MOCK_REQUESTS.length > 0 && (
                <View style={styles.dashRequestsBadge}>
                  <Text style={styles.dashRequestsBadgeText}>{MOCK_REQUESTS.length}</Text>
                </View>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </Animated.View>
    );
  };

  const renderProfileCard = ({ item, index }: { item: typeof MOCK_PROFILES[0], index: number }) => {
    const mood = MOOD_OPTIONS.find((m) => m.id === item.moodId) || MOOD_OPTIONS[0];

    return (
      <Animated.View entering={FadeInDown.duration(500).delay(index * 50)} style={styles.card}>
        <View style={styles.cardTopRow}>
          <Avatar avatarId={item.avatarId} alias={item.alias} size={44} />
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Heading level={3} style={styles.alias}>{item.alias}</Heading>
            <Text style={styles.cardMoodLabel}>{mood.label} {mood.emoji}</Text>
          </View>
        </View>

        <Text style={styles.vibeText}>"{item.vibe}"</Text>

        <View style={styles.cardActions}>
          <Pressable style={styles.skipBtn} onPress={() => alert('Skipped')}>
            <Text style={styles.skipBtnText}>Skip</Text>
          </Pressable>
          <Pressable onPress={() => handleRequestJoin(item.id)} style={styles.connectBtn}>
            <Text style={styles.connectBtnText}>Connect</Text>
          </Pressable>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <LinearGradient colors={['#18181B', '#000000']} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
          <View style={styles.headerTop}>
            <Heading level={1} style={styles.title}>Explore</Heading>
            
            <View style={styles.headerRight}>
              {/* Active Toggle */}
              <View style={styles.activeToggleContainer}>
                <Text style={styles.activeToggleLabel}>Active</Text>
                <Switch
                  value={isActive}
                  onValueChange={handleToggleActive}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: PINK_ACCENT }}
                  thumbColor={colors.white}
                  ios_backgroundColor="rgba(255,255,255,0.2)"
                  style={{ transform: [{ scale: 0.75 }] }}
                />
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Feed */}
        <FlatList
          data={MOCK_PROFILES}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderActiveDashboard}
          renderItem={renderProfileCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>

      {/* Setup Active Modal */}
      {showActiveSetup && (
        <Animated.View entering={SlideInDown.duration(400).springify()} exiting={SlideOutDown.duration(300)} style={styles.overlayWrapper}>
          <BlurView intensity={80} tint="dark" style={styles.overlay}>
            <Pressable style={styles.overlayClose} onPress={() => setShowActiveSetup(false)} />
            <View style={styles.sheetContent}>
              <View style={styles.sheetHandle} />
              <Heading level={2} style={styles.sheetTitle}>Go Active</Heading>
              <Text style={styles.sheetSubtitle}>Let others know what vibe you're bringing.</Text>
              
              <Text style={styles.inputLabel}>SELECT YOUR MOOD</Text>
              <View style={styles.moodGrid}>
                {MOOD_OPTIONS.map((mood) => (
                  <MoodChip
                    key={mood.id}
                    mood={mood}
                    selected={myMood === mood.id}
                    onPress={(id) => setMyMood(id as MoodType)}
                  />
                ))}
              </View>

              <Text style={styles.inputLabel}>YOUR VIBE</Text>
              <TextInput
                style={styles.textInput}
                placeholder="What are you looking for right now?"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={myVibe}
                onChangeText={setMyVibe}
                maxLength={60}
              />
              
              <Button
                title="Make me Active"
                size="lg"
                onPress={handleMakeActive}
                style={{ width: '100%', marginTop: spacing.md }}
              />
            </View>
          </BlurView>
        </Animated.View>
      )}

      {/* Requests Modal */}
      {showRequests && (
        <Animated.View entering={SlideInDown.duration(400).springify()} exiting={SlideOutDown.duration(300)} style={styles.overlayWrapper}>
          <BlurView intensity={80} tint="dark" style={styles.overlay}>
            <Pressable style={styles.overlayClose} onPress={() => setShowRequests(false)} />
            <View style={[styles.sheetContent, { maxHeight: height * 0.85 }]}>
              <View style={styles.sheetHandle} />
              <Heading level={2} style={styles.sheetTitle}>Requests</Heading>
              <Text style={styles.sheetSubtitle}>People who want to match with you</Text>
              
              <FlatList
                data={MOCK_REQUESTS}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing['4xl'] }}
                renderItem={({ item }) => {
                  const mood = MOOD_OPTIONS.find((m) => m.id === item.moodId) || MOOD_OPTIONS[0];
                  return (
                    <View style={styles.requestCard}>
                      <View style={styles.requestTopRow}>
                        <Avatar avatarId={item.avatarId} alias={item.alias} size={40} />
                        <View style={{ flex: 1, marginLeft: spacing.sm }}>
                          <Heading level={3} style={{ fontSize: 16, color: 'white' }}>{item.alias}</Heading>
                          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{mood.label} {mood.emoji}</Text>
                        </View>
                      </View>
                      <Text style={styles.requestMsg}>"{item.message}"</Text>
                      <View style={styles.requestActions}>
                        <Pressable onPress={() => alert('Declined')} style={styles.reqBtnDecline}>
                          <Text style={styles.reqBtnDeclineText}>Decline</Text>
                        </Pressable>
                        <Pressable onPress={() => alert('Accepted! Redirecting to chat...')} style={styles.reqBtnAccept}>
                          <Text style={styles.reqBtnAcceptText}>Accept</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                }}
              />
            </View>
          </BlurView>
        </Animated.View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  activeToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingLeft: spacing.md,
    paddingRight: 4,
    paddingVertical: 4,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  activeToggleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: spacing['2xl'],
    paddingBottom: 120,
    gap: spacing.lg,
  },
  
  // Active Dashboard Layout
  dashboardCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 45, 85, 0.3)',
    marginBottom: spacing.md,
  },
  dashboardInner: {
    padding: spacing.lg,
  },
  dashStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: PINK_ACCENT,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dashRequestsBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  dashRequestsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: spacing.sm,
  },
  dashRequestsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  dashRequestsBadge: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 4,
  },
  dashRequestsBadgeText: {
    color: PINK_ACCENT,
    fontSize: 12,
    fontWeight: '800',
  },

  // Standard Profile Card
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  alias: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
  },
  cardMoodLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 1,
  },
  vibeText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
    lineHeight: 21,
    marginBottom: spacing.md,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  skipBtn: {
    flex: 1,
    paddingVertical: 11,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    alignItems: 'center',
  },
  skipBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  connectBtn: {
    flex: 1,
    paddingVertical: 11,
    backgroundColor: PINK_ACCENT,
    borderRadius: 12,
    alignItems: 'center',
  },
  connectBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },

  // Overlays
  overlayWrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayClose: {
    flex: 1,
  },
  sheetContent: {
    backgroundColor: '#18181B',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.md,
    paddingBottom: spacing['4xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  sheetSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: spacing['2xl'],
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: spacing.lg,
    color: 'white',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: spacing.xl,
  },

  // Request Cards
  requestCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  requestTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  requestMsg: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  reqBtnDecline: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    alignItems: 'center',
  },
  reqBtnDeclineText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  reqBtnAccept: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: PINK_ACCENT,
    borderRadius: 12,
    alignItems: 'center',
  },
  reqBtnAcceptText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
});
