# Phase 4: Auth & Dashboard Domain - خطة تنفيذ تفصيلية
## تاريخ الإنشاء: 24 يناير 2026

---

## 📋 نظرة عامة

### الأهداف الرئيسية
- تحويل صفحات المصادقة (Authentication) من HTML إلى React
- تحويل صفحات لوحة التحكم (Dashboard) من HTML إلى React
- إنشاء ملفات البيانات الوهمية (Mock Data)
- تطبيق التحقق من صحة النماذج (Form Validation)

### المتطلبات المُسبقة
- ✅ Phase 1: Project Setup & Build Pipeline (مكتمل)
- ✅ Phase 2: Component Library - UI Kit (مكتمل)
- ✅ Phase 3: Layout Components & Routing (مكتمل)

### الملفات المرجعية (Static HTML)
| الملف | الصفحة المقابلة |
|-------|-----------------|
| `1.LoginPage.html` | `LoginPage.jsx` |
| `5.DashboardPage.html` | `DashboardPage.jsx` |
| `6.ProjectList.html` | `ProjectListPage.jsx` |
| `7.CreateNewProject.html` | `ProjectCreatePage.jsx` |

---

## 📁 هيكل الملفات المطلوب إنشاؤها

> ⚠️ **ملاحظة:** جميع ملفات البيانات متوافقة مع نماذج Backend في `backend/src/models/`

```
src/
├── pages/
│   ├── auth/
│   │   ├── LoginPage.jsx          ← جديد
│   │   └── index.js               ← تحديث
│   │
│   ├── dashboard/
│   │   ├── DashboardPage.jsx      ← جديد
│   │   └── index.js               ← تحديث
│   │
│   └── projects/
│       ├── ProjectListPage.jsx    ← جديد
│       ├── ProjectCreatePage.jsx  ← جديد
│       └── index.js               ← تحديث
│
├── components/
│   └── dashboard/                 ← مجلد جديد
│       ├── MetricCard.jsx         ← جديد
│       ├── ProjectListItem.jsx    ← جديد
│       ├── WorkflowProgressBar.jsx ← جديد
│       ├── ScreeningCategoryBadge.jsx  ← جديد (بدلاً من RiskCategoryBadge)
│       ├── ProjectStatusBadge.jsx ← جديد
│       └── index.js               ← جديد
│
├── data/                          ← متوافق مع Backend Models
│   ├── mockProjects.js            ← جديد (متوافق مع project.model.js)
│   ├── mockUsers.js               ← جديد (متوافق مع user.model.js + jobTitle.model.js)
│   ├── screeningCategories.js     ← جديد (متوافق مع screening.model.js)
│   ├── workflowStatuses.js        ← جديد (حالات الأدوات الخمس)
│   ├── impactCategories.js        ← جديد (متوافق مع impactCategory.model.js)
│   └── index.js                   ← تحديث
│
└── utils/
    ├── validators.js              ← جديد
    └── formatters.js              ← جديد
```

### مطابقة الملفات مع Backend Models

| ملف Frontend | ملف Backend Model |
|--------------|-------------------|
| `mockProjects.js` | `project.model.js` |
| `mockUsers.js` | `user.model.js` + `jobTitle.model.js` |
| `screeningCategories.js` | `screening.model.js` (category_code enum) |
| `workflowStatuses.js` | حالات من جميع الأدوات |
| `impactCategories.js` | `impactCategory.model.js` + `assessmentImpactScore.model.js` |

---

## 🔢 ترتيب التنفيذ

### المرحلة 4.1: Mock Data & Utilities
### المرحلة 4.2: LoginPage
### المرحلة 4.3: DashboardPage
### المرحلة 4.4: ProjectListPage
### المرحلة 4.5: ProjectCreatePage
### المرحلة 4.6: التكامل والاختبار

---

## 📝 المرحلة 4.1: Mock Data & Utilities

> ⚠️ **ملاحظة مهمة:** جميع البيانات الوهمية متوافقة مع نماذج Backend الموجودة في `backend/src/models/`

### 4.1.1 إنشاء ملف `src/data/mockProjects.js`

**الوصف:** ملف البيانات الوهمية للمشاريع

**متوافق مع:** `backend/src/models/project.model.js`

**حقول Backend الأصلية:**
```javascript
// Project Model Fields:
// - _id: ObjectId (auto)
// - title: String (required)
// - location: String (required)
// - start_date: Date (required)
// - end_date: Date (required)
// - project_component: String (optional) - وصف المكون/النشاط
// - createdAt, updatedAt: timestamps (auto)
```

**منطق حساب حالة كل أداة (Workflow Status Logic):**

> ⚠️ **ملاحظة مهمة:** الـ Backend لا يحتوي على حقل `status` لـ ManagementActivity, MitigationPlan, و MonitoringRecord.
> لذلك يتم حساب الحالة بناءً على وجود السجلات والبيانات.

```javascript
/**
 * === منطق حساب حالة Workflow ===
 * 
 * 1. Screening (Tool 1):
 *    - لديه حقل status في Backend: draft, submitted, approved, rejected
 *    - pending → لم يُنشأ بعد
 *    - needs_action → status === 'rejected'
 * 
 * 2. Assessment (Tool 2):
 *    - لديه حقل status في Backend: draft, submitted, approved, rejected
 *    - pending → لم يُنشأ بعد
 *    - needs_action → status === 'rejected'
 * 
 * 3. SEMP - Tools 3 & 4 (صفحة واحدة في Frontend):
 *    - ❌ لا يوجد حقل status في Backend
 *    - pending → لا توجد سجلات ManagementActivity للمشروع
 *    - in_progress → توجد سجلات ManagementActivity ولكن لا توجد MitigationPlan
 *    - completed → توجد سجلات MitigationPlan للمشروع
 * 
 * 4. Monitoring (Tool 5):
 *    - ❌ لا يوجد حقل status في Backend
 *    - pending → لا توجد سجلات MonitoringRecord للمشروع
 *    - in_progress → توجد سجلات ولكن Q4 غير معبأ
 *    - completed → Q4 معبأ (آخر quarter تم إضافته)
 */
```

**البنية المطلوبة للـ Frontend:**

