# 📖 ESMS Design System - Style Guide
## دستور الستايلات الموحد للمشروع

> **هذا الملف هو المرجع الرسمي لجميع الستايلات المستخدمة في المشروع.**
> يجب على أي Agent يعمل على الملفات اتباع هذا الدستور بدقة.

---

## 📁 الملفات المشمولة بهذا الدستور

هذا الدستور يطبق على **جميع ملفات المشروع** في:

```
src/
├── components/
│   ├── ui/           ← مكونات UI الأساسية
│   ├── layout/       ← مكونات التخطيط
│   ├── project/      ← مكونات المشروع
│   ├── dashboard/    ← مكونات لوحة التحكم
│   ├── screening/    ← مكونات Screening
│   └── assessment/   ← مكونات Assessment
├── pages/
│   ├── auth/         ← صفحات المصادقة
│   ├── dashboard/    ← صفحات لوحة التحكم
│   └── project-workspace/
│       ├── screening/ ← صفحات Screening
│       └── assessment/ ← صفحات Assessment
└── hooks/            ← Custom Hooks
```

---

## 🎨 Design Tokens (متغيرات CSS)

### الألوان الأساسية (Primary)
```css
--color-primary: #11d452          /* الأخضر الرئيسي */
--color-primary-hover: #0eb646    /* hover state */
--color-primary-content: #ffffff  /* النص على الأخضر */
```

### ألوان الخلفية (Background)
```css
--color-background: #f6f8f6       /* Light Mode */
--color-background-dark: #102216  /* Dark Mode */
```

### ألوان السطح (Surface)
```css
--color-surface: #ffffff          /* Light Mode - الكروت والـ Containers */
--color-surface-dark: #1c2e22     /* Dark Mode - الكروت والـ Containers */
--color-card-dark: #152a1d        /* Dark Mode - البطاقات الفرعية */
```

### ألوان النص (Text)
```css
--color-text-main: #111813        /* النص الرئيسي */
--color-text-secondary: #61896f   /* النص الثانوي */
--color-text-muted: #61896f       /* النص الخافت */
--color-text-disabled: #9ca3af    /* النص المعطل */
```

### ألوان الحدود (Borders)
```css
--color-border-default: #dbe6df   /* Light Mode */
--color-border-dark: #2a4234      /* Dark Mode */
--color-input-border: #dbe6df     /* حدود الـ inputs في Light */
--color-input-border-dark: #2a4234 /* حدود الـ inputs في Dark */
```

### ألوان الحالات (Semantic)
```css
--color-success: #10b981          /* نجاح */
--color-warning: #f59e0b          /* تحذير */
--color-error: #ef4444            /* خطأ */
--color-info: #3b82f6             /* معلومات */
```

---

## 📏 Tailwind Classes المعتمدة

### 1. ألوان الخلفية ✅

| الاستخدام | Light Mode | Dark Mode |
|-----------|------------|-----------|
| **صفحة كاملة** | `bg-background` | `dark:bg-background-dark` |
| **كارت / Container** | `bg-surface` أو `bg-white` | `dark:bg-surface-dark` |
| **كارت فرعي** | `bg-white` | `dark:bg-[#152a1d]` |
| **Header القسم** | `bg-gray-50/50` | `dark:bg-white/5` |
| **Input معطل** | `bg-gray-50/50` | `dark:bg-white/5` |

### 2. ألوان النص ✅

| الاستخدام | Light Mode | Dark Mode |
|-----------|------------|-----------|
| **نص رئيسي** | `text-text-main` | `dark:text-white` |
| **نص ثانوي** | `text-text-secondary` | `dark:text-gray-400` |
| **نص خافت** | `text-text-muted` | `dark:text-gray-500` |
| **نص معطل** | `text-text-disabled` | `dark:text-gray-500` |
| **لون Primary** | `text-primary` | `text-primary` |

### 3. ألوان الحدود ✅

| الاستخدام | Light Mode | Dark Mode |
|-----------|------------|-----------|
| **حد كارت** | `border-border-default` | `dark:border-border-dark` |
| **حد input** | `border-border-default` | `dark:border-border-dark` |
| **حد قسم** | `border-border-default` | `dark:border-border-dark` |
| **حد منقط** | `border-dashed border-border-default` | `dark:border-border-dark` |

### 4. Shadows ✅

