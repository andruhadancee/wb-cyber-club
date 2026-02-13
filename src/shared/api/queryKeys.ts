/** Centralized query key factory for React Query cache management */
export const queryKeys = {
  tournaments: {
    all: ['tournaments'] as const,
    active: () => [...queryKeys.tournaments.all, 'active'] as const,
    past: () => [...queryKeys.tournaments.all, 'past'] as const,
  },
  teams: {
    all: ['teams'] as const,
    byStatus: (status: string) => [...queryKeys.teams.all, { status }] as const,
  },
  calendar: {
    all: ['calendar'] as const,
    byMonth: (month: string) => [...queryKeys.calendar.all, month] as const,
  },
  disciplines: {
    all: ['disciplines'] as const,
  },
  regulations: {
    all: ['regulations'] as const,
    byDiscipline: (discipline: string) => [...queryKeys.regulations.all, discipline] as const,
  },
  socialLinks: {
    all: ['socialLinks'] as const,
  },
  brackets: {
    all: ['brackets'] as const,
    byTournament: (id: number) => [...queryKeys.brackets.all, id] as const,
  },
} as const;
