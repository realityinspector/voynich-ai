import { Request, Response, Router } from 'express';
import { isAuthenticated } from '../auth';
import { storage } from '../storage';
import { AIAnalysisRequest } from '@shared/types';
import { nanoid } from 'nanoid';
import { createHash } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

// Together AI integration
const TOGETHER_API_URL = 'https://api.together.xyz/v1/chat/completions';
const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY || '';

// Cost per analysis in credits
const ANALYSIS_CREDIT_COST = 1;

// Available models (using the Llama-Vision-Free model exclusively)
const AVAILABLE_MODELS = [
  { id: 'meta-llama/Llama-Vision-Free', name: 'Llama Vision Free', creditCost: 3 },
];

// Get available models
router.get('/models', isAuthenticated, (req, res) => {
  res.json({ models: AVAILABLE_MODELS });
});

// Get user credits
router.get('/credits', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const credits = await storage.getUserCredits(userId);
    res.json({ credits });
  } catch (error) {
    console.error('Error fetching credits:', error);
    res.status(500).json({ message: 'Failed to fetch credits' });
  }
});

// Run AI analysis on manuscript page
router.post('/analyze', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { pageId, prompt, modelParams, references, isPublic }: AIAnalysisRequest = req.body;
    
    // Validate required fields
    if (!pageId || !prompt || !modelParams) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Check if the page exists
    const page = await storage.getManuscriptPage(pageId);
    if (!page) {
      return res.status(404).json({ message: 'Manuscript page not found' });
    }
    
    // Check if user has enough credits
    const credits = await storage.getUserCredits(userId);
    const modelInfo = AVAILABLE_MODELS.find(m => m.id === modelParams.model);
    
    if (!modelInfo) {
      return res.status(400).json({ message: 'Invalid model selected' });
    }
    
    const creditCost = modelInfo.creditCost;
    
    if (credits < creditCost) {
      return res.status(403).json({ 
        message: 'Insufficient credits',
        credits,
        required: creditCost
      });
    }
    
    // Load image data
    let imagePath;
    try {
      imagePath = path.join(process.cwd(), 'uploads', page.filename);
      await fs.access(imagePath);
    } catch (err) {
      return res.status(500).json({ message: 'Image file not available' });
    }
    
    // Process references if provided
    let processedReferences = [];
    if (references && references.length > 0) {
      for (const ref of references) {
        if (ref.type === 'page') {
          const refPage = await storage.getManuscriptPage(ref.id);
          if (refPage) {
            processedReferences.push({
              type: 'page',
              id: ref.id,
              folioNumber: refPage.folioNumber,
              section: refPage.section
            });
          }
        } else if (ref.type === 'symbol') {
          const symbol = await storage.getSymbol(ref.id);
          if (symbol) {
            processedReferences.push({
              type: 'symbol',
              id: ref.id,
              pageId: symbol.pageId,
              category: symbol.category,
              x: symbol.x,
              y: symbol.y,
              width: symbol.width,
              height: symbol.height
            });
          }
        }
      }
    }
    
    // Query Together AI
    const aiResult = await queryTogetherAI(prompt, modelParams, page, processedReferences);
    
    // Use credits
    await storage.useUserCredits(
      userId, 
      creditCost, 
      `AI analysis on page ${page.folioNumber} with model ${modelParams.model}`
    );
    
    // Save the analysis result
    const analysisResult = await storage.createAnalysisResult({
      userId,
      pageId,
      type: 'custom_prompt',
      prompt,
      result: aiResult,
      isPublic,
      model: modelParams.model
    });
    
    res.json({
      result: analysisResult,
      remainingCredits: await storage.getUserCredits(userId)
    });
    
  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({ message: 'Failed to perform AI analysis' });
  }
});

// Get analysis results for a user
router.get('/results', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const results = await storage.getAnalysisResultsByUser(userId);
    res.json({ results });
  } catch (error) {
    console.error('Error fetching analysis results:', error);
    res.status(500).json({ message: 'Failed to fetch analysis results' });
  }
});

// Get public analysis results
router.get('/gallery', async (req, res) => {
  try {
    const results = await storage.getPublicAnalysisResults();
    res.json({ results });
  } catch (error) {
    console.error('Error fetching public results:', error);
    res.status(500).json({ message: 'Failed to fetch gallery' });
  }
});

// Share analysis result
router.post('/share/:id', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const analysisId = parseInt(req.params.id);
    const { publiclyVisible, generateLink, allowComments } = req.body;
    
    // Verify ownership
    const result = await storage.getAnalysisResult(analysisId);
    if (!result) {
      return res.status(404).json({ message: 'Analysis result not found' });
    }
    
    if (result.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to share this result' });
    }
    
    // Update sharing settings
    const updated = await storage.shareAnalysisResult(analysisId, {
      publiclyVisible,
      generateLink,
      allowComments
    });
    
    res.json({ result: updated });
    
  } catch (error) {
    console.error('Error sharing analysis:', error);
    res.status(500).json({ message: 'Failed to share analysis' });
  }
});

// Get shared analysis by token
router.get('/shared/:token', async (req, res) => {
  try {
    const token = req.params.token;
    const result = await storage.getAnalysisResultByShareToken(token);
    
    if (!result) {
      return res.status(404).json({ message: 'Shared analysis not found' });
    }
    
    res.json({ result });
    
  } catch (error) {
    console.error('Error fetching shared analysis:', error);
    res.status(500).json({ message: 'Failed to fetch shared analysis' });
  }
});

// Helper function to query the Together AI API
async function queryTogetherAI(prompt: string, modelParams: any, page: any, references: any[] = []) {
  try {
    // Generate reference information for the prompt
    let referencesText = '';
    if (references && references.length > 0) {
      referencesText = '\nReferenced Information:\n';
      
      // Process page references
      const pageRefs = references.filter(ref => ref.type === 'page');
      if (pageRefs.length > 0) {
        referencesText += '\nManuscript Pages:\n';
        pageRefs.forEach((ref, index) => {
          referencesText += `- Page ${ref.folioNumber || `#${ref.id}`}: Section ${ref.section || 'Unknown'}\n`;
        });
      }
      
      // Process symbol references
      const symbolRefs = references.filter(ref => ref.type === 'symbol');
      if (symbolRefs.length > 0) {
        referencesText += '\nManuscript Symbols:\n';
        symbolRefs.forEach((ref, index) => {
          referencesText += `- Symbol ID #${ref.id}: ${ref.category || 'Uncategorized'} symbol`;
          if (ref.pageId) {
            referencesText += ` from page ID #${ref.pageId}`;
          }
          referencesText += '\n';
        });
      }
    }
    
    // Full prompt with context
    const fullPrompt = `
You are an expert analyzing the Voynich Manuscript, a mysterious illustrated codex from the early 15th century written in an unknown writing system.

Folio Information:
- Page number: ${page.folioNumber}
- Section: ${page.section || 'Unknown'}
${referencesText}
User Query: ${prompt}

Provide a detailed, scholarly analysis based on the available information about this manuscript. Be sure to clearly distinguish between established facts and speculative interpretations. When referring to specific pages or symbols that were referenced, refer to them by their identifiers.
`;

    const response = await fetch(TOGETHER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOGETHER_API_KEY}`
      },
      body: JSON.stringify({
        model: modelParams.model,
        prompt: fullPrompt,
        temperature: modelParams.temperature || 0.7,
        max_tokens: modelParams.maxTokens || 500,
        stop: ["<|im_end|>", "<|endoftext|>"]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Together AI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('Together AI query error:', error);
    throw new Error('Failed to query AI model');
  }
}

export default router;
