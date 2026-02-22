import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamApi } from '../api';
import { queryKeys } from '@/shared/api/queryKeys';
import type { TeamFormData, TeamsByTournament, BulkCreateTeamData } from '../types';

// ─── Queries ───

export function useTeams(status = 'active') {
  return useQuery<TeamsByTournament>({
    queryKey: queryKeys.teams.byStatus(status),
    queryFn: () => teamApi.getAll({ status }),
  });
}

// ─── Mutations ───

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TeamFormData) => teamApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teams.all });
      qc.invalidateQueries({ queryKey: queryKeys.tournaments.all });
    },
  });
}

export function useUpdateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TeamFormData) => teamApi.update(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teams.all });
      qc.invalidateQueries({ queryKey: queryKeys.tournaments.all });
    },
  });
}

export function useRemoveTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => teamApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teams.all });
      qc.invalidateQueries({ queryKey: queryKeys.tournaments.all });
    },
  });
}

export function useBulkCreateTeams() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkCreateTeamData) => teamApi.bulkCreate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teams.all });
      qc.invalidateQueries({ queryKey: queryKeys.tournaments.all });
    },
  });
}

// ─── Backward-compatible hook (replaces useTeamStore) ───

export function useTeamStore() {
  const teamsQuery = useTeams('active');
  const createMut = useCreateTeam();
  const updateMut = useUpdateTeam();
  const removeMut = useRemoveTeam();

  const fetchAll = useCallback(async (_status?: string) => { await teamsQuery.refetch(); }, [teamsQuery.refetch]);
  const createTeam = useCallback(async (data: TeamFormData) => { await createMut.mutateAsync(data); }, [createMut.mutateAsync]);
  const updateTeam = useCallback(async (data: TeamFormData) => { await updateMut.mutateAsync(data); }, [updateMut.mutateAsync]);
  const removeTeam = useCallback(async (id: number) => { await removeMut.mutateAsync(id); }, [removeMut.mutateAsync]);

  return {
    teamsByTournament: teamsQuery.data ?? {},
    isLoading: teamsQuery.isLoading,
    error: teamsQuery.error?.message || null,
    fetchAll,
    createTeam,
    updateTeam,
    removeTeam,
  };
}
