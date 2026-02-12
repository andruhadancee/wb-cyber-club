import { z } from 'zod';

export const createRegulationSchema = z.object({
  discipline_name: z.string().min(1),
  pdf_url: z.string().min(1),
  regulation_name: z.string().nullish(),
});

export const updateRegulationSchema = z.object({
  pdf_url: z.string().min(1),
  discipline_name: z.string().optional(),
  regulation_name: z.string().nullish(),
});

export type CreateRegulationInput = z.infer<typeof createRegulationSchema>;
export type UpdateRegulationInput = z.infer<typeof updateRegulationSchema>;
