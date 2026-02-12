import { create } from 'zustand';
import { regulationApi } from '../api';
import type { Regulation, RegulationFormData } from '../types';

interface RegulationState {
  regulations: Regulation[];
  isLoading: boolean;
  fetchAll: () => Promise<void>;
  createRegulation: (data: RegulationFormData) => Promise<void>;
  updateRegulation: (id: number, data: RegulationFormData) => Promise<void>;
  removeRegulation: (id: number) => Promise<void>;
}

export const useRegulationStore = create<RegulationState>((set, get) => ({
  regulations: [],
  isLoading: false,

  fetchAll: async () => {
    set({ isLoading: true });
    try {
      const data = await regulationApi.getAll();
      set({ regulations: data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  createRegulation: async (data) => {
    await regulationApi.create(data);
    await get().fetchAll();
  },

  updateRegulation: async (id, data) => {
    await regulationApi.update(id, data);
    await get().fetchAll();
  },

  removeRegulation: async (id) => {
    await regulationApi.remove(id);
    await get().fetchAll();
  },
}));
