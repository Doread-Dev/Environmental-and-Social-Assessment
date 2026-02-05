# Phase 1: Project Setup & Build Pipeline
## خطة تفصيلية مرتبة

---

## نظرة عامة على المرحلة

**الهدف الرئيسي:** إعداد مشروع React/Vite مع Tailwind CSS وتكوين بيئة التطوير بالكامل

**المخرجات النهائية:**
- مشروع Vite + React مُهيأ
- Tailwind CSS v4 مُكوّن مع Design Tokens
- ESLint + Prettier مُكوّنين
- هيكل المجلدات مُنشأ
- Path Aliases مُكوّنة (@/ for src/)
- ThemeContext للوضع المظلم
- خطوط Inter من Google Fonts

---

## الخطوة 1: إنشاء مشروع Vite مع React

### 1.1 التحقق من المتطلبات الأساسية

**قبل البدء، تأكد من:**
```bash
# التحقق من إصدار Node.js (يجب أن يكون 18.0.0 أو أحدث)
node --version

# التحقق من npm
npm --version
```

**المتطلبات:**
- Node.js >= 18.0.0
- npm >= 9.0.0

### 1.2 حذف محتوى frontend القديم (إن وجد)

```bash
# من المجلد الرئيسي للمشروع
cd "c:\Users\hayda\Desktop\Environmental and Social Assessment"

# حذف محتويات frontend القديمة (باستثناء مجلد documents)
# ملاحظة: مجلد documents يحتوي على MASTER_PLAN.md ويجب الاحتفاظ به
```

### 1.3 إنشاء مشروع Vite جديد

```bash
# من المجلد الرئيسي للمشروع
cd "c:\Users\hayda\Desktop\Environmental and Social Assessment"

# إنشاء مشروع Vite مع قالب React
npm create vite@latest frontend-temp -- --template react

# نقل الملفات من frontend-temp إلى frontend
# (مع الحفاظ على مجلد documents)
```

**أو بديلاً:**
```bash
# إذا كان مجلد frontend فارغاً (باستثناء documents)
cd frontend
npm create vite@latest . -- --template react
```

### 1.4 التحقق من الملفات المُنشأة

بعد الإنشاء، يجب أن تجد هذه الملفات:
```
frontend/
├── index.html
├── package.json
├── vite.config.js
├── public/
│   └── vite.svg
├── src/
│   ├── App.css
│   ├── App.jsx
│   ├── index.css
│   ├── main.jsx
│   └── assets/
│       └── react.svg
└── documents/        ← يجب الاحتفاظ به
    └── MASTER_PLAN.md
```

### 1.5 تثبيت الاعتمادات الأساسية

```bash
cd frontend
npm install
```

### 1.6 اختبار التشغيل الأولي

```bash
npm run dev
```

**التحقق:** افتح المتصفح على `http://localhost:5173` وتأكد من ظهور صفحة React الافتراضية.

---

## الخطوة 2: تثبيت وتكوين Tailwind CSS v4

### 2.1 تثبيت Tailwind CSS مع Vite Plugin

```bash
cd frontend

# تثبيت Tailwind CSS v4 مع Vite plugin
npm install tailwindcss @tailwindcss/vite
```

### 2.2 تكوين Vite لدعم Tailwind

**تحديث ملف `vite.config.js`:**

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### 2.3 تكوين ملف CSS الرئيسي

**تحديث ملف `src/index.css`:**

