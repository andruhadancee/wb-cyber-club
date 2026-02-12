import { apiGet, apiPost, apiPut, apiDelete } from '@/shared/api';
import { clearCache } from '@/shared/lib/cache';
import type { TeamsByTournament, TeamFormData } from '../types';

export const teamApi = {
  async getAll(tournamentId?: number | null): Promise<TeamsByTournament> {
    try {
      let path = '/api/teams';
      if (tournamentId) path += `?tournamentId=${tournamentId}`;
      return await apiGet<TeamsByTournament>(path);
    } catch (error) {
      console.error('Ошибка получения команд:', error);
      return {};
    }
  },

  async create(data: TeamFormData): Promise<unknown> {
    const result = await apiPost('/api/teams', data);
    clearCache('teams');
    clearCache('tournaments');
    return result;
  },

  async update(data: TeamFormData): Promise<unknown> {
    const result = await apiPut('/api/teams', data);
    clearCache('teams');
    clearCache('tournaments');
    return result;
  },

  async remove(id: number): Promise<void> {
    await apiDelete(`/api/teams?id=${id}`);
    clearCache('teams');
    clearCache('tournaments');
  },
};
