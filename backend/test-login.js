import axios from 'axios';

async function testLogin() {
  try {
    console.log('Testing login...');
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'patient.basic@test.com',
      password: 'Patient@123'
    });

    console.log('Login successful!');
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Login failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testLogin();