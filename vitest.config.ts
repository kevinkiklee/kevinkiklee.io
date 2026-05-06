import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./src', import.meta.url)),
      // Stub the Astro virtual module so unit tests can import modules
      // that depend on `astro:content` without booting the Astro runtime.
      'astro:content': fileURLToPath(new URL('./test/stubs/astro-content.ts', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'test/**/*.test.ts', 'scripts/**/*.test.ts'],
    environment: 'node',
  },
});
