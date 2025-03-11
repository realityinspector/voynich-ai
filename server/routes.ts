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
  
  // Mount AI and payment routes
  app.use('/api/ai', aiRouter);
  app.use('/api/payments', paymentsRouter);
  
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
              // Create a new manuscript page entry
              page = await storage.createManuscriptPage({
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
  
  // Symbol extraction job routes
  app.post('/api/extraction/start', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { startPageId, endPageId, parameters } = req.body;
      
      // Verify pages exist
      const startPage = await storage.getManuscriptPage(startPageId);
      if (!startPage) {
        return res.status(404).json({ message: 'Start page not found' });
      }
      
      const endPage = await storage.getManuscriptPage(endPageId);
      if (!endPage) {
        return res.status(404).json({ message: 'End page not found' });
      }
      
      // Create extraction job
      const job = await storage.createExtractionJob({
        userId,
        startPageId,
        endPageId,
        parameters
      });
      
      // In a real implementation, we would start an asynchronous job here
      // For now, we'll just return the job
      
      res.json({ job });
    } catch (error) {
      console.error('Error starting extraction job:', error);
      res.status(500).json({ message: 'Failed to start extraction job' });
    }
  });
  
  app.get('/api/extraction/jobs', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const jobs = await storage.listExtractionJobsByUser(userId);
      res.json({ jobs });
    } catch (error) {
      console.error('Error fetching extraction jobs:', error);
      res.status(500).json({ message: 'Failed to fetch extraction jobs' });
    }
  });
  
  app.get('/api/extraction/job/:id', isAuthenticated, async (req, res) => {
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
  
  return httpServer;
}