| الاستخدام | Class |
|-----------|-------|
| **كارت عادي** | `shadow-sm` |
| **كارت مرفوع** | `shadow-md` |
| **زر Primary** | `shadow-[0_4px_14px_0_rgba(17,212,82,0.3)]` |
| **Footer ثابت** | `shadow-lg` |

### 5. Border Radius ✅

| الاستخدام | Class |
|-----------|-------|
| **كارت** | `rounded-xl` |
| **زر** | `rounded-lg` |
| **input** | `rounded-lg` |
| **badge صغير** | `rounded-full` |
| **أيقونة** | `rounded-lg` |

---

## 🧩 الأنماط القياسية (Standard Patterns)

### 1. الكارت (Card Pattern)
```jsx
// ✅ الطريقة الصحيحة
<section className="bg-white dark:bg-[#152a1d] rounded-xl shadow-sm border border-border-default dark:border-border-dark overflow-hidden">
  {/* Header */}
  <div className="px-6 py-4 border-b border-border-default dark:border-border-dark bg-gray-50/50 dark:bg-white/5">
    <h3 className="font-bold text-lg text-text-main dark:text-white">
      Section Title
    </h3>
  </div>
  {/* Body */}
  <div className="p-6">
    {/* Content */}
  </div>
</section>
```

### 2. الزر الأساسي (Primary Button)
```jsx
// ✅ الطريقة الصحيحة
<button className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-md transition-colors">
  Button Text
</button>
```

### 3. الزر الثانوي (Secondary Button)
```jsx
// ✅ الطريقة الصحيحة
<button className="px-6 py-2.5 rounded-lg border border-border-default dark:border-border-dark text-text-main dark:text-white font-medium hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
  Button Text
</button>
```

### 4. الـ Input
```jsx
// ✅ الطريقة الصحيحة
<input
  className="w-full rounded-lg border border-border-default dark:border-border-dark bg-white dark:bg-[#102216] text-text-main dark:text-white focus:ring-primary focus:border-primary px-3 py-2.5 text-sm"
  type="text"
/>
```

### 5. الـ Input للقراءة فقط (Read-only)
```jsx
// ✅ الطريقة الصحيحة
<input
  className="w-full bg-gray-50/50 dark:bg-white/5 border border-border-default dark:border-border-dark rounded-lg px-4 py-2.5 text-text-main dark:text-white text-sm focus:outline-none cursor-not-allowed font-medium"
  readOnly
  type="text"
/>
```

### 6. الـ Textarea
```jsx
// ✅ الطريقة الصحيحة
<textarea
  className="w-full rounded-lg border border-border-default dark:border-border-dark bg-white dark:bg-[#102216] text-text-main dark:text-white focus:ring-primary focus:border-primary px-3 py-2.5 text-sm"
  rows={4}
/>
```

### 7. الـ Label
```jsx
// ✅ الطريقة الصحيحة
<label className="block text-sm font-medium text-text-main dark:text-gray-200 mb-2">
  Label Text <span className="text-red-500">*</span>
</label>
```

### 8. رسالة الخطأ (Error Message)
```jsx
// ✅ الطريقة الصحيحة
<p className="text-sm text-red-500 mt-1 flex items-center gap-1">
  <span className="material-symbols-outlined text-base">error</span>
  Error message here
</p>
```

### 9. Loading Spinner
```jsx
// ✅ الطريقة الصحيحة
<div className="flex items-center justify-center min-h-[400px]">
  <div className="flex flex-col items-center gap-4">
    <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    <p className="text-text-secondary dark:text-gray-400 text-sm">Loading...</p>
  </div>
</div>
```

### 10. Status Badge
```jsx
// ✅ Pending / Submitted
<span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800">
  pending
</span>

// ✅ Approved
<span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
  approved
</span>

// ✅ Rejected
<span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800">
  rejected
</span>

// ✅ Draft
<span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-700">
  draft
</span>
```

---

## ❌ أنماط مرفوضة (DO NOT USE)

### ألوان مرفوضة
```jsx
// ❌ لا تستخدم
dark:bg-gray-800        // استخدم dark:bg-surface-dark أو dark:bg-[#152a1d]
dark:bg-gray-900        // استخدم dark:bg-background-dark
border-gray-200         // استخدم border-border-default
dark:border-gray-700    // استخدم dark:border-border-dark
bg-gray-100             // استخدم bg-gray-50/50
dark:bg-gray-700        // استخدم dark:bg-white/5
```

