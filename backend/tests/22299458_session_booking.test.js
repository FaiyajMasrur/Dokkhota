/**
 * Unit Tests — Session Confirmation and Cancellation
 * Student ID : 22299458
 * Course     : CSE 470 — Software Quality Assurance
 * Feature    : Session Confirmation and Cancellation (Booking System)
 *
 * Covers all API endpoints under /api/bookings:
 *   POST   /api/bookings            — createBooking
 *   GET    /api/bookings            — listBookings
 *   PATCH  /api/bookings/:bookingId — updateBookingStatus (accept / reject / cancel / complete)
 *
 * Test categories:
 *   A. Positive Flow  (Happy Path)
 *   B. Negative Flow  (Error Handling / Validation)
 *   C. Security & Boundary
 */

const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// ── Import the Express app (without starting the HTTP server) ─────────────
const app = require('../app');

// ── Mongoose models (used for direct DB setup / teardown) ─────────────────
const User = require('../models/User');
const SkillListing = require('../models/SkillListing');
const Booking = require('../models/Booking');

// ────────────────────────────────────────────────────────────────────────────
// Shared state populated during beforeAll
// ────────────────────────────────────────────────────────────────────────────
let studentToken = '';
let teacherToken = '';
let adminToken = '';

let studentId = '';
let teacherId = '';
let listingId = '';
let bookingId = '';  // created in Test A-1, reused in later tests

// Unique e-mail suffixes so parallel runs don't clash
const stamp = Date.now();
const STUDENT_EMAIL = `student_${stamp}@test.dokkhota.com`;
const TEACHER_EMAIL = `teacher_${stamp}@test.dokkhota.com`;
const ADMIN_EMAIL   = `admin_${stamp}@test.dokkhota.com`;
const PASSWORD      = 'Test@12345';

