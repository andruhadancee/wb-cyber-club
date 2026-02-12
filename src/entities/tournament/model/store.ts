import { create } from 'zustand';
import { tournamentApi } from '../api';
import type { Tournament, TournamentFormData } from '../types';

interface TournamentState {
  activeTournaments: Tournament[];
  pastTournaments: Tournament[];
  isLoading: boolean;
  error: string | null;
  fetchActive: (forceReload?: boolean) => Promise<void>;
  fetchPast: (forceReload?: boolean) => Promise<void>;
  createTournament: (data: TournamentFormData) => Promise<void>;
  updateTournament: (data: TournamentFormData) => Promise<void>;
  removeTournament: (id: number) => Promise<void>;
}

export const useTournamentStore = create<TournamentState>((set, get) => ({
  activeTournaments: [],
  pastTournaments: [],
  isLoading: false,
  error: null,

  fetchActive: async (forceReload = false) => {
    set({ isLoading: true, error: null });
    try {
      const data = await tournamentApi.getAll('active', forceReload);
      set({ activeTournaments: data, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  fetchPast: async (forceReload = false) => {
    set({ isLoading: true, error: null });
    try {
      const data = await tournamentApi.getAll('finished', forceReload);
      set({ pastTournaments: data, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  createTournament: async (data) => {
    await tournamentApi.create(data);
    if (data.status === 'finished') {
      await get().fetchPast(true);
    } else {
      await get().fetchActive(true);
    }
  },

  updateTournament: async (data) => {
    await tournamentApi.update(data);
    if (data.status === 'finished') {
      await get().fetchPast(true);
    }
    await get().fetchActive(true);
  },

  removeTournament: async (id) => {
    await tournamentApi.remove(id);
    await get().fetchActive(true);
    await get().fetchPast(true);
  },
}));
