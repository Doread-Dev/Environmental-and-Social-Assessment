# ESMS Frontend

**Environmental & Social Management System**  
Aga Khan Foundation – Syria

---

## 📋 نظرة عامة

هذا المشروع هو تطبيق React SPA لإدارة التقييمات البيئية والاجتماعية للمشاريع التنموية. تم تطويره كجزء من نظام إدارة بيئي واجتماعي شامل يتبع سير عمل منظم مع 5 أدوات رئيسية.

### حالة المشروع

**المرحلة الحالية:** ✅ **Phase 5 - مكتمل**  
**التاريخ:** 24 يناير 2026  
**الحالة:** جاهز لبدء Phase 6 (Project Workspace — Assessment)

---

## 🛠️ Tech Stack

### Core Technologies

| التقنية          | الإصدار | الوصف                            |
| ---------------- | ------- | -------------------------------- |
| **React**        | ^19.0.0 | مكتبة UI                         |
| **React DOM**    | ^19.0.0 | React DOM renderer               |
| **Vite**         | ^7.2.4  | Build Tool & Dev Server          |
| **Tailwind CSS** | ^4.0.0  | Utility-first CSS Framework      |
| **React Router** | ^7.0.0  | Client-side routing (Phase 3 ✅) |

### Development Tools

| الأداة                      | الإصدار  | الوصف                    |
| --------------------------- | -------- | ------------------------ |
| **ESLint**                  | ^9.18.0  | JavaScript/JSX Linting   |
| **Prettier**                | ^3.4.2   | Code Formatting          |
| **@tailwindcss/vite**       | ^4.0.0   | Tailwind CSS Vite Plugin |
| **@vitejs/plugin-react**    | ^4.3.4   | Vite React Plugin        |
| **@tailwindcss/forms**      | ^0.5.9   | Tailwind Forms Plugin    |
| **eslint-plugin-prettier**  | ^5.2.1   | ESLint Prettier Plugin   |
| **eslint-config-prettier**  | ^9.1.0   | ESLint Prettier Config   |

### Dependencies

- `clsx` (^2.1.1) - Conditional class merging
- `tailwind-merge` (^2.5.5) - Smart Tailwind class merging

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

### التحقق من التثبيت

بعد التثبيت، تأكد من:

```bash
# التحقق من الإصدارات
node --version  # يجب أن يكون >= 18.0.0
npm --version   # يجب أن يكون >= 9.0.0

# التحقق من التثبيت
npm run lint    # يجب أن يعمل بدون أخطاء
npm run build   # يجب أن يكمل بنجاح
```

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

> **ملاحظات مهمة:**
> - هذا الهيكل يعكس البنية الفعلية الحالية للمشروع
> - بعض المجلدات المذكورة في MASTER_PLAN.md (مثل `assets/`) ستُضاف في المراحل القادمة عند الحاجة
> - مجلد `dist/` يتم إنشاؤه تلقائياً عند تشغيل `npm run build` وهو مستثنى من Git (موجود في `.gitignore`)
> - المجلدات التي تحتوي على `index.js` فقط هي Barrel Exports فارغة حالياً وستُملأ في المراحل القادمة
> - المجلدات المذكورة مع "(Phase X)" أو "(مستقبلاً)" غير موجودة حالياً وستُضاف في المراحل المحددة

