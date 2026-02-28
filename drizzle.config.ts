import type { Config } from 'drizzle-kit';

export default {
  schema: './server/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    user: process.env.DB_USER || 'wisdom',
    password: process.env.DB_PASSWORD || 'wisdom123',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'wisdom_hub',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  },
} satisfies Config;
