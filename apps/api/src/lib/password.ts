import { randomInt } from 'node:crypto';
import { hash, verify } from '@node-rs/argon2';
import { customAlphabet } from 'nanoid';

// argon2id with library defaults (spec §3: argon2 for passwords and PINs).
export const hashSecret = (secret: string) => hash(secret);

// Real hash of a throwaway value: checking against it costs the same as a real check.
let dummyHash: Promise<string> | null = null;

export async function verifySecret(hashValue: string | null | undefined, secret: string) {
  if (!hashValue) {
    // Burn the same time so the response does not reveal unknown phones.
    dummyHash ??= hash('timing-equalizer');
    await verify(await dummyHash, secret).catch(() => false);
    return false;
  }
  return verify(hashValue, secret).catch(() => false);
}

export const generatePin = () => randomInt(0, 10_000).toString().padStart(4, '0');

// No look-alike characters (0/O, 1/l/I): it is typed from an SMS.
export const generateTempPassword = customAlphabet(
  'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789',
  10,
);
