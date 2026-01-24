# Phase 6: Project Workspace — Assessment
## خطة تنفيذ تفصيلية
## تاريخ الإنشاء: 24 يناير 2026

---

## 📋 نظرة عامة

### الأهداف الرئيسية
- إنشاء صفحة بوابة التقييم البيئي (Assessment Gateway)
- إنشاء صفحة البيانات الوصفية للتقييم (Assessment Metadata)
- إنشاء صفحة طرق التقييم والاستشارات (Assessment Methods & Consultation)
- إنشاء صفحة تسجيل التأثيرات (Impact Assessment Scoring)
- إنشاء صفحة مراجعة واعتماد التقييم (Assessment Review & Approval)
- بناء المكونات الخاصة بالتقييم (Assessment Domain Components)

### المتطلبات المُسبقة
- ✅ Phase 1: Project Setup & Build Pipeline (مكتمل)
- ✅ Phase 2: Component Library - UI Kit (مكتمل)
- ✅ Phase 3: Layout Components & Routing (مكتمل)
- ✅ Phase 4: Auth & Dashboard Domain (مكتمل)
- ✅ Phase 5: Project Workspace — Overview & Screening (مكتمل)

### الملفات المرجعية (Static HTML)
| الملف | الصفحة المقابلة |
|-------|-----------------|
| `11.EnvironmentalAssessmentGateway.html` | `AssessmentGatewayPage.jsx` |
| `12.EnvironmentalAssessmentMetadata.html` | `AssessmentMetadataPage.jsx` |
| `13.AssessmentMethods&Consultation.html` | `AssessmentMethodsPage.jsx` |
| `14.Impact Assessment Scoring.html` | `AssessmentScoringPage.jsx` |
| `15.Assessment Review and Approval.html` | `AssessmentReviewPage.jsx` |

### Backend Model References

#### Assessment Model (`backend/src/models/assessment.model.js`)
```javascript
{
  project: ObjectId (ref: 'Project'),           // المشروع
  officer: ObjectId (ref: 'User'),              // المسؤول
  project_activity: String (required),          // نشاط المشروع المُقيّم
  description: String (required),               // وصف النشاط
  environmental_setting: String,                // الإعداد البيئي
  legal_requirements: String,                   // المتطلبات القانونية
  total_project_score: {                        // النتيجة الإجمالية
    negligible: Number,
    low: Number,
    medium: Number,
    high: Number,
    not_applicable: Number
  },
  total_project_impact: enum ['negligible', 'low', 'medium', 'high', 'not_applicable'],
  is_complete: Boolean,
  potential_negative_impact: String,            // التأثيرات السلبية المحتملة
  potential_positive_impact: String,            // التأثيرات الإيجابية المحتملة
  approved_by: ObjectId (ref: 'User'),
  recommendations: String,
  status: enum ['draft', 'submitted', 'approved', 'rejected']
}
```

#### AssessmentMethod Model (`backend/src/models/assessmentMethod.model.js`)
```javascript
{
  assessment: ObjectId (ref: 'Assessment'),
  method_type: String (required),              // نوع الطريقة (field_visits, previous_assessments, etc.)
  details: String                              // تفاصيل إضافية
}
```

#### AssessmentImpactScore Model (`backend/src/models/assessmentImpactScore.model.js`)
```javascript
{
  assessment: ObjectId (ref: 'Assessment'),
  question: ObjectId (ref: 'ImpactQuestion'),
  level: enum ['negligible', 'low', 'medium', 'high', 'not_applicable'],
  note: String
}
```

#### CommunityConsultation Model (`backend/src/models/communityConsultation.model.js`)
```javascript
{
  assessment: ObjectId (ref: 'Assessment'),  // التقييم المرتبط
  type: String (required),                    // نوع الاستشارة المجتمعية
  participants: String,                       // المشاركون في الاستشارة
  notes: String                               // ملاحظات إضافية
}
```

---

## 📁 هيكل الملفات المطلوب إنشاؤها

```
src/
├── pages/
│   └── project-workspace/
│       └── assessment/
│           ├── AssessmentGatewayPage.jsx      ← جديد
│           ├── AssessmentMetadataPage.jsx     ← جديد
│           ├── AssessmentMethodsPage.jsx      ← جديد
│           ├── AssessmentScoringPage.jsx      ← جديد
│           ├── AssessmentReviewPage.jsx       ← جديد
│           ├── AssessmentRouter.jsx           ← جديد (توجيه ذكي)
│           └── index.js                       ← جديد (barrel export)
│
├── components/
│   └── assessment/                            ← مجلد جديد
│       ├── AssessmentProgressIndicator.jsx   ← جديد
│       ├── ProjectContextCard.jsx            ← جديد
│       ├── AssessmentStartCard.jsx           ← جديد
│       ├── MetadataInfoSection.jsx           ← جديد
│       ├── MetadataFormSection.jsx           ← جديد
│       ├── MethodChecklistItem.jsx           ← جديد
│       ├── ConsultationChecklistItem.jsx     ← جديد
│       ├── ImpactCategoryAccordion.jsx       ← جديد
│       ├── ImpactScoreRow.jsx                ← جديد
│       ├── TotalScoreCard.jsx                ← جديد
│       ├── TotalImpactCard.jsx               ← جديد
│       ├── ImpactSummarySection.jsx          ← جديد
│       ├── AssessmentReviewCard.jsx          ← جديد
│       ├── AssessmentApprovalSection.jsx     ← جديد
│       └── index.js                          ← جديد
│
├── data/
│   ├── mockAssessment.js                     ← جديد (بيانات التقييم الوهمية)
│   ├── assessmentMethods.js                  ← جديد (طرق التقييم)
│   ├── impactQuestions.js                    ← جديد (50 سؤال - من seed.js)
│   ├── impactIndicators.js                   ← جديد (24 مؤشر - للـ SEMP)
│   └── jobTitles.js                          ← جديد (المسميات الوظيفية - من seed.js)
│
└── hooks/
    └── useAssessment.js                      ← جديد (إدارة حالة التقييم)
```

---

## 🔢 ترتيب التنفيذ

| المرحلة | الوصف | عدد الملفات |
|---------|-------|-------------|
| 6.1 | Mock Data للتقييم (من seed.js) | 5 |
| 6.2 | Hook لإدارة حالة التقييم | 1 |
| 6.3 | مكونات التقييم الأساسية | 6 |
| 6.4 | صفحة بوابة التقييم (Gateway) | 2 |
| 6.5 | صفحة البيانات الوصفية (Metadata) | 2 |
| 6.6 | مكونات Methods, Consultation & Scoring | 6 |
| 6.7 | صفحة طرق التقييم (Methods) | 1 |
| 6.8 | صفحة تسجيل التأثيرات (Scoring) | 1 |
| 6.9 | مكونات المراجعة والاعتماد | 3 |
| 6.10 | صفحة المراجعة والاعتماد (Review) | 1 |
| 6.11 | التوجيه الذكي والتكامل | 2 |

---

## 📝 المرحلة 6.1: Mock Data للتقييم

### 6.1.1 إنشاء ملف `src/data/assessmentMethods.js`

**الوصف:** أنواع طرق التقييم والاستشارات

```javascript
/**
 * Assessment Methods Types
 * أنواع طرق التقييم البيئي
 */

export const ASSESSMENT_METHOD_TYPES = {
  FIELD_VISITS: 'field_visits',
  PREVIOUS_ASSESSMENTS: 'previous_assessments',
  TECHNICAL_REPORTS: 'technical_reports',
  SPECIALIST_CONSULTATION: 'specialist_consultation',
  PROJECT_MEETINGS: 'project_meetings',
  AKFS_GUIDELINES: 'akfs_guidelines',
  OTHER: 'other'
}

export const assessmentMethods = [
  {
    id: ASSESSMENT_METHOD_TYPES.FIELD_VISITS,
    label: 'Field visits',
    description: 'Physical inspection of the site and surrounding area',
    placeholder: 'Enter dates and locations visited',
    inputType: 'textarea',
    rows: 2
  },
  {
    id: ASSESSMENT_METHOD_TYPES.PREVIOUS_ASSESSMENTS,
    label: 'Previous environmental assessments',
    description: null,
    placeholder: 'E.g., 2019 EIA Report for Phase 1',
    inputType: 'input'
  },
  {
    id: ASSESSMENT_METHOD_TYPES.TECHNICAL_REPORTS,
    label: 'Available technical reports',
    description: null,
    placeholder: 'Enter report titles and authors',
    inputType: 'textarea',
    rows: 2
  },
  {
    id: ASSESSMENT_METHOD_TYPES.SPECIALIST_CONSULTATION,
    label: 'Consultation with specialists',
    description: null,
    placeholder: 'Enter names and specialties',
    inputType: 'input'
  },
  {
    id: ASSESSMENT_METHOD_TYPES.PROJECT_MEETINGS,
    label: 'Project team meetings',
    description: null,
    placeholder: 'Dates and key outcomes',
    inputType: 'input'
  },
  {
    id: ASSESSMENT_METHOD_TYPES.AKFS_GUIDELINES,
    label: 'AKFS Environmental Guidelines',
    description: null,
    placeholder: 'Specific sections or guidelines used',
    inputType: 'input'
  },
  {
    id: ASSESSMENT_METHOD_TYPES.OTHER,
    label: 'Other methods',
    description: null,
    placeholder: 'Describe other methods',
    inputType: 'input'
  }
]

export const CONSULTATION_METHOD_TYPES = {
  COMMUNITY_INTERVIEWS: 'community_interviews',
  VILLAGE_MEETINGS: 'village_meetings',
  COMMITTEE_CONSULTATION: 'committee_consultation',
  OTHER: 'other_consultation'
}

export const consultationMethods = [
  {
    id: CONSULTATION_METHOD_TYPES.COMMUNITY_INTERVIEWS,
    label: 'Interviews with community members',
    description: null,
    placeholder: 'Names or groups interviewed',
    inputType: 'textarea',
    rows: 2
  },
  {
    id: CONSULTATION_METHOD_TYPES.VILLAGE_MEETINGS,
    label: 'Village or site meetings',
    description: 'Formal or informal gatherings with local stakeholders',
    placeholder: 'E.g., Village Chief and 20 elders at the Community Hall',
    inputType: 'textarea',
    rows: 2
  },
  {
    id: CONSULTATION_METHOD_TYPES.COMMITTEE_CONSULTATION,
    label: 'Consultation with village/site committees',
    description: null,
    placeholder: 'Name of committee and outcomes',
    inputType: 'input'
  },
  {
    id: CONSULTATION_METHOD_TYPES.OTHER,
    label: 'Other community consultation',
    description: null,
    placeholder: 'Describe other consultation methods',
    inputType: 'textarea',
    rows: 2
  }
]
```

### 6.1.2 إنشاء ملف `src/data/impactQuestions.js`

**الوصف:** فئات وأسئلة تقييم التأثير - **متوافقة مع `seed.js`**

