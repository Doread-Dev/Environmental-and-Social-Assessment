# ESMS Frontend

**Environmental & Social Management System**  
Aga Khan Foundation – Syria

---

## 📋 نظرة عامة

هذا المشروع هو تطبيق React SPA لإدارة التقييمات البيئية والاجتماعية للمشاريع التنموية. تم تطويره كجزء من نظام إدارة بيئي واجتماعي شامل يتبع سير عمل منظم مع 5 أدوات رئيسية.

### حالة المشروع

**المرحلة الحالية:** ✅ **Phase 1 - مكتمل**  
**التاريخ:** 23 يناير 2026  
**الحالة:** جاهز لبدء Phase 2

---

## 🛠️ Tech Stack

### Core Technologies

| التقنية          | الإصدار | الوصف                            |
| ---------------- | ------- | -------------------------------- |
| **React**        | 19.x    | مكتبة UI                         |
| **Vite**         | 7.2.4   | Build Tool & Dev Server          |
| **Tailwind CSS** | 4.x     | Utility-first CSS Framework      |
| **React Router** | -       | Routing (سيتم إضافته في Phase 3) |

### Development Tools

| الأداة                | الإصدار | الوصف                    |
| --------------------- | ------- | ------------------------ |
| **ESLint**            | 9.x     | JavaScript/JSX Linting   |
| **Prettier**          | 3.4.2   | Code Formatting          |
| **@tailwindcss/vite** | 4.0.0   | Tailwind CSS Vite Plugin |

### Dependencies

- `clsx` - Conditional class merging
- `tailwind-merge` - Smart Tailwind class merging

---

## 🚀 البدء السريع

### المتطلبات الأساسية

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0

### التثبيت

```bash
# الانتقال إلى مجلد المشروع
cd frontend

# تثبيت الاعتمادات
npm install

# تشغيل خادم التطوير
npm run dev
```

سيتم فتح التطبيق تلقائياً على `http://localhost:5173`

---

## 📜 الأوامر المتاحة

| الأمر                  | الوصف                         |
| ---------------------- | ----------------------------- |
| `npm run dev`          | تشغيل خادم التطوير            |
| `npm run build`        | بناء المشروع للإنتاج          |
| `npm run preview`      | معاينة البناء النهائي         |
| `npm run lint`         | فحص الكود باستخدام ESLint     |
| `npm run lint:fix`     | إصلاح أخطاء ESLint تلقائياً   |
| `npm run format`       | تنسيق الكود باستخدام Prettier |
| `npm run format:check` | فحص تنسيق الكود               |

---

## 📁 هيكل المشروع

```
frontend/
├── public/                 # الملفات الثابتة
│   └── vite.svg
│
├── src/
│   ├── assets/            # الأصول الثابتة
│   │   ├── images/        # الصور
│   │   └── icons/         # الأيقونات
│   │
│   ├── components/         # المكونات
│   │   ├── ui/            # مكونات UI مشتركة
│   │   ├── layout/        # مكونات التخطيط
│   │   ├── project/       # مكونات خاصة بالمشاريع
│   │   ├── forms/         # مكونات النماذج
│   │   ├── tables/        # مكونات الجداول
│   │   └── charts/        # مكونات الرسوم البيانية
│   │
│   ├── pages/             # صفحات التطبيق
│   │   ├── auth/          # صفحات المصادقة
│   │   ├── dashboard/     # صفحات لوحة التحكم
│   │   ├── projects/      # صفحات المشاريع
│   │   └── project-workspace/  # صفحات مساحة العمل
│   │
│   ├── routes/            # تكوين المسارات (Phase 3)
│   │
│   ├── hooks/             # Custom React Hooks
│   │   └── index.js
│   │
│   ├── contexts/          # React Contexts
│   │   ├── ThemeContext.jsx  # Context للوضع المظلم
│   │   └── index.js
│   │
│   ├── services/          # خدمات API (مستقبلاً)
│   │   └── index.js
│   │
│   ├── utils/             # دوال مساعدة
│   │   ├── cn.js          # دالة دمج Tailwind classes
│   │   ├── constants.js   # Constants التطبيق
│   │   └── index.js
│   │
│   ├── data/              # بيانات وهمية/ثابتة
│   │   └── index.js
│   │
│   ├── App.jsx            # المكون الرئيسي
│   ├── main.jsx           # نقطة الدخول
│   └── index.css          # الأنماط العامة + Tailwind
│
├── documents/             # الوثائق والخطط
│   ├── MASTER_PLAN.md     # الخطة الرئيسية
│   ├── phase-1-plan.md    # خطة المرحلة الأولى
│   ├── phase-2-plan.md    # خطة المرحلة الثانية
│   └── phase-3-plan.md     # خطة المرحلة الثالثة
│
├── .eslintrc.js           # تكوين ESLint
├── .prettierrc            # تكوين Prettier
├── .prettierignore        # ملفات مستثناة من Prettier
├── .gitignore             # ملفات مستثناة من Git
├── jsconfig.json          # تكوين Path Aliases
├── vite.config.js         # تكوين Vite
├── index.html             # ملف HTML الرئيسي
├── package.json           # معلومات المشروع والاعتمادات
└── README.md              # هذا الملف
```