```css
@import "tailwindcss";

/* ==========================================
   ESMS Design System - Global Styles
   ========================================== */

/* Font Import */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

/* Material Symbols Icons */
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

/* ==========================================
   CSS Custom Properties (Design Tokens)
   ========================================== */
:root {
  /* Primary Colors */
  --color-primary: #11d452;
  --color-primary-hover: #0eb646;
  --color-primary-content: #ffffff;
  
  /* Background Colors */
  --color-background: #f6f8f6;
  --color-background-dark: #102216;
  
  /* Surface Colors */
  --color-surface: #ffffff;
  --color-surface-dark: #1c2e22;
  --color-card-dark: #152a1d;
  
  /* Text Colors */
  --color-text-main: #111813;
  --color-text-secondary: #61896f;
  --color-text-muted: #61896f;
  --color-text-disabled: #9ca3af;
  
  /* Border Colors */
  --color-border: #dbe6df;
  --color-border-dark: #2a4234;
  --color-input-border: #dbe6df;
  --color-input-border-dark: #2a4234;
  
  /* Semantic Colors */
  --color-success: #10b981;
  --color-success-dark: #34d399;
  --color-warning: #f59e0b;
  --color-warning-dark: #fbbf24;
  --color-error: #ef4444;
  --color-error-dark: #f87171;
  --color-info: #3b82f6;
  --color-info-dark: #60a5fa;
  
  /* Font Family */
  --font-display: 'Inter', system-ui, -apple-system, sans-serif;
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
}

/* ==========================================
   Base Styles
   ========================================== */
html {
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  min-height: 100vh;
  background-color: var(--color-background);
  color: var(--color-text-main);
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* Dark Mode Base */
html.dark body {
  background-color: var(--color-background-dark);
  color: #f3f4f6;
}

/* ==========================================
   Tailwind Theme Configuration
   ========================================== */
@theme {
  /* Colors */
  --color-primary: #11d452;
  --color-primary-hover: #0eb646;
  --color-primary-content: #ffffff;
  
  --color-background: #f6f8f6;
  --color-background-dark: #102216;
  
  --color-surface: #ffffff;
  --color-surface-dark: #1c2e22;
  --color-card-dark: #152a1d;
  
  --color-text-main: #111813;
  --color-text-secondary: #61896f;
  --color-text-muted: #61896f;
  --color-text-disabled: #9ca3af;
  
  --color-border-default: #dbe6df;
  --color-border-dark: #2a4234;
  --color-input-border: #dbe6df;
  --color-input-border-dark: #2a4234;
  
  /* Semantic Colors */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
  
  /* Risk Category Colors */
  --color-risk-a-bg: #fee2e2;
  --color-risk-a-text: #b91c1c;
  --color-risk-b-plus-bg: #ffedd5;
  --color-risk-b-plus-text: #c2410c;
  --color-risk-b-bg: #fef3c7;
  --color-risk-b-text: #b45309;
  --color-risk-c-bg: #dcfce7;
  --color-risk-c-text: #15803d;
  --color-risk-d-bg: #dbeafe;
  --color-risk-d-text: #1d4ed8;
  --color-risk-e-bg: #f3f4f6;
  --color-risk-e-text: #374151;
  --color-risk-f-bg: #d1fae5;
  --color-risk-f-text: #047857;
  
  /* Font Families */
  --font-family-display: 'Inter', system-ui, -apple-system, sans-serif;
  --font-family-sans: 'Inter', system-ui, -apple-system, sans-serif;
  
  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-default: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;
  --radius-full: 9999px;
  
  /* Box Shadows */
  --shadow-primary: 0 4px 14px 0 rgba(17, 212, 82, 0.3);
}

/* ==========================================
   Utility Classes
   ========================================== */

/* Focus Ring Utility */
.focus-ring {
  @apply focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2;
}

/* Scrollbar Styling */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-secondary);
}

/* Dark mode scrollbar */
html.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--color-border-dark);
}

/* ==========================================
   Animation Classes
   ========================================== */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { 
    opacity: 0; 
    transform: translateY(-10px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}

.animate-slide-in {
  animation: slideIn 0.2s ease-out;
}
```

### 2.4 تثبيت الحزم الإضافية

```bash
# تثبيت @tailwindcss/forms للتصميم الجيد للنماذج
npm install -D @tailwindcss/forms

# تثبيت clsx لدمج الـ classes
npm install clsx

# تثبيت tailwind-merge لدمج classes Tailwind بذكاء
npm install tailwind-merge
```

### 2.5 اختبار Tailwind CSS

**تحديث `src/App.jsx` للاختبار:**

