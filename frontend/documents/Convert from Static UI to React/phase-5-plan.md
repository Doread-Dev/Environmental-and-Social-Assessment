# Phase 5: Project Workspace — Overview & Screening
## خطة تنفيذ تفصيلية
## تاريخ الإنشاء: 24 يناير 2026

---

## 📋 نظرة عامة

### الأهداف الرئيسية
- إنشاء صفحة نظرة عامة على المشروع (Project Overview)
- إنشاء نموذج الفرز البيئي (Environmental Screening Form)
- إنشاء صفحة ملخص الفرز والموافقة (Screening Summary & Approval)
- بناء المكونات الخاصة بالمجال (Domain-specific Components)

### المتطلبات المُسبقة
- ✅ Phase 1: Project Setup & Build Pipeline (مكتمل)
- ✅ Phase 2: Component Library - UI Kit (مكتمل)
- ✅ Phase 3: Layout Components & Routing (مكتمل)
- ✅ Phase 4: Auth & Dashboard Domain (مكتمل)

### الملفات المرجعية (Static HTML)
| الملف | الصفحة المقابلة |
|-------|-----------------|
| `8.ProjectOverview.html` | `ProjectOverviewPage.jsx` |
| `9.EnvironmentalScreening.html` | `ScreeningFormPage.jsx` |
| `10.ScreeningSummary.html` | `ScreeningSummaryPage.jsx` |

### Backend Model Reference
```javascript
// backend/src/models/screening.model.js
{
  project: ObjectId (ref: 'Project'),      // المشروع
  category_code: enum ['A','B','C','D','E','F'],  // فئة الخطر
  category_reason: String (required),       // سبب اختيار الفئة
  potential_negative: String,               // التأثيرات السلبية المحتملة
  potential_positive: String,               // التأثيرات الإيجابية المحتملة
  approved_by: ObjectId (ref: 'User'),     // المعتمد من قبل
  recommendations: String,                  // التوصيات
  screening_date: Date,                     // تاريخ الفرز
  status: enum ['draft','submitted','approved','rejected']
}
```

---

## 📁 هيكل الملفات المطلوب إنشاؤها

```
src/
├── pages/
│   └── project-workspace/
│       ├── overview/
│       │   ├── ProjectOverviewPage.jsx    ← جديد
│       │   └── index.js                   ← جديد
│       │
│       ├── screening/
│       │   ├── ScreeningFormPage.jsx      ← جديد
│       │   ├── ScreeningSummaryPage.jsx   ← جديد
│       │   └── index.js                   ← جديد
│       │
│       └── index.js                       ← جديد (barrel export)
│
├── components/
│   └── project/                           ← تحديث المجلد الموجود
│       ├── ProjectProgressTimeline.jsx    ← جديد
│       ├── ProjectMetricCard.jsx          ← جديد
│       ├── ProjectCTACard.jsx             ← جديد
│       ├── ProjectHeader.jsx              ← جديد
│       ├── ProjectSiteCard.jsx            ← جديد
│       └── index.js                       ← تحديث
│
│   └── screening/                         ← مجلد جديد
│       ├── ScreeningInfoSection.jsx       ← جديد
│       ├── RiskCategorySelector.jsx       ← جديد
│       ├── ImpactSection.jsx              ← جديد
│       ├── ScreeningSummaryCard.jsx       ← جديد
│       ├── ApprovalSection.jsx            ← جديد
│       └── index.js                       ← جديد
│
├── data/
│   └── mockScreening.js                   ← جديد (بيانات الفرز الوهمية)
│
└── hooks/
    └── useScreening.js                    ← جديد (إدارة حالة الفرز)
```

---

## 🔢 ترتيب التنفيذ

| المرحلة | الوصف | عدد الملفات |
|---------|-------|-------------|
| 5.1 | Mock Data للفرز | 1 |
| 5.2 | مكونات المشروع (Project Components) | 6 |
| 5.3 | صفحة نظرة عامة على المشروع | 2 |
| 5.4 | مكونات الفرز (Screening Components) | 6 |
| 5.5 | صفحة نموذج الفرز | 2 |
| 5.6 | صفحة ملخص الفرز | 2 |
| 5.7 | التكامل والاختبار | - |

---

## 📝 المرحلة 5.1: Mock Data للفرز

### 5.1.1 إنشاء ملف `src/data/mockScreening.js`

**الوصف:** بيانات الفرز الوهمية المرتبطة بالمشاريع

**متوافق مع:** `backend/src/models/screening.model.js`