```
frontend/
├── public/                 # الملفات الثابتة (يتم نسخها كما هي إلى dist/)
│   └── vite.svg
│
├── dist/                   # مجلد البناء (يُنشأ تلقائياً عند npm run build)
│   ├── assets/            # الملفات المبنية (JS, CSS)
│   └── index.html         # HTML المبنى
│
├── src/
│   ├── components/         # المكونات
│   │   ├── ui/            # مكونات UI مشتركة (22 مكون)
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Icon.jsx
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Textarea.jsx
│   │   │   ├── Select.jsx
│   │   │   ├── Checkbox.jsx
│   │   │   ├── RadioGroup.jsx
│   │   │   ├── FileUpload.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Avatar.jsx
│   │   │   ├── Alert.jsx
│   │   │   ├── Table.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Tooltip.jsx
│   │   │   ├── Dropdown.jsx
│   │   │   ├── Breadcrumb.jsx
│   │   │   ├── ProgressBar.jsx
│   │   │   ├── ProgressStepper.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── Accordion.jsx
│   │   │   └── index.js   # Barrel exports
│   │   ├── layout/        # مكونات التخطيط (Phase 3 ✅)
│   │   │   ├── AuthLayout.jsx      # Layout لصفحات المصادقة
│   │   │   ├── MainLayout.jsx      # Layout للـ Dashboard والمشاريع
│   │   │   ├── ProjectLayout.jsx   # Layout لمساحة عمل المشروع
│   │   │   ├── Header.jsx          # شريط التنقل العلوي
│   │   │   ├── MainSidebar.jsx     # الشريط الجانبي الرئيسي
│   │   │   ├── ProjectSidebar.jsx  # الشريط الجانبي للمشروع
│   │   │   ├── MobileMenu.jsx      # قائمة الهاتف المحمول
│   │   │   └── index.js   # Barrel export
│   │   ├── dashboard/    # مكونات Dashboard (Phase 4 ✅)
│   │   │   ├── MetricCard.jsx              # بطاقة المقاييس الإحصائية
│   │   │   ├── ProjectListItem.jsx        # عنصر قائمة المشروع
│   │   │   ├── WorkflowProgressBar.jsx     # شريط تقدم سير العمل
│   │   │   ├── ScreeningCategoryBadge.jsx # شارة فئة الفرز
│   │   │   ├── ProjectStatusBadge.jsx     # شارة حالة المشروع
│   │   │   └── index.js   # Barrel export
│   │   ├── project/       # مكونات خاصة بالمشاريع (Phase 5 ✅)
│   │   │   ├── ProjectHeader.jsx
│   │   │   ├── ProjectProgressTimeline.jsx
│   │   │   ├── ProjectMetricCard.jsx
│   │   │   ├── ProjectCTACard.jsx
│   │   │   ├── ProjectSiteCard.jsx
│   │   │   └── index.js   # Barrel export
│   │   ├── screening/     # مكونات الفرز (Phase 5 ✅)
│   │   │   ├── ScreeningInfoSection.jsx
│   │   │   ├── RiskCategorySelector.jsx
│   │   │   ├── ImpactSection.jsx
│   │   │   ├── ScreeningSummaryCard.jsx
│   │   │   ├── ApprovalSection.jsx
│   │   │   └── index.js   # Barrel export
│   │   ├── forms/         # مكونات النماذج (Phase 6+)
│   │   │   └── index.js   # Barrel export (فارغ حالياً)
│   │   ├── tables/        # مكونات الجداول (Phase 7+)
│   │   │   └── index.js   # Barrel export (فارغ حالياً)
│   │   └── charts/        # مكونات الرسوم البيانية (مستقبلاً)
│   │       └── index.js   # Barrel export (فارغ حالياً)
│   │
│   ├── pages/             # صفحات التطبيق
│   │   ├── ComponentShowcase.jsx  # صفحة عرض المكونات (Phase 2)
│   │   ├── auth/          # صفحات المصادقة (Phase 4 ✅)
│   │   │   ├── LoginPage.jsx      # صفحة تسجيل الدخول
│   │   │   └── index.js   # Barrel export
│   │   ├── dashboard/     # صفحات لوحة التحكم (Phase 4 ✅)
│   │   │   ├── DashboardPage.jsx # صفحة لوحة التحكم الرئيسية
│   │   │   └── index.js   # Barrel export
│   │   ├── projects/      # صفحات المشاريع (Phase 4 ✅)
│   │   │   ├── ProjectListPage.jsx    # صفحة قائمة المشاريع
│   │   │   ├── ProjectCreatePage.jsx  # صفحة إنشاء مشروع جديد
│   │   │   └── index.js   # Barrel export
│   │   ├── project-workspace/  # صفحات مساحة عمل المشروع (Phase 5 ✅)
│   │   │   ├── overview/      # نظرة عامة على المشروع
│   │   │   │   ├── ProjectOverviewPage.jsx
│   │   │   │   └── index.js
│   │   │   ├── screening/    # الفرز البيئي (Tool 1)
│   │   │   │   ├── ScreeningFormPage.jsx
│   │   │   │   ├── ScreeningSummaryPage.jsx
│   │   │   │   ├── ScreeningRouter.jsx
│   │   │   │   └── index.js
│   │   │   └── index.js   # Barrel export
│   │
│   ├── routes/            # تكوين المسارات (Phase 3 ✅)
│   │   ├── routes.config.js  # Route constants و navigation items
│   │   ├── index.jsx         # Router configuration
│   │   └── ProtectedRoute.jsx # Auth guard (placeholder)
│   │
│   ├── hooks/             # Custom React Hooks (Phase 3 ✅, Phase 5 ✅)
│   │   ├── useProjectContext.js  # Hook للوصول إلى project context
│   │   ├── useScreening.js        # Hook لإدارة حالة الفرز
│   │   └── index.js       # Barrel export
│   │
│   ├── contexts/          # React Contexts
│   │   ├── ThemeContext.jsx  # Context للوضع المظلم (Phase 1 ✅)
│   │   └── index.js       # Barrel export
│   │
│   ├── services/          # خدمات API (مستقبلاً)
│   │   └── index.js       # Barrel export (فارغ حالياً)
│   │
│   ├── utils/             # دوال مساعدة
│   │   ├── cn.js          # دالة دمج Tailwind classes (Phase 1 ✅)
│   │   ├── constants.js   # Constants التطبيق (Phase 1 ✅)
│   │   ├── validators.js  # دوال التحقق من صحة النماذج (Phase 4 ✅)
│   │   ├── formatters.js  # دوال تنسيق البيانات (Phase 4 ✅)
│   │   └── index.js       # Barrel export
│   │
│   ├── data/              # بيانات وهمية/ثابتة (Phase 4 ✅, Phase 5 ✅)
│   │   ├── mockProjects.js        # بيانات المشاريع الوهمية
│   │   ├── mockUsers.js           # بيانات المستخدمين الوهمية
│   │   ├── mockScreening.js       # بيانات الفرز الوهمية
│   │   ├── screeningCategories.js # فئات الفرز (A-F)
│   │   ├── workflowStatuses.js   # حالات سير العمل
│   │   ├── impactCategories.js   # فئات التأثير
│   │   └── index.js       # Barrel export
│   │
│   ├── App.jsx            # المكون الرئيسي (مع RouterProvider)
│   ├── main.jsx           # نقطة الدخول (مع ThemeProvider)
│   └── index.css          # الأنماط العامة + Tailwind + Design Tokens
│
├── documents/             # الوثائق والخطط
│   ├── MASTER_PLAN.md     # الخطة الرئيسية الشاملة (جميع المراحل)
│   ├── phase-1-plan.md    # خطة المرحلة الأولى (مكتملة ✅)
│   ├── phase-2-plan.md    # خطة المرحلة الثانية (مكتملة ✅)
│   ├── PHASE_2_REVIEW.md  # مراجعة شاملة للمرحلة الثانية
│   ├── PHASE_3_REVIEW.md  # مراجعة شاملة للمرحلة الثالثة
│   ├── PHASE_4_PLAN.md    # خطة تفصيلية للمرحلة الرابعة (مكتملة ✅)
│   ├── PHASE_4_REVIEW.md  # مراجعة شاملة للمرحلة الرابعة
│   ├── PHASE_5_PLAN.md    # خطة تفصيلية للمرحلة الخامسة (مكتملة ✅)
│   └── PHASE_5_REVIEW.md  # مراجعة شاملة للمرحلة الخامسة
│
├── .gitignore             # ملفات مستثناة من Git (dist, node_modules, .env, إلخ)
├── .prettierignore        # ملفات مستثناة من Prettier (node_modules, dist, build)
├── .prettierrc            # تكوين Prettier (semi: false, singleQuote: true)
├── eslint.config.js       # تكوين ESLint (مع Prettier integration و React plugins)
├── jsconfig.json          # تكوين Path Aliases للـ IntelliSense (@/ → src/)
├── vite.config.js         # تكوين Vite (React plugin, Tailwind plugin, path aliases)
├── index.html             # ملف HTML الرئيسي (نقطة الدخول)
├── package.json           # معلومات المشروع والاعتمادات والـ scripts
└── README.md              # هذا الملف (التوثيق الرئيسي)
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
- **Text Muted:** `#61896f` - النص المخفي
- **Text Disabled:** `#9ca3af` - النص المعطل