```jsx
function App() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="bg-surface p-8 rounded-xl shadow-lg border border-border-default">
        <h1 className="text-3xl font-bold text-text-main mb-4">
          ESMS - Tailwind Test
        </h1>
        <p className="text-text-secondary mb-6">
          If you can see this styled correctly, Tailwind is working!
        </p>
        <button className="bg-primary hover:bg-primary-hover text-white font-medium px-6 py-3 rounded-lg transition-colors">
          Primary Button
        </button>
      </div>
    </div>
  )
}

export default App
```

**التحقق:** شغّل `npm run dev` وتأكد من ظهور الألوان والتصميم بشكل صحيح.

---

## الخطوة 3: إعداد ESLint

### 3.1 تثبيت ESLint والإضافات

```bash
cd frontend

# تثبيت ESLint مع إضافات React
npm install -D eslint @eslint/js eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh globals
```

### 3.2 إنشاء ملف تكوين ESLint

**إنشاء ملف `eslint.config.js`:**

```javascript
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import react from 'eslint-plugin-react'

export default [
  { ignores: ['dist', 'node_modules'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      globals: {
        ...globals.browser,
        ...globals.es2024,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // ESLint Base Rules
      ...js.configs.recommended.rules,
      
      // React Rules
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      
      // React Refresh
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      
      // Custom Rules
      'no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      'react/prop-types': 'off', // نستخدم JSDoc بدلاً من PropTypes
      'react/no-unescaped-entities': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
]
```

### 3.3 إضافة سكربتات ESLint في package.json

**تحديث `package.json`:**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "preview": "vite preview"
  }
}
```

### 3.4 اختبار ESLint

```bash
npm run lint
```

---

## الخطوة 4: إعداد Prettier

### 4.1 تثبيت Prettier

```bash
cd frontend

# تثبيت Prettier مع تكامل ESLint
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
```

### 4.2 إنشاء ملف تكوين Prettier

**إنشاء ملف `.prettierrc`:**

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "always",
  "endOfLine": "lf",
  "jsxSingleQuote": false,
  "plugins": []
}
```

### 4.3 إنشاء ملف `.prettierignore`

**إنشاء ملف `.prettierignore`:**

```
node_modules
dist
build
coverage
.git
*.min.js
*.min.css
package-lock.json
```

### 4.4 تحديث ESLint لدعم Prettier

**تحديث `eslint.config.js` لإضافة Prettier:**

```javascript
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import react from 'eslint-plugin-react'
import prettier from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'

export default [
  { ignores: ['dist', 'node_modules'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      globals: {
        ...globals.browser,
        ...globals.es2024,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier,
    },
    rules: {
      // ESLint Base Rules
      ...js.configs.recommended.rules,
      
      // React Rules
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      
      // Prettier
      ...prettierConfig.rules,
      'prettier/prettier': 'warn',
      
      // React Refresh
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      
      // Custom Rules
      'no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
]
```

### 4.5 إضافة سكربتات التنسيق

**تحديث `package.json`:**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write \"src/**/*.{js,jsx,css,json}\"",
    "format:check": "prettier --check \"src/**/*.{js,jsx,css,json}\"",
    "preview": "vite preview"
  }
}
```

### 4.6 اختبار Prettier

```bash
npm run format:check
npm run format
```

---

## الخطوة 5: إنشاء هيكل المجلدات

### 5.1 إنشاء المجلدات الرئيسية

```bash
cd frontend/src

# Components directories
mkdir -p components/ui
mkdir -p components/layout
mkdir -p components/project
mkdir -p components/forms
mkdir -p components/tables
mkdir -p components/charts

# Pages directories
mkdir -p pages/auth
mkdir -p pages/dashboard
mkdir -p pages/projects
mkdir -p pages/project-workspace/overview
mkdir -p pages/project-workspace/screening
mkdir -p pages/project-workspace/assessment
mkdir -p pages/project-workspace/semp
mkdir -p pages/project-workspace/monitoring
mkdir -p pages/project-workspace/annex

# Other directories
mkdir -p routes
mkdir -p hooks
mkdir -p contexts
mkdir -p services
mkdir -p utils
mkdir -p data
mkdir -p styles
mkdir -p assets/images
mkdir -p assets/icons
```

### 5.2 إنشاء ملفات Barrel Export

**إنشاء `src/components/ui/index.js`:**

```javascript
// UI Components Barrel Export
// Add exports as components are created

