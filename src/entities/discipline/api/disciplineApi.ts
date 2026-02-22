import { apiGet, apiPost, apiPut, apiDelete } from '@/shared/api';
import { API_BASE_URL } from '@/shared/api/config';
import type { Discipline } from '../types';

const EMPTY_DISCIPLINES: Discipline[] = [];

export const disciplineApi = {
  async getAll(): Promise<Discipline[]> {
    try {
      const data = await apiGet<Discipline[]>('/api/disciplines', 5000);
      if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
        return data;
      }
      return EMPTY_DISCIPLINES;
    } catch {
      return EMPTY_DISCIPLINES;
    }
  },

  async create(name: string, color?: string | null, logoUrl?: string | null): Promise<Discipline> {
    return apiPost<Discipline>('/api/disciplines', { name, color: color || null, logo_url: logoUrl || null });
  },

  async update(id: number, data: Partial<Pick<Discipline, 'name' | 'color' | 'logo_url'>>): Promise<Discipline> {
    return apiPut<Discipline>('/api/disciplines', { id, ...data });
  },

  async remove(id: number): Promise<void> {
    await apiDelete(`/api/disciplines?id=${id}`);
  },

  async uploadLogo(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('logo', file);

    const response = await fetch(`${API_BASE_URL}/api/upload/discipline-logo`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error || 'Ошибка загрузки файла');
    }

    const result = await response.json() as { url: string };
    return result.url;
  },

  async deleteLogo(url: string): Promise<void> {
    await fetch(`${API_BASE_URL}/api/upload/discipline-logo`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
  },
};
