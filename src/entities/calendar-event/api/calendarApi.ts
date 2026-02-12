import { apiGet, apiPost, apiPut, apiDelete } from '@/shared/api';
import type { CalendarEvent, CalendarEventFormData } from '../types';

export const calendarApi = {
  async getAll(month?: string | null): Promise<CalendarEvent[]> {
    try {
      let path = '/api/calendar';
      if (month) path += `?month=${encodeURIComponent(month)}`;
      return await apiGet<CalendarEvent[]>(path);
    } catch (error) {
      console.error('Ошибка получения календаря:', error);
      return [];
    }
  },

  async create(data: CalendarEventFormData): Promise<CalendarEvent> {
    return apiPost<CalendarEvent>('/api/calendar', data);
  },

  async update(data: CalendarEventFormData): Promise<CalendarEvent> {
    return apiPut<CalendarEvent>('/api/calendar', data);
  },

  async remove(id: number): Promise<void> {
    await apiDelete(`/api/calendar?id=${id}`);
  },
};
