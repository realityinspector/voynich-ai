import { pgTable, text, serial, integer, boolean, timestamp, json, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

/**
 * DATABASE SCHEMA - SAFE MIGRATION GUIDELINES FOR LLM AGENTS
 * ===========================================================
 * 
 * [ATTENTION LLM AGENT] This file defines the database schema using Drizzle ORM.
 * Follow these strict guidelines when modifying this file:
 * 
 * 1. DO NOT drop existing tables or columns - this will cause data loss
 * 2. DO NOT modify existing column types - this may cause data loss
 * 3. DO NOT rename existing tables or columns - this breaks relationships
 * 4. DO add new tables and columns only in backward-compatible ways
 * 
 * When schema changes are needed:
 * - For new features: Simply add new tables or nullable columns
 * - For structure changes: Add new structures alongside old ones, then migrate data
 * - For critical fixes: See the safe migration patterns in docs/DATABASE_MIGRATIONS.md
 * 
 * USE: npm run db:push - to apply schema changes
 * AVOID: Destructive operations or manual database manipulation
 * VERIFY: Changes do not result in data loss warnings from Drizzle
 *
 * REMEMBER: A safe schema change that preserves data is ALWAYS preferred
 * over a "cleaner" but destructive change! Production data is irreplaceable.
 */

// User-related schemas
export const userRoleEnum = pgEnum('user_role', ['admin', 'user', 'researcher']);

// Blog-related schemas
export const blogPostStatusEnum = pgEnum('blog_post_status', ['draft', 'published', 'archived']);
export const blogPostCategoryEnum = pgEnum('blog_post_category', ['research', 'analysis', 'history', 'cryptography', 'language', 'manuscript_features', 'community']);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default('researcher'),
  credits: integer("credits").notNull().default(12),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  institution: text("institution"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  notes: many(notes),
  annotations: many(annotations),
  analysisResults: many(analysisResults),
  blogPosts: many(blogPosts),
  blogComments: many(blogComments),
}));

// Manuscript-related schemas
export const manuscriptSectionEnum = pgEnum('manuscript_section', ['herbal', 'astronomical', 'biological', 'cosmological', 'pharmaceutical', 'recipes', 'unknown']);

export const manuscriptPages = pgTable("manuscript_pages", {
  // Using integer instead of serial to allow manual ID setting based on folio number
  id: integer("id").primaryKey(),
  folioNumber: text("folio_number").notNull().unique(),
  filename: text("filename").notNull(),
  section: manuscriptSectionEnum("section").default('unknown'),
  width: integer("width"),
  height: integer("height"),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  processingStatus: text("processing_status").default('pending'),
});

export const manuscriptPagesRelations = relations(manuscriptPages, ({ one, many }) => ({
  uploadedByUser: one(users, {
    fields: [manuscriptPages.uploadedBy],
    references: [users.id],
  }),
  symbols: many(symbols),
  annotations: many(annotations),
  blogPosts: many(blogPosts),
  blogTopicIdeas: many(blogTopicIdeas),
}));

// Symbol-related schemas
export const symbols = pgTable("symbols", {
  id: serial("id").primaryKey(),
  pageId: integer("page_id").references(() => manuscriptPages.id).notNull(),
  image: text("image").notNull(), // Path to the extracted symbol image
  x: integer("x").notNull(),
  y: integer("y").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  category: text("category"),
  frequency: integer("frequency"),
  metadata: json("metadata"),
  extractedAt: timestamp("extracted_at").defaultNow().notNull(),
});

export const symbolsRelations = relations(symbols, ({ one }) => ({
  page: one(manuscriptPages, {
    fields: [symbols.pageId],
    references: [manuscriptPages.id],
  }),
}));

