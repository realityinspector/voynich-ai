import { 
  users, 
  manuscriptPages, 
  symbols, 
  annotations, 
  annotationComments, 
  notes, 
  analysisResults, 
  apiKeys, 
  extractionJobs,
  creditTransactions,
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
  type CreditTransaction
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

  async listManuscriptPages(offset: number = 0, limit: number = 20): Promise<ManuscriptPage[]> {
    return await db
      .select()
      .from(manuscriptPages)
      .orderBy(asc(manuscriptPages.folioNumber))
      .limit(limit)
      .offset(offset);
  }

  async createManuscriptPage(page: InsertManuscriptPage): Promise<ManuscriptPage> {
    const [newPage] = await db.insert(manuscriptPages).values(page).returning();
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

  // Helper methods
  private generateShareToken(): string {
    const randomString = randomBytes(16).toString('hex');
    return createHash('sha256').update(randomString).digest('hex').substring(0, 32);
  }
}

export const storage = new DatabaseStorage();
