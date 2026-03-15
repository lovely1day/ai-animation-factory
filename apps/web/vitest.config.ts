import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@ai-animation-factory/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  esbuild: {
    include: [/\.tsx?$/],
    exclude: [],
    loader: 'tsx',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', '.next/', 'src/test/'],
    },
  },
})
