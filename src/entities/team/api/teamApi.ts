import { apiGet, apiPost, apiPut, apiDelete } from '@/shared/api';
import type { TeamsByTournament, TeamFormData, BulkCreateTeamData } from '../types';

/** Pure API functions — no caching, React Query handles that */
export const teamApi = {
  async getAll(params?: { tournamentId?: number | null; status?: string }): Promise<TeamsByTournament> {
    const query = new URLSearchParams();
    if (params?.tournamentId) query.set('tournamentId', String(params.tournamentId));
    if (params?.status) query.set('status', params.status);
    const qs = query.toString();
    return apiGet<TeamsByTournament>(`/api/teams${qs ? `?${qs}` : ''}`);
  },

  async create(data: TeamFormData): Promise<unknown> {
    return apiPost('/api/teams', data);
  },

  async bulkCreate(data: BulkCreateTeamData): Promise<{ created: number }> {
    return apiPost<{ created: number }>('/api/teams/bulk', data);
  },

  async update(data: TeamFormData): Promise<unknown> {
    return apiPut('/api/teams', data);
  },

  async remove(id: number): Promise<void> {
    await apiDelete(`/api/teams?id=${id}`);
  },

  async removeByTournament(tournamentId: number): Promise<{ deleted: number }> {
    return apiDelete<{ deleted: number }>(`/api/teams/by-tournament?tournamentId=${tournamentId}`);
  },
};
