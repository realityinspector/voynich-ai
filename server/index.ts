import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import fs from "fs";
import path from "path";
import { db } from "./db";
import { sql } from "drizzle-orm";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add CORS middleware for cross-domain requests
app.use((req, res, next) => {
  // Allow requests from voynichapi.com domain
  const allowedOrigins = [
    'https://voynichapi.com', 
    'http://voynichapi.com', 
    'https://www.voynichapi.com',
    'http://localhost:3000'
  ];
  
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // For Railway domains and other trusted sources
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  // Allow credentials to be sent with requests
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Allow specific headers
  res.setHeader('Access-Control-Allow-Headers', 
    'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Allow specific methods
  res.setHeader('Access-Control-Allow-Methods', 
    'GET, POST, PUT, DELETE, OPTIONS');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Add simple API endpoint mapping to help debug route issues
app.get('/api/routes', (req, res) => {
  // Get list of registered routes for debugging
  const routes = [];
  
  // For standard Express routes
  app._router.stack.forEach(middleware => {
    if (middleware.route) {
      // Routes registered directly on the app
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods).join(', ').toUpperCase()
      });
    } else if (middleware.name === 'router') {
      // Router middleware
      middleware.handle.stack.forEach(handler => {
        if (handler.route) {
          routes.push({
            path: handler.route.path,
            methods: Object.keys(handler.route.methods).join(', ').toUpperCase()
          });
        }
      });
    }
  });
  
  res.json({ routes });
});

// Add startup diagnostics with more database info
console.log('Server starting with environment:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  PWD: process.cwd(),
  DATABASE_URL_SET: !!process.env.DATABASE_URL,
  DATABASE_URL_PREFIX: process.env.DATABASE_URL ? process.env.DATABASE_URL.split(':')[0] : 'not-set',
  distExists: fs.existsSync(path.join(process.cwd(), 'dist')),
  publicExists: fs.existsSync(path.join(process.cwd(), 'dist', 'public'))
});

// Add enhanced health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const result = await db.execute(sql`SELECT 1 as health`);
    const dbConnected = result && result[0]?.health === 1;
    
    // List all environment variables (without sensitive values)
    const envVars = Object.keys(process.env)
      .filter(key => !key.toLowerCase().includes('key') && 
               !key.toLowerCase().includes('secret') &&
               !key.toLowerCase().includes('password') &&
               !key.toLowerCase().includes('token'))
      .reduce((acc, key) => {
        acc[key] = process.env[key];
        return acc;
      }, {});
    
    // Add more detailed info about database connection
    const dbInfo = {
      connected: dbConnected,
      url_protocol: process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).protocol : 'unknown',
      url_host_type: process.env.DATABASE_URL ? 
        (process.env.DATABASE_URL.includes('railway.internal') ? 'railway-internal' : 
         process.env.DATABASE_URL.includes('railway.app') ? 'railway-public' : 'other') : 'unknown'
    };
    
    return res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: dbConnected ? 'connected' : 'error',
      dbDetails: dbInfo,
      environment: app.get('env'),
      envVars
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    // More detailed error information
    const errorDetails = {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      cause: error.cause ? error.cause.toString() : undefined
    };
    
    return res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      db: 'error',
      error: error.message,
      errorDetails,
      environment: app.get('env')
    });
  }
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Additional error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Don't exit immediately in production to allow for recovery
  if (process.env.NODE_ENV !== 'production') {
  process.exit(1);
  }
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Don't exit immediately in production to allow for recovery
  if (process.env.NODE_ENV !== 'production') {
  process.exit(1);
  }
});

// Fallback route for database connection errors
app.use('/api/database-error', (req, res) => {
  res.status(503).json({
    message: 'Database connection error',
    details: 'The application is having trouble connecting to the database. Please try again later.',
    timestamp: new Date().toISOString()
  });
});

(async () => {
  try {
    // Test database connection before registering routes
    try {
      await db.execute(sql`SELECT 1 as test`);
      console.log('Initial database connection test successful');
    } catch (dbError) {
      console.error('Initial database connection test failed:', dbError);
      // Continue anyway to let the application handle DB errors gracefully
    }
    
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Express error handler:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      // Add better error details
      const errorDetails = process.env.NODE_ENV === 'development' ? {
        stack: err.stack,
        cause: err.cause ? err.cause.toString() : undefined
      } : undefined;
      
      res.status(status).json({ 
        message,
        ...(errorDetails ? { details: errorDetails } : {})
      });
    });

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Railway specifically uses port 8080 internally
    const port = process.env.PORT || 8080; 
    
    console.log(`Attempting to listen on port ${port}. Railway port: ${process.env.PORT}`);
    
    server.listen({
      port,
      host: "0.0.0.0",
    }, () => {
      log(`Server listening on port ${port} in ${app.get("env")} mode`);
      
      // Print all available environment variables for debugging
      console.log('Available env vars:', Object.keys(process.env).filter(k => !k.includes('KEY') && !k.includes('SECRET') && !k.includes('TOKEN')));
    });

    server.on('error', (err) => {
      console.error('Server error:', err);
      if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
      }
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
    }
  }
})();
