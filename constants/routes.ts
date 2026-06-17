export const Routes = {
  root: '/',
  auth: {
    welcome: '/(auth)/welcome',
    login: '/(auth)/login',
    register: '/(auth)/register',
    verifyOtp: '/(auth)/verify-otp',
  },
  onboarding: {
    profileDetails: '/(onboarding)/profile-details',
    avatarMood: '/(onboarding)/avatar-mood',
  },
  app: {
    tabs: '/(app)/(tabs)',
    home: '/(app)/(tabs)/home',
    matching: '/(app)/(tabs)/matching',
    findingMatch: '/(app)/finding-match',
    chat: '/(app)/chat/[id]',
    about: '/(app)/(tabs)/about',
  },
} as const;
