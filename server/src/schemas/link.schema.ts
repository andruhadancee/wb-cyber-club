import { z } from 'zod';

export const saveLinksSchema = z.record(z.string(), z.string());

export type SaveLinksInput = z.infer<typeof saveLinksSchema>;