```javascript
/**
 * Impact Categories and Questions
 * فئات وأسئلة تقييم التأثير البيئي
 * ⚠️ هذه البيانات مطابقة لـ backend/src/db/seed.js
 */

export const IMPACT_LEVELS = {
  NEGLIGIBLE: 'negligible',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  NOT_APPLICABLE: 'not_applicable'
}

export const IMPACT_LEVEL_CONFIG = {
  [IMPACT_LEVELS.NEGLIGIBLE]: {
    label: 'Negligible',
    color: 'gray',
    bgClass: 'bg-gray-100 dark:bg-gray-800',
    textClass: 'text-gray-600 dark:text-gray-400',
    dotClass: 'bg-gray-400'
  },
  [IMPACT_LEVELS.LOW]: {
    label: 'Low',
    color: 'green',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    textClass: 'text-green-700 dark:text-green-400',
    dotClass: 'bg-primary'
  },
  [IMPACT_LEVELS.MEDIUM]: {
    label: 'Medium',
    color: 'amber',
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    textClass: 'text-amber-700 dark:text-amber-400',
    dotClass: 'bg-amber-500'
  },
  [IMPACT_LEVELS.HIGH]: {
    label: 'High',
    color: 'red',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    textClass: 'text-red-700 dark:text-red-400',
    dotClass: 'bg-red-500'
  },
  [IMPACT_LEVELS.NOT_APPLICABLE]: {
    label: 'N/A',
    color: 'gray',
    bgClass: 'bg-gray-50 dark:bg-gray-800',
    textClass: 'text-gray-500 dark:text-gray-500',
    dotClass: 'bg-gray-300'
  }
}

/**
 * فئات التأثير البيئي - من seed.js
 * 8 فئات: A, B, C, D, E, F, J, H
 */
export const impactCategories = [
  {
    id: 'A',
    code: 'A',
    name: 'Air Quality',
    name_ar: 'جودة الهواء',
    icon: 'air',
    iconColor: 'text-sky-500',
    iconBg: 'bg-sky-500/10',
    questions: [
      {
        id: 'A_q1',
        question: 'Will the project generate air pollution (e.g., fuel use, industry, construction dust)?'
      },
      {
        id: 'A_q2',
        question: 'Will the project increase vehicle or machinery use (e.g., transport, heavy equipment, generators)?'
      },
      {
        id: 'A_q3',
        question: 'Will the project release chemicals, gases, or fine particles into the air?'
      },
      {
        id: 'A_q4',
        question: 'Will air pollution from the project affect nearby homes, schools, or nature areas (within 1 km)?'
      },
      {
        id: 'A_q5',
        question: 'Is the local climate or geography likely to trap pollution instead of dispersing it?'
      }
    ]
  },
  {
    id: 'B',
    code: 'B',
    name: 'Water Quality',
    name_ar: 'جودة المياه',
    icon: 'water_drop',
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-500/10',
    questions: [
      {
        id: 'B_q1',
        question: 'Will the project pollute nearby water sources (e.g., rivers, lakes, groundwater)?'
      },
      {
        id: 'B_q2',
        question: 'Will the project affect surface or groundwater quality or availability?'
      },
      {
        id: 'B_q3',
        question: 'Will the project impact water used for drinking, irrigation, or ecosystems?'
      },
      {
        id: 'B_q4',
        question: 'Will the project change water temperature (e.g., due to industrial discharge or deforestation)?'
      },
      {
        id: 'B_q5',
        question: 'Will the project release toxic substances (e.g., chemicals, heavy metals) into water?'
      }
    ]
  },
  {
    id: 'C',
    code: 'C',
    name: 'The quality and effect of noise',
    name_ar: 'الضجيج',
    icon: 'volume_up',
    iconColor: 'text-purple-500',
    iconBg: 'bg-purple-500/10',
    questions: [
      {
        id: 'C_q1',
        question: 'Will the project create noise levels that exceed recognized safety limits for human exposure?'
      },
      {
        id: 'C_q2',
        question: 'Will the project introduce new or significantly louder noise compared to the current environment?'
      },
      {
        id: 'C_q3',
        question: 'How far will the noise from the project travel and impact surrounding areas?'
      },
      {
        id: 'C_q4',
        question: 'Will the noise affect sensitive places like schools, hospitals, or residential areas?'
      },
      {
        id: 'C_q5',
        question: 'Will the noise be more disruptive due to its timing (e.g., nighttime) or duration (e.g., long-term exposure)?'
      }
    ]
  },
  {
    id: 'D',
    code: 'D',
    name: 'Solid waste effect',
    name_ar: 'النفايات الصلبة',
    icon: 'delete',
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-500/10',
    questions: [
      {
        id: 'D_q1',
        question: 'Will the project negatively affect the existing solid waste management system?'
      },
      {
        id: 'D_q2',
        question: 'How much solid waste will the project generate?'
      },
      {
        id: 'D_q3',
        question: 'Can the waste from the project be recycled or reused?'
      },
      {
        id: 'D_q4',
        question: 'Will the waste cause harm to the environment (e.g., land, water, wildlife)?'
      },
      {
        id: 'D_q5',
        question: 'Does the waste pose safety risks due to how it is stored, handled, or disposed of?'
      }
    ]
  },
  {
    id: 'E',
    code: 'E',
    name: 'Radiation effect',
    name_ar: 'الإشعاع',
    icon: 'radio_button_checked',
    iconColor: 'text-yellow-500',
    iconBg: 'bg-yellow-500/10',
    questions: [
      {
        id: 'E_q1',
        question: 'Will the project cause radiation exposure above safe limits for people and the environment?'
      },
      {
        id: 'E_q2',
        question: 'What is the impact of the type of radiation emitted by the project (e.g., alpha, beta, gamma, neutron)?'
      },
      {
        id: 'E_q3',
        question: 'Will sensitive groups (e.g., children, pregnant women, endangered species) be affected by radiation from the project?'
      },
      {
        id: 'E_q4',
        question: 'What is the risk of radioactive contamination of soil, water, or air due to the project?'
      },
      {
        id: 'E_q5',
        question: 'How significant is the impact of radiation exposure based on how often and how long it occurs?'
      }
    ]
  },
  {
    id: 'F',
    code: 'F',
    name: 'Toxic and Dangerous Materials effect',
    name_ar: 'المواد الخطرة',
    icon: 'warning',
    iconColor: 'text-red-600',
    iconBg: 'bg-red-600/10',
    questions: [
      {
        id: 'F_q1',
        question: 'Will the project release toxic or hazardous materials that could harm the ecosystem?'
      },
      {
        id: 'F_q2',
        question: 'What is the risk from storing, handling, or transporting toxic or dangerous materials?'
      },
      {
        id: 'F_q3',
        question: 'Will the project pose health risks to people due to exposure to toxic materials?'
      },
      {
        id: 'F_q4',
        question: 'What is the risk of toxic materials contaminating water, soil, or air?'
      },
      {
        id: 'F_q5',
        question: 'How risky is the disposal of waste containing toxic or dangerous materials?'
      }
    ]
  },
  {
    id: 'J',
    code: 'J',
    name: 'The Environmental impacts on natural plants, forests, and wildlife',
    name_ar: 'النباتات والحياة البرية',
    icon: 'forest',
    iconColor: 'text-green-600',
    iconBg: 'bg-green-600/10',
    questions: [
      {
        id: 'J_q1',
        question: 'Will the project lead to loss of natural plants, wildlife, or biodiversity?'
      },
      {
        id: 'J_q2',
        question: 'Will the project affect animal behavior, migration, or increase the risk of species loss?'
      },
      {
        id: 'J_q3',
        question: 'Will the project harm tree growth or reduce vegetation cover?'
      },
      {
        id: 'J_q4',
        question: 'Will the project negatively impact aquatic wildlife and habitats (e.g., lakes, rivers, seas)?'
      },
      {
        id: 'J_q5',
        question: 'Will the project increase the risk of forest fires or cause habitat fragmentation?'
      },
      {
        id: 'J_q6',
        question: 'Will the project introduce or spread invasive species?'
      },
      {
        id: 'J_q7',
        question: 'Will the project affect soil health and fertility?'
      },
      {
        id: 'J_q8',
        question: 'Will the project impact water resources needed for natural ecosystems?'
      },
      {
        id: 'J_q9',
        question: 'Will the project disrupt ecological connectivity and wildlife corridors?'
      },
      {
        id: 'J_q10',
        question: 'Will the project harm pollinators (e.g., bees, butterflies) or endangered species and their habitats?'
      }
    ]
  },
  {
    id: 'H',
    code: 'H',
    name: 'Environmental impacts of land use and management',
    name_ar: 'استخدام الأرض والمجتمع',
    icon: 'landscape',
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-600/10',
    questions: [
      {
        id: 'H_q1',
        question: 'Will the project negatively impact national parks, scenic areas, recreation, or tourism?'
      },
      {
        id: 'H_q2',
        question: 'Will the project affect archaeological sites, cultural heritage, or traditional practices?'
      },
      {
        id: 'H_q3',
        question: 'Will the project change the aesthetic appearance of the area (e.g., landscapes, views)?'
      },
      {
        id: 'H_q4',
        question: 'Will the project negatively affect land use diversity or conflict with existing land use plans?'
      },
      {
        id: 'H_q5',
        question: 'Will the project cause significant changes in population density or settlement patterns?'
      },
      {
        id: 'H_q6',
        question: 'Will the project negatively impact local economic growth, economic diversity, or resilience?'
      },
      {
        id: 'H_q7',
        question: 'Will the project alter the region\'s social structure or way of life?'
      },
      {
        id: 'H_q8',
        question: 'Will the project reduce available agricultural land or lower productivity?'
      },
      {
        id: 'H_q9',
        question: 'Will the project negatively affect residential areas, community cohesion, or social equity?'
      },
      {
        id: 'H_q10',
        question: 'Will the project put pressure on existing infrastructure (e.g., roads, utilities, schools, healthcare)?'
      }
    ]
  }
]

/**
 * الحصول على جميع أسئلة فئة معينة
 */
export function getQuestionsByCategory(categoryId) {
  const category = impactCategories.find(c => c.id === categoryId || c.code === categoryId)
  return category?.questions || []
}

/**
 * الحصول على إجمالي عدد الأسئلة
 * المجموع: 50 سؤال (5+5+5+5+5+5+10+10)
 */
export function getTotalQuestionCount() {
  return impactCategories.reduce((total, cat) => total + cat.questions.length, 0)
}

/**
 * الحصول على فئة بالكود
 */
export function getCategoryByCode(code) {
  return impactCategories.find(c => c.code === code)
}
```

### 6.1.3 إنشاء ملف `src/data/mockAssessment.js`

**الوصف:** بيانات التقييم الوهمية المرتبطة بالمشاريع

