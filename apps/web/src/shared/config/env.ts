export const env = {
  /** Empty in dev: requests go through the Vite proxy on the same origin. */
  apiBaseUrl: import.meta.env.VITE_API_URL ?? '',
  /** Serve the API from MSW in the browser (until the real backend modules exist). */
  useMocks: import.meta.env.VITE_API_MOCKS === 'true',
  features: {
    /** Stage 2 modules: warehouse, quality, client portal. */
    stage2: import.meta.env.VITE_FEATURE_STAGE2 === 'true',
  },
} as const;
