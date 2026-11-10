import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'
import { materialSymbolsSubset } from './scripts/iconFont.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The usual 500 kB warning for every chunk except vendor-excel (see chunkSizeWarningLimit)
const CHUNK_WARNING_KB = 500
function warnLargeChunks() {
  return {
    name: 'warn-large-chunks',
    generateBundle(_, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk' || chunk.name === 'vendor-excel') continue
        const kb = new TextEncoder().encode(chunk.code).length / 1000
        if (kb > CHUNK_WARNING_KB) {
          this.warn(`${chunk.fileName} is ${kb.toFixed(0)} kB (over ${CHUNK_WARNING_KB} kB)`)
        }
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // materialSymbolsSubset: the icon font with only the icons the app uses (build only, phase 12a)
  plugins: [react(), tailwindcss(), warnLargeChunks(), materialSymbolsSubset()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2020',
    // vendor-excel (ExcelJS 4.4.0, the latest release) is ~930 kB minified and cannot shrink: the
    // package ships one browser bundle (the "bare" build only drops the polyfills it needs). It is
    // loaded on demand, only when the user exports. Vite's limit is raised for it alone; every
    // other chunk keeps the 500 kB warning through warnLargeChunks() above (phase 8).
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.info', 'console.debug', 'console.trace'],
      },
      mangle: { safari10: true },
      format: { comments: false },
    },
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: (id) => {
          // Heavy Excel vendor - single shared chunk, loaded on Export only
          if (id.includes('node_modules/exceljs')) {
            return 'vendor-excel'
          }
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react'
          }
          if (id.includes('node_modules/react-router')) {
            return 'router'
          }
          if (
            id.includes('node_modules/clsx') ||
            id.includes('node_modules/tailwind-merge') ||
            id.includes('node_modules/axios')
          ) {
            return 'utils'
          }
          if (id.includes('/components/ui/')) {
            return 'ui'
          }
          if (id.includes('/components/layout/')) {
            return 'layout'
          }
          if (id.includes('/hooks/')) {
            return 'hooks'
          }
          if (id.includes('/assessment/')) {
            return 'assessment'
          }
          if (id.includes('/screening/')) {
            return 'screening'
          }
          if (id.includes('/semp/')) {
            return 'semp'
          }
          if (id.includes('/monitoring/')) {
            return 'monitoring'
          }
        },
      },
    },
    sourcemap: false,
    cssCodeSplit: true,
    cssMinify: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'exceljs'],
  },
})
