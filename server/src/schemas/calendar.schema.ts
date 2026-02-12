import { z } from 'zod';

export const createCalendarEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullish(),
  eventDate: z.string().min(1),
  imageUrl: z.string().nullish(),
  discipline: z.string().nullish(),
  prize: z.string().nullish(),
  maxTeams: z.number().int().positive().nullish(),
  registrationLink: z.string().nullish(),
  customLink: z.string().nullish(),
  startTime: z.string().nullish(),
  watchUrl: z.string().nullish(),
});

export const updateCalendarEventSchema = createCalendarEventSchema.extend({
  id: z.number().int().positive(),
});

export type CreateCalendarEventInput = z.infer<typeof createCalendarEventSchema>;
export type UpdateCalendarEventInput = z.infer<typeof updateCalendarEventSchema>;