```javascript
/**
 * Mock Projects Data
 * متوافق مع backend/src/models/project.model.js
 * 
 * الحقول الإضافية (icon, screening, workflow) هي للعرض في Frontend فقط
 * وستُحسب من العلاقات مع الجداول الأخرى عند التكامل مع API
 */
export const mockProjects = [
  {
    // === الحقول الأساسية (من Backend) ===
    _id: '507f1f77bcf86cd799439011',
    title: 'Water Sanitation Phase II',
    location: 'Kisumu, Kenya',
    start_date: '2024-01-15',
    end_date: '2025-12-31',
    project_component: 'Construction of water treatment facility and distribution network for rural communities',
    createdAt: '2024-01-10T10:00:00.000Z',
    updatedAt: '2024-06-15T14:30:00.000Z',
    
    // === الحقول المحسوبة للعرض (Frontend Only) ===
    icon: 'water_drop',  // أيقونة Material Symbols
    
    // بيانات الفرز (من Screening model)
    screening: {
      _id: '507f1f77bcf86cd799439021',
      category_code: 'B',  // A, B, C, D, E, F (من Backend)
      status: 'approved',   // draft, submitted, approved, rejected
      screening_date: '2024-01-20'
    },
    
    // === تقدم سير العمل (محسوب) ===
    // ملاحظة: SEMP يجمع Tools 3 & 4 في صفحة واحدة
    workflow: {
      screening: { status: 'approved', tool: 1 },       // من screening.status
      assessment: { status: 'approved', tool: 2 },      // من assessment.status
      semp: { status: 'in_progress', tools: [3, 4] },   // محسوب: management + mitigation
      monitoring: { status: 'pending', tool: 5 }        // محسوب: Q4 filled?
    },
    
    // === بيانات إضافية لحساب الحالة (Mock) ===
    _computed: {
      hasManagementActivities: true,   // توجد سجلات ManagementActivity
      hasMitigationPlans: false,       // لا توجد سجلات MitigationPlan بعد
      monitoringQuarters: {            // حالة كل Quarter
        Q1: true,
        Q2: true,
        Q3: false,
        Q4: false
      }
    }
  },
  {
    _id: '507f1f77bcf86cd799439012',
    title: 'Community Solar Grid',
    location: 'Arusha, Tanzania',
    start_date: '2024-03-01',
    end_date: '2026-03-01',
    project_component: 'Installation of solar panels and grid infrastructure for community power supply',
    createdAt: '2024-02-20T08:00:00.000Z',
    updatedAt: '2024-02-20T08:00:00.000Z',
    icon: 'solar_power',
    screening: {
      _id: '507f1f77bcf86cd799439022',
      category_code: 'C',
      status: 'draft',
      screening_date: null
    },
    workflow: {
      screening: { status: 'draft', tool: 1 },
      assessment: { status: 'pending', tool: 2 },
      semp: { status: 'pending', tools: [3, 4] },
      monitoring: { status: 'pending', tool: 5 }
    },
    _computed: {
      hasManagementActivities: false,
      hasMitigationPlans: false,
      monitoringQuarters: { Q1: false, Q2: false, Q3: false, Q4: false }
    }
  },
  {
    _id: '507f1f77bcf86cd799439013',
    title: 'Reforestation Initiative',
    location: 'Amazonas, Brazil',
    start_date: '2023-01-01',
    end_date: '2028-01-01',
    project_component: 'Large-scale tree planting and ecosystem restoration in degraded forest areas',
    createdAt: '2022-12-15T09:00:00.000Z',
    updatedAt: '2024-06-01T16:00:00.000Z',
    icon: 'forest',
    screening: {
      _id: '507f1f77bcf86cd799439023',
      category_code: 'A',
      status: 'approved',
      screening_date: '2023-01-10'
    },
    workflow: {
      screening: { status: 'approved', tool: 1 },
      assessment: { status: 'approved', tool: 2 },
      semp: { status: 'completed', tools: [3, 4] },      // MitigationPlan exists
      monitoring: { status: 'in_progress', tool: 5 }     // Q4 not filled yet
    },
    _computed: {
      hasManagementActivities: true,
      hasMitigationPlans: true,    // ← SEMP completed
      monitoringQuarters: { Q1: true, Q2: true, Q3: true, Q4: false }  // Q4 missing
    }
  },
  {
    _id: '507f1f77bcf86cd799439014',
    title: 'Urban Waste Management',
    location: 'Mumbai, India',
    start_date: '2024-06-01',
    end_date: '2024-12-31',
    project_component: 'Implementation of waste collection and recycling program in urban areas',
    createdAt: '2024-05-15T11:00:00.000Z',
    updatedAt: '2024-06-20T10:00:00.000Z',
    icon: 'delete',
    screening: {
      _id: '507f1f77bcf86cd799439024',
      category_code: 'B',
      status: 'rejected',
      screening_date: '2024-06-10'
    },
    workflow: {
      screening: { status: 'needs_action', tool: 1 },    // rejected = needs_action
      assessment: { status: 'pending', tool: 2 },
      semp: { status: 'pending', tools: [3, 4] },
      monitoring: { status: 'pending', tool: 5 }
    },
    _computed: {
      hasManagementActivities: false,
      hasMitigationPlans: false,
      monitoringQuarters: { Q1: false, Q2: false, Q3: false, Q4: false }
    }
  },
  {
    _id: '507f1f77bcf86cd799439015',
    title: 'Clean Water Initiative',
    location: 'Nairobi, Kenya',
    start_date: '2024-02-01',
    end_date: '2025-08-01',
    project_component: 'Water purification and distribution system for peri-urban settlements',
    createdAt: '2024-01-20T07:00:00.000Z',
    updatedAt: '2024-04-10T12:00:00.000Z',
    icon: 'water_drop',
    screening: {
      _id: '507f1f77bcf86cd799439025',
      category_code: 'C',
      status: 'approved',
      screening_date: '2024-02-05'
    },
    workflow: {
      screening: { status: 'approved', tool: 1 },
      assessment: { status: 'in_progress', tool: 2 },
      semp: { status: 'pending', tools: [3, 4] },
      monitoring: { status: 'pending', tool: 5 }
    },
    _computed: {
      hasManagementActivities: false,
      hasMitigationPlans: false,
      monitoringQuarters: { Q1: false, Q2: false, Q3: false, Q4: false }
    }
  },
  {
    _id: '507f1f77bcf86cd799439016',
    title: 'Solar Grid Expansion',
    location: 'Rajasthan, India',
    start_date: '2024-04-01',
    end_date: '2026-04-01',
    project_component: 'Expansion of existing solar power grid to additional villages',
    createdAt: '2024-03-10T06:00:00.000Z',
    updatedAt: '2024-03-10T06:00:00.000Z',
    icon: 'solar_power',
    screening: {
      _id: '507f1f77bcf86cd799439026',
      category_code: 'B',
      status: 'draft',
      screening_date: null
    },
    workflow: {
      screening: { status: 'draft', tool: 1 },
      assessment: { status: 'pending', tool: 2 },
      semp: { status: 'pending', tools: [3, 4] },
      monitoring: { status: 'pending', tool: 5 }
    },
    _computed: {
      hasManagementActivities: false,
      hasMitigationPlans: false,
      monitoringQuarters: { Q1: false, Q2: false, Q3: false, Q4: false }
    }
  },
  {
    _id: '507f1f77bcf86cd799439017',
    title: 'Reforestation Zone B',
    location: 'Amazonas, Brazil',
    start_date: '2023-06-01',
    end_date: '2027-06-01',
    project_component: 'Secondary reforestation zone with indigenous species restoration',
    createdAt: '2023-05-20T08:00:00.000Z',
    updatedAt: '2024-05-15T09:00:00.000Z',
    icon: 'forest',
    screening: {
      _id: '507f1f77bcf86cd799439027',
      category_code: 'A',
      status: 'approved',
      screening_date: '2023-06-10'
    },
    workflow: {
      screening: { status: 'approved', tool: 1 },
      assessment: { status: 'approved', tool: 2 },
      semp: { status: 'completed', tools: [3, 4] },
      monitoring: { status: 'in_progress', tool: 5 }
    },
    _computed: {
      hasManagementActivities: true,
      hasMitigationPlans: true,
      monitoringQuarters: { Q1: true, Q2: true, Q3: false, Q4: false }
    }
  },
  {
    _id: '507f1f77bcf86cd799439018',
    title: 'Community School #4',
    location: 'Jakarta, Indonesia',
    start_date: '2023-01-15',
    end_date: '2024-01-15',
    project_component: 'Construction of eco-friendly school building with sustainable design',
    createdAt: '2022-12-01T10:00:00.000Z',
    updatedAt: '2024-01-20T11:00:00.000Z',
    icon: 'school',
    screening: {
      _id: '507f1f77bcf86cd799439028',
      category_code: 'C',
      status: 'approved',
      screening_date: '2023-01-20'
    },
    workflow: {
      screening: { status: 'approved', tool: 1 },
      assessment: { status: 'approved', tool: 2 },
      semp: { status: 'completed', tools: [3, 4] },
      monitoring: { status: 'completed', tool: 5 }    // Q4 filled = completed
    },
    _computed: {
      hasManagementActivities: true,
      hasMitigationPlans: true,
      monitoringQuarters: { Q1: true, Q2: true, Q3: true, Q4: true }  // All quarters filled
    }
  },
  {
    _id: '507f1f77bcf86cd799439019',
    title: 'Sustainable Farming',
    location: 'Mekong Delta, Vietnam',
    start_date: '2024-03-01',
    end_date: '2025-09-01',
    project_component: 'Training and infrastructure for sustainable agricultural practices',
    createdAt: '2024-02-15T09:00:00.000Z',
    updatedAt: '2024-05-20T14:00:00.000Z',
    icon: 'agriculture',
    screening: {
      _id: '507f1f77bcf86cd799439029',
      category_code: 'C',
      status: 'approved',
      screening_date: '2024-03-10'
    },
    workflow: {
      screening: { status: 'approved', tool: 1 },
      assessment: { status: 'approved', tool: 2 },
      semp: { status: 'in_progress', tools: [3, 4] },  // Has management but no mitigation
      monitoring: { status: 'pending', tool: 5 }
    },
    _computed: {
      hasManagementActivities: true,
      hasMitigationPlans: false,    // ← No mitigation yet, so SEMP is in_progress
      monitoringQuarters: { Q1: false, Q2: false, Q3: false, Q4: false }
    }
  }
];

/**
 * === دوال حساب حالة Workflow ===
 */

/**
 * حساب حالة SEMP (Tools 3 & 4)
 * @param {boolean} hasManagement - هل توجد سجلات ManagementActivity
 * @param {boolean} hasMitigation - هل توجد سجلات MitigationPlan
 * @returns {string} - pending | in_progress | completed
 */
export function calculateSempStatus(hasManagement, hasMitigation) {
  if (hasMitigation) return 'completed';
  if (hasManagement) return 'in_progress';
  return 'pending';
}

/**
 * حساب حالة Monitoring (Tool 5)
 * @param {Object} quarters - { Q1: bool, Q2: bool, Q3: bool, Q4: bool }
 * @returns {string} - pending | in_progress | completed
 */
export function calculateMonitoringStatus(quarters) {
  if (!quarters) return 'pending';
  
  // إذا تم ملء Q4 = مكتمل
  if (quarters.Q4) return 'completed';
  
  // إذا تم ملء أي quarter آخر = قيد التنفيذ
  if (quarters.Q1 || quarters.Q2 || quarters.Q3) return 'in_progress';
  
  return 'pending';
}

/**
 * حساب حالة المشروع العامة من workflow
 * @param {Object} workflow - كائن workflow من المشروع
 * @returns {string} - حالة المشروع
 */
export function calculateProjectStatus(workflow) {
  // إذا كان هناك أي tool يحتاج إجراء
  const hasNeedsAction = Object.values(workflow).some(w => w.status === 'needs_action');
  if (hasNeedsAction) return 'needs_action';
  
  // إذا اكتملت جميع الأدوات
  const allCompleted = Object.values(workflow).every(w => 
    w.status === 'approved' || w.status === 'completed'
  );
  if (allCompleted) return 'completed';
  
  // إذا كان Monitoring قيد التنفيذ
  if (workflow.monitoring.status === 'in_progress') return 'monitoring';
  
  // إذا لم يبدأ Screening بعد
  if (workflow.screening.status === 'draft' || workflow.screening.status === 'pending') return 'draft';
  
  // أي حالة أخرى = قيد التنفيذ
  return 'in_progress';
}
```

