#!/usr/bin/env node

/**
 * Safe Database Migration Script
 * 
 * This script performs validation checks before running Drizzle migrations.
 * It helps prevent destructive changes from LLM agents and human developers.
 * 
 * Usage: node scripts/safe-migrate.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

console.log(`${colors.bold}${colors.cyan}===== Safe Database Migration Tool =====\n${colors.reset}`);
console.log(`${colors.yellow}This tool helps prevent destructive database changes${colors.reset}`);
console.log(`${colors.yellow}by validating schema modifications before migration.${colors.reset}\n`);

// Step 1: Get the current schema state
console.log(`${colors.bold}[Step 1] Checking current database state...${colors.reset}`);

try {
  // Check if Drizzle has already generated migration files
  const migrationDir = path.join(__dirname, '..', 'migrations');
  const hasMigrationDir = fs.existsSync(migrationDir);
  
  if (!hasMigrationDir) {
    console.log(`${colors.yellow}No previous migrations found. This appears to be a new project.${colors.reset}`);
  } else {
    console.log(`${colors.green}Existing migration history found.${colors.reset}`);
  }
  
  // Run Drizzle migration check (generates migration files but doesn't apply them)
  console.log(`\n${colors.bold}[Step 2] Analyzing potential schema changes...${colors.reset}`);
  
  try {
    // Use Drizzle Kit to generate the migration plan but don't apply it
    execSync('npx drizzle-kit generate:pg', { stdio: 'inherit' });
    
    // Check if migration files were created
    const newMigrations = fs.readdirSync(migrationDir)
      .filter(file => file.endsWith('.sql') && fs.statSync(path.join(migrationDir, file)).mtime > Date.now() - 60000);
    
    if (newMigrations.length === 0) {
      console.log(`${colors.green}No schema changes detected.${colors.reset}`);
      process.exit(0);
    }
    
    console.log(`\n${colors.yellow}New migration files generated: ${newMigrations.join(', ')}${colors.reset}`);
    
    // Check for destructive operations in the migration files
    let hasDestructiveOperations = false;
    let destructiveOperations = [];
    
    for (const migrationFile of newMigrations) {
      const filePath = path.join(migrationDir, migrationFile);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for potentially destructive SQL operations
      const destructivePatterns = [
        { pattern: /DROP\s+TABLE/i, message: 'Dropping tables' },
        { pattern: /DROP\s+COLUMN/i, message: 'Dropping columns' },
        { pattern: /ALTER\s+COLUMN.*TYPE/i, message: 'Changing column types' },
        { pattern: /ALTER\s+TABLE.*RENAME/i, message: 'Renaming tables/columns' }
      ];
      
      for (const { pattern, message } of destructivePatterns) {
        if (pattern.test(content)) {
          hasDestructiveOperations = true;
          destructiveOperations.push(`${migrationFile}: ${message}`);
        }
      }
    }
    
    if (hasDestructiveOperations) {
      console.log(`\n${colors.red}${colors.bold}WARNING: Potentially destructive operations detected:${colors.reset}`);
      destructiveOperations.forEach(op => console.log(`${colors.red}  - ${op}${colors.reset}`));
      
      console.log(`\n${colors.yellow}Please review the migration files and ensure data safety.${colors.reset}`);
      console.log(`${colors.yellow}Consider using a non-destructive migration approach instead.${colors.reset}`);
      console.log(`${colors.yellow}See docs/DATABASE_MIGRATIONS.md for safe migration patterns.${colors.reset}\n`);
      
      askForConfirmation(
        `${colors.red}${colors.bold}Are you certain you want to proceed with these potentially destructive changes?${colors.reset} (yes/no) `,
        proceedWithMigration
      );
    } else {
      console.log(`\n${colors.green}No destructive operations detected. Changes appear safe.${colors.reset}\n`);
      askForConfirmation(
        `${colors.yellow}Would you like to proceed with the migration?${colors.reset} (yes/no) `,
        proceedWithMigration
      );
    }
    
  } catch (error) {
    console.error(`${colors.red}Error generating migration plan: ${error.message}${colors.reset}`);
    process.exit(1);
  }
  
} catch (error) {
  console.error(`${colors.red}Error checking database state: ${error.message}${colors.reset}`);
  process.exit(1);
}

function askForConfirmation(question, callback) {
  rl.question(question, (answer) => {
    if (answer.toLowerCase() === 'yes') {
      callback();
    } else {
      console.log(`\n${colors.yellow}Migration cancelled. Please review and modify your schema changes.${colors.reset}`);
      rl.close();
      process.exit(0);
    }
  });
}

function proceedWithMigration() {
  console.log(`\n${colors.bold}[Step 3] Applying database migrations...${colors.reset}`);
  
  try {
    execSync('npm run db:push', { stdio: 'inherit' });
    console.log(`\n${colors.green}${colors.bold}Migration completed successfully!${colors.reset}`);
    
    // Step 4: Verification
    console.log(`\n${colors.bold}[Step 4] Post-migration verification checklist:${colors.reset}`);
    console.log(`${colors.cyan}1. Verify the database schema matches expectations${colors.reset}`);
    console.log(`${colors.cyan}2. Verify all existing data is preserved and accessible${colors.reset}`);
    console.log(`${colors.cyan}3. Verify application functionality with the new schema${colors.reset}`);
    
    console.log(`\n${colors.green}Schema updated successfully.${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}Error applying migrations: ${error.message}${colors.reset}`);
    console.log(`\n${colors.yellow}Please review schema changes and try again.${colors.reset}`);
    console.log(`${colors.yellow}See docs/DATABASE_MIGRATIONS.md for safe migration patterns.${colors.reset}`);
  }
  
  rl.close();
}