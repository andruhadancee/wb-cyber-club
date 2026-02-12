import { z } from 'zod';

export const saveSocialLinksSchema = z.object({
  twitch: z.string().nullish(),
  telegram: z.string().nullish(),
  discord: z.string().nullish(),
  contact: z.string().nullish(),
});

export type SaveSocialLinksInput = z.infer<typeof saveSocialLinksSchema>;
