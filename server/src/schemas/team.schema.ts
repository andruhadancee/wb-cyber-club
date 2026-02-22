import { z } from 'zod';

export const createTeamSchema = z.object({
  tournamentId: z.number().int().positive(),
  name: z.string().min(1),
  players: z.number().int().positive(),
});

export const updateTeamSchema = createTeamSchema.extend({
  id: z.number().int().positive(),
});

export const bulkCreateTeamSchema = z.object({
  tournamentId: z.number().int().positive(),
  names: z.array(z.string().min(1)).min(1, 'Нужно хотя бы одно имя'),
  players: z.number().int().positive(),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type BulkCreateTeamInput = z.infer<typeof bulkCreateTeamSchema>;
