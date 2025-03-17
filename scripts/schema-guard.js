#!/usr/bin/env node

/**
 * Schema Modification Guard
 * 
 * This utility is designed to be run by CI/CD pipelines or LLM agents before
 * applying database schema changes. It checks for potentially destructive
 * schema modifications and enforces safe migration practices.
 * 
 * Usage:
 *   node scripts/schema-guard.js [--check-only]
 * 
 * Options:
 *   --check-only  Only check for destructive changes without applying migrations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Configuration
const CONFIG = {
  schemaPath: './shared/schema.ts',
  migrationDir: './migrations',
  requiredHeaderText: 'DATABASE SCHEMA - SAFE MIGRATION GUIDELINES FOR LLM AGENTS',
  checkOnly: process.argv.includes('--check-only')
};

// Destructive operation patterns to detect
const DESTRUCTIVE_PATTERNS = [
  {
    pattern: /DROP\s+TABLE/i,
    level: 'high',
    message: 'Dropping tables will cause data loss'
  },
  {
    pattern: /DROP\s+COLUMN/i,
    level: 'high',
    message: 'Dropping columns will cause data loss'
  },
  {
    pattern: /ALTER\s+COLUMN.*TYPE/i,
    level: 'medium',
    message: 'Changing column types may cause data loss or truncation'
  },
  {
    pattern: /ALTER\s+TABLE.*RENAME/i,
    level: 'medium',
    message: 'Renaming tables/columns will break existing references'
  },
  {
    pattern: /CREATE\s+UNIQUE\s+INDEX/i,
    level: 'medium',
    message: 'Adding unique constraints may fail if duplicates exist'
  }
];

// Main function
async function main() {
  console.log(`${colors.bold}${colors.cyan}=== Schema Modification Guard ===\n${colors.reset}`);
  
  // Step 1: Check if schema file has proper safety comments
  console.log(`${colors.bold}[Step 1] Checking schema file for safety guidelines...${colors.reset}`);
  const hasProperHeader = checkSchemaFileHeader();
  
  if (!hasProperHeader) {
    console.log(`${colors.red}❌ Schema file is missing required safety guidelines header!${colors.reset}`);
    console.log(`${colors.yellow}Please ensure the schema file contains proper LLM agent instructions.${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`${colors.green}✓ Schema file has proper safety guidelines.${colors.reset}\n`);
  
  // Step 2: Generate migrations (but don't apply them yet)
  console.log(`${colors.bold}[Step 2] Generating migration plan...${colors.reset}`);
  
  try {
    execSync('npx drizzle-kit generate:pg', { stdio: 'inherit' });
    console.log(`${colors.green}✓ Migration plan generated.${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.red}❌ Failed to generate migration plan: ${error.message}${colors.reset}`);
    process.exit(1);
  }
  
  // Step 3: Analyze migrations for destructive operations
  console.log(`${colors.bold}[Step 3] Analyzing migrations for destructive operations...${colors.reset}`);
  
  const migrationFiles = fs.readdirSync(CONFIG.migrationDir)
    .filter(file => file.endsWith('.sql'))
    .map(file => path.join(CONFIG.migrationDir, file));
  
  if (migrationFiles.length === 0) {
    console.log(`${colors.yellow}No migration files found. No schema changes detected.${colors.reset}`);
    process.exit(0);
  }
  
  let destructiveOperationsFound = false;
  let highRiskOperationsFound = false;
  
  migrationFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    console.log(`Analyzing: ${fileName}`);
    
    DESTRUCTIVE_PATTERNS.forEach(({ pattern, level, message }) => {
      if (pattern.test(content)) {
        destructiveOperationsFound = true;
        if (level === 'high') highRiskOperationsFound = true;
        
        const riskColor = level === 'high' ? colors.red : colors.yellow;
        console.log(`  ${riskColor}${level === 'high' ? '❌' : '⚠️'} ${message} [${level} risk]${colors.reset}`);
        
        // Show the specific SQL that triggered the warning
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (pattern.test(lines[i])) {
            console.log(`    ${riskColor}${lines[i].trim()}${colors.reset}`);
          }
        }
      }
    });
  });
  
  if (!destructiveOperationsFound) {
    console.log(`${colors.green}✓ No destructive operations detected. Changes appear safe.${colors.reset}\n`);
  } else {
    console.log(`\n${colors.yellow}${colors.bold}⚠️ Potentially destructive operations detected in migrations!${colors.reset}`);
    console.log(`${colors.yellow}Please review the docs/DATABASE_MIGRATIONS.md for safe migration patterns.${colors.reset}`);
    
    if (highRiskOperationsFound) {
      console.log(`${colors.red}${colors.bold}❌ HIGH RISK operations detected that will cause data loss!${colors.reset}`);
      console.log(`${colors.red}These operations are not recommended. Consider using safe migration patterns instead.${colors.reset}\n`);
      
      if (!CONFIG.checkOnly) {
        console.log(`${colors.red}${colors.bold}Migration blocked due to high-risk operations.${colors.reset}`);
        console.log(`${colors.yellow}Please modify your schema changes to use safe patterns or run with --force flag.${colors.reset}`);
        process.exit(1);
      }
    }
  }
  
  // If running in check-only mode, exit now
  if (CONFIG.checkOnly) {
    console.log(`${colors.cyan}Check complete. Run without --check-only to apply migrations.${colors.reset}`);
    process.exit(destructiveOperationsFound ? 1 : 0);
  }
  
  // Step 4: Apply migrations if no high-risk operations found
  if (!highRiskOperationsFound) {
    console.log(`${colors.bold}[Step 4] Applying migrations...${colors.reset}`);
    
    try {
      execSync('npm run db:push', { stdio: 'inherit' });
      console.log(`${colors.green}${colors.bold}✓ Migrations applied successfully!${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}❌ Failed to apply migrations: ${error.message}${colors.reset}`);
      process.exit(1);
    }
  }
}

// Helper function to check if schema file has proper safety header
function checkSchemaFileHeader() {
  try {
    const schemaContent = fs.readFileSync(CONFIG.schemaPath, 'utf8');
    return schemaContent.includes(CONFIG.requiredHeaderText);
  } catch (error) {
    console.error(`${colors.red}Error reading schema file: ${error.message}${colors.reset}`);
    return false;
  }
}

// Run the main function
main().catch(error => {
  console.error(`${colors.red}Unhandled error: ${error.message}${colors.reset}`);
  process.exit(1);
});