```javascript
/**
 * Mock Screening Data
 * متوافق مع backend/src/models/screening.model.js
 */

import { mockProjects } from './mockProjects'
import { mockUsers } from './mockUsers'

/**
 * بيانات الفرز الوهمية لكل مشروع
 * كل مشروع لديه سجل فرز واحد
 */
export const mockScreenings = [
  {
    _id: '507f1f77bcf86cd799439021',
    project: '507f1f77bcf86cd799439011', // Water Sanitation Phase II
    category_code: 'B',
    category_reason: 'The project involves moderate construction activities for water treatment facilities. The environmental footprint is limited to the designated construction site. No protected areas or endangered species are affected. Standard mitigation measures will be applied during construction phase.',
    potential_negative: '- Temporary noise pollution during construction affecting nearby residential areas\n- Dust generation from excavation work\n- Potential soil erosion if proper drainage not maintained\n- Minor disturbance to local wildlife during construction',
    potential_positive: '- Improved access to clean water for 500+ households\n- Reduction in waterborne diseases\n- Enhanced sanitation infrastructure\n- Job creation for local community during construction\n- Long-term health benefits for the community',
    approved_by: '507f1f77bcf86cd799439001', // Sarah Jenkins
    recommendations: 'Proceed with environmental assessment (Tool 2). Implement dust suppression measures during dry season. Schedule noisy activities during appropriate hours.',
    screening_date: '2024-01-20T00:00:00.000Z',
    status: 'approved',
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-20T14:30:00.000Z'
  },
  {
    _id: '507f1f77bcf86cd799439022',
    project: '507f1f77bcf86cd799439012', // Community Solar Grid
    category_code: 'C',
    category_reason: 'Solar panel installation on existing structures with minimal ground disturbance. No land clearing required. Grid infrastructure follows existing utility corridors.',
    potential_negative: '- Minor visual impact on landscape\n- Temporary traffic disruption during installation',
    potential_positive: '- Clean renewable energy for 200 households\n- Reduction in carbon emissions\n- Lower electricity costs for community\n- Educational opportunities about renewable energy',
    approved_by: null,
    recommendations: null,
    screening_date: null,
    status: 'draft',
    createdAt: '2024-02-20T08:00:00.000Z',
    updatedAt: '2024-02-20T08:00:00.000Z'
  },
  {
    _id: '507f1f77bcf86cd799439023',
    project: '507f1f77bcf86cd799439013', // Reforestation Initiative
    category_code: 'A',
    category_reason: 'Large-scale reforestation project in degraded forest areas adjacent to protected national park. Project involves significant land modification, introduction of tree species, and long-term ecosystem changes. Requires comprehensive environmental impact assessment due to proximity to protected areas.',
    potential_negative: '- Risk of introducing non-native species if not properly managed\n- Temporary habitat disruption during site preparation\n- Potential impact on existing vegetation\n- Water table changes from large-scale planting\n- Risk of fire during dry season',
    potential_positive: '- Restoration of 5,000 hectares of degraded forest\n- Carbon sequestration and climate mitigation\n- Habitat creation for endangered wildlife\n- Watershed protection\n- Community employment and sustainable livelihood\n- Biodiversity enhancement\n- Soil erosion prevention',
    approved_by: '507f1f77bcf86cd799439002', // Ahmed Hassan
    recommendations: 'Full Environmental Impact Assessment (EIA) required before implementation. Engage local communities in planning. Establish fire management protocols. Use only native species from certified nurseries.',
    screening_date: '2023-01-10T00:00:00.000Z',
    status: 'approved',
    createdAt: '2022-12-15T09:00:00.000Z',
    updatedAt: '2023-01-10T16:00:00.000Z'
  },
  {
    _id: '507f1f77bcf86cd799439024',
    project: '507f1f77bcf86cd799439014', // Urban Waste Management
    category_code: 'B',
    category_reason: 'Waste collection and recycling program in urban areas. Limited infrastructure development. Main activities involve equipment deployment and community engagement.',
    potential_negative: '- Odor issues if waste collection is delayed\n- Traffic congestion during collection hours\n- Risk of improper waste handling',
    potential_positive: '- Cleaner urban environment\n- Reduction in landfill waste\n- Revenue from recyclables\n- Health improvements from proper waste management',
    approved_by: null,
    recommendations: 'Additional information required on waste processing facility location and community consultation results.',
    screening_date: '2024-06-10T00:00:00.000Z',
    status: 'rejected',
    createdAt: '2024-05-15T11:00:00.000Z',
    updatedAt: '2024-06-10T10:00:00.000Z'
  },
  {
    _id: '507f1f77bcf86cd799439025',
    project: '507f1f77bcf86cd799439015', // Clean Water Initiative
    category_code: 'C',
    category_reason: 'Water purification and distribution system using existing infrastructure. Minimal new construction required. Technology installation in designated areas only.',
    potential_negative: '- Brief service interruption during system installation\n- Minor excavation for pipe connections',
    potential_positive: '- Safe drinking water for peri-urban settlements\n- Reduced waterborne diseases\n- Lower healthcare costs for families\n- Improved quality of life',
    approved_by: '507f1f77bcf86cd799439003', // Maria Santos
    recommendations: 'Proceed with simplified assessment. Coordinate installation schedule with local authorities.',
    screening_date: '2024-02-05T00:00:00.000Z',
    status: 'approved',
    createdAt: '2024-01-20T07:00:00.000Z',
    updatedAt: '2024-02-05T12:00:00.000Z'
  },
  {
    _id: '507f1f77bcf86cd799439029',
    project: '507f1f77bcf86cd799439019', // Sustainable Farming
    category_code: 'C',
    category_reason: 'Training and infrastructure for sustainable agricultural practices. Uses existing farmland with no expansion into new areas. Promotes organic farming methods.',
    potential_negative: '- Transition period may temporarily reduce yields\n- Learning curve for new techniques',
    potential_positive: '- Improved soil health\n- Reduced chemical inputs\n- Higher quality produce\n- Sustainable livelihoods for farmers\n- Market access for organic products',
    approved_by: '507f1f77bcf86cd799439001',
    recommendations: 'Proceed to assessment. Document baseline conditions. Establish farmer field schools.',
    screening_date: '2024-03-10T00:00:00.000Z',
    status: 'approved',
    createdAt: '2024-02-15T09:00:00.000Z',
    updatedAt: '2024-03-10T14:00:00.000Z'
  }
]

/**
 * الحصول على بيانات الفرز لمشروع معين
 * @param {string} projectId - معرف المشروع
 * @returns {Object|null}
 */
export function getScreeningByProjectId(projectId) {
  return mockScreenings.find(s => s.project === projectId) || null
}

/**
 * الحصول على بيانات الفرز مع بيانات المشروع والمستخدم
 * @param {string} projectId - معرف المشروع
 * @returns {Object|null}
 */
export function getScreeningWithDetails(projectId) {
  const screening = getScreeningByProjectId(projectId)
  if (!screening) return null

  const project = mockProjects.find(p => p._id === screening.project)
  const approver = screening.approved_by 
    ? mockUsers.find(u => u._id === screening.approved_by)
    : null

  return {
    ...screening,
    projectDetails: project,
    approverDetails: approver
  }
}

/**
 * بيانات فرز فارغة لمشروع جديد
 * @param {string} projectId - معرف المشروع
 * @returns {Object}
 */
export function createEmptyScreening(projectId) {
  return {
    _id: null,
    project: projectId,
    category_code: null,
    category_reason: '',
    potential_negative: '',
    potential_positive: '',
    approved_by: null,
    recommendations: '',
    screening_date: null,
    status: 'draft'
  }
}
```

### 5.1.2 تحديث ملف `src/data/index.js`

**إضافة التصديرات الجديدة:**