```javascript
/**
 * Mock Assessment Data
 * متوافق مع backend/src/models/assessment.model.js
 */

import { IMPACT_LEVELS } from './impactQuestions'
import { ASSESSMENT_METHOD_TYPES, CONSULTATION_METHOD_TYPES } from './assessmentMethods'

/**
 * بيانات التقييم الوهمية لكل مشروع
 */
export const mockAssessments = [
  {
    _id: '507f1f77bcf86cd799439031',
    project: '507f1f77bcf86cd799439011', // Water Sanitation Phase II
    officer: '507f1f77bcf86cd799439001', // Sarah Jenkins
    project_activity: 'Borehole Drilling and Pump Installation Phase 1',
    description: 'The project involves the mechanical drilling of a 50-meter deep borehole to access the aquifer. Following drilling, a solar-powered submersible pump will be installed. A 5000L raised storage tank will be constructed on a concrete plinth. The site will be fenced (10m x 10m perimeter) to prevent animal access.',
    environmental_setting: 'Semi-arid region characterized by flat terrain with sandy-loam soil. Vegetation is sparse, consisting mainly of Acacia shrubs and seasonal grasses. No protected wildlife areas or water bodies are within 5km radius. The site is 500m from the nearest household cluster.',
    legal_requirements: 'Adherence to National Water Resources Authority guidelines for groundwater abstraction. Compliance with the NGO\'s Environmental Social Management Framework (ESMF). Local government permits for construction activities.',
    // المجموع = 50 سؤال
    // أعلى عدد = 18 (negligible) → total_project_impact = 'low'
    // لكن low=15 وهو ثاني أعلى، لذا المشروع منخفض المخاطر
    total_project_score: {
      negligible: 12,
      low: 20,
      medium: 10,
      high: 3,
      not_applicable: 5
    },
    // أعلى عدد = 20 (low) → total_project_impact = 'low'
    total_project_impact: 'low',
    is_complete: true,
    potential_negative_impact: 'Minor temporary dust and noise pollution during drilling. Minimal risk of localized oil spills from machinery. Potential for social friction if water access rules are not clear.',
    potential_positive_impact: 'Provision of clean drinking water to 500+ residents. Reduction in water-borne diseases. Reduced time for women/children collecting water. Creation of local jobs during construction.',
    approved_by: '507f1f77bcf86cd799439002', // Ahmed Hassan
    recommendations: 'Proceed with management plan. Ensure dust suppression during drilling. Establish clear water management committee with community participation.',
    status: 'approved',
    createdAt: '2024-01-25T10:00:00.000Z',
    updatedAt: '2024-02-05T14:30:00.000Z'
  },
  {
    _id: '507f1f77bcf86cd799439032',
    project: '507f1f77bcf86cd799439013', // Reforestation Initiative
    officer: '507f1f77bcf86cd799439001',
    project_activity: 'Large-scale Tree Planting and Forest Restoration',
    description: 'Comprehensive reforestation project covering 5,000 hectares of degraded forest land. Activities include site preparation, seedling planting (500,000 native trees), nursery establishment, and community training programs.',
    environmental_setting: 'Tropical montane forest region with significant biodiversity. Adjacent to protected national park. Existing degradation from previous logging activities. High rainfall area with seasonal flooding.',
    legal_requirements: 'Forest Conservation Act compliance. National park buffer zone regulations. Environmental Impact Assessment required under national law. Community land use agreements.',
    // المجموع = 50 سؤال (مشروع عالي المخاطر)
    // أعلى عدد = 18 (medium) لكن يوجد تعادل محتمل
    total_project_score: {
      negligible: 5,
      low: 10,
      medium: 15,
      high: 15,
      not_applicable: 5
    },
    // تعادل: medium=15, high=15 → الأولوية للـ high
    total_project_impact: 'high',
    is_complete: true,
    potential_negative_impact: 'Risk of introducing non-native species if not properly managed. Temporary habitat disruption during site preparation. Potential impact on existing vegetation. Water table changes from large-scale planting.',
    potential_positive_impact: 'Restoration of 5,000 hectares of degraded forest. Carbon sequestration and climate mitigation. Habitat creation for endangered wildlife. Watershed protection. Community employment.',
    approved_by: '507f1f77bcf86cd799439002',
    recommendations: 'Full Environmental Management Plan required. Use only native species from certified nurseries. Engage local communities in planning. Establish fire management protocols.',
    status: 'approved',
    createdAt: '2023-01-15T09:00:00.000Z',
    updatedAt: '2023-02-01T16:00:00.000Z'
  },
  {
    _id: '507f1f77bcf86cd799439033',
    project: '507f1f77bcf86cd799439012', // Community Solar Grid
    officer: '507f1f77bcf86cd799439003',
    project_activity: 'Solar Panel Installation on Community Buildings',
    description: '',
    environmental_setting: '',
    legal_requirements: '',
    total_project_score: null,
    total_project_impact: null,
    is_complete: false,
    potential_negative_impact: '',
    potential_positive_impact: '',
    approved_by: null,
    recommendations: null,
    status: 'draft',
    createdAt: '2024-02-25T08:00:00.000Z',
    updatedAt: '2024-02-25T08:00:00.000Z'
  },
  {
    _id: '507f1f77bcf86cd799439034',
    project: '507f1f77bcf86cd799439015', // Clean Water Initiative
    officer: '507f1f77bcf86cd799439001',
    project_activity: 'Water Purification System Installation',
    description: 'Installation of water purification and distribution system using existing infrastructure. Includes installation of filtration units, UV treatment systems, and pipe network upgrades.',
    environmental_setting: 'Peri-urban settlement with mixed land use. Existing water infrastructure in need of upgrade. No protected areas nearby.',
    legal_requirements: 'Water quality standards compliance. Health department approval for potable water systems.',
    // المجموع = 50 سؤال (مشروع منخفض المخاطر جداً)
    total_project_score: {
      negligible: 28,
      low: 12,
      medium: 5,
      high: 0,
      not_applicable: 5
    },
    // أعلى عدد = 28 (negligible) → total_project_impact = 'negligible'
    total_project_impact: 'negligible',
    is_complete: true,
    potential_negative_impact: 'Brief service interruption during installation. Minor excavation for pipe connections. Temporary traffic disruption.',
    potential_positive_impact: 'Safe drinking water for 2,500 residents. Reduced waterborne diseases. Lower healthcare costs. Improved quality of life.',
    approved_by: null,
    recommendations: null,
    status: 'submitted',
    createdAt: '2024-02-10T07:00:00.000Z',
    updatedAt: '2024-02-15T12:00:00.000Z'
  }
]

/**
 * بيانات طرق التقييم المرتبطة بالتقييمات
 */
export const mockAssessmentMethods = [
  // Assessment 1 (Water Sanitation)
  {
    _id: 'm001',
    assessment: '507f1f77bcf86cd799439031',
    method_type: ASSESSMENT_METHOD_TYPES.FIELD_VISITS,
    details: 'Initial site inspection conducted on Oct 10, 2023. Follow-up visit on Oct 25, 2023.'
  },
  {
    _id: 'm002',
    assessment: '507f1f77bcf86cd799439031',
    method_type: ASSESSMENT_METHOD_TYPES.SPECIALIST_CONSULTATION,
    details: 'Dr. Sarah Chen (Hydrologist), Mr. Mark Davis (Ecologist)'
  },
  {
    _id: 'm003',
    assessment: '507f1f77bcf86cd799439031',
    method_type: ASSESSMENT_METHOD_TYPES.AKFS_GUIDELINES,
    details: 'Section 4: Biodiversity Management, Section 7: Water Resources'
  },
  // Assessment 2 (Reforestation)
  {
    _id: 'm004',
    assessment: '507f1f77bcf86cd799439032',
    method_type: ASSESSMENT_METHOD_TYPES.FIELD_VISITS,
    details: 'Multiple site visits from Dec 2022 to Jan 2023'
  },
  {
    _id: 'm005',
    assessment: '507f1f77bcf86cd799439032',
    method_type: ASSESSMENT_METHOD_TYPES.PREVIOUS_ASSESSMENTS,
    details: '2019 Baseline Forest Assessment Report'
  },
  {
    _id: 'm006',
    assessment: '507f1f77bcf86cd799439032',
    method_type: ASSESSMENT_METHOD_TYPES.TECHNICAL_REPORTS,
    details: 'Forest Inventory Report 2022, Biodiversity Survey Results'
  }
]

/**
 * بيانات الاستشارات المجتمعية
 * متوافق مع backend/src/models/communityConsultation.model.js
 */
export const mockConsultations = [
  {
    _id: 'c001',
    assessment: '507f1f77bcf86cd799439031',
    type: CONSULTATION_METHOD_TYPES.VILLAGE_MEETINGS,
    participants: 'Village Chief, 3 Council members, and approx. 15 residents',
    notes: 'Meeting held at the North Village Community Center. Discussed water access and project timeline.'
  },
  {
    _id: 'c002',
    assessment: '507f1f77bcf86cd799439032',
    type: CONSULTATION_METHOD_TYPES.COMMUNITY_INTERVIEWS,
    participants: '50 households representatives from 5 villages',
    notes: 'Interviews conducted over 2 weeks. Key concerns: land use, employment opportunities.'
  },
  {
    _id: 'c003',
    assessment: '507f1f77bcf86cd799439032',
    type: CONSULTATION_METHOD_TYPES.COMMITTEE_CONSULTATION,
    participants: 'Forest Management Committee (8 members), Environmental Protection Council (5 members)',
    notes: 'Both committees approved the reforestation approach. Requested native species prioritization.'
  }
]

/**
 * بيانات نتائج تقييم التأثير
 * ⚠️ الـ question IDs متوافقة مع impactQuestions.js (من seed.js)
 */
export const mockImpactScores = [
  // Assessment 1 - Category A: Air Quality (5 أسئلة)
  { assessment: '507f1f77bcf86cd799439031', question: 'A_q1', level: IMPACT_LEVELS.LOW, note: 'Minimal dust during drilling phase' },
  { assessment: '507f1f77bcf86cd799439031', question: 'A_q2', level: IMPACT_LEVELS.MEDIUM, note: 'Heavy machinery will be used for 2 weeks' },
  { assessment: '507f1f77bcf86cd799439031', question: 'A_q3', level: IMPACT_LEVELS.NEGLIGIBLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'A_q4', level: IMPACT_LEVELS.LOW, note: 'Nearest homes are 500m away' },
  { assessment: '507f1f77bcf86cd799439031', question: 'A_q5', level: IMPACT_LEVELS.NOT_APPLICABLE, note: '' },
  
  // Assessment 1 - Category B: Water Quality (5 أسئلة)
  { assessment: '507f1f77bcf86cd799439031', question: 'B_q1', level: IMPACT_LEVELS.LOW, note: 'Oil spill kits will be onsite' },
  { assessment: '507f1f77bcf86cd799439031', question: 'B_q2', level: IMPACT_LEVELS.MEDIUM, note: 'Abstraction rate calculated to be safe, but monitoring required' },
  { assessment: '507f1f77bcf86cd799439031', question: 'B_q3', level: IMPACT_LEVELS.LOW, note: 'Water will be used for construction only' },
  { assessment: '507f1f77bcf86cd799439031', question: 'B_q4', level: IMPACT_LEVELS.NEGLIGIBLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'B_q5', level: IMPACT_LEVELS.NEGLIGIBLE, note: '' },
  
  // Assessment 1 - Category C: Noise (5 أسئلة)
  { assessment: '507f1f77bcf86cd799439031', question: 'C_q1', level: IMPACT_LEVELS.MEDIUM, note: 'Drilling noise for 2-3 days' },
  { assessment: '507f1f77bcf86cd799439031', question: 'C_q2', level: IMPACT_LEVELS.MEDIUM, note: 'Louder than ambient environment' },
  { assessment: '507f1f77bcf86cd799439031', question: 'C_q3', level: IMPACT_LEVELS.LOW, note: 'Limited to 500m radius' },
  { assessment: '507f1f77bcf86cd799439031', question: 'C_q4', level: IMPACT_LEVELS.LOW, note: 'Site is 500m from nearest homes' },
  { assessment: '507f1f77bcf86cd799439031', question: 'C_q5', level: IMPACT_LEVELS.LOW, note: 'Work limited to daytime hours' },
  
  // Assessment 1 - Category D: Solid Waste (5 أسئلة)
  { assessment: '507f1f77bcf86cd799439031', question: 'D_q1', level: IMPACT_LEVELS.NEGLIGIBLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'D_q2', level: IMPACT_LEVELS.LOW, note: 'Minimal construction waste expected' },
  { assessment: '507f1f77bcf86cd799439031', question: 'D_q3', level: IMPACT_LEVELS.LOW, note: 'Metal parts can be recycled' },
  { assessment: '507f1f77bcf86cd799439031', question: 'D_q4', level: IMPACT_LEVELS.NEGLIGIBLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'D_q5', level: IMPACT_LEVELS.NEGLIGIBLE, note: '' },
  
  // Assessment 1 - Category E: Radiation (5 أسئلة)
  { assessment: '507f1f77bcf86cd799439031', question: 'E_q1', level: IMPACT_LEVELS.NOT_APPLICABLE, note: 'No radiation sources' },
  { assessment: '507f1f77bcf86cd799439031', question: 'E_q2', level: IMPACT_LEVELS.NOT_APPLICABLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'E_q3', level: IMPACT_LEVELS.NOT_APPLICABLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'E_q4', level: IMPACT_LEVELS.NOT_APPLICABLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'E_q5', level: IMPACT_LEVELS.NOT_APPLICABLE, note: '' },
  
  // Assessment 1 - Category F: Toxic Materials (5 أسئلة)
  { assessment: '507f1f77bcf86cd799439031', question: 'F_q1', level: IMPACT_LEVELS.LOW, note: 'Fuel and oil on site' },
  { assessment: '507f1f77bcf86cd799439031', question: 'F_q2', level: IMPACT_LEVELS.LOW, note: 'Proper storage procedures in place' },
  { assessment: '507f1f77bcf86cd799439031', question: 'F_q3', level: IMPACT_LEVELS.NEGLIGIBLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'F_q4', level: IMPACT_LEVELS.LOW, note: 'Spill containment measures in place' },
  { assessment: '507f1f77bcf86cd799439031', question: 'F_q5', level: IMPACT_LEVELS.NEGLIGIBLE, note: '' },
  
  // Assessment 1 - Category J: Plants & Wildlife (10 أسئلة)
  { assessment: '507f1f77bcf86cd799439031', question: 'J_q1', level: IMPACT_LEVELS.NEGLIGIBLE, note: 'No significant vegetation on site' },
  { assessment: '507f1f77bcf86cd799439031', question: 'J_q2', level: IMPACT_LEVELS.NEGLIGIBLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'J_q3', level: IMPACT_LEVELS.NOT_APPLICABLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'J_q4', level: IMPACT_LEVELS.NEGLIGIBLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'J_q5', level: IMPACT_LEVELS.NOT_APPLICABLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'J_q6', level: IMPACT_LEVELS.NEGLIGIBLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'J_q7', level: IMPACT_LEVELS.LOW, note: 'Minor soil disturbance during drilling' },
  { assessment: '507f1f77bcf86cd799439031', question: 'J_q8', level: IMPACT_LEVELS.LOW, note: 'Groundwater monitoring required' },
  { assessment: '507f1f77bcf86cd799439031', question: 'J_q9', level: IMPACT_LEVELS.NOT_APPLICABLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'J_q10', level: IMPACT_LEVELS.NEGLIGIBLE, note: '' },
  
  // Assessment 1 - Category H: Land Use & Community (10 أسئلة)
  { assessment: '507f1f77bcf86cd799439031', question: 'H_q1', level: IMPACT_LEVELS.NOT_APPLICABLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'H_q2', level: IMPACT_LEVELS.NEGLIGIBLE, note: 'No heritage sites in area' },
  { assessment: '507f1f77bcf86cd799439031', question: 'H_q3', level: IMPACT_LEVELS.NEGLIGIBLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'H_q4', level: IMPACT_LEVELS.NEGLIGIBLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'H_q5', level: IMPACT_LEVELS.NEGLIGIBLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'H_q6', level: IMPACT_LEVELS.LOW, note: 'Positive impact - job creation' },
  { assessment: '507f1f77bcf86cd799439031', question: 'H_q7', level: IMPACT_LEVELS.NEGLIGIBLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'H_q8', level: IMPACT_LEVELS.NOT_APPLICABLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'H_q9', level: IMPACT_LEVELS.NEGLIGIBLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'H_q10', level: IMPACT_LEVELS.LOW, note: 'Minor road use during construction' }
]

/**
 * الحصول على بيانات التقييم لمشروع معين
 */
export function getAssessmentByProjectId(projectId) {
  return mockAssessments.find(a => a.project === projectId) || null
}

/**
 * الحصول على طرق التقييم لتقييم معين
 */
export function getMethodsByAssessmentId(assessmentId) {
  return mockAssessmentMethods.filter(m => m.assessment === assessmentId)
}

/**
 * الحصول على الاستشارات لتقييم معين
 */
export function getConsultationsByAssessmentId(assessmentId) {
  return mockConsultations.filter(c => c.assessment === assessmentId)
}

/**
 * الحصول على نتائج التأثير لتقييم معين
 */
export function getImpactScoresByAssessmentId(assessmentId) {
  return mockImpactScores.filter(s => s.assessment === assessmentId)
}

/**
 * إنشاء تقييم فارغ لمشروع جديد
 */
export function createEmptyAssessment(projectId, officerId) {
  return {
    _id: null,
    project: projectId,
    officer: officerId,
    project_activity: '',
    description: '',
    environmental_setting: '',
    legal_requirements: '',
    total_project_score: null,
    total_project_impact: null,
    is_complete: false,
    potential_negative_impact: '',
    potential_positive_impact: '',
    approved_by: null,
    recommendations: null,
    status: 'draft'
  }
}
```

