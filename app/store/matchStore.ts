import { create } from 'zustand';
import type { Candidate, LikeReceived, MatchRecord, SwipeDirection } from '../types';
import {
  loadDismissedMessageMatchIds,
  saveDismissedMessageMatchIds,
} from '../services/inboxStorage';
import {
  applyBoost,
  canSwipe,
  fetchCandidates,
  getMatches,
  getWhoLikedMe,
  recordSwipe,
  resetDiscover as resetDiscoverService,
} from '../services/matchService';

interface MatchState {
  candidates: Candidate[];
  matches: MatchRecord[];
  likesReceived: LikeReceived[];
  dismissedMessageMatchIds: string[];
  inboxUserId: string | null;
  likesRemaining: number;
  isPremium: boolean;
  isLoading: boolean;
  lastMatchId: string | null;
  showMatchModal: boolean;
  matchedUser: Candidate | null;
  error: string | null;
  loadCandidates: (userId: string, radiusMi: number) => Promise<void>;
  loadMatches: (userId: string) => Promise<void>;
  loadLikesReceived: (userId: string) => Promise<void>;
  dismissFromMessagesInbox: (matchId: string) => void;
  restoreToMessagesInbox: (matchId: string) => void;
  checkSwipeLimit: (userId: string) => Promise<boolean>;
  swipe: (
    userId: string,
    candidate: Candidate,
    direction: SwipeDirection,
  ) => Promise<void>;
  dismissMatchModal: () => void;
  triggerBoost: (userId: string) => Promise<void>;
  resetDiscover: (userId: string) => Promise<void>;
  clear: () => void;
}

export const useMatchStore = create<MatchState>((set, get) => ({
  candidates: [],
  matches: [],
  likesReceived: [],
  dismissedMessageMatchIds: [],
  inboxUserId: null,
  likesRemaining: 20,
  isPremium: false,
  isLoading: false,
  lastMatchId: null,
  showMatchModal: false,
  matchedUser: null,
  error: null,

  loadCandidates: async (userId, radiusMi) => {
    set({ isLoading: true, error: null });
    try {
      const candidates = await fetchCandidates(userId, radiusMi);
      set({ candidates, isLoading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : 'Failed to load candidates',
        isLoading: false,
      });
    }
  },

  loadMatches: async (userId) => {
    try {
      const [matches, dismissedMessageMatchIds] = await Promise.all([
        getMatches(userId),
        loadDismissedMessageMatchIds(userId),
      ]);
      set({ matches, dismissedMessageMatchIds, inboxUserId: userId });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : 'Failed to load matches',
      });
    }
  },

  loadLikesReceived: async (userId) => {
    try {
      const likesReceived = await getWhoLikedMe(userId);
      set({ likesReceived });
    } catch {
      set({ likesReceived: [] });
    }
  },

  dismissFromMessagesInbox: (matchId) => {
    set((state) => {
      if (state.dismissedMessageMatchIds.includes(matchId)) {
        return state;
      }

      const dismissedMessageMatchIds = [...state.dismissedMessageMatchIds, matchId];

      if (state.inboxUserId) {
        saveDismissedMessageMatchIds(state.inboxUserId, dismissedMessageMatchIds).catch(() => {});
      }

      return { dismissedMessageMatchIds };
    });
  },

  restoreToMessagesInbox: (matchId) => {
    set((state) => {
      const dismissedMessageMatchIds = state.dismissedMessageMatchIds.filter(
        (id) => id !== matchId,
      );

      if (state.inboxUserId) {
        saveDismissedMessageMatchIds(state.inboxUserId, dismissedMessageMatchIds).catch(() => {});
      }

      return { dismissedMessageMatchIds };
    });
  },

  checkSwipeLimit: async (userId) => {
    const result = await canSwipe(userId);
    set({
      likesRemaining: result.remaining === Infinity ? 999 : result.remaining,
      isPremium: result.isPremium,
    });
    return result.allowed;
  },

  swipe: async (userId, candidate, direction) => {
    const allowed = await get().checkSwipeLimit(userId);
    if (!allowed && (direction === 'like' || direction === 'super_like')) {
      throw new Error('Daily like limit reached');
    }

    const result = await recordSwipe(userId, candidate.id, direction);

    set((state) => ({
      candidates: state.candidates.filter((c) => c.id !== candidate.id),
      showMatchModal: result.matched,
      matchedUser: result.matched ? candidate : null,
      lastMatchId: result.matchId ?? null,
    }));

    if (result.matched) {
      await get().loadMatches(userId);
    }

    await get().checkSwipeLimit(userId);
  },

  dismissMatchModal: () =>
    set({ showMatchModal: false, matchedUser: null, lastMatchId: null }),

  triggerBoost: async (userId) => {
    await applyBoost(userId);
  },

  resetDiscover: async (userId) => {
    await resetDiscoverService(userId);
    set({
      candidates: [],
      matches: [],
      showMatchModal: false,
      matchedUser: null,
      lastMatchId: null,
    });
    await get().checkSwipeLimit(userId);
  },

  clear: () =>
    set({
      candidates: [],
      matches: [],
      likesReceived: [],
      dismissedMessageMatchIds: [],
      inboxUserId: null,
      showMatchModal: false,
      matchedUser: null,
      error: null,
    }),
}));
