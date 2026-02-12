import { create } from 'zustand';
import { disciplineApi } from '../api';
import type { Discipline } from '../types';

interface DisciplineState {
  disciplines: Discipline[];
  colorsMap: Record<string, string | null>;
  isLoading: boolean;
  fetchAll: () => Promise<void>;
  createDiscipline: (name: string, color?: string | null) => Promise<void>;
  updateDiscipline: (id: number, data: Partial<Pick<Discipline, 'name' | 'color'>>) => Promise<void>;
  removeDiscipline: (name: string) => Promise<void>;
}

export const useDisciplineStore = create<DisciplineState>((set, get) => ({
  disciplines: [],
  colorsMap: {},
  isLoading: false,

  fetchAll: async () => {
    set({ isLoading: true });
    try {
      const data = await disciplineApi.getAll();
      const colorsMap: Record<string, string | null> = {};
      data.forEach((d) => {
        colorsMap[d.name] = d.color;
      });
      set({ disciplines: data, colorsMap, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  createDiscipline: async (name, color) => {
    await disciplineApi.create(name, color);
    await get().fetchAll();
  },

  updateDiscipline: async (id, data) => {
    await disciplineApi.update(id, data);
    await get().fetchAll();
  },

  removeDiscipline: async (name) => {
    await disciplineApi.remove(name);
    await get().fetchAll();
  },
}));