**جدول المشاريع مع فئات المخاطر الصحيحة:**

| # | اسم المشروع | الموقع | فئة المخاطر (Backend) | الحالة |
|---|-------------|--------|----------------------|--------|
| 1 | Water Sanitation Phase II | Kisumu, Kenya | **B** | In Progress |
| 2 | Community Solar Grid | Arusha, Tanzania | **C** | Draft |
| 3 | Reforestation Initiative | Amazonas, Brazil | **A** | Monitoring |
| 4 | Urban Waste Management | Mumbai, India | **B** | Needs Action |
| 5 | Clean Water Initiative | Nairobi, Kenya | **C** | In Progress |
| 6 | Solar Grid Expansion | Rajasthan, India | **B** | Draft |
| 7 | Reforestation Zone B | Amazonas, Brazil | **A** | Monitoring |
| 8 | Community School #4 | Jakarta, Indonesia | **C** | Completed |
| 9 | Sustainable Farming | Vietnam | **C** | In Progress |

> ⚠️ **ملاحظة:** الـ Backend يدعم فقط الفئات **A, B, C, D, E, F** - لا يوجد B+ في النموذج

---

### 4.1.2 إنشاء ملف `src/data/mockUsers.js`

**الوصف:** ملف البيانات الوهمية للمستخدمين

**متوافق مع:** `backend/src/models/user.model.js`

**حقول Backend الأصلية:**
```javascript
// User Model Fields:
// - _id: ObjectId (auto)
// - name: String (required)
// - email: String (required, unique, lowercase)
// - password: String (required, hashed)
// - job_title: ObjectId (ref: 'JobTitle')
// - role: enum ['environmental_specialist', 'program_manager', 'project_manager', 'environmental_focal_point', 'viewer']
// - is_active: Boolean (default: true)
// - createdAt, updatedAt: timestamps (auto)
```

**البنية المطلوبة للـ Frontend:**

```javascript
/**
 * User Roles - متوافق مع Backend
 * backend/src/models/user.model.js
 */
export const USER_ROLES = {
  ENVIRONMENTAL_SPECIALIST: 'environmental_specialist',
  PROGRAM_MANAGER: 'program_manager',
  PROJECT_MANAGER: 'project_manager',
  ENVIRONMENTAL_FOCAL_POINT: 'environmental_focal_point',
  VIEWER: 'viewer'
};

/**
 * Role Labels للعرض في UI
 */
export const ROLE_LABELS = {
  'environmental_specialist': 'Environmental Specialist',
  'program_manager': 'Program Manager',
  'project_manager': 'Project Manager',
  'environmental_focal_point': 'Environmental Focal Point',
  'viewer': 'Viewer'
};

/**
 * Job Titles - متوافق مع backend/src/models/jobTitle.model.js
 */
export const mockJobTitles = [
  { _id: '507f1f77bcf86cd799439101', title_name: 'Environmental Specialist' },
  { _id: '507f1f77bcf86cd799439102', title_name: 'Program Manager' },
  { _id: '507f1f77bcf86cd799439103', title_name: 'Project Manager' },
  { _id: '507f1f77bcf86cd799439104', title_name: 'Environmental focal point' },
  { _id: '507f1f77bcf86cd799439105', title_name: 'Viewer' }
];

/**
 * Mock Users Data
 * متوافق مع backend/src/models/user.model.js
 */
export const mockUsers = [
  {
    _id: '507f1f77bcf86cd799439001',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@akdn.org',
    job_title: mockJobTitles[1], // Program Manager
    role: USER_ROLES.PROGRAM_MANAGER,
    is_active: true,
    createdAt: '2023-01-15T10:00:00.000Z',
    updatedAt: '2024-01-10T08:00:00.000Z',
    // Frontend-only fields for display
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA52tcJunHAhhNIJhwfqL97jYLTGmUSuxY1_GSq3m2_NitXeBriNHT2vsga1wvUIExbM0f02SY8gqpZMQqipeYkxUMWZpVPdpPyXQFCpmCVqUasUIy7l-LskaJ6NDq8ZD-vkl6Ikc3PIda1PG3cbVPnKhYj05d6Qy0oMqftfSep-hrauSQYJ5kYoxH8i_FqBoh9ksg5hmmZIDcIhA9uMMFZqB1nKU6XMRmJV3XVXfQIDb6kkSH-IJWCnJgbDuKRuD_QCqAnrQHjN2Ik'
  },
  {
    _id: '507f1f77bcf86cd799439002',
    name: 'Ahmed Hassan',
    email: 'ahmed.hassan@akdn.org',
    job_title: mockJobTitles[0], // Environmental Specialist
    role: USER_ROLES.ENVIRONMENTAL_SPECIALIST,
    is_active: true,
    createdAt: '2023-03-20T09:00:00.000Z',
    updatedAt: '2024-02-15T11:00:00.000Z',
    avatar: null
  },
  {
    _id: '507f1f77bcf86cd799439003',
    name: 'Maria Santos',
    email: 'maria.santos@akdn.org',
    job_title: mockJobTitles[2], // Project Manager
    role: USER_ROLES.PROJECT_MANAGER,
    is_active: true,
    createdAt: '2023-06-10T08:00:00.000Z',
    updatedAt: '2024-03-01T10:00:00.000Z',
    avatar: null
  },
  {
    _id: '507f1f77bcf86cd799439004',
    name: 'John Smith',
    email: 'john.smith@akdn.org',
    job_title: mockJobTitles[3], // Environmental focal point
    role: USER_ROLES.ENVIRONMENTAL_FOCAL_POINT,
    is_active: true,
    createdAt: '2023-09-01T07:00:00.000Z',
    updatedAt: '2024-01-20T09:00:00.000Z',
    avatar: null
  },
  {
    _id: '507f1f77bcf86cd799439005',
    name: 'Guest User',
    email: 'guest@akdn.org',
    job_title: mockJobTitles[4], // Viewer
    role: USER_ROLES.VIEWER,
    is_active: true,
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z',
    avatar: null
  }
];

/**
 * المستخدم الحالي (للـ Mock)
 */
export const currentUser = mockUsers[0];

/**
 * الحصول على اسم العرض للدور
 * @param {string} role - رمز الدور
 * @returns {string} - اسم العرض
 */
export function getRoleDisplayName(role) {
  return ROLE_LABELS[role] || role;
}
```

---

### 4.1.3 إنشاء ملف `src/data/screeningCategories.js`

**الوصف:** تعريفات فئات الفرز (Screening Categories)

**متوافق مع:** `backend/src/models/screening.model.js`

**حقول Backend:**
```javascript
// Screening category_code: enum ['A', 'B', 'C', 'D', 'E', 'F']
```

**البنية المطلوبة:**

```javascript
/**
 * Screening Categories (Tool 1)
 * متوافق مع backend/src/models/screening.model.js
 * 
 * هذه الفئات تُستخدم في Tool 1 (Environmental Integration Screening)
 * لتحديد مستوى الخطورة البيئية للمشروع
 */
export const screeningCategories = {
  'A': {
    code: 'A',
    label: 'High Risk',
    labelAr: 'مخاطر عالية',
    description: 'Significant environmental or social impacts - requires full EIA',
    descriptionAr: 'مخاطر بيئية عالية، يحتاج تقييم أثر بيئي كامل',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-700 dark:text-red-400',
    borderColor: 'border-red-200 dark:border-red-800',
    requiresAssessment: true,  // يحتاج Tool 2
    canProceed: true
  },
  'B': {
    code: 'B',
    label: 'Low-Moderate Risk',
    labelAr: 'مخاطر منخفضة-متوسطة',
    description: 'Low to moderate risks that can be mitigated',
    descriptionAr: 'مخاطر منخفضة-متوسطة، قابلة للتخفيف',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    textColor: 'text-yellow-700 dark:text-yellow-400',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    requiresAssessment: true,  // يحتاج Tool 2
    canProceed: true
  },
  'C': {
    code: 'C',
    label: 'Negligible Risk',
    labelAr: 'مخاطر شبه معدومة',
    description: 'Minimal to no environmental or social impacts',
    descriptionAr: 'مخاطر شبه معدومة',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-700 dark:text-green-400',
    borderColor: 'border-green-200 dark:border-green-800',
    requiresAssessment: false, // قد لا يحتاج Tool 2
    canProceed: true
  },
  'D': {
    code: 'D',
    label: 'Emergency',
    labelAr: 'حالات الطوارئ',
    description: 'Emergency response project with expedited process',
    descriptionAr: 'حالات الطوارئ - إجراءات مُسرّعة',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-700 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-800',
    requiresAssessment: false, // قد لا يحتاج Tool 2
    canProceed: true
  },
  'E': {
    code: 'E',
    label: 'Insufficient Info',
    labelAr: 'معلومات غير كافية',
    description: 'Cannot proceed - requires additional information gathering',
    descriptionAr: 'معلومات غير كافية - لا يمكن المتابعة',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    textColor: 'text-gray-700 dark:text-gray-400',
    borderColor: 'border-gray-200 dark:border-gray-700',
    requiresAssessment: false,
    canProceed: true  
  },
  'F': {
    code: 'F',
    label: 'Positive Impact',
    labelAr: 'أثر بيئي إيجابي',
    description: 'Net positive environmental or social impact',
    descriptionAr: 'أثر بيئي إيجابي صافي',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    textColor: 'text-emerald-700 dark:text-emerald-400',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    requiresAssessment: false, // قد لا يحتاج Tool 2
    canProceed: true
  }
};

/**
 * Screening Status - حالات الفرز
 * متوافق مع backend/src/models/screening.model.js
 */
export const screeningStatuses = {
  'draft': {
    label: 'Draft',
    labelAr: 'مسودة',
    bgColor: 'bg-gray-50 dark:bg-gray-800',
    textColor: 'text-gray-600 dark:text-gray-300',
    borderColor: 'border-gray-200 dark:border-gray-700'
  },
  'submitted': {
    label: 'Submitted',
    labelAr: 'تم الإرسال',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-700 dark:text-blue-300',
    borderColor: 'border-blue-100 dark:border-blue-800'
  },
  'approved': {
    label: 'Approved',
    labelAr: 'تمت الموافقة',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    textColor: 'text-green-700 dark:text-green-300',
    borderColor: 'border-green-100 dark:border-green-800'
  },
  'rejected': {
    label: 'Rejected',
    labelAr: 'مرفوض',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    textColor: 'text-red-700 dark:text-red-300',
    borderColor: 'border-red-100 dark:border-red-800'
  }
};

/**
 * الحصول على معلومات الفئة
 * @param {string} code - رمز الفئة
 * @returns {Object|null}
 */
export function getScreeningCategory(code) {
  return screeningCategories[code] || null;
}
```