```javascript
// ... التصديرات الموجودة ...

// Screening Data
export {
  mockScreenings,
  getScreeningByProjectId,
  getScreeningWithDetails,
  createEmptyScreening
} from './mockScreening'
```

---

## 📝 المرحلة 5.2: مكونات المشروع (Project Components)

### 5.2.1 إنشاء `src/components/project/ProjectHeader.jsx`

**الوصف:** رأس المشروع مع العنوان والحالة والفريق

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `project` | object | ✅ | بيانات المشروع |
| `showEditButton` | boolean | ❌ | عرض زر التعديل (default: true) |
| `onEdit` | function | ❌ | callback عند النقر على التعديل |

**البنية المطلوبة:**

```jsx
/**
 * ProjectHeader Component
 * رأس المشروع مع معلومات أساسية
 * 
 * Features:
 * - عنوان المشروع مع badge الحالة
 * - الموقع والتاريخ
 * - أعضاء الفريق (Avatars)
 * - زر التعديل
 */

// يعتمد على:
// - Badge component
// - Avatar component
// - Button component
// - Icon component
// - formatDateRange من utils/formatters

// التصميم من: 8.ProjectOverview.html (السطور 179-209)
```

**الحالات المختلفة:**
- `Active` - أخضر
- `Draft` - رمادي
- `In Progress` - أزرق
- `Completed` - أخضر غامق
- `Needs Action` - أحمر

---

### 5.2.2 إنشاء `src/components/project/ProjectProgressTimeline.jsx`

**الوصف:** الجدول الزمني لتقدم المشروع (الخطوات الأربع)

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `workflow` | object | ✅ | حالة كل خطوة |
| `showLabels` | boolean | ❌ | عرض التسميات (default: true) |
| `showPercentage` | boolean | ❌ | عرض النسبة المئوية (default: true) |
| `size` | 'sm' \| 'md' \| 'lg' | ❌ | الحجم (default: 'md') |

**الخطوات:**
1. **Screening** - Tool 1
2. **Assessment** - Tool 2  
3. **SEMP** - Tools 3 & 4
4. **Monitoring** - Tool 5

**حالات كل خطوة:**
```javascript
const stepStates = {
  completed: {
    icon: 'check',
    bgColor: 'bg-primary',
    textColor: 'text-primary',
    label: 'Completed'
  },
  in_progress: {
    icon: 'edit_document', // animated pulse
    bgColor: 'bg-white border-2 border-primary',
    textColor: 'text-primary',
    label: 'In Progress'
  },
  pending: {
    icon: null, // show number
    bgColor: 'bg-gray-100 border-2 border-gray-300',
    textColor: 'text-gray-500',
    label: 'Pending'
  },
  locked: {
    icon: 'lock',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-400',
    label: 'Locked'
  },
  needs_action: {
    icon: 'priority_high',
    bgColor: 'bg-red-500',
    textColor: 'text-red-500',
    label: 'Needs Action'
  }
}
```

**التصميم من:** 8.ProjectOverview.html (السطور 211-267)

**حساب النسبة المئوية:**
```javascript
function calculateProgress(workflow) {
  const steps = ['screening', 'assessment', 'semp', 'monitoring']
  const completedSteps = steps.filter(step => {
    const status = workflow[step]?.status
    return status === 'approved' || status === 'completed'
  }).length
  
  // نضيف نصف خطوة إذا كانت هناك خطوة قيد التنفيذ
  const inProgressSteps = steps.filter(step => {
    return workflow[step]?.status === 'in_progress'
  }).length
  
  return Math.round(((completedSteps + (inProgressSteps * 0.5)) / steps.length) * 100)
}
```

---

### 5.2.3 إنشاء `src/components/project/ProjectMetricCard.jsx`

**الوصف:** بطاقة مقياس المشروع (Risk Level, Activities, Timeframe)

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | string | ✅ | عنوان المقياس |
| `value` | string \| number | ✅ | القيمة |
| `subtitle` | string | ❌ | نص فرعي |
| `icon` | string | ✅ | اسم الأيقونة |
| `iconBgColor` | string | ❌ | لون خلفية الأيقونة |
| `iconColor` | string | ❌ | لون الأيقونة |

**أمثلة من التصميم:**

| المقياس | الأيقونة | اللون | القيمة | الفرعي |
|---------|----------|-------|--------|--------|
| Risk Level | warning | yellow | Category B | Medium Risk |
| Activities | assessment | blue | 4 Activities | From Tool 3 |
| Timeframe | event | purple | 24 Months | - |

**التصميم من:** 8.ProjectOverview.html (السطور 272-306)

---

### 5.2.4 إنشاء `src/components/project/ProjectCTACard.jsx`

**الوصف:** بطاقة الدعوة للإجراء (Next Step CTA)

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | string | ✅ | عنوان الإجراء |
| `description` | string | ✅ | وصف الإجراء |
| `buttonText` | string | ✅ | نص الزر |
| `buttonIcon` | string | ❌ | أيقونة الزر |
| `onClick` | function | ✅ | callback عند النقر |
| `variant` | 'primary' \| 'secondary' | ❌ | نوع البطاقة |

**التصميم:**
- خلفية متدرجة (gradient)
- تأثير ضبابي في الزاوية
- زر أخضر مع ظل

**التصميم من:** 8.ProjectOverview.html (السطور 308-320)

---

### 5.2.5 إنشاء `src/components/project/ProjectSiteCard.jsx`

**الوصف:** بطاقة موقع المشروع مع الخريطة

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `location` | string | ✅ | اسم الموقع |
| `areaName` | string | ❌ | اسم المنطقة |
| `areaSize` | string | ❌ | مساحة المنطقة |
| `mapImageUrl` | string | ❌ | رابط صورة الخريطة |
| `onExpand` | function | ❌ | callback عند توسيع الخريطة |

**التصميم من:** 8.ProjectOverview.html (السطور 324-339)

---

### 5.2.6 تحديث `src/components/project/index.js`

```javascript
// Project Components Barrel Export

export { default as ProjectHeader } from './ProjectHeader'
export { default as ProjectProgressTimeline } from './ProjectProgressTimeline'
export { default as ProjectMetricCard } from './ProjectMetricCard'
export { default as ProjectCTACard } from './ProjectCTACard'
export { default as ProjectSiteCard } from './ProjectSiteCard'
```

---

## 📝 المرحلة 5.3: صفحة نظرة عامة على المشروع

### 5.3.1 إنشاء `src/pages/project-workspace/overview/ProjectOverviewPage.jsx`

**الوصف:** صفحة نظرة عامة على المشروع

**المكونات المستخدمة:**
- `ProjectHeader`
- `ProjectProgressTimeline`
- `ProjectMetricCard`
- `ProjectCTACard`
- `ProjectSiteCard`
- `Card` (من UI Kit)

**الميزات المطلوبة:**

| الميزة | الوصف | الحالة |
|--------|-------|--------|
| Project Header | رأس المشروع مع العنوان والحالة | [ ] |
| Progress Timeline | الجدول الزمني للتقدم | [ ] |
| Metric Cards | بطاقات المقاييس (3 بطاقات) | [ ] |
| CTA Card | بطاقة الإجراء التالي | [ ] |
| Site Card | بطاقة الموقع مع الخريطة | [ ] |
| Responsive Layout | تصميم متجاوب | [ ] |
| Dark Mode | دعم الوضع المظلم | [ ] |
| Navigation | التنقل للخطوة التالية | [ ] |

**البنية:**

```jsx
/**
 * ProjectOverviewPage
 * صفحة نظرة عامة على المشروع
 * 
 * Layout: ProjectLayout (موجود)
 * Route: /app/projects/:projectId/overview
 */

// الحالة:
// - استخدام useProjectContext للحصول على بيانات المشروع
// - حساب الخطوة التالية من workflow

// الوظائف:
// - handleEditProject: فتح تعديل المشروع
// - handleNextStep: التنقل للخطوة التالية
// - calculateNextAction: تحديد الإجراء المطلوب

// حساب الإجراء التالي:
function getNextAction(workflow) {
  if (workflow.screening.status === 'draft' || workflow.screening.status === 'pending') {
    return { tool: 1, path: 'screening', title: 'Complete Screening', description: '...' }
  }
  if (workflow.screening.status === 'needs_action') {
    return { tool: 1, path: 'screening', title: 'Review Screening', description: '...' }
  }
  if (workflow.assessment.status !== 'approved') {
    return { tool: 2, path: 'assessment', title: 'Start Assessment', description: '...' }
  }
  if (workflow.semp.status !== 'completed') {
    return { tool: 3, path: 'semp', title: 'Complete SEMP', description: '...' }
  }
  return { tool: 5, path: 'monitoring', title: 'Start Monitoring', description: '...' }
}
```

**التصميم:**