#### Border Colors

- **Border Default:** `#dbe6df` - الحدود الافتراضية
- **Border Dark:** `#2a4234` - الحدود في الوضع المظلم
- **Input Border:** `#dbe6df` - حدود حقول الإدخال

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

تم تكوين Tailwind CSS v4 لاستخدام class-based dark mode في `src/index.css`:

```css
@custom-variant dark (&&:where(.dark, .dark *));
```

يتم تطبيق الوضع المظلم عبر إضافة class `dark` على عنصر `html` من خلال `ThemeContext`.

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
- ✅ `constants.js` - Constants التطبيق (APP_NAME, THEMES, RISK_CATEGORIES, WORKFLOW_STEPS, BREAKPOINTS, ANIMATION)

#### Contexts

- ✅ `ThemeContext` - إدارة الوضع المظلم/الفاتح

#### Structure

- ✅ هيكل المجلدات الكامل
- ✅ ملفات Barrel Export (index.js) في جميع المجلدات

### Phase 2 - مكتمل ✅

#### Helper Components (2 مكونات)

- ✅ `LoadingSpinner` - مكون spinner للتحميل مع 3 أحجام (sm, md, lg)
- ✅ `Icon` - Wrapper للأيقونات Material Symbols مع 4 أحجام (sm, md, lg, xl) و دعم filled variant

