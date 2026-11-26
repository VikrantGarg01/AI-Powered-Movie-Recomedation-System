import { randomInt, timingSafeEqual } from 'node:crypto';

export class User {
  constructor(attributes = {}) {
    Object.assign(this, attributes);
  }

  generateVerificationOtp() {
    this.verificationOtp = randomInt(0, 1_000_000).toString().padStart(6, '0');
    this.verificationOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    return this.verificationOtp;
  }

  checkVerificationOtp(otp) {
    if (
      typeof otp !== 'string' ||
      !/^\d{6}$/.test(otp) ||
      typeof this.verificationOtp !== 'string' ||
      !/^\d{6}$/.test(this.verificationOtp) ||
      !(this.verificationOtpExpires instanceof Date) ||
      this.verificationOtpExpires.getTime() <= Date.now()
    ) {
      return false;
    }

    return timingSafeEqual(Buffer.from(otp), Buffer.from(this.verificationOtp));
  }
}
