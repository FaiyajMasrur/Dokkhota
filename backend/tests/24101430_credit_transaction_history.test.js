/**
 * CSE 470: Software Quality Assurance - Backend Unit Testing Integration
 * Student ID: 24101430
 * Feature: Credit Transaction History & Balance Management
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

describe('Feature: Credit Transaction History & Balance Management (Student ID: 24101430)', () => {
  let authToken = '';
  const testUser = {
    name: 'Unit Test User',
    email: `unittest_${Date.now()}@example.com`,
    password: 'TestPassword123!',
  };

  // PRE-CONDITION: Dynamic Authentication Handling (No Hardcoded Tokens)
  beforeAll(async () => {
    // Ensure DB connection is ready
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dokkhota');
    }

    // Programmatically register/login test user to generate a fresh JWT session token
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    if (res.body && res.body.accessToken) {
      authToken = res.body.accessToken;
    } else {
      // Fallback login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });
      authToken = loginRes.body.accessToken;
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // ==========================================
  // CASE A: Positive Flow (Happy Path)
  // ==========================================

  describe('Case A: Positive Flow (Happy Path)', () => {
    test('Test 1: Retrieve User Credit Balance (GET /api/credits/balance)', async () => {
      const res = await request(app)
        .get('/api/credits/balance')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('creditBalance');
      expect(res.body).toHaveProperty('heldCredits');
      expect(res.body).toHaveProperty('availableBalance');
      expect(typeof res.body.creditBalance).toBe('number');
    });

    test('Test 2: Retrieve Credit Transaction History Log (GET /api/credits/transactions)', async () => {
      const res = await request(app)
        .get('/api/credits/transactions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('transactions');
      expect(Array.isArray(res.body.transactions)).toBe(true);
    });
  });

  // ==========================================
  // CASE B: Negative Flow (Error Handling)
  // ==========================================

  describe('Case B: Negative Flow (Error Handling)', () => {
    test('Test 3: Validation Error on Invalid Payload (POST /api/bookings)', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required listingId field
          preferredDate: '2026-09-01',
          preferredTime: '10:00 AM',
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toMatch(/required/i);
    });

    test('Test 4: Resource Not Found (GET /api/credits/non-existent-endpoint)', async () => {
      const res = await request(app)
        .get('/api/credits/non-existent-endpoint-999999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(404);
    });
  });

  // ==========================================
  // CASE C: Security & Boundary
  // ==========================================

  describe('Case C: Security & Boundary', () => {
    test('Test 5: Unauthorized Access without Token (GET /api/credits/balance)', async () => {
      const res = await request(app).get('/api/credits/balance');

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toMatch(/token/i);
    });
  });
});
