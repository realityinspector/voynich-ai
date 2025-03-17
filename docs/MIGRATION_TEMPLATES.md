# Database Migration Templates

This document provides ready-to-use templates for common safe database migration scenarios. These templates can be copied and adapted for your specific needs.

## Table of Contents

1. [Adding New Features](#adding-new-features)
2. [Modifying Existing Structures](#modifying-existing-structures)
3. [Handling Breaking Changes](#handling-breaking-changes)
4. [Safe Data Migration](#safe-data-migration)

## Adding New Features

### Adding a New Table

```typescript
// New table for a new feature
export const newFeatureTable = pgTable("new_feature_table", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Don't forget to add relations
export const newFeatureTableRelations = relations(newFeatureTable, ({ one }) => ({
  user: one(users, {
    fields: [newFeatureTable.userId],
    references: [users.id],
  }),
}));

// Add corresponding insert schema and types
export const insertNewFeatureTableSchema = createInsertSchema(newFeatureTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type NewFeatureTable = typeof newFeatureTable.$inferSelect;
export type InsertNewFeatureTable = z.infer<typeof insertNewFeatureTableSchema>;
```

### Adding New Columns to Existing Tables

```typescript
// Safe: Adding nullable columns to existing tables
export const users = pgTable("users", {
  // Existing columns
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  
  // New columns - all safe to add
  avatar: text("avatar"),                                    // Nullable text
  preferences: json("preferences"),                         // Nullable JSON
  verifiedAt: timestamp("verified_at"),                     // Nullable timestamp
  isActive: boolean("is_active").default(true).notNull(),   // Non-nullable with default
});
```

## Modifying Existing Structures

### Extending Enums with New Values

```typescript
// Extending an enum with new values is safe
export const statusEnum = pgEnum('status', [
  'pending',
  'active',
  'suspended',
  'deleted',
  'archived',     // New value
  'flagged'       // New value
]);
```

### Adding Computed or Derived Columns

```typescript
// Adding a column that can be derived from existing data
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  
  // New column that will be populated in application code
  excerptPreview: text("excerpt_preview"),
});

// Then in your migration code (conceptual):
// for each post:
//   update post set excerpt_preview = substring(content, 1, 150) + '...'
```

## Handling Breaking Changes

### Changing Column Types Safely

```typescript
// Instead of directly changing a column type (unsafe):
export const metrics = pgTable("metrics", {
  id: serial("id").primaryKey(),
  
  // DON'T DO THIS - would cause data loss:
  // score: integer("score"),  // Previously was text
  
  // DO THIS - add a new column with the desired type:
  scoreText: text("score"),           // Keep original column
  scoreNumber: integer("score_num"),  // New column with desired type
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Then in application code:
// 1. Migrate data: update metrics set score_num = cast(score as integer) where score is not null
// 2. Read: const score = row.scoreNumber ?? (row.scoreText ? parseInt(row.scoreText) : null)
// 3. Write: Both columns during transition period
// 4. Eventually remove the old column in a future release
```

### Renaming Fields Safely

```typescript
// Instead of renaming columns directly (unsafe):
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  
  // DON'T DO THIS - breaks existing code:
  // displayName: text("display_name").notNull(),  // Renamed from "username"
  
  // DO THIS - keep both until transition is complete:
  username: text("username").notNull(),            // Keep original
  displayName: text("display_name"),               // Add new name
  
  email: text("email").notNull(),
});

// Then in application code:
// 1. Migrate: update users set display_name = username where display_name is null
// 2. Read: user.displayName ?? user.username
// 3. Write: Both fields during transition
// 4. Eventually make displayName required and remove username in a future release
```

## Safe Data Migration

### Application-level Data Migration

```typescript
// After adding new fields that need to be populated from existing data,
// use an application-level migration:

// In your migration script:
async function migrateData() {
  // 1. Find records needing migration
  const records = await db.query.yourTable.findMany({
    where: (fields, { isNull }) => isNull(fields.newField)
  });
  
  // 2. Process records in batches
  for (const batch of chunks(records, 100)) {
    for (const record of batch) {
      await db.update(yourTable)
        .set({
          newField: computeValueFromExisting(record),
        })
        .where(eq(yourTable.id, record.id));
    }
    console.log(`Processed batch of ${batch.length} records`);
  }
  
  console.log(`Migration complete - processed ${records.length} records`);
}

// Helper to split array into chunks
function chunks(array, size) {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size)
  );
}
```

### Data Validation Before Constraints

```typescript
// When adding new constraints, validate data first

// Step 1: Add column without constraints
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id"),  // No constraint yet
  content: text("content").notNull(),
});

// Step 2: Validate data in application code
async function validateCommentData() {
  // Find invalid records
  const invalidComments = await db.query.comments.findMany({
    where: (fields, { isNull }) => isNull(fields.postId)
  });
  
  if (invalidComments.length > 0) {
    console.error(`Found ${invalidComments.length} comments with null postId`);
    // Either fix the data or report the issue
  } else {
    console.log("All data is valid for adding foreign key constraint");
  }
}

// Step 3: Once data is valid, modify schema to add constraint
export const commentsWithConstraint = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id),  // Now with constraint
  content: text("content").notNull(),
});
```

Remember to always run migrations using the safe migration script:

```bash
./safe-migrate.sh
```

Or for validation only:

```bash
node scripts/schema-guard.js --check-only
```