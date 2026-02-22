import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { disciplineApi } from '../api';
import { queryKeys } from '@/shared/api/queryKeys';
import type { Discipline } from '../types';

// ─── Queries ───

export function useDisciplines() {
  return useQuery<Discipline[]>({
    queryKey: queryKeys.disciplines.all,
    queryFn: () => disciplineApi.getAll(),
  });
}

// ─── Mutations ───

export function useCreateDiscipline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, color, logo_url }: { name: string; color?: string | null; logo_url?: string | null }) =>
      disciplineApi.create(name, color, logo_url),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.disciplines.all }); },
  });
}

export function useUpdateDiscipline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Pick<Discipline, 'name' | 'color' | 'logo_url'>> }) =>
      disciplineApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.disciplines.all }); },
  });
}

export function useRemoveDiscipline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => disciplineApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.disciplines.all }); },
  });
}

// ─── Backward-compatible hook (replaces useDisciplineStore) ───

export function useDisciplineStore() {
  const disciplinesQuery = useDisciplines();
  const createMut = useCreateDiscipline();
  const updateMut = useUpdateDiscipline();
  const removeMut = useRemoveDiscipline();

  const disciplines = disciplinesQuery.data ?? [];

  const colorsMap = useMemo(() => {
    const map: Record<string, string | null> = {};
    disciplines.forEach((d) => {
      map[d.name] = d.color;
      map[String(d.id)] = d.color;
    });
    return map;
  }, [disciplines]);

  const logosMap = useMemo(() => {
    const map: Record<string, string | null> = {};
    disciplines.forEach((d) => {
      map[d.name] = d.logo_url;
      map[String(d.id)] = d.logo_url;
    });
    return map;
  }, [disciplines]);

  const fetchAll = useCallback(async () => { await disciplinesQuery.refetch(); }, [disciplinesQuery.refetch]);
  const createDiscipline = useCallback(async (name: string, color?: string | null, logo_url?: string | null) => { await createMut.mutateAsync({ name, color, logo_url }); }, [createMut.mutateAsync]);
  const updateDiscipline = useCallback(async (id: number, data: Partial<Pick<Discipline, 'name' | 'color' | 'logo_url'>>) => { await updateMut.mutateAsync({ id, data }); }, [updateMut.mutateAsync]);
  const removeDiscipline = useCallback(async (id: number) => { await removeMut.mutateAsync(id); }, [removeMut.mutateAsync]);

  return {
    disciplines,
    colorsMap,
    logosMap,
    isLoading: disciplinesQuery.isLoading,
    fetchAll,
    createDiscipline,
    updateDiscipline,
    removeDiscipline,
  };
}
