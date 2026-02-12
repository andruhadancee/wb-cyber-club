import { apiGet, apiPost } from '@/shared/api';
import type { SocialLinks } from '../types';

export const socialApi = {
  async getAll(): Promise<SocialLinks> {
    try {
      return await apiGet<SocialLinks>('/api/social', 5000);
    } catch (error) {
      console.error('Ошибка получения социальных ссылок:', error);
      return {};
    }
  },

  async save(data: SocialLinks): Promise<unknown> {
    return apiPost('/api/social', data);
  },
};
