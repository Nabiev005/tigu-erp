import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { db } from '../mocks/data/db';
import { server } from '../mocks/node';
import { i18n } from '../shared/i18n';

// jsdom's AbortSignal is rejected by Node's (undici) Request, which React Router's data
// router constructs on every navigation. Tests don't rely on aborting, so drop the signal.
const NativeRequest = globalThis.Request;
globalThis.Request = class extends NativeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    const { signal: _signal, ...rest } = init ?? {};
    super(input, rest);
  }
};

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  void i18n.changeLanguage('ky');
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  db.reset();
});

afterAll(() => server.close());

// jsdom lacks matchMedia and scrollTo.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }),
});
window.scrollTo = () => undefined;