---

## 🎨 Design System

### الألوان الرئيسية

#### Primary Colors

- **Primary:** `#11d452` - الألوان الأساسية، الحالات النشطة
- **Primary Hover:** `#0eb646` - حالة hover للأزرار الأساسية
- **Primary Content:** `#ffffff` - النص على خلفية أساسية

#### Background Colors

- **Background (Light):** `#f6f8f6` - خلفية الصفحة (الوضع الفاتح)
- **Background (Dark):** `#102216` - خلفية الصفحة (الوضع المظلم)

#### Surface Colors

- **Surface (Light):** `#ffffff` - خلفية البطاقات/الألواح (الوضع الفاتح)
- **Surface (Dark):** `#1c2e22` - خلفية البطاقات/الألواح (الوضع المظلم)

#### Text Colors

- **Text Main:** `#111813` - النص الرئيسي
- **Text Secondary:** `#61896f` - النص الثانوي/المخفي
- **Text Disabled:** `#9ca3af` - النص المعطل

#### Border Colors

- **Border Default:** `#dbe6df` - الحدود الافتراضية
- **Border Dark:** `#2a4234` - الحدود في الوضع المظلم

#### Semantic Colors

- **Success:** `#10b981` / `#34d399` (dark)
- **Warning:** `#f59e0b` / `#fbbf24` (dark)
- **Error:** `#ef4444` / `#f87171` (dark)
- **Info:** `#3b82f6` / `#60a5fa` (dark)

### Typography

- **Font Family:** Inter (Google Fonts)
- **Weights:** 300, 400, 500, 600, 700, 800, 900
- **Icons:** Material Symbols Outlined

### Spacing & Layout

يستخدم المشروع نظام Spacing من Tailwind CSS مع الأنماط التالية:

- Component padding: `p-4` إلى `p-8`
- Gap between items: `gap-2` إلى `gap-6`
- Section margin: `mb-6` إلى `mb-8`

---

## 🌓 Dark Mode

المشروع يدعم الوضع المظلم بشكل كامل عبر `ThemeContext`.

### الاستخدام

```jsx
import { useTheme } from '@/contexts'

function MyComponent() {
  const { isDark, toggleTheme, resolvedTheme, setTheme } = useTheme()

  return (
    <div>
      <p>Current theme: {resolvedTheme}</p>
      <button onClick={toggleTheme}>Switch to {isDark ? 'light' : 'dark'} mode</button>
    </div>
  )
}
```

### الميزات

- ✅ دعم Light/Dark/System modes
- ✅ حفظ التفضيل في localStorage
- ✅ الاستماع لتغييرات System preference
- ✅ تبديل سلس بين الأوضاع
- ✅ تكوين Tailwind CSS v4 للعمل مع class-based dark mode

### التكوين

تم تكوين Tailwind CSS v4 لاستخدام class-based dark mode:

```css
@custom-variant dark (&&:where(.dark, .dark *));
```

---

## 🔗 Path Aliases

المشروع يستخدم Path Aliases لتسهيل الاستيراد:

```jsx
// بدلاً من
import { Button } from '../../../components/ui'

// استخدم
import { Button } from '@/components/ui'
import { cn } from '@/utils'
import { useTheme } from '@/contexts'
```

