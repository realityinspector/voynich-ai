import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@shared/schema';

// Enhanced error handling for database connections
const getDatabaseUrl = () => {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('DATABASE_URL environment variable is not set');
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  console.log('Attempting to connect to database with URL:', dbUrl.replace(/:[^:@]+@/, ':****@'));
  return dbUrl;
};

try {
  // Use the DATABASE_URL environment variable
  const sql = neon(getDatabaseUrl());
  
  // Create a drizzle client with the schema
  export const db = drizzle(sql, { schema });
  
  console.log('Database connection established successfully');
} catch (error) {
  console.error('Failed to initialize database connection:', error);
  throw new Error(`Error connecting to database: ${error.message}`);
}
