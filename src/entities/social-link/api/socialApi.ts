import { apiGet, apiPost } from '@/shared/api';
import { getCachedData, setCachedData, clearCache } from '@/shared/lib/cache';
import type { SocialLinks } from '../types';

const CACHE_KEY = 'social_links';

export const socialApi = {
  async getAll(forceReload = false): Promise<SocialLinks> {
    try {
      if (!forceReload) {
        const cached = getCachedData<SocialLinks>(CACHE_KEY);
        if (cached) return cached;
      }

      const data = await apiGet<SocialLinks>('/api/social', 5000);
      setCachedData(CACHE_KEY, data);
      return data;
    } catch (error) {
      console.error('Ошибка получения социальных ссылок:', error);
      const cached = getCachedData<SocialLinks>(CACHE_KEY);
      if (cached) return cached;
      return {};
    }
  },

  async save(data: SocialLinks): Promise<unknown> {
    const result = await apiPost('/api/social', data);
    clearCache(CACHE_KEY);
    return result;
  },
};
