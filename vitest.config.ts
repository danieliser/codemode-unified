import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 30000,
    setupFiles: [],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'text-summary'],
      include: [
        'src/**/*.ts'
      ],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.config.ts',
        'src/runtime/__tests__/**',
        'src/sandbox/test-*.ts',
        'src/codegen/examples/**'
      ],
      all: true,
      lines: 75,
      functions: 75,
      branches: 70,
      statements: 75
    }
  },
  esbuild: {
    target: 'node20'
  }
});