#### Form Controls (7 مكونات)

- ✅ `Button` - أزرار مع 5 variants (primary, secondary, outline, ghost, danger) و 3 أحجام
- ✅ `Input` - حقل إدخال مع دعم الأيقونات والتحقق و 3 أحجام
- ✅ `Textarea` - حقل نص متعدد الأسطر مع resize options
- ✅ `Select` - قائمة منسدلة مع placeholder و options
- ✅ `Checkbox` - مربع اختيار مع دعم indeterminate state و 3 أحجام و description
- ✅ `RadioGroup` - مجموعة أزرار اختيار مع Context API و orientation (vertical/horizontal) و description
- ✅ `FileUpload` - رفع الملفات مع drag & drop و validation (maxSize, maxFiles) و file list display

#### Display Components (8 مكونات)

- ✅ `Card` - بطاقة مع Compound pattern (Header, Title, Description, Body, Footer)
- ✅ `Badge` - شارة حالة مع 6 variants (default, success, warning, error, info, primary)
- ✅ `Avatar` - صورة المستخدم مع fallback و status indicator (5 أحجام)
- ✅ `Alert` - تنبيهات مع 4 variants (info, success, warning, error) و dismissible
- ✅ `Table` - جدول مع Compound pattern (Header, Body, Footer, Row, Head, Cell, Caption, Empty)
- ✅ `Modal` - نافذة منبثقة مع Portal و 6 أحجام (sm, md, lg, xl, 2xl, full) و keyboard support (Escape) و overlay click
- ✅ `Tooltip` - تلميح عند hover/focus مع 4 مواضع (top, bottom, left, right) و delay configurable
- ✅ `Dropdown` - قائمة منسدلة للإجراءات مع alignment (left/right) و keyboard support (Escape) و divider support

#### Navigation Components (5 مكونات)

- ✅ `Breadcrumb` - مسار التنقل مع دعم icons و links
- ✅ `ProgressBar` - شريط تقدم خطي مع 5 variants (default, primary, success, warning, error) و 3 أحجام و animated option
- ✅ `ProgressStepper` - مؤشر خطوات متعددة مع horizontal/vertical orientation
- ✅ `Pagination` - ترقيم الصفحات مع smart page numbers (ellipsis) و sibling count و first/last buttons
- ✅ `Accordion` - أقسام قابلة للطي مع Context API و allowMultiple

#### Component Showcase

- ✅ `ComponentShowcase` - صفحة لعرض جميع المكونات مع أمثلة تفاعلية و dark mode toggle
- ✅ تم دمجها في `App.jsx` مباشرة لعرض جميع المكونات
- ✅ تعرض جميع المكونات مع حالات مختلفة (variants, sizes, states)

**المجموع:** 22 مكون UI كامل (20 مكون رئيسي + LoadingSpinner + Icon)

**المعايير المُحققة:**

- ✅ جميع المكونات تدعم Dark Mode
- ✅ توثيق JSDoc كامل لجميع Props
- ✅ دعم Variants متعددة عبر Props
- ✅ Barrel Exports منظم في `index.js`
- ✅ استخدام Compound Components حيث مناسب (Card, Table, Accordion)
- ✅ استخدام forwardRef للمكونات التي تحتاج ref (Button, Input, Textarea, Select, Checkbox)
- ✅ استخدام Context API للمكونات المركبة (RadioGroup, Accordion)
- ✅ Accessibility: ARIA labels و keyboard navigation و focus management
- ✅ Responsive: تعمل على جميع أحجام الشاشات (mobile-first approach)
- ✅ ESLint: لا أخطاء (مكوّن مع React plugins و Prettier integration)
- ✅ Prettier: جميع الملفات منسقة (semi: false, singleQuote: true)
- ✅ Portal usage: Modal و Tooltip يستخدمان createPortal للعرض
- ✅ Error handling: جميع المكونات تدعم error states و validation

### Phase 3 - مكتمل ✅

