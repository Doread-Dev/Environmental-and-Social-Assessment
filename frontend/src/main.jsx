import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { ThemeProvider, AuthProvider } from '@/contexts'
import { ToastProvider } from '@/components/ui'
import { queryClient } from '@/services/queryClient'
import App from './App.jsx'
import './fonts'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <App />
            <SpeedInsights />
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
)
