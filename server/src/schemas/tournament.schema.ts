import { z } from 'zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(utc);

/** Strip base64 data URIs and empty strings -> null; keep valid URLs */
const safeUrl = z
  .string()
  .nullish()
  .transform((v) => {
    if (!v || !v.trim()) return null;
    if (v.trim().startsWith('data:')) return null;
    return v.trim();
  });

/** Accept "HH:mm" or ISO date string (e.g. "1970-01-01T18:00:00.000Z") -> normalize to "HH:mm" */
const timeString = z
  .string()
  .transform((v) => {
    if (!v) return v;
    const trimmed = v.trim();
    if (/^\d{1,2}:\d{2}$/.test(trimmed)) return trimmed;
    const parsed = dayjs.utc(trimmed);
    if (parsed.isValid()) return parsed.format('HH:mm');
    return trimmed;
  })
  .refine((v) => !v || /^\d{1,2}:\d{2}$/.test(v.trim()), { message: 'Формат времени: HH:mm' })
  .nullish();

export const createTournamentSchema = z.object({
  title: z.string().min(1),
  disciplineId: z.number().int().positive(),
  date: z.string().min(1),
  prize: z.string().min(1),
  maxTeams: z.number().int().positive(),
  registrationLink: safeUrl,
  customLink: safeUrl,
  status: z.string().default('active'),
  winner: z.string().nullish(),
  winner2nd: z.string().nullish(),
  winner3rd: z.string().nullish(),
  watchUrl: safeUrl,
  description: z.string().nullish(),
  imageUrl: safeUrl,
  startTime: timeString,
  teams: z.number().int().optional(),
});

export const updateTournamentSchema = createTournamentSchema.extend({
  id: z.number().int().positive(),
});

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;
export type UpdateTournamentInput = z.infer<typeof updateTournamentSchema>;