#### Layout Components (7 مكونات)
- ✅ `AuthLayout` - تخطيط صفحات المصادقة
- ✅ `MainLayout` - تخطيط Dashboard والمشاريع
- ✅ `ProjectLayout` - تخطيط مساحة عمل المشروع
- ✅ `Header` - شريط التنقل العلوي
- ✅ `MainSidebar` - الشريط الجانبي الرئيسي
- ✅ `ProjectSidebar` - الشريط الجانبي للمشروع
- ✅ `MobileMenu` - قائمة الهاتف المحمول

#### Routing System
- ✅ React Router v7 configured
- ✅ 25+ routes defined
- ✅ Route constants file (`routes.config.js`)
- ✅ ProtectedRoute placeholder
- ✅ useProjectContext hook

#### Navigation Features
- ✅ Responsive navigation (mobile menu)
- ✅ Active state styling
- ✅ Expandable menus (Assessment, Annex & Attachments)
- ✅ Step locking logic (temporary disabled - TODO for future)
- ✅ Theme toggle in user card dropdown
- ✅ Unified project header

**المعايير المُحققة:**
- ✅ جميع Layout components تدعم Dark Mode
- ✅ Responsive design (mobile-first)
- ✅ Navigation structure matches static UI
- ✅ Route configuration complete
- ✅ Build و Lint يعملان بدون أخطاء

### Phase 4 - مكتمل ✅

#### Mock Data & Utilities
- ✅ `mockProjects.js` - 9 مشاريع وهمية متوافقة مع Backend Models
- ✅ `mockUsers.js` - 5 مستخدمين + roles + job titles
- ✅ `screeningCategories.js` - فئات الفرز (A-F) + statuses
- ✅ `workflowStatuses.js` - workflow tools + statuses
- ✅ `impactCategories.js` - impact categories + levels
- ✅ `validators.js` - دوال التحقق من صحة النماذج
- ✅ `formatters.js` - دوال تنسيق البيانات

#### Dashboard Components (5 مكونات)
- ✅ `MetricCard` - بطاقة عرض المقاييس الإحصائية
- ✅ `ProjectListItem` - عنصر قائمة المشروع في Dashboard
- ✅ `WorkflowProgressBar` - شريط تقدم سير العمل (S/A/M/R)
- ✅ `ScreeningCategoryBadge` - شارة فئة الفرز (A-F)
- ✅ `ProjectStatusBadge` - شارة حالة المشروع

#### Pages (4 صفحات)
- ✅ `LoginPage` - صفحة تسجيل الدخول مع validation
- ✅ `DashboardPage` - صفحة لوحة التحكم مع Metric Cards و Latest Projects
- ✅ `ProjectListPage` - صفحة قائمة المشاريع مع Search, Filters, Table, Pagination
- ✅ `ProjectCreatePage` - صفحة إنشاء مشروع جديد مع Form Validation

**المعايير المُحققة:**
- ✅ جميع الصفحات تدعم Dark Mode
- ✅ جميع الصفحات Responsive
- ✅ Form Validation مطبق بالكامل
- ✅ Mock Data متوافق مع Backend Models
- ✅ Build و Lint يعملان بدون أخطاء

### Phase 5 - مكتمل ✅

#### Mock Data
- ✅ `mockScreening.js` - بيانات الفرز الوهمية لـ 6 مشاريع

#### Project Components (5 مكونات)
- ✅ `ProjectHeader` - رأس المشروع مع العنوان والحالة والفريق
- ✅ `ProjectProgressTimeline` - الجدول الزمني لتقدم المشروع (4 خطوات)
- ✅ `ProjectMetricCard` - بطاقة مقياس المشروع
- ✅ `ProjectCTACard` - بطاقة الدعوة للإجراء
- ✅ `ProjectSiteCard` - بطاقة موقع المشروع مع الخريطة

#### Screening Components (5 مكونات)
- ✅ `ScreeningInfoSection` - قسم معلومات الفرز
- ✅ `RiskCategorySelector` - محدد فئة الخطر مع RadioGroup
- ✅ `ImpactSection` - قسم التأثيرات المحتملة
- ✅ `ScreeningSummaryCard` - بطاقة ملخص الفرز
- ✅ `ApprovalSection` - قسم الموافقة والتوصيات

#### Pages (3 صفحات)
- ✅ `ProjectOverviewPage` - صفحة نظرة عامة على المشروع
- ✅ `ScreeningFormPage` - نموذج الفرز البيئي مع Form Validation
- ✅ `ScreeningSummaryPage` - صفحة ملخص الفرز والموافقة
- ✅ `ScreeningRouter` - مكون توجيه ذكي بناءً على حالة Screening