---

### 4.1.4 إنشاء ملف `src/data/workflowStatuses.js`

**الوصف:** تعريفات حالات سير العمل للأدوات الخمس

> ⚠️ **ملاحظة:** في الـ Frontend، يتم دمج Tools 3 & 4 في صفحة واحدة تسمى "SEMP"

**البنية المطلوبة:**

```javascript
/**
 * Workflow Tools
 * الأدوات الخمس الرئيسية في النظام
 * 
 * ملاحظة: Tools 3 & 4 مدمجة في صفحة SEMP واحدة في Frontend
 */
export const WORKFLOW_TOOLS = {
  SCREENING: { 
    key: 'screening', 
    number: 1, 
    label: 'Screening', 
    labelAr: 'الفرز',
    hasBackendStatus: true  // لديه حقل status في Backend
  },
  ASSESSMENT: { 
    key: 'assessment', 
    number: 2, 
    label: 'Assessment', 
    labelAr: 'التقييم',
    hasBackendStatus: true  // لديه حقل status في Backend
  },
  SEMP: { 
    key: 'semp', 
    numbers: [3, 4],        // يجمع Tool 3 & 4
    label: 'SEMP', 
    labelAr: 'خطة الإدارة',
    hasBackendStatus: false, // ❌ لا يوجد حقل status - محسوب
    description: 'Management Activities (Tool 3) + Mitigation Plan (Tool 4)'
  },
  MONITORING: { 
    key: 'monitoring', 
    number: 5, 
    label: 'Monitoring', 
    labelAr: 'المراقبة',
    hasBackendStatus: false  // ❌ لا يوجد حقل status - محسوب من Q1-Q4
  }
};

/**
 * === منطق حساب الحالة لكل أداة ===
 * 
 * SCREENING & ASSESSMENT:
 *   - يستخدمان حقل `status` من Backend مباشرة
 *   - القيم: draft, submitted, approved, rejected
 *   - rejected يُعرض كـ needs_action في UI
 * 
 * SEMP (Tools 3 & 4):
 *   - pending: لا توجد سجلات ManagementActivity للمشروع
 *   - in_progress: توجد ManagementActivity ولكن لا توجد MitigationPlan
 *   - completed: توجد سجلات MitigationPlan للمشروع
 * 
 * MONITORING (Tool 5):
 *   - pending: لا توجد سجلات MonitoringRecord للمشروع
 *   - in_progress: توجد سجلات ولكن Q4 غير معبأ
 *   - completed: Q4 معبأ (تم ملء آخر quarter)
 */

/**
 * Workflow Step Statuses
 * حالات كل خطوة في سير العمل
 */
export const workflowStepStatuses = {
  // === حالات عامة ===
  'pending': {
    key: 'pending',
    label: 'Pending',
    labelAr: 'قيد الانتظار',
    color: 'bg-gray-200 dark:bg-gray-700',
    textColor: 'text-gray-500 dark:text-gray-400',
    isComplete: false
  },
  'draft': {
    key: 'draft',
    label: 'Draft',
    labelAr: 'مسودة',
    color: 'bg-gray-300 dark:bg-gray-600',
    textColor: 'text-gray-600 dark:text-gray-300',
    isComplete: false
  },
  'in_progress': {
    key: 'in_progress',
    label: 'In Progress',
    labelAr: 'قيد التنفيذ',
    color: 'bg-blue-500',
    textColor: 'text-blue-600 dark:text-blue-400',
    isComplete: false
  },
  
  // === حالات Screening & Assessment (من Backend) ===
  'submitted': {
    key: 'submitted',
    label: 'Submitted',
    labelAr: 'تم الإرسال',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-600 dark:text-yellow-400',
    isComplete: false
  },
  'approved': {
    key: 'approved',
    label: 'Approved',
    labelAr: 'تمت الموافقة',
    color: 'bg-primary',
    textColor: 'text-primary',
    isComplete: true  // ← يُعتبر مكتمل
  },
  'rejected': {
    key: 'rejected',
    label: 'Rejected',
    labelAr: 'مرفوض',
    color: 'bg-red-500',
    textColor: 'text-red-600 dark:text-red-400',
    isComplete: false
  },
  
  // === حالات SEMP & Monitoring (محسوبة) ===
  'completed': {
    key: 'completed',
    label: 'Completed',
    labelAr: 'مكتمل',
    color: 'bg-primary',
    textColor: 'text-primary',
    isComplete: true  // ← يُعتبر مكتمل
  },
  
  // === حالة خاصة ===
  'needs_action': {
    key: 'needs_action',
    label: 'Needs Action',
    labelAr: 'يحتاج إجراء',
    color: 'bg-red-500',
    textColor: 'text-red-600 dark:text-red-400',
    isComplete: false
  }
};

/**
 * تحويل حالة Backend إلى حالة العرض
 * @param {string} backendStatus - الحالة من Backend
 * @param {string} toolKey - مفتاح الأداة
 * @returns {string} - حالة العرض
 */
export function mapBackendStatusToDisplay(backendStatus, toolKey) {
  // Screening & Assessment: rejected = needs_action
  if (['screening', 'assessment'].includes(toolKey) && backendStatus === 'rejected') {
    return 'needs_action';
  }
  return backendStatus;
}

/**
 * Project Overall Statuses
 * حالات المشروع العامة (محسوبة من workflow)
 */
export const projectStatuses = {
  'draft': {
    key: 'draft',
    label: 'Draft',
    labelAr: 'مسودة',
    bgColor: 'bg-gray-50 dark:bg-gray-800',
    textColor: 'text-gray-600 dark:text-gray-300',
    borderColor: 'border-gray-200 dark:border-gray-700',
    dotColor: 'bg-gray-500'
  },
  'in_progress': {
    key: 'in_progress',
    label: 'In Progress',
    labelAr: 'قيد التنفيذ',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-700 dark:text-blue-300',
    borderColor: 'border-blue-100 dark:border-blue-800',
    dotColor: 'bg-blue-500'
  },
  'monitoring': {
    key: 'monitoring',
    label: 'Active Monitoring',
    labelAr: 'مراقبة نشطة',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    textColor: 'text-purple-700 dark:text-purple-300',
    borderColor: 'border-purple-100 dark:border-purple-800',
    dotColor: 'bg-purple-500'
  },
  'needs_action': {
    key: 'needs_action',
    label: 'Needs Action',
    labelAr: 'يحتاج إجراء',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    textColor: 'text-red-700 dark:text-red-300',
    borderColor: 'border-red-100 dark:border-red-800',
    icon: 'priority_high'
  },
  'completed': {
    key: 'completed',
    label: 'Completed',
    labelAr: 'مكتمل',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    textColor: 'text-green-700 dark:text-green-300',
    borderColor: 'border-green-100 dark:border-green-800',
    dotColor: 'bg-green-500'
  }
};
```

---

### 4.1.5 إنشاء ملف `src/data/impactCategories.js`

**الوصف:** فئات التأثير (من Lookup Tables)

**متوافق مع:** `backend/src/models/impactCategory.model.js`

**البنية المطلوبة:**

