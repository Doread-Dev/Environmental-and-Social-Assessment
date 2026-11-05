import { describe, expect, it } from 'vitest'
import { apiBaseUrl } from './api'

// D38, phase 11: one server serves the app and the API, so the production build calls its own
// origin unless VITE_API_URL says otherwise (Vercel keeps setting it until the server is live).
describe('apiBaseUrl', () => {
  it('uses VITE_API_URL when it is set (Vercel, previews, a dev backend on another port)', () => {
    expect(apiBaseUrl({ VITE_API_URL: 'https://api.example.com/api/v1', DEV: false })).toBe(
      'https://api.example.com/api/v1'
    )
    expect(apiBaseUrl({ VITE_API_URL: 'http://localhost:3001/api/v1', DEV: true })).toBe(
      'http://localhost:3001/api/v1'
    )
  })

  it('a production build without VITE_API_URL calls its own origin', () => {
    expect(apiBaseUrl({ DEV: false })).toBe('/api/v1')
    expect(apiBaseUrl({ VITE_API_URL: '', DEV: false })).toBe('/api/v1')
  })

  it('npm run dev without VITE_API_URL calls the local backend', () => {
    expect(apiBaseUrl({ DEV: true })).toBe('http://localhost:3000/api/v1')
  })
})