#### Hooks
- ✅ `useScreening` - Hook لإدارة حالة الفرز (saveDraft, submit, approve, reject)

**المعايير المُحققة:**
- ✅ جميع الصفحات تدعم Dark Mode
- ✅ جميع الصفحات Responsive
- ✅ Form Validation مطبق بالكامل
- ✅ منطق Flow ذكي بناءً على حالة Screening
- ✅ التصميم مطابق للتصميم الأصلي حرفياً
- ✅ Build و Lint يعملان بدون أخطاء

---

## 📝 Code Style & Conventions

### Naming Conventions

- **Components:** PascalCase (`Button.jsx`, `ProjectCard.jsx`)
- **Hooks:** camelCase with `use` prefix (`useLocalStorage.js`)
- **Utils:** camelCase (`formatters.js`, `cn.js`)
- **Constants:** SCREAMING_SNAKE_CASE أو camelCase

### Formatting

- **ESLint:** مكوّن مع React plugins و Prettier integration
- **Prettier:** مكوّن مع إعدادات مناسبة
- **Semi:** بدون semicolons (`semi: false`)
- **Quotes:** Single quotes (`singleQuote: true`)
- **Tab Width:** 2 spaces (`tabWidth: 2`)
- **Print Width:** 100 characters (`printWidth: 100`)
- **Trailing Comma:** ES5 (`trailingComma: "es5"`)
- **JSX Quotes:** Double quotes (`jsxSingleQuote: false`)

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
| `npm run lint:fix`     | ✅ يعمل بشكل صحيح     | ✅     |
| `npm run format:check` | ✅ جميع الملفات منسقة | ✅     |
| `npm run format`       | ✅ يعمل بشكل صحيح     | ✅     |
| `npm run build`        | ✅ نجح بدون أخطاء     | ✅     |
| `npm run preview`      | ✅ يعمل بشكل صحيح     | ✅     |
| Dark Mode Toggle       | ✅ يعمل بشكل صحيح     | ✅     |
| Path Aliases (@/)      | ✅ تعمل بشكل صحيح     | ✅     |
| Component Showcase     | ✅ يعرض جميع المكونات | ✅     |
| Component Interactions | ✅ تعمل بشكل صحيح     | ✅     |
| Barrel Exports         | ✅ جميع المكونات متاحة | ✅     |
| Responsive Design      | ✅ يعمل على جميع الشاشات | ✅     |

---

## 📚 الوثائق

### الملفات المتاحة

جميع الوثائق موجودة في مجلد `documents/`:

- **MASTER_PLAN.md** - الخطة الرئيسية الشاملة للمشروع (جميع المراحل)
- **PHASE_2_REVIEW.md** - مراجعة شاملة للمرحلة الثانية (مكتملة ✅)
- **PHASE_3_REVIEW.md** - مراجعة شاملة للمرحلة الثالثة (مكتملة ✅)
- **PHASE_4_PLAN.md** - خطة تفصيلية للمرحلة الرابعة (مكتملة ✅)
- **PHASE_4_REVIEW.md** - مراجعة شاملة للمرحلة الرابعة (مكتملة ✅)
- **PHASE_5_PLAN.md** - خطة تفصيلية للمرحلة الخامسة (مكتملة ✅)
- **PHASE_5_REVIEW.md** - مراجعة شاملة للمرحلة الخامسة مع توثيق منطق Flow (مكتملة ✅)

### محتوى الوثائق

- **MASTER_PLAN.md**: يحتوي على نظرة عامة، Tech Stack، هيكل المجلدات، Routing Plan، Component Architecture، Design System، Phased Execution Breakdown
- **PHASE-*-PLAN.md**: تحتوي على خطط تفصيلية مرتبة لكل مرحلة مع قوائم تحقق ومخرجات نهائية
- **PHASE_*_REVIEW.md**: تحتوي على مراجعات شاملة لكل مرحلة مع التحقق من جميع المتطلبات
- **PHASE_5_REVIEW.md**: يحتوي على توثيق شامل لمنطق Flow الصفحات (Screening Workflow) مع Flow Diagrams

---

## 🔄 الخطوات التالية

### Phase 6: Project Workspace — Assessment

- إنشاء AssessmentGatewayPage
- إنشاء AssessmentMetadataPage
- إنشاء AssessmentMethodsPage
- إنشاء AssessmentScoringPage
- إنشاء AssessmentReviewPage
- إنشاء مكونات Assessment domain-specific

---

## 🔄 Screening Workflow Flow

