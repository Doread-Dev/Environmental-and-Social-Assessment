# 📘 تقرير مرجعي شامل للـ Frontend
## دليل التكامل مع الـ Backend

### تاريخ الإنشاء: 4 فبراير 2026
### الإصدار: 1.0

---

## 📋 جدول المحتويات

1. [نظرة عامة على المشروع](#1-نظرة-عامة-على-المشروع)
2. [البنية التقنية](#2-البنية-التقنية)
3. [هيكل الملفات](#3-هيكل-الملفات)
4. [نظام التوجيه (Routing)](#4-نظام-التوجيه-routing)
5. [الـ Hooks ونقاط التكامل](#5-الـ-hooks-ونقاط-التكامل)
6. [هياكل البيانات (Data Structures)](#6-هياكل-البيانات-data-structures)
7. [خريطة الـ API Endpoints](#7-خريطة-الـ-api-endpoints)
8. [المكونات والصفحات](#8-المكونات-والصفحات)
9. [نظام الصلاحيات](#9-نظام-الصلاحيات)
10. [خطة التكامل المقترحة](#10-خطة-التكامل-المقترحة)

---

## 1. نظرة عامة على المشروع

### الوصف
نظام إدارة البيئة والاجتماع (ESMS) لمؤسسة آغا خان - سوريا. يتبع النظام سير عمل منظم مع 5 أدوات:

| الأداة | الوصف | الحالات |
|--------|-------|---------|
| **Tool 1** | Screening (الفرز) | draft, submitted, approved, rejected |
| **Tool 2** | Assessment (التقييم) | draft, submitted, approved, rejected |
| **Tool 3** | Management Activities (أنشطة الإدارة) | CRUD operations |
| **Tool 4** | Mitigation Plan (خطة التخفيف) | CRUD operations |
| **Tool 5** | Monitoring (المراقبة) | Quarterly data entry |

### الحالة الحالية
- ✅ 19 صفحة React مكتملة
- ✅ 24 مكون UI
- ✅ 44 مكون متخصص
- ✅ 7 hooks مخصصة
- ✅ 17 ملف بيانات وهمية
- ✅ Lazy Loading مُفعّل
- ⏳ جاهز للتكامل مع Backend

---

## 2. البنية التقنية

### التقنيات المستخدمة

| التقنية | الإصدار | الغرض |
|---------|---------|-------|
| React | 19.x | UI Library |
| React Router | 7.x | Client-side Routing |
| Tailwind CSS | 4.x | Styling |
| Vite | 6.x | Build Tool |
| ESLint | 9.x | Linting |
| Prettier | 3.x | Code Formatting |
| Terser | Latest | Minification |

### ملف `package.json` الرئيسي

```json
{
  "dependencies": {
    "react": "^19.x",
    "react-dom": "^19.x",
    "react-router-dom": "^7.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x"
  }
}
```

### ملف `vite.config.js`

```javascript
// Lazy Loading مُفعّل
// Code Splitting حسب الميزة
// Terser Minification
// manualChunks: react, router, ui, layout, data, hooks, assessment, screening, semp, monitoring
```

---

## 3. هيكل الملفات

```
frontend/src/
├── main.jsx                    # Entry point
├── App.jsx                     # Root component
├── index.css                   # Global styles
│
├── components/                 # React Components
│   ├── ui/                     # 24 UI primitives (Button, Input, Modal, etc.)
│   ├── layout/                 # 8 layout components
│   ├── dashboard/              # 5 dashboard components
│   ├── project/                # 5 project components
│   ├── screening/              # 5 screening components
│   ├── assessment/             # 14 assessment components
│   ├── semp/                   # 8 SEMP components
│   ├── monitoring/             # 4 monitoring components
│   └── files/                  # 3 file management components
│
├── pages/                      # Page Components
│   ├── auth/                   # LoginPage
│   ├── dashboard/              # DashboardPage
│   ├── projects/               # ProjectListPage, ProjectCreatePage
│   └── project-workspace/      # 15+ workspace pages
│       ├── overview/
│       ├── screening/
│       ├── assessment/
│       ├── semp/
│       ├── monitoring/
│       └── annex/
│
├── hooks/                      # Custom Hooks (API Integration Points)
│   ├── useScreening.js         # ← يحتاج تكامل API
│   ├── useAssessment.js        # ← يحتاج تكامل API
│   ├── useSemp.js              # ← يحتاج تكامل API
│   ├── useMonitoring.js        # ← يحتاج تكامل API
│   ├── useFiles.js             # ← يحتاج تكامل API
│   └── useProjectContext.js    # Project context provider
│
├── data/                       # Mock Data (سيُستبدل بـ API)
│   ├── mockProjects.js
│   ├── mockUsers.js
│   ├── mockScreening.js
│   ├── mockAssessment.js
│   ├── mockManagementActivities.js
│   ├── mockMitigationPlans.js
│   ├── mockMonitoringRecords.js
│   ├── mockAttachments.js
│   └── ... (17 files total)
│
├── routes/                     # Routing Configuration
│   ├── index.jsx               # Router configuration
│   ├── routes.config.js        # Route constants
│   ├── ProtectedRoute.jsx      # Auth guard
│   ├── AssessmentRouteGuard.jsx
│   ├── SempRouteGuard.jsx
│   └── MonitoringRouteGuard.jsx
│
├── services/                   # API Services (فارغ - جاهز للتكامل)
│   └── index.js                # Barrel export
│
├── contexts/                   # React Contexts
│   └── ThemeContext.jsx        # Dark mode
│
└── utils/                      # Utility Functions
    ├── cn.js                   # Class name utility
    ├── constants.js            # App constants
    ├── formatters.js           # Date/number formatters
    ├── validators.js           # Form validators
    └── impactCalculations.js   # Impact score calculations
```

---

## 4. نظام التوجيه (Routing)

### المسارات الرئيسية

```javascript
// routes.config.js
export const ROUTES = {
  // Auth
  LOGIN: '/login',
  
  // Main App
  APP: '/app',
  DASHBOARD: '/app/dashboard',
  PROJECTS: '/app/projects',
  PROJECT_NEW: '/app/projects/new',
  
  // Project Workspace (dynamic :projectId)
  PROJECT_OVERVIEW: '/app/projects/:projectId/overview',
  
  // Tool 1: Screening
  SCREENING: '/app/projects/:projectId/screening',
  SCREENING_SUMMARY: '/app/projects/:projectId/screening/summary',
  
  // Tool 2: Assessment
  ASSESSMENT: '/app/projects/:projectId/assessment',
  ASSESSMENT_METADATA: '/app/projects/:projectId/assessment/metadata',
  ASSESSMENT_METHODS: '/app/projects/:projectId/assessment/methods',
  ASSESSMENT_SCORING: '/app/projects/:projectId/assessment/scoring',
  ASSESSMENT_REVIEW: '/app/projects/:projectId/assessment/review',
  
  // Tools 3 & 4: SEMP
  SEMP: '/app/projects/:projectId/semp',
  SEMP_ACTIVITIES: '/app/projects/:projectId/semp/activities',
  SEMP_MITIGATION: '/app/projects/:projectId/semp/mitigation',
  
  // Tool 5: Monitoring
  MONITORING: '/app/projects/:projectId/monitoring',
  MONITORING_DATA: '/app/projects/:projectId/monitoring/data-entry',
  
  // Files
  PROJECT_FILES: '/app/projects/:projectId/files',
  PROJECT_ANNEX: '/app/projects/:projectId/annex',
}
```

### Route Guards

| Guard | الوظيفة |
|-------|---------|
| `ProtectedRoute` | يتحقق من تسجيل الدخول |
| `AssessmentRouteGuard` | يتحقق من اعتماد Screening قبل Assessment |
| `SempRouteGuard` | يتحقق من اعتماد Assessment قبل SEMP |
| `MonitoringRouteGuard` | يتحقق من وجود Mitigation Plans قبل Monitoring |

---

## 5. الـ Hooks ونقاط التكامل

### 5.1 useScreening (Tool 1)

```javascript
// المدخلات
const { projectId } = useParams()

// الحالة
const [screening, setScreening] = useState(null)
const [isLoading, setIsLoading] = useState(true)
const [isSaving, setIsSaving] = useState(false)
const [error, setError] = useState(null)

// الدوال (تحتاج تكامل API)
return {
  screening,           // بيانات الفرز
  isLoading,
  isSaving,
  error,
  saveDraft,           // PUT /api/v1/screenings/:id
  submit,              // PUT /api/v1/screenings/:id (status: submitted)
  approve,             // PATCH /api/v1/screenings/:id/approve
  reject,              // PATCH /api/v1/screenings/:id/reject
}
```

**API Endpoints المطلوبة:**
| العملية | Endpoint | Method |
|---------|----------|--------|
| تحميل | `GET /api/v1/screenings/project/:projectId` | GET |
| حفظ مسودة | `PUT /api/v1/screenings/:id` | PUT |
| إرسال | `PUT /api/v1/screenings/:id` | PUT |
| موافقة | `PATCH /api/v1/screenings/:id/approve` | PATCH |
| رفض | `PATCH /api/v1/screenings/:id/reject` | PATCH |

---

### 5.2 useAssessment (Tool 2)

```javascript
// الحالة
const [assessment, setAssessment] = useState(null)
const [methods, setMethods] = useState([])
const [consultations, setConsultations] = useState([])
const [impactScores, setImpactScores] = useState([])

// الدوال (تحتاج تكامل API)
return {
  assessment,
  methods,
  consultations,
  impactScores,
  isLoading,
  isSaving,
  error,
  startAssessment,        // POST /api/v1/assessments
  saveMetadata,           // PUT /api/v1/assessments/:id
  saveMethods,            // POST /api/v1/assessments/:id/methods
  saveConsultations,      // POST /api/v1/assessments/:id/consultations
  saveImpactScores,       // POST /api/v1/assessments/:id/scores
  submitAssessment,       // PUT + status: submitted
  approveAssessment,      // PATCH /api/v1/assessments/:id/approve
  rejectAssessment,       // PATCH /api/v1/assessments/:id/reject
}
```

**API Endpoints المطلوبة:**
| العملية | Endpoint | Method |
|---------|----------|--------|
| تحميل | `GET /api/v1/assessments/project/:projectId` | GET |
| إنشاء | `POST /api/v1/assessments` | POST |
| تحديث | `PUT /api/v1/assessments/:id` | PUT |
| إضافة طريقة | `POST /api/v1/assessments/:id/methods` | POST |
| إضافة استشارة | `POST /api/v1/assessments/:id/consultations` | POST |
| إضافة نتائج | `POST /api/v1/assessments/:id/scores` | POST |
| حساب | `PATCH /api/v1/assessments/:id/calculate` | PATCH |
| موافقة | `PATCH /api/v1/assessments/:id/approve` | PATCH |
| رفض | `PATCH /api/v1/assessments/:id/reject` | PATCH |

---

### 5.3 useSemp (Tools 3 & 4)

```javascript
// الحالة
const [managementActivities, setManagementActivities] = useState([])
const [mitigationPlans, setMitigationPlans] = useState([])

// دوال Management Activities (Tool 3)
return {
  managementActivities,
  addManagementActivity,      // POST /api/v1/management
  updateManagementActivity,   // PUT /api/v1/management/:id
  deleteManagementActivity,   // DELETE /api/v1/management/:id
  saveManagementActivities,   // Batch update
  
  // دوال Mitigation Plans (Tool 4)
  mitigationPlans,
  addMitigationPlan,          // POST /api/v1/mitigation
  updateMitigationPlan,       // PUT /api/v1/mitigation/:id
  deleteMitigationPlan,       // DELETE /api/v1/mitigation/:id
  saveMitigationPlans,        // Batch update
  
  // حالة SEMP
  getTool3Status,
  getTool4Status,
  getSempStatus,
}
```

**API Endpoints المطلوبة:**
| العملية | Endpoint | Method |
|---------|----------|--------|
| تحميل أنشطة | `GET /api/v1/management/project/:projectId` | GET |
| إضافة نشاط | `POST /api/v1/management` | POST |
| تحديث نشاط | `PUT /api/v1/management/:id` | PUT |
| حذف نشاط | `DELETE /api/v1/management/:id` | DELETE |
| تحميل خطط | `GET /api/v1/mitigation/project/:projectId` | GET |
| إضافة خطة | `POST /api/v1/mitigation` | POST |
| تحديث خطة | `PUT /api/v1/mitigation/:id` | PUT |
| حذف خطة | `DELETE /api/v1/mitigation/:id` | DELETE |

---

### 5.4 useMonitoring (Tool 5)

```javascript
// الحالة
const [records, setRecords] = useState([])

// الدوال
return {
  records,
  isLoading,
  isSaving,
  error,
  updateQuarterScore,    // PATCH /api/v1/monitoring/:id/quarter/:q
  updateRecordField,     // PUT /api/v1/monitoring/:id
  addRecord,             // POST /api/v1/monitoring
  saveAllRecords,        // Batch update
  getAllCategoryStats,   // حساب محلي
  getCategoryData,       // حساب محلي
}
```

**API Endpoints المطلوبة:**
| العملية | Endpoint | Method |
|---------|----------|--------|
| تحميل | `GET /api/v1/monitoring/project/:projectId` | GET |
| إنشاء | `POST /api/v1/monitoring` | POST |
| تحديث | `PUT /api/v1/monitoring/:id` | PUT |
| تحديث ربع | `PATCH /api/v1/monitoring/:id/quarter/:q` | PATCH |

---

### 5.5 useFiles

```javascript
// الدوال
return {
  attachments,
  isLoading,
  isUploading,
  error,
  uploadFile,            // POST /api/v1/attachments/upload (multipart)
  deleteFile,            // DELETE /api/v1/attachments/:id
  getFilesByType,        // Filter local
  getGroupedFiles,       // Group local
  downloadFile,          // GET file URL
}
```

**API Endpoints المطلوبة:**
| العملية | Endpoint | Method |
|---------|----------|--------|
| تحميل | `GET /api/v1/attachments?entity_type=project&entity_id=:projectId` | GET |
| رفع | `POST /api/v1/attachments/upload` | POST (multipart) |
| حذف | `DELETE /api/v1/attachments/:id` | DELETE |

---

## 6. هياكل البيانات (Data Structures)

### 6.1 Project

```typescript
interface Project {
  _id: string;
  title: string;
  location: string;
  start_date: string;           // ISO date
  end_date: string;             // ISO date
  project_component: string;    // Description
  createdAt: string;
  updatedAt: string;
  
  // Frontend computed (from relations)
  screening?: {
    _id: string;
    category_code: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
    status: 'draft' | 'submitted' | 'approved' | 'rejected';
  };
  workflow?: {
    screening: { status: string; tool: 1 };
    assessment: { status: string; tool: 2 };
    semp: { status: string; tools: [3, 4] };
    monitoring: { status: string; tool: 5 };
  };
}
```

### 6.2 User

```typescript
interface User {
  _id: string;
  name: string;
  email: string;
  job_title: JobTitle;
  role: 'environmental_specialist' | 'program_manager' | 'project_manager' | 'environmental_focal_point' | 'viewer';
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### 6.3 Screening (Tool 1)

```typescript
interface Screening {
  _id: string;
  project: string;              // Project ID
  category_code: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  category_reason: string;
  potential_negative: string;
  potential_positive: string;
  approved_by?: string;         // User ID
  recommendations?: string;
  reject_reason?: string;
  reject_by?: string;           // User ID
  screening_date?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}
```

### 6.4 Assessment (Tool 2)

```typescript
interface Assessment {
  _id: string;
  project: string;
  officer: string;              // User ID
  project_activity: string;
  description: string;
  environmental_setting: string;
  legal_requirements: string;
  total_project_score?: {
    negligible: number;
    low: number;
    medium: number;
    high: number;
    not_applicable: number;
  };
  total_project_impact?: 'negligible' | 'low' | 'medium' | 'high' | 'not_applicable';
  potential_negative_impact?: string;
  potential_positive_impact?: string;
  approved_by?: string;
  recommendations?: string;
  reject_reason?: string;
  reject_by?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

interface AssessmentMethod {
  _id: string;
  assessment: string;
  method_type: string;
  details?: string;
}

interface CommunityConsultation {
  _id: string;
  assessment: string;
  type: string;
  participants?: string;
  notes?: string;
}

interface AssessmentImpactScore {
  _id: string;
  assessment: string;
  question: string;             // ImpactQuestion ID
  level: 'negligible' | 'low' | 'medium' | 'high' | 'not_applicable';
  note?: string;
}
```

### 6.5 Management Activity (Tool 3)

```typescript
interface ManagementActivity {
  _id: string;
  project: string;
  serial_number: number;
  activity_description: string;
  potential_impact: string;
  recommended_actions: string;
  monitoring_requirements: string;
  responsible?: string;         // User ID
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 6.6 Mitigation Plan (Tool 4)

```typescript
interface MitigationPlan {
  _id: string;
  project: string;
  serial_number: number;
  output_description: string;
  potential_impact_and_significance: string;
  mitigation_and_enhancement_measures: string;
  monitoring?: string;
  schedule?: string;
  responsible?: string;         // User ID
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 6.7 Monitoring Record (Tool 5)

```typescript
interface MonitoringRecord {
  _id: string;
  project: string;
  indicator: string;            // Indicator ID
  scores: {
    baseline: string;           // Manual text
    Q1: string;
    Q2: string;
    Q3: string;
    Q4: string;
  };
  total: string;                // Manual text
  final_assessment: string;
  ranking: 'low' | 'medium' | 'high' | 'not_applicable';
  responsible?: string;         // User ID
  note?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 6.8 Attachment

```typescript
interface Attachment {
  _id: string;
  entity_type: 'project' | 'screening' | 'assessment' | 'management' | 'mitigation' | 'monitoring';
  entity_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;          // User ID
  createdAt: string;
}
```

---

## 7. خريطة الـ API Endpoints

### 7.1 Auth

| Endpoint | Method | الوصف | الأدوار |
|----------|--------|-------|---------|
| `/api/v1/auth/register` | POST | تسجيل مستخدم | Public (first) / environmental_specialist |
| `/api/v1/auth/login` | POST | تسجيل الدخول | Public |

### 7.2 Users

| Endpoint | Method | الوصف | الأدوار |
|----------|--------|-------|---------|
| `/api/v1/users` | GET | قائمة المستخدمين | All authenticated |

### 7.3 Lookups

| Endpoint | Method | الوصف |
|----------|--------|-------|
| `/api/v1/lookups/impact-categories` | GET | فئات التأثير |
| `/api/v1/lookups/impact-questions` | GET | أسئلة التأثير |
| `/api/v1/lookups/indicators` | GET | المؤشرات |
| `/api/v1/lookups/job-titles` | GET | المسميات الوظيفية |

### 7.4 Projects

| Endpoint | Method | الوصف | الأدوار |
|----------|--------|-------|---------|
| `/api/v1/projects` | GET | قائمة المشاريع | Public |
| `/api/v1/projects/:id` | GET | مشروع واحد | Public |
| `/api/v1/projects` | POST | إنشاء مشروع | ES/PM/PrM |
| `/api/v1/projects/:id` | PUT | تحديث مشروع | ES/PM/PrM |
| `/api/v1/projects/:id` | DELETE | حذف مشروع | ES/PM/PrM |

### 7.5 Screening (Tool 1)

| Endpoint | Method | الوصف | الأدوار |
|----------|--------|-------|---------|
| `/api/v1/screenings/project/:projectId` | GET | فرز المشروع | Public |
| `/api/v1/screenings` | POST | إنشاء فرز | ES/PM/PrM |
| `/api/v1/screenings/:id` | PUT | تحديث فرز | ES/PM/PrM |
| `/api/v1/screenings/:id/approve` | PATCH | موافقة | ES/PM |
| `/api/v1/screenings/:id/reject` | PATCH | رفض | ES/PM |

### 7.6 Assessment (Tool 2)

| Endpoint | Method | الوصف | الأدوار |
|----------|--------|-------|---------|
| `/api/v1/assessments/project/:projectId` | GET | تقييم المشروع | Public |
| `/api/v1/assessments` | POST | إنشاء تقييم | ES/PM/PrM |
| `/api/v1/assessments/:id` | PUT | تحديث تقييم | ES/PM/PrM |
| `/api/v1/assessments/:id/methods` | POST | إضافة طريقة | ES/PM/PrM |
| `/api/v1/assessments/:id/consultations` | POST | إضافة استشارة | ES/PM/PrM |
| `/api/v1/assessments/:id/scores` | POST | إضافة نتائج | ES/PM/PrM |
| `/api/v1/assessments/:id/calculate` | PATCH | حساب النتيجة | ES/PM |
| `/api/v1/assessments/:id/approve` | PATCH | موافقة | ES/PM |
| `/api/v1/assessments/:id/reject` | PATCH | رفض | ES/PM |

### 7.7 Management Activities (Tool 3)

| Endpoint | Method | الوصف | الأدوار |
|----------|--------|-------|---------|
| `/api/v1/management/project/:projectId` | GET | أنشطة المشروع | Public |
| `/api/v1/management` | POST | إنشاء نشاط | ES/PM/PrM |
| `/api/v1/management/:id` | PUT | تحديث نشاط | ES/PM/PrM |
| `/api/v1/management/:id` | DELETE | حذف نشاط | ES/PM/PrM |

### 7.8 Mitigation Plans (Tool 4)

| Endpoint | Method | الوصف | الأدوار |
|----------|--------|-------|---------|
| `/api/v1/mitigation/project/:projectId` | GET | خطط المشروع | Public |
| `/api/v1/mitigation` | POST | إنشاء خطة | ES/PM |
| `/api/v1/mitigation/:id` | PUT | تحديث خطة | ES/PM |
| `/api/v1/mitigation/:id` | DELETE | حذف خطة | ES/PM |

### 7.9 Monitoring (Tool 5)

| Endpoint | Method | الوصف | الأدوار |
|----------|--------|-------|---------|
| `/api/v1/monitoring/project/:projectId` | GET | سجلات المشروع | Public |
| `/api/v1/monitoring` | POST | إنشاء سجل | ES/PM/PrM |
| `/api/v1/monitoring/:id` | PUT | تحديث سجل | ES/PM/PrM |
| `/api/v1/monitoring/:id/quarter/:q` | PATCH | تحديث ربع | ES/PM/PrM/EFP |

### 7.10 Attachments

| Endpoint | Method | الوصف | الأدوار |
|----------|--------|-------|---------|
| `/api/v1/attachments` | GET | قائمة المرفقات | Public |
| `/api/v1/attachments/upload` | POST | رفع ملف | ES/PM/PrM/EFP |
| `/api/v1/attachments/:id` | DELETE | حذف ملف | ES/PM/PrM |

### 7.11 Reports

| Endpoint | Method | الوصف | الأدوار |
|----------|--------|-------|---------|
| `/api/v1/reports/dashboard` | GET | إحصائيات | All |
| `/api/v1/reports/export` | GET | تصدير | ES/PM |

---

## 8. المكونات والصفحات

### 8.1 الصفحات (19 صفحة)

| الصفحة | المسار | الوصف |
|--------|--------|-------|
| LoginPage | `/login` | تسجيل الدخول |
| DashboardPage | `/app/dashboard` | لوحة التحكم |
| ProjectListPage | `/app/projects` | قائمة المشاريع |
| ProjectCreatePage | `/app/projects/new` | إنشاء مشروع |
| ProjectOverviewPage | `/app/projects/:id/overview` | نظرة عامة على المشروع |
| ScreeningFormPage | `/app/projects/:id/screening` | نموذج الفرز |
| ScreeningSummaryPage | `/app/projects/:id/screening/summary` | ملخص الفرز |
| AssessmentGatewayPage | `/app/projects/:id/assessment` | بوابة التقييم |
| AssessmentMetadataPage | `/app/projects/:id/assessment/metadata` | بيانات التقييم |
| AssessmentMethodsPage | `/app/projects/:id/assessment/methods` | طرق التقييم |
| AssessmentScoringPage | `/app/projects/:id/assessment/scoring` | تسجيل النتائج |
| AssessmentReviewPage | `/app/projects/:id/assessment/review` | مراجعة التقييم |
| SempOverviewPage | `/app/projects/:id/semp` | نظرة عامة SEMP |
| ManagementActivitiesPage | `/app/projects/:id/semp/activities` | أنشطة الإدارة |
| MitigationPlanPage | `/app/projects/:id/semp/mitigation` | خطة التخفيف |
| MonitoringOverviewPage | `/app/projects/:id/monitoring` | نظرة عامة المراقبة |
| MonitoringDataEntryPage | `/app/projects/:id/monitoring/data-entry` | إدخال بيانات المراقبة |
| ProjectFilesPage | `/app/projects/:id/files` | ملفات المشروع |
| AnnexOverviewPage | `/app/projects/:id/annex` | الملحقات |

### 8.2 مكونات UI (24 مكون)

```
Button, Input, Textarea, Select, Checkbox, RadioGroup,
Badge, Card, Table, Modal, Alert, Avatar,
Breadcrumb, ProgressBar, ProgressStepper, Pagination,
Tooltip, Dropdown, Accordion, FileUpload, Icon,
LoadingSpinner, StickyFooter
```

### 8.3 مكونات Layout (7 مكون)

```
AuthLayout, MainLayout, ProjectLayout, SempFullWidthLayout,
Header, MainSidebar, ProjectSidebar, MobileMenu
```

---

## 9. نظام الصلاحيات

### 9.1 الأدوار

| الدور | الرمز | الصلاحيات |
|-------|-------|----------|
| Environmental Specialist | `environmental_specialist` | كل الصلاحيات + تسجيل مستخدمين |
| Program Manager | `program_manager` | إدارة + موافقة/رفض |
| Project Manager | `project_manager` | إنشاء وتحديث |
| Environmental Focal Point | `environmental_focal_point` | تحديث أرباع المراقبة + رفع ملفات |
| Viewer | `viewer` | قراءة فقط |

### 9.2 مصفوفة الصلاحيات

| العملية | ES | PM | PrM | EFP | Viewer |
|---------|:--:|:--:|:---:|:---:|:------:|
| عرض المشاريع | ✅ | ✅ | ✅ | ✅ | ✅ |
| إنشاء مشروع | ✅ | ✅ | ✅ | ❌ | ❌ |
| تحديث مشروع | ✅ | ✅ | ✅ | ❌ | ❌ |
| موافقة/رفض | ✅ | ✅ | ❌ | ❌ | ❌ |
| إنشاء خطة تخفيف | ✅ | ✅ | ❌ | ❌ | ❌ |
| تحديث ربع مراقبة | ✅ | ✅ | ✅ | ✅ | ❌ |
| رفع ملفات | ✅ | ✅ | ✅ | ✅ | ❌ |
| تصدير تقارير | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 10. خطة التكامل المقترحة

### المرحلة 1: إعداد البنية التحتية

1. **إنشاء API Service Layer**
   ```
   frontend/src/services/
   ├── api.js              # Axios instance + interceptors
   ├── authService.js      # Login, logout, token management
   ├── projectService.js   # CRUD projects
   ├── screeningService.js # Tool 1
   ├── assessmentService.js # Tool 2
   ├── sempService.js      # Tools 3 & 4
   ├── monitoringService.js # Tool 5
   └── fileService.js      # Attachments
   ```

2. **إنشاء Auth Context**
   ```
   frontend/src/contexts/
   └── AuthContext.jsx     # User state, token, permissions
   ```

3. **تحديث ProtectedRoute**
   - التحقق من token صالح
   - إعادة التوجيه لـ /login

### المرحلة 2: تكامل Auth

1. تحديث `LoginPage` للاتصال بـ API
2. إنشاء `AuthContext` لإدارة حالة المستخدم
3. تخزين token في localStorage أو httpOnly cookie
4. إضافة interceptor لإرسال token مع كل طلب

### المرحلة 3: تكامل Lookups

1. تحميل البيانات الثابتة عند بدء التطبيق:
   - Impact Categories
   - Impact Questions
   - Indicators
   - Job Titles

2. تخزينها في Context أو React Query cache

### المرحلة 4: تكامل Projects

1. تحديث `DashboardPage` و `ProjectListPage`
2. تحديث `ProjectCreatePage`
3. تحديث `useProjectContext`

### المرحلة 5: تكامل الأدوات

1. **Tool 1 (Screening)**: تحديث `useScreening`
2. **Tool 2 (Assessment)**: تحديث `useAssessment`
3. **Tools 3 & 4 (SEMP)**: تحديث `useSemp`
4. **Tool 5 (Monitoring)**: تحديث `useMonitoring`

### المرحلة 6: تكامل الملفات

1. تحديث `useFiles` للرفع/الحذف
2. تحديث عرض الملفات

### المرحلة 7: التصدير والتقارير

1. تكامل Dashboard statistics
2. تكامل Export (CSV, Excel, PDF)

---

## 📝 ملاحظات مهمة للتكامل

### 1. استبدال Mock Data

كل hook يستخدم حالياً دوال من `@/data`:
```javascript
// قبل (Mock)
import { getScreeningByProjectId } from '@/data'
const screening = getScreeningByProjectId(projectId)

// بعد (API)
import { screeningService } from '@/services'
const screening = await screeningService.getByProject(projectId)
```

### 2. معالجة الأخطاء

```javascript
// نمط موحد للأخطاء
try {
  const result = await api.post('/endpoint', data)
  return { success: true, data: result.data }
} catch (error) {
  const message = error.response?.data?.message || 'An error occurred'
  return { success: false, error: message }
}
```

### 3. Loading States

جميع الـ hooks جاهزة مع:
- `isLoading` - للتحميل الأولي
- `isSaving` - لعمليات الحفظ
- `error` - لعرض الأخطاء

### 4. التوكن والمصادقة

```javascript
// api.js
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
```

---

## 📊 ملخص الأرقام

| المقياس | العدد |
|---------|-------|
| صفحات React | 19 |
| مكونات UI | 24 |
| مكونات متخصصة | 44 |
| Hooks مخصصة | 7 |
| ملفات بيانات | 17 |
| Routes | 25 |
| API Endpoints | ~35 |
| Data Models | 8 |

---

*تم إنشاء هذا التقرير في: 4 فبراير 2026*  
*الإصدار: 1.0*  
*الغرض: مرجع للتخطيط لمرحلة التكامل مع الـ Backend*
