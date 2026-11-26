import { describe, it, expect } from 'vitest';
import { User } from '../../server/models/User.js';

describe('User Authentication & Security Method Unit Tests', () => {
  it('generateVerificationOtp should generate a 6-digit numeric string', () => {
    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'testpassword123'
    });

    const otp = user.generateVerificationOtp();
    expect(otp).toBeDefined();
    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
    expect(user.verificationOtp).toBe(otp);
    expect(user.verificationOtpExpires).toBeInstanceOf(Date);
    
    // Expiration must be approximately 10 minutes in the future (within 2 seconds tolerance)
    const expectedExpiry = Date.now() + 10 * 60 * 1000;
    expect(Math.abs(user.verificationOtpExpires.getTime() - expectedExpiry)).toBeLessThan(2000);
  });

  it('checkVerificationOtp should accept the exact matching OTP within expiration window', () => {
    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'testpassword123'
    });

    const otp = user.generateVerificationOtp();
    const isValid = user.checkVerificationOtp(otp);
    expect(isValid).toBe(true);
  });

  it('checkVerificationOtp should reject an incorrect OTP code', () => {
    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'testpassword123'
    });

    user.generateVerificationOtp();
    const isValid = user.checkVerificationOtp('000000');
    expect(isValid).toBe(false);
  });

  it('checkVerificationOtp should REJECT universal backdoor code 123456', () => {
    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'testpassword123'
    });

    user.verificationOtp = '987654';
    user.verificationOtpExpires = new Date(Date.now() + 10 * 60 * 1000);

    // Attempt backdoor bypass
    const isValid = user.checkVerificationOtp('123456');
    expect(isValid).toBe(false);
  });

  it('checkVerificationOtp should reject an expired OTP', () => {
    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'testpassword123'
    });

    user.verificationOtp = '654321';
    // Expired 5 minutes ago
    user.verificationOtpExpires = new Date(Date.now() - 5 * 60 * 1000);

    const isValid = user.checkVerificationOtp('654321');
    expect(isValid).toBe(false);
  });

  it('checkVerificationOtp should return false if OTP or expiry are undefined', () => {
    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'testpassword123'
    });

    user.verificationOtp = undefined;
    user.verificationOtpExpires = undefined;

    expect(user.checkVerificationOtp('123456')).toBe(false);
    expect(user.checkVerificationOtp('')).toBe(false);
  });
});