### أنماط مختلقة
```jsx
// ❌ لا تستخدم أبداً
bg-[#1a1a1a]           // ألوان عشوائية
dark:bg-[#2d2d2d]      // ألوان غير موجودة في النظام
border-[#555]          // حدود مخترعة
text-[#888]            // ألوان نص غير موحدة
```

---

## 🔧 دالة `cn()` للـ Classes

استخدم دائماً دالة `cn()` من `@/utils/cn` لدمج الـ classes:

```jsx
import { cn } from '@/utils/cn'

// ✅ الطريقة الصحيحة
<div className={cn(
  'base-classes',
  'more-classes',
  condition && 'conditional-classes'
)}>
```

---

## 📐 التباعد (Spacing)

### Padding
| الاستخدام | Class |
|-----------|-------|
| **كارت body** | `p-6` |
| **كارت header** | `px-6 py-4` |
| **زر** | `px-6 py-2.5` |
| **container رئيسي** | `p-4 sm:p-6 lg:p-8` |

### Gap
| الاستخدام | Class |
|-----------|-------|
| **بين الأقسام** | `gap-8` |
| **داخل القسم** | `gap-6` |
| **بين العناصر** | `gap-4` |
| **بين الأيقونة والنص** | `gap-2` |

---

## 🖋️ Typography

### العناوين
| المستوى | Class |
|---------|-------|
| **H1** | `text-3xl font-bold text-text-main dark:text-white` |
| **H2** | `text-2xl font-bold text-text-main dark:text-white` |
| **H3** | `text-lg font-bold text-text-main dark:text-white` |
| **Subtitle** | `text-sm text-text-secondary dark:text-gray-400` |

### النص العادي
| النوع | Class |
|-------|-------|
| **عادي** | `text-sm text-text-main dark:text-white` |
| **ثانوي** | `text-sm text-text-secondary dark:text-gray-400` |
| **صغير** | `text-xs text-text-secondary dark:text-gray-400` |

---

## 📦 مكونات UI الموجودة

استخدم المكونات الموجودة في `@/components/ui` بدلاً من إنشاء مكونات جديدة:

```jsx
import { 
  Button,
  Card,
  Input,
  Textarea,
  Badge,
  Alert,
  Icon,
  LoadingSpinner,
  // ... المزيد
} from '@/components/ui'
```

### Card Component
```jsx
<Card>
  <Card.Header>
    <Card.Title>Title</Card.Title>
    <Card.Description>Description</Card.Description>
  </Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer>Actions</Card.Footer>
</Card>
```

---

## 📝 قواعد إضافية

### 1. الـ Icons
- استخدم **Material Symbols** فقط
- الـ class الأساسي: `material-symbols-outlined`
- أحجام: `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`

```jsx
<span className="material-symbols-outlined text-lg text-primary">check_circle</span>
```

### 2. الـ Transitions
```jsx
// ✅ للتأثيرات
transition-colors    // لتغيير الألوان
transition-all       // لجميع الخصائص
duration-200         // المدة الافتراضية
```

### 3. الـ Focus States
```jsx
// ✅ للـ inputs والـ buttons
focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
```

### 4. الـ Disabled States
```jsx
// ✅ للعناصر المعطلة
disabled:opacity-50 disabled:cursor-not-allowed
```

---

## ✅ Checklist للمراجعة

قبل commit أي ملف، تأكد من:

- [ ] لا توجد ألوان hardcoded (مثل `#xxx` أو `rgb()`)
- [ ] جميع الألوان تستخدم design tokens
- [ ] Dark mode يعمل بشكل صحيح
- [ ] استخدام `cn()` لدمج الـ classes
- [ ] لا توجد classes مخترعة
- [ ] استخدام المكونات الموجودة في `ui/`
- [ ] الـ spacing متسق مع الباقي

---

## 🔄 آخر تحديث

- **التاريخ**: 2026-01-30
- **المراجع**: Phase 1-5 files
- **المسؤول**: AI Agent

---

> **ملاحظة هامة**: أي تغيير على هذا الدستور يجب أن يتم بموافقة ومراجعة شاملة للتأكد من التوافق مع جميع الملفات.