**التكوين:**

- `@/` → `src/`
- تم تكوينه في `vite.config.js` و `jsconfig.json`

---

## 🧩 المكونات المُنفذة

### Phase 1 - مكتمل ✅

#### Utils

- ✅ `cn()` - دالة لدمج Tailwind CSS classes بذكاء
- ✅ `constants.js` - Constants التطبيق (THEMES, RISK_CATEGORIES, إلخ)

#### Contexts

- ✅ `ThemeContext` - إدارة الوضع المظلم/الفاتح

#### Structure

- ✅ هيكل المجلدات الكامل
- ✅ ملفات Barrel Export (index.js) في جميع المجلدات

### Phase 2 - قادم

- مكونات UI الأساسية (Button, Input, Card, إلخ)
- مكونات Layout (AuthLayout, MainLayout, ProjectLayout)

### Phase 3 - قادم

- React Router
- صفحات المصادقة واللوحة الرئيسية

---

## 📝 Code Style & Conventions

### Naming Conventions

- **Components:** PascalCase (`Button.jsx`, `ProjectCard.jsx`)
- **Hooks:** camelCase with `use` prefix (`useLocalStorage.js`)
- **Utils:** camelCase (`formatters.js`, `cn.js`)
- **Constants:** SCREAMING_SNAKE_CASE أو camelCase

### Formatting

- **ESLint:** مكوّن مع React plugins و Prettier
- **Prettier:** مكوّن مع إعدادات مناسبة
- **Semi:** بدون semicolons
- **Quotes:** Single quotes
- **Tab Width:** 2 spaces

### Import Organization

```jsx
// 1. React
import { useState, useEffect } from 'react'

// 2. Third-party
import { clsx } from 'clsx'

// 3. Internal components
import { Button } from '@/components/ui'

// 4. Hooks
import { useTheme } from '@/contexts'

// 5. Utils
import { cn } from '@/utils'

// 6. Data/Constants
import { THEMES } from '@/utils/constants'
```

---

## 🧪 الاختبارات

### الاختبارات المُنفذة

| الاختبار               | النتيجة               | الحالة |
| ---------------------- | --------------------- | ------ |
| `npm install`          | ✅ نجح                | ✅     |
| `npm run lint`         | ✅ بدون أخطاء         | ✅     |
| `npm run format:check` | ✅ جميع الملفات منسقة | ✅     |
| `npm run build`        | ✅ نجح بدون أخطاء     | ✅     |
| Dark Mode Toggle       | ✅ يعمل بشكل صحيح     | ✅     |
| Path Aliases           | ✅ تعمل بشكل صحيح     | ✅     |

---

## 📚 الوثائق

### الملفات المتاحة

- **MASTER_PLAN.md** - الخطة الرئيسية الشاملة للمشروع
- **phase-1-plan.md** - خطة تفصيلية للمرحلة الأولى (مكتملة)
- **phase-2-plan.md** - خطة المرحلة الثانية (قادمة)
- **phase-3-plan.md** - خطة المرحلة الثالثة (قادمة)
- **PHASE_1_COMPLETION_REPORT.md** - تقرير إنجاز المرحلة الأولى

---

## 🔄 الخطوات التالية

### Phase 2: Component Library

- بناء جميع مكونات UI الأساسية
- إنشاء مكونات Layout
- توثيق المكونات

### Phase 3: Layouts & Routing

- إعداد React Router
- بناء Layout Components
- إنشاء Navigation Structure

---

## 🤝 المساهمة

هذا المشروع جزء من نظام أكبر. يرجى اتباع:

- الخطط الموثقة في مجلد `documents/`
- Code Style المحدد في هذا الملف
- ESLint و Prettier rules

---

## 📄 الترخيص

هذا المشروع مخصص للاستخدام الداخلي في Aga Khan Foundation – Syria.

---

## 📞 الدعم

للمساعدة أو الأسئلة، يرجى الرجوع إلى:

- الوثائق في مجلد `documents/`
- MASTER_PLAN.md للخطة الشاملة
- Phase plans للتفاصيل التفصيلية

---

**آخر تحديث:** 23 يناير 2026  
**الإصدار:** 0.0.0 (Development)  
**المرحلة:** Phase 1 - مكتمل ✅
