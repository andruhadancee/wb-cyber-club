import { apiGet, apiPost, apiPut, apiDelete } from '@/shared/api';
import type { Tournament, TournamentFormData } from '../types';

/** Pure API functions — no caching, React Query handles that */
export const tournamentApi = {
  async getAll(status?: string | null): Promise<Tournament[]> {
    let path = '/api/tournaments';
    if (status) path += `?status=${status}`;
    return apiGet<Tournament[]>(path);
  },

  async create(data: TournamentFormData): Promise<Tournament> {
    return apiPost<Tournament>('/api/tournaments', data);
  },

  async update(data: TournamentFormData): Promise<Tournament> {
    return apiPut<Tournament>('/api/tournaments', data);
  },

  async remove(id: number): Promise<void> {
    await apiDelete(`/api/tournaments?id=${id}`);
  },
};