### 6.1.4 إنشاء ملف `src/data/impactIndicators.js` (للاستخدام في Phase 7 - SEMP)

**الوصف:** مؤشرات المراقبة السنوية - **متوافقة مع `seed.js`**

```javascript
/**
 * Impact Indicators for Annual Monitoring
 * مؤشرات المراقبة السنوية للتأثير البيئي
 * ⚠️ هذه البيانات مطابقة لـ backend/src/db/seed.js
 * 🔹 سيتم استخدامها في Phase 7 (SEMP & Monitoring)
 */

export const impactIndicators = [
  // Category A: Air Quality (3 مؤشرات)
  {
    code: 'A',
    name: 'Presence of Visible Air Pollution from Project Activities',
    definition: 'Assesses if dust, smoke, or emissions are noticeable in the project area.',
    measurement: 'Observation of visible pollution (e.g., smoke from fuel use, industrial processes, construction dust).'
  },
  {
    code: 'A',
    name: 'Complaints from the Community About Air Quality Issues',
    definition: 'Tracks whether residents, workers, or local authorities report air pollution problems',
    measurement: 'Count and nature of complaints (from community meetings, surveys, or records).'
  },
  {
    code: 'A',
    name: 'Change in Soil, Vegetation Condition in the Project Area',
    definition: 'Assesses whether the soil or the plants show signs of damage (e.g., leaf discoloration, stunted growth) due to air pollution.',
    measurement: 'Visual assessment of the soil degradation or plant health near the project site.'
  },
  
  // Category B: Water Quality (3 مؤشرات)
  {
    code: 'B',
    name: 'Presence of Visible Water Contamination',
    definition: 'Assesses whether water in local rivers, lakes, or streams near the project appears polluted (e.g., oil, foam, discoloration).',
    measurement: 'Visual inspection of water bodies for signs of contamination.'
  },
  {
    code: 'B',
    name: 'Community Reports of Water Issues (Quality or Availability)',
    definition: 'Monitors whether locals experience water-related problems linked to the project (e.g., bad smell, reduced supply, health concerns).',
    measurement: 'Number and type of complaints from community surveys or meetings.'
  },
  {
    code: 'B',
    name: 'Changes in Animals, Vegetation, or Soil Health Near Water Sources',
    definition: 'Observes whether Animals and plants near water bodies are affected (e.g., Illnesses, deaths, unusual dryness, yellowing, erosion).',
    measurement: 'Visual assessment of Animals, Soil, plant condition near rivers, lakes, or wetlands.'
  },
  
  // Category C: Noise (3 مؤشرات)
  {
    code: 'C',
    name: 'Number of Community Complaints About Noise',
    definition: 'Tracks reports from residents, workers, or local institutions (e.g., schools, hospitals) about noise disturbances caused by the project.',
    measurement: 'Review community feedback, complaints, or surveys regarding noise issues.'
  },
  {
    code: 'C',
    name: 'Observation of Noise Disruption in Sensitive Areas (e.g., Schools, Hospitals, Homes)',
    definition: 'Assesses whether noise from the project is noticeable or disruptive in nearby sensitive locations.',
    measurement: 'Visual and auditory assessment at different times of the day near schools, hospitals, and residential areas.'
  },
  {
    code: 'C',
    name: 'Change in Noise Levels at Different Times of the Day',
    definition: 'Evaluates whether noise from the project increases significantly during specific times (e.g., early morning, late night).',
    measurement: 'Field observation of noise patterns at various times of the day and week.'
  },
  
  // Category D: Solid Waste (3 مؤشرات)
  {
    code: 'D',
    name: 'Number of Community Complaints About Solid Waste Issues',
    definition: 'Tracks reports from residents, workers, or local authorities about problems related to waste disposal, accumulation, or pollution caused by the project, Including visual pollution caused by waste.',
    measurement: 'Review community feedback, complaints, or surveys regarding solid waste issues.'
  },
  {
    code: 'D',
    name: 'Visibility of Solid Waste Accumulation Near the Project Site',
    definition: 'Assesses whether solid waste from the project is noticeable and whether proper disposal methods are followed.',
    measurement: 'Visual inspection of waste accumulation in and around the project area.'
  },
  {
    code: 'D',
    name: 'Level of Recycling or Reuse of Project Waste',
    definition: 'Evaluates the percentage of the waste generated by the project is recycled, reused, safely disposed of, or dengorouse disposed of.',
    measurement: 'Review of project waste management practices and records.'
  },
  
  // Category E: Radiation (3 مؤشرات)
  {
    code: 'E',
    name: 'Number of Community Complaints About Radiation Concerns',
    definition: 'Tracks reports from residents, workers, or local authorities about concerns related to radiation exposure from the project.',
    measurement: 'Review community feedback, complaints, or surveys regarding radiation risks.'
  },
  {
    code: 'E',
    name: 'Observation of Signs of Radiation-Related Environmental Damage',
    definition: 'Assesses whether there are visible signs of radiation exposure affecting plants, animals, or soil in the project area.',
    measurement: 'Visual inspection of plant health, wildlife conditions, or unusual soil changes.'
  },
  {
    code: 'E',
    name: 'Reports of Health Issues Potentially Linked to Radiation Exposure',
    definition: 'Monitors whether workers or nearby residents report symptoms or health conditions possibly linked to radiation.',
    measurement: 'Review of health-related concerns raised in community discussions, workplace records, or local health authority reports'
  },
  
  // Category F: Toxic Materials (3 مؤشرات)
  {
    code: 'F',
    name: 'Toxic and Dangerous Materials Effect (Solid, Liquid, or Gas)– Indicators for Annual Monitoring',
    definition: 'Tracks reports from residents, workers, or local authorities about concerns related to exposure to toxic or hazardous materials from the project.',
    measurement: 'Review community feedback, complaints, or surveys regarding toxic material risks.'
  },
  {
    code: 'F',
    name: 'Observation of Visible Contamination or Unsafe Handling of Toxic Materials',
    definition: 'Assesses whether there are visible signs of contamination (e.g., spills, improper storage, leaks) or unsafe handling of hazardous materials in the project area.',
    measurement: 'Visual inspection of storage sites, waste disposal areas, or nearby land and water sources.'
  },
  {
    code: 'F',
    name: 'Reports of Health Issues Potentially Linked to Toxic Material Exposure',
    definition: 'Monitors whether workers or nearby residents report symptoms or health conditions possibly linked to toxic material exposure.',
    measurement: 'Review of health-related concerns raised in community discussions, workplace records, or local health authority reports.'
  },
  
  // Category J: Plants & Wildlife (3 مؤشرات)
  {
    code: 'J',
    name: 'Observation of Changes in Vegetation and Tree Cover',
    definition: 'Assesses whether the project has led to noticeable changes in plant health, tree cover, or deforestation in the area.',
    measurement: 'Visual assessment of vegetation health and tree coverage near the project site.'
  },
  {
    code: 'J',
    name: 'Reports of Wildlife Disturbance or Habitat Loss',
    definition: 'Tracks community or expert reports on the decline of wildlife populations, changes in animal migration, or habitat destruction caused by the project.',
    measurement: 'Review of reports from local communities, conservation groups, or ecological assessments.'
  },
  {
    code: 'J',
    name: 'Presence of Invasive Species in the Project Area',
    definition: 'Evaluates whether new invasive plant or animal species have been introduced due to project activities, impacting native ecosystems.',
    measurement: 'Visual inspection of invasive species presence, combined with reports from local environmental monitoring groups.'
  },
  
  // Category H: Land Use & Community (3 مؤشرات)
  {
    code: 'H',
    name: 'Observation of Changes in Land Use and Aesthetic Impact',
    definition: 'Assesses whether the project has visibly altered the landscape, disrupted scenic areas, or changed land use patterns.',
    measurement: 'Visual assessment of land use changes and aesthetic impact near the project site.'
  },
  {
    code: 'H',
    name: 'Reports of Community Concerns About Social or Economic Impact',
    definition: 'Tracks feedback from residents, businesses, or local authorities regarding changes in economic activity, social structures, or community well-being due to the project.',
    measurement: 'Review of community feedback, surveys, or discussions about economic and social impacts.'
  },
  {
    code: 'H',
    name: 'Impact on Infrastructure and Public Services',
    definition: 'Evaluates whether the project has increased pressure on roads, utilities, schools, or healthcare facilities.',
    measurement: 'Observations of infrastructure conditions and review of reports on service capacity issues.'
  }
]

/**
 * الحصول على مؤشرات فئة معينة
 */
export function getIndicatorsByCategory(categoryCode) {
  return impactIndicators.filter(i => i.code === categoryCode)
}

/**
 * الحصول على إجمالي عدد المؤشرات
 * المجموع: 24 مؤشر (3 لكل فئة × 8 فئات)
 */
export function getTotalIndicatorCount() {
  return impactIndicators.length
}
```

