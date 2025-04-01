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

// Add startup diagnostics
console.log('Server starting with environment:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  PWD: process.cwd(),
  distExists: fs.existsSync(path.join(process.cwd(), 'dist')),
  publicExists: fs.existsSync(path.join(process.cwd(), 'dist', 'public'))
});

// Add health check endpoint
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
    
    return res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: dbConnected ? 'connected' : 'error',
      environment: app.get('env'),
      envVars
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      db: 'error',
      error: error.message,
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

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

(async () => {
  try {
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Express error handler:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
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
      process.exit(1);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();
