import { apiGet, apiPost } from './base';

export type RegistrationLinks = Record<string, string>;

export const linksApi = {
  async getAll(): Promise<RegistrationLinks> {
    try {
      return await apiGet<RegistrationLinks>('/api/links', 5000);
    } catch (error) {
      console.error('Ошибка получения ссылок:', error);
      return {};
    }
  },

  async save(links: RegistrationLinks): Promise<unknown> {
    return apiPost('/api/links', links);
  },
};
