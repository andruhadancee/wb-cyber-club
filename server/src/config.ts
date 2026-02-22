import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  DOMAIN: z.string().optional(),
  DEV_AUTH: z.string().optional(),
  DEV_USER: z.string().default('admin'),
  DEV_PASS: z.string().min(1, 'DEV_PASS is required when DEV_AUTH=true').default(''),
  ADMIN_PASSWORD: z.string().min(1, 'ADMIN_PASSWORD is required').default(''),
});

export const config = envSchema.parse(process.env);
