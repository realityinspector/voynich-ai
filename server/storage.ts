import { 
  users, 
  manuscriptPages, 
  symbols, 
  annotations, 
  annotationComments,
  annotationVotes,
  notes, 
  analysisResults, 
  apiKeys, 
  extractionJobs,
  creditTransactions,
  leaderboards,
  activityFeed,
  blogPosts,
  blogComments,
  blogPostVotes,
  blogTopicIdeas,
  blogRelatedTopics,
  type User, 
  type InsertUser, 
  type ManuscriptPage,
  type InsertManuscriptPage,
  type Symbol,
  type InsertSymbol,
  type Annotation,
  type InsertAnnotation,
  type AnnotationComment,
  type Note,
  type InsertNote,
  type AnalysisResult,
  type InsertAnalysisResult,
  type ApiKey,
  type InsertApiKey,
  type ExtractionJob,
  type InsertExtractionJob,
  type CreditTransaction,
  type BlogPost,
  type InsertBlogPost,
  type BlogComment,
  type InsertBlogComment,
  type BlogPostVote,
  type InsertBlogPostVote,
  type BlogTopicIdea,
  type InsertBlogTopicIdea,
  type BlogRelatedTopic,
  type InsertBlogRelatedTopic
} from "@shared/schema";
import { eq, and, desc, asc, between, gte, lte, like, isNull, not, sql as sqlExpr, count } from "drizzle-orm";
import { db } from "./db";
import { randomBytes, createHash } from "crypto";
import { SharingOptions } from "@shared/types";

