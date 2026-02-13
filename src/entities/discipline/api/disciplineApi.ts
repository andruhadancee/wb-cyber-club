import { apiGet, apiPost, apiPut, apiDelete } from '@/shared/api';
import { getCachedData, setCachedData, clearCache } from '@/shared/lib/cache';
import type { Discipline } from '../types';

const CACHE_KEY = 'disciplines';

const FALLBACK_DISCIPLINES: Discipline[] = [
  'CS 2', 'Dota 2', 'Valorant', 'Overwatch 2', 'League of Legends',
].map((name, i) => ({
  id: i + 1,
  name,
  color: null,
  logo_url: null,
  created_at: '',
  updated_at: '',
}));

export const disciplineApi = {
  async getAll(forceReload = false): Promise<Discipline[]> {
    try {
      if (!forceReload) {
        const cached = getCachedData<Discipline[]>(CACHE_KEY);
        if (cached) return cached;
      }

      const data = await apiGet<Discipline[]>('/api/disciplines', 5000);
      if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
        setCachedData(CACHE_KEY, data);
        return data;
      }
      return FALLBACK_DISCIPLINES;
    } catch {
      const cached = getCachedData<Discipline[]>(CACHE_KEY);
      if (cached) return cached;
      return FALLBACK_DISCIPLINES;
    }
  },

  async create(name: string, color?: string | null, logoUrl?: string | null): Promise<Discipline> {
    const result = await apiPost<Discipline>('/api/disciplines', { name, color: color || null, logo_url: logoUrl || null });
    clearCache(CACHE_KEY);
    return result;
  },

  async update(id: number, data: Partial<Pick<Discipline, 'name' | 'color'>>): Promise<Discipline> {
    const result = await apiPut<Discipline>('/api/disciplines', { id, ...data });
    clearCache(CACHE_KEY);
    return result;
  },

  async remove(id: number): Promise<void> {
    await apiDelete(`/api/disciplines?id=${id}`);
    clearCache(CACHE_KEY);
  },
};
