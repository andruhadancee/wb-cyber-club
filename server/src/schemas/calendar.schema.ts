import { z } from 'zod';

const safeUrl = z
  .string()
  .nullish()
  .transform((v) => {
    if (!v || !v.trim()) return null;
    if (v.trim().startsWith('data:')) return null;
    return v.trim();
  });

export const createCalendarEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullish(),
  eventDate: z.string().min(1),
  imageUrl: safeUrl,
  disciplineId: z.number().int().positive().nullish(),
  prize: z.string().nullish(),
  maxTeams: z.number().int().positive().nullish(),
  registrationLink: safeUrl,
  customLink: safeUrl,
  startTime: z.string().nullish(),
  watchUrl: safeUrl,
  tournamentId: z.number().int().positive().nullish(),
});

export const updateCalendarEventSchema = createCalendarEventSchema.extend({
  id: z.number().int().positive(),
});

export type CreateCalendarEventInput = z.infer<typeof createCalendarEventSchema>;
export type UpdateCalendarEventInput = z.infer<typeof updateCalendarEventSchema>;