### 6.1.5 إنشاء ملف `src/data/jobTitles.js`

**الوصف:** المسميات الوظيفية - **متوافقة مع `seed.js`**

```javascript
/**
 * Job Titles
 * المسميات الوظيفية
 * ⚠️ هذه البيانات مطابقة لـ backend/src/db/seed.js
 */

export const JOB_TITLES = {
  ENVIRONMENTAL_SPECIALIST: 'Environmental Specialist',
  PROGRAM_MANAGER: 'Program Manager',
  PROJECT_MANAGER: 'Project Manager',
  ENVIRONMENTAL_FOCAL_POINT: 'Environmental focal point',
  VIEWER: 'Viewer'
}

export const jobTitles = [
  { id: 'env_specialist', title_name: JOB_TITLES.ENVIRONMENTAL_SPECIALIST },
  { id: 'prog_manager', title_name: JOB_TITLES.PROGRAM_MANAGER },
  { id: 'proj_manager', title_name: JOB_TITLES.PROJECT_MANAGER },
  { id: 'env_focal', title_name: JOB_TITLES.ENVIRONMENTAL_FOCAL_POINT },
  { id: 'viewer', title_name: JOB_TITLES.VIEWER }
]

/**
 * الحصول على المسمى الوظيفي بالمعرف
 */
export function getJobTitleById(id) {
  return jobTitles.find(j => j.id === id)
}
```

### 6.1.7 تحديث ملف `src/data/index.js`

```javascript
// ... التصديرات الموجودة ...

// Assessment Data
export * from './assessmentMethods'
export * from './impactQuestions'
export * from './impactIndicators'  // للاستخدام في Phase 7
export * from './jobTitles'
export {
  mockAssessments,
  mockAssessmentMethods,
  mockConsultations,
  mockImpactScores,
  getAssessmentByProjectId,
  getMethodsByAssessmentId,
  getConsultationsByAssessmentId,
  getImpactScoresByAssessmentId,
  createEmptyAssessment
} from './mockAssessment'
```

---

## 📝 المرحلة 6.2: Hook لإدارة حالة التقييم

### 6.2.1 إنشاء `src/hooks/useAssessment.js`

```javascript
/**
 * useAssessment Hook
 * إدارة حالة التقييم البيئي
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getAssessmentByProjectId,
  getMethodsByAssessmentId,
  getConsultationsByAssessmentId,
  getImpactScoresByAssessmentId,
  createEmptyAssessment
} from '@/data'

/**
 * Hook لإدارة حالة التقييم
 * @param {string} projectId - معرف المشروع
 */
export function useAssessment(projectId) {
  const [assessment, setAssessment] = useState(null)
  const [methods, setMethods] = useState([])
  const [consultations, setConsultations] = useState([])
  const [impactScores, setImpactScores] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  // تحميل بيانات التقييم
  useEffect(() => {
    if (!projectId) return

    setIsLoading(true)
    setError(null)

    // Simulate API call
    setTimeout(() => {
      const existingAssessment = getAssessmentByProjectId(projectId)
      
      if (existingAssessment) {
        setAssessment(existingAssessment)
        setMethods(getMethodsByAssessmentId(existingAssessment._id))
        setConsultations(getConsultationsByAssessmentId(existingAssessment._id))
        setImpactScores(getImpactScoresByAssessmentId(existingAssessment._id))
      } else {
        // إنشاء تقييم جديد فارغ
        setAssessment(createEmptyAssessment(projectId, 'current_user_id'))
        setMethods([])
        setConsultations([])
        setImpactScores([])
      }
      
      setIsLoading(false)
    }, 300)
  }, [projectId])

  /**
   * بدء تقييم جديد
   */
  const startAssessment = useCallback(async () => {
    setIsSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setAssessment(prev => ({
        ...prev,
        _id: `assessment_${Date.now()}`,
        status: 'draft',
        createdAt: new Date().toISOString()
      }))
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsSaving(false)
    }
  }, [])

  /**
   * حفظ البيانات الوصفية (Metadata)
   */
  const saveMetadata = useCallback(async (data) => {
    setIsSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setAssessment(prev => ({
        ...prev,
        ...data,
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

  /**
   * حفظ طرق التقييم (AssessmentMethod)
   * @param {Array} newMethods - طرق التقييم البيئي
   * Structure: [{ method_type, details }]
   */
  const saveMethods = useCallback(async (newMethods) => {
    setIsSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setMethods(newMethods)
      setAssessment(prev => ({
        ...prev,
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

  /**
   * حفظ الاستشارات المجتمعية (CommunityConsultation)
   * @param {Array} newConsultations - الاستشارات المجتمعية
   * Structure متوافق مع communityConsultation.model.js:
   * [{ type, participants, notes }]
   */
  const saveConsultations = useCallback(async (newConsultations) => {
    setIsSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setConsultations(newConsultations)
      setAssessment(prev => ({
        ...prev,
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

  /**
   * حفظ نتائج التأثير
   */
  const saveImpactScores = useCallback(async (scores, negativeImpact, positiveImpact) => {
    setIsSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setImpactScores(scores)
      
      // حساب النتيجة الإجمالية
      const totalScore = calculateTotalScore(scores)
      const totalImpact = calculateTotalImpact(totalScore)
      
      setAssessment(prev => ({
        ...prev,
        total_project_score: totalScore,
        total_project_impact: totalImpact,
        potential_negative_impact: negativeImpact,
        potential_positive_impact: positiveImpact,
        is_complete: true,
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

  /**
   * إرسال التقييم للموافقة
   */
  const submitAssessment = useCallback(async () => {
    setIsSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setAssessment(prev => ({
        ...prev,
        status: 'submitted',
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

  /**
   * الموافقة على التقييم
   */
  const approveAssessment = useCallback(async (recommendations) => {
    setIsSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setAssessment(prev => ({
        ...prev,
        status: 'approved',
        recommendations,
        approved_by: 'current_user_id',
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

  /**
   * رفض التقييم
   */
  const rejectAssessment = useCallback(async (reason) => {
    setIsSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setAssessment(prev => ({
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
    assessment,
    methods,
    consultations,
    impactScores,
    isLoading,
    isSaving,
    error,
    startAssessment,
    saveMetadata,
    saveMethods,
    saveConsultations,     // دالة جديدة لحفظ الاستشارات المجتمعية
    saveImpactScores,
    submitAssessment,
    approveAssessment,
    rejectAssessment
  }
}

/**
 * حساب النتيجة الإجمالية
 */
function calculateTotalScore(scores) {
  const total = {
    negligible: 0,
    low: 0,
    medium: 0,
    high: 0,
    not_applicable: 0
  }

  scores.forEach(score => {
    if (score.level && total[score.level] !== undefined) {
      total[score.level]++
    }
  })

  return total
}

/**
 * حساب التأثير الإجمالي
 * ⚠️ الخوارزمية متوافقة مع backend/documents/Overview.md
 * 
 * القاعدة: التأثير الإجمالي = المستوى الذي له أعلى عدد
 * في حالة التعادل: الأولوية high > medium > low > negligible
 * not_applicable: فقط إذا كانت كل المستويات الأخرى = 0
 */
function calculateTotalImpact(totalScore) {
  const levelsToCheck = ['negligible', 'low', 'medium', 'high']
  const priority = { high: 4, medium: 3, low: 2, negligible: 1 }
  
  // البحث عن أعلى عدد
  let maxCount = -1
  levelsToCheck.forEach(level => {
    if (totalScore[level] > maxCount) {
      maxCount = totalScore[level]
    }
  })
  
  // إذا كانت كل المستويات = 0
  if (maxCount === 0) {
    return totalScore.not_applicable > 0 ? 'not_applicable' : 'negligible'
  }
  
  // في حالة التعادل، اختر الأعلى حسب الأولوية
  let highestPriority = null
  let highestPriorityValue = -1
  
  levelsToCheck.forEach(level => {
    if (totalScore[level] === maxCount && priority[level] > highestPriorityValue) {
      highestPriorityValue = priority[level]
      highestPriority = level
    }
  })
  
  return highestPriority || 'negligible'
}
```

### 6.2.2 تحديث `src/hooks/index.js`

```javascript
export * from './useProjectContext'
export * from './useScreening'
export * from './useAssessment'
```

---

## 📝 المرحلة 6.3: مكونات التقييم الأساسية

### 6.3.1 إنشاء `src/components/assessment/AssessmentProgressIndicator.jsx`

**الوصف:** مؤشر تقدم التقييم (Screening → Assessment → SEMP)

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `currentStep` | number | ✅ | الخطوة الحالية (1-3) |
| `screeningComplete` | boolean | ❌ | هل اكتمل الفرز |

**التصميم من:** 11.EnvironmentalAssessmentGateway.html (السطور 141-158)

---

### 6.3.2 إنشاء `src/components/assessment/ProjectContextCard.jsx`

**الوصف:** بطاقة سياق المشروع في الشريط الجانبي

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `project` | object | ✅ | بيانات المشروع |
| `screening` | object | ❌ | بيانات الفرز |
| `mapImage` | string | ❌ | صورة الخريطة |

**التصميم من:** 11.EnvironmentalAssessmentGateway.html (السطور 222-253)

**المحتويات:**
- صورة خريطة المشروع (optional)
- عنوان المشروع
- الموقع
- تاريخ البدء والانتهاء
- المعتمد من قبل (من Screening)

---

### 6.3.3 إنشاء `src/components/assessment/AssessmentStartCard.jsx`

**الوصف:** بطاقة بدء التقييم (في Gateway Page)

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `status` | string | ✅ | حالة التقييم (not_started/in_progress/completed) |
| `onStart` | function | ✅ | callback عند النقر على Start |
| `onContinue` | function | ❌ | callback عند النقر على Continue |

**التصميم من:** 11.EnvironmentalAssessmentGateway.html (السطور 163-219)

**المحتويات:**
1. Badge الحالة (Not Started / In Progress / Completed)
2. عنوان ووصف
3. قائمة ما يغطيه التقييم (4 عناصر):
   - Site Information
   - Legal Requirements
   - Environmental Setting
   - Impact Assessment
4. زر البدء/المتابعة

---

### 6.3.4 إنشاء `src/components/assessment/MetadataInfoSection.jsx`

**الوصف:** قسم معلومات المشروع والمسؤول (read-only)

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `officer` | object | ✅ | بيانات المسؤول |
| `project` | object | ✅ | بيانات المشروع |
| `screeningCategory` | string | ❌ | فئة الفرز |

**التصميم من:** 12.EnvironmentalAssessmentMetadata.html (السطور 186-214)

---

### 6.3.5 إنشاء `src/components/assessment/MetadataFormSection.jsx`

**الوصف:** قسم نماذج البيانات الوصفية

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `formData` | object | ✅ | بيانات النموذج |
| `onChange` | function | ✅ | callback عند التغيير |
| `errors` | object | ❌ | رسائل الخطأ |
| `readOnly` | boolean | ❌ | وضع القراءة فقط |

