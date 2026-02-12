import { create } from 'zustand';
import { teamApi } from '../api';
import type { Team, TeamFormData, TeamsByTournament } from '../types';

interface TeamState {
  teamsByTournament: TeamsByTournament;
  isLoading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  createTeam: (data: TeamFormData) => Promise<void>;
  updateTeam: (data: TeamFormData) => Promise<void>;
  removeTeam: (id: number) => Promise<void>;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  teamsByTournament: {},
  isLoading: false,
  error: null,

  fetchAll: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await teamApi.getAll();
      set({ teamsByTournament: data, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  createTeam: async (data) => {
    await teamApi.create(data);
    await get().fetchAll();
  },

  updateTeam: async (data) => {
    await teamApi.update(data);
    await get().fetchAll();
  },

  removeTeam: async (id) => {
    await teamApi.remove(id);
    await get().fetchAll();
  },
}));
