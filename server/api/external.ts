import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { authenticateApiKey, trackApiUsage, rateLimitRequests } from '../middleware/apiKeyAuth';
import { AnnotationCreateRequest, AnnotationVoteRequest } from '@shared/types';
import { z } from 'zod';
import { insertAnnotationSchema, insertSymbolSchema } from '@shared/schema';
import { nanoid } from 'nanoid';

const router = Router();

// Apply API key authentication and usage tracking to all routes in this router
router.use(authenticateApiKey);
router.use(trackApiUsage);
router.use(rateLimitRequests);

// GET /api/external/pages - List manuscript pages
router.get('/pages', async (req: Request, res: Response) => {
  try {
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const pages = await storage.listManuscriptPages(offset, limit);
    res.json({ 
      data: pages,
      pagination: {
        offset,
        limit,
        total: pages.length // In a real app, we'd get the total count from the database
      }
    });
  } catch (error) {
    console.error('Error fetching pages:', error);
    res.status(500).json({ 
      error: {
        message: 'Failed to fetch manuscript pages',
        code: 'server_error',
        status: 500
      }
    });
  }
});

// GET /api/external/pages/:id - Get a specific manuscript page
router.get('/pages/:id', async (req: Request, res: Response) => {
  try {
    const pageId = parseInt(req.params.id);
    if (isNaN(pageId)) {
      return res.status(400).json({ 
        error: {
          message: 'Invalid page ID',
          code: 'invalid_input',
          status: 400
        }
      });
    }
    
    const page = await storage.getManuscriptPage(pageId);
    if (!page) {
      return res.status(404).json({ 
        error: {
          message: 'Page not found',
          code: 'not_found',
          status: 404
        }
      });
    }
    
    res.json({ data: page });
  } catch (error) {
    console.error('Error fetching page:', error);
    res.status(500).json({ 
      error: {
        message: 'Failed to fetch manuscript page',
        code: 'server_error',
        status: 500
      }
    });
  }
});

// GET /api/external/symbols/page/:pageId - Get symbols for a specific page
router.get('/symbols/page/:pageId', async (req: Request, res: Response) => {
  try {
    const pageId = parseInt(req.params.pageId);
    if (isNaN(pageId)) {
      return res.status(400).json({ 
        error: {
          message: 'Invalid page ID',
          code: 'invalid_input',
          status: 400
        }
      });
    }
    
    const symbols = await storage.getSymbolsByPage(pageId);
    res.json({ data: symbols });
  } catch (error) {
    console.error('Error fetching symbols:', error);
    res.status(500).json({ 
      error: {
        message: 'Failed to fetch symbols',
        code: 'server_error',
        status: 500
      }
    });
  }
});

// POST /api/external/symbols - Create a new symbol
router.post('/symbols', async (req: Request, res: Response) => {
  try {
    // Validate the request body
    const validationResult = insertSymbolSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: {
          message: 'Invalid symbol data',
          code: 'invalid_input',
          status: 400,
          details: validationResult.error.errors
        }
      });
    }
    
    // Add the symbol
    const symbolData = validationResult.data;
    
    // Generate a random image filename if not provided
    if (!symbolData.image) {
      const filename = `symbol_${nanoid(8)}.png`;
      symbolData.image = `/uploads/symbols/${filename}`;
    }
    
    const newSymbol = await storage.createSymbol(symbolData);
    
    // Create an activity feed entry
    await storage.createActivityFeedEntry({
      userId: req.apiUser.id,
      type: 'symbol_categorized',
      entityId: newSymbol.id,
      entityType: 'symbol',
      isPublic: true,
      metadata: {
        pageId: newSymbol.pageId,
        category: newSymbol.category || 'uncategorized'
      }
    });
    
    res.status(201).json({ data: newSymbol });
  } catch (error) {
    console.error('Error creating symbol:', error);
    res.status(500).json({ 
      error: {
        message: 'Failed to create symbol',
        code: 'server_error',
        status: 500
      }
    });
  }
});

// GET /api/external/annotations/page/:pageId - Get annotations for a specific page
router.get('/annotations/page/:pageId', async (req: Request, res: Response) => {
  try {
    const pageId = parseInt(req.params.pageId);
    if (isNaN(pageId)) {
      return res.status(400).json({ 
        error: {
          message: 'Invalid page ID',
          code: 'invalid_input',
          status: 400
        }
      });
    }
    
    const annotations = await storage.getAnnotationsByPage(pageId);
    res.json({ data: annotations });
  } catch (error) {
    console.error('Error fetching annotations:', error);
    res.status(500).json({ 
      error: {
        message: 'Failed to fetch annotations',
        code: 'server_error',
        status: 500
      }
    });
  }
});

