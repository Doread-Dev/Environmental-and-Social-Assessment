import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, AuthProvider, LookupProvider } from '@/contexts'
import { ToastProvider } from '@/components/ui'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <LookupProvider>
        <ThemeProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </ThemeProvider>
      </LookupProvider>
    </AuthProvider>
  </StrictMode>
)
