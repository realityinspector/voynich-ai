// API Response types

export interface PageResponse {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  items: any[];
}

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
}

// AI Analysis types

export interface SymbolExtractionParams {
  threshold: number;
  minSize: number;
  maxSize: number;
  ignoreMargins: boolean;
  enhancementPreset: 'none' | 'default' | 'high-contrast';
  advanced?: Record<string, any>;
}

export interface AIModelParams {
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface Reference {
  id: number;
  type: 'page' | 'symbol';
  label: string;
}

export interface AIAnalysisRequest {
  pageId: number;
  prompt: string;
  modelParams: AIModelParams;
  references?: Reference[];
  isPublic: boolean;
}

// Together AI Integration

export interface TogetherAIResponse {
  id: string;
  model: string;
  created: number;
  object: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Stripe Payment types

export interface PurchaseCreditsRequest {
  planId: string;
  quantity?: number;
}

export interface StripeCheckoutSession {
  id: string;
  url: string;
}

// Image Upload types

export interface UploadedFileMetadata {
  originalname: string;
  filename: string;
  mimetype: string;
  size: number;
  path: string;
  folioNumber?: string;
}

// Symbol extraction types

export interface ExtractedSymbol {
  id: number;
  pageId: number;
  image: string;
  x: number;
  y: number;
  width: number;
  height: number;
  category?: string;
  frequency?: number;
  metadata?: any;
}

export interface SymbolExtractionResult {
  id: number;
  pageId: number;
  totalSymbols: number;
  uniqueSymbols: number;
  classifiedSymbols: number;
  symbols: ExtractedSymbol[];
}

// Auth types

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  institution?: string;
}

export interface AuthResponse {
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
    credits: number;
    institution?: string;
  };
}

// Sharing types

export interface SharingOptions {
  publiclyVisible: boolean;
  generateLink: boolean;
  allowComments: boolean;
}

// API Types
export interface ApiKeyResponse {
  id: number;
  name: string;
  key?: string; // Only included when first created
  createdAt: string;
  lastUsed?: string;
}

export interface ApiKeyCreateRequest {
  name: string;
}

export interface ApiUsageStats {
  totalRequests: number;
  requestsToday: number;
  requestsThisWeek: number;
  requestsThisMonth: number;
  tokensUsed: number;
}

// Leaderboard Types
export interface LeaderboardEntry {
  userId: number;
  username: string;
  score: number;
  annotationCount: number;
  upvotesReceived: number;
  rank: number;
}

export interface LeaderboardResponse {
  timeframe: 'daily' | 'weekly' | 'monthly' | 'alltime';
  date: string;
  entries: LeaderboardEntry[];
}

// Annotation Types
export interface AnnotationCreateRequest {
  pageId: number;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  isPublic?: boolean;
}

export interface AnnotationVoteRequest {
  voteType: 'upvote' | 'downvote';
}

// Activity Feed Types
export interface ActivityFeedEntry {
  id: number;
  userId: number;
  username: string;
  type: 'annotation_created' | 'annotation_upvoted' | 'note_created' | 'analysis_created' | 'symbol_categorized';
  entityId: number;
  entityType: string;
  metadata?: any;
  createdAt: string;
}
