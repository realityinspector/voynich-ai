import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@shared/schema';

// Don't keep these connections alive
neonConfig.fetchConnectionCache = false;

// Use the DATABASE_URL environment variable
const sql = neon(process.env.DATABASE_URL!);

// Create a drizzle client with the schema
export const db = drizzle(sql, { schema });
