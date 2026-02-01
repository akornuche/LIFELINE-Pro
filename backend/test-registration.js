import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testRegistration() {
  console.log('=== Testing Registration ===\n');

  // Test data that matches the registerSchema requirements
  const testPatient = {
    userType: 'patient',
    email: 'test.patient' + Date.now() + '@example.com',  // Make email unique
    password: 'Patient@123',
    confirmPassword: 'Patient@123',
    firstName: 'Test',
    lastName: 'Patient',
    phone: '08012345678',  // Changed to +234 format
    dateOfBirth: '1990-01-01',
    gender: 'male',
    address: '123 Test Street, Lagos, Nigeria',
    packageType: 'basic',
    emergencyContact: {
      name: 'Emergency Contact',
      phone: '08087654321',  // Changed to +234 format
      relationship: 'Family'
    }
  };

  try {
    console.log('Attempting to register test patient...');
    console.log('Request data:', JSON.stringify(testPatient, null, 2));

    const response = await axios.post(`${API_URL}/auth/register`, testPatient);
    console.log('✓ Registration successful!');
    console.log('Response:', response.data);

  } catch (error) {
    console.error('✗ Registration failed!');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data || error.message);

    if (error.response?.data?.errors) {
      console.error('Validation errors:');
      error.response.data.errors.forEach(err => {
        console.error(`  - ${err.field}: ${err.message}`);
      });
    }
  }
}

testRegistration();