import bcrypt from 'bcrypt';

async function testBcrypt() {
  try {
    // Test password hash generation
    console.log('==== Testing Bcrypt Password Hashing ====');
    const password = 'admin123';
    
    console.log('Generating new hash for password:', password);
    const newHash = await bcrypt.hash(password, 10);
    console.log('Generated hash:', newHash);
    
    // Test password hash verification
    console.log('\n==== Testing Bcrypt Password Verification ====');
    // This should work with the known hash we have
    const knownHash = '$2b$10$QOG9o8Ztt30ZdEJaHhQ7g.xGV2ywc6zRZ8VfSRwWRdLe/Y8r9bX82';
    console.log('Known hash:', knownHash);
    
    const isValid = await bcrypt.compare(password, knownHash);
    console.log('Password valid with known hash:', isValid);
    
    // Test verification with the newly generated hash
    const isNewValid = await bcrypt.compare(password, newHash);
    console.log('Password valid with newly generated hash:', isNewValid);
    
    // Test invalid password
    const isInvalidValid = await bcrypt.compare('wrongpassword', knownHash);
    console.log('Invalid password check:', isInvalidValid);
  } catch (error) {
    console.error('Error in bcrypt test:', error);
  }
}

testBcrypt();