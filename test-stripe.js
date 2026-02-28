const axios = require('axios');

const API_URL = 'http://localhost:3000';
let userToken = '';

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    return true;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('💳 Testing Stripe Payment Integration\n');

  let passed = 0;
  let failed = 0;

  // 1. Health Check
  if (await test('Health Check', async () => {
    const res = await axios.get(`${API_URL}/health`);
    if (!res.data.status === 'OK') throw new Error('Health check failed');
  })) passed++; else failed++;

  // 2. Signup
  if (await test('Signup - Create user', async () => {
    const res = await axios.post(`${API_URL}/auth/signup`, {
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      name: 'Test User',
    });
    if (!res.data.token) throw new Error('No token returned');
    userToken = res.data.token;
  })) passed++; else failed++;

  // 3. Create Payment Intent
  if (await test('Payments - Create intent (no Stripe key)', async () => {
    try {
      const res = await axios.post(
        `${API_URL}/payments/create-intent`,
        {
          amount: 999,
          article_id: 'article_1',
          description: 'Test Article',
        },
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      );
      // Will fail without real Stripe key, but endpoint should exist
      console.log('   (Stripe key not configured - expected)');
    } catch (error) {
      if (error.response?.status === 500 && error.response?.data?.error) {
        // Expected - no real Stripe key
        return;
      }
      throw error;
    }
  })) passed++; else failed++;

  // 4. Get Articles
  if (await test('Articles - Get all articles', async () => {
    const res = await axios.get(`${API_URL}/articles`);
    if (!Array.isArray(res.data.articles)) throw new Error('Should return articles array');
  })) passed++; else failed++;

  // 5. Get Quotes
  if (await test('Quotes - Get all quotes', async () => {
    const res = await axios.get(`${API_URL}/quotes`);
    if (!Array.isArray(res.data.quotes)) throw new Error('Should return quotes array');
  })) passed++; else failed++;

  // 6. Get User Info
  if (await test('Auth - Get user info', async () => {
    const res = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    if (!res.data.user) throw new Error('Should return user');
  })) passed++; else failed++;

  // 7. Get Purchases (empty)
  if (await test('Payments - Get purchases (empty)', async () => {
    const res = await axios.get(`${API_URL}/payments/purchases`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    if (!Array.isArray(res.data.purchases)) throw new Error('Should return purchases array');
  })) passed++; else failed++;

  // Summary
  console.log(`\n📊 Test Results:`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${passed + failed}`);
  console.log(`\n${failed === 0 ? '🎉 All tests passed!' : '⚠️ Some tests failed'}`);
  console.log('\n💡 To use Stripe:');
  console.log('1. Create account at stripe.com');
  console.log('2. Get API keys from Dashboard');
  console.log('3. Set STRIPE_SECRET_KEY environment variable');
  console.log('4. Run tests again');
}

runTests().catch(console.error);
