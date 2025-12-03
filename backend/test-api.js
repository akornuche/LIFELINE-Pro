import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testAPI() {
  console.log('=== Testing LifeLine Pro API ===\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Endpoint...');
    try {
      const healthRes = await axios.get('http://localhost:5000/health');
      console.log('✓ Health check passed');
      console.log('Response:', healthRes.data);
    } catch (error) {
      console.error('✗ Health check failed:', error.message);
    }

    // Test 2: Admin Login
    console.log('\n2. Testing Admin Login...');
    try {
      const loginRes = await axios.post(`${API_URL}/auth/login`, {
        email: 'admin@lifelinepro.com',
        password: 'Admin@123!'
      });
      console.log('✓ Admin login successful');
      console.log('Token received:', loginRes.data.token ? 'Yes' : 'No');
      
      const adminToken = loginRes.data.token;

      // Test 3: Get Patients (authenticated)
      console.log('\n3. Testing Get Patients Endpoint (authenticated)...');
      try {
        const patientsRes = await axios.get(`${API_URL}/patients`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✓ Patients endpoint accessible');
        console.log('Patient count:', patientsRes.data.length || 0);
      } catch (error) {
        console.error('✗ Patients endpoint failed:', error.response?.data || error.message);
      }

      // Test 4: Get Doctors
      console.log('\n4. Testing Get Doctors Endpoint (authenticated)...');
      try {
        const doctorsRes = await axios.get(`${API_URL}/doctors`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✓ Doctors endpoint accessible');
        console.log('Doctor count:', doctorsRes.data.length || 0);
      } catch (error) {
        console.error('✗ Doctors endpoint failed:', error.response?.data || error.message);
      }
      
    } catch (error) {
      console.error('✗ Admin login failed:', error.response?.data || error.message);
    }

    // Test 5: Patient Login
    console.log('\n5. Testing Patient Login (Basic Plan)...');
    try {
      const patientLoginRes = await axios.post(`${API_URL}/auth/login`, {
        email: 'patient.basic@test.com',
        password: 'Patient@123'
      });
      console.log('✓ Patient login successful');
      console.log('Token received:', patientLoginRes.data.token ? 'Yes' : 'No');
    } catch (error) {
      console.error('✗ Patient login failed:', error.response?.data || error.message);
    }

    // Test 6: Doctor Login
    console.log('\n6. Testing Doctor Login (GP)...');
    try {
      const doctorLoginRes = await axios.post(`${API_URL}/auth/login`, {
        email: 'doctor.gp@test.com',
        password: 'Doctor@123'
      });
      console.log('✓ Doctor login successful');
      console.log('Token received:', doctorLoginRes.data.token ? 'Yes' : 'No');
    } catch (error) {
      console.error('✗ Doctor login failed:', error.response?.data || error.message);
    }

    // Test 7: Pharmacy Login
    console.log('\n7. Testing Pharmacy Login...');
    try {
      const pharmacyLoginRes = await axios.post(`${API_URL}/auth/login`, {
        email: 'pharmacy.central@test.com',
        password: 'Pharmacy@123'
      });
      console.log('✓ Pharmacy login successful');
      console.log('Token received:', pharmacyLoginRes.data.token ? 'Yes' : 'No');
    } catch (error) {
      console.error('✗ Pharmacy login failed:', error.response?.data || error.message);
    }

    // Test 8: Hospital Login
    console.log('\n8. Testing Hospital Login...');
    try {
      const hospitalLoginRes = await axios.post(`${API_URL}/auth/login`, {
        email: 'hospital.general@test.com',
        password: 'Hospital@123'
      });
      console.log('✓ Hospital login successful');
      console.log('Token received:', hospitalLoginRes.data.token ? 'Yes' : 'No');
    } catch (error) {
      console.error('✗ Hospital login failed:', error.response?.data || error.message);
    }

    // Test 9: Invalid Login
    console.log('\n9. Testing Invalid Login (should fail)...');
    try {
      await axios.post(`${API_URL}/auth/login`, {
        email: 'invalid@test.com',
        password: 'wrongpassword'
      });
      console.error('✗ Invalid login should have failed');
    } catch (error) {
      console.log('✓ Invalid login correctly rejected');
      console.log('Error message:', error.response?.data?.message || error.message);
    }

    console.log('\n=== API Testing Complete ===');
    
  } catch (error) {
    console.error('Test suite failed:', error.message);
  }
}

testAPI();