```javascript
/**
 * Impact Categories (Tool 2)
 * متوافق مع backend/src/models/impactCategory.model.js
 * هذه البيانات تُحمّل من API في الإنتاج
 */
export const impactCategories = [
  {
    _id: '507f1f77bcf86cd799439201',
    code: 'A',
    name: 'Air Quality',
    name_ar: 'جودة الهواء'
  },
  {
    _id: '507f1f77bcf86cd799439202',
    code: 'B',
    name: 'Water Quality',
    name_ar: 'جودة المياه'
  },
  {
    _id: '507f1f77bcf86cd799439203',
    code: 'C',
    name: 'Noise',
    name_ar: 'الضجيج'
  },
  {
    _id: '507f1f77bcf86cd799439204',
    code: 'D',
    name: 'Solid Waste',
    name_ar: 'النفايات الصلبة'
  },
  {
    _id: '507f1f77bcf86cd799439205',
    code: 'E',
    name: 'Radiation',
    name_ar: 'الإشعاع'
  },
  {
    _id: '507f1f77bcf86cd799439206',
    code: 'F',
    name: 'Toxic & Dangerous Materials',
    name_ar: 'المواد الخطرة'
  },
  {
    _id: '507f1f77bcf86cd799439207',
    code: 'J',
    name: 'Plants, Forests & Wildlife',
    name_ar: 'النباتات والحياة البرية'
  },
  {
    _id: '507f1f77bcf86cd799439208',
    code: 'H',
    name: 'Land Use & Social Impacts',
    name_ar: 'استخدام الأرض والمجتمع'
  }
];

/**
 * Impact Levels (للتقييم في Tool 2)
 * متوافق مع backend/src/models/assessmentImpactScore.model.js
 */
export const impactLevels = {
  'negligible': {
    key: 'negligible',
    label: 'Negligible',
    labelAr: 'مهمل',
    value: 0,
    color: 'bg-gray-100 text-gray-700'
  },
  'low': {
    key: 'low',
    label: 'Low',
    labelAr: 'منخفض',
    value: 1,
    color: 'bg-green-100 text-green-700'
  },
  'medium': {
    key: 'medium',
    label: 'Medium',
    labelAr: 'متوسط',
    value: 2,
    color: 'bg-yellow-100 text-yellow-700'
  },
  'high': {
    key: 'high',
    label: 'High',
    labelAr: 'عالي',
    value: 3,
    color: 'bg-red-100 text-red-700'
  },
  'not_applicable': {
    key: 'not_applicable',
    label: 'N/A',
    labelAr: 'غير قابل للتطبيق',
    value: -1,
    color: 'bg-gray-50 text-gray-500'
  }
};
```

---

### 4.1.5 إنشاء ملف `src/utils/validators.js`

**الوصف:** دوال التحقق من صحة النماذج

**الدوال المطلوبة:**

```javascript
/**
 * التحقق من صحة البريد الإلكتروني
 * @param {string} email 
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateEmail(email) {
  if (!email || !email.trim()) {
    return { valid: false, error: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }
  
  return { valid: true, error: null };
}

/**
 * التحقق من صحة كلمة المرور
 * @param {string} password 
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validatePassword(password) {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }
  
  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' };
  }
  
  return { valid: true, error: null };
}

/**
 * التحقق من صحة عنوان المشروع
 * @param {string} title 
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateProjectTitle(title) {
  if (!title || !title.trim()) {
    return { valid: false, error: 'Project title is required' };
  }
  
  if (title.trim().length < 3) {
    return { valid: false, error: 'Project title must be at least 3 characters' };
  }
  
  if (title.trim().length > 100) {
    return { valid: false, error: 'Project title must be less than 100 characters' };
  }
  
  return { valid: true, error: null };
}

/**
 * التحقق من صحة الموقع
 * @param {string} location 
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateLocation(location) {
  if (!location || !location.trim()) {
    return { valid: false, error: 'Location is required' };
  }
  
  return { valid: true, error: null };
}

/**
 * التحقق من صحة التواريخ
 * @param {string} startDate 
 * @param {string} endDate 
 * @returns {{ valid: boolean, errors: { startDate?: string, endDate?: string } }}
 */
export function validateDates(startDate, endDate) {
  const errors = {};
  
  if (!startDate) {
    errors.startDate = 'Start date is required';
  }
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end <= start) {
      errors.endDate = 'End date must be after start date';
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * التحقق من نموذج إنشاء المشروع
 * @param {Object} formData 
 * @returns {{ valid: boolean, errors: Object }}
 */
export function validateProjectForm(formData) {
  const errors = {};
  
  const titleValidation = validateProjectTitle(formData.title);
  if (!titleValidation.valid) {
    errors.title = titleValidation.error;
  }
  
  const locationValidation = validateLocation(formData.location);
  if (!locationValidation.valid) {
    errors.location = locationValidation.error;
  }
  
  const datesValidation = validateDates(formData.startDate, formData.endDate);
  if (!datesValidation.valid) {
    Object.assign(errors, datesValidation.errors);
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}
```

---

### 4.1.6 إنشاء ملف `src/utils/formatters.js`

**الوصف:** دوال تنسيق البيانات

**الدوال المطلوبة:**

```javascript
/**
 * تنسيق التاريخ
 * @param {string | Date} date 
 * @param {Object} options 
 * @returns {string}
 */
export function formatDate(date, options = {}) {
  if (!date) return '';
  
  const d = new Date(date);
  const defaultOptions = {
    month: 'short',
    year: 'numeric',
    ...options
  };
  
  return d.toLocaleDateString('en-US', defaultOptions);
}

/**
 * حساب مدة المشروع بالأشهر
 * @param {string} startDate 
 * @param {string} endDate 
 * @returns {number}
 */
export function calculateDurationMonths(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const months = (end.getFullYear() - start.getFullYear()) * 12 
    + (end.getMonth() - start.getMonth());
  
  return Math.max(0, months);
}

/**
 * تنسيق نطاق التواريخ
 * @param {string} startDate 
 * @param {string} endDate 
 * @returns {string}
 */
export function formatDateRange(startDate, endDate) {
  const start = formatDate(startDate);
  const end = endDate ? formatDate(endDate) : 'Present';
  
  return `${start} - ${end}`;
}

/**
 * تنسيق مدة المشروع
 * @param {number} months 
 * @returns {string}
 */
export function formatDuration(months) {
  if (months === 1) return '1 Month';
  return `${months} Months`;
}

/**
 * تقصير النص
 * @param {string} text 
 * @param {number} maxLength 
 * @returns {string}
 */
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}
```

---

### 4.1.6 تحديث ملف `src/data/index.js`

```javascript
/**
 * Mock Data Barrel Export
 * متوافق مع Backend Models
 */

// Projects
export { 
  mockProjects, 
  calculateProjectStatus,
  calculateSempStatus,        // ← جديد: حساب حالة SEMP
  calculateMonitoringStatus   // ← جديد: حساب حالة Monitoring
} from './mockProjects';

// Users
export { 
  mockUsers, 
  currentUser, 
  mockJobTitles,
  USER_ROLES, 
  ROLE_LABELS,
  getRoleDisplayName 
} from './mockUsers';

// Screening (Tool 1)
export { 
  screeningCategories, 
  screeningStatuses,
  getScreeningCategory 
} from './screeningCategories';

// Workflow
export { 
  WORKFLOW_TOOLS,
  workflowStepStatuses, 
  projectStatuses,
  mapBackendStatusToDisplay   // ← جديد: تحويل حالة Backend للعرض
} from './workflowStatuses';

// Impact Categories (Tool 2)
export { 
  impactCategories, 
  impactLevels 
} from './impactCategories';
```

---

### 4.1.7 تحديث ملف `src/utils/index.js`

```javascript
// Utils Barrel Export

export { cn } from './cn';
export * from './validators';
export * from './formatters';
export * from './constants';
```

---

## 📝 المرحلة 4.2: LoginPage

### 4.2.1 إنشاء ملف `src/pages/auth/LoginPage.jsx`

**الوصف:** صفحة تسجيل الدخول

**المكونات المستخدمة من UI Kit:**
- `Input` (مع icon)
- `Button` (مع loading state)
- `Alert` (للأخطاء)
- `Icon`

**الميزات المطلوبة:**

| الميزة | الوصف | الحالة |
|--------|-------|--------|
| Email Input | حقل البريد الإلكتروني مع أيقونة `mail` | [ ] |
| Password Input | حقل كلمة المرور مع أيقونة `lock` | [ ] |
| Show/Hide Password | زر لإظهار/إخفاء كلمة المرور | [ ] |
| Form Validation | التحقق من صحة البيانات | [ ] |
| Error Display | عرض رسائل الخطأ | [ ] |
| Loading State | حالة التحميل أثناء الإرسال | [ ] |
| Forgot Password Link | رابط نسيت كلمة المرور | [ ] |
| Remember Me | (اختياري) | [ ] |
| Responsive Design | تصميم متجاوب | [ ] |
| Dark Mode | دعم الوضع المظلم | [ ] |

**البنية المطلوبة:**

```jsx
// صفحة تسجيل الدخول
// Layout: AuthLayout (موجود)

// الحالة (State):
// - email: string
// - password: string
// - showPassword: boolean
// - errors: { email?: string, password?: string, general?: string }
// - isLoading: boolean

// الوظائف:
// - handleSubmit: التحقق وإرسال النموذج
// - handleEmailChange: تحديث البريد الإلكتروني
// - handlePasswordChange: تحديث كلمة المرور
// - togglePasswordVisibility: إظهار/إخفاء كلمة المرور

// التنقل بعد النجاح:
// - navigate('/app/dashboard')
```

