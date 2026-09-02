/**
 * CSE 470: Software Quality Assurance - Backend Unit Testing Integration
 * Course: CSE 470
 * Student ID: 24101430 (Individual Assignment)
 * Feature Tested: Booking Requests & Session Management (Full CRUD)
 * Deadline: 08 September, 2026 (11:59 PM)
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const SkillListing = require('../models/SkillListing');
const Booking = require('../models/Booking');

describe('Feature: Booking Requests & Session Management (Student ID: 24101430)', () => {
  let authToken = '';
  let testUserId = '';
  let teacherToken = '';
  let teacherId = '';
  let createdListingId = '';
  let createdBookingId = '';

  // PRE-CONDITION: Dynamic Authentication & Resource Setup (No Hardcoded Tokens)
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dokkhota');
    }

    // 1. Create Learner Account
    const learnerEmail = `learner_24101430_${Date.now()}@example.com`;
    const learnerRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Learner Student',
        email: learnerEmail,
        password: 'Password123!',
      });

    authToken = learnerRes.body.accessToken;
    testUserId = learnerRes.body.user?._id || learnerRes.body.user?.id;

    // 2. Create Teacher Account & Listing
    const teacherEmail = `teacher_24101430_${Date.now()}@example.com`;
    const teacherRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Teacher Mentor',
        email: teacherEmail,
        password: 'Password123!',
      });

    teacherToken = teacherRes.body.accessToken;
    teacherId = teacherRes.body.user?._id || teacherRes.body.user?.id;

    // Create Skill Listing for teacher
    const listingRes = await request(app)
      .post('/api/skills')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        title: `MERN Architecture Unit Testing ${Date.now()}`,
        category: 'Programming',
        description: 'Comprehensive software engineering and unit testing session.',
        proficiencyLevel: 'intermediate',
        format: 'online',
        durationMinutes: 60,
        creditCost: 10,
      });

    createdListingId = listingRes.body.listing?._id || listingRes.body.listing?.id;
  });

  afterAll(async () => {
    // Clean up created resources
    if (createdBookingId) {
      await Booking.findByIdAndDelete(createdBookingId);
    }
    if (createdListingId) {
      await SkillListing.findByIdAndDelete(createdListingId);
    }
    await mongoose.connection.close();
  });

  // ==========================================
  // CASE A: Positive Flow (Happy Path - CRUD)
  // ==========================================

  describe('Case A: Positive Flow (Happy Path - Full CRUD Operations)', () => {
    test('Test 1: CREATE Booking Request (POST /api/bookings)', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          listingId: createdListingId,
          preferredDate: '2026-09-05',
          preferredTime: '10:00 AM',
          message: 'I would like to book a session on unit testing.',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('booking');
      expect(res.body.booking).toHaveProperty('_id');
      expect(res.body.booking.status).toEqual('pending');

      createdBookingId = res.body.booking._id;
    });

    test('Test 2: READ Booking Requests List (GET /api/bookings)', async () => {
      const res = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('bookings');
      expect(Array.isArray(res.body.bookings)).toBe(true);

      const found = res.body.bookings.some((b) => b._id.toString() === createdBookingId.toString());
      expect(found).toBe(true);
    });

    test('Test 3: UPDATE Booking Status to Accepted (PATCH /api/bookings/:id)', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${createdBookingId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ status: 'accepted' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.booking.status).toEqual('accepted');
    });
  });

  // ==========================================
  // CASE B: Negative Flow (Error Handling)
  // ==========================================

  describe('Case B: Negative Flow (Error Handling)', () => {
    test('Test 4: Validation Error on Missing Required Payload (POST /api/bookings)', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing listingId
          preferredDate: '2026-09-05',
          preferredTime: '10:00 AM',
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toMatch(/required/i);
    });

    test('Test 5: Resource Not Found for Invalid Booking ID (PATCH /api/bookings/:id)', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .patch(`/api/bookings/${fakeId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ status: 'accepted' });

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toMatch(/not found/i);
    });
  });

  // ==========================================
  // CASE C: Security & Boundary
  // ==========================================

  describe('Case C: Security & Boundary', () => {
    test('Test 6: Unauthorized Access without Authorization Header (GET /api/bookings)', async () => {
      const res = await request(app).get('/api/bookings');

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toMatch(/token/i);
    });
  });
});