// export { default as Button } from './Button'
// export { default as Input } from './Input'
// export { default as Card } from './Card'
// ... etc
```

**إنشاء `src/components/layout/index.js`:**

```javascript
// Layout Components Barrel Export
// Add exports as components are created

// export { default as AuthLayout } from './AuthLayout'
// export { default as MainLayout } from './MainLayout'
// export { default as ProjectLayout } from './ProjectLayout'
// ... etc
```

**إنشاء `src/components/project/index.js`:**

```javascript
// Project Components Barrel Export
// Add exports as components are created

// export { default as ProjectCard } from './ProjectCard'
// export { default as RiskCategoryBadge } from './RiskCategoryBadge'
// ... etc
```

**إنشاء `src/components/forms/index.js`:**

```javascript
// Form Components Barrel Export
// Add exports as components are created
```

**إنشاء `src/components/tables/index.js`:**

```javascript
// Table Components Barrel Export
// Add exports as components are created
```

**إنشاء `src/hooks/index.js`:**

```javascript
// Custom Hooks Barrel Export
// Add exports as hooks are created

// export { useLocalStorage } from './useLocalStorage'
// export { useMediaQuery } from './useMediaQuery'
```

**إنشاء `src/contexts/index.js`:**

```javascript
// Contexts Barrel Export

export { ThemeProvider, useTheme } from './ThemeContext'
// export { AuthProvider, useAuth } from './AuthContext'
```

**إنشاء `src/utils/index.js`:**

```javascript
// Utils Barrel Export

export { cn } from './cn'
// export * from './formatters'
// export * from './validators'
// export * from './constants'
```

**إنشاء `src/data/index.js`:**

```javascript
// Mock Data Barrel Export
// Add exports as data files are created

// export { mockProjects } from './mockProjects'
// export { impactCategories } from './impactCategories'
// export { riskCategories } from './riskCategories'
```

**إنشاء `src/services/index.js`:**

```javascript
// Services Barrel Export
// Add exports as services are created (for API integration)

// export { api } from './api'
// export { authService } from './authService'
// export { projectService } from './projectService'
```

**إنشاء `src/pages/auth/index.js`:**

```javascript
// Auth Pages Barrel Export

// export { default as LoginPage } from './LoginPage'
```

**إنشاء `src/pages/dashboard/index.js`:**

```javascript
// Dashboard Pages Barrel Export

// export { default as DashboardPage } from './DashboardPage'
```

**إنشاء `src/pages/projects/index.js`:**

```javascript
// Projects Pages Barrel Export

