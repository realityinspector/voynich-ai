# Database Migration Guidelines

## Important Notice for LLM Agents & Developers

This application uses PostgreSQL with Drizzle ORM for data persistence. All database schema changes must follow these strict guidelines to ensure data safety.

## Safe Migration Principles

1. **NEVER perform destructive schema changes directly**
2. **ALWAYS use the safe migration process outlined below**
3. **NEVER rebuild or reset the database as a solution to schema problems**
4. **ALWAYS validate schema changes for data safety**

## Migration Process

### Step 1: Schema Change Assessment

Before modifying `shared/schema.ts`, analyze your changes for data safety:

- ✅ **Safe changes**: Adding new tables/columns, adding new nullable columns
- ⚠️ **Potentially unsafe**: Modifying column types, adding constraints
- ❌ **Unsafe changes**: Dropping tables/columns, renaming tables/columns

### Step 2: Safe Migration Path for Breaking Changes

For any unsafe or potentially unsafe changes:

1. Add new tables/columns alongside existing ones
2. Update application code to use the new schema elements
3. Migrate data from old to new structures in your application
4. Mark old structures as deprecated with appropriate comments
5. Plan for future removal after ensuring all data is properly migrated

### Step 3: Executing Migrations

Always use the standard migration command:

```
npm run db:push
```

If Drizzle warns about destructive changes, **DO NOT FORCE THE MIGRATION**. Instead:

1. Revise your schema changes to follow a safe migration path
2. Implement data migration logic in application code
3. Execute the migration only when a safe path is confirmed

### Step 4: Verification

After running a migration:

1. Verify the database schema matches expectations
2. Verify all existing data is preserved and accessible
3. Verify application functionality with the new schema

## LLM Agent Special Instructions

If you are an LLM-based coding agent (like  Assistant or GitHub Copilot):

1. Always prioritize data safety over schema elegance
2. Never suggest destructive database operations
3. When encountering schema conflicts, propose safe migration paths
4. Include explicit comments in PR descriptions about database impact
5. Double-check your schema changes against this guide

## Common Safe Migration Patterns

### Adding Features Safely

```typescript
// Adding a new feature safely
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  // Safe: adding a new nullable column
  profilePicture: text("profile_picture"),
});
```

### Handling Breaking Changes

```typescript
// Instead of modifying a column type (unsafe):
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  // DON'T DO THIS: changing from text to integer
  // score: integer("score").notNull(),  // UNSAFE!
  
  // DO THIS: add a new column and migrate data in application code
  title: text("title").notNull(),
  scoreStr: text("score"),  // Original column
  scoreNum: integer("score_num"),  // New column
});

// Migration logic in application code:
// 1. Read from scoreStr if scoreNum is null
// 2. Write to both during transition
// 3. Eventually remove scoreStr in a future release
```

Remember: Database migrations are critical operations that affect all application data. Always prioritize safety over convenience.