import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

// The single .env lives in the repository root (apps/api/src/config -> root).
const rootDir = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../..');
loadDotenv({ path: resolve(rootDir, '.env') });

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_HOST: z.string().default('0.0.0.0'),
  API_PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  DATABASE_URL: z
    .string()
    .url()
    .default('postgresql://tigu:tigu@localhost:5433/tigu?schema=public'),
  PG_PORT: z.coerce.number().int().positive().default(5433),
  PG_USER: z.string().default('tigu'),
  PG_PASSWORD: z.string().default('tigu'),
  PG_DATABASE: z.string().default('tigu'),
  PG_DATA_DIR: z.string().default('.data/postgres'),
  STORAGE_DRIVER: z.enum(['local']).default('local'),
  STORAGE_DIR: z.string().default('.data/files'),
});

export type Env = z.infer<typeof EnvSchema>;

export function parseEnv(source: NodeJS.ProcessEnv): Env {
  const result = EnvSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return result.data;
}

export const env = parseEnv(process.env);
