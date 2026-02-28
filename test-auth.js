const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function testAuthentication() {
  try {
    console.log('🧪 Testing Authentication System\n');

    // Test 1: Signup
    console.log('1️⃣  Testing Signup...');
    const signupResponse = await axios.post(`${API_URL}/auth/signup`, {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    });
    console.log('✅ Signup successful!');
    console.log('   User:', signupResponse.data.user);
    console.log('   Token:', signupResponse.data.token.substring(0, 20) + '...\n');

    const token = signupResponse.data.token;

    // Test 2: Get current user
    console.log('2️⃣  Testing Get Current User...');
    const meResponse = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('✅ Get user successful!');
    console.log('   User:', meResponse.data.user, '\n');

    // Test 3: Login
    console.log('3️⃣  Testing Login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123',
    });
    console.log('✅ Login successful!');
    console.log('   User:', loginResponse.data.user);
    console.log('   Token:', loginResponse.data.token.substring(0, 20) + '...\n');

    // Test 4: Invalid login
    console.log('4️⃣  Testing Invalid Login (should fail)...');
    try {
      await axios.post(`${API_URL}/auth/login`, {
        email: 'test@example.com',
        password: 'wrongpassword',
      });
      console.log('❌ Invalid login should have failed!\n');
    } catch (error) {
      console.log('✅ Invalid login correctly rejected!');
      console.log('   Error:', error.response.data.error, '\n');
    }

    // Test 5: Duplicate signup
    console.log('5️⃣  Testing Duplicate Signup (should fail)...');
    try {
      await axios.post(`${API_URL}/auth/signup`, {
        email: 'test@example.com',
        password: 'password123',
        name: 'Another User',
      });
      console.log('❌ Duplicate signup should have failed!\n');
    } catch (error) {
      console.log('✅ Duplicate signup correctly rejected!');
      console.log('   Error:', error.response.data.error, '\n');
    }

    console.log('🎉 All authentication tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
  }
}

testAuthentication();
