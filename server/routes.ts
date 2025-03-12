import express, { type Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { storage } from "./storage";
import { setupSession, setupAuth, setupAuthRoutes, isAuthenticated, isAdmin } from "./auth";
import { eq } from "drizzle-orm";
import { manuscriptPages, users } from "@shared/schema";
import { UploadedFileMetadata } from "@shared/types";
import aiRouter from "./api/ai";
import paymentsRouter from "./api/payments";
import externalRouter from "./api/external";

// Setup multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(process.cwd(), 'uploads');
      // Create the upload directory if it doesn't exist
      fs.mkdir(dir, { recursive: true })
        .then(() => cb(null, dir))
        .catch(err => cb(err, dir));
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only PNG files
    if (file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only PNG files are allowed!'), false);
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup authentication
  setupSession(app);
  setupAuth(app);
  setupAuthRoutes(app);
  
  // Make uploads directory available
  app.use('/uploads', isAuthenticated, express.static(path.join(process.cwd(), 'uploads')));
  
  // API routes
  
  // Mount API routes
  app.use('/api/ai', aiRouter);
  app.use('/api/payments', paymentsRouter);
  app.use('/api/external', externalRouter);
  
  // Dashboard Statistics
  app.get('/api/stats/dashboard', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Get real counts from storage
      const pages = await storage.listManuscriptPages();
      const totalPages = pages.length;
      
      // Count symbols - accumulate from all pages
      let totalSymbols = 0;
      for (const page of pages) {
        const pageSymbols = await storage.getSymbolsByPage(page.id);
        totalSymbols += pageSymbols.length;
      }
      
      // Count annotations
      let totalAnnotations = 0;
      for (const page of pages) {
        const pageAnnotations = await storage.getAnnotationsByPage(page.id);
        totalAnnotations += pageAnnotations.length;
      }
      
      // Get analysis results
      const analysisResults = await storage.getAnalysisResultsByUser(userId);
      const totalAnalyses = analysisResults.length;
      
      // Get user credits
      const userCredits = await storage.getUserCredits(userId);
      
      // Generate symbol distribution data
      const categories = ['herbal', 'astronomical', 'biological', 'cosmological', 'pharmaceutical', 'recipes', 'unknown'];
      const symbolDistribution = categories.map(category => ({
        name: category.charAt(0).toUpperCase() + category.slice(1),
        value: Math.floor(Math.random() * 100) + 50 // Placeholder until we have real categorization
      }));
      
      // Generate activity timeline
      const days = 7;
      const activityTimeline = Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - i - 1));
        return {
          date: date.toISOString().split('T')[0],
          annotations: Math.floor(Math.random() * 5),
          analyses: Math.floor(Math.random() * 3),
          symbols: Math.floor(Math.random() * 10)
        };
      });
      
      res.json({
        stats: {
          totalPages,
          totalSymbols,
          totalAnnotations,
          totalAnalyses,
          userCredits
        },
        symbolDistribution,
        activityTimeline
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
    }
  });
  
  // Recent Activity
  app.get('/api/activity/recent', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 10;
      
      // Get user activity from storage
      const activityFeed = await storage.getUserActivityFeed(userId, limit);
      
      // Transform activity feed to a more UI-friendly format
      const activities = activityFeed.map(activity => {
        let description = 'Unknown activity';
        
        // Format description based on activity type
        switch (activity.type) {
          case 'annotation_created':
            description = 'Added a new annotation';
            break;
          case 'annotation_upvoted':
            description = 'Received an upvote on annotation';
            break;
          case 'note_created':
            description = 'Created a new research note';
            break;
          case 'analysis_created':
            description = 'Performed an AI analysis';
            break;
          case 'symbol_categorized':
            description = 'Categorized a symbol';
            break;
        }
        
        // Calculate time ago
        const activityDate = new Date(activity.createdAt);
        const now = new Date();
        const diffMs = now.getTime() - activityDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        let timeAgo = '';
        if (diffDays > 0) {
          timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } else if (diffHours > 0) {
          timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else if (diffMins > 0) {
          timeAgo = `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        } else {
          timeAgo = 'Just now';
        }
        
        return {
          ...activity,
          description,
          timeAgo,
          type: activity.type.split('_')[0] // Extract the base type for UI display
        };
      });
      
      res.json({ activities });
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      res.status(500).json({ message: 'Failed to fetch recent activity' });
    }
  });
  
  // Manuscript page routes
  app.get('/api/pages', isAuthenticated, async (req, res) => {
    try {
      const offset = parseInt(req.query.offset as string) || 0;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const pages = await storage.listManuscriptPages(offset, limit);
      res.json({ pages });
    } catch (error) {
      console.error('Error fetching pages:', error);
      res.status(500).json({ message: 'Failed to fetch manuscript pages' });
    }
  });
  
  app.get('/api/pages/:id', isAuthenticated, async (req, res) => {
    try {
      const pageId = parseInt(req.params.id);
      const page = await storage.getManuscriptPage(pageId);
      
      if (!page) {
        return res.status(404).json({ message: 'Page not found' });
      }
      
      res.json({ page });
    } catch (error) {
      console.error('Error fetching page:', error);
      res.status(500).json({ message: 'Failed to fetch manuscript page' });
    }
  });
  
  app.get('/api/pages/folio/:folioNumber', isAuthenticated, async (req, res) => {
    try {
      const folioNumber = req.params.folioNumber;
      const page = await storage.getManuscriptPageByFolio(folioNumber);
      
      if (!page) {
        return res.status(404).json({ message: 'Page not found' });
      }
      
      res.json({ page });
    } catch (error) {
      console.error('Error fetching page by folio:', error);
      res.status(500).json({ message: 'Failed to fetch manuscript page' });
    }
  });
  
  // Symbol routes
  app.get('/api/symbols/page/:pageId', isAuthenticated, async (req, res) => {
    try {
      const pageId = parseInt(req.params.pageId);
      const symbols = await storage.getSymbolsByPage(pageId);
      res.json({ symbols });
    } catch (error) {
      console.error('Error fetching symbols:', error);
      res.status(500).json({ message: 'Failed to fetch symbols' });
    }
  });
  
  app.get('/api/symbols/:id', isAuthenticated, async (req, res) => {
    try {
      const symbolId = parseInt(req.params.id);
      const symbol = await storage.getSymbol(symbolId);
      
      if (!symbol) {
        return res.status(404).json({ message: 'Symbol not found' });
      }
      
      res.json({ symbol });
    } catch (error) {
      console.error('Error fetching symbol:', error);
      res.status(500).json({ message: 'Failed to fetch symbol' });
    }
  });
  
  // Annotation routes
  app.get('/api/annotations/page/:pageId', isAuthenticated, async (req, res) => {
    try {
      const pageId = parseInt(req.params.pageId);
      const annotations = await storage.getAnnotationsByPage(pageId);
      res.json({ annotations });
    } catch (error) {
      console.error('Error fetching annotations:', error);
      res.status(500).json({ message: 'Failed to fetch annotations' });
    }
  });
  
  app.post('/api/annotations', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { pageId, x, y, width, height, content } = req.body;
      
      const annotation = await storage.createAnnotation({
        pageId,
        userId,
        x,
        y,
        width,
        height,
        content
      });
      
      res.json({ annotation });
    } catch (error) {
      console.error('Error creating annotation:', error);
      res.status(500).json({ message: 'Failed to create annotation' });
    }
  });
  
  // Notes routes
  app.get('/api/notes', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const notes = await storage.getNotesByUser(userId);
      res.json({ notes });
    } catch (error) {
      console.error('Error fetching notes:', error);
      res.status(500).json({ message: 'Failed to fetch notes' });
    }
  });
  
  app.get('/api/notes/public', async (req, res) => {
    try {
      const notes = await storage.getPublicNotes();
      res.json({ notes });
    } catch (error) {
      console.error('Error fetching public notes:', error);
      res.status(500).json({ message: 'Failed to fetch public notes' });
    }
  });
  
  app.post('/api/notes', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { title, content, isPublic, tags } = req.body;
      
      const note = await storage.createNote({
        userId,
        title,
        content,
        isPublic,
        tags
      });
      
      res.json({ note });
    } catch (error) {
      console.error('Error creating note:', error);
      res.status(500).json({ message: 'Failed to create note' });
    }
  });
  
  app.put('/api/notes/:id', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const noteId = parseInt(req.params.id);
      const { title, content, isPublic, tags } = req.body;
      
      // Check if note exists and belongs to user
      const existingNote = await storage.getNote(noteId);
      if (!existingNote) {
        return res.status(404).json({ message: 'Note not found' });
      }
      
      if (existingNote.userId !== userId) {
        return res.status(403).json({ message: 'Not authorized to update this note' });
      }
      
      const updatedNote = await storage.updateNote(noteId, {
        title,
        content,
        isPublic,
        tags,
        updatedAt: new Date()
      });
      
      res.json({ note: updatedNote });
    } catch (error) {
      console.error('Error updating note:', error);
      res.status(500).json({ message: 'Failed to update note' });
    }
  });
  
  app.delete('/api/notes/:id', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const noteId = parseInt(req.params.id);
      
      // Check if note exists and belongs to user
      const existingNote = await storage.getNote(noteId);
      if (!existingNote) {
        return res.status(404).json({ message: 'Note not found' });
      }
      
      if (existingNote.userId !== userId) {
        return res.status(403).json({ message: 'Not authorized to delete this note' });
      }
      
      await storage.deleteNote(noteId);
      
      res.json({ message: 'Note deleted successfully' });
    } catch (error) {
      console.error('Error deleting note:', error);
      res.status(500).json({ message: 'Failed to delete note' });
    }
  });
  
  // Admin routes - Upload manuscript pages
  app.post('/api/admin/upload', isAdmin, upload.array('pages', 300), async (req, res) => {
    try {
      const userId = req.user!.id;
      const files = req.files as Express.Multer.File[];
      const folioData = req.body.folioData ? JSON.parse(req.body.folioData) : {};
      
      console.log(`Received ${files.length} files for upload`);
      
      const results: any[] = [];
      
      // Process files in chunks of 5 concurrently
      const chunkSize = 5;
      for (let i = 0; i < files.length; i += chunkSize) {
        const chunk = files.slice(i, i + chunkSize);
        
        // Process each chunk concurrently
        const chunkPromises = chunk.map(async (file) => {
          try {
            // Extract folio number from filename or use provided data
            const folioNumber = folioData[file.originalname] || extractFolioNumber(file.originalname);
            
            // Extract the numeric ID from the folio number
            const pageId = getPageIdFromFolio(folioNumber);
            
            // Check if a page with this folioNumber already exists
            const existingPage = await storage.getManuscriptPageByFolio(folioNumber);
            
            let page;
            if (existingPage) {
              // Update the existing page with the new file
              page = await storage.updateManuscriptPage(existingPage.id, {
                filename: file.filename,
                uploadedBy: userId
              });
            } else {
              // Create a new manuscript page entry with the specified ID from folio number
              // The ID field is allowed in our schema because we've modified insertManuscriptPageSchema
              page = await storage.createManuscriptPage({
                id: pageId,
                folioNumber,
                filename: file.filename,
                uploadedBy: userId
              });
            }
            
            return {
              originalname: file.originalname,
              folioNumber,
              id: page.id,
              success: true
            };
          } catch (error) {
            console.error(`Error processing file ${file.originalname}:`, error);
            return {
              originalname: file.originalname,
              success: false,
              error: error instanceof Error ? error.message : 'Failed to process file'
            };
          }
        });
        
        // Wait for all files in the current chunk to be processed
        const chunkResults = await Promise.all(chunkPromises);
        results.push(...chunkResults);
      }
      
      res.json({ results });
    } catch (error) {
      console.error('Error uploading files:', error);
      res.status(500).json({ message: 'Failed to upload manuscript pages' });
    }
  });
  
  // Symbol extraction job routes - restricted to admin users
  app.post('/api/extraction/start', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { startPageId, endPageId, parameters } = req.body;
      
      // Enhanced metadata for symbols will be included in the parameters
      const enhancedParams = {
        ...parameters,
        includeMetadata: true,
        calculateFrequency: true
      };
      
      // Create extraction job
      const job = await storage.createExtractionJob({
        userId,
        startPageId,
        endPageId,
        parameters: enhancedParams
      });
      
      // Simulate an asynchronous extraction job by creating actual symbols
      // In a production environment, this would be done by a background worker
      setTimeout(async () => {
        try {
          let pageIds = [];
          
          // If the range is "all pages" (startPageId === endPageId === 0), fetch all pages
          if (startPageId === 0 && endPageId === 0) {
            // Get all pages without a limit - note this could be optimized for large datasets
            const allPages = await storage.listManuscriptPages(0, 1000);
            pageIds = allPages.map(page => page.id);
          } else {
            // Verify pages exist for a specific range
            const startPage = await storage.getManuscriptPage(startPageId);
            if (!startPage) {
              console.error('Start page not found:', startPageId);
              return;
            }
            
            const endPage = await storage.getManuscriptPage(endPageId);
            if (!endPage) {
              console.error('End page not found:', endPageId);
              return;
            }
            
            // For a specific range, get all pages within that range
            const rangePages = await storage.listManuscriptPages();
            // Filter pages between start and end IDs
            pageIds = rangePages
              .filter(page => page.id >= startPageId && page.id <= endPageId)
              .map(page => page.id);
          }
          
          let totalSymbolsCreated = 0;
          
          // Update job progress to 25%
          await storage.updateExtractionJobProgress(job.id, 25, totalSymbolsCreated);
          
          // Process each page sequentially
          for (const pageId of pageIds) {
            // Get the page
            const page = await storage.getManuscriptPage(pageId);
            if (!page) continue;
            
            // Generate random number of symbols for the page (between 100-200)
            const symbolCount = Math.floor(Math.random() * 100) + 100;
            const symbolsForPage = [];
            
            // Create symbols with random positions on the page
            // In a real implementation, this would use computer vision to identify actual symbols
            for (let i = 0; i < symbolCount; i++) {
              // Generate random position and size
              const x = Math.floor(Math.random() * 800) + 100; // Random X between 100-900
              const y = Math.floor(Math.random() * 1000) + 100; // Random Y between 100-1100
              const width = Math.floor(Math.random() * 40) + 20; // Random width between 20-60
              const height = Math.floor(Math.random() * 40) + 20; // Random height between 20-60
              
              // Create a placeholder image path
              // In a real implementation, this would be a path to an actual extracted image
              const image = `symbol_${pageId}_${i}.png`;
              
              // Create the symbol record
              const symbol = await storage.createSymbol({
                pageId: pageId,
                image: image,
                x: x,
                y: y,
                width: width,
                height: height,
                category: undefined, // Initially uncategorized
                frequency: undefined, // Will be calculated later
                metadata: {
                  extractionParameters: parameters,
                  confidence: Math.random() * 0.5 + 0.5 // Random confidence between 0.5-1.0
                }
              });
              
              symbolsForPage.push(symbol);
              totalSymbolsCreated++;
            }
            
            // Update job progress (proportional to pages processed)
            const progress = 25 + ((pageIds.indexOf(pageId) + 1) / pageIds.length) * 75;
            await storage.updateExtractionJobProgress(job.id, Math.floor(progress), totalSymbolsCreated);
          }
          
          // Complete the job after processing all pages
          await storage.completeExtractionJob(job.id);
          
          console.log(`Extraction job ${job.id} complete: ${totalSymbolsCreated} symbols created`);
        } catch (err) {
          console.error('Error in extraction job processing:', err);
        }
      }, 1000);
      
      res.json({ job });
    } catch (error) {
      console.error('Error starting extraction job:', error);
      res.status(500).json({ message: 'Failed to start extraction job' });
    }
  });
  
  app.get('/api/extraction/jobs', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = req.user!.id;
      const jobs = await storage.listExtractionJobsByUser(userId);
      res.json({ jobs });
    } catch (error) {
      console.error('Error fetching extraction jobs:', error);
      res.status(500).json({ message: 'Failed to fetch extraction jobs' });
    }
  });
  
  app.get('/api/extraction/job/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getExtractionJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: 'Extraction job not found' });
      }
      
      res.json({ job });
    } catch (error) {
      console.error('Error fetching extraction job:', error);
      res.status(500).json({ message: 'Failed to fetch extraction job' });
    }
  });
  
  // API Key management
  app.get('/api/api-keys', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const keys = await storage.listApiKeysByUser(userId);
      
      // Don't return the actual key string
      const safeKeys = keys.map(key => ({
        id: key.id,
        name: key.name,
        createdAt: key.createdAt,
        lastUsed: key.lastUsed
      }));
      
      res.json({ keys: safeKeys });
    } catch (error) {
      console.error('Error fetching API keys:', error);
      res.status(500).json({ message: 'Failed to fetch API keys' });
    }
  });
  
  app.post('/api/api-keys', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: 'API key name is required' });
      }
      
      // Generate a random API key string
      const key = Array(32)
        .fill(0)
        .map(() => Math.random().toString(36).charAt(2))
        .join('');
      
      // Create the API key
      const apiKey = await storage.createApiKey({
        userId,
        key,
        name,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      });
      
      // Return the key to the user - this is the only time the key is visible
      res.status(201).json({
        id: apiKey.id,
        name: apiKey.name,
        key: apiKey.key,
        createdAt: apiKey.createdAt
      });
    } catch (error) {
      console.error('Error creating API key:', error);
      res.status(500).json({ message: 'Failed to create API key' });
    }
  });
  
  app.delete('/api/api-keys/:id', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const keyId = parseInt(req.params.id);
      
      // Check if the key exists and belongs to the user
      const keys = await storage.listApiKeysByUser(userId);
      const keyExists = keys.some(key => key.id === keyId);
      
      if (!keyExists) {
        return res.status(404).json({ message: 'API key not found' });
      }
      
      // Delete the key
      await storage.deleteApiKey(keyId);
      
      res.json({ message: 'API key deleted successfully' });
    } catch (error) {
      console.error('Error deleting API key:', error);
      res.status(500).json({ message: 'Failed to delete API key' });
    }
  });

  // Helper functions
  function extractFolioNumber(filename: string): string {
    // Extract folio number from filename
    // Examples: "page_001.png" -> "1r", "folio_025v.png" -> "25v"
    
    // Default regex to extract numbers
    const numberMatch = filename.match(/\d+/);
    if (!numberMatch) {
      throw new Error(`Could not extract folio number from filename: ${filename}`);
    }
    
    // Extract recto/verso (r/v) if present
    const sideMatch = filename.match(/[rv]/i);
    const side = sideMatch ? sideMatch[0].toLowerCase() : 'r'; // Default to recto
    
    // Format as standard folio number
    return `${parseInt(numberMatch[0])}${side}`;
  }
  
  // Get page ID from folio number
  function getPageIdFromFolio(folioNumber: string): number {
    // Extract the numeric part from folio number (e.g., "10r" -> 10)
    const match = folioNumber.match(/^(\d+)[rv]$/i);
    if (!match) {
      throw new Error(`Invalid folio number format: ${folioNumber}`);
    }
    return parseInt(match[1]);
  }
  
  return httpServer;
}
