import { apiGet, apiPost, apiPut, apiDelete } from '@/shared/api';
import { getCachedData, setCachedData, clearCache } from '@/shared/lib/cache';
import type { CalendarEvent, CalendarEventFormData } from '../types';

const CACHE_KEY_PREFIX = 'calendar';

export const calendarApi = {
  async getAll(month?: string | null, forceReload = false): Promise<CalendarEvent[]> {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}_${month || 'all'}`;

      if (!forceReload) {
        const cached = getCachedData<CalendarEvent[]>(cacheKey);
        if (cached) return cached;
      }

      let path = '/api/calendar';
      if (month) path += `?month=${encodeURIComponent(month)}`;
      const data = await apiGet<CalendarEvent[]>(path);
      setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Ошибка получения календаря:', error);
      const cacheKey = `${CACHE_KEY_PREFIX}_${month || 'all'}`;
      const cached = getCachedData<CalendarEvent[]>(cacheKey);
      if (cached) return cached;
      return [];
    }
  },

  async create(data: CalendarEventFormData): Promise<CalendarEvent> {
    const result = await apiPost<CalendarEvent>('/api/calendar', data);
    clearCache(CACHE_KEY_PREFIX);
    return result;
  },

  async update(data: CalendarEventFormData): Promise<CalendarEvent> {
    const result = await apiPut<CalendarEvent>('/api/calendar', data);
    clearCache(CACHE_KEY_PREFIX);
    return result;
  },

  async remove(id: number): Promise<void> {
    await apiDelete(`/api/calendar?id=${id}`);
    clearCache(CACHE_KEY_PREFIX);
  },
};
