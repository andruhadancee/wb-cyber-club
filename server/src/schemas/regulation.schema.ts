import { z } from 'zod';

export const createRegulationSchema = z.object({
  disciplineId: z.number().int().positive(),
  pdf_url: z.string().min(1),
  regulation_name: z.string().nullish(),
});

export const updateRegulationSchema = z.object({
  disciplineId: z.number().int().positive().optional(),
  pdf_url: z.string().min(1),
  regulation_name: z.string().nullish(),
});

export type CreateRegulationInput = z.infer<typeof createRegulationSchema>;
export type UpdateRegulationInput = z.infer<typeof updateRegulationSchema>;
