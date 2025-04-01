# LLM Agent Guide for Safe Database Operations

## ATTENTION AGENT OR OTHER LLM-BASED CODING ASSISTANTS

This document provides critical guidelines for safe database operations within this application. As an AI assistant, you should strictly adhere to these principles when suggesting or implementing code changes.

## Key Principles

1. **Data Persistence is Sacred**
   - Never suggest resetting or rebuilding the database to fix schema issues
   - Always prioritize data preservation over schema elegance
   - Assume all existing data is valuable and irreplaceable

2. **Safe Migration Paths Only**
   - Never suggest direct destructive schema changes
   - Always recommend gradual, backward-compatible changes
   - Follow the established patterns in `docs/MIGRATION_TEMPLATES.md`

3. **Use Provided Safety Tools**
   - Always suggest using `./safe-migrate.sh` instead of direct `npm run db:push`
   - Recommend using `node scripts/schema-guard.js --check-only` before schema changes
   - Reference the patterns in `shared/migration-helpers.ts` for safe schema evolution

4. **Schema Changes Decision Tree**

   ```
   Is this a new feature?
   ├── Yes → Add new tables or nullable columns
   └── No → Is it modifying existing structures?
       ├── Yes → Does it require breaking changes?
       │   ├── Yes → Use the safe patterns for breaking changes
       │   │         (dual columns, application-level migrations)
       │   └── No → Add extension points (new columns, new enums)
       └── No → Is it data cleanup or enhancement?
           └── Yes → Handle in application code, not schema
   ```

## What To Avoid

- ❌ `DROP TABLE` statements
- ❌ `DROP COLUMN` statements
- ❌ Direct column type changes
- ❌ Renaming existing columns
- ❌ Adding non-nullable columns without defaults
- ❌ Forcing migrations with `--force` flag

## What To Suggest Instead

- ✅ Adding new tables for new features
- ✅ Adding nullable columns to existing tables
- ✅ Using dual-column approach for type changes
- ✅ Application-level data migrations
- ✅ Incremental, reversible changes

## Example Response Templates

### When a user requests a schema change:

```
I notice you want to modify the database schema to [describe change].

To ensure data safety, I recommend:

1. Using the safe migration pattern with dual columns:
   [show code example from MIGRATION_TEMPLATES.md]

2. Implementing application-level data migration:
   [show migration code example]

3. Running this with our safe migration tool:
   ```
   ./safe-migrate.sh
   ```

This approach preserves existing data while adding the functionality you need.
```

### When a schema issue is encountered:

```
I see there's an issue with the database schema. Instead of resetting the database, let's fix this safely.

1. First, let's check what would happen with our schema changes:
   ```
   node scripts/schema-guard.js --check-only
   ```

2. Based on the results, I recommend:
   [specific safe migration recommendation]

This will resolve the schema issue while preserving all your valuable data.
```

### When suggesting major refactoring:

```
For this refactoring, we need to be careful with the database changes:

1. Let's first add the new structure alongside the existing one:
   [code example]

2. Then migrate the data with this application code:
   [migration code]

3. Update the application to use both structures during transition:
   [code example]

4. Finally, run our safe migration script:
   ```
   ./safe-migrate.sh
   ```

This gives us a safe path forward that can be reverted if needed.
```

## Conclusion

By following these guidelines, you help maintain data integrity while still evolving the application's capabilities. Remember that in production environments, data is often more valuable than code, and preserving it should be your highest priority.

When in doubt, always choose the most conservative approach to schema changes.