// export { default as ProjectListPage } from './ProjectListPage'
// export { default as ProjectCreatePage } from './ProjectCreatePage'
```

### 5.3 الهيكل النهائي المتوقع

```
frontend/
├── public/
│   ├── favicon.ico
│   └── vite.svg
│
├── src/
│   ├── assets/
│   │   ├── images/
│   │   └── icons/
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   └── index.js
│   │   ├── layout/
│   │   │   └── index.js
│   │   ├── project/
│   │   │   └── index.js
│   │   ├── forms/
│   │   │   └── index.js
│   │   ├── tables/
│   │   │   └── index.js
│   │   └── charts/
│   │       └── index.js
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   └── index.js
│   │   ├── dashboard/
│   │   │   └── index.js
│   │   ├── projects/
│   │   │   └── index.js
│   │   └── project-workspace/
│   │       ├── overview/
│   │       ├── screening/
│   │       ├── assessment/
│   │       ├── semp/
│   │       ├── monitoring/
│   │       └── annex/
│   │
│   ├── routes/
│   │   └── (empty - will be created in Phase 3)
│   │
│   ├── hooks/
│   │   └── index.js
│   │
│   ├── contexts/
│   │   ├── ThemeContext.jsx
│   │   └── index.js
│   │
│   ├── services/
│   │   └── index.js
│   │
│   ├── utils/
│   │   ├── cn.js
│   │   └── index.js
│   │
│   ├── data/
│   │   └── index.js
│   │
│   ├── styles/
│   │   └── (index.css is in src root)
│   │
│   ├── App.jsx
│   ├── App.css (يمكن حذفه)
│   ├── index.css
│   └── main.jsx
│
├── documents/
│   ├── MASTER_PLAN.md
│   └── phase-1-plan.md
│
├── .prettierrc
├── .prettierignore
├── eslint.config.js
├── vite.config.js
├── index.html
├── package.json
└── README.md
```

---

## الخطوة 6: إعداد Path Aliases

### 6.1 تحديث vite.config.js

**تم بالفعل في الخطوة 2.2، ولكن للتأكيد:**

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### 6.2 إنشاء jsconfig.json للـ IntelliSense

**إنشاء ملف `jsconfig.json` في مجلد frontend:**

```json
{
  "compilerOptions": {
    "target": "ES2024",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 6.3 اختبار Path Aliases

**مثال للاستخدام:**

```javascript
// بدلاً من:
import { Button } from '../../../components/ui'
import { cn } from '../../../utils/cn'

// يمكنك استخدام:
import { Button } from '@/components/ui'
import { cn } from '@/utils/cn'
```

---

## الخطوة 7: إنشاء Utils الأساسية

### 7.1 إنشاء cn.js (Class Name Utility)

**إنشاء `src/utils/cn.js`:**

```javascript
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes with tailwind-merge for deduplication
 * 
 * @param {...(string|object|array)} inputs - Class names or conditional objects
 * @returns {string} - Merged class string
 * 
 * @example
 * cn('px-4 py-2', isActive && 'bg-primary', className)
 * cn('text-base', { 'text-lg': isLarge, 'text-sm': isSmall })
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
```

### 7.2 إنشاء constants.js

**إنشاء `src/utils/constants.js`:**

```javascript
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
```

### 7.3 تحديث utils/index.js

**تحديث `src/utils/index.js`:**

```javascript
// Utils Barrel Export

export { cn } from './cn'
export * from './constants'
```

---

## الخطوة 8: إنشاء ThemeContext للوضع المظلم

### 8.1 إنشاء ThemeContext.jsx

**إنشاء `src/contexts/ThemeContext.jsx`:**

```javascript
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { THEME_STORAGE_KEY, THEMES } from '@/utils/constants'

/**
 * Theme Context for managing dark/light mode
 */
const ThemeContext = createContext(undefined)

/**
 * Get initial theme from localStorage or system preference
 */
function getInitialTheme() {
  // Check localStorage first
  if (typeof window !== 'undefined') {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY)
    if (storedTheme && Object.values(THEMES).includes(storedTheme)) {
      return storedTheme
    }
  }
  
  // Default to system preference
  return THEMES.SYSTEM
}

/**
 * Get the actual theme (resolving 'system' to light/dark)
 */
function getResolvedTheme(theme) {
  if (theme === THEMES.SYSTEM) {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches 
        ? THEMES.DARK 
        : THEMES.LIGHT
    }
    return THEMES.LIGHT
  }
  return theme
}

/**
 * ThemeProvider Component
 * Provides theme state and toggle functionality to the app
 */
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme)
  const [resolvedTheme, setResolvedTheme] = useState(() => getResolvedTheme(getInitialTheme()))

  // Apply theme to document
  const applyTheme = useCallback((newResolvedTheme) => {
    const root = document.documentElement
    
    // Remove both classes first
    root.classList.remove(THEMES.LIGHT, THEMES.DARK)
    
    // Add the new theme class
    root.classList.add(newResolvedTheme)
    
    // Update resolved theme state
    setResolvedTheme(newResolvedTheme)
  }, [])

  // Set theme and persist to localStorage
  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme)
    localStorage.setItem(THEME_STORAGE_KEY, newTheme)
    applyTheme(getResolvedTheme(newTheme))
  }, [applyTheme])

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK
    setTheme(newTheme)
  }, [resolvedTheme, setTheme])

  // Initialize theme on mount
  useEffect(() => {
    applyTheme(getResolvedTheme(theme))
  }, [applyTheme, theme])

  // Listen for system theme changes (when theme is 'system')
  useEffect(() => {
    if (theme !== THEMES.SYSTEM) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e) => {
      applyTheme(e.matches ? THEMES.DARK : THEMES.LIGHT)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, applyTheme])

  const value = {
    theme,           // The stored theme preference ('light', 'dark', or 'system')
    resolvedTheme,   // The actual applied theme ('light' or 'dark')
    setTheme,        // Function to set theme
    toggleTheme,     // Function to toggle between light/dark
    isDark: resolvedTheme === THEMES.DARK,
    isLight: resolvedTheme === THEMES.LIGHT,
    isSystem: theme === THEMES.SYSTEM,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Custom hook to use theme context
 * @returns {Object} Theme context value
 * @throws {Error} If used outside of ThemeProvider
 */
export function useTheme() {
  const context = useContext(ThemeContext)
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  
  return context
}

export default ThemeContext
```

### 8.2 تحديث contexts/index.js

**تحديث `src/contexts/index.js`:**

```javascript
// Contexts Barrel Export

export { ThemeProvider, useTheme } from './ThemeContext'
```

### 8.3 تحديث main.jsx لإضافة ThemeProvider

**تحديث `src/main.jsx`:**

```javascript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@/contexts'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
)
```

### 8.4 تحديث App.jsx لاختبار الوضع المظلم

**تحديث `src/App.jsx`:**

```javascript
import { useTheme } from '@/contexts'
import { cn } from '@/utils'

function App() {
  const { isDark, toggleTheme, resolvedTheme } = useTheme()

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark transition-colors duration-300">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className={cn(
          'bg-surface dark:bg-surface-dark',
          'p-8 rounded-xl shadow-lg',
          'border border-border-default dark:border-border-dark',
          'max-w-md w-full'
        )}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-text-main dark:text-white">
              ESMS Setup
            </h1>
            
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={cn(
                'p-2 rounded-lg transition-colors',
                'bg-background dark:bg-background-dark',
                'hover:bg-primary/10 dark:hover:bg-primary/20',
                'text-text-main dark:text-white'
              )}
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              <span className="material-symbols-outlined">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
          </div>

          {/* Status */}
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-success/10 border border-success/20">
              <p className="text-success font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-xl">check_circle</span>
                Phase 1 Setup Complete!
              </p>
            </div>

            <div className="space-y-2 text-sm text-text-secondary dark:text-gray-400">
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-primary">check</span>
                Vite + React configured
              </p>
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-primary">check</span>
                Tailwind CSS v4 working
              </p>
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-primary">check</span>
                ESLint + Prettier setup
              </p>
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-primary">check</span>
                Dark mode: {resolvedTheme}
              </p>
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-primary">check</span>
                Path aliases (@/) configured
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            <button className={cn(
              'flex-1 px-4 py-3 rounded-lg font-medium',
              'bg-primary hover:bg-primary-hover',
              'text-white transition-colors',
              'shadow-[0_4px_14px_0_rgba(17,212,82,0.3)]'
            )}>
              Continue to Phase 2
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
```

### 8.5 حذف App.css (اختياري)

يمكنك حذف `src/App.css` لأننا نستخدم Tailwind CSS حصرياً.

---

## الخطوة 9: إضافة خطوط Inter من Google Fonts

### 9.1 الخطوط تم إضافتها في index.css

**تم بالفعل في الخطوة 2.3:**

```css
/* Font Import */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

/* Material Symbols Icons */
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
```

### 9.2 التحقق من تحميل الخطوط

**عند تشغيل التطبيق، تحقق من:**
1. افتح DevTools في المتصفح (F12)
2. انتقل إلى Network tab
3. فلترة حسب "Font"
4. تأكد من تحميل خطوط Inter

---

## الخطوة 10: تحديث README.md

**إنشاء/تحديث `frontend/README.md`:**

```markdown
# ESMS Frontend

Environmental & Social Management System - Aga Khan Foundation Syria

## Tech Stack

- **React** 19.x - UI Library
- **Vite** 6.x - Build Tool
- **Tailwind CSS** 4.x - Styling
- **React Router** 7.x - Routing (Phase 3)

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |

## Project Structure

```
src/
├── assets/          # Static assets (images, icons)
├── components/
│   ├── ui/          # Shared UI components
│   ├── layout/      # Layout components
│   ├── project/     # Project-specific components
│   ├── forms/       # Form components
│   └── tables/      # Table components
├── pages/           # Page components
├── routes/          # Route configuration
├── hooks/           # Custom React hooks
├── contexts/        # React Contexts
├── services/        # API services (future)
├── utils/           # Utility functions
├── data/            # Mock/static data
└── styles/          # Global styles
```

## Design Tokens

The project uses a custom design system with the following main colors:

- **Primary:** `#11d452`
- **Background (Light):** `#f6f8f6`
- **Background (Dark):** `#102216`
- **Text Main:** `#111813`

## Dark Mode

Dark mode is supported via `ThemeContext`. Toggle using:

```jsx
import { useTheme } from '@/contexts'

const { toggleTheme, isDark } = useTheme()
```

## Path Aliases

Use `@/` to reference the `src/` directory:

```jsx
import { Button } from '@/components/ui'
import { cn } from '@/utils'
```
```

---

## الخطوة 11: إنشاء .gitignore

**تحديث/إنشاء `frontend/.gitignore`:**

```
# Dependencies
node_modules
.pnp
.pnp.js

# Build
dist
dist-ssr
build
*.local

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Editor
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Testing
coverage

# Misc
*.tsbuildinfo
```

---

## قائمة التحقق النهائية (Checklist)

### ملفات يجب أن تكون موجودة:

```
✓ frontend/
  ✓ package.json (مع الاعتمادات الصحيحة)
  ✓ vite.config.js (مع alias و plugins)
  ✓ eslint.config.js
  ✓ .prettierrc
  ✓ .prettierignore
  ✓ .gitignore
  ✓ jsconfig.json
  ✓ index.html
  ✓ README.md
  ✓ src/
    ✓ main.jsx (مع ThemeProvider)
    ✓ App.jsx (صفحة اختبار)
    ✓ index.css (Tailwind + Design Tokens)
    ✓ contexts/
      ✓ ThemeContext.jsx
      ✓ index.js
    ✓ utils/
      ✓ cn.js
      ✓ constants.js
      ✓ index.js
    ✓ components/ (مجلدات فارغة مع index.js)
    ✓ pages/ (مجلدات فارغة)
    ✓ hooks/index.js
    ✓ services/index.js
    ✓ data/index.js
```

### اختبارات يجب تنفيذها:

| الاختبار | الأمر | النتيجة المتوقعة |
|---------|-------|------------------|
| تشغيل التطبيق | `npm run dev` | يفتح على localhost:5173 |
| Tailwind يعمل | فحص التصميم بصرياً | الألوان والخطوط صحيحة |
| Dark Mode | الضغط على زر التبديل | تغيير الألوان بسلاسة |
| ESLint | `npm run lint` | لا أخطاء |
| Prettier | `npm run format:check` | جميع الملفات منسقة |
| Build | `npm run build` | يكمل بنجاح |

---

## ملاحظات مهمة

### 1. إصدارات الحزم

عند تثبيت الحزم، استخدم دائماً أحدث الإصدارات المستقرة. لا تحدد إصدارات يدوياً إلا إذا كان ذلك ضرورياً.

### 2. Tailwind CSS v4

Tailwind CSS v4 يستخدم نظام تكوين جديد عبر `@theme` في CSS بدلاً من `tailwind.config.js` التقليدي. تأكد من استخدام `@tailwindcss/vite` plugin.

### 3. Path Aliases

تأكد من إضافة `jsconfig.json` للحصول على IntelliSense في VS Code/Cursor.

### 4. التوافق مع Backend

هذا المشروع سيتكامل لاحقاً مع الـ Backend الموجود. تأكد من أن منفذ التطوير (5173) لا يتعارض مع Backend.


---

## حالة التنفيذ

### ✅ تم التنفيذ بنجاح

**تاريخ الإنجاز:** 23 يناير 2026

**الملفات المُنشأة:**
- ✅ `package.json` - مع جميع الاعتمادات المطلوبة
- ✅ `vite.config.js` - مع Tailwind CSS plugin و Path Aliases
- ✅ `index.html` - ملف HTML الرئيسي
- ✅ `eslint.config.js` - تكوين ESLint مع Prettier
- ✅ `.prettierrc` و `.prettierignore` - تكوين Prettier
- ✅ `jsconfig.json` - تكوين Path Aliases للـ IntelliSense
- ✅ `.gitignore` - ملف Git ignore
- ✅ `README.md` - توثيق المشروع
- ✅ `src/main.jsx` - نقطة الدخول مع ThemeProvider
- ✅ `src/App.jsx` - صفحة اختبار Phase 1
- ✅ `src/index.css` - Tailwind CSS v4 مع Design Tokens
- ✅ `src/utils/cn.js` - Utility function لدمج classes
- ✅ `src/utils/constants.js` - Constants التطبيق
- ✅ `src/utils/index.js` - Barrel export
- ✅ `src/contexts/ThemeContext.jsx` - Theme Context للوضع المظلم
- ✅ `src/contexts/index.js` - Barrel export
- ✅ جميع ملفات Barrel Export في المجلدات المطلوبة

**الهيكل المُنشأ:**
```
frontend/
├── public/
│   └── vite.svg
├── src/
│   ├── components/
│   │   ├── ui/index.js
│   │   ├── layout/index.js
│   │   ├── project/index.js
│   │   ├── forms/index.js
│   │   ├── tables/index.js
│   │   └── charts/index.js
│   ├── pages/
│   │   ├── auth/index.js
│   │   ├── dashboard/index.js
│   │   └── projects/index.js
│   ├── contexts/
│   │   ├── ThemeContext.jsx
│   │   └── index.js
│   ├── utils/
│   │   ├── cn.js
│   │   ├── constants.js
│   │   └── index.js
│   ├── hooks/index.js
│   ├── services/index.js
│   ├── data/index.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── documents/ (محفوظ)
├── package.json
├── vite.config.js
├── eslint.config.js
├── .prettierrc
├── .prettierignore
├── jsconfig.json
├── .gitignore
├── index.html
└── README.md
```

**الاختبارات المُنفذة:**
- ✅ `npm install` - تم تثبيت جميع الاعتمادات بنجاح
- ✅ `npm run lint` - ESLint يعمل بدون أخطاء (تحذير واحد فقط من react-refresh)
- ✅ `npm run format` - Prettier يعمل بشكل صحيح
- ✅ `npm run build` - Build يعمل بنجاح بدون أخطاء
- ✅ Path Aliases (@/) تعمل بشكل صحيح
- ✅ Tailwind CSS v4 يعمل مع Design Tokens
- ✅ ThemeContext يعمل مع Dark Mode

**الملاحظات:**
- تم حل مشكلة ترتيب @import في CSS (يجب أن تكون قبل @import "tailwindcss")
- تم حل مشكلة __dirname في vite.config.js باستخدام import.meta.url
- تم تنسيق جميع الملفات باستخدام Prettier
- **تم إصلاح مشكلة Dark Mode:** تم تعديل `applyTheme` في ThemeContext لإزالة class `light` وإضافة class `dark` فقط عند الحاجة. الوضع الفاتح هو الافتراضي (بدون class).

**الإصلاحات المُنفذة:**
1. **Dark Mode Fix:** تم تعديل `ThemeContext.jsx` لضمان أن الوضع الفاتح يعمل بشكل صحيح
2. **CSS Enhancement:** تم إضافة CSS rule لضمان أن الوضع الفاتح هو الافتراضي

**جاهز للمرحلة التالية:**
المشروع جاهز الآن لبدء Phase 2 (Component Library).

---

*تم إنشاء هذه الخطة: 22 يناير 2026*
*تم التنفيذ: 23 يناير 2026*
*الإصدار: 1.0 - مكتمل*
