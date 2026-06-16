import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const env = {
  apiUrl: (extra.apiUrl as string) ?? process.env.EXPO_PUBLIC_API_URL ?? 'https://api.heylo.app',
  supabaseUrl: (extra.supabaseUrl as string) ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey:
    (extra.supabaseAnonKey as string) ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  socketUrl: (extra.socketUrl as string) ?? process.env.EXPO_PUBLIC_SOCKET_URL ?? '',
  agoraAppId: (extra.agoraAppId as string) ?? process.env.EXPO_PUBLIC_AGORA_APP_ID ?? '',
  livekitUrl: (extra.livekitUrl as string) ?? process.env.EXPO_PUBLIC_LIVEKIT_URL ?? '',
  useMockApi: (extra.useMockApi as boolean) ?? process.env.EXPO_PUBLIC_USE_MOCK_API === 'true',
  isDev: __DEV__,
} as const;
