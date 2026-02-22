import { apiGet, apiPost, apiPut, apiDelete } from '@/shared/api';
import type { BracketMatch, BracketMatchUpdateData, BracketFormat } from '../types';

export const bracketApi = {
  async getByTournament(tournamentId: number): Promise<BracketMatch[]> {
    return apiGet<BracketMatch[]>(`/api/brackets?tournamentId=${tournamentId}`);
  },

  async generate(tournamentId: number, format: BracketFormat = 'single'): Promise<BracketMatch[]> {
    return apiPost<BracketMatch[]>('/api/brackets/generate', { tournamentId, format });
  },

  async updateMatch(id: number, data: BracketMatchUpdateData): Promise<BracketMatch> {
    return apiPut<BracketMatch>(`/api/brackets/${id}`, data);
  },

  async deleteByTournament(tournamentId: number): Promise<void> {
    await apiDelete(`/api/brackets?tournamentId=${tournamentId}`);
  },
};