// Storage interface for all database operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserProfile(id: number, data: Partial<User>): Promise<User>;
  hasAnyUsers(): Promise<boolean>;
  
  // Manuscript page operations
  getManuscriptPage(id: number): Promise<ManuscriptPage | undefined>;
  getManuscriptPageByFolio(folioNumber: string): Promise<ManuscriptPage | undefined>;
  // Changed default limit from 20 to 1000
  listManuscriptPages(offset?: number, limit?: number): Promise<ManuscriptPage[]>;
  createManuscriptPage(page: InsertManuscriptPage): Promise<ManuscriptPage>;
  updateManuscriptPage(id: number, data: Partial<ManuscriptPage>): Promise<ManuscriptPage>;
  
  // Symbol operations
  getSymbol(id: number): Promise<Symbol | undefined>;
  getSymbolsByPage(pageId: number): Promise<Symbol[]>;
  createSymbol(symbol: InsertSymbol): Promise<Symbol>;
  updateSymbol(id: number, data: Partial<Symbol>): Promise<Symbol>;
  
  // Annotation operations
  getAnnotation(id: number): Promise<Annotation | undefined>;
  getAnnotationsByPage(pageId: number): Promise<Annotation[]>;
  createAnnotation(annotation: InsertAnnotation): Promise<Annotation>;
  updateAnnotation(id: number, data: Partial<Annotation>): Promise<Annotation>;
  
  // Annotation voting operations
  createAnnotationVote(data: { annotationId: number, userId: number, voteType: string }): Promise<any>;
  getAnnotationVote(annotationId: number, userId: number): Promise<any | undefined>;
  
  // Note operations
  getNote(id: number): Promise<Note | undefined>;
  getNotesByUser(userId: number): Promise<Note[]>;
  getPublicNotes(): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: number, data: Partial<Note>): Promise<Note>;
  deleteNote(id: number): Promise<void>;
  
  // AI Analysis operations
  getAnalysisResult(id: number): Promise<AnalysisResult | undefined>;
  getAnalysisResultsByUser(userId: number): Promise<AnalysisResult[]>;
  getPublicAnalysisResults(): Promise<AnalysisResult[]>;
  createAnalysisResult(result: InsertAnalysisResult): Promise<AnalysisResult>;
  shareAnalysisResult(id: number, options: SharingOptions): Promise<AnalysisResult>;
  getAnalysisResultByShareToken(token: string): Promise<AnalysisResult | undefined>;
  
  // API Key operations
  getApiKeyByKeyString(key: string): Promise<ApiKey | undefined>;
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  deleteApiKey(id: number): Promise<void>;
  listApiKeysByUser(userId: number): Promise<ApiKey[]>;
  
  // Extraction Job operations
  getExtractionJob(id: number): Promise<ExtractionJob | undefined>;
  listExtractionJobsByUser(userId: number): Promise<ExtractionJob[]>;
  createExtractionJob(job: InsertExtractionJob): Promise<ExtractionJob>;
  updateExtractionJobProgress(id: number, progress: number, symbolsExtracted?: number): Promise<ExtractionJob>;
  completeExtractionJob(id: number): Promise<ExtractionJob>;
  
  // Credit operations
  getUserCredits(userId: number): Promise<number>;
  addUserCredits(userId: number, amount: number, type: 'purchase' | 'free' | 'admin_grant', description?: string, stripePaymentId?: string): Promise<number>;
  useUserCredits(userId: number, amount: number, description?: string): Promise<number>;
  
  // Stripe integration
  updateUserStripeInfo(userId: number, data: { stripeCustomerId: string, stripeSubscriptionId?: string }): Promise<User>;
  
  // Leaderboard operations
  getLeaderboard(timeframe: string): Promise<any>;
  updateLeaderboard(userId: number, data: { score?: number, annotationCount?: number, upvotesReceived?: number }): Promise<void>;
  
  // Activity feed operations
  createActivityFeedEntry(data: { userId: number, type: string, entityId: number, entityType: string, isPublic?: boolean, metadata?: any }): Promise<any>;
  getPublicActivityFeed(limit?: number, offset?: number): Promise<any[]>;
  getUserActivityFeed(userId: number, limit?: number, offset?: number): Promise<any[]>;
  
  // Blog post operations
  getBlogPost(id: number): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  listBlogPosts(options?: { category?: string, userId?: number, status?: string, tag?: string, pageId?: number, symbolId?: number, offset?: number, limit?: number }): Promise<BlogPost[]>;
  createBlogPost(blogPost: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: number, data: Partial<BlogPost>): Promise<BlogPost>;
  deleteBlogPost(id: number): Promise<void>;
  publishBlogPost(id: number): Promise<BlogPost>;
  incrementBlogPostView(id: number): Promise<void>;
  incrementBlogPostShare(id: number): Promise<void>;
  
  // Blog comment operations
  getBlogComment(id: number): Promise<BlogComment | undefined>;
  getBlogCommentsByPost(blogPostId: number): Promise<BlogComment[]>;
  createBlogComment(blogComment: InsertBlogComment): Promise<BlogComment>;
  updateBlogComment(id: number, data: Partial<BlogComment>): Promise<BlogComment>;
  deleteBlogComment(id: number): Promise<void>;
  
  // Blog post voting operations
  createBlogPostVote(data: { blogPostId: number, userId: number, voteType: string }): Promise<any>;
  getBlogPostVote(blogPostId: number, userId: number): Promise<any | undefined>;
  
  // Blog topic idea operations
  getBlogTopicIdea(id: number): Promise<BlogTopicIdea | undefined>;
  listBlogTopicIdeas(options?: { category?: string, status?: string, complexity?: string, pageId?: number, symbolId?: number, offset?: number, limit?: number }): Promise<BlogTopicIdea[]>;
  createBlogTopicIdea(blogTopicIdea: InsertBlogTopicIdea): Promise<BlogTopicIdea>;
  updateBlogTopicIdea(id: number, data: Partial<BlogTopicIdea>): Promise<BlogTopicIdea>;
  deleteBlogTopicIdea(id: number): Promise<void>;
  
  // Blog related topics operations
  createBlogRelatedTopic(relatedTopic: InsertBlogRelatedTopic): Promise<BlogRelatedTopic>;
  getRelatedBlogPosts(blogPostId: number, limit?: number): Promise<BlogPost[]>;
  autoGenerateBlogPostFromIdea(topicIdeaId: number, userId: number): Promise<BlogPost>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserProfile(id: number, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user;
  }
  
  async hasAnyUsers(): Promise<boolean> {
    const [result] = await db
      .select({ count: count() })
      .from(users);
    return result.count > 0;
  }

  // Manuscript page operations
  async getManuscriptPage(id: number): Promise<ManuscriptPage | undefined> {
    const [page] = await db.select().from(manuscriptPages).where(eq(manuscriptPages.id, id));
    return page;
  }

  async getManuscriptPageByFolio(folioNumber: string): Promise<ManuscriptPage | undefined> {
    const [page] = await db.select().from(manuscriptPages).where(eq(manuscriptPages.folioNumber, folioNumber));
    return page;
  }

  async listManuscriptPages(offset: number = 0, limit: number = 1000): Promise<ManuscriptPage[]> {
    // Increased default limit to 1000 to make sure we get all pages
    const results = await db
      .select()
      .from(manuscriptPages)
      .orderBy(asc(manuscriptPages.folioNumber))
      .limit(limit)
      .offset(offset);
    
    // Log the number of pages retrieved
    console.log(`Storage: Retrieved ${results.length} manuscript pages from database`);
    
    return results;
  }

  async createManuscriptPage(page: InsertManuscriptPage): Promise<ManuscriptPage> {
    // Ensure id is present or throw an error
    if (page.id === undefined) {
      throw new Error('Page ID is required for manuscript page creation');
    }
    
    // Create a properly typed object for insertion
    const pageData = {
      id: page.id,
      folioNumber: page.folioNumber,
      filename: page.filename,
      section: page.section,
      width: page.width,
      height: page.height,
      uploadedBy: page.uploadedBy,
      // Let defaults handle these
      // uploadedAt: will default to now
      // processingStatus: will default to 'pending'
    };
    
    const [newPage] = await db.insert(manuscriptPages).values(pageData).returning();
    return newPage;
  }

  async updateManuscriptPage(id: number, data: Partial<ManuscriptPage>): Promise<ManuscriptPage> {
    const [updatedPage] = await db
      .update(manuscriptPages)
      .set(data)
      .where(eq(manuscriptPages.id, id))
      .returning();
    return updatedPage;
  }

  // Symbol operations
  async getSymbol(id: number): Promise<Symbol | undefined> {
    const [symbol] = await db.select().from(symbols).where(eq(symbols.id, id));
    return symbol;
  }

  async getSymbolsByPage(pageId: number): Promise<Symbol[]> {
    return await db.select().from(symbols).where(eq(symbols.pageId, pageId));
  }

  async createSymbol(symbol: InsertSymbol): Promise<Symbol> {
    const [newSymbol] = await db.insert(symbols).values(symbol).returning();
    return newSymbol;
  }

  async updateSymbol(id: number, data: Partial<Symbol>): Promise<Symbol> {
    const [updatedSymbol] = await db
      .update(symbols)
      .set(data)
      .where(eq(symbols.id, id))
      .returning();
    return updatedSymbol;
  }

  // Annotation operations
  async getAnnotation(id: number): Promise<Annotation | undefined> {
    const [annotation] = await db.select().from(annotations).where(eq(annotations.id, id));
    return annotation;
  }

  async getAnnotationsByPage(pageId: number): Promise<Annotation[]> {
    return await db.select().from(annotations).where(eq(annotations.pageId, pageId));
  }

  async createAnnotation(annotation: InsertAnnotation): Promise<Annotation> {
    const [newAnnotation] = await db.insert(annotations).values(annotation).returning();
    return newAnnotation;
  }

  async updateAnnotation(id: number, data: Partial<Annotation>): Promise<Annotation> {
    const [updatedAnnotation] = await db
      .update(annotations)
      .set(data)
      .where(eq(annotations.id, id))
      .returning();
    return updatedAnnotation;
  }

  // Note operations
  async getNote(id: number): Promise<Note | undefined> {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    return note;
  }

  async getNotesByUser(userId: number): Promise<Note[]> {
    return await db.select().from(notes).where(eq(notes.userId, userId));
  }

  async getPublicNotes(): Promise<Note[]> {
    return await db.select().from(notes).where(eq(notes.isPublic, true));
  }

  async createNote(note: InsertNote): Promise<Note> {
    const [newNote] = await db.insert(notes).values(note).returning();
    return newNote;
  }

  async updateNote(id: number, data: Partial<Note>): Promise<Note> {
    const [updatedNote] = await db
      .update(notes)
      .set(data)
      .where(eq(notes.id, id))
      .returning();
    return updatedNote;
  }

  async deleteNote(id: number): Promise<void> {
    await db.delete(notes).where(eq(notes.id, id));
  }

  // AI Analysis operations
  async getAnalysisResult(id: number): Promise<AnalysisResult | undefined> {
    const [result] = await db.select().from(analysisResults).where(eq(analysisResults.id, id));
    return result;
  }

  async getAnalysisResultsByUser(userId: number): Promise<AnalysisResult[]> {
    return await db
      .select()
      .from(analysisResults)
      .where(eq(analysisResults.userId, userId))
      .orderBy(desc(analysisResults.createdAt));
  }

  async getPublicAnalysisResults(): Promise<AnalysisResult[]> {
    return await db
      .select()
      .from(analysisResults)
      .where(eq(analysisResults.isPublic, true))
      .orderBy(desc(analysisResults.createdAt));
  }

  async createAnalysisResult(result: InsertAnalysisResult): Promise<AnalysisResult> {
    const [newResult] = await db.insert(analysisResults).values(result).returning();
    return newResult;
  }

  async shareAnalysisResult(id: number, options: SharingOptions): Promise<AnalysisResult> {
    let shareToken = null;
    
    if (options.generateLink) {
      shareToken = this.generateShareToken();
    }
    
    const [updatedResult] = await db
      .update(analysisResults)
      .set({ 
        isPublic: options.publiclyVisible,
        shareToken: shareToken
      })
      .where(eq(analysisResults.id, id))
      .returning();
      
    return updatedResult;
  }

  async getAnalysisResultByShareToken(token: string): Promise<AnalysisResult | undefined> {
    const [result] = await db
      .select()
      .from(analysisResults)
      .where(eq(analysisResults.shareToken, token));
      
    return result;
  }

  // API Key operations
  async getApiKeyByKeyString(key: string): Promise<ApiKey | undefined> {
    const [apiKey] = await db.select().from(apiKeys).where(eq(apiKeys.key, key));
    return apiKey;
  }

  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    const [newApiKey] = await db.insert(apiKeys).values(apiKey).returning();
    return newApiKey;
  }

  async deleteApiKey(id: number): Promise<void> {
    await db.delete(apiKeys).where(eq(apiKeys.id, id));
  }

  async listApiKeysByUser(userId: number): Promise<ApiKey[]> {
    return await db.select().from(apiKeys).where(eq(apiKeys.userId, userId));
  }

  // Extraction Job operations
  async getExtractionJob(id: number): Promise<ExtractionJob | undefined> {
    const [job] = await db.select().from(extractionJobs).where(eq(extractionJobs.id, id));
    return job;
  }

  async listExtractionJobsByUser(userId: number): Promise<ExtractionJob[]> {
    return await db
      .select()
      .from(extractionJobs)
      .where(eq(extractionJobs.userId, userId))
      .orderBy(desc(extractionJobs.startedAt));
  }

  async createExtractionJob(job: InsertExtractionJob): Promise<ExtractionJob> {
    const [newJob] = await db.insert(extractionJobs).values(job).returning();
    return newJob;
  }

  async updateExtractionJobProgress(id: number, progress: number, symbolsExtracted?: number): Promise<ExtractionJob> {
    const updateData: any = { progress };
    if (symbolsExtracted !== undefined) {
      updateData.symbolsExtracted = symbolsExtracted;
    }
    
    const [updatedJob] = await db
      .update(extractionJobs)
      .set(updateData)
      .where(eq(extractionJobs.id, id))
      .returning();
      
    return updatedJob;
  }

  async completeExtractionJob(id: number): Promise<ExtractionJob> {
    const [completedJob] = await db
      .update(extractionJobs)
      .set({ 
        status: 'completed',
        completedAt: new Date(),
        progress: 100
      })
      .where(eq(extractionJobs.id, id))
      .returning();
      
    return completedJob;
  }

  // Credit operations
  async getUserCredits(userId: number): Promise<number> {
    const [user] = await db
      .select({ credits: users.credits })
      .from(users)
      .where(eq(users.id, userId));
      
    return user?.credits ?? 0;
  }

  async addUserCredits(
    userId: number, 
    amount: number, 
    type: 'purchase' | 'free' | 'admin_grant',
    description?: string,
    stripePaymentId?: string
  ): Promise<number> {
    // Update user credits
    const [user] = await db
      .update(users)
      .set({ 
        credits: sqlExpr`${users.credits} + ${amount}`
      })
      .where(eq(users.id, userId))
      .returning();
      
    // Record the transaction
    await db.insert(creditTransactions).values({
      userId,
      amount,
      type,
      description,
      stripePaymentId
    });
    
    return user.credits;
  }

  async useUserCredits(userId: number, amount: number, description?: string): Promise<number> {
    // Get current credits
    const currentCredits = await this.getUserCredits(userId);
    
    if (currentCredits < amount) {
      throw new Error('Insufficient credits');
    }
    
    // Update user credits
    const [user] = await db
      .update(users)
      .set({ 
        credits: sqlExpr`${users.credits} - ${amount}`
      })
      .where(eq(users.id, userId))
      .returning();
      
    // Record the transaction
    await db.insert(creditTransactions).values({
      userId,
      amount: -amount,
      type: 'usage',
      description
    });
    
    return user.credits;
  }

  // Stripe integration
  async updateUserStripeInfo(
    userId: number, 
    data: { stripeCustomerId: string, stripeSubscriptionId?: string }
  ): Promise<User> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, userId))
      .returning();
      
    return user;
  }
  
  // Annotation voting operations
  async createAnnotationVote(data: { annotationId: number, userId: number, voteType: string }): Promise<any> {
    const { annotationId, userId, voteType } = data;
    
    // Check if user already voted on this annotation
    const existingVote = await this.getAnnotationVote(annotationId, userId);
    
    if (existingVote) {
      // If vote type is the same, do nothing
      if (existingVote.voteType === voteType) {
        return existingVote;
      }
      
      // If vote type is different, delete existing vote and create new one
      await db.delete(annotationVotes)
        .where(and(
          eq(annotationVotes.annotationId, annotationId),
          eq(annotationVotes.userId, userId)
        ));
    }
    
    // Create the vote
    const [vote] = await db.insert(annotationVotes)
      .values({
        annotationId,
        userId,
        voteType
      })
      .returning();
    
    // Update the annotation's vote counts
    const voteIncrement = voteType === 'upvote' ? 1 : 0;
    const downvoteIncrement = voteType === 'downvote' ? 1 : 0;
    const scoreChange = voteType === 'upvote' ? 1 : -1;
    
    // If there was an existing vote in the opposite direction, double the score change
    const scoreMultiplier = existingVote ? 2 : 1;
    
    await db.update(annotations)
      .set({ 
        upvotes: sqlExpr`${annotations.upvotes} + ${voteIncrement}`,
        downvotes: sqlExpr`${annotations.downvotes} + ${downvoteIncrement}`,
        score: sqlExpr`${annotations.score} + ${scoreChange * scoreMultiplier}`
      })
      .where(eq(annotations.id, annotationId));
    
    // Update leaderboard for the annotation creator
    const [annotation] = await db.select()
      .from(annotations)
      .where(eq(annotations.id, annotationId));
    
    if (annotation && voteType === 'upvote') {
      await this.updateLeaderboard(annotation.userId, { upvotesReceived: 1, score: 1 });
    }
    
    return vote;
  }
  
  async getAnnotationVote(annotationId: number, userId: number): Promise<any | undefined> {
    const [vote] = await db.select()
      .from(annotationVotes)
      .where(and(
        eq(annotationVotes.annotationId, annotationId),
        eq(annotationVotes.userId, userId)
      ));
    
    return vote;
  }
  
  // Leaderboard operations
  async getLeaderboard(timeframe: string): Promise<any> {
    if (!['daily', 'weekly', 'monthly', 'alltime'].includes(timeframe)) {
      throw new Error('Invalid timeframe');
    }
    
    // Get the current date
    const now = new Date();
    let startDate: Date;
    
    // Calculate the start date based on timeframe
    if (timeframe === 'daily') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (timeframe === 'weekly') {
      // Get start of the week (assuming Sunday is the first day)
      const day = now.getDay();
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
    } else if (timeframe === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      // alltime - use a distant past date
      startDate = new Date(2000, 0, 1);
    }
    
    // Get leaderboard for the specified timeframe
    const leaderboardEntries = await db.select()
      .from(leaderboards)
      .where(and(
        eq(leaderboards.timeframe, timeframe),
        gte(leaderboards.date, startDate)
      ))
      .orderBy(asc(leaderboards.rank));
    
    // Join with user data to get usernames
    const leaderboardWithUsernames = await Promise.all(
      leaderboardEntries.map(async (entry) => {
        const user = await this.getUser(entry.userId);
        return {
          ...entry,
          username: user?.username || 'Unknown User'
        };
      })
    );
    
    return {
      timeframe,
      date: startDate.toISOString(),
      entries: leaderboardWithUsernames
    };
  }
  
  async updateLeaderboard(userId: number, data: { score?: number, annotationCount?: number, upvotesReceived?: number }): Promise<void> {
    // Get current date info for the leaderboard entries
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Get day of week (0-6, where 0 is Sunday)
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
    
    // Get start of month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Update each timeframe
    await this.updateLeaderboardForTimeframe(userId, 'daily', today, data);
    await this.updateLeaderboardForTimeframe(userId, 'weekly', startOfWeek, data);
    await this.updateLeaderboardForTimeframe(userId, 'monthly', startOfMonth, data);
    await this.updateLeaderboardForTimeframe(userId, 'alltime', new Date(2000, 0, 1), data);
  }
  
  private async updateLeaderboardForTimeframe(
    userId: number, 
    timeframe: string, 
    date: Date, 
    data: { score?: number, annotationCount?: number, upvotesReceived?: number }
  ): Promise<void> {
    // Check if entry exists
    const [existingEntry] = await db.select()
      .from(leaderboards)
      .where(and(
        eq(leaderboards.userId, userId),
        eq(leaderboards.timeframe, timeframe),
        eq(leaderboards.date, date)
      ));
    
    if (existingEntry) {
      // Update existing entry
      await db.update(leaderboards)
        .set({
          score: data.score ? sqlExpr`${leaderboards.score} + ${data.score}` : leaderboards.score,
          annotationCount: data.annotationCount ? sqlExpr`${leaderboards.annotationCount} + ${data.annotationCount}` : leaderboards.annotationCount,
          upvotesReceived: data.upvotesReceived ? sqlExpr`${leaderboards.upvotesReceived} + ${data.upvotesReceived}` : leaderboards.upvotesReceived,
          updatedAt: new Date()
        })
        .where(eq(leaderboards.id, existingEntry.id));
    } else {
      // Create new entry
      await db.insert(leaderboards)
        .values({
          userId,
          timeframe: timeframe as any,
          date,
          score: data.score || 0,
          annotationCount: data.annotationCount || 0,
          upvotesReceived: data.upvotesReceived || 0,
          updatedAt: new Date()
        });
    }
    
    // Recalculate ranks for this timeframe
    await this.recalculateLeaderboardRanks(timeframe, date);
  }
  
  private async recalculateLeaderboardRanks(timeframe: string, date: Date): Promise<void> {
    // Get all entries for this timeframe sorted by score
    const entries = await db.select()
      .from(leaderboards)
      .where(and(
        eq(leaderboards.timeframe, timeframe),
        eq(leaderboards.date, date)
      ))
      .orderBy(desc(leaderboards.score));
    
    // Update ranks
    for (let i = 0; i < entries.length; i++) {
      await db.update(leaderboards)
        .set({ rank: i + 1 })
        .where(eq(leaderboards.id, entries[i].id));
    }
  }
  
  // Activity feed operations
  async createActivityFeedEntry(data: { 
    userId: number, 
    type: string, 
    entityId: number, 
    entityType: string, 
    isPublic?: boolean, 
    metadata?: any 
  }): Promise<any> {
    const [entry] = await db.insert(activityFeed)
      .values({
        userId: data.userId,
        type: data.type as any,
        entityId: data.entityId,
        entityType: data.entityType,
        isPublic: data.isPublic === undefined ? true : data.isPublic,
        metadata: data.metadata || {},
        createdAt: new Date()
      })
      .returning();
    
    return entry;
  }
  
  async getPublicActivityFeed(limit: number = 20, offset: number = 0): Promise<any[]> {
    const activities = await db.select()
      .from(activityFeed)
      .where(eq(activityFeed.isPublic, true))
      .orderBy(desc(activityFeed.createdAt))
      .limit(limit)
      .offset(offset);
    
    // Enhance activities with usernames
    const enhancedActivities = await Promise.all(
      activities.map(async (activity) => {
        const user = await this.getUser(activity.userId);
        return {
          ...activity,
          username: user?.username || 'Unknown User'
        };
      })
    );
    
    return enhancedActivities;
  }
  
  async getUserActivityFeed(userId: number, limit: number = 20, offset: number = 0): Promise<any[]> {
    return await db.select()
      .from(activityFeed)
      .where(eq(activityFeed.userId, userId))
      .orderBy(desc(activityFeed.createdAt))
      .limit(limit)
      .offset(offset);
  }

  // Blog post operations
  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    const [blogPost] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return blogPost;
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [blogPost] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return blogPost;
  }

  async listBlogPosts(options: { 
    category?: string, 
    userId?: number, 
    status?: string, 
    tag?: string, 
    pageId?: number, 
    symbolId?: number, 
    offset?: number, 
    limit?: number 
  } = {}): Promise<BlogPost[]> {
    const { 
      category, 
      userId, 
      status = 'published', 
      tag, 
      pageId, 
      symbolId, 
      offset = 0, 
      limit = 20 
    } = options;
    
    // Start building the query
    let query = db.select().from(blogPosts);
    
    // Add filters
    const filters = [];
    
    if (category) {
      filters.push(eq(blogPosts.category, category));
    }
    
    if (userId) {
      filters.push(eq(blogPosts.userId, userId));
    }
    
    if (status) {
      filters.push(eq(blogPosts.status, status));
    }
    
    if (pageId) {
      filters.push(eq(blogPosts.pageId, pageId));
    }
    
    if (symbolId) {
      filters.push(eq(blogPosts.symbolId, symbolId));
    }
    
    // Combine filters
    if (filters.length > 0) {
      query = query.where(and(...filters));
    }
    
    // Add tag filter separately as it requires array handling
    if (tag) {
      query = query.where(sqlExpr`${blogPosts.tags} @> ARRAY[${tag}]::text[]`);
    }
    
    // Add order, limit, offset
    const results = await query
      .orderBy(desc(blogPosts.createdAt))
      .limit(limit)
      .offset(offset);
    
    return results;
  }

  async createBlogPost(blogPost: InsertBlogPost): Promise<BlogPost> {
    const [newBlogPost] = await db.insert(blogPosts).values(blogPost).returning();
    return newBlogPost;
  }

  async updateBlogPost(id: number, data: Partial<BlogPost>): Promise<BlogPost> {
    const [updatedBlogPost] = await db
      .update(blogPosts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(blogPosts.id, id))
      .returning();
    return updatedBlogPost;
  }

  async deleteBlogPost(id: number): Promise<void> {
    // First delete all comments associated with this post
    await db.delete(blogComments).where(eq(blogComments.blogPostId, id));
    
    // Delete all votes
    await db.delete(blogPostVotes).where(eq(blogPostVotes.blogPostId, id));
    
    // Delete related topics
    await db.delete(blogRelatedTopics).where(eq(blogRelatedTopics.blogPostId, id));
    await db.delete(blogRelatedTopics).where(eq(blogRelatedTopics.relatedTopicId, id));
    
    // Delete the post
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
  }

  async publishBlogPost(id: number): Promise<BlogPost> {
    const [publishedPost] = await db
      .update(blogPosts)
      .set({ 
        status: 'published', 
        publishedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(blogPosts.id, id))
      .returning();
    return publishedPost;
  }

  async incrementBlogPostView(id: number): Promise<void> {
    await db
      .update(blogPosts)
      .set({ 
        viewCount: sqlExpr`${blogPosts.viewCount} + 1` 
      })
      .where(eq(blogPosts.id, id));
  }

  async incrementBlogPostShare(id: number): Promise<void> {
    await db
      .update(blogPosts)
      .set({ 
        shareCount: sqlExpr`${blogPosts.shareCount} + 1` 
      })
      .where(eq(blogPosts.id, id));
  }

  // Blog comment operations
  async getBlogComment(id: number): Promise<BlogComment | undefined> {
    const [comment] = await db.select().from(blogComments).where(eq(blogComments.id, id));
    return comment;
  }

  async getBlogCommentsByPost(blogPostId: number): Promise<BlogComment[]> {
    return await db
      .select()
      .from(blogComments)
      .where(eq(blogComments.blogPostId, blogPostId))
      .orderBy(asc(blogComments.createdAt));
  }

  async createBlogComment(blogComment: InsertBlogComment): Promise<BlogComment> {
    const [newComment] = await db.insert(blogComments).values(blogComment).returning();
    return newComment;
  }

  async updateBlogComment(id: number, data: Partial<BlogComment>): Promise<BlogComment> {
    const [updatedComment] = await db
      .update(blogComments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(blogComments.id, id))
      .returning();
    return updatedComment;
  }

  async deleteBlogComment(id: number): Promise<void> {
    await db.delete(blogComments).where(eq(blogComments.id, id));
  }

  // Blog post voting operations
  async createBlogPostVote(data: { blogPostId: number, userId: number, voteType: string }): Promise<any> {
    const { blogPostId, userId, voteType } = data;
    
    // Check if user already voted on this post
    const existingVote = await this.getBlogPostVote(blogPostId, userId);
    
    if (existingVote) {
      // If vote type is the same, do nothing
      if (existingVote.voteType === voteType) {
        return existingVote;
      }
      
      // If vote type is different, delete existing vote and create new one
      await db.delete(blogPostVotes)
        .where(and(
          eq(blogPostVotes.blogPostId, blogPostId),
          eq(blogPostVotes.userId, userId)
        ));
    }
    
    // Create the vote
    const [vote] = await db.insert(blogPostVotes)
      .values({
        blogPostId,
        userId,
        voteType
      })
      .returning();
    
    // Update the blog post's vote counts
    const voteIncrement = voteType === 'upvote' ? 1 : 0;
    const downvoteIncrement = voteType === 'downvote' ? 1 : 0;
    
    await db.update(blogPosts)
      .set({ 
        upvotes: sqlExpr`${blogPosts.upvotes} + ${voteIncrement}`,
        downvotes: sqlExpr`${blogPosts.downvotes} + ${downvoteIncrement}`
      })
      .where(eq(blogPosts.id, blogPostId));
    
    return vote;
  }
  
  async getBlogPostVote(blogPostId: number, userId: number): Promise<any | undefined> {
    const [vote] = await db.select()
      .from(blogPostVotes)
      .where(and(
        eq(blogPostVotes.blogPostId, blogPostId),
        eq(blogPostVotes.userId, userId)
      ));
    return vote;
  }

  // Blog topic idea operations
  async getBlogTopicIdea(id: number): Promise<BlogTopicIdea | undefined> {
    const [topicIdea] = await db.select().from(blogTopicIdeas).where(eq(blogTopicIdeas.id, id));
    return topicIdea;
  }

  async listBlogTopicIdeas(options: { 
    category?: string, 
    status?: string, 
    complexity?: string, 
    pageId?: number, 
    symbolId?: number, 
    offset?: number, 
    limit?: number 
  } = {}): Promise<BlogTopicIdea[]> {
    const { 
      category, 
      status = 'available', 
      complexity,
      pageId, 
      symbolId, 
      offset = 0, 
      limit = 20 
    } = options;
    
    // Start building the query
    let query = db.select().from(blogTopicIdeas);
    
    // Add filters
    const filters = [];
    
    if (category) {
      filters.push(eq(blogTopicIdeas.category, category));
    }
    
    if (status) {
      filters.push(eq(blogTopicIdeas.status, status));
    }
    
    if (complexity) {
      filters.push(eq(blogTopicIdeas.complexity, complexity));
    }
    
    if (pageId) {
      filters.push(eq(blogTopicIdeas.pageId, pageId));
    }
    
    if (symbolId) {
      filters.push(eq(blogTopicIdeas.symbolId, symbolId));
    }
    
    // Combine filters
    if (filters.length > 0) {
      query = query.where(and(...filters));
    }
    
    // Add order, limit, offset
    const results = await query
      .orderBy(asc(blogTopicIdeas.title))
      .limit(limit)
      .offset(offset);
    
    return results;
  }

  async createBlogTopicIdea(blogTopicIdea: InsertBlogTopicIdea): Promise<BlogTopicIdea> {
    const [newTopicIdea] = await db.insert(blogTopicIdeas).values(blogTopicIdea).returning();
    return newTopicIdea;
  }

  async updateBlogTopicIdea(id: number, data: Partial<BlogTopicIdea>): Promise<BlogTopicIdea> {
    const [updatedTopicIdea] = await db
      .update(blogTopicIdeas)
      .set(data)
      .where(eq(blogTopicIdeas.id, id))
      .returning();
    return updatedTopicIdea;
  }

  async deleteBlogTopicIdea(id: number): Promise<void> {
    await db.delete(blogTopicIdeas).where(eq(blogTopicIdeas.id, id));
  }

  // Blog related topics operations
  async createBlogRelatedTopic(relatedTopic: InsertBlogRelatedTopic): Promise<BlogRelatedTopic> {
    const [newRelatedTopic] = await db.insert(blogRelatedTopics).values(relatedTopic).returning();
    return newRelatedTopic;
  }

  async getRelatedBlogPosts(blogPostId: number, limit: number = 5): Promise<BlogPost[]> {
    // Get related topics for the given blog post
    const relatedTopics = await db.select()
      .from(blogRelatedTopics)
      .where(eq(blogRelatedTopics.blogPostId, blogPostId))
      .orderBy(desc(blogRelatedTopics.relevanceScore))
      .limit(limit);
    
    // If no related topics, return empty array
    if (relatedTopics.length === 0) {
      return [];
    }
    
    // Extract the related post IDs
    const relatedPostIds = relatedTopics.map(rt => rt.relatedTopicId);
    
    // Get the related posts
    return await db.select()
      .from(blogPosts)
      .where(
        and(
          sqlExpr`${blogPosts.id} = ANY(${relatedPostIds})`,
          eq(blogPosts.status, 'published')
        )
      );
  }

  // Method to auto-generate a blog post from a topic idea using AI
  async autoGenerateBlogPostFromIdea(topicIdeaId: number, userId: number): Promise<BlogPost> {
    // Get the topic idea
    const topicIdea = await this.getBlogTopicIdea(topicIdeaId);
    if (!topicIdea) {
      throw new Error('Topic idea not found');
    }

    // Get the title and AI prompt template from the topic idea
    const title = topicIdea.title;
    const promptTemplate = topicIdea.promptTemplate;
    
    // Generate a slug from the title
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/gi, '')  // Remove special chars
      .replace(/\s+/g, '-')      // Replace spaces with hyphens
      .substring(0, 100);        // Limit length
    
    // Generate sample content based on the topic
    const sampleContent = `<h1>${title}</h1>
<p><em>This is an AI-generated blog post based on the topic: "${title}"</em></p>
<p>The topic prompt was: "${promptTemplate}"</p>

<h2>Introduction</h2>
<p>The Voynich Manuscript has fascinated scholars, cryptographers, and enthusiasts for centuries. This enigmatic document, with its unknown script and puzzling illustrations, continues to be one of the world's most mysterious texts.</p>

<h2>Main Content</h2>
<p>The manuscript's unusual features include:</p>
<ul>
  <li>An undeciphered script that doesn't match any known writing system</li>
  <li>Botanical illustrations that don't clearly correspond to real plants</li>
  <li>Astronomical diagrams with peculiar circular patterns</li>
  <li>Apparent "recipes" or formulations in certain sections</li>
</ul>

<p>Researchers have applied numerous techniques to understand this document, from traditional cryptographic approaches to modern computational methods. However, the manuscript has resisted all attempts at decipherment so far.</p>

<h2>Analysis</h2>
<p>What makes this topic particularly interesting is the intersection of various disciplines: linguistics, botany, astronomy, history, and cryptography. The manuscript doesn't fit neatly into any single category of medieval documents.</p>

<p>Some theories suggest it might be:</p>
<ol>
  <li>An elaborate hoax</li>
  <li>A constructed artificial language</li>
  <li>An encrypted text in a natural language</li>
  <li>A phonetic transcription of an unknown language</li>
</ol>

<h2>Conclusion</h2>
<p>The mystery of the Voynich Manuscript endures precisely because it challenges our understanding of medieval knowledge and communication. As research continues with new technologies and approaches, we may yet unlock its secrets.</p>

<p><em>This is a sample automatically generated post. The content should be reviewed and edited by a human before publishing.</em></p>`;

    // Create an excerpt
    const excerpt = `An exploration of ${title.toLowerCase()} showing how the unique features of the Voynich Manuscript continue to puzzle researchers.`;

    // Generate tags based on category and common Voynich topics
    const commonTags = ["voynich", "manuscript", "research"];
    const categoryTag = topicIdea.category;
    const complexityTag = topicIdea.complexity || "research";
    const tags = [...new Set([categoryTag, complexityTag, ...commonTags])];
    
    // Create a draft blog post
    const blogPost = await this.createBlogPost({
      title,
      slug: `${slug}-${Date.now().toString().substring(9)}`, // Add timestamp for uniqueness
      excerpt,
      content: sampleContent,
      category: topicIdea.category,
      status: 'draft',
      userId,
      pageId: topicIdea.pageId,
      symbolId: topicIdea.symbolId,
      metaTitle: title,
      metaDescription: `Learn about ${title.toLowerCase()} in this fascinating exploration of the Voynich Manuscript's mysteries.`,
      promptTemplate: topicIdea.promptTemplate,
      tags
    });
    
    // Update the topic idea to link to the generated post
    await this.updateBlogTopicIdea(topicIdeaId, { 
      status: 'used',
      generatedPostId: blogPost.id
    });
    
    return blogPost;
  }

  private generateShareToken(): string {
    const randomString = randomBytes(16).toString('hex');
    return createHash('sha256').update(randomString).digest('hex').substring(0, 32);
  }
}

export const storage = new DatabaseStorage();
