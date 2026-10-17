/** Error codes returned in `{ error: { code } }`. Translated on the client via `errors.<CODE>`. */
export const ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'INVALID_CREDENTIALS',
  'INVALID_CODE',
  'CODE_EXPIRED',
  'TOO_MANY_ATTEMPTS',
  'PIN_LOCKED',
  'PHONE_TAKEN',
  'ALREADY_DONE',
  'LOCKED',
  'INTERNAL_ERROR',
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];
