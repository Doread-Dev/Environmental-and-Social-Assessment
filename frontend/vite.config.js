import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2020',
    // Keep 500 kB limit; vendor-excel (exceljs) is loaded on demand when user clicks Export
    chunkSizeWarningLimit: 500,
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
          // Heavy Excel vendor - single shared chunk (used by screening, assessment, semp, monitoring)
          if (
            id.includes('node_modules/exceljs') ||
            id.includes('node_modules/file-saver')
          ) {
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
          if (id.includes('/data/')) {
            return 'data'
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
    include: ['react', 'react-dom', 'react-router-dom', 'exceljs', 'file-saver'],
  },
})
