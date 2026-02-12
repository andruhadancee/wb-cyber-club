import { create } from 'zustand';
import { socialApi } from '../api';
import type { SocialLinks } from '../types';

interface SocialLinkState {
  links: SocialLinks;
  isLoading: boolean;
  fetchAll: () => Promise<void>;
  save: (data: SocialLinks) => Promise<void>;
}

export const useSocialLinkStore = create<SocialLinkState>((set, get) => ({
  links: {},
  isLoading: false,

  fetchAll: async () => {
    set({ isLoading: true });
    try {
      const data = await socialApi.getAll();
      set({ links: data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  save: async (data) => {
    await socialApi.save(data);
    set({ links: data });
  },
}));
