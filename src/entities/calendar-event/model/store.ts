import { create } from 'zustand';
import { calendarApi } from '../api';
import type { CalendarEvent, CalendarEventFormData } from '../types';
import { formatMonth } from '@/shared/lib/date';

interface CalendarState {
  events: CalendarEvent[];
  currentDate: Date;
  isLoading: boolean;
  fetchEvents: (month?: string) => Promise<void>;
  setCurrentDate: (date: Date) => void;
  prevMonth: () => void;
  nextMonth: () => void;
  createEvent: (data: CalendarEventFormData) => Promise<void>;
  updateEvent: (data: CalendarEventFormData) => Promise<void>;
  removeEvent: (id: number) => Promise<void>;
}

function loadSavedMonth(): Date {
  const saved = localStorage.getItem('calendarCurrentMonth');
  if (saved) {
    try {
      const { year, month } = JSON.parse(saved);
      return new Date(year, month, 1);
    } catch { /* ignore */ }
  }
  const d = new Date();
  d.setDate(1);
  return d;
}

function saveMonth(date: Date) {
  localStorage.setItem(
    'calendarCurrentMonth',
    JSON.stringify({ year: date.getFullYear(), month: date.getMonth() }),
  );
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  currentDate: loadSavedMonth(),
  isLoading: false,

  fetchEvents: async (month) => {
    set({ isLoading: true });
    try {
      const monthKey = month || formatMonth(get().currentDate);
      const data = await calendarApi.getAll(monthKey);
      set({ events: data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  setCurrentDate: (date) => {
    saveMonth(date);
    set({ currentDate: date });
  },

  prevMonth: () => {
    const d = new Date(get().currentDate);
    d.setMonth(d.getMonth() - 1);
    saveMonth(d);
    set({ currentDate: d });
  },

  nextMonth: () => {
    const d = new Date(get().currentDate);
    d.setMonth(d.getMonth() + 1);
    saveMonth(d);
    set({ currentDate: d });
  },

  createEvent: async (data) => {
    await calendarApi.create(data);
    await get().fetchEvents();
  },

  updateEvent: async (data) => {
    await calendarApi.update(data);
    await get().fetchEvents();
  },

  removeEvent: async (id) => {
    await calendarApi.remove(id);
    await get().fetchEvents();
  },
}));