**الحقول:**
1. Project activity component being assessed
2. Brief description of activities
3. Environmental setting description
4. Legal requirements and compliance

**التصميم من:** 12.EnvironmentalAssessmentMetadata.html (السطور 216-244)

---

### 6.3.6 إنشاء `src/components/assessment/index.js`

```javascript
// Assessment Components Barrel Export

export { default as AssessmentProgressIndicator } from './AssessmentProgressIndicator'
export { default as ProjectContextCard } from './ProjectContextCard'
export { default as AssessmentStartCard } from './AssessmentStartCard'
export { default as MetadataInfoSection } from './MetadataInfoSection'
export { default as MetadataFormSection } from './MetadataFormSection'
export { default as MethodChecklistItem } from './MethodChecklistItem'
export { default as ConsultationChecklistItem } from './ConsultationChecklistItem'
export { default as ImpactCategoryAccordion } from './ImpactCategoryAccordion'
export { default as ImpactScoreRow } from './ImpactScoreRow'
export { default as TotalScoreCard } from './TotalScoreCard'
export { default as TotalImpactCard } from './TotalImpactCard'
export { default as ImpactSummarySection } from './ImpactSummarySection'
export { default as AssessmentReviewCard } from './AssessmentReviewCard'
export { default as AssessmentApprovalSection } from './AssessmentApprovalSection'
```

---

## 📝 المرحلة 6.4: صفحة بوابة التقييم (Gateway)

### 6.4.1 إنشاء `src/pages/project-workspace/assessment/AssessmentGatewayPage.jsx`

**الوصف:** صفحة بوابة التقييم البيئي

**المكونات المستخدمة:**
- `AssessmentProgressIndicator`
- `AssessmentStartCard`
- `ProjectContextCard`

**الميزات:**
| الميزة | الوصف |
|--------|-------|
| Page Header | عنوان "Environmental Assessment" مع Tool 2 |
| Progress Indicator | مؤشر التقدم (Screening → Assessment → SEMP) |
| Start Card | بطاقة بدء التقييم |
| Project Context | سياق المشروع في الجانب الأيمن |
| Responsive | تصميم متجاوب (grid cols) |
| Dark Mode | دعم الوضع المظلم |

**التخطيط:**
```
┌─────────────────────────────────────────────────────────────────────┐
│ Environmental Assessment                           [Progress Bar]   │
│ Tool 2 – Site-specific Environmental Assessment                     │
├─────────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────┐ ┌───────────────────────────┐ │
│ │ MAIN CONTENT (2/3)                │ │ SIDEBAR (1/3)             │ │
│ │                                   │ │                           │ │
│ │ ┌─────────────────────────────┐   │ │ ┌───────────────────────┐ │ │
│ │ │ START CARD                  │   │ │ │ PROJECT CONTEXT       │ │ │
│ │ │ [Not Started]               │   │ │ │ 🗺️ Map                │ │ │
│ │ │ Begin Assessment Process    │   │ │ │ Project Title         │ │ │
│ │ │                             │   │ │ │ Location              │ │ │
│ │ │ This assessment covers:     │   │ │ │ Start/End Date        │ │ │
│ │ │ • Site Information          │   │ │ │ Screening Approved By │ │ │
│ │ │ • Legal Requirements        │   │ │ └───────────────────────┘ │ │
│ │ │ • Environmental Setting     │   │ │                           │ │
│ │ │ • Impact Assessment         │   │ │                           │ │
│ │ │                             │   │ │                           │ │
│ │ │ [Start Environmental →]     │   │ │                           │ │
│ │ └─────────────────────────────┘   │ │                           │ │
│ └───────────────────────────────────┘ └───────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

**منطق الحالة:**
```javascript
function getAssessmentStatus(assessment, screening) {
  // لا يمكن بدء التقييم إذا لم يُعتمد الفرز
  if (screening?.status !== 'approved') {
    return 'locked'
  }
  
  if (!assessment || !assessment._id) {
    return 'not_started'
  }
  
  if (assessment.status === 'approved') {
    return 'completed'
  }
  
  return 'in_progress'
}
```

---

### 6.4.2 إنشاء `src/pages/project-workspace/assessment/index.js`

```javascript
export { default as AssessmentGatewayPage } from './AssessmentGatewayPage'
export { default as AssessmentMetadataPage } from './AssessmentMetadataPage'
export { default as AssessmentMethodsPage } from './AssessmentMethodsPage'
export { default as AssessmentScoringPage } from './AssessmentScoringPage'
export { default as AssessmentReviewPage } from './AssessmentReviewPage'
export { default as AssessmentRouter } from './AssessmentRouter'
```

---

## 📝 المرحلة 6.5: صفحة البيانات الوصفية (Metadata)

### 6.5.1 إنشاء `src/pages/project-workspace/assessment/AssessmentMetadataPage.jsx`

**الوصف:** صفحة البيانات الوصفية للتقييم

**المكونات المستخدمة:**
- `MetadataInfoSection`
- `MetadataFormSection`

**الميزات:**
| الميزة | الوصف |
|--------|-------|
| Page Header | عنوان "Environmental Assessment Metadata" |
| Officer Info | معلومات المسؤول (read-only) |
| Project Info | معلومات المشروع (read-only) |
| Form Fields | 4 حقول Textarea |
| Form Validation | التحقق من الحقول المطلوبة |
| Save & Continue | حفظ والانتقال للخطوة التالية |
| Back Button | العودة لـ Gateway |
| Sticky Footer | شريط الإجراءات السفلي |

**الحقول المطلوبة:**
1. `project_activity` - نشاط المشروع (مطلوب)
2. `description` - وصف النشاط (مطلوب)
3. `environmental_setting` - الإعداد البيئي (اختياري)
4. `legal_requirements` - المتطلبات القانونية (اختياري)

**التحقق:**
```javascript
function validateMetadata(data) {
  const errors = {}
  
  if (!data.project_activity?.trim()) {
    errors.project_activity = 'Project activity is required'
  }
  
  if (!data.description?.trim()) {
    errors.description = 'Description is required'
  } else if (data.description.trim().length < 50) {
    errors.description = 'Description must be at least 50 characters'
  }
  
  return { valid: Object.keys(errors).length === 0, errors }
}
```

---

## 📝 المرحلة 6.6: مكونات Methods, Consultation & Scoring

### 6.6.1 إنشاء `src/components/assessment/MethodChecklistItem.jsx`

**الوصف:** عنصر قائمة تحقق لطريقة التقييم (AssessmentMethod)

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `method` | object | ✅ | بيانات الطريقة |
| `checked` | boolean | ✅ | هل محدد |
| `details` | string | ❌ | التفاصيل (method_type + details) |
| `onCheckedChange` | function | ✅ | callback للتحديد |
| `onDetailsChange` | function | ✅ | callback للتفاصيل |
| `readOnly` | boolean | ❌ | وضع القراءة فقط |

**السلوك:**
- عند التحديد، يظهر حقل الإدخال
- عند إلغاء التحديد، يختفي حقل الإدخال
- استخدام `has-[:checked]` للتنسيق

**التصميم من:** 13.AssessmentMethods&Consultation.html (السطور 193-298)

---

### 6.6.2 إنشاء `src/components/assessment/ConsultationChecklistItem.jsx`

**الوصف:** عنصر قائمة تحقق للاستشارات المجتمعية (CommunityConsultation)

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `consultation` | object | ✅ | بيانات نوع الاستشارة |
| `checked` | boolean | ✅ | هل محدد |
| `participants` | string | ❌ | المشاركون (من communityConsultation.model) |
| `notes` | string | ❌ | الملاحظات (من communityConsultation.model) |
| `onCheckedChange` | function | ✅ | callback للتحديد |
| `onParticipantsChange` | function | ✅ | callback للمشاركين |
| `onNotesChange` | function | ✅ | callback للملاحظات |
| `readOnly` | boolean | ❌ | وضع القراءة فقط |

**السلوك:**
- عند التحديد، تظهر حقول الإدخال (participants + notes)
- عند إلغاء التحديد، تختفي حقول الإدخال
- حقل `participants` للمشاركين في الاستشارة
- حقل `notes` للملاحظات الإضافية
- استخدام `has-[:checked]` للتنسيق

**ملاحظة هامة:** هذا المكون يتوافق مع `communityConsultation.model.js`:
```javascript
{
  assessment: ObjectId,
  type: String,        // نوع الاستشارة (يأتي من consultation.id)
  participants: String, // المشاركون
  notes: String        // الملاحظات
}
```

**التصميم من:** 13.AssessmentMethods&Consultation.html (السطور 300-380)

---

### 6.6.3 إنشاء `src/components/assessment/ImpactCategoryAccordion.jsx`

**الوصف:** Accordion قابل للطي لفئة التأثير

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `category` | object | ✅ | بيانات الفئة |
| `scores` | array | ✅ | نتائج الأسئلة |
| `onScoreChange` | function | ✅ | callback للتغيير |
| `defaultOpen` | boolean | ❌ | مفتوح بشكل افتراضي |
| `readOnly` | boolean | ❌ | وضع القراءة فقط |

**التصميم من:** 14.Impact Assessment Scoring.html (السطور 187-312)

**المحتويات:**
1. Summary (Header):
   - أيقونة الفئة
   - اسم الفئة
   - Badge للنتيجة (مثال: "Score: 2 High Risk")
   - أيقونة expand/collapse
2. Content (Body):
   - جدول بالأسئلة
   - Select للتقييم (Impact Rating)
   - Textarea للملاحظات
   - Footer مع ملخص النتائج

---

### 6.6.4 إنشاء `src/components/assessment/ImpactScoreRow.jsx`

**الوصف:** صف تقييم تأثير واحد

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `question` | object | ✅ | السؤال |
| `score` | object | ❌ | النتيجة الحالية |
| `onScoreChange` | function | ✅ | callback للتغيير |
| `onNoteChange` | function | ✅ | callback للملاحظة |
| `readOnly` | boolean | ❌ | وضع القراءة فقط |

---

### 6.6.5 إنشاء `src/components/assessment/TotalScoreCard.jsx`

**الوصف:** بطاقة النتيجة الإجمالية للمشروع

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `scores` | object | ✅ | إجمالي النتائج |

**التصميم من:** 14.Impact Assessment Scoring.html (السطور 461-485)

**المحتويات:**
- 5 boxes لكل مستوى تأثير
- Negligible, Low, Medium, High, N/A
- الأرقام والألوان المناسبة

---

### 6.6.6 إنشاء `src/components/assessment/TotalImpactCard.jsx`

**الوصف:** بطاقة التأثير الإجمالي للمشروع

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `impact` | string | ✅ | مستوى التأثير |

**التصميم من:** 14.Impact Assessment Scoring.html (السطور 486-498)

**المحتويات:**
- أيقونة التحذير (للـ High)
- النص الكبير (HIGH RISK / MEDIUM / LOW / etc.)
- رسالة وصفية

---

## 📝 المرحلة 6.7: صفحة طرق التقييم (Methods)

### 6.7.1 إنشاء `src/pages/project-workspace/assessment/AssessmentMethodsPage.jsx`

**الوصف:** صفحة طرق التقييم والاستشارات المجتمعية

**المكونات المستخدمة:**
- `MethodChecklistItem` → يحفظ في `AssessmentMethod` collection
- `ConsultationChecklistItem` → يحفظ في `CommunityConsultation` collection

**الميزات:**
| الميزة | الوصف |
|--------|-------|
| Page Header | عنوان "Assessment Methods & Consultation" |
| Methods Section | قسم طرق التقييم البيئي (7 عناصر) - يُحفظ في `assessmentMethod` |
| Consultation Section | قسم الاستشارات المجتمعية (4 عناصر) - يُحفظ في `communityConsultation` |
| Checkbox with Input | عند التحديد تظهر حقول الإدخال |
| Save & Continue | حفظ والانتقال للـ Scoring |
| Back Button | العودة للـ Metadata |
| Sticky Footer | شريط الإجراءات السفلي |

**ملاحظة هامة:** هذه الصفحة تحفظ البيانات في مجموعتين منفصلتين:
1. **Assessment Methods** (`saveMethods`) → `AssessmentMethod` model
2. **Community Consultations** (`saveConsultations`) → `CommunityConsultation` model

**التخطيط:**
```
┌─────────────────────────────────────────────────────────────────────┐
│ Assessment Methods & Consultation                                    │
│ Document the methods used for environmental assessment...            │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 🔬 Environmental Assessment Methods                              │ │
│ ├─────────────────────────────────────────────────────────────────┤ │
│ │ □ Field visits                                                  │ │
│ │   [Details of field visits input]                               │ │
│ │ □ Previous environmental assessments                            │ │
│ │ □ Available technical reports                                   │ │
│ │ □ Consultation with specialists                                 │ │
│ │ □ Project team meetings                                         │ │
│ │ □ AKFS Environmental Guidelines                                 │ │
│ │ □ Other methods                                                 │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 👥 Public and Community Consultation                            │ │
│ ├─────────────────────────────────────────────────────────────────┤ │
│ │ □ Interviews with community members                             │ │
│ │ □ Village or site meetings                                      │ │
│ │ □ Consultation with village/site committees                     │ │
│ │ □ Other community consultation                                  │ │
│ └─────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│ [← Back]                                      [Save and Continue →] │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📝 المرحلة 6.8: صفحة تسجيل التأثيرات (Scoring)

