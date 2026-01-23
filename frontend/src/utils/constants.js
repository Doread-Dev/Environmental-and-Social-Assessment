/**
 * Application Constants
 */

// App Info
export const APP_NAME = 'Environmental & Social Management System'
export const APP_SHORT_NAME = 'ESMS'
export const APP_ORGANIZATION = 'Aga Khan Foundation – Syria'

// Theme
export const THEME_STORAGE_KEY = 'esms-theme'
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
}

// Risk Categories
export const RISK_CATEGORIES = {
  A: { label: 'Category A', description: 'High Risk', color: 'risk-a' },
  'B+': { label: 'Category B+', description: 'Medium-High Risk', color: 'risk-b-plus' },
  B: { label: 'Category B', description: 'Medium Risk', color: 'risk-b' },
  C: { label: 'Category C', description: 'Low Risk', color: 'risk-c' },
  D: { label: 'Category D', description: 'Emergency', color: 'risk-d' },
  E: { label: 'Category E', description: 'Insufficient Info', color: 'risk-e' },
  F: { label: 'Category F', description: 'Positive Impact', color: 'risk-f' },
}

// Workflow Steps
export const WORKFLOW_STEPS = {
  SCREENING: { id: 'screening', label: 'Screening', order: 1 },
  ASSESSMENT: { id: 'assessment', label: 'Assessment', order: 2 },
  SEMP: { id: 'semp', label: 'SEMP', order: 3 },
  MITIGATION: { id: 'mitigation', label: 'Mitigation', order: 4 },
  MONITORING: { id: 'monitoring', label: 'Monitoring', order: 5 },
}

// Breakpoints (matching Tailwind)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
}

// Animation Durations
export const ANIMATION = {
  FAST: 150,
  NORMAL: 200,
  SLOW: 300,
}