**التصميم (من الملف الثابت):**

```
┌─────────────────────────────────────────────────────────┐
│                    Login Card (max-w-960px)              │
├───────────────────────┬─────────────────────────────────┤
│                       │                                 │
│   Visual Panel        │   Login Form                    │
│   (md:w-5/12)         │   (md:w-7/12)                   │
│                       │                                 │
│   ┌──────────┐        │   Environmental & Social        │
│   │   eco    │        │   Management System             │
│   │   icon   │        │   Aga Khan Foundation – Syria   │
│   └──────────┘        │                                 │
│                       │   ┌─────────────────────────┐   │
│   [Decorative         │   │ 📧 Email address        │   │
│    Image]             │   └─────────────────────────┘   │
│                       │                                 │
│   "Securing our       │   ┌─────────────────────────┐   │
│   future..."          │   │ 🔒 Password         👁   │   │
│                       │   └─────────────────────────┘   │
│                       │                                 │
│                       │        Forgot password? →       │
│                       │                                 │
│                       │   ┌─────────────────────────┐   │
│                       │   │      Login    →         │   │
│                       │   └─────────────────────────┘   │
│                       │                                 │
└───────────────────────┴─────────────────────────────────┘
                    🔒 Authorized users only
```

**CSS Classes الرئيسية:**
- Card: `w-full max-w-[960px] bg-white dark:bg-card-dark rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[600px]`
- Visual Panel: `relative w-full md:w-5/12 bg-emerald-50 dark:bg-emerald-900/20 flex flex-col items-center justify-center p-8 md:p-12`
- Form Panel: `w-full md:w-7/12 flex flex-col justify-center p-8 md:p-12 lg:p-16`
- Input: `form-input flex w-full rounded-lg border border-input-border dark:border-input-border-dark bg-white dark:bg-black/20 h-12 pl-11 pr-4`
- Button: `w-full h-12 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg`

---

### 4.2.2 تحديث ملف `src/pages/auth/index.js`

```javascript
// Auth Pages Barrel Export

export { default as LoginPage } from './LoginPage';
```

---

## 📝 المرحلة 4.3: DashboardPage

### 4.3.1 إنشاء المكونات المساعدة

#### 4.3.1.1 إنشاء مجلد `src/components/dashboard/`

#### 4.3.1.2 إنشاء `src/components/dashboard/MetricCard.jsx`

**الوصف:** بطاقة عرض المقاييس الإحصائية

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | string | - | عنوان المقياس |
| `value` | number/string | - | قيمة المقياس |
| `icon` | string | - | اسم الأيقونة (Material Symbols) |
| `iconBgColor` | string | 'bg-blue-50' | لون خلفية الأيقونة |
| `iconColor` | string | 'text-blue-600' | لون الأيقونة |
| `badge` | string | null | نص Badge (اختياري) |
| `badgeVariant` | string | 'warning' | نوع Badge |
| `subtitle` | string | null | نص فرعي (اختياري) |
| `highlight` | boolean | false | هل البطاقة مميزة (للتنبيه) |

**أمثلة البطاقات من الملف الثابت:**

| البطاقة | الأيقونة | لون الأيقونة | القيمة |
|---------|----------|--------------|--------|
| Total Projects | `folder` | blue | 42 |
| Projects In Progress | `timelapse` | purple | 12 |
| High Risk Projects | `warning` | red | 3 (مع badge "Attention") |
| Monitoring Due | `event_note` | orange | 5 (مع subtitle "Q2 Deadline") |

---

#### 4.3.1.3 إنشاء `src/components/dashboard/ProjectListItem.jsx`

**الوصف:** عنصر قائمة المشروع في لوحة التحكم

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `project` | object | - | بيانات المشروع |
| `onClick` | function | - | دالة النقر |

**بنية المشروع:**

```jsx
// من الملف الثابت:
// - أيقونة المشروع (water_drop, solar_power, forest, school, agriculture)
// - اسم المشروع
// - الموقع
// - Badge الحالة (Active, Draft, Monitoring, Completed, In Progress)
// - Badge المخاطر (Low Risk, Med Risk, High Risk)
// - سهم للتنقل
```

---

#### 4.3.1.4 إنشاء `src/components/dashboard/WorkflowProgressBar.jsx`

**الوصف:** شريط تقدم سير العمل (S/A/M/R)

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `progress` | object | - | حالة كل خطوة |
| `showLabels` | boolean | true | عرض التسميات |
| `size` | 'sm'/'md' | 'md' | الحجم |

**الخطوات:**
1. **Scr** (Screening)
2. **Ass** (Assessment)
3. **SEMP** (Management Plan)
4. **Mon** (Monitoring)

**حالات الخطوات:**
- `completed` → `bg-primary`
- `in_progress` → `bg-blue-500`
- `pending` → `bg-gray-200 dark:bg-gray-700`
- `needs_action` → `bg-red-500`

---

#### 4.3.1.5 إنشاء `src/components/dashboard/ScreeningCategoryBadge.jsx`

**الوصف:** شارة فئة الفرز (Tool 1)

**متوافق مع:** `backend/src/models/screening.model.js` - حقل `category_code`

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `category` | string | - | فئة الفرز (**A, B, C, D, E, F** فقط - من Backend) |
| `size` | 'sm'/'md'/'lg' | 'md' | الحجم |
| `showBorder` | boolean | true | عرض الحدود |
| `showLabel` | boolean | false | عرض التسمية بجانب الرمز |

> ⚠️ **ملاحظة:** الـ Backend لا يدعم B+ - فقط A, B, C, D, E, F

---

#### 4.3.1.6 إنشاء `src/components/dashboard/ProjectStatusBadge.jsx`

**الوصف:** شارة حالة المشروع

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `status` | string | - | الحالة |
| `size` | 'sm'/'md' | 'md' | الحجم |

---

#### 4.3.1.7 إنشاء `src/components/dashboard/index.js`

```javascript
// Dashboard Components Barrel Export

export { default as MetricCard } from './MetricCard';
export { default as ProjectListItem } from './ProjectListItem';
export { default as WorkflowProgressBar } from './WorkflowProgressBar';
export { default as ScreeningCategoryBadge } from './ScreeningCategoryBadge';
export { default as ProjectStatusBadge } from './ProjectStatusBadge';
```

---

### 4.3.2 إنشاء ملف `src/pages/dashboard/DashboardPage.jsx`

**الوصف:** صفحة لوحة التحكم الرئيسية

**المكونات المستخدمة:**
- `MetricCard` (4 بطاقات)
- `ProjectListItem`
- `Button`
- `Card`
- `Icon`

**الميزات المطلوبة:**

| الميزة | الوصف | الحالة |
|--------|-------|--------|
| Page Title | عنوان الصفحة مع وصف | [ ] |
| New Project Button | زر إنشاء مشروع جديد | [ ] |
| Metric Cards Grid | شبكة بطاقات المقاييس (4 بطاقات) | [ ] |
| Latest Projects List | قائمة آخر المشاريع | [ ] |
| Filter Button | زر تصفية المشاريع | [ ] |
| View All Button | زر عرض كل المشاريع | [ ] |
| Responsive Design | تصميم متجاوب | [ ] |
| Dark Mode | دعم الوضع المظلم | [ ] |
| Navigation | التنقل للمشاريع | [ ] |

**البنية المطلوبة:**

```jsx
// صفحة لوحة التحكم
// Layout: MainLayout (موجود)

// البيانات:
// - استيراد mockProjects
// - حساب الإحصائيات من البيانات
// - تصفية آخر 5 مشاريع

// الوظائف:
// - handleNewProject: التنقل لصفحة إنشاء مشروع
// - handleViewAllProjects: التنقل لصفحة قائمة المشاريع
// - handleProjectClick: التنقل لصفحة المشروع

// الإحصائيات:
// - totalProjects: إجمالي المشاريع
// - inProgressProjects: المشاريع قيد التنفيذ
// - highRiskProjects: المشاريع عالية المخاطر (A, B)
// - monitoringDue: المشاريع في مرحلة المراقبة
```

**التصميم:**

```
┌─────────────────────────────────────────────────────────────────────┐
│ Dashboard                                          [+ New Project]   │
│ Overview of projects and environmental & social status.             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐│
│ │ 📁 Total     │ │ ⏳ In        │ │ ⚠️ High Risk │ │ 📅 Monitoring ││
│ │ Projects     │ │ Progress     │ │ Projects     │ │ Due          ││
│ │     42       │ │     12       │ │     3        │ │     5        ││
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘│
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ My Latest Projects                                    [Filter]  ││
│ ├─────────────────────────────────────────────────────────────────┤│
│ │ 💧 Clean Water Initiative                                    →  ││
│ │    Nairobi, Kenya  [Active] [Low Risk]                         ││
│ │────────────────────────────────────────────────────────────────││
│ │ ☀️ Solar Grid Expansion                                      →  ││
│ │    Rajasthan, India  [Draft] [Med Risk]                        ││
│ │────────────────────────────────────────────────────────────────││
│ │ 🌲 Reforestation Zone B                                      →  ││
│ │    Amazonas, Brazil  [Monitoring] [High Risk]                  ││
│ │────────────────────────────────────────────────────────────────││
│ │ 🏫 Community School #4                                       →  ││
│ │    Jakarta, Indonesia  [Completed] [Low Risk]                  ││
│ │────────────────────────────────────────────────────────────────││
│ │ 🌾 Sustainable Farming                                       →  ││
│ │    Vietnam  [In Progress] [Low Risk]                           ││
│ ├─────────────────────────────────────────────────────────────────┤│
│ │                    View All Projects                            ││
│ └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 4.3.3 تحديث ملف `src/pages/dashboard/index.js`

```javascript
// Dashboard Pages Barrel Export