### منطق التوجيه الذكي

`ScreeningRouter` يحدد الصفحة المناسبة بناءً على حالة Screening:

```
/app/projects/:projectId/screening
│
├─→ [لا يوجد screening أو draft]
│   └─→ ScreeningFormPage
│       ├─→ Save Draft → يبقى في Form
│       └─→ Submit → status = 'submitted' → Summary
│
├─→ [status = 'submitted']
│   └─→ ScreeningSummaryPage
│       ├─→ Approve → status = 'approved'
│       └─→ Reject → status = 'rejected'
│
├─→ [status = 'rejected']
│   └─→ ScreeningSummaryPage
│       └─→ Edit → /screening?edit=true → Form
│
└─→ [status = 'approved']
    └─→ ScreeningSummaryPage (read-only)
        └─→ Proceed to Assessment
```

**للمزيد من التفاصيل:** راجع `PHASE_5_REVIEW.md` في مجلد `documents/`

---

## 🎯 استخدام المكونات

### مثال: استخدام Button

```jsx
import { Button, Icon } from '@/components/ui'

function MyComponent() {
  return (
    <div>
      <Button variant="primary" size="md">
        Click me
      </Button>
      <Button variant="outline" leftIcon={<Icon name="add" />}>
        Add Item
      </Button>
      <Button isLoading>Saving...</Button>
    </div>
  )
}
```

### مثال: استخدام Card

```jsx
import { Card } from '@/components/ui'

function MyComponent() {
  return (
    <Card>
      <Card.Header>
        <Card.Title>Project Overview</Card.Title>
        <Card.Description>View project details</Card.Description>
      </Card.Header>
      <Card.Body>
        <p>Content here...</p>
      </Card.Body>
      <Card.Footer>
        <Button>View Details</Button>
      </Card.Footer>
    </Card>
  )
}
```

### مثال: استخدام Input مع Validation

```jsx
import { Input } from '@/components/ui'
import { useState } from 'react'

function MyForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const validateEmail = (value) => {
    if (!value) {
      setError('Email is required')
    } else if (!value.includes('@')) {
      setError('Invalid email format')
    } else {
      setError('')
    }
  }

  return (
    <Input
      label="Email"
      type="email"
      value={email}
      onChange={(e) => {
        setEmail(e.target.value)
        validateEmail(e.target.value)
      }}
      error={error}
      helperText="Enter your email address"
      required
    />
  )
}
```

### مثال: استخدام Table

```jsx
import { Table, Badge } from '@/components/ui'

function MyTable() {
  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.Head>Name</Table.Head>
          <Table.Head>Status</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        <Table.Row>
          <Table.Cell>Project A</Table.Cell>
          <Table.Cell>
            <Badge variant="success">Active</Badge>
          </Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table>
  )
}
```

### مثال: استخدام Project Components

```jsx
import { ProjectHeader, ProjectProgressTimeline, ProjectMetricCard } from '@/components/project'

function ProjectOverview() {
  const project = { /* project data */ }
  
  return (
    <div>
      <ProjectHeader project={project} onEdit={handleEdit} />
      <ProjectProgressTimeline workflow={project.workflow} />
      <ProjectMetricCard
        title="Risk Level"
        value="Category B"
        subtitle="Medium Risk"
        icon="warning"
        iconBgColor="bg-yellow-50"
        iconColor="text-yellow-600"
      />
    </div>
  )
}
```

### مثال: استخدام useScreening Hook

```jsx
import { useScreening } from '@/hooks'
import { useParams } from 'react-router-dom'

function ScreeningForm() {
  const { projectId } = useParams()
  const { screening, isLoading, submit, saveDraft } = useScreening(projectId)
  
  const handleSubmit = async () => {
    const result = await submit(formData)
    if (result.success) {
      // Navigate to summary
    }
  }
  
  if (isLoading) return <Loading />
  
  return <form>...</form>
}
```

---

## 🤝 المساهمة

هذا المشروع جزء من نظام أكبر. يرجى اتباع:

- **الخطط الموثقة** في مجلد `documents/` - اقرأ MASTER_PLAN.md و phase plans قبل البدء
- **Code Style** المحدد في هذا الملف (Naming Conventions، Formatting، Import Organization)
- **ESLint و Prettier rules** - تأكد من تشغيل `npm run lint` و `npm run format` قبل الـ commit
- **استخدام المكونات** من `@/components/ui` بدلاً من إنشاء مكونات جديدة
- **Dark Mode Support** - تأكد من دعم جميع المكونات الجديدة للوضع المظلم
- **Accessibility** - اتبع معايير WCAG 2.1 AA (ARIA labels، keyboard navigation)
- **Documentation** - أضف JSDoc comments لجميع المكونات والدوال الجديدة

