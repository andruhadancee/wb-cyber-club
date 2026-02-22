import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { regulationApi } from '../api';
import { queryKeys } from '@/shared/api/queryKeys';
import type { Regulation, RegulationFormData } from '../types';

// ─── Queries ───

export function useRegulations() {
  return useQuery<Regulation[]>({
    queryKey: queryKeys.regulations.all,
    queryFn: () => regulationApi.getAll(),
  });
}

// ─── Mutations ───

export function useCreateRegulation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RegulationFormData) => regulationApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.regulations.all }); },
  });
}

export function useUpdateRegulation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: RegulationFormData }) => regulationApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.regulations.all }); },
  });
}

export function useRemoveRegulation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => regulationApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.regulations.all }); },
  });
}

// ─── Backward-compatible hook (replaces useRegulationStore) ───

export function useRegulationStore() {
  const regulationsQuery = useRegulations();
  const createMut = useCreateRegulation();
  const updateMut = useUpdateRegulation();
  const removeMut = useRemoveRegulation();

  const fetchAll = useCallback(async () => { await regulationsQuery.refetch(); }, [regulationsQuery.refetch]);
  const createRegulation = useCallback(async (data: RegulationFormData) => { await createMut.mutateAsync(data); }, [createMut.mutateAsync]);
  const updateRegulation = useCallback(async (id: number, data: RegulationFormData) => { await updateMut.mutateAsync({ id, data }); }, [updateMut.mutateAsync]);
  const removeRegulation = useCallback(async (id: number) => { await removeMut.mutateAsync(id); }, [removeMut.mutateAsync]);

  return {
    regulations: regulationsQuery.data ?? [],
    isLoading: regulationsQuery.isLoading,
    fetchAll,
    createRegulation,
    updateRegulation,
    removeRegulation,
  };
}
