import { apiGet, apiPost, apiPut, apiDelete } from '@/shared/api';
import type { CalendarEvent, CalendarEventFormData } from '../types';

/** Pure API functions — no caching, React Query handles that */
export const calendarApi = {
  async getAll(month?: string | null): Promise<CalendarEvent[]> {
    let path = '/api/calendar';
    if (month) path += `?month=${encodeURIComponent(month)}`;
    return apiGet<CalendarEvent[]>(path);
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
