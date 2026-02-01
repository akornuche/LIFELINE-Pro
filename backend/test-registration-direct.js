import database from './src/database/connection.js';
import * as authService from './src/services/authService.js';

async function testRegistration() {
  console.log('=== Testing Registration (Direct Service Call) ===\n');

  try {
    // Connect to database first
    console.log('Connecting to database...');
    await database.connect();
    console.log('Database connected!\n');

    // Test data that matches the registerSchema requirements
    const testPatient = {
      userType: 'patient',
      email: 'test.patient' + Date.now() + '@example.com',  // Make email unique
      password: 'Patient@123',
      confirmPassword: 'Patient@123',
      firstName: 'Test',
      lastName: 'Patient',
      phone: '+2348012345678',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      address: '123 Test Street, Lagos, Nigeria',
      packageType: 'basic',
      emergencyContact: {
        name: 'Emergency Contact',
        phone: '+2348087654321',
        relationship: 'Family'
      }
    };

    console.log('Testing direct service call...');
    const result = await authService.register(testPatient);
    console.log('✓ Registration successful!');
    console.log('Result:', result);

    await database.disconnect();

  } catch (error) {
    console.error('✗ Registration failed!');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testRegistration();