```
┌─────────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ PROJECT HEADER                                                  │ │
│ │ Reforestation Initiative Alpha              [Active] [Edit]     │ │
│ │ 📍 Sumatra, Indonesia  •  📅 Jan 2023 – Dec 2025               │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ PROGRESS TIMELINE                                        75%    │ │
│ │ ────────────────────────────────────────────────────────────    │ │
│ │  ✓ Screening    ✓ Assessment    ✏️ SEMP    ○ Monitoring        │ │
│ │   Completed       Completed     In Progress   Pending           │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │                        MAIN CONTENT                             │ │
│ │ ┌───────────────────────────────────┐ ┌───────────────────────┐ │ │
│ │ │ LEFT COLUMN (2/3)                 │ │ RIGHT COLUMN (1/3)    │ │ │
│ │ │                                   │ │                       │ │ │
│ │ │ ┌─────────┐┌─────────┐┌─────────┐│ │ ┌───────────────────┐ │ │ │
│ │ │ │Risk Lvl ││Activities││Timeframe││ │ │ PROJECT SITE      │ │ │ │
│ │ │ │Cat B    ││ 4       ││ 24 Mos  ││ │ │ 🗺️ Map            │ │ │ │
│ │ │ │Med Risk ││From T3  ││         ││ │ │ Bukit Barisan     │ │ │ │
│ │ │ └─────────┘└─────────┘└─────────┘│ │ │ 245 Hectares      │ │ │ │
│ │ │                                   │ │ └───────────────────┘ │ │ │
│ │ │ ┌─────────────────────────────────┐│ │                       │ │ │
│ │ │ │ 🎯 CTA CARD                     ││ │                       │ │ │
│ │ │ │ Complete Management Plan (SEMP) ││ │                       │ │ │
│ │ │ │ The assessment has been...      ││ │                       │ │ │
│ │ │ │              [Open Tool 3 →]    ││ │                       │ │ │
│ │ │ └─────────────────────────────────┘│ │                       │ │ │
│ │ └───────────────────────────────────┘ └───────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 5.3.2 إنشاء `src/pages/project-workspace/overview/index.js`

```javascript
export { default as ProjectOverviewPage } from './ProjectOverviewPage'
```

---

## 📝 المرحلة 5.4: مكونات الفرز (Screening Components)

### 5.4.1 إنشاء `src/components/screening/ScreeningInfoSection.jsx`

**الوصف:** قسم معلومات الفرز (القسم 1)

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `officerName` | string | ✅ | اسم المسؤول |
| `officerPosition` | string | ✅ | منصب المسؤول |
| `screeningDate` | string | ❌ | تاريخ الفرز |
| `onDateChange` | function | ❌ | callback عند تغيير التاريخ |
| `readOnly` | boolean | ❌ | وضع القراءة فقط |

**التصميم من:** 9.EnvironmentalScreening.html (السطور 176-196)

**ملاحظات:**
- اسم المسؤول ومنصبه من بيانات المستخدم الحالي (read-only)
- تاريخ الفرز قابل للتعديل

---

### 5.4.2 إنشاء `src/components/screening/RiskCategorySelector.jsx`

**الوصف:** محدد فئة الخطر (القسم 2)

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `selectedCategory` | string | ❌ | الفئة المختارة |
| `onCategoryChange` | function | ✅ | callback عند تغيير الفئة |
| `justification` | string | ❌ | تبرير الاختيار |
| `onJustificationChange` | function | ✅ | callback عند تغيير التبرير |
| `readOnly` | boolean | ❌ | وضع القراءة فقط |
| `error` | object | ❌ | رسائل الخطأ |

**الفئات (من screeningCategories.js):**

| الفئة | التسمية | الوصف |
|-------|---------|-------|
| A | High Risk | High potential environmental risk |
| B | Moderate Risk | Low to moderate environmental risk |
| C | Negligible Risk | Negligible environmental risk |
| D | Emergency | Emergency cases and initiatives |
| E | Insufficient Info | Not enough information |
| F | Positive Impact | Positive environmental impact |

**التصميم من:** 9.EnvironmentalScreening.html (السطور 198-265)

**تصميم Radio Button:**
```css
/* حالة غير محددة */
.radio-option {
  @apply relative flex items-start p-4 cursor-pointer rounded-lg 
         border border-gray-200 dark:border-gray-700 
         hover:bg-gray-50 dark:hover:bg-[#1a3322] 
         transition-all;
}

/* حالة محددة */
.radio-option:has(:checked) {
  @apply border-primary bg-primary/5 ring-1 ring-primary;
}
```

---

### 5.4.3 إنشاء `src/components/screening/ImpactSection.jsx`

**الوصف:** قسم التأثيرات المحتملة (القسم 3)

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `negativeImpacts` | string | ❌ | التأثيرات السلبية |
| `positiveImpacts` | string | ❌ | التأثيرات الإيجابية |
| `onNegativeChange` | function | ✅ | callback للتأثيرات السلبية |
| `onPositiveChange` | function | ✅ | callback للتأثيرات الإيجابية |
| `readOnly` | boolean | ❌ | وضع القراءة فقط |

**التصميم من:** 9.EnvironmentalScreening.html (السطور 267-287)

---

### 5.4.4 إنشاء `src/components/screening/ScreeningSummaryCard.jsx`

**الوصف:** بطاقة ملخص الفرز (للعرض في Summary Page)

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `screening` | object | ✅ | بيانات الفرز |
| `project` | object | ✅ | بيانات المشروع |

**التصميم من:** 10.ScreeningSummary.html (السطور 145-256)

**المحتويات:**
1. Header مع حالة الفرز (pending approval / approved / rejected)
2. معلومات المسؤول
3. مكونات المشروع (tags)
4. بطاقة فئة الخطر الكبيرة (مع التبرير)
5. قائمة التأثيرات السلبية
6. قائمة التأثيرات الإيجابية

---

### 5.4.5 إنشاء `src/components/screening/ApprovalSection.jsx`

**الوصف:** قسم الموافقة والتوصيات

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `approverName` | string | ❌ | اسم المعتمد |
| `approverPosition` | string | ❌ | منصب المعتمد |
| `recommendations` | string | ❌ | التوصيات |
| `onRecommendationsChange` | function | ❌ | callback للتوصيات |
| `onApprove` | function | ✅ | callback عند الموافقة |
| `status` | string | ✅ | حالة الفرز الحالية |
| `canApprove` | boolean | ❌ | هل يمكن للمستخدم الموافقة |

**التصميم من:** 10.ScreeningSummary.html (السطور 257-286)

---

### 5.4.6 إنشاء `src/components/screening/index.js`

```javascript
// Screening Components Barrel Export

export { default as ScreeningInfoSection } from './ScreeningInfoSection'
export { default as RiskCategorySelector } from './RiskCategorySelector'
export { default as ImpactSection } from './ImpactSection'
export { default as ScreeningSummaryCard } from './ScreeningSummaryCard'
export { default as ApprovalSection } from './ApprovalSection'
```

---

## 📝 المرحلة 5.5: صفحة نموذج الفرز

### 5.5.1 إنشاء `src/pages/project-workspace/screening/ScreeningFormPage.jsx`

**الوصف:** صفحة نموذج الفرز البيئي

**المكونات المستخدمة:**
- `ScreeningInfoSection`
- `RiskCategorySelector`
- `ImpactSection`
- `Card`
- `Button`
- `Alert`
- `Icon`

**الميزات المطلوبة:**

| الميزة | الوصف | الحالة |
|--------|-------|--------|
| Page Header | عنوان الصفحة مع أيقونة | [ ] |
| Section 1 | معلومات الفرز | [ ] |
| Section 2 | فئة الخطر مع التبرير | [ ] |
| Section 3 | التأثيرات المحتملة | [ ] |
| Form Validation | التحقق من الحقول المطلوبة | [ ] |
| Save Draft | حفظ كمسودة | [ ] |
| Submit | إرسال للموافقة | [ ] |
| Loading States | حالات التحميل | [ ] |
| Error Handling | معالجة الأخطاء | [ ] |
| Dark Mode | دعم الوضع المظلم | [ ] |
| Responsive | تصميم متجاوب | [ ] |

**الحالة (State):**

```javascript
const [formData, setFormData] = useState({
  screeningDate: '',
  categoryCode: null,
  categoryReason: '',
  potentialNegative: '',
  potentialPositive: ''
})
const [errors, setErrors] = useState({})
const [isSubmitting, setIsSubmitting] = useState(false)
const [isSavingDraft, setIsSavingDraft] = useState(false)
```

**التحقق من الصحة:**

```javascript
function validateScreeningForm(data) {
  const errors = {}
  
  if (!data.screeningDate) {
    errors.screeningDate = 'Screening date is required'
  }
  
  if (!data.categoryCode) {
    errors.categoryCode = 'Risk category selection is required'
  }
  
  if (!data.categoryReason?.trim()) {
    errors.categoryReason = 'Category justification is required'
  } else if (data.categoryReason.trim().length < 50) {
    errors.categoryReason = 'Justification must be at least 50 characters'
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}
```

**التصميم:**

```
┌─────────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 📋 Environmental Integration Screening                          │ │
│ │ Tool 1 – Screening Assessment                                   │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 1. Screening Information                           [Required]   │ │
│ ├─────────────────────────────────────────────────────────────────┤ │
│ │  Program Officer Name        Program Officer Position           │ │
│ │  ┌──────────────────────┐   ┌──────────────────────┐            │ │
│ │  │ James Director       │   │ Environmental Spec   │            │ │
│ │  └──────────────────────┘   └──────────────────────┘            │ │
│ │                                                                 │ │
│ │  Screening Date                                                 │ │
│ │  ┌─────────────────────────────────────────────────────────────┐│ │
│ │  │ 📅 Select date...                                           ││ │
│ │  └─────────────────────────────────────────────────────────────┘│ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 2. Project Risk Category                                        │ │
│ ├─────────────────────────────────────────────────────────────────┤ │
│ │  Indicate the category of environmental risk. Select one.       │ │
│ │                                                                 │ │
│ │  ○ Category A - High potential environmental risk               │ │
│ │  ● Category B - Low to moderate environmental risk              │ │
│ │  ○ Category C - Negligible environmental risk                   │ │
│ │  ○ Category D - Emergency cases and initiatives                 │ │
│ │  ○ Category E - Not enough information                          │ │
│ │  ○ Category F - Positive environmental impact                   │ │
│ │                                                                 │ │
│ │  ┌──────────────────────────────────────────────────────────┐   │ │
│ │  │ Category Justification *                                 │   │ │
│ │  │ Explain why you selected Category B. Be specific...      │   │ │
│ │  │ ┌──────────────────────────────────────────────────────┐ │   │ │
│ │  │ │                                                      │ │   │ │
│ │  │ └──────────────────────────────────────────────────────┘ │   │ │
│ │  └──────────────────────────────────────────────────────────┘   │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 3. Potential Impacts                                            │ │
│ ├─────────────────────────────────────────────────────────────────┤ │
│ │  ⚠️ Potential Negative Impacts                                   │ │
│ │  ┌─────────────────────────────────────────────────────────────┐│ │
│ │  │ Describe any potential adverse effects...                   ││ │
│ │  └─────────────────────────────────────────────────────────────┘│ │
│ │                                                                 │ │
│ │  ✓ Potential Positive Impacts                                   │ │
│ │  ┌─────────────────────────────────────────────────────────────┐│ │
│ │  │ Describe any expected environmental benefits...             ││ │
│ │  └─────────────────────────────────────────────────────────────┘│ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ═══════════════════════════════════════════════════════════════════ │
│  By submitting this form, you confirm all info is accurate.        │
│                                    [Save as Draft]  [Submit →]     │
│ ═══════════════════════════════════════════════════════════════════ │
└─────────────────────────────────────────────────────────────────────┘
```

**شريط الإجراءات السفلي (Sticky Footer):**
```jsx
<div className="h-20 bg-surface dark:bg-surface-dark border-t border-border-default 
               flex items-center justify-between px-8 sticky bottom-0 z-20">
  <div className="text-xs text-text-secondary">
    <p>By submitting this form, you confirm that all information provided is accurate.</p>
  </div>
  <div className="flex gap-4">
    <Button variant="outline" onClick={handleSaveDraft} disabled={isSavingDraft}>
      Save as Draft
    </Button>
    <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
      <Icon name="send" size="sm" />
      Submit Screening
    </Button>
  </div>
</div>
```

---

### 5.5.2 إنشاء `src/pages/project-workspace/screening/index.js`

```javascript
export { default as ScreeningFormPage } from './ScreeningFormPage'
export { default as ScreeningSummaryPage } from './ScreeningSummaryPage'
```

---

## 📝 المرحلة 5.6: صفحة ملخص الفرز

### 5.6.1 إنشاء `src/pages/project-workspace/screening/ScreeningSummaryPage.jsx`

**الوصف:** صفحة ملخص الفرز والموافقة

**المكونات المستخدمة:**
- `ScreeningSummaryCard`
- `ApprovalSection`
- `Button`
- `Badge`
- `Card`
- `Icon`

**الميزات المطلوبة:**

| الميزة | الوصف | الحالة |
|--------|-------|--------|
| Summary Header | رأس الملخص مع حالة الموافقة | [ ] |
| Officer Info | معلومات المسؤول | [ ] |
| Project Components | مكونات المشروع (tags) | [ ] |
| Risk Category Card | بطاقة فئة الخطر الكبيرة | [ ] |
| Negative Impacts List | قائمة التأثيرات السلبية | [ ] |
| Positive Impacts List | قائمة التأثيرات الإيجابية | [ ] |
| Approval Section | قسم الموافقة | [ ] |
| Export Button | زر تصدير Excel | [ ] |
| Dark Mode | دعم الوضع المظلم | [ ] |
| Responsive | تصميم متجاوب | [ ] |

**حالات الصفحة:**

1. **Pending Approval** - في انتظار الموافقة
   - عرض نموذج الموافقة
   - Badge برتقالي

2. **Approved** - تمت الموافقة
   - عرض معلومات المعتمد
   - Badge أخضر
   - زر "Proceed to Assessment"

3. **Rejected** - مرفوض
   - عرض سبب الرفض
   - Badge أحمر
   - زر "Edit Screening"

**التصميم:**

```
┌─────────────────────────────────────────────────────────────────────┐
│ [Header]                                      [📥 Export Excel]     │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Environmental Integration Screening      [PENDING APPROVAL]     │ │
│ │ Project: Clean Water Initiative – Phase 2                       │ │
│ │                                           Screening Date: Oct 24│ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────────────┬───────────────────────────────────────┐ │
│ │ Program Officer         │ Project Components                    │ │
│ │ 👤 Jane Doe             │ [Well construction] [Community train] │ │
│ │ Senior Field Officer    │ [Water testing]                       │ │
│ └─────────────────────────┴───────────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ ╔═══════════════════════════════════════════════════════════╗   │ │
│ │ ║  🛡️  CATEGORY B: Moderate Potential Environmental Risk     ║   │ │
│ │ ║                                                           ║   │ │
│ │ ║  The project involves minor construction activities...    ║   │ │
│ │ ║                                                           ║   │ │
│ │ ║  ─────────────────────────────────────────────────────    ║   │ │
│ │ ║  Justification:                                           ║   │ │
│ │ ║  "Although well drilling disturbs the local soil..."      ║   │ │
│ │ ╚═══════════════════════════════════════════════════════════╝   │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌───────────────────────────────┬─────────────────────────────────┐ │
│ │ ⚠️ Potential Negative Impacts │ ✓ Potential Positive Impacts   │ │
│ ├───────────────────────────────┼─────────────────────────────────┤ │
│ │ • Temporary noise pollution   │ • Increased access to clean    │ │
│ │   during drilling phase       │   potable water for 250 HHs    │ │
│ │ • Risk of minor groundwater   │ • Reduction in waterborne      │ │
│ │   contamination               │   diseases                     │ │
│ │ • Soil erosion potential      │ • Community empowerment        │ │
│ └───────────────────────────────┴─────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Approval and Recommendations                                    │ │
│ ├─────────────────────────────────────────────────────────────────┤ │
│ │  Approved By                   Position                         │ │
│ │  ┌──────────────────────┐     ┌──────────────────────┐          │ │
│ │  │ James Director       │     │ Regional Manager     │          │ │
│ │  └──────────────────────┘     └──────────────────────┘          │ │
│ │                                                                 │ │
│ │  Recommendations / Next Steps                                   │ │
│ │  ┌─────────────────────────────────────────────────────────────┐│ │
│ │  │ Enter any specific recommendations for the project team...  ││ │
│ │  └─────────────────────────────────────────────────────────────┘│ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ═══════════════════════════════════════════════════════════════════ │
│                         [✓ Approve & Complete Screening]            │
│ ═══════════════════════════════════════════════════════════════════ │
└─────────────────────────────────────────────────────────────────────┘
```

**دعم الطباعة:**
```css
@media print {
  .no-print {
    display: none !important;
  }
  body {
    background-color: white !important;
  }
  .print-container {
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
    border: none !important;
  }
}
```

---

## 📝 المرحلة 5.7: التكامل والاختبار

### 5.7.1 إنشاء Barrel Export للـ Workspace

**إنشاء `src/pages/project-workspace/index.js`:**

```javascript
// Project Workspace Pages Barrel Export

// Overview
export { ProjectOverviewPage } from './overview'

// Screening
export { ScreeningFormPage, ScreeningSummaryPage } from './screening'
```

### 5.7.2 تحديث Routes

**التحقق من `src/routes/index.jsx`:**

```javascript
// يجب أن تكون هذه المسارات موجودة:
import * as Workspace from '@/pages/project-workspace'

// في ProjectLayout children:
{ path: 'overview', element: <Workspace.ProjectOverviewPage /> }
{ path: 'screening', element: <Workspace.ScreeningFormPage /> }
{ path: 'screening/summary', element: <Workspace.ScreeningSummaryPage /> }
```

### 5.7.3 تحديث ProjectLayout لتحميل بيانات المشروع الحقيقية

**تحديث `src/components/layout/ProjectLayout.jsx`:**

```javascript
// استبدال Mock data بـ mockProjects
import { mockProjects } from '@/data'

// في useEffect:
const fetchProject = async () => {
  setIsLoading(true)
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // البحث عن المشروع من mockProjects
  const foundProject = mockProjects.find(p => p._id === projectId)
  
  if (foundProject) {
    setProject(foundProject)
  } else {
    // معالجة المشروع غير الموجود
    console.error('Project not found:', projectId)
  }
  
  setIsLoading(false)
}
```

### 5.7.4 Hook لإدارة حالة الفرز

**إنشاء `src/hooks/useScreening.js`:**

```javascript
import { useState, useEffect, useCallback } from 'react'
import { 
  getScreeningByProjectId, 
  createEmptyScreening 
} from '@/data'

/**
 * Hook لإدارة حالة الفرز
 * @param {string} projectId - معرف المشروع
 */
export function useScreening(projectId) {
  const [screening, setScreening] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  // تحميل بيانات الفرز
  useEffect(() => {
    if (!projectId) return
    
    setIsLoading(true)
    setError(null)
    
    // Simulate API call
    setTimeout(() => {
      const existingScreening = getScreeningByProjectId(projectId)
      setScreening(existingScreening || createEmptyScreening(projectId))
      setIsLoading(false)
    }, 300)
  }, [projectId])

  // حفظ كمسودة
  const saveDraft = useCallback(async (data) => {
    setIsSaving(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      setScreening(prev => ({
        ...prev,
        ...data,
        status: 'draft',
        updatedAt: new Date().toISOString()
      }))
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsSaving(false)
    }
  }, [])

  // إرسال للموافقة
  const submit = useCallback(async (data) => {
    setIsSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setScreening(prev => ({
        ...prev,
        ...data,
        status: 'submitted',
        screening_date: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsSaving(false)
    }
  }, [])

  // الموافقة
  const approve = useCallback(async (recommendations) => {
    setIsSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setScreening(prev => ({
        ...prev,
        status: 'approved',
        recommendations,
        approved_by: 'current_user_id', // سيتم استبداله بـ AuthContext
        updatedAt: new Date().toISOString()
      }))
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsSaving(false)
    }
  }, [])

  // الرفض
  const reject = useCallback(async (reason) => {
    setIsSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setScreening(prev => ({
        ...prev,
        status: 'rejected',
        recommendations: reason,
        updatedAt: new Date().toISOString()
      }))
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsSaving(false)
    }
  }, [])

  return {
    screening,
    isLoading,
    isSaving,
    error,
    saveDraft,
    submit,
    approve,
    reject
  }
}
```

### 5.7.5 تحديث Hooks Barrel Export

**تحديث `src/hooks/index.js`:**

```javascript
export * from './useLocalStorage'
export * from './useMediaQuery'
export * from './useProjectContext'
export * from './useScreening'
```

---

## 🧪 اختبارات التكامل

### قائمة الاختبارات

| # | الاختبار | الصفحة | الوصف |
|---|----------|--------|-------|
| 1 | Navigation | All | التنقل من Dashboard → Project → Overview → Screening |
| 2 | Project Load | ProjectOverviewPage | تحميل بيانات المشروع |
| 3 | Progress Display | ProjectOverviewPage | عرض التقدم الصحيح |
| 4 | CTA Navigation | ProjectOverviewPage | التنقل للخطوة التالية |
| 5 | Form Load | ScreeningFormPage | تحميل النموذج (جديد/موجود) |
| 6 | Category Selection | ScreeningFormPage | اختيار فئة الخطر |
| 7 | Form Validation | ScreeningFormPage | التحقق من الحقول المطلوبة |
| 8 | Save Draft | ScreeningFormPage | حفظ كمسودة |
| 9 | Submit Form | ScreeningFormPage | إرسال النموذج |
| 10 | Summary Load | ScreeningSummaryPage | تحميل الملخص |
| 11 | Approval Flow | ScreeningSummaryPage | الموافقة على الفرز |
| 12 | Rejection Flow | ScreeningSummaryPage | رفض الفرز |
| 13 | Export Button | ScreeningSummaryPage | زر التصدير |
| 14 | Dark Mode | All | التبديل بين الوضعين |
| 15 | Responsive | All | التجاوب مع أحجام الشاشات |

### اختبارات التنقل (Navigation Flow)

```
Dashboard → "Open Project" → ProjectOverviewPage
                               ↓
                        "Start Screening" (إذا لم يبدأ)
                               ↓
                        ScreeningFormPage
                               ↓
                        "Submit" (بعد ملء النموذج)
                               ↓
                        ScreeningSummaryPage
                               ↓
                        "Approve" (إذا كان المستخدم مخول)
                               ↓
                        ProjectOverviewPage (مع CTA للـ Assessment)
```

---

## ✅ قائمة المراجعة النهائية

### ملفات البيانات
- [x] `src/data/mockScreening.js`
- [x] `src/data/index.js` (تحديث)

### مكونات المشروع
- [x] `src/components/project/ProjectHeader.jsx`
- [x] `src/components/project/ProjectProgressTimeline.jsx`
- [x] `src/components/project/ProjectMetricCard.jsx`
- [x] `src/components/project/ProjectCTACard.jsx`
- [x] `src/components/project/ProjectSiteCard.jsx`
- [x] `src/components/project/index.js` (تحديث)

### مكونات الفرز
- [x] `src/components/screening/ScreeningInfoSection.jsx`
- [x] `src/components/screening/RiskCategorySelector.jsx`
- [x] `src/components/screening/ImpactSection.jsx`
- [x] `src/components/screening/ScreeningSummaryCard.jsx`
- [x] `src/components/screening/ApprovalSection.jsx`
- [x] `src/components/screening/index.js`

### صفحات Workspace
- [x] `src/pages/project-workspace/overview/ProjectOverviewPage.jsx`
- [x] `src/pages/project-workspace/overview/index.js`
- [x] `src/pages/project-workspace/screening/ScreeningFormPage.jsx`
- [x] `src/pages/project-workspace/screening/ScreeningSummaryPage.jsx`
- [x] `src/pages/project-workspace/screening/index.js`
- [x] `src/pages/project-workspace/index.js`

### Hooks
- [x] `src/hooks/useScreening.js`
- [x] `src/hooks/index.js` (تحديث)

### تحديثات
- [x] `src/components/layout/ProjectLayout.jsx` (تحميل بيانات حقيقية)
- [x] `src/routes/index.jsx` (التحقق من المسارات)

### معايير الجودة
- [x] جميع الصفحات تدعم Dark Mode
- [x] جميع الصفحات Responsive
- [x] جميع النماذج لها Form Validation
- [x] جميع الصفحات لها Loading States
- [x] جميع الصفحات لها Error States
- [x] `npm run build` يعمل بدون أخطاء
- [x] `npm run lint` يعمل بدون أخطاء

---

## 📊 مقاييس النجاح

| المقياس | الهدف |
|---------|-------|
| عدد الصفحات الجديدة | 3 صفحات |
| عدد مكونات المشروع | 5 مكونات |
| عدد مكونات الفرز | 5 مكونات |
| عدد ملفات البيانات | 1 ملف |
| عدد Hooks الجديدة | 1 hook |
| دعم Dark Mode | 100% |
| دعم Responsive | 100% |
| Form Validation | 100% |
| ESLint Errors | 0 |
| Build Errors | 0 |

---

## 📌 ملاحظات مهمة

### 1. توافق Backend

جميع البيانات متوافقة مع `backend/src/models/screening.model.js`:
- `category_code`: enum ['A', 'B', 'C', 'D', 'E', 'F']
- `status`: enum ['draft', 'submitted', 'approved', 'rejected']

### 2. Project Context

استخدم `useProjectContext()` للحصول على بيانات المشروع في صفحات Workspace:

```javascript
import { useProjectContext } from '@/hooks'

function ScreeningFormPage() {
  const { project } = useProjectContext()
  // ...
}
```

### 3. Form State Management

للنماذج المعقدة، استخدم `useReducer` بدلاً من `useState` المتعددة:

```javascript
const [formState, dispatch] = useReducer(screeningReducer, initialState)
```

### 4. Navigation بعد Submit

```javascript
import { useNavigate, useParams } from 'react-router-dom'
import { getProjectRoute, ROUTES } from '@/routes/routes.config'

const navigate = useNavigate()
const { projectId } = useParams()

// بعد Submit ناجح:
navigate(getProjectRoute(projectId, ROUTES.SCREENING_SUMMARY))
```

### 5. ربط المشاريع في Dashboard

تأكد من أن ProjectListItem في Dashboard يستخدم الـ ID الصحيح للتنقل:

```javascript
// في DashboardPage أو ProjectListPage
const handleProjectClick = (project) => {
  navigate(getProjectRoute(project._id, ROUTES.PROJECT_OVERVIEW))
}
```

### 6. API Endpoints للتكامل المستقبلي

| الوظيفة | الـ Endpoint | الطريقة |
|---------|-------------|---------|
| جلب الفرز | `/api/v1/screenings/project/:projectId` | GET |
| إنشاء فرز | `/api/v1/screenings` | POST |
| تحديث فرز | `/api/v1/screenings/:id` | PUT |
| الموافقة/الرفض | `/api/v1/screenings/:id/approve` | PATCH |

---

*تم إنشاء الخطة: 24 يناير 2026*
*المنشئ: Architect Agent*
*الإصدار: 1.0*
