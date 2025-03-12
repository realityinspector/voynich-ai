#!/usr/bin/env node

// Script to set a specific user as admin
const { db } = require('../server/db');
const { users, eq } = require('../shared/schema');

/**
 * Set a user as admin by username
 * @param {string} username - Username of the user to promote to admin
 */
async function setUserAsAdmin(username) {
  try {
    console.log(`Attempting to set user "${username}" as admin...`);
    
    // Update user role to admin
    const result = await db
      .update(users)
      .set({ role: 'admin' })
      .where(eq(users.username, username))
      .returning();
    
    if (result.length === 0) {
      console.error(`Error: User "${username}" not found.`);
      console.log('Make sure the user account exists before running this script.');
      return;
    }
    
    console.log(`Success! User "${username}" has been granted admin privileges.`);
    console.log('Admin privileges include:');
    console.log('- Access to all platform features');
    console.log('- Ability to upload manuscript pages');
    console.log('- Ability to extract symbols from manuscript pages');
    console.log('- Access to admin settings and configurations');
  } catch (error) {
    console.error('Error setting user as admin:', error);
  } finally {
    process.exit(0);
  }
}

// If called directly from command line
if (require.main === module) {
  const username = process.argv[2] || 'realityinspector';
  
  if (!username) {
    console.error('Error: Username is required.');
    console.log('Usage: node set-admin.js [username]');
    process.exit(1);
  }
  
  setUserAsAdmin(username);
}

module.exports = { setUserAsAdmin };