import { apiGet, apiPost, apiPut, apiDelete } from '@/shared/api';
import type { Regulation, RegulationFormData } from '../types';

export const regulationApi = {
  async getAll(): Promise<Regulation[]> {
    try {
      return await apiGet<Regulation[]>('/api/regulations', 5000);
    } catch (error) {
      console.error('Ошибка получения регламентов:', error);
      return [];
    }
  },

  async create(data: RegulationFormData): Promise<Regulation> {
    return apiPost<Regulation>('/api/regulations', data);
  },

  async update(id: number, data: RegulationFormData): Promise<Regulation> {
    return apiPut<Regulation>(`/api/regulations?id=${id}`, data);
  },

  async remove(id: number): Promise<void> {
    await apiDelete(`/api/regulations?id=${id}`);
  },
};
