import { z } from 'zod';

export const createTournamentSchema = z.object({
  title: z.string().min(1),
  discipline: z.string().min(1),
  date: z.string().min(1),
  prize: z.string().min(1),
  maxTeams: z.number().int().positive(),
  customLink: z.string().nullish(),
  status: z.string().default('active'),
  winner: z.string().nullish(),
  watchUrl: z.string().nullish(),
  description: z.string().nullish(),
  imageUrl: z.string().nullish(),
  startTime: z.string().nullish(),
  teams: z.number().int().optional(),
});

export const updateTournamentSchema = createTournamentSchema.extend({
  id: z.number().int().positive(),
});

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;
export type UpdateTournamentInput = z.infer<typeof updateTournamentSchema>;
