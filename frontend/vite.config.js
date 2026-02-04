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
    // Target modern browsers for smaller output
    target: 'es2020',
    // Increase warning limit
    chunkSizeWarningLimit: 500,
    // Minification settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.info', 'console.debug', 'console.trace'],
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false, // Remove all comments
      },
    },
    // Rollup optimization
    rollupOptions: {
      output: {
        // Better chunk naming
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Manual chunks for optimal splitting
        manualChunks: (id) => {
          // React core - loaded immediately
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react'
          }
          // React Router
          if (id.includes('node_modules/react-router')) {
            return 'router'
          }
          // Utility libraries
          if (id.includes('node_modules/clsx') || id.includes('node_modules/tailwind-merge')) {
            return 'utils'
          }
          // UI Components - shared across all pages
          if (id.includes('/components/ui/')) {
            return 'ui'
          }
          // Layout components
          if (id.includes('/components/layout/')) {
            return 'layout'
          }
          // Data/Mock files - only load when needed
          if (id.includes('/data/')) {
            return 'data'
          }
          // Hooks
          if (id.includes('/hooks/')) {
            return 'hooks'
          }
          // Assessment-related pages (grouped together)
          if (id.includes('/assessment/')) {
            return 'assessment'
          }
          // Screening-related pages
          if (id.includes('/screening/')) {
            return 'screening'
          }
          // SEMP-related pages
          if (id.includes('/semp/')) {
            return 'semp'
          }
          // Monitoring-related pages
          if (id.includes('/monitoring/')) {
            return 'monitoring'
          }
        },
      },
    },
    // Source maps for debugging (optional - disable for smaller build)
    sourcemap: false,
    // CSS optimization
    cssCodeSplit: true,
    cssMinify: true,
  },
  // Optimize deps
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
})
