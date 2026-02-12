import { create } from 'zustand';
import { bracketApi } from '../api';
import type { BracketMatch, BracketMatchUpdateData, BracketFormat } from '../types';

interface BracketState {
  matches: BracketMatch[];
  isLoading: boolean;
  error: string | null;
  hasBracket: boolean;

  fetchByTournament: (tournamentId: number) => Promise<void>;
  generate: (tournamentId: number, format?: BracketFormat) => Promise<void>;
  updateMatch: (id: number, data: BracketMatchUpdateData) => Promise<void>;
  deleteBracket: (tournamentId: number) => Promise<void>;
  reset: () => void;
}

export const useBracketStore = create<BracketState>((set) => ({
  matches: [],
  isLoading: false,
  error: null,
  hasBracket: false,

  fetchByTournament: async (tournamentId) => {
    set({ isLoading: true, error: null });
    try {
      const matches = await bracketApi.getByTournament(tournamentId);
      set({ matches, isLoading: false, hasBracket: matches.length > 0 });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  generate: async (tournamentId, format = 'single') => {
    set({ isLoading: true, error: null });
    try {
      const matches = await bracketApi.generate(tournamentId, format);
      set({ matches, isLoading: false, hasBracket: true });
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  updateMatch: async (id, data) => {
    try {
      const updated = await bracketApi.updateMatch(id, data);
      const tournamentId = updated.tournament_id;
      const matches = await bracketApi.getByTournament(tournamentId);
      set({ matches, hasBracket: matches.length > 0 });
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  deleteBracket: async (tournamentId) => {
    set({ isLoading: true, error: null });
    try {
      await bracketApi.deleteByTournament(tournamentId);
      set({ matches: [], isLoading: false, hasBracket: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  reset: () => set({ matches: [], isLoading: false, error: null, hasBracket: false }),
}));
