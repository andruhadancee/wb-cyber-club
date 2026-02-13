import { apiGet, apiPost, apiPut, apiDelete } from '@/shared/api';
import type { Discipline } from '../types';

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

/** Pure API functions — no caching, React Query handles that */
export const disciplineApi = {
  async getAll(): Promise<Discipline[]> {
    try {
      const data = await apiGet<Discipline[]>('/api/disciplines', 5000);
      if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
        return data;
      }
      return FALLBACK_DISCIPLINES;
    } catch {
      return FALLBACK_DISCIPLINES;
    }
  },

  async create(name: string, color?: string | null, logoUrl?: string | null): Promise<Discipline> {
    return apiPost<Discipline>('/api/disciplines', { name, color: color || null, logo_url: logoUrl || null });
  },

  async update(id: number, data: Partial<Pick<Discipline, 'name' | 'color'>>): Promise<Discipline> {
    return apiPut<Discipline>('/api/disciplines', { id, ...data });
  },

  async remove(id: number): Promise<void> {
    await apiDelete(`/api/disciplines?id=${id}`);
  },
};
