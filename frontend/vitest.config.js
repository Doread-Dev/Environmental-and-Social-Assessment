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
        thresholds: { statements: 4.5, branches: 2.1, functions: 4.1, lines: 4.6 },
      },
    },
  })
)
