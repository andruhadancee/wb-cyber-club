import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamApi } from '../api';
import { queryKeys } from '@/shared/api/queryKeys';
import type { TeamFormData, TeamsByTournament } from '../types';

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

// ─── Backward-compatible hook (replaces useTeamStore) ───

export function useTeamStore() {
  const teamsQuery = useTeams('active');
  const createMut = useCreateTeam();
  const updateMut = useUpdateTeam();
  const removeMut = useRemoveTeam();

  return {
    teamsByTournament: teamsQuery.data ?? {},
    isLoading: teamsQuery.isLoading,
    error: teamsQuery.error?.message || null,

    fetchAll: async (_status?: string) => { await teamsQuery.refetch(); },
    createTeam: async (data: TeamFormData) => { await createMut.mutateAsync(data); },
    updateTeam: async (data: TeamFormData) => { await updateMut.mutateAsync(data); },
    removeTeam: async (id: number) => { await removeMut.mutateAsync(id); },
  };
}