// POST /api/external/annotations - Create a new annotation
router.post('/annotations', async (req: Request, res: Response) => {
  try {
    // Validate request data using our annotation schema
    const requestData: AnnotationCreateRequest = req.body;
    
    const validationSchema = insertAnnotationSchema.extend({
      // Add isPublic which is optional in the request
      isPublic: z.boolean().optional()
    });
    
    const validationResult = validationSchema.safeParse({
      ...requestData,
      userId: req.apiUser.id,
      apiKeyId: req.apiKey.id,
      source: 'api'
    });
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: {
          message: 'Invalid annotation data',
          code: 'invalid_input',
          status: 400,
          details: validationResult.error.errors
        }
      });
    }
    
    // Create the annotation
    const newAnnotation = await storage.createAnnotation(validationResult.data);
    
    // Create an activity feed entry
    await storage.createActivityFeedEntry({
      userId: req.apiUser.id,
      type: 'annotation_created',
      entityId: newAnnotation.id,
      entityType: 'annotation',
      isPublic: newAnnotation.isPublic,
      metadata: {
        pageId: newAnnotation.pageId,
        source: 'api'
      }
    });
    
    res.status(201).json({ data: newAnnotation });
  } catch (error) {
    console.error('Error creating annotation:', error);
    res.status(500).json({ 
      error: {
        message: 'Failed to create annotation',
        code: 'server_error',
        status: 500
      }
    });
  }
});

// POST /api/external/annotations/:id/vote - Vote on an annotation
router.post('/annotations/:id/vote', async (req: Request, res: Response) => {
  try {
    const annotationId = parseInt(req.params.id);
    if (isNaN(annotationId)) {
      return res.status(400).json({ 
        error: {
          message: 'Invalid annotation ID',
          code: 'invalid_input',
          status: 400
        }
      });
    }
    
    // Get annotation to make sure it exists
    const annotation = await storage.getAnnotation(annotationId);
    if (!annotation) {
      return res.status(404).json({ 
        error: {
          message: 'Annotation not found',
          code: 'not_found',
          status: 404
        }
      });
    }
    
    // Validate vote data
    const voteData: AnnotationVoteRequest = req.body;
    if (!voteData.voteType || !['upvote', 'downvote'].includes(voteData.voteType)) {
      return res.status(400).json({ 
        error: {
          message: 'Invalid vote type, must be "upvote" or "downvote"',
          code: 'invalid_input',
          status: 400
        }
      });
    }
    
    // Create the vote
    const vote = await storage.createAnnotationVote({
      annotationId,
      userId: req.apiUser.id,
      voteType: voteData.voteType
    });
    
    // If it's an upvote, create an activity
    if (voteData.voteType === 'upvote') {
      await storage.createActivityFeedEntry({
        userId: req.apiUser.id,
        type: 'annotation_upvoted',
        entityId: annotationId,
        entityType: 'annotation',
        isPublic: true,
        metadata: {
          pageId: annotation.pageId,
          annotationUserId: annotation.userId
        }
      });
    }
    
    // Return the updated annotation
    const updatedAnnotation = await storage.getAnnotation(annotationId);
    
    res.json({ data: updatedAnnotation });
  } catch (error) {
    console.error('Error voting on annotation:', error);
    res.status(500).json({ 
      error: {
        message: 'Failed to vote on annotation',
        code: 'server_error',
        status: 500
      }
    });
  }
});

// GET /api/external/leaderboard - Get leaderboard data
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const timeframe = req.query.timeframe as string || 'weekly';
    if (!['daily', 'weekly', 'monthly', 'alltime'].includes(timeframe)) {
      return res.status(400).json({ 
        error: {
          message: 'Invalid timeframe, must be "daily", "weekly", "monthly", or "alltime"',
          code: 'invalid_input',
          status: 400
        }
      });
    }
    
    const leaderboard = await storage.getLeaderboard(timeframe);
    res.json({ data: leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ 
      error: {
        message: 'Failed to fetch leaderboard',
        code: 'server_error',
        status: 500
      }
    });
  }
});

// GET /api/external/activity-feed - Get activity feed
router.get('/activity-feed', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const activities = await storage.getPublicActivityFeed(limit, offset);
    res.json({ 
      data: activities,
      pagination: {
        offset,
        limit,
        total: activities.length // In a real app, we'd get the total count
      }
    });
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    res.status(500).json({ 
      error: {
        message: 'Failed to fetch activity feed',
        code: 'server_error',
        status: 500
      }
    });
  }
});

// GET /api/external/usage - Get API usage stats for the authenticated user
router.get('/usage', async (req: Request, res: Response) => {
  try {
    // In a real implementation, we would query the database for actual usage stats
    // For now, return placeholder data
    const usage = {
      totalRequests: 100,
      requestsToday: 10,
      requestsThisWeek: 50,
      requestsThisMonth: 100,
      tokensUsed: 5000
    };
    
    res.json({ data: usage });
  } catch (error) {
    console.error('Error fetching API usage:', error);
    res.status(500).json({ 
      error: {
        message: 'Failed to fetch API usage',
        code: 'server_error',
        status: 500
      }
    });
  }
});

export default router;