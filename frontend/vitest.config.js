import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.js'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.{js,jsx}'],
      setupFiles: ['src/test/setup.js'],
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{js,jsx}'],
        exclude: ['src/**/*.test.{js,jsx}', 'src/test/**'],
        reporter: ['text-summary', 'html', 'json-summary'],
        // Floor = current coverage, rounded down. Raise it when a phase adds tests; never lower it.
        thresholds: { statements: 7.9, branches: 4.9, functions: 6.5, lines: 8 },
      },
    },
  })
)
