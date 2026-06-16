export const endpoints = {
  auth: {
    sendOtp: '/auth/otp/send',
    verifyOtp: '/auth/otp/verify',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  users: {
    suggested: '/users/suggested',
    profile: (id: string) => `/users/${id}`,
    updateMood: '/users/mood',
  },
  moments: {
    list: '/moments',
    create: '/moments',
    like: (id: string) => `/moments/${id}/like`,
    detail: (id: string) => `/moments/${id}`,
  },
  chats: {
    list: '/chats',
    messages: (id: string) => `/chats/${id}/messages`,
    send: (id: string) => `/chats/${id}/messages`,
  },
  voice: {
    rooms: '/voice/rooms',
    join: (id: string) => `/voice/rooms/${id}/join`,
    leave: (id: string) => `/voice/rooms/${id}/leave`,
    token: (id: string) => `/voice/rooms/${id}/token`,
  },
  moderation: {
    report: '/moderation/report',
    actions: '/moderation/actions',
  },
  onboarding: '/onboarding/complete',
} as const;
