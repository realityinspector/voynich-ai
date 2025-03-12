import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { apiKeys } from '@shared/schema';

// Extend the Request interface to include API key authentication
declare global {
  namespace Express {
    interface Request {
      apiKey?: any;
      apiUser?: any;
    }
  }
}

/**
 * Middleware to authenticate requests using API key
 * Looks for Authorization: Bearer YOUR_API_KEY in headers
 */
export async function authenticateApiKey(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: {
          message: 'API key missing or invalid',
          code: 'auth_error',
          status: 401
        } 
      });
    }
    
    const apiKeyString = authHeader.split(' ')[1];
    if (!apiKeyString) {
      return res.status(401).json({ 
        error: {
          message: 'API key missing',
          code: 'auth_error',
          status: 401
        } 
      });
    }
    
    // Validate the API key
    const apiKey = await storage.getApiKeyByKeyString(apiKeyString);
    if (!apiKey) {
      return res.status(401).json({ 
        error: {
          message: 'Invalid API key',
          code: 'auth_error',
          status: 401
        } 
      });
    }
    
    // Update the last used timestamp
    await db
      .update(apiKeys)
      .set({ lastUsed: new Date() })
      .where(eq(apiKeys.id, apiKey.id));
    
    // Get the user associated with this API key
    const user = await storage.getUser(apiKey.userId);
    if (!user) {
      return res.status(401).json({ 
        error: {
          message: 'User not found for this API key',
          code: 'auth_error',
          status: 401
        } 
      });
    }
    
    // Attach the API key and user to the request
    req.apiKey = apiKey;
    req.apiUser = user;
    
    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    res.status(500).json({ 
      error: {
        message: 'Authentication error',
        code: 'server_error',
        status: 500
      } 
    });
  }
}

/**
 * Middleware to track API usage
 * Records request count and token usage
 */
export function trackApiUsage(req: Request, res: Response, next: NextFunction) {
  // Original response.json method
  const originalJson = res.json;
  
  // Override response.json to track token usage from AI requests
  res.json = function(body: any) {
    // If this is an AI request that includes token usage, track it
    if (body && body.usage && body.usage.total_tokens && req.apiUser) {
      const tokensUsed = body.usage.total_tokens;
      // Here we would typically record token usage in a database
      // For now just log it
      console.log(`API usage: User ${req.apiUser.id} used ${tokensUsed} tokens`);
    }
    
    return originalJson.call(this, body);
  };
  
  next();
}

/**
 * Middleware to limit requests
 * Implements rate limiting for API requests
 */
export function rateLimitRequests(req: Request, res: Response, next: NextFunction) {
  // For now, a simple implementation - we'll log the request
  // In a production app, we would use a more sophisticated rate limiting strategy
  if (req.apiUser) {
    console.log(`Rate limit check for user ${req.apiUser.id}`);
    
    // Here we would check if the user has exceeded their rate limit
    // For now, just allow all requests
    next();
  } else {
    next();
  }
}