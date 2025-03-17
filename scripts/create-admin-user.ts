#!/usr/bin/env tsx

/**
 * Script to create or update an admin user with a known password
 * Run with: npx tsx scripts/create-admin-user.ts
 */
import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { hash } from 'bcrypt';

async function createAdminUser(username: string, email: string, password: string) {
  try {
    console.log(`Attempting to create/update admin user "${username}"...`);
    
    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.username, username)
    });
    
    if (existingUser) {
      console.log(`User "${username}" already exists, updating credentials...`);
      
      // Update the user's password and role
      const hashedPassword = await hash(password, 10);
      
      const result = await db
        .update(users)
        .set({ 
          password: hashedPassword,
          role: 'admin'
        })
        .where(eq(users.username, username))
        .returning();
      
      console.log(`Updated password and role for user "${username}".`);
      return;
    }
    
    // Create a new user
    const hashedPassword = await hash(password, 10);
    
    const result = await db
      .insert(users)
      .values({
        username,
        email,
        password: hashedPassword,
        role: 'admin',
        credits: 100
      })
      .returning();
    
    console.log(`Success! Admin user "${username}" has been created with the provided password.`);
    console.log('Admin privileges include:');
    console.log('- Access to all platform features');
    console.log('- Ability to upload manuscript pages');
    console.log('- Ability to extract symbols from manuscript pages');
    console.log('- Access to admin settings and configurations');
    console.log('- Access to system testing dashboard');
  } catch (error) {
    console.error('Error creating/updating admin user:', error);
  } finally {
    process.exit(0);
  }
}

// Default values
const username = process.argv[2] || 'admin';
const email = process.argv[3] || 'admin@example.com';
const password = process.argv[4] || 'admin123';

// Run the script
createAdminUser(username, email, password);