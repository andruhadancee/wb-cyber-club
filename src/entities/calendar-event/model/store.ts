import { useCallback } from 'react';
import { create } from 'zustand';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarApi } from '../api';
import { queryKeys } from '@/shared/api/queryKeys';
import { formatMonth } from '@/shared/lib/date';
import type { CalendarEvent, CalendarEventFormData } from '../types';

// ─── UI-only store (Zustand) — manages current month navigation ───

interface CalendarUIState {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  prevMonth: () => void;
  nextMonth: () => void;
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

export const useCalendarUIStore = create<CalendarUIState>((set, get) => ({
  currentDate: loadSavedMonth(),

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
}));

// ─── React Query hooks ───

export function useCalendarEvents(month?: string) {
  const currentDate = useCalendarUIStore((s) => s.currentDate);
  const monthKey = month || formatMonth(currentDate);

  return useQuery<CalendarEvent[]>({
    queryKey: queryKeys.calendar.byMonth(monthKey),
    queryFn: () => calendarApi.getAll(monthKey),
  });
}

export function useCreateCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CalendarEventFormData) => calendarApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.calendar.all });
      qc.invalidateQueries({ queryKey: queryKeys.tournaments.all });
    },
  });
}

export function useUpdateCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CalendarEventFormData) => calendarApi.update(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.calendar.all });
      qc.invalidateQueries({ queryKey: queryKeys.tournaments.all });
    },
  });
}

export function useRemoveCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => calendarApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.calendar.all });
      qc.invalidateQueries({ queryKey: queryKeys.tournaments.all });
    },
  });
}

// ─── Backward-compatible hook (replaces useCalendarStore) ───

export function useCalendarStore() {
  const uiStore = useCalendarUIStore();
  const eventsQuery = useCalendarEvents();
  const createMut = useCreateCalendarEvent();
  const updateMut = useUpdateCalendarEvent();
  const removeMut = useRemoveCalendarEvent();

  const fetchEvents = useCallback(async (_month?: string, _forceReload?: boolean) => { await eventsQuery.refetch(); }, [eventsQuery.refetch]);
  const createEvent = useCallback(async (data: CalendarEventFormData) => { await createMut.mutateAsync(data); }, [createMut.mutateAsync]);
  const updateEvent = useCallback(async (data: CalendarEventFormData) => { await updateMut.mutateAsync(data); }, [updateMut.mutateAsync]);
  const removeEvent = useCallback(async (id: number) => { await removeMut.mutateAsync(id); }, [removeMut.mutateAsync]);

  return {
    events: eventsQuery.data ?? [],
    currentDate: uiStore.currentDate,
    isLoading: eventsQuery.isLoading,

    setCurrentDate: uiStore.setCurrentDate,
    prevMonth: uiStore.prevMonth,
    nextMonth: uiStore.nextMonth,

    fetchEvents,
    createEvent,
    updateEvent,
    removeEvent,
  };
}