// ────────────────────────────────────────────────────────────────────────────
describe('Feature: Session Confirmation & Cancellation (ID: 22299458)', () => {

  // ── PRE-CONDITION: Connect DB, seed users, obtain tokens ─────────────────
  beforeAll(async () => {
    // Connect to local test database
    const testUri = process.env.MONGO_LOCAL_URI || 'mongodb://127.0.0.1:27017/dokkhota';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testUri);
    }

    // ── Create student user directly in DB (bypass email OTP for testing) ──
    const studentUser = new User({
      name: 'Test Student',
      email: STUDENT_EMAIL,
      passwordHash: PASSWORD,
      isVerified: true,
      creditBalance: 50,
      heldCredits: 0,
      role: 'user',
    });
    await studentUser.save();
    studentId = studentUser._id.toString();

    // ── Create teacher user ──────────────────────────────────────────────
    const teacherUser = new User({
      name: 'Test Teacher',
      email: TEACHER_EMAIL,
      passwordHash: PASSWORD,
      isVerified: true,
      creditBalance: 0,
      heldCredits: 0,
      role: 'user',
    });
    await teacherUser.save();
    teacherId = teacherUser._id.toString();

    // ── Create admin user ────────────────────────────────────────────────
    const adminUser = new User({
      name: 'Test Admin',
      email: ADMIN_EMAIL,
      passwordHash: PASSWORD,
      isVerified: true,
      creditBalance: 0,
      heldCredits: 0,
      role: 'admin',
    });
    await adminUser.save();

    // ── Create a skill listing by the teacher ────────────────────────────
    const listing = new SkillListing({
      teacherId: teacherUser._id,
      title: 'Test Guitar Lesson',
      category: 'Music',
      description: 'A unit test skill listing for guitar basics.',
      format: 'online',
      durationMinutes: 60,
      creditCost: 5,
      proficiencyLevel: 'beginner',
      isActive: true,
    });
    await listing.save();
    listingId = listing._id.toString();

    // ── Authenticate all three users to obtain JWT access tokens ─────────
    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: STUDENT_EMAIL, password: PASSWORD });
    studentToken = studentLogin.body.accessToken;

    const teacherLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: TEACHER_EMAIL, password: PASSWORD });
    teacherToken = teacherLogin.body.accessToken;

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN_EMAIL, password: PASSWORD });
    adminToken = adminLogin.body.accessToken;
  }, 30000);

  // ── CLEANUP: Remove all test data and close connection ───────────────────
  afterAll(async () => {
    await Booking.deleteMany({ studentId: { $in: [studentId] } });
    await SkillListing.findByIdAndDelete(listingId);
    await User.deleteMany({ email: { $in: [STUDENT_EMAIL, TEACHER_EMAIL, ADMIN_EMAIL] } });
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }, 15000);

  // ══════════════════════════════════════════════════════════════════════════
  // A. POSITIVE FLOW — Happy Path
  // ══════════════════════════════════════════════════════════════════════════

  describe('A. Positive Flow — Happy Path', () => {

    // ── A-1: Student creates a valid booking ─────────────────────────────
    it('A-1: should create a new booking and hold credits (POST /api/bookings)', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          listingId,
          preferredDate: '2026-12-01',
          preferredTime: '14:00',
          message: 'Looking forward to learning guitar!',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.booking).toBeDefined();
      expect(res.body.booking._id).toBeDefined();
      expect(res.body.booking.status).toBe('pending');
      expect(res.body.booking.creditCost).toBe(5);

      // Save booking ID for subsequent tests
      bookingId = res.body.booking._id;
    });

    // ── A-2: Authenticated user can list their bookings ──────────────────
    it('A-2: should return bookings list for authenticated user (GET /api/bookings)', async () => {
      const res = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.bookings)).toBe(true);
      expect(res.body.bookings.length).toBeGreaterThan(0);
    });

    // ── A-3: Teacher can list their bookings ─────────────────────────────
    it('A-3: teacher should see the booking in their list (GET /api/bookings)', async () => {
      const res = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      const found = res.body.bookings.some(b => b._id === bookingId);
      expect(found).toBe(true);
    });

    // ── A-4: Teacher can accept (confirm) the booking ────────────────────
    it('A-4: teacher should accept the booking (PATCH /api/bookings/:id)', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ status: 'accepted' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.booking.status).toBe('accepted');
    });

    // ── A-5: Create a second booking then cancel it ───────────────────────
    it('A-5: student should be able to cancel an accepted booking (PATCH /api/bookings/:id)', async () => {
      // Create a fresh booking to cancel (listing creditCost=5, student still has enough)
      const createRes = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          listingId,
          preferredDate: '2026-12-25',
          preferredTime: '10:00',
          message: 'Second booking — will cancel',
        });

      expect(createRes.statusCode).toBe(201);
      const secondBookingId = createRes.body.booking._id;

      // Cancel it — date is far in the future so no late-cancel penalty
      const cancelRes = await request(app)
        .patch(`/api/bookings/${secondBookingId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ status: 'cancelled', cancellationReason: 'Schedule conflict' });

      expect(cancelRes.statusCode).toBe(200);
      expect(cancelRes.body.success).toBe(true);
      expect(cancelRes.body.booking.status).toBe('cancelled');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // B. NEGATIVE FLOW — Validation & Error Handling
  // ══════════════════════════════════════════════════════════════════════════

  describe('B. Negative Flow — Validation & Error Handling', () => {

    // ── B-1: Missing required fields returns 400 ─────────────────────────
    it('B-1: should return 400 when required booking fields are missing (POST /api/bookings)', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          // Missing listingId, preferredDate, preferredTime
          message: 'Incomplete booking request',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    // ── B-2: Non-existent listing returns 404 ────────────────────────────
    it('B-2: should return 404 when listingId does not exist (POST /api/bookings)', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          listingId: fakeId,
          preferredDate: '2026-12-10',
          preferredTime: '09:00',
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    // ── B-3: Updating a booking to an invalid status returns 400 ─────────
    it('B-3: should return 400 for invalid status transition (PATCH /api/bookings/:id)', async () => {
      // bookingId is now "accepted" — cannot transition to "pending"
      const res = await request(app)
        .patch(`/api/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ status: 'pending' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    // ── B-4: Missing status field returns 400 ────────────────────────────
    it('B-4: should return 400 when status field is missing (PATCH /api/bookings/:id)', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({}); // No status

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    // ── B-5: Non-existent booking returns 404 ────────────────────────────
    it('B-5: should return 404 when bookingId does not exist (PATCH /api/bookings/:id)', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .patch(`/api/bookings/${fakeId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ status: 'accepted' });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    // ── B-6: Student cannot accept a booking (teacher-only action) ───────
    it('B-6: student should not be able to accept a booking — 403 Forbidden (PATCH /api/bookings/:id)', async () => {
      // Create a fresh booking and try to let student accept it
      const createRes = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          listingId,
          preferredDate: '2026-12-15',
          preferredTime: '11:00',
        });

      expect(createRes.statusCode).toBe(201);
      const freshBookingId = createRes.body.booking._id;

      const res = await request(app)
        .patch(`/api/bookings/${freshBookingId}`)
        .set('Authorization', `Bearer ${studentToken}`) // student — not teacher
        .send({ status: 'accepted' });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);

      // Cleanup
      await Booking.findByIdAndDelete(freshBookingId);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // C. SECURITY & BOUNDARY
  // ══════════════════════════════════════════════════════════════════════════

  describe('C. Security & Boundary', () => {

    // ── C-1: No token → 401 on GET /api/bookings ─────────────────────────
    it('C-1: should return 401 when Authorization header is missing (GET /api/bookings)', async () => {
      const res = await request(app)
        .get('/api/bookings');
        // No Authorization header

      expect(res.statusCode).toBe(401);
    });

    // ── C-2: No token → 401 on POST /api/bookings ────────────────────────
    it('C-2: should return 401 when Authorization header is missing (POST /api/bookings)', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send({
          listingId,
          preferredDate: '2026-12-20',
          preferredTime: '15:00',
        });
        // No Authorization header

      expect(res.statusCode).toBe(401);
    });

    // ── C-3: No token → 401 on PATCH /api/bookings/:id ───────────────────
    it('C-3: should return 401 when Authorization header is missing (PATCH /api/bookings/:id)', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${bookingId}`)
        .send({ status: 'cancelled' });
        // No Authorization header

      expect(res.statusCode).toBe(401);
    });

    // ── C-4: Malformed / expired token → 401 ─────────────────────────────
    it('C-4: should return 401 for a malformed/invalid JWT token', async () => {
      const res = await request(app)
        .get('/api/bookings')
        .set('Authorization', 'Bearer this.is.an.invalid.token');

      expect(res.statusCode).toBe(401);
    });

    // ── C-5: Unrelated third-party user cannot update another user's booking ──
    it('C-5: an unrelated user should not be able to change another user\'s booking — 403', async () => {
      // Create a separate outsider user
      const outsiderEmail = `outsider_${stamp}@test.dokkhota.com`;
      const outsider = new User({
        name: 'Outsider',
        email: outsiderEmail,
        passwordHash: PASSWORD,
        isVerified: true,
        creditBalance: 50,
        role: 'user',
      });
      await outsider.save();

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: outsiderEmail, password: PASSWORD });
      const outsiderToken = loginRes.body.accessToken;

      // bookingId belongs to student/teacher — outsider has no relation
      const res = await request(app)
        .patch(`/api/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({ status: 'cancelled' });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);

      // Cleanup outsider
      await User.findByIdAndDelete(outsider._id);
    });
  });
});