export { default as DashboardPage } from './DashboardPage';
```

---

## 📝 المرحلة 4.4: ProjectListPage

### 4.4.1 إنشاء ملف `src/pages/projects/ProjectListPage.jsx`

**الوصف:** صفحة قائمة المشاريع

**المكونات المستخدمة:**
- `Input` (للبحث)
- `Button`
- `Select` أو `Dropdown` (للتصفية)
- `Table`
- `Pagination`
- `WorkflowProgressBar`
- `ScreeningCategoryBadge`
- `ProjectStatusBadge`
- `Icon`

**الميزات المطلوبة:**

| الميزة | الوصف | الحالة |
|--------|-------|--------|
| Page Title | عنوان الصفحة مع وصف | [ ] |
| Create New Button | زر إنشاء مشروع جديد | [ ] |
| Search Input | حقل البحث | [ ] |
| Status Filter | فلتر الحالة | [ ] |
| Risk Filter | فلتر فئة المخاطر | [ ] |
| Sort Dropdown | ترتيب النتائج | [ ] |
| Projects Table | جدول المشاريع | [ ] |
| Pagination | ترقيم الصفحات | [ ] |
| Responsive Design | تصميم متجاوب | [ ] |
| Dark Mode | دعم الوضع المظلم | [ ] |
| Empty State | حالة عدم وجود نتائج | [ ] |
| Loading State | حالة التحميل | [ ] |

**الحالة (State):**

```javascript
// State
const [searchQuery, setSearchQuery] = useState('');
const [statusFilter, setStatusFilter] = useState('all');
const [riskFilter, setRiskFilter] = useState('all');
const [sortBy, setSortBy] = useState('updatedAt');
const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage] = useState(10);
```

**أعمدة الجدول:**

| العمود | العرض | الوصف |
|--------|-------|-------|
| Project Details | 25% | اسم المشروع + الموقع |
| Duration | 15% | تاريخ البداية - النهاية + المدة |
| Risk Cat. | 10% | فئة المخاطر (Badge دائري) |
| Progress (S/A/M/R) | 20% | شريط التقدم |
| Status | 15% | حالة المشروع |
| Action | 15% | زر فتح المشروع |

**التصميم:**

```
┌─────────────────────────────────────────────────────────────────────┐
│ Projects                                   [+ Create New Project]   │
│ Manage environmental and social compliance across all initiatives.  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ┌────────────────────────┐ [Status: All ▼] [Risk: All ▼]           │
│ │ 🔍 Search project...   │                        Sort by: Updated ▼│
│ └────────────────────────┘                                          │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ Project Details  │ Duration │ Risk │ Progress │ Status │ Action ││
│ ├──────────────────┼──────────┼──────┼──────────┼────────┼────────┤│
│ │ Water Sanitation │ Jan 2024 │ B    │ ██▓░    │ In     │ Open → ││
│ │ Kisumu, Kenya    │ 24 Months│      │ S A M R │ Progress│        ││
│ ├──────────────────┼──────────┼──────┼──────────┼────────┼────────┤│
│ │ Community Solar  │ Mar 2024 │ C    │ █░░░    │ Draft  │ Open → ││
│ │ Arusha, Tanzania │ 24 Months│      │ S A M R │        │        ││
│ ├──────────────────┼──────────┼──────┼──────────┼────────┼────────┤│
│ │ Reforestation    │ Jan 2023 │ A    │ ███▓    │ Active │ Open → ││
│ │ Amazonas, Brazil │ 60 Months│      │ S A M R │ Monitor│        ││
│ ├──────────────────┼──────────┼──────┼──────────┼────────┼────────┤│
│ │ Urban Waste      │ Jun 2024 │ B    │ ▓░░░    │ Needs  │ Open → ││
│ │ Mumbai, India    │ 6 Months │      │ S A M R │ Action │        ││
│ └──────────────────┴──────────┴──────┴──────────┴────────┴────────┘│
│                                                                     │
│ Showing 1 to 4 of 12 results          [Previous] [1] [2] [3] [Next] │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**ملاحظات التصميم:**
- الجدول يحتاج `min-w-[1000px]` للحفاظ على التصميم
- يجب لف الجدول في container مع `overflow-x-auto` للشاشات الصغيرة
- فئة المخاطر تُعرض كدائرة ملونة مع الحرف
- Progress bar يظهر 4 خطوات مع labels تحتها

---

## 📝 المرحلة 4.5: ProjectCreatePage

### 4.5.1 إنشاء ملف `src/pages/projects/ProjectCreatePage.jsx`

**الوصف:** صفحة إنشاء مشروع جديد

**المكونات المستخدمة:**
- `Breadcrumb`
- `Card`
- `Input`
- `Textarea`
- `Button`
- `Alert`
- `Icon`

**الميزات المطلوبة:**

| الميزة | الوصف | الحالة |
|--------|-------|--------|
| Page Title | عنوان الصفحة مع وصف | [ ] |
| Breadcrumbs | مسار التنقل | [ ] |
| Info Banner | شريط معلومات العملية | [ ] |
| Project Title Input | حقل عنوان المشروع | [ ] |
| Location Input | حقل الموقع مع أيقونة | [ ] |
| Start Date Input | حقل تاريخ البداية | [ ] |
| End Date Input | حقل تاريخ النهاية | [ ] |
| Description Textarea | حقل الوصف | [ ] |
| Form Validation | التحقق من صحة البيانات | [ ] |
| Error Display | عرض رسائل الخطأ | [ ] |
| Cancel Button | زر الإلغاء | [ ] |
| Save Button | زر الحفظ | [ ] |
| Loading State | حالة التحميل | [ ] |
| Success Navigation | التنقل بعد النجاح | [ ] |
| Responsive Design | تصميم متجاوب | [ ] |
| Dark Mode | دعم الوضع المظلم | [ ] |

**الحالة (State):**

```javascript
// State
const [formData, setFormData] = useState({
  title: '',
  location: '',
  startDate: '',
  endDate: '',
  description: ''
});
const [errors, setErrors] = useState({});
const [isSubmitting, setIsSubmitting] = useState(false);
```

**التصميم:**

```
┌─────────────────────────────────────────────────────────────────────┐
│ Home / Projects / Create New                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Create New Project                                                  │
│ Enter the initial details to register the project in the ESMS.     │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ ┌───────────────────────────────────────────────────────────┐   ││
│ │ │ ℹ️ Process Information                                     │   ││
│ │ │ Environmental screening and impact assessment workflows    │   ││
│ │ │ will be generated automatically after saving...            │   ││
│ │ └───────────────────────────────────────────────────────────┘   ││
│ │                                                                 ││
│ │ ─────────────────────────────────────────────────────────────   ││
│ │ Project Details                                                 ││
│ │ ─────────────────────────────────────────────────────────────   ││
│ │                                                                 ││
│ │ Project Title                                                   ││
│ │ ┌─────────────────────────────────────────────────────────────┐││
│ │ │ e.g., Clean Water Initiative Phase II                       │││
│ │ └─────────────────────────────────────────────────────────────┘││
│ │                                                                 ││
│ │ Project Location                                                ││
│ │ ┌─────────────────────────────────────────────────────────────┐││
│ │ │ 📍 Enter city, region, or coordinates                       │││
│ │ └─────────────────────────────────────────────────────────────┘││
│ │ Specific location allows for automated GIS risk overlay later.  ││
│ │                                                                 ││
│ │ ─────────────────────────────────────────────────────────────   ││
│ │ Timeline                                                        ││
│ │ ─────────────────────────────────────────────────────────────   ││
│ │                                                                 ││
│ │ Start Date                                                      ││
│ │ ┌─────────────────────────────────────────────────────────────┐││
│ │ │ 📅                                                          │││
│ │ └─────────────────────────────────────────────────────────────┘││
│ │                                                                 ││
│ │ End Date (Estimated)                                            ││
│ │ ┌─────────────────────────────────────────────────────────────┐││
│ │ │ 📅                                                          │││
│ │ └─────────────────────────────────────────────────────────────┘││
│ │                                                                 ││
│ │ ─────────────────────────────────────────────────────────────   ││
│ │ Description                                                     ││
│ │ ─────────────────────────────────────────────────────────────   ││
│ │                                                                 ││
│ │ Project Component / Activity Description                        ││
│ │ ┌─────────────────────────────────────────────────────────────┐││
│ │ │ Briefly describe the main activities, infrastructure        │││
│ │ │ components, or interventions...                             │││
│ │ │                                                             │││
│ │ │                                                             │││
│ │ └─────────────────────────────────────────────────────────────┘││
│ │                                                                 ││
│ ├─────────────────────────────────────────────────────────────────┤│
│ │                                   [Cancel]  [💾 Save Project]   ││
│ └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**ملاحظات:**
- هذه الصفحة تستخدم Header خاص (ليس MainLayout)
- يجب إضافة route خاص أو تعديل MainLayout للسماح بهذا

---

### 4.5.2 تحديث ملف `src/pages/projects/index.js`

```javascript
// Projects Pages Barrel Export

