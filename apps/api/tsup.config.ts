import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  target: 'node20',
  platform: 'node',
  clean: true,
  sourcemap: true,
  // @tigu/shared ships TypeScript sources, so it is bundled into the API build.
  noExternal: ['@tigu/shared'],
});
