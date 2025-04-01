import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Try multiple possible paths where static files might be located
  const possiblePaths = [
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(process.cwd(), "public"),
    path.resolve(__dirname, "..", "dist", "public"),
    path.resolve(__dirname, "public"),
    path.resolve("/app/dist/public"),
  ];

  console.log('Checking possible static file paths:');
  possiblePaths.forEach(p => {
    console.log(`- ${p}: ${fs.existsSync(p) ? 'EXISTS' : 'not found'}`);
    if (fs.existsSync(p)) {
      console.log(`  Contents: ${fs.readdirSync(p).join(', ')}`);
    }
  });

  // Find the first path that exists
  const distPath = possiblePaths.find(p => fs.existsSync(p));
  
  if (!distPath) {
    throw new Error(`Could not find any valid static file directory. Checked: ${possiblePaths.join(', ')}`);
  }
  
  console.log(`Using static file path: ${distPath}`);
  
  const indexPath = path.join(distPath, "index.html");
  
  if (!fs.existsSync(indexPath)) {
    throw new Error(`index.html not found at ${indexPath}`);
  }
  
  // Serve static files with explicit caching headers
  app.use(express.static(distPath, {
    index: false,
    maxAge: '1h',
    etag: true
  }));
  
  // Set up a specific route for the root path to ensure it always serves index.html
  app.get('/', (req, res) => {
    console.log('Serving index.html for root path');
    res.sendFile(indexPath);
  });
  
  // Catch-all route for SPA navigation
  app.get('*', (req, res) => {
    console.log(`Serving index.html for path: ${req.path}`);
    
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    res.sendFile(indexPath);
  });
}
