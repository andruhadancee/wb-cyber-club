import { useMemo } from 'react';
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
    mutationFn: ({ name, color }: { name: string; color?: string | null }) =>
      disciplineApi.create(name, color),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.disciplines.all }); },
  });
}

export function useUpdateDiscipline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Pick<Discipline, 'name' | 'color'>> }) =>
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
    disciplines.forEach((d) => { map[d.name] = d.color; });
    return map;
  }, [disciplines]);

  return {
    disciplines,
    colorsMap,
    isLoading: disciplinesQuery.isLoading,

    fetchAll: async () => { await disciplinesQuery.refetch(); },
    createDiscipline: async (name: string, color?: string | null) => { await createMut.mutateAsync({ name, color }); },
    updateDiscipline: async (id: number, data: Partial<Pick<Discipline, 'name' | 'color'>>) => { await updateMut.mutateAsync({ id, data }); },
    removeDiscipline: async (id: number) => { await removeMut.mutateAsync(id); },
  };
}