### 6.8.1 إنشاء `src/pages/project-workspace/assessment/AssessmentScoringPage.jsx`

**الوصف:** صفحة تسجيل تأثيرات التقييم البيئي

**المكونات المستخدمة:**
- `ImpactCategoryAccordion`
- `TotalScoreCard`
- `TotalImpactCard`
- `ImpactSummarySection`

**الميزات:**
| الميزة | الوصف |
|--------|-------|
| Page Header | عنوان "Environmental Impact Assessment Scoring" |
| Impact Categories | 8 فئات (Accordions قابلة للطي) |
| Questions Table | جدول لكل فئة مع Select و Textarea |
| Total Score | بطاقة النتيجة الإجمالية |
| Total Impact | بطاقة التأثير الإجمالي |
| Impact Summary | ملخص التأثيرات (Negative/Positive) |
| Submit Button | إرسال التقييم |
| Back Button | العودة للـ Methods |
| Sticky Footer | شريط الإجراءات السفلي |

**فئات التأثير (8 فئات - من seed.js):**
| الكود | الفئة (EN) | الفئة (AR) | عدد الأسئلة |
|-------|------------|------------|-------------|
| A | Air Quality | جودة الهواء | 5 |
| B | Water Quality | جودة المياه | 5 |
| C | The quality and effect of noise | الضجيج | 5 |
| D | Solid waste effect | النفايات الصلبة | 5 |
| E | Radiation effect | الإشعاع | 5 |
| F | Toxic and Dangerous Materials effect | المواد الخطرة | 5 |
| J | Environmental impacts on natural plants, forests, and wildlife | النباتات والحياة البرية | 10 |
| H | Environmental impacts of land use and management | استخدام الأرض والمجتمع | 10 |

**المجموع: 50 سؤال**

**حساب النتيجة (من Overview.md):**
```javascript
// الخطوة 1: جمع عدد كل مستوى من جميع الـ 50 سؤال
total_project_score = {
  negligible: count,
  low: count,
  medium: count,
  high: count,
  not_applicable: count
}

// الخطوة 2: تحديد التأثير الإجمالي
// القاعدة: المستوى صاحب أعلى عدد
// في حالة التعادل: الأولوية high > medium > low > negligible
// ⚠️ not_applicable لا يُحسب إلا إذا كل المستويات الأخرى = 0

function calculateTotalImpact(scores) {
  const levels = ['negligible', 'low', 'medium', 'high']
  const priority = { high: 4, medium: 3, low: 2, negligible: 1 }
  
  // إيجاد أعلى عدد
  let maxCount = Math.max(...levels.map(l => scores[l]))
  
  // إذا كل المستويات = 0
  if (maxCount === 0) {
    return scores.not_applicable > 0 ? 'not_applicable' : 'negligible'
  }
  
  // في حالة التعادل، اختر الأعلى أولوية
  const tiedLevels = levels.filter(l => scores[l] === maxCount)
  return tiedLevels.reduce((a, b) => priority[a] > priority[b] ? a : b)
}
```

---

## 📝 المرحلة 6.9: مكونات المراجعة والاعتماد

### 6.9.1 إنشاء `src/components/assessment/ImpactSummarySection.jsx`

**الوصف:** قسم ملخص التأثيرات (Negative/Positive)

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `negativeImpact` | string | ❌ | التأثيرات السلبية |
| `positiveImpact` | string | ❌ | التأثيرات الإيجابية |
| `onNegativeChange` | function | ❌ | callback للسلبية |
| `onPositiveChange` | function | ❌ | callback للإيجابية |
| `readOnly` | boolean | ❌ | وضع القراءة فقط |

**التصميم من:** 14.Impact Assessment Scoring.html (السطور 499-520)

---

### 6.9.2 إنشاء `src/components/assessment/AssessmentReviewCard.jsx`

**الوصف:** بطاقة مراجعة التقييم الكامل

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `assessment` | object | ✅ | بيانات التقييم |
| `methods` | array | ❌ | طرق التقييم |
| `consultations` | array | ❌ | الاستشارات |
| `impactScores` | array | ❌ | نتائج التأثير |
| `categories` | array | ❌ | فئات التأثير |

**التصميم من:** 15.Assessment Review and Approval.html

**المحتويات:**
1. Header مع حالة التقييم
2. معلومات المشروع والمسؤول
3. وصف المشروع (4 حقول)
4. Methods & Consultation (read-only)
5. Detailed Impact Assessment
6. Overall Assessment Results
7. Potential Impacts Summary

---

### 6.9.3 إنشاء `src/components/assessment/AssessmentApprovalSection.jsx`

**الوصف:** قسم الموافقة على التقييم

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `approverName` | string | ❌ | اسم المعتمد |
| `approverPosition` | string | ❌ | منصب المعتمد |
| `recommendations` | string | ❌ | التوصيات |
| `onRecommendationsChange` | function | ❌ | callback للتوصيات |
| `onApprove` | function | ✅ | callback للموافقة |
| `onReject` | function | ❌ | callback للرفض |
| `onEdit` | function | ❌ | callback للتعديل |
| `status` | string | ✅ | حالة التقييم |
| `canApprove` | boolean | ❌ | هل يمكن الموافقة |

**التصميم من:** 15.Assessment Review and Approval.html (السطور 444-476)

---

## 📝 المرحلة 6.10: صفحة المراجعة والاعتماد (Review)

### 6.10.1 إنشاء `src/pages/project-workspace/assessment/AssessmentReviewPage.jsx`

**الوصف:** صفحة مراجعة واعتماد التقييم

**المكونات المستخدمة:**
- `AssessmentReviewCard`
- `AssessmentApprovalSection`

**الميزات:**
| الميزة | الوصف |
|--------|-------|
| Page Header | عنوان "Assessment Review & Approval" |
| Status Badge | حالة التقييم (Pending/Approved/Rejected) |
| Full Review | عرض كامل للتقييم |
| Approval Section | قسم الموافقة مع التوصيات |
| Approve/Reject | أزرار الموافقة والرفض |
| Edit Button | زر التعديل (للـ rejected) |
| Proceed to SEMP | زر الانتقال للـ SEMP (للـ approved) |

**حالات الصفحة:**
1. **Submitted** - في انتظار الموافقة
   - عرض نموذج الموافقة/الرفض
   - Badge برتقالي
2. **Approved** - تمت الموافقة
   - عرض معلومات المعتمد
   - Badge أخضر
   - زر "Proceed to SEMP"
3. **Rejected** - مرفوض
   - عرض سبب الرفض
   - Badge أحمر
   - زر "Edit Assessment"

---

## 📝 المرحلة 6.11: التوجيه الذكي والتكامل

### 6.11.1 إنشاء `src/pages/project-workspace/assessment/AssessmentRouter.jsx`

**الوصف:** مكون توجيه ذكي لصفحات التقييم

**المنطق:**
```javascript
/**
 * Assessment Workflow Flow:
 * 
 * 1. /assessment → AssessmentRouter يفحص الحالة:
 *    - screening.status !== 'approved' → يعرض رسالة "Complete Screening First"
 *    - لا يوجد assessment أو status = 'draft' بدون بيانات → AssessmentGatewayPage
 *    - status = 'draft' مع بيانات (is_complete = false) → يعيد توجيه لآخر خطوة
 *    - status = 'submitted' أو 'rejected' أو 'approved' → AssessmentReviewPage
 * 
 * 2. /assessment/metadata → AssessmentMetadataPage
 * 3. /assessment/methods → AssessmentMethodsPage
 * 4. /assessment/scoring → AssessmentScoringPage
 * 5. /assessment/review → AssessmentReviewPage (للعرض/الموافقة)
 */

function AssessmentRouter() {
  const { projectId } = useParams()
  const { screening } = useScreening(projectId)
  const { assessment, isLoading } = useAssessment(projectId)
  
  if (isLoading) return <Loading />
  
  // التحقق من اكتمال Screening
  if (screening?.status !== 'approved') {
    return <ScreeningRequiredMessage />
  }
  
  // تحديد الصفحة المناسبة
  if (!assessment || !assessment._id) {
    return <AssessmentGatewayPage />
  }
  
  if (assessment.status === 'submitted' || 
      assessment.status === 'approved' || 
      assessment.status === 'rejected') {
    return <AssessmentReviewPage />
  }
  
  // draft - يعرض Gateway للمتابعة
  return <AssessmentGatewayPage />
}
```

### 6.11.2 تحديث Routes

**تحديث `src/routes/index.jsx`:**

```javascript
// Assessment Routes
{ path: 'assessment', element: <Workspace.AssessmentRouter /> },
{ path: 'assessment/metadata', element: <Workspace.AssessmentMetadataPage /> },
{ path: 'assessment/methods', element: <Workspace.AssessmentMethodsPage /> },
{ path: 'assessment/scoring', element: <Workspace.AssessmentScoringPage /> },
{ path: 'assessment/review', element: <Workspace.AssessmentReviewPage /> },
```

### 6.11.3 تحديث `src/pages/project-workspace/index.js`

```javascript
// Overview
export { ProjectOverviewPage } from './overview'

// Screening
export { ScreeningFormPage, ScreeningSummaryPage, ScreeningRouter } from './screening'

// Assessment
export {
  AssessmentGatewayPage,
  AssessmentMetadataPage,
  AssessmentMethodsPage,
  AssessmentScoringPage,
  AssessmentReviewPage,
  AssessmentRouter
} from './assessment'
```

---

## 🔄 Assessment Workflow Flow

### منطق التوجيه الذكي