export { default as ProjectListPage } from './ProjectListPage';
export { default as ProjectCreatePage } from './ProjectCreatePage';
```

---

## 📝 المرحلة 4.6: التكامل والاختبار

### 4.6.1 تحديث Routes

**تأكد من أن المسارات موجودة في `routes/index.jsx`:**

```javascript
// Auth Routes
{ path: '/login', element: <Auth.LoginPage /> }

// Main App Routes
{ path: 'dashboard', element: <Dashboard.DashboardPage /> }
{ path: 'projects', element: <Projects.ProjectListPage /> }
{ path: 'projects/new', element: <Projects.ProjectCreatePage /> }
```

### 4.6.2 اختبارات التكامل

#### قائمة الاختبارات

| # | الاختبار | الصفحة | الوصف |
|---|----------|--------|-------|
| 1 | Login Flow | LoginPage | تسجيل الدخول والانتقال للوحة التحكم |
| 2 | Dashboard Load | DashboardPage | تحميل البيانات وعرض الإحصائيات |
| 3 | Dashboard Navigation | DashboardPage | التنقل من الداشبورد للمشاريع |
| 4 | Project List Load | ProjectListPage | تحميل قائمة المشاريع |
| 5 | Project Search | ProjectListPage | البحث في المشاريع |
| 6 | Project Filter | ProjectListPage | تصفية المشاريع |
| 7 | Project Pagination | ProjectListPage | التنقل بين الصفحات |
| 8 | Create Project Flow | ProjectCreatePage | إنشاء مشروع جديد |
| 9 | Form Validation | ProjectCreatePage | التحقق من الأخطاء |
| 10 | Dark Mode | All Pages | التبديل بين الوضعين |
| 11 | Responsive | All Pages | التجاوب مع أحجام الشاشات |

### 4.6.3 اختبارات Dark Mode

| الصفحة | العناصر للفحص |
|--------|--------------|
| LoginPage | خلفية الصفحة، Card، حقول الإدخال، الأزرار |
| DashboardPage | Metric Cards، Projects List، Header |
| ProjectListPage | Search، Filters، Table، Pagination |
| ProjectCreatePage | Form Card، Inputs، Buttons |

### 4.6.4 اختبارات Responsive

| نقطة التوقف | الاختبارات |
|-------------|-----------|
| Mobile (375px) | تكديس العناصر، إخفاء الجدول/عرض البطاقات |
| Tablet (768px) | تصميم وسطي، الجدول مع scroll |
| Desktop (1280px+) | التصميم الكامل |

---

## ✅ قائمة المراجعة النهائية

### ملفات Mock Data (متوافقة مع Backend)
- [ ] `src/data/mockProjects.js` ← متوافق مع `project.model.js`
- [ ] `src/data/mockUsers.js` ← متوافق مع `user.model.js` + `jobTitle.model.js`
- [ ] `src/data/screeningCategories.js` ← متوافق مع `screening.model.js`
- [ ] `src/data/workflowStatuses.js` ← حالات الأدوات الخمس
- [ ] `src/data/impactCategories.js` ← متوافق مع `impactCategory.model.js`
- [ ] `src/data/index.js` (تحديث)

### ملفات Utils
- [ ] `src/utils/validators.js`
- [ ] `src/utils/formatters.js`
- [ ] `src/utils/index.js` (تحديث)

### مكونات Dashboard
- [ ] `src/components/dashboard/MetricCard.jsx`
- [ ] `src/components/dashboard/ProjectListItem.jsx`
- [ ] `src/components/dashboard/WorkflowProgressBar.jsx`
- [ ] `src/components/dashboard/ScreeningCategoryBadge.jsx`
- [ ] `src/components/dashboard/ProjectStatusBadge.jsx`
- [ ] `src/components/dashboard/index.js`

### صفحات Auth
- [ ] `src/pages/auth/LoginPage.jsx`
- [ ] `src/pages/auth/index.js` (تحديث)

### صفحات Dashboard
- [ ] `src/pages/dashboard/DashboardPage.jsx`
- [ ] `src/pages/dashboard/index.js` (تحديث)

### صفحات Projects
- [ ] `src/pages/projects/ProjectListPage.jsx`
- [ ] `src/pages/projects/ProjectCreatePage.jsx`
- [ ] `src/pages/projects/index.js` (تحديث)

### معايير الجودة
- [ ] جميع الصفحات تدعم Dark Mode
- [ ] جميع الصفحات Responsive
- [ ] جميع النماذج لها Form Validation
- [ ] جميع الصفحات لها Loading States
- [ ] جميع الصفحات لها Error States
- [ ] `npm run build` يعمل بدون أخطاء
- [ ] `npm run lint` يعمل بدون أخطاء

---

## 📊 مقاييس النجاح

| المقياس | الهدف |
|---------|-------|
| عدد الصفحات | 4 صفحات |
| عدد المكونات الجديدة | 5 مكونات |
| عدد ملفات البيانات | 5 ملفات (متوافقة مع Backend) |
| عدد ملفات Utils | 2 ملفات |
| دعم Dark Mode | 100% |
| دعم Responsive | 100% |
| Form Validation | 100% |
| ESLint Errors | 0 |
| Build Errors | 0 |

---

## 📌 ملاحظات مهمة

### البيانات الوهمية و Backend

1. **Mock Data متوافق مع Backend:** جميع ملفات البيانات الوهمية مبنية على نماذج Backend الفعلية في `backend/src/models/`. هذا يسهّل عملية التكامل مع API لاحقاً.

2. **فئات الفرز (Screening Categories):** الـ Backend يدعم فقط الفئات **A, B, C, D, E, F** - لا يوجد B+ في النموذج الأصلي.

3. **Authentication:** تسجيل الدخول وهمي حالياً. الـ API موجود في:
   - `POST /api/v1/auth/login` - تسجيل الدخول
   - `POST /api/v1/auth/register` - التسجيل

4. **أدوار المستخدمين (User Roles):** يجب استخدام الأدوار الصحيحة من Backend:
   - `environmental_specialist`
   - `program_manager`
   - `project_manager`
   - `environmental_focal_point`
   - `viewer`

### API Endpoints للتكامل المستقبلي

| الوظيفة | الـ Endpoint | الطريقة |
|---------|-------------|---------|
| تسجيل الدخول | `/api/v1/auth/login` | POST |
| قائمة المشاريع | `/api/v1/projects` | GET |
| تفاصيل مشروع | `/api/v1/projects/:id` | GET |
| إنشاء مشروع | `/api/v1/projects` | POST |
| إحصاءات Dashboard | `/api/v1/reports/dashboard` | GET |
| Lookups (Job Titles) | `/api/v1/lookups/job-titles` | GET |

### ملاحظات التنفيذ

5. **Navigation:** استخدم `useNavigate` من react-router-dom للتنقل.

6. **Project Create:** بعد إنشاء المشروع، انتقل إلى صفحة المشروع الجديد أو قائمة المشاريع.

7. **Table Responsive:** على الشاشات الصغيرة، قد تحتاج لعرض المشاريع كـ Cards بدلاً من Table.

8. **Date Inputs:** استخدم `type="date"` الأصلي مع styling مخصص للـ Dark Mode.

9. **Workflow Progress:** حالة كل Tool تُحسب كالتالي:

   | الأداة | طريقة الحساب |
   |--------|-------------|
   | **Tool 1 (Screening)** | من حقل `screening.status` في Backend |
   | **Tool 2 (Assessment)** | من حقل `assessment.status` في Backend |
   | **SEMP (Tools 3 & 4)** | محسوب: `pending` → `in_progress` (عند وجود ManagementActivity) → `completed` (عند وجود MitigationPlan) |
   | **Tool 5 (Monitoring)** | محسوب: `pending` → `in_progress` (Q1-Q3 filled) → `completed` (Q4 filled) |

   > ⚠️ **ملاحظة:** لا يوجد حقل `status` لـ ManagementActivity, MitigationPlan, و MonitoringRecord في Backend

---

*تم إنشاء الخطة: 24 يناير 2026*
*آخر تحديث: 24 يناير 2026*
*المنشئ: Architect Agent*
*الإصدار: 1.1 - محدث للتوافق مع Backend*

---

## ✅ حالة التنفيذ

**المرحلة:** ✅ **مكتملة**  
**تاريخ الإكمال:** 24 يناير 2026  
**المنفذ:** Operating Agent  

جميع المتطلبات تم تنفيذها بنسبة 100%:
- ✅ المرحلة 4.1: Mock Data & Utilities (8 ملفات)
- ✅ المرحلة 4.2: LoginPage
- ✅ المرحلة 4.3: DashboardPage + 5 مكونات Dashboard
- ✅ المرحلة 4.4: ProjectListPage
- ✅ المرحلة 4.5: ProjectCreatePage
- ✅ المرحلة 4.6: التكامل والاختبار

**المشروع جاهز للمرحلة التالية: Phase 5 (Project Workspace — Overview & Screening)**