// Annotation-related schemas
export const annotations = pgTable("annotations", {
  id: serial("id").primaryKey(),
  pageId: integer("page_id").references(() => manuscriptPages.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  x: integer("x").notNull(),
  y: integer("y").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  content: text("content").notNull(),
  upvotes: integer("upvotes").default(0).notNull(),
  downvotes: integer("downvotes").default(0).notNull(),
  score: integer("score").default(0).notNull(),
  source: text("source").default('manual'), // 'manual', 'api', 'llm'
  isPublic: boolean("is_public").default(true).notNull(),
  apiKeyId: integer("api_key_id").references(() => apiKeys.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const annotationsRelations = relations(annotations, ({ one, many }) => ({
  page: one(manuscriptPages, {
    fields: [annotations.pageId],
    references: [manuscriptPages.id],
  }),
  user: one(users, {
    fields: [annotations.userId],
    references: [users.id],
  }),
  comments: many(annotationComments),
  apiKey: one(apiKeys, {
    fields: [annotations.apiKeyId],
    references: [apiKeys.id],
  }),
}));

export const annotationComments = pgTable("annotation_comments", {
  id: serial("id").primaryKey(),
  annotationId: integer("annotation_id").references(() => annotations.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const annotationCommentsRelations = relations(annotationComments, ({ one }) => ({
  annotation: one(annotations, {
    fields: [annotationComments.annotationId],
    references: [annotations.id],
  }),
  user: one(users, {
    fields: [annotationComments.userId],
    references: [users.id],
  }),
}));

// Annotation voting system
export const annotationVotes = pgTable("annotation_votes", {
  id: serial("id").primaryKey(),
  annotationId: integer("annotation_id").references(() => annotations.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  voteType: text("vote_type").notNull(), // 'upvote' or 'downvote'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const annotationVotesRelations = relations(annotationVotes, ({ one }) => ({
  annotation: one(annotations, {
    fields: [annotationVotes.annotationId],
    references: [annotations.id],
  }),
  user: one(users, {
    fields: [annotationVotes.userId],
    references: [users.id],
  }),
}));

// Research notes
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Add leaderboard tables
export const leaderboardTimeframeEnum = pgEnum('leaderboard_timeframe', ['daily', 'weekly', 'monthly', 'alltime']);

export const leaderboards = pgTable("leaderboards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  score: integer("score").default(0).notNull(),
  annotationCount: integer("annotation_count").default(0).notNull(),
  upvotesReceived: integer("upvotes_received").default(0).notNull(),
  timeframe: leaderboardTimeframeEnum("timeframe").notNull(),
  date: timestamp("date").notNull(),
  rank: integer("rank"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const leaderboardsRelations = relations(leaderboards, ({ one }) => ({
  user: one(users, {
    fields: [leaderboards.userId],
    references: [users.id],
  }),
}));

// Activity feed
export const activityTypeEnum = pgEnum('activity_type', ['annotation_created', 'annotation_upvoted', 'note_created', 'analysis_created', 'symbol_categorized']);

export const activityFeed = pgTable("activity_feed", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: activityTypeEnum("type").notNull(),
  entityId: integer("entity_id").notNull(), // ID of the related entity (annotation, note, etc.)
  entityType: text("entity_type").notNull(), // Type of the entity ('annotation', 'note', etc.)
  metadata: json("metadata"), // Additional metadata about the activity
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isPublic: boolean("is_public").default(true).notNull(),
});

export const activityFeedRelations = relations(activityFeed, ({ one }) => ({
  user: one(users, {
    fields: [activityFeed.userId],
    references: [users.id],
  }),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  user: one(users, {
    fields: [notes.userId],
    references: [users.id],
  }),
}));

// AI Analysis results
export const analysisTypeEnum = pgEnum('analysis_type', ['symbol_extraction', 'translation_attempt', 'pattern_analysis', 'custom_prompt']);

export const analysisResults = pgTable("analysis_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  pageId: integer("page_id").references(() => manuscriptPages.id),
  type: analysisTypeEnum("type").notNull(),
  prompt: text("prompt"),
  result: json("result").notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  model: text("model"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  shareToken: text("share_token"),
});

export const analysisResultsRelations = relations(analysisResults, ({ one }) => ({
  user: one(users, {
    fields: [analysisResults.userId],
    references: [users.id],
  }),
  page: one(manuscriptPages, {
    fields: [analysisResults.pageId],
    references: [manuscriptPages.id],
  }),
}));

// API keys
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));

// Extraction jobs
export const extractionJobs = pgTable("extraction_jobs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  startPageId: integer("start_page_id").references(() => manuscriptPages.id).notNull(),
  endPageId: integer("end_page_id").references(() => manuscriptPages.id).notNull(),
  status: text("status").default('pending').notNull(),
  parameters: json("parameters").notNull(),
  progress: integer("progress").default(0).notNull(),
  symbolsExtracted: integer("symbols_extracted").default(0),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const extractionJobsRelations = relations(extractionJobs, ({ one }) => ({
  user: one(users, {
    fields: [extractionJobs.userId],
    references: [users.id],
  }),
  startPage: one(manuscriptPages, {
    fields: [extractionJobs.startPageId],
    references: [manuscriptPages.id],
  }),
  endPage: one(manuscriptPages, {
    fields: [extractionJobs.endPageId],
    references: [manuscriptPages.id],
  }),
}));

// Credit transactions
export const creditTransactionTypeEnum = pgEnum('credit_transaction_type', ['purchase', 'free', 'admin_grant', 'usage']);

export const creditTransactions = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  amount: integer("amount").notNull(),
  type: creditTransactionTypeEnum("type").notNull(),
  description: text("description"),
  stripePaymentId: text("stripe_payment_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  user: one(users, {
    fields: [creditTransactions.userId],
    references: [users.id],
  }),
}));

// Blog post schemas
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  featuredImage: text("featured_image"),
  category: blogPostCategoryEnum("category").notNull(),
  status: blogPostStatusEnum("status").notNull().default('draft'),
  userId: integer("user_id").references(() => users.id).notNull(),
  pageId: integer("page_id").references(() => manuscriptPages.id),
  symbolId: integer("symbol_id").references(() => symbols.id),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  promptTemplate: text("prompt_template"),
  tags: text("tags").array(),
  viewCount: integer("view_count").default(0).notNull(),
  shareCount: integer("share_count").default(0).notNull(),
  upvotes: integer("upvotes").default(0).notNull(),
  downvotes: integer("downvotes").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  publishedAt: timestamp("published_at"),
});

export const blogPostsRelations = relations(blogPosts, ({ one, many }) => ({
  user: one(users, {
    fields: [blogPosts.userId],
    references: [users.id],
  }),
  page: one(manuscriptPages, {
    fields: [blogPosts.pageId],
    references: [manuscriptPages.id],
  }),
  symbol: one(symbols, {
    fields: [blogPosts.symbolId],
    references: [symbols.id],
  }),
  comments: many(blogComments),
  relatedTopics: many(blogRelatedTopics),
}));

// Blog comments
export const blogComments = pgTable("blog_comments", {
  id: serial("id").primaryKey(),
  blogPostId: integer("blog_post_id").references(() => blogPosts.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const blogCommentsRelations = relations(blogComments, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogComments.blogPostId],
    references: [blogPosts.id],
  }),
  user: one(users, {
    fields: [blogComments.userId],
    references: [users.id],
  }),
}));