---

## 📄 الترخيص

هذا المشروع مخصص للاستخدام الداخلي في Aga Khan Foundation – Syria.

---

## 📞 الدعم

للمساعدة أو الأسئلة، يرجى الرجوع إلى:

- **الوثائق** في مجلد `documents/` - ابدأ بـ MASTER_PLAN.md
- **MASTER_PLAN.md** - للخطة الشاملة والـ Tech Stack والـ Architecture
- **Phase plans** - للتفاصيل التفصيلية لكل مرحلة
- **ComponentShowcase** - شغّل `npm run dev` وافتح `http://localhost:5173` لرؤية جميع المكونات مع أمثلة تفاعلية
- **Barrel Exports** - راجع `src/components/ui/index.js` لرؤية جميع المكونات المتاحة
- **Code Examples** - راجع قسم "🎯 استخدام المكونات" في هذا الملف

---

---

## 📊 إحصائيات المشروع

- **المكونات:** 22 مكون UI + 7 مكونات Layout + 5 مكونات Dashboard + 5 مكونات Project + 5 مكونات Screening = 44 مكون
- **الصفحات:** 1 صفحة showcase + 7 صفحات فعلية (Login, Dashboard, ProjectList, ProjectCreate, ProjectOverview, ScreeningForm, ScreeningSummary) + 12 placeholder pages
- **المسارات:** 25+ route مُعرّف (7 routes نشطة)
- **ملفات البيانات:** 6 ملفات Mock Data متوافقة مع Backend
- **ملفات Utils:** 2 ملفات (validators, formatters)
- **Hooks:** 2 hooks (useProjectContext, useScreening)
- **المراحل المكتملة:** Phase 1 ✅, Phase 2 ✅, Phase 3 ✅, Phase 4 ✅, Phase 5 ✅
- **المراحل القادمة:** Phase 6 (Project Workspace — Assessment)

---

**آخر تحديث:** 24 يناير 2026  
**الإصدار:** 0.0.0 (Development)  
**المرحلة:** Phase 5 - مكتمل ✅  
**Build Status:** ✅ يعمل بدون أخطاء  
**Lint Status:** ✅ لا أخطاء ESLint  
**Format Status:** ✅ جميع الملفات منسقة

---

## 📌 ملاحظات مهمة للمطورين

### ⚠️ قرارات مهمة تم الاتفاق عليها

1. **Step Locking Logic:**
   - جميع Workflow Tools (Screening, Assessment, SEMP, Monitoring) مفتوحة حالياً
   - تم تعطيل منطق القفل مؤقتاً مع تعليقات TODO
   - عند إضافة المنطق التجاري، يجب إعادة تفعيل القفل بناءً على الإكمال المتسلسل

2. **Navigation Structure:**
   - Assessment يحتوي فقط على: Metadata, Methods, Scoring
   - Annex & Attachments يحتوي على: Attachments (files), Annex
   - التوسع التلقائي يحدث فقط عند زيارة صفحات الأطفال يدوياً

3. **Header Structure:**
   - ProjectLayout له هيدر موحد خاص (ESMS System logo على اليسار)
   - Theme Toggle موجود في User Card Dropdown (وليس في Header)
   - كل صفحة project يمكن أن يكون لها هيدر خاص بناءً على المتطلبات

4. **Mobile Menu:**
   - Project variant يعرض "Back to Dashboard" بدلاً من الشعار
   - Theme Toggle موجود في User Card Dropdown

### 📚 مراجع مهمة

- **PHASE_5_REVIEW.md** - مراجعة شاملة للمرحلة الخامسة مع توثيق منطق Flow الصفحات ⭐
- **PHASE_5_PLAN.md** - خطة تفصيلية للمرحلة الخامسة (مكتملة ✅)
- **PHASE_4_REVIEW.md** - مراجعة شاملة للمرحلة الرابعة مع جميع التفاصيل
- **PHASE_4_PLAN.md** - خطة تفصيلية للمرحلة الرابعة (مكتملة ✅)
- **PHASE_3_REVIEW.md** - مراجعة شاملة مع جميع التعديلات والاتفاقيات
- **PHASE_2_REVIEW.md** - مراجعة شاملة للمرحلة الثانية
- **MASTER_PLAN.md** - الخطة الرئيسية الشاملة (محدثة مع Phase 5 ✅)
