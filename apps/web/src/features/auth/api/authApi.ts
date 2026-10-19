import {
  AuthUserSchema,
  LoginResponseSchema,
  type MeUpdateRequest,
  OtpChallengeSchema,
  SessionSchema,
  type CodeVerifyRequest,
  type LoginRequest,
  type OtpSendRequest,
  type PinLoginRequest,
  type RegisterRequest,
} from '@tigu/shared';
import { api } from '../../../shared/api/client';

const noRefresh = { skipRefresh: true } as const;

export const authApi = {
  login: (body: LoginRequest) =>
    api.post('/auth/login', body, { ...noRefresh, schema: LoginResponseSchema }),
  verify2fa: (body: CodeVerifyRequest) =>
    api.post('/auth/2fa/verify', body, { ...noRefresh, schema: SessionSchema }),
  pin: (body: PinLoginRequest) =>
    api.post('/auth/pin', body, { ...noRefresh, schema: SessionSchema }),
  sendOtp: (body: OtpSendRequest) =>
    api.post('/auth/otp/send', body, { ...noRefresh, schema: OtpChallengeSchema }),
  verifyOtp: (body: CodeVerifyRequest) =>
    api.post('/auth/otp/verify', body, { ...noRefresh, schema: SessionSchema }),
  register: (body: RegisterRequest) =>
    api.post('/auth/register', body, { ...noRefresh, schema: OtpChallengeSchema }),
  refresh: () => api.post('/auth/refresh', undefined, { ...noRefresh, schema: SessionSchema }),
  logout: () => api.post<undefined>('/auth/logout', undefined, noRefresh),
  updateMe: (body: MeUpdateRequest) => api.patch('/auth/me', body, { schema: AuthUserSchema }),
};
