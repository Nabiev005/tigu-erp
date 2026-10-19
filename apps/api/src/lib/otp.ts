import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';

export const OTP_TTL_MS = 5 * 60_000; // spec §13: code expires after 5 minutes
export const OTP_MAX_ATTEMPTS = 5; // spec §13: 5 attempts

export const generateOtp = () => randomInt(0, 1_000_000).toString().padStart(6, '0');

export function hashOtp(secret: string, phone: string, code: string): string {
  return createHmac('sha256', secret).update(`${phone}:${code}`).digest('hex');
}

export function otpMatches(secret: string, phone: string, code: string, expected: string): boolean {
  const actual = Buffer.from(hashOtp(secret, phone, code), 'hex');
  const wanted = Buffer.from(expected, 'hex');
  return actual.length === wanted.length && timingSafeEqual(actual, wanted);
}
