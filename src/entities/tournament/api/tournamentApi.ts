import { apiGet, apiPost, apiPut, apiDelete } from '@/shared/api';
import { getCachedData, setCachedData, clearCache } from '@/shared/lib/cache';
import type { Tournament, TournamentFormData } from '../types';

export const tournamentApi = {
  async getAll(status?: string | null, forceReload = false): Promise<Tournament[]> {
    try {
      const cacheKey = `tournaments_${status || 'all'}`;
      if (!forceReload) {
        const cached = getCachedData<Tournament[]>(cacheKey);
        if (cached) return cached;
      }

      let path = '/api/tournaments';
      if (status) path += `?status=${status}`;

      const data = await apiGet<Tournament[]>(path);
      setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Ошибка получения турниров:', error);
      // Пробуем старый кеш
      const cacheKey = `tournaments_${status || 'all'}`;
      const oldCache = localStorage.getItem(`cache_${cacheKey}`);
      if (oldCache) {
        try { return JSON.parse(oldCache).data; } catch { /* ignore */ }
      }
      return [];
    }
  },

  async create(data: TournamentFormData): Promise<Tournament> {
    const result = await apiPost<Tournament>('/api/tournaments', data);
    clearCache('tournaments');
    return result;
  },

  async update(data: TournamentFormData): Promise<Tournament> {
    const result = await apiPut<Tournament>('/api/tournaments', data);
    clearCache('tournaments');
    return result;
  },

  async remove(id: number): Promise<void> {
    await apiDelete(`/api/tournaments?id=${id}`);
    clearCache('tournaments');
    clearCache('teams');
  },
};
