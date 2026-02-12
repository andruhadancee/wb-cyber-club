import { z } from 'zod';

export const generateBracketSchema = z.object({
  tournamentId: z.number().int().positive(),
  format: z.enum(['single', 'double']).default('single'),
});

export const updateMatchSchema = z.object({
  team1Id: z.number().int().positive().nullish(),
  team2Id: z.number().int().positive().nullish(),
  winnerId: z.number().int().positive().nullish(),
  score1: z.number().int().min(0).nullish(),
  score2: z.number().int().min(0).nullish(),
  status: z.enum(['pending', 'live', 'completed']).optional(),
});

export type GenerateBracketInput = z.infer<typeof generateBracketSchema>;
export type UpdateMatchInput = z.infer<typeof updateMatchSchema>;
