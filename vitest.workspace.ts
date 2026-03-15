import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  // API Tests
  {
    test: {
      name: 'api',
      root: './apps/api',
      globals: true,
      environment: 'node',
      include: ['src/**/*.test.ts'],
      setupFiles: ['./src/test/setup.ts'],
    },
  },
  // Web Tests
  {
    test: {
      name: 'web',
      root: './apps/web',
      globals: true,
      environment: 'jsdom',
      include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      setupFiles: ['./src/test/setup.ts'],
    },
  },
  // Shared Package Tests
  {
    test: {
      name: 'shared',
      root: './packages/shared',
      globals: true,
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  },
])