```
┌─────────────────────────────────────────────────────────────────┐
│                    Assessment Workflow Flow                      │
└─────────────────────────────────────────────────────────────────┘

1. START: /app/projects/:projectId/assessment
   │
   ├─→ AssessmentRouter يفحص:
   │   ├─→ screening.status !== 'approved'
   │   │   └─→ عرض رسالة "Complete Screening First"
   │   │
   │   ├─→ [لا يوجد assessment]
   │   │   └─→ AssessmentGatewayPage
   │   │       └─→ [Start Assessment] → إنشاء assessment جديد → Metadata
   │   │
   │   ├─→ [status = 'draft', !is_complete]
   │   │   └─→ AssessmentGatewayPage
   │   │       └─→ [Continue Assessment] → آخر خطوة غير مكتملة
   │   │
   │   ├─→ [status = 'draft', is_complete]
   │   │   └─→ AssessmentGatewayPage
   │   │       └─→ [Review & Submit] → /assessment/review
   │   │
   │   └─→ [status = 'submitted' | 'approved' | 'rejected']
   │       └─→ AssessmentReviewPage

2. METADATA: /assessment/metadata
   │
   ├─→ Fill form → Save → /assessment/methods
   └─→ Back → /assessment

3. METHODS: /assessment/methods
   │
   ├─→ Select methods & consultations → Save → /assessment/scoring
   └─→ Back → /assessment/metadata

4. SCORING: /assessment/scoring
   │
   ├─→ Score all categories → Submit → status = 'submitted' → /assessment/review
   └─→ Back → /assessment/methods

5. REVIEW: /assessment/review
   │
   ├─→ [status = 'submitted']
   │   ├─→ Approve → status = 'approved' → Stay
   │   └─→ Reject → status = 'rejected' → Stay
   │
   ├─→ [status = 'rejected']
   │   └─→ Edit → /assessment/metadata (or last incomplete step)
   │
   └─→ [status = 'approved']
       └─→ Proceed to SEMP → /semp
```

### حالات Assessment

| الحالة | الصفحة المعروضة | الأزرار المتاحة | التعديل مسموح؟ |
|--------|-----------------|----------------|----------------|
| **لا يوجد** | `AssessmentGatewayPage` | Start Assessment | - |
| **draft** (incomplete) | `AssessmentGatewayPage` | Continue Assessment | ✅ نعم |
| **draft** (complete) | `AssessmentGatewayPage` | Review & Submit | ✅ نعم |
| **submitted** | `AssessmentReviewPage` | Approve, Reject | ❌ لا (للموافق فقط) |
| **rejected** | `AssessmentReviewPage` | Edit Assessment | ✅ نعم (عبر Edit) |
| **approved** | `AssessmentReviewPage` | Print, Proceed to SEMP | ❌ لا |

---

## 🧪 اختبارات التكامل

### قائمة الاختبارات

| # | الاختبار | الصفحة | الوصف |
|---|----------|--------|-------|
| 1 | Screening Check | AssessmentRouter | التحقق من اكتمال Screening |
| 2 | Gateway Load | AssessmentGatewayPage | تحميل Gateway مع حالة صحيحة |
| 3 | Start Assessment | AssessmentGatewayPage | بدء تقييم جديد |
| 4 | Metadata Form | AssessmentMetadataPage | ملء البيانات الوصفية |
| 5 | Metadata Validation | AssessmentMetadataPage | التحقق من الحقول المطلوبة |
| 6 | Methods Selection | AssessmentMethodsPage | اختيار طرق التقييم |
| 7 | Consultation Selection | AssessmentMethodsPage | اختيار الاستشارات |
| 8 | Impact Scoring | AssessmentScoringPage | تسجيل التأثيرات |
| 9 | Score Calculation | AssessmentScoringPage | حساب النتيجة الإجمالية |
| 10 | Submit Assessment | AssessmentScoringPage | إرسال التقييم |
| 11 | Review Load | AssessmentReviewPage | تحميل صفحة المراجعة |
| 12 | Approval Flow | AssessmentReviewPage | الموافقة على التقييم |
| 13 | Rejection Flow | AssessmentReviewPage | رفض التقييم |
| 14 | Edit Flow | AssessmentReviewPage | التعديل بعد الرفض |
| 15 | Dark Mode | All | التبديل بين الوضعين |
| 16 | Responsive | All | التجاوب مع أحجام الشاشات |

---

## ✅ قائمة المراجعة النهائية

### ملفات البيانات (من seed.js)
- [ ] `src/data/assessmentMethods.js`
- [ ] `src/data/impactQuestions.js` (8 فئات، 50 سؤال)
- [ ] `src/data/impactIndicators.js` (24 مؤشر - للـ SEMP)
- [ ] `src/data/jobTitles.js` (5 مسميات وظيفية)
- [ ] `src/data/mockAssessment.js`
- [ ] `src/data/index.js` (تحديث)

### Hooks
- [ ] `src/hooks/useAssessment.js`
- [ ] `src/hooks/index.js` (تحديث)

### مكونات التقييم (15 مكون)
- [ ] `AssessmentProgressIndicator.jsx`
- [ ] `ProjectContextCard.jsx`
- [ ] `AssessmentStartCard.jsx`
- [ ] `MetadataInfoSection.jsx`
- [ ] `MetadataFormSection.jsx`
- [ ] `MethodChecklistItem.jsx` (لـ AssessmentMethod)
- [ ] `ConsultationChecklistItem.jsx` (لـ CommunityConsultation) ✅ **متوافق مع communityConsultation.model.js**
- [ ] `ImpactCategoryAccordion.jsx`
- [ ] `ImpactScoreRow.jsx`
- [ ] `TotalScoreCard.jsx`
- [ ] `TotalImpactCard.jsx`
- [ ] `ImpactSummarySection.jsx`
- [ ] `AssessmentReviewCard.jsx`
- [ ] `AssessmentApprovalSection.jsx`
- [ ] `src/components/assessment/index.js`

### صفحات Assessment (6 صفحات)
- [ ] `AssessmentGatewayPage.jsx`
- [ ] `AssessmentMetadataPage.jsx`
- [ ] `AssessmentMethodsPage.jsx`
- [ ] `AssessmentScoringPage.jsx`
- [ ] `AssessmentReviewPage.jsx`
- [ ] `AssessmentRouter.jsx`
- [ ] `src/pages/project-workspace/assessment/index.js`

### تحديثات
- [ ] `src/pages/project-workspace/index.js` (تحديث)
- [ ] `src/routes/index.jsx` (تحديث Routes)

### معايير الجودة
- [ ] جميع الصفحات تدعم Dark Mode
- [ ] جميع الصفحات Responsive
- [ ] جميع النماذج لها Form Validation
- [ ] جميع الصفحات لها Loading States
- [ ] جميع الصفحات لها Error States
- [ ] التصميم مطابق للتصميم الأصلي
- [ ] `npm run build` يعمل بدون أخطاء
- [ ] `npm run lint` يعمل بدون أخطاء

---

## 📊 مقاييس النجاح

| المقياس | الهدف |
|---------|-------|
| عدد الصفحات الجديدة | 5 صفحات + 1 Router |
| عدد مكونات التقييم | 15 مكون (شامل ConsultationChecklistItem) |
| عدد ملفات البيانات | 5 ملفات (متوافقة مع seed.js) |
| عدد فئات التأثير | 8 فئات (A, B, C, D, E, F, J, H) |
| عدد الأسئلة | 50 سؤال |
| عدد المؤشرات | 24 مؤشر (للـ SEMP) |
| عدد Hooks الجديدة | 1 hook |
| دعم Dark Mode | 100% |
| دعم Responsive | 100% |
| Form Validation | 100% |
| ESLint Errors | 0 |
| Build Errors | 0 |

---

## 📌 ملاحظات مهمة

### 0. مصادر البيانات والخوارزميات

⚠️ **هام جداً:** 

**المصادر:**
- البيانات الثابتة: `backend/src/db/seed.js`
- خوارزمية حساب التأثير: `backend/documents/Overview.md` (سطور 437-497)

**جميع البيانات الثابتة مأخوذة من `seed.js`:**

| البيانات | المصدر | الملف في Frontend |
|----------|--------|-------------------|
| فئات التأثير (8) | `impactCategories` في seed.js | `impactQuestions.js` |
| الأسئلة (50) | `questions` في seed.js | `impactQuestions.js` |
| المؤشرات (24) | `indicators` في seed.js | `impactIndicators.js` |
| المسميات الوظيفية (5) | `jobTitles` في seed.js | `jobTitles.js` |

**فئات التأثير بالكود:**
```
A → Air Quality (جودة الهواء) - 5 أسئلة، 3 مؤشرات
B → Water Quality (جودة المياه) - 5 أسئلة، 3 مؤشرات
C → Noise (الضجيج) - 5 أسئلة، 3 مؤشرات
D → Solid Waste (النفايات الصلبة) - 5 أسئلة، 3 مؤشرات
E → Radiation (الإشعاع) - 5 أسئلة، 3 مؤشرات
F → Toxic Materials (المواد الخطرة) - 5 أسئلة، 3 مؤشرات
J → Plants & Wildlife (النباتات والحياة البرية) - 10 أسئلة، 3 مؤشرات
H → Land Use & Community (استخدام الأرض والمجتمع) - 10 أسئلة، 3 مؤشرات
```

### 1. توافق Backend

جميع البيانات متوافقة مع backend models:
- `Assessment` model (`assessment.model.js`)
- `AssessmentMethod` model (`assessmentMethod.model.js`)
- `AssessmentImpactScore` model (`assessmentImpactScore.model.js`)
- `CommunityConsultation` model (`communityConsultation.model.js`) ✅ **تمت إضافته**
- `ImpactCategory` model (`impactCategory.model.js`)

### 2. Screening Dependency

التقييم يعتمد على اكتمال Screening:
```javascript
if (screening.status !== 'approved') {
  // لا يمكن بدء التقييم
}
```

### 3. Impact Score Calculation (من Overview.md)

```javascript
// الخطوة 1: حساب عدد كل مستوى من 50 سؤال
total_project_score = {
  negligible: count,  // عدد الأسئلة بمستوى negligible
  low: count,         // عدد الأسئلة بمستوى low
  medium: count,      // عدد الأسئلة بمستوى medium
  high: count,        // عدد الأسئلة بمستوى high
  not_applicable: count // عدد الأسئلة غير المنطبقة
}
// المجموع يجب أن يساوي 50

// الخطوة 2: حساب التأثير الإجمالي
// القاعدة: المستوى الذي له أعلى عدد هو التأثير الإجمالي
// في حالة التعادل: الأولوية high > medium > low > negligible

// مثال 1: { negligible: 18, low: 15, medium: 5, high: 0, not_applicable: 12 }
// أعلى عدد = 18 (negligible) → total_project_impact = 'negligible'

// مثال 2: { negligible: 10, low: 15, medium: 15, high: 5, not_applicable: 5 }
// أعلى عدد = 15 (تعادل بين low و medium)
// الأولوية: medium > low → total_project_impact = 'medium'

// مثال 3: { negligible: 5, low: 10, medium: 10, high: 10, not_applicable: 15 }
// أعلى عدد = 15 (not_applicable)... لكن! not_applicable لا يُؤخذ بالحسبان
// من المستويات الأخرى: أعلى = 10 (تعادل بين low, medium, high)
// الأولوية: high > medium > low → total_project_impact = 'high'
```

**⚠️ ملاحظة مهمة:** `not_applicable` لا يُؤخذ بالحسبان إلا إذا كانت جميع المستويات الأخرى = 0

### 4. Navigation Flow

```javascript
Gateway → Metadata → Methods → Scoring → Review
         ←          ←         ←
         (Back buttons)
```

### 5. API Endpoints للتكامل المستقبلي

| الوظيفة | الـ Endpoint | الطريقة |
|---------|-------------|---------|
| جلب التقييم | `/api/v1/assessments/project/:projectId` | GET |
| إنشاء تقييم | `/api/v1/assessments` | POST |
| تحديث تقييم | `/api/v1/assessments/:id` | PUT |
| حفظ Methods | `/api/v1/assessment-methods` | POST |
| جلب Methods | `/api/v1/assessment-methods/assessment/:assessmentId` | GET |
| حفظ Consultations | `/api/v1/community-consultations` | POST |
| جلب Consultations | `/api/v1/community-consultations/assessment/:assessmentId` | GET |
| حفظ Scores | `/api/v1/assessment-impact-scores` | POST |
| جلب Scores | `/api/v1/assessment-impact-scores/assessment/:assessmentId` | GET |
| الموافقة/الرفض | `/api/v1/assessments/:id/approve` | PATCH |

---

*تم إنشاء الخطة: 24 يناير 2026*
*المنشئ: Architect Agent*
*الإصدار: 1.0*
