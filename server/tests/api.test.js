import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import { connectDB } from '../config/db.js';

describe('CinePulse REST API Integration Tests', () => {
  beforeAll(async () => {
    await connectDB();
  }, 10000);

  afterAll(async () => {
    await mongoose.disconnect();
  });
  describe('System Health & Security Disclosure (SEC-08)', () => {
    it('GET /api/health should return 200 and MUST NOT expose smtpUser email', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'online');
      expect(res.body).toHaveProperty('service');
      expect(res.body).toHaveProperty('knnEngineTrained');
      // Assert security fix SEC-08: smtpUser email must NOT be leaked
      expect(res.body.smtpUser).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain('@');
    });
  });

  describe('Route Protection & Access Control (SEC-03, SEC-04)', () => {
    it('POST /api/movies/sync-tmdb should reject unauthenticated requests with 401', async () => {
      const res = await request(app).post('/api/movies/sync-tmdb');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error).toMatch(/not authorized/i);
    });

    it('POST /api/upload/avatar should reject unauthenticated requests with 401', async () => {
      const res = await request(app).post('/api/upload/avatar');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error).toMatch(/not authorized/i);
    });

    it('GET /api/watchlist should reject requests without token with 401', async () => {
      const res = await request(app).get('/api/watchlist');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('Movie Catalog & ReDoS Query Safety (SEC-05)', () => {
    it('GET /api/movies should return 200 with movie list', async () => {
      const res = await request(app).get('/api/movies?limit=5');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/movies should safely handle ReDoS payload without event loop lag', async () => {
      const start = Date.now();
      const res = await request(app).get('/api/movies?search=(a%2B)%2B%24');
      const elapsed = Date.now() - start;

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(elapsed).toBeLessThan(200); // Must resolve in < 200ms
    });

    it('GET /api/movies/meta/genres should return unique genres array', async () => {
      const res = await request(app).get('/api/movies/meta/genres');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toContain('All');
    });

    it('GET /api/movies/:id should return 404 for non-existent movie', async () => {
      const res = await request(app).get('/api/movies/non-existent-movie-id-xyz');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('Recommendations API Endpoint', () => {
    it('POST /api/recommendations should return Top-K recommendations with match scores', async () => {
      const res = await request(app)
        .post('/api/recommendations')
        .send({
          favoriteGenres: ['Sci-Fi'],
          k: 5
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(5);

      if (res.body.data.length > 0) {
        expect(res.body.data[0]).toHaveProperty('matchPercentage');
        expect(res.body.data[0]).toHaveProperty('cosineSimilarity');
      }
    });
  });

  describe('Authentication Validation (SEC-02, SEC-07)', () => {
    it('POST /api/auth/register should return 400 when name/email/password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'incomplete@example.com' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error).toMatch(/provide name, email, and password/i);
    });

    it('POST /api/auth/login should return 401 on incorrect credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent_user_99999@cinepulse.ai',
          password: 'wrong_password_123'
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('success', false);
    });

    it('POST /api/auth/verify-email should reject 123456 backdoor code on non-existent account', async () => {
      const res = await request(app)
        .post('/api/auth/verify-email')
        .send({
          email: 'nonexistent_test@example.com',
          otp: '123456'
        });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('success', false);
    });
  });
});