// Blog post voting system
export const blogPostVotes = pgTable("blog_post_votes", {
  id: serial("id").primaryKey(),
  blogPostId: integer("blog_post_id").references(() => blogPosts.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  voteType: text("vote_type").notNull(), // 'upvote' or 'downvote'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const blogPostVotesRelations = relations(blogPostVotes, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogPostVotes.blogPostId],
    references: [blogPosts.id],
  }),
  user: one(users, {
    fields: [blogPostVotes.userId],
    references: [users.id],
  }),
}));

// Blog topic ideas for auto-generation
export const blogTopicIdeas = pgTable("blog_topic_ideas", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: blogPostCategoryEnum("category").notNull(),
  description: text("description").notNull(),
  promptTemplate: text("prompt_template").notNull(),
  complexity: text("complexity").default('medium').notNull(), // 'easy', 'medium', 'advanced'
  status: text("status").default('available').notNull(), // 'available', 'generated', 'published'
  pageId: integer("page_id").references(() => manuscriptPages.id),
  symbolId: integer("symbol_id").references(() => symbols.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  generatedPostId: integer("generated_post_id").references(() => blogPosts.id),
});

export const blogTopicIdeasRelations = relations(blogTopicIdeas, ({ one }) => ({
  page: one(manuscriptPages, {
    fields: [blogTopicIdeas.pageId],
    references: [manuscriptPages.id],
  }),
  symbol: one(symbols, {
    fields: [blogTopicIdeas.symbolId],
    references: [symbols.id],
  }),
  generatedPost: one(blogPosts, {
    fields: [blogTopicIdeas.generatedPostId], 
    references: [blogPosts.id],
  }),
}));

