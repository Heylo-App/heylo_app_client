import { useEffect } from 'react';
import { StyleSheet, View, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { FadeIn, Easing, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, runOnJS, interpolate, withDelay } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Text, Heading } from '@/components/ui/Text';
import { Routes } from '@/constants/routes';
import { spacing } from '@/theme/spacing';
import { colors } from '@/theme/colors';

const { width } = Dimensions.get('window');

export default function MatchingScreen() {
  const router = useRouter();

  const handleStartSearch = () => {
    router.push({ pathname: Routes.app.findingMatch, params: { mood: 'any' } });
  };

  // Slide button logic
  const SLIDE_DISTANCE = width - spacing['2xl'] * 2 - 56 - spacing.sm * 2;
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((event) => {
      let newVal = startX.value + event.translationX;
      if (newVal < 0) newVal = 0;
      if (newVal > SLIDE_DISTANCE) newVal = SLIDE_DISTANCE;
      translateX.value = newVal;
    })
    .onEnd(() => {
      if (translateX.value > SLIDE_DISTANCE * 0.8) {
        translateX.value = withTiming(SLIDE_DISTANCE, {}, (finished) => {
          if (finished) {
            runOnJS(handleStartSearch)();
            translateX.value = withDelay(400, withTiming(0, { duration: 300 }));
          }
        });
      } else {
        translateX.value = withTiming(0);
      }
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Subtle floating animations for the cards and icons
  const float1 = useSharedValue(0);
  const float2 = useSharedValue(0);
  const chevronAnim = useSharedValue(0);

  useEffect(() => {
    float1.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    float2.value = withRepeat(
      withSequence(
        withTiming(8, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(-8, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    chevronAnim.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const getChevronStyle = (index: number) => {
    return useAnimatedStyle(() => {
      // Offset each chevron's animation phase so they light up sequentially
      const phase = (chevronAnim.value - index * 0.2 + 1) % 1;
      return {
        opacity: interpolate(phase, [0, 0.5, 1], [0.1, 1, 0.1]),
        transform: [{ translateX: interpolate(phase, [0, 1], [0, 10]) }]
      };
    });
  };

  const chevronStyle1 = getChevronStyle(0);
  const chevronStyle2 = getChevronStyle(1);
  const chevronStyle3 = getChevronStyle(2);

  const animatedStyle1 = useAnimatedStyle(() => ({ transform: [{ translateY: float1.value }, { rotate: '-12deg' }] }));
  const animatedStyle2 = useAnimatedStyle(() => ({ transform: [{ translateY: float2.value }, { rotate: '15deg' }] }));

  return (
    <GestureHandlerRootView style={styles.mainContainer}>
      <LinearGradient
        colors={['#18181B', '#000000']}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          
          {/* Top Title */}
          <Animated.View entering={FadeIn.duration(600).easing(Easing.out(Easing.quad))} style={styles.header}>
            <Heading level={1} style={styles.mainTitle}>Heylo</Heading>
          </Animated.View>

          {/* Hero Cards Area */}
          <Animated.View entering={FadeIn.duration(800).delay(200)} style={styles.heroArea}>
            
            {/* Left Card */}
            <Animated.View style={[styles.card, styles.leftCard, animatedStyle1]}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80' }} 
                style={styles.cardImage} 
              />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.cardGradientOverlay} />
            </Animated.View>

            {/* Right Card */}
            <Animated.View style={[styles.card, styles.rightCard, animatedStyle2]}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80' }} 
                style={styles.cardImage} 
              />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.cardGradientOverlay} />
            </Animated.View>

            {/* Floating Badges */}
            <View style={[styles.floatingBadge, styles.badgeTop]}>
              <Ionicons name="heart" size={24} color="white" />
            </View>
            <View style={[styles.floatingBadge, styles.badgeLeft]}>
              <Ionicons name="chatbubble-ellipses" size={24} color="white" />
            </View>
            <View style={[styles.floatingBadge, styles.badgeRight]}>
              <Ionicons name="gift" size={24} color="white" />
            </View>

          </Animated.View>

          {/* Typography */}
          <Animated.View entering={FadeIn.duration(600).delay(400)} style={styles.textSection}>
            <Text style={styles.discoverText}>
              Discover Real People{'\n'}
              <Text style={styles.highlightText}>Match</Text> Instantly
            </Text>
            <Text style={styles.subtitleText}>
              Like profiles you're interested in and get matched instantly when the feeling is mutual.
            </Text>
          </Animated.View>

          {/* Bottom Action Button */}
          <Animated.View entering={FadeIn.duration(600).delay(600)} style={styles.actionSection}>
            <View style={styles.customButton}>
              <Text style={styles.buttonText}>Slide to Find Match</Text>
              
              <View style={styles.chevronGroup}>
                <Animated.View style={chevronStyle1}>
                  <Ionicons name="chevron-forward-outline" size={20} color="white" />
                </Animated.View>
                <Animated.View style={[chevronStyle2, { marginLeft: -10 }]}>
                  <Ionicons name="chevron-forward-outline" size={20} color="white" />
                </Animated.View>
                <Animated.View style={[chevronStyle3, { marginLeft: -10 }]}>
                  <Ionicons name="chevron-forward-outline" size={20} color="white" />
                </Animated.View>
              </View>

              <GestureDetector gesture={panGesture}>
                <Animated.View style={[styles.buttonIconCircle, thumbStyle]}>
                  <Ionicons name="heart" size={24} color="white" />
                </Animated.View>
              </GestureDetector>
            </View>
          </Animated.View>

        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const PINK_ACCENT = '#FF2D55';
const CARD_WIDTH = width * 0.45;
const CARD_HEIGHT = CARD_WIDTH * 1.3;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['4xl'],
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: spacing['2xl'],
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 1,
  },
  heroArea: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing['2xl'],
    marginBottom: spacing['2xl'],
  },
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  cardGradient: {
    flex: 1,
  },
  cardImage: { 
    flex: 1, 
    width: '100%', 
    height: '100%', 
    resizeMode: 'cover' 
  },
  cardGradientOverlay: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    height: '40%' 
  },
  leftCard: {
    left: '10%',
    zIndex: 1,
  },
  rightCard: {
    right: '10%',
    zIndex: 2,
    marginTop: 40,
  },
  floatingBadge: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  badgeTop: {
    top: '10%',
    right: '35%',
    backgroundColor: PINK_ACCENT,
  },
  badgeLeft: {
    bottom: '25%',
    left: '10%',
    backgroundColor: '#7C3AED', // Purple
  },
  badgeRight: {
    bottom: '15%',
    right: '15%',
    backgroundColor: '#3B82F6', // Blue
  },
  textSection: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  discoverText: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
    lineHeight: 40,
  },
  highlightText: {
    color: PINK_ACCENT,
  },
  subtitleText: {
    marginTop: spacing.xl,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
  },
  actionSection: {
    width: '100%',
    alignItems: 'center',
  },
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    width: '100%',
    height: 72,
    borderRadius: 36,
    paddingHorizontal: spacing.sm,
    position: 'relative',
    overflow: 'hidden',
  },
  buttonIconCircle: {
    position: 'absolute',
    left: spacing.sm,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PINK_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  buttonText: {
    flex: 1,
    textAlign: 'center',
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
    zIndex: 1,
  },
  chevronGroup: {
    position: 'absolute',
    right: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
});
