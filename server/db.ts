import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@shared/schema';

// Enhanced error handling for database connections
const getDatabaseUrl = () => {
  let dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('DATABASE_URL environment variable is not set');
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  // Remove any railway-specific internal domains that might cause resolution issues
  if (dbUrl.includes('railway.internal') || dbUrl.includes('internal.railway.app')) {
    console.warn('Detected Railway internal hostname in DATABASE_URL, attempting to fix...');
    
    // Extract username, password, and database name from the URL to reconstruct with public DNS
    try {
      const url = new URL(dbUrl);
      const publicHost = process.env.DATABASE_HOST || 'db.railway.app';
      const username = url.username;
      const password = url.password;
      const database = url.pathname.replace('/', '');
      const port = url.port || '5432';
      
      // Reconstruct the URL with public hostname
      dbUrl = `postgres://${username}:${password}@${publicHost}:${port}/${database}`;
      console.log('Reconstructed database URL with public hostname');
    } catch (err) {
      console.error('Failed to reconstruct database URL:', err);
    }
  }
  
  console.log('Attempting to connect to database with URL:', dbUrl.replace(/:[^:@]+@/, ':****@'));
  return dbUrl;
};

// Maximum connection retries
const MAX_RETRIES = 3;

// Disable WebSocket for Node environment
neonConfig.webSocketConstructor = null;
neonConfig.fetchConnectionCache = true;
neonConfig.useSecureFetch = false; // Try false for Railway environment
neonConfig.pipelineFetch = false;  // Disable fetch pipelining

// Declare db at module level
let sql;
let db;

// Initialize database with retries
const initDatabase = async (retryCount = 0) => {
try {
    // Get database URL
    const dbUrl = getDatabaseUrl();
    
    console.log(`Connection attempt ${retryCount + 1} of ${MAX_RETRIES}`);
    
    // Create Neon SQL client
    sql = neon(dbUrl);
    
    // Test the connection
    await sql`SELECT 1 as test`;
    console.log('Database connection test successful');
  
  // Create a drizzle client with the schema
  db = drizzle(sql, { schema });
  
  console.log('Database connection established successfully');
    return true;
  } catch (error) {
    console.error(`Database connection attempt ${retryCount + 1} failed:`, error);
    
    if (retryCount < MAX_RETRIES - 1) {
      console.log(`Retrying in ${(retryCount + 1) * 2} seconds...`);
      await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
      return initDatabase(retryCount + 1);
    }
    
    throw new Error(`Error connecting to database after ${MAX_RETRIES} attempts: ${error.message}`);
  }
};

try {
  // Initialize connection synchronously for module exports
  // We use an IIFE to handle the async initialization
  (async () => {
    await initDatabase();
    console.log('Database initialization complete');
  })();
} catch (error) {
  console.error('Failed to initialize database connection:', error);
  throw new Error(`Error connecting to database: ${error.message}`);
}

// Export at module level
export { db };