// Related topics for blog posts
export const blogRelatedTopics = pgTable("blog_related_topics", {
  id: serial("id").primaryKey(),
  blogPostId: integer("blog_post_id").references(() => blogPosts.id).notNull(),
  relatedTopicId: integer("related_topic_id").references(() => blogPosts.id).notNull(),
  relevanceScore: integer("relevance_score").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const blogRelatedTopicsRelations = relations(blogRelatedTopics, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogRelatedTopics.blogPostId],
    references: [blogPosts.id],
  }),
  relatedPost: one(blogPosts, {
    fields: [blogRelatedTopics.relatedTopicId],
    references: [blogPosts.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
});

// Allow passing custom IDs based on folio numbers
export const insertManuscriptPageSchema = createInsertSchema(manuscriptPages)
  .omit({
    uploadedAt: true,
    processingStatus: true,
  })
  .extend({
    id: z.number().optional(), // Make ID optional so we can set it based on folio number
  });

export const insertSymbolSchema = createInsertSchema(symbols).omit({
  id: true,
  extractedAt: true,
});

export const insertAnnotationSchema = createInsertSchema(annotations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnalysisResultSchema = createInsertSchema(analysisResults).omit({
  id: true,
  createdAt: true,
  shareToken: true,
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
  lastUsed: true,
});

export const insertExtractionJobSchema = createInsertSchema(extractionJobs).omit({
  id: true,
  status: true,
  progress: true,
  symbolsExtracted: true,
  startedAt: true,
  completedAt: true,
});

// Types for database operations
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type ManuscriptPage = typeof manuscriptPages.$inferSelect;
export type InsertManuscriptPage = z.infer<typeof insertManuscriptPageSchema>;

export type Symbol = typeof symbols.$inferSelect;
export type InsertSymbol = z.infer<typeof insertSymbolSchema>;

export type Annotation = typeof annotations.$inferSelect;
export type InsertAnnotation = z.infer<typeof insertAnnotationSchema>;

export type AnnotationComment = typeof annotationComments.$inferSelect;

export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;

export type AnalysisResult = typeof analysisResults.$inferSelect;
export type InsertAnalysisResult = z.infer<typeof insertAnalysisResultSchema>;

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;

export type ExtractionJob = typeof extractionJobs.$inferSelect;
export type InsertExtractionJob = z.infer<typeof insertExtractionJobSchema>;

export type CreditTransaction = typeof creditTransactions.$inferSelect;

// Blog insert schemas
export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
  viewCount: true,
  shareCount: true,
  upvotes: true,
  downvotes: true,
});

export const insertBlogCommentSchema = createInsertSchema(blogComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBlogTopicIdeaSchema = createInsertSchema(blogTopicIdeas).omit({
  id: true,
  createdAt: true,
  generatedPostId: true,
});

export const insertBlogPostVoteSchema = createInsertSchema(blogPostVotes).omit({
  id: true,
  createdAt: true,
});

export const insertBlogRelatedTopicSchema = createInsertSchema(blogRelatedTopics).omit({
  id: true,
  createdAt: true,
});

// Blog types
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

export type BlogComment = typeof blogComments.$inferSelect;
export type InsertBlogComment = z.infer<typeof insertBlogCommentSchema>;

export type BlogPostVote = typeof blogPostVotes.$inferSelect;
export type InsertBlogPostVote = z.infer<typeof insertBlogPostVoteSchema>;

export type BlogTopicIdea = typeof blogTopicIdeas.$inferSelect;
export type InsertBlogTopicIdea = z.infer<typeof insertBlogTopicIdeaSchema>;

export type BlogRelatedTopic = typeof blogRelatedTopics.$inferSelect;
export type InsertBlogRelatedTopic = z.infer<typeof insertBlogRelatedTopicSchema>;
