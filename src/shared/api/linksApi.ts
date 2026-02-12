import { apiGet, apiPost } from './base';
import { getCachedData, setCachedData, clearCache } from '@/shared/lib/cache';
import type { RegistrationLinks } from '@shared/api/link';

export type { RegistrationLinks } from '@shared/api/link';

const CACHE_KEY = 'registration_links';

export const linksApi = {
  async getAll(forceReload = false): Promise<RegistrationLinks> {
    try {
      if (!forceReload) {
        const cached = getCachedData<RegistrationLinks>(CACHE_KEY);
        if (cached) return cached;
      }

      const data = await apiGet<RegistrationLinks>('/api/links', 5000);
      setCachedData(CACHE_KEY, data);
      return data;
    } catch (error) {
      console.error('Ошибка получения ссылок:', error);
      const cached = getCachedData<RegistrationLinks>(CACHE_KEY);
      if (cached) return cached;
      return {};
    }
  },

  async save(links: RegistrationLinks): Promise<unknown> {
    const result = await apiPost('/api/links', links);
    clearCache(CACHE_KEY);
    return result;
  },
};
