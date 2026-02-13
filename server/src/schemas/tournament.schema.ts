import { z } from 'zod';

/** Strip base64 data URIs and empty strings → null; keep valid URLs */
const safeUrl = z
  .string()
  .nullish()
  .transform((v) => {
    if (!v || !v.trim()) return null;
    if (v.trim().startsWith('data:')) return null;
    return v.trim();
  });

/** Accept "HH:mm" or ISO date string (e.g. "1970-01-01T18:00:00.000Z") */
const timeString = z
  .string()
  .transform((v) => {
    if (!v) return v;
    const trimmed = v.trim();
    // Already in HH:mm
    if (/^\d{1,2}:\d{2}$/.test(trimmed)) return trimmed;
    // ISO date string — extract HH:mm in UTC
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const hh = String(d.getUTCHours()).padStart(2, '0');
      const mm = String(d.getUTCMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    }
    return trimmed;
  })
  .refine((v) => !v || /^\d{1,2}:\d{2}$/.test(v.trim()), { message: 'Формат времени: HH:mm' })
  .nullish();

export const createTournamentSchema = z.object({
  title: z.string().min(1),
  discipline: z.string().min(1),
  date: z.string().min(1),
  prize: z.string().min(1),
  maxTeams: z.number().int().positive(),
  customLink: safeUrl,
  status: z.string().default('active'),
  winner: z.string().nullish(),
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
