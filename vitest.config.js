import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    projects: [
      {
        test: {
          name: 'api',
          environment: 'node',
          include: ['api/test/**/*.test.js'],
        },
      },
      {
        test: {
          name: 'client',
          environment: 'jsdom',
          include: ['client/src/test/**/*.test.{js,jsx}'],
        },
      },
    ],
  },
})