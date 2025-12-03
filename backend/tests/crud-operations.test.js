import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
let adminToken = '';
let patientToken = '';
let doctorToken = '';
let createdPatientId = '';
let createdDoctorId = '';

// ANSI color codes for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bold');
  console.log('='.repeat(60) + '\n');
}

// Test Authentication
async function testAuthentication() {
  logSection('1. TESTING AUTHENTICATION');

  try {
    // Admin login
    logInfo('Logging in as Admin...');
    const adminRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@lifelinepro.com',
      password: 'Admin@123!'
    });
    adminToken = adminRes.data.token;
    logSuccess('Admin login successful');
    logInfo(`Token: ${adminToken.substring(0, 20)}...`);

    // Patient login
    logInfo('Logging in as Patient...');
    const patientRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'patient.basic@test.com',
      password: 'Patient@123'
    });
    patientToken = patientRes.data.token;
    logSuccess('Patient login successful');

    // Doctor login
    logInfo('Logging in as Doctor...');
    const doctorRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'doctor.gp@test.com',
      password: 'Doctor@123'
    });
    doctorToken = doctorRes.data.token;
    logSuccess('Doctor login successful');

    return true;
  } catch (error) {
    logError(`Authentication failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test READ operations
async function testReadOperations() {
  logSection('2. TESTING READ OPERATIONS');

  try {
    // Get all patients
    logInfo('Fetching all patients...');
    const patientsRes = await axios.get(`${API_URL}/patients`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logSuccess(`Retrieved ${patientsRes.data.patients?.length || patientsRes.data.length || 0} patients`);

    // Get all doctors
    logInfo('Fetching all doctors...');
    const doctorsRes = await axios.get(`${API_URL}/doctors`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logSuccess(`Retrieved ${doctorsRes.data.doctors?.length || doctorsRes.data.length || 0} doctors`);

    // Get all pharmacies
    logInfo('Fetching all pharmacies...');
    const pharmaciesRes = await axios.get(`${API_URL}/pharmacies`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logSuccess(`Retrieved ${pharmaciesRes.data.pharmacies?.length || pharmaciesRes.data.length || 0} pharmacies`);

    // Get all hospitals
    logInfo('Fetching all hospitals...');
    const hospitalsRes = await axios.get(`${API_URL}/hospitals`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logSuccess(`Retrieved ${hospitalsRes.data.hospitals?.length || hospitalsRes.data.length || 0} hospitals`);

    return true;
  } catch (error) {
    logError(`Read operations failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test CREATE operations
async function testCreateOperations() {
  logSection('3. TESTING CREATE OPERATIONS');

  try {
    // Create a new patient
    logInfo('Creating a new patient...');
    const newPatient = {
      email: `test.patient.${Date.now()}@test.com`,
      password: 'TestPatient@123',
      phone: '+2348111111111',
      firstName: 'Test',
      lastName: 'Patient',
      dateOfBirth: '1995-05-15',
      gender: 'male',
      packageType: 'BASIC',
      address: '123 Test Street',
      city: 'Lagos',
      state: 'Lagos'
    };

    const createPatientRes = await axios.post(`${API_URL}/patients`, newPatient, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    createdPatientId = createPatientRes.data.patient?.id || createPatientRes.data.id;
    logSuccess(`Patient created with ID: ${createdPatientId}`);

    // Create a new doctor
    logInfo('Creating a new doctor...');
    const newDoctor = {
      email: `test.doctor.${Date.now()}@test.com`,
      password: 'TestDoctor@123',
      phone: '+2348222222222',
      firstName: 'Dr. Test',
      lastName: 'Doctor',
      licenseNumber: `LIC-${Date.now()}`,
      specialty: 'General Practice',
      qualifications: 'MBBS',
      city: 'Lagos',
      state: 'Lagos',
      consultationFee: 5000
    };

    const createDoctorRes = await axios.post(`${API_URL}/doctors`, newDoctor, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    createdDoctorId = createDoctorRes.data.doctor?.id || createDoctorRes.data.id;
    logSuccess(`Doctor created with ID: ${createdDoctorId}`);

    return true;
  } catch (error) {
    logError(`Create operations failed: ${error.response?.data?.message || error.message}`);
    console.error('Full error:', error.response?.data);
    return false;
  }
}

// Test UPDATE operations
async function testUpdateOperations() {
  logSection('4. TESTING UPDATE OPERATIONS');

  try {
    if (!createdPatientId) {
      logError('No patient ID available for update test');
      return false;
    }

    // Update patient
    logInfo(`Updating patient ${createdPatientId}...`);
    const updateData = {
      firstName: 'Updated',
      lastName: 'TestPatient',
      phone: '+2348333333333'
    };

    await axios.patch(`${API_URL}/patients/${createdPatientId}`, updateData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logSuccess('Patient updated successfully');

    // Verify update
    logInfo('Verifying patient update...');
    const verifyRes = await axios.get(`${API_URL}/patients/${createdPatientId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const patient = verifyRes.data.patient || verifyRes.data;
    if (patient.firstName === 'Updated') {
      logSuccess('Update verified successfully');
    } else {
      logError('Update verification failed');
    }

    return true;
  } catch (error) {
    logError(`Update operations failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test DELETE operations
async function testDeleteOperations() {
  logSection('5. TESTING DELETE OPERATIONS');

  try {
    if (!createdPatientId) {
      logError('No patient ID available for delete test');
      return false;
    }

    // Delete patient
    logInfo(`Deleting patient ${createdPatientId}...`);
    await axios.delete(`${API_URL}/patients/${createdPatientId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logSuccess('Patient deleted successfully');

    // Verify deletion
    logInfo('Verifying patient deletion...');
    try {
      await axios.get(`${API_URL}/patients/${createdPatientId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      logError('Deletion verification failed - patient still exists');
      return false;
    } catch (error) {
      if (error.response?.status === 404) {
        logSuccess('Deletion verified - patient not found (as expected)');
        return true;
      }
      throw error;
    }
  } catch (error) {
    logError(`Delete operations failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test Authorization
async function testAuthorization() {
  logSection('6. TESTING AUTHORIZATION & RBAC');

  try {
    // Patient trying to access admin endpoint
    logInfo('Testing patient access to admin endpoint (should fail)...');
    try {
      await axios.get(`${API_URL}/patients`, {
        headers: { Authorization: `Bearer ${patientToken}` }
      });
      logError('Authorization test failed - patient accessed admin endpoint');
      return false;
    } catch (error) {
      if (error.response?.status === 403 || error.response?.status === 401) {
        logSuccess('Patient correctly denied access to admin endpoint');
      } else {
        throw error;
      }
    }

    // Test without token
    logInfo('Testing access without authentication token (should fail)...');
    try {
      await axios.get(`${API_URL}/patients`);
      logError('Authorization test failed - accessed endpoint without token');
      return false;
    } catch (error) {
      if (error.response?.status === 401) {
        logSuccess('Correctly denied access without authentication');
      } else {
        throw error;
      }
    }

    return true;
  } catch (error) {
    logError(`Authorization test failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test Validation
async function testValidation() {
  logSection('7. TESTING INPUT VALIDATION');

  try {
    // Test invalid email
    logInfo('Testing invalid email format...');
    try {
      await axios.post(`${API_URL}/patients`, {
        email: 'invalid-email',
        password: 'Test@123',
        firstName: 'Test',
        lastName: 'User'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      logError('Validation test failed - accepted invalid email');
      return false;
    } catch (error) {
      if (error.response?.status === 400) {
        logSuccess('Invalid email correctly rejected');
      } else {
        throw error;
      }
    }

    // Test missing required field
    logInfo('Testing missing required fields...');
    try {
      await axios.post(`${API_URL}/patients`, {
        email: 'test@test.com'
        // Missing required fields
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      logError('Validation test failed - accepted incomplete data');
      return false;
    } catch (error) {
      if (error.response?.status === 400) {
        logSuccess('Missing required fields correctly rejected');
      } else {
        throw error;
      }
    }

    return true;
  } catch (error) {
    logError(`Validation test failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.clear();
  log('\n🧪 LIFELINE PRO - COMPREHENSIVE CRUD TEST SUITE 🧪\n', 'bold');
  log(`Testing API at: ${API_URL}`, 'blue');
  log(`Start Time: ${new Date().toLocaleString()}\n`, 'blue');

  const results = {
    passed: 0,
    failed: 0,
    total: 7
  };

  const tests = [
    { name: 'Authentication', fn: testAuthentication },
    { name: 'Read Operations', fn: testReadOperations },
    { name: 'Create Operations', fn: testCreateOperations },
    { name: 'Update Operations', fn: testUpdateOperations },
    { name: 'Delete Operations', fn: testDeleteOperations },
    { name: 'Authorization & RBAC', fn: testAuthorization },
    { name: 'Input Validation', fn: testValidation }
  ];

  for (const test of tests) {
    const passed = await test.fn();
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
    await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause between tests
  }

  // Final summary
  logSection('TEST SUMMARY');
  log(`Total Tests: ${results.total}`, 'blue');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`, 
      results.failed > 0 ? 'yellow' : 'green');
  log(`\nEnd Time: ${new Date().toLocaleString()}`, 'blue');

  if (results.failed === 0) {
    log('\n🎉 ALL TESTS PASSED! 🎉\n', 'green');
  } else {
    log('\n⚠️  SOME TESTS FAILED - CHECK LOGS ABOVE ⚠️\n', 'red');
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  logError(`\nFatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
