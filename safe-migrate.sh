#!/bin/bash

# Safe Database Migration Script
# This script performs validation checks before running Drizzle migrations
# It helps prevent destructive changes from LLM agents and human developers

# ANSI color codes for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}${CYAN}===== Safe Database Migration Tool =====${NC}\n"
echo -e "${YELLOW}This tool helps prevent destructive database changes${NC}"
echo -e "${YELLOW}by validating schema modifications before migration.${NC}\n"

# Step 1: Get the current schema state
echo -e "${BOLD}[Step 1] Checking current database state...${NC}"

# Check if Drizzle has already generated migration files
if [ ! -d "./migrations" ]; then
  echo -e "${YELLOW}No previous migrations found. This appears to be a new project.${NC}"
else
  echo -e "${GREEN}Existing migration history found.${NC}"
fi

# Step 2: Analyze potential schema changes
echo -e "\n${BOLD}[Step 2] Analyzing potential schema changes...${NC}"

# Use Drizzle Kit to generate the migration plan but don't apply it
npx drizzle-kit generate:pg

# Check if migration files were created
if [ -d "./migrations" ]; then
  new_migrations=$(find ./migrations -name "*.sql" -mtime -1 | wc -l)
  
  if [ "$new_migrations" -eq 0 ]; then
    echo -e "${GREEN}No schema changes detected.${NC}"
    exit 0
  fi
  
  echo -e "\n${YELLOW}New migration files generated in ./migrations${NC}"
  
  # Check for destructive operations in the migration files
  destructive_count=0
  
  for file in ./migrations/*.sql; do
    if grep -q "DROP TABLE" "$file" || \
       grep -q "DROP COLUMN" "$file" || \
       grep -q "ALTER COLUMN.*TYPE" "$file" || \
       grep -q "ALTER TABLE.*RENAME" "$file"; then
      ((destructive_count++))
      echo -e "${RED}Potentially destructive operations detected in: $(basename "$file")${NC}"
    fi
  done
  
  if [ "$destructive_count" -gt 0 ]; then
    echo -e "\n${RED}${BOLD}WARNING: Potentially destructive operations detected!${NC}"
    echo -e "${YELLOW}Please review the migration files and ensure data safety.${NC}"
    echo -e "${YELLOW}Consider using a non-destructive migration approach instead.${NC}"
    echo -e "${YELLOW}See docs/DATABASE_MIGRATIONS.md for safe migration patterns.${NC}\n"
    
    read -p "$(echo -e ${RED}${BOLD}Are you certain you want to proceed with these potentially destructive changes?${NC} (yes/no) )" answer
    
    if [ "$answer" != "yes" ]; then
      echo -e "\n${YELLOW}Migration cancelled. Please review and modify your schema changes.${NC}"
      exit 0
    fi
  else
    echo -e "\n${GREEN}No destructive operations detected. Changes appear safe.${NC}\n"
    
    read -p "$(echo -e ${YELLOW}Would you like to proceed with the migration?${NC} (yes/no) )" answer
    
    if [ "$answer" != "yes" ]; then
      echo -e "\n${YELLOW}Migration cancelled.${NC}"
      exit 0
    fi
  fi
fi

# Step 3: Apply migrations
echo -e "\n${BOLD}[Step 3] Applying database migrations...${NC}"

npm run db:push

if [ $? -eq 0 ]; then
  echo -e "\n${GREEN}${BOLD}Migration completed successfully!${NC}"
  
  # Step 4: Verification
  echo -e "\n${BOLD}[Step 4] Post-migration verification checklist:${NC}"
  echo -e "${CYAN}1. Verify the database schema matches expectations${NC}"
  echo -e "${CYAN}2. Verify all existing data is preserved and accessible${NC}"
  echo -e "${CYAN}3. Verify application functionality with the new schema${NC}"
  
  echo -e "\n${GREEN}Schema updated successfully.${NC}"
else
  echo -e "\n${RED}Error applying migrations${NC}"
  echo -e "\n${YELLOW}Please review schema changes and try again.${NC}"
  echo -e "${YELLOW}See docs/DATABASE_MIGRATIONS.md for safe migration patterns.${NC}"
  exit 1
fi