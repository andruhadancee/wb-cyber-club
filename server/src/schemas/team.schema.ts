import { z } from 'zod';

export const createTeamSchema = z.object({
  tournamentId: z.number().int().positive(),
  name: z.string().min(1),
  players: z.number().int().positive(),
});

export const updateTeamSchema = createTeamSchema.extend({
  id: z.number().int().positive(),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
