import { create } from 'zustand';
import { ConnectRequestPayload } from '@/services/socket.service';

interface ConnectionState {
  incomingRequests: ConnectRequestPayload[];
  activeRequest: ConnectRequestPayload | null;
  addRequest: (request: ConnectRequestPayload) => void;
  removeRequest: (requestId: string) => void;
  clearRequests: () => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  incomingRequests: [],
  activeRequest: null,

  addRequest: (request) =>
    set((state) => {
      // Avoid duplicate requests
      const filtered = state.incomingRequests.filter((r) => r.id !== request.id);
      const next = [request, ...filtered];
      return {
        incomingRequests: next,
        activeRequest: next[0] || null,
      };
    }),

  removeRequest: (requestId) =>
    set((state) => {
      const next = state.incomingRequests.filter((r) => r.id !== requestId);
      return {
        incomingRequests: next,
        activeRequest: next[0] || null,
      };
    }),

  clearRequests: () =>
    set({
      incomingRequests: [],
      activeRequest: null,
    }),
}));
