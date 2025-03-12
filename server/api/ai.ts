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
    
    // Generate a unique token for this analysis result if public
    const shareToken = isPublic ? generateUniqueToken() : null;
    
    // Save the analysis result
    const analysisResult = await storage.createAnalysisResult({
      userId,
      pageId,
      type: 'custom_prompt',
      prompt,
      result: aiResult,
      isPublic,
      model: modelParams.model,
      shareToken
    });
    
    // Create an activity entry for the new analysis
    await storage.createActivityFeedEntry({
      userId,
      type: 'analysis_created',
      entityId: analysisResult.id,
      entityType: 'analysis',
      isPublic: !!isPublic
    });
    
    // Create the URL for redirecting
    const analysisUrl = `/analysis/${analysisResult.id}`;
    
    res.json({
      result: analysisResult,
      remainingCredits: await storage.getUserCredits(userId),
      analysisUrl
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

// Get a single analysis result by ID
router.get('/analysis/:id', async (req, res) => {
  try {
    const analysisId = parseInt(req.params.id);
    if (isNaN(analysisId)) {
      return res.status(400).json({ message: 'Invalid analysis ID' });
    }

    // Get the analysis result
    const analysis = await storage.getAnalysisResult(analysisId);
    
    if (!analysis) {
      return res.status(404).json({ message: 'Analysis result not found' });
    }

    // Check authorization - only owner or public analyses can be viewed
    const isPublic = analysis.isPublic;
    const isOwner = req.user && req.user.id === analysis.userId;
    
    if (!isPublic && !isOwner) {
      return res.status(403).json({ message: 'You do not have permission to view this analysis' });
    }

    // Fetch manuscript page info if pageId exists
    let page = null;
    if (analysis.pageId) {
      page = await storage.getManuscriptPage(analysis.pageId);
    }

    res.json({ analysis, page });
  } catch (error) {
    console.error('Error fetching analysis result:', error);
    res.status(500).json({ message: 'Failed to fetch analysis result' });
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

// Helper function to query the Together AI API with chat completions
async function queryTogetherAI(prompt: string, modelParams: any, page: any, references: any[] = []) {
  try {
    // Process bracket references in the prompt - they will be in format {page123} or {symbol456}
    const refRegex = /\{(page|symbol)(\d+)\}/g;
    const matchesArray: Array<RegExpExecArray> = [];
    let match: RegExpExecArray | null;
    
    // Extract all regex matches
    while ((match = refRegex.exec(prompt)) !== null) {
      matchesArray.push(match);
    }
    
    const referencedIds = new Map<string, { type: string, id: number }>();
    
    // Extract all references from the prompt text
    matchesArray.forEach(match => {
      const type = match[1]; // 'page' or 'symbol'
      const id = parseInt(match[2], 10);
      if (!isNaN(id)) {
        const key = `${type}-${id}`;
        referencedIds.set(key, { type, id });
      }
    });
    
    // Add any explicitly specified references from the references array
    references.forEach(ref => {
      const key = `${ref.type}-${ref.id}`;
      if (!referencedIds.has(key)) {
        referencedIds.set(key, { type: ref.type, id: ref.id });
      }
    });
    
    // Fetch detailed information for all referenced items
    const detailedReferences: Array<any> = [];
    
    // Convert Map entries to array for easier iteration
    const referencedIdsArray = Array.from(referencedIds.entries());
    
    // Process each reference
    for (let i = 0; i < referencedIdsArray.length; i++) {
      const [_, ref] = referencedIdsArray[i];
      
      if (ref.type === 'page') {
        const refPage = await storage.getManuscriptPage(ref.id);
        if (refPage) {
          detailedReferences.push({
            type: 'page',
            id: ref.id,
            folioNumber: refPage.folioNumber,
            section: refPage.section,
            bracketRef: `{page${ref.id}}`
          });
        }
      } else if (ref.type === 'symbol') {
        const symbol = await storage.getSymbol(ref.id);
        if (symbol) {
          // Get the page to provide more context
          const symbolPage = await storage.getManuscriptPage(symbol.pageId);
          const folioNumber = symbolPage ? symbolPage.folioNumber : `unknown`;
          
          detailedReferences.push({
            type: 'symbol',
            id: ref.id,
            pageId: symbol.pageId,
            folioNumber: folioNumber,
            category: symbol.category,
            x: symbol.x,
            y: symbol.y,
            width: symbol.width,
            height: symbol.height,
            bracketRef: `{symbol${ref.id}}`
          });
        }
      }
    }
    
    // Generate reference information for the system prompt
    let referencesText = '';
    if (detailedReferences.length > 0) {
      referencesText = '\nReferenced Items:\n';
      
      // Process page references
      const pageRefs = detailedReferences.filter(ref => ref.type === 'page');
      if (pageRefs.length > 0) {
        referencesText += '\nManuscript Pages:\n';
        for (let i = 0; i < pageRefs.length; i++) {
          const ref = pageRefs[i];
          referencesText += `- ${ref.bracketRef}: Folio ${ref.folioNumber}, Section: ${ref.section || 'Unknown'}\n`;
        }
      }
      
      // Process symbol references
      const symbolRefs = detailedReferences.filter(ref => ref.type === 'symbol');
      if (symbolRefs.length > 0) {
        referencesText += '\nManuscript Symbols:\n';
        for (let i = 0; i < symbolRefs.length; i++) {
          const ref = symbolRefs[i];
          referencesText += `- ${ref.bracketRef}: ${ref.category || 'Uncategorized'} symbol on Folio ${ref.folioNumber}, position: (${ref.x}, ${ref.y}), dimensions: ${ref.width}x${ref.height}\n`;
        }
      }
    }
    
    // System context that explains the bracketed references
    const systemPrompt = `
You are an expert analyzing the Voynich Manuscript, a mysterious illustrated codex from the early 15th century written in an unknown writing system.

You will respond to user queries about the manuscript with scholarly analysis. The user may reference specific pages or symbols using bracketed notation like {page123} or {symbol456}.

Current Folio Information:
- Folio number: ${page.folioNumber}
- Section: ${page.section || 'Unknown'}
${referencesText}

Guidelines:
1. When the user references a page or symbol with bracket notation, refer to it by the same notation in your response.
2. Provide academically rigorous analysis that separates established facts from speculative interpretations.
3. Your analysis should be detailed, contextual, and reference relevant scholarly perspectives.
4. Focus on the specific elements the user has asked about and their connections to the broader manuscript.
`;

    // Use the chat completion format for the Llama-Vision-Free model
    const response = await fetch(TOGETHER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOGETHER_API_KEY}`
      },
      body: JSON.stringify({
        model: modelParams.model,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: modelParams.temperature || 0.7,
        max_tokens: modelParams.maxTokens || 500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Together AI Error Response:", errorText);
      throw new Error(`Together AI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log("AI Response Data:", JSON.stringify(data).substring(0, 200) + "...");
    return data;
    
  } catch (error) {
    console.error('Together AI query error:', error);
    throw new Error('Failed to query AI model');
  }
}

// Helper function to generate a unique token for sharing
function generateUniqueToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Get specific analysis result by ID
router.get('/analysis/:id', async (req: Request, res: Response) => {
  try {
    const analysisId = parseInt(req.params.id);
    if (isNaN(analysisId)) {
      return res.status(400).json({ message: 'Invalid analysis ID' });
    }
    
    const analysis = await storage.getAnalysisResult(analysisId);
    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not found' });
    }
    
    // Check if user has permission to view this analysis
    const isOwner = req.user && (req.user as any).id === analysis.userId;
    if (!analysis.isPublic && !isOwner) {
      return res.status(403).json({ message: 'You do not have permission to view this analysis' });
    }
    
    // Get page info for context
    const page = await storage.getManuscriptPage(analysis.pageId);
    
    return res.json({ analysis, page });
  } catch (error) {
    console.error('Error fetching analysis:', error);
    return res.status(500).json({ message: 'Failed to fetch analysis result' });
  }
});

export default router;
