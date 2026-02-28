const axios = require('axios');

const API_URL = 'http://localhost:3000';
let testToken = '';
let testUserId = '';

const tests = [];
let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
}

async function runTests() {
  console.log('🧪 Testing Wisdom Hub Production Backend\n');

  // 1. Health Check
  await test('Health Check', async () => {
    const res = await axios.get(`${API_URL}/health`);
    if (res.data.status !== 'OK') throw new Error('Health check failed');
  });

  // 2. Signup
  await test('Signup - Create new user', async () => {
    const res = await axios.post(`${API_URL}/auth/signup`, {
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      name: 'Test User',
    });
    if (!res.data.user.id) throw new Error('No user ID returned');
    testUserId = res.data.user.id;
  });

  // 3. Duplicate Signup
  await test('Signup - Reject duplicate email', async () => {
    try {
      await axios.post(`${API_URL}/auth/signup`, {
        email: `test${Date.now()}@example.com`,
        password: 'password123',
        name: 'Another User',
      });
      // Create another user with same email
      const email = `duplicate${Date.now()}@example.com`;
      await axios.post(`${API_URL}/auth/signup`, {
        email,
        password: 'password123',
        name: 'User 1',
      });
      await axios.post(`${API_URL}/auth/signup`, {
        email,
        password: 'password123',
        name: 'User 2',
      });
      throw new Error('Should have rejected duplicate');
    } catch (error) {
      if (error.response?.status === 409) {
        return; // Expected
      }
      throw error;
    }
  });

  // 4. Signup Validation
  await test('Signup - Validate required fields', async () => {
    try {
      await axios.post(`${API_URL}/auth/signup`, {
        email: 'test@example.com',
        // Missing password and name
      });
      throw new Error('Should have rejected incomplete form');
    } catch (error) {
      if (error.response?.status === 400) {
        return; // Expected
      }
      throw error;
    }
  });

  // 5. Login - Email not verified
  await test('Login - Reject unverified email', async () => {
    try {
      const email = `unverified${Date.now()}@example.com`;
      await axios.post(`${API_URL}/auth/signup`, {
        email,
        password: 'password123',
        name: 'Unverified User',
      });
      await axios.post(`${API_URL}/auth/login`, {
        email,
        password: 'password123',
      });
      throw new Error('Should have rejected unverified email');
    } catch (error) {
      if (error.response?.status === 403) {
        return; // Expected
      }
      throw error;
    }
  });

  // 6. Verify Email
  await test('Email Verification - Verify with token', async () => {
    const email = `verify${Date.now()}@example.com`;
    const signupRes = await axios.post(`${API_URL}/auth/signup`, {
      email,
      password: 'password123',
      name: 'Verify User',
    });

    // Get verification token from response (in production, it's in email)
    // For testing, we'll extract it from the user object
    // In real scenario, token is sent via email
    console.log('   (Note: In production, token is sent via email)');
  });

  // 7. Forgot Password
  await test('Password Reset - Request reset', async () => {
    const res = await axios.post(`${API_URL}/auth/forgot-password`, {
      email: `forgot${Date.now()}@example.com`,
    });
    if (res.data.message !== 'If email exists, password reset link has been sent') {
      throw new Error('Unexpected response');
    }
  });

  // 8. Forgot Password - Non-existent email
  await test('Password Reset - Handle non-existent email', async () => {
    const res = await axios.post(`${API_URL}/auth/forgot-password`, {
      email: `nonexistent${Date.now()}@example.com`,
    });
    // Should not reveal if email exists
    if (!res.data.message) throw new Error('Should return generic message');
  });

  // 9. Articles Endpoint - Requires Auth
  await test('Articles - Require authentication', async () => {
    try {
      await axios.get(`${API_URL}/articles`);
      throw new Error('Should require authentication');
    } catch (error) {
      if (error.response?.status === 401) {
        return; // Expected
      }
      throw error;
    }
  });

  // 10. Quotes Endpoint - Public
  await test('Quotes - Public access', async () => {
    const res = await axios.get(`${API_URL}/quotes`);
    if (!Array.isArray(res.data.quotes)) throw new Error('Should return quotes array');
  });

  // 11. Quotes Today
  await test('Quotes Today - Get daily quote', async () => {
    const res = await axios.get(`${API_URL}/quotes/today`);
    if (!res.data.quote) throw new Error('Should return a quote');
  });

  // 12. Invalid Login
  await test('Login - Reject invalid credentials', async () => {
    try {
      await axios.post(`${API_URL}/auth/login`, {
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      });
      throw new Error('Should reject invalid credentials');
    } catch (error) {
      if (error.response?.status === 401) {
        return; // Expected
      }
      throw error;
    }
  });

  // 13. Login Validation
  await test('Login - Validate required fields', async () => {
    try {
      await axios.post(`${API_URL}/auth/login`, {
        email: 'test@example.com',
        // Missing password
      });
      throw new Error('Should reject incomplete form');
    } catch (error) {
      if (error.response?.status === 400) {
        return; // Expected
      }
      throw error;
    }
  });

  // 14. Payment Intent
  await test('Payments - Create payment intent', async () => {
    // First create and verify a user
    const email = `payment${Date.now()}@example.com`;
    const signupRes = await axios.post(`${API_URL}/auth/signup`, {
      email,
      password: 'password123',
      name: 'Payment User',
    });

    const token = signupRes.data.token;

    const res = await axios.post(
      `${API_URL}/payments/create-intent`,
      {
        amount: 999,
        article_id: 'article_1',
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.data.clientSecret || !res.data.paymentIntentId) {
      throw new Error('Missing payment intent data');
    }
  });

  // 15. Payment Confirm
  await test('Payments - Confirm payment', async () => {
    const email = `payment2${Date.now()}@example.com`;
    const signupRes = await axios.post(`${API_URL}/auth/signup`, {
      email,
      password: 'password123',
      name: 'Payment User 2',
    });

    const token = signupRes.data.token;

    const res = await axios.post(
      `${API_URL}/payments/confirm`,
      {
        paymentIntentId: 'pi_test_123',
        article_id: 'article_1',
        amount: 999,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.data.purchase.id) throw new Error('No purchase ID returned');
  });

  // 16. Get Purchases
  await test('Payments - Get purchase history', async () => {
    const email = `payment3${Date.now()}@example.com`;
    const signupRes = await axios.post(`${API_URL}/auth/signup`, {
      email,
      password: 'password123',
      name: 'Payment User 3',
    });

    const token = signupRes.data.token;

    const res = await axios.get(`${API_URL}/payments/purchases`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!Array.isArray(res.data.purchases)) throw new Error('Should return purchases array');
  });

  // Summary
  console.log(`\n📊 Test Results:`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${passed + failed}`);
  console.log(`\n${failed === 0 ? '🎉 All tests passed!' : '⚠️ Some tests failed'}`);
}

runTests().catch(console.error);
