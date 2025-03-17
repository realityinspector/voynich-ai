#!/usr/bin/env node

// Script to create a new admin user with a known password
const { db } = require('../server/db');
const { users } = require('../shared/schema');
const bcrypt = require('bcrypt');

/**
 * Create an admin user
 * @param {string} username - Username for the admin
 * @param {string} password - Password for the admin
 */
async function createAdminUser(username, email, password) {
  try {
    console.log(`Attempting to create admin user "${username}"...`);
    
    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, username)
    });
    
    if (existingUser) {
      console.log(`User "${username}" already exists.`);
      
      // Update the user's password and role
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const result = await db
        .update(users)
        .set({ 
          password: hashedPassword,
          role: 'admin'
        })
        .where((users, { eq }) => eq(users.username, username))
        .returning();
      
      console.log(`Updated password and role for user "${username}".`);
      return;
    }
    
    // Create a new user
    const hashedPassword = await bcrypt.hash(password, 10);
    
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
    console.error('Error creating admin user:', error);
  } finally {
    process.exit(0);
  }
}

// If called directly from command line
if (require.main === module) {
  const username = process.argv[2] || 'admin';
  const email = process.argv[3] || 'admin@example.com';
  const password = process.argv[4] || 'admin123';
  
  if (!username || !password) {
    console.error('Error: Username and password are required.');
    console.log('Usage: node create-admin-user.js [username] [email] [password]');
    process.exit(1);
  }
  
  createAdminUser(username, email, password);
}

module.exports = { createAdminUser };