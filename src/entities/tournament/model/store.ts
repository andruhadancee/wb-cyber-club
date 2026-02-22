import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tournamentApi } from '../api';
import { queryKeys } from '@/shared/api/queryKeys';
import type { Tournament, TournamentFormData } from '../types';

// ─── Queries ───

export function useActiveTournaments() {
  return useQuery<Tournament[]>({
    queryKey: queryKeys.tournaments.active(),
    queryFn: () => tournamentApi.getAll('active'),
  });
}

export function usePastTournaments() {
  return useQuery<Tournament[]>({
    queryKey: queryKeys.tournaments.past(),
    queryFn: () => tournamentApi.getAll('finished'),
  });
}

// ─── Mutations ───

export function useCreateTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TournamentFormData) => tournamentApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tournaments.all });
      qc.invalidateQueries({ queryKey: queryKeys.calendar.all });
      qc.invalidateQueries({ queryKey: queryKeys.teams.all });
    },
  });
}

export function useUpdateTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TournamentFormData) => tournamentApi.update(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tournaments.all });
      qc.invalidateQueries({ queryKey: queryKeys.calendar.all });
      qc.invalidateQueries({ queryKey: queryKeys.teams.all });
    },
  });
}

export function useRemoveTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tournamentApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tournaments.all });
      qc.invalidateQueries({ queryKey: queryKeys.calendar.all });
      qc.invalidateQueries({ queryKey: queryKeys.teams.all });
    },
  });
}

// ─── Backward-compatible hook (replaces useTournamentStore) ───

export function useTournamentStore() {
  const activeQuery = useActiveTournaments();
  const pastQuery = usePastTournaments();
  const createMut = useCreateTournament();
  const updateMut = useUpdateTournament();
  const removeMut = useRemoveTournament();

  const fetchActive = useCallback(async () => { await activeQuery.refetch(); }, [activeQuery.refetch]);
  const fetchPast = useCallback(async () => { await pastQuery.refetch(); }, [pastQuery.refetch]);
  const createTournament = useCallback(async (data: TournamentFormData) => { await createMut.mutateAsync(data); }, [createMut.mutateAsync]);
  const updateTournament = useCallback(async (data: TournamentFormData) => { await updateMut.mutateAsync(data); }, [updateMut.mutateAsync]);
  const removeTournament = useCallback(async (id: number) => { await removeMut.mutateAsync(id); }, [removeMut.mutateAsync]);

  return {
    activeTournaments: activeQuery.data ?? [],
    pastTournaments: pastQuery.data ?? [],
    isLoading: activeQuery.isLoading || pastQuery.isLoading,
    error: activeQuery.error?.message || pastQuery.error?.message || null,
    fetchActive,
    fetchPast,
    createTournament,
    updateTournament,
    removeTournament,
  };
}
