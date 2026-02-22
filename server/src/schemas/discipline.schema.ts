import { z } from 'zod';

export const createDisciplineSchema = z.object({
  name: z.string().min(1),
  color: z.string().nullish(),
  logo_url: z.string().nullish(),
});

export const updateDisciplineSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).optional(),
  color: z.string().nullish(),
  logo_url: z.string().nullish(),
});

export type CreateDisciplineInput = z.infer<typeof createDisciplineSchema>;
export type UpdateDisciplineInput = z.infer<typeof updateDisciplineSchema>;
