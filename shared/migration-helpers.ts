/**
 * DATABASE MIGRATION HELPERS
 * 
 * This module provides utilities and patterns for safe database schema migrations.
 * It is specifically designed to help LLM agents like AI Assistant perform
 * database changes without risking data loss.
 * 
 * IMPORTANT: This file should not be imported directly into application code.
 * It serves as a reference and pattern library for safe schema evolution.
 */

import { pgTable, text, serial, integer, boolean, timestamp, json, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * SAFE MIGRATION PATTERNS FOR LLM AGENTS
 * 
 * These examples demonstrate how to safely evolve your database schema
 * without destructive changes that would cause data loss.
 */

// --------------------------------------------------
// PATTERN 1: Adding a new table
// --------------------------------------------------
// ✅ SAFE: New tables can always be added safely
export const exampleSafeNewTable = pgTable("example_new_table", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --------------------------------------------------
// PATTERN 2: Adding a new column to an existing table
// --------------------------------------------------
// ✅ SAFE: Adding nullable columns is safe
/* 
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  
  // Safe: Adding a new nullable column
  phoneNumber: text("phone_number"),
});
*/

// ❌ UNSAFE: Adding non-nullable columns without defaults will fail on existing data
/* 
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  
  // Unsafe: Will fail if table already has data
  requiredField: text("required_field").notNull(),
});
*/

// ✅ SAFE: Adding non-nullable columns WITH defaults is safe
/* 
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  
  // Safe: Has a default value for existing rows
  requiredWithDefault: boolean("required_with_default").notNull().default(false),
});
*/

// --------------------------------------------------
// PATTERN 3: Changing column types
// --------------------------------------------------
// ❌ UNSAFE: Directly changing column types risks data loss
/* 
// DON'T DO THIS: Changing from text to integer
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  // Unsafe: changing from text to integer
  score: integer("score"),  // Previously was text
});
*/

// ✅ SAFE: Add a new column with the desired type, migrate data in application code
/* 
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  scoreText: text("score"),           // Original column (keep this)
  scoreNumber: integer("score_num"),  // New column with desired type
});

// Then in application code:
// 1. Read from both columns (prefer new if available)
// 2. Write to both during transition
// 3. Eventually remove the old column in a future release
*/

// --------------------------------------------------
// PATTERN 4: Renaming columns or tables
// --------------------------------------------------
// ❌ UNSAFE: Directly renaming columns breaks existing data access
/* 
// DON'T DO THIS: Renaming columns loses data
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  displayName: text("display_name").notNull(),  // Previously was "username"
  email: text("email").notNull(),
}); 
*/

// ✅ SAFE: Add the new column, migrate data, keep both for now
/* 
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),        // Keep original column
  displayName: text("display_name"),           // Add new column
  email: text("email").notNull(),
});

// Then in application code:
// 1. Fill displayName from username for existing rows
// 2. Use displayName for new features
// 3. Update both in parallel during transition
// 4. Eventually remove the old column in a future release
*/

// --------------------------------------------------
// PATTERN 5: Adding constraints or relationships
// --------------------------------------------------
// ❌ UNSAFE: Adding constraints can fail if existing data violates them
/* 
// DON'T DO THIS: Adding constraints might fail
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),  // Adding constraint
  title: text("title").notNull(),
}); 
*/

// ✅ SAFE: Data validation first, then constraint
/* 
// Step 1: Add the column without constraint first
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),  // No constraint yet
  title: text("title").notNull(),
});

// Step 2: In application code, validate and fix data
// Step 3: Once data is valid, add the constraint in a separate migration
*/

/**
 * COMMON SCENARIOS FOR VOYNICH MANUSCRIPT APP
 * 
 * Here are some specific examples related to the Voynich Manuscript
 * application's data model.
 */

// Adding a new feature: user preferences
/* 
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  theme: text("theme").default("light"),
  fontsize: text("fontsize").default("medium"),
  advancedFeatures: boolean("advanced_features").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));
*/

// Extending manuscript pages with new metadata (safe addition)
/* 
export const manuscriptPages = pgTable("manuscript_pages", {
  // Existing fields
  id: integer("id").primaryKey(),
  folioNumber: text("folio_number").notNull().unique(),
  
  // Safe: Adding new nullable fields for enhanced metadata
  transcription: text("transcription"),
  translationStatus: text("translation_status").default("not_started"),
  lastAnalyzedAt: timestamp("last_analyzed_at"),
});
*/

/**
 * MIGRATION VALIDATION UTILITIES
 * 
 * These are conceptual examples. In practice, we use the safe-migrate.sh script
 * to validate migrations before applying them.
 */

// Example: Checking if a migration would be destructive
function isDestructiveMigration(sqlStatements: string[]): boolean {
  const destructivePatterns = [
    /DROP\s+TABLE/i,
    /DROP\s+COLUMN/i, 
    /ALTER\s+COLUMN.*TYPE/i,
    /ALTER\s+TABLE.*RENAME/i
  ];
  
  return sqlStatements.some(sql => 
    destructivePatterns.some(pattern => pattern.test(sql))
  );
}

// Example: Data migration helper (conceptual)
async function migrateColumnData<T>(
  db: any,
  tableName: string, 
  oldColumn: string,
  newColumn: string,
  transformFn: (oldValue: any) => any
): Promise<void> {
  // This is a conceptual example - implementation would depend on your DB driver
  console.log(`Migrating data from ${oldColumn} to ${newColumn} in ${tableName}`);
}

/**
 * FINAL REMARKS FOR LLM AGENTS
 * 
 * 1. Always prioritize data safety over schema elegance
 * 2. Use the provided safe-migrate.sh script to apply changes
 * 3. Read the full DATABASE_MIGRATIONS.md documentation
 * 4. When in doubt, use Pattern 2 (adding nullable columns) or Pattern 5 (validation before constraints)
 * 5. Remember that database migrations are critical operations that affect all application data
 */