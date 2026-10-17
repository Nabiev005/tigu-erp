/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_API_MOCKS?: string;
  readonly VITE_FEATURE_STAGE2?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
