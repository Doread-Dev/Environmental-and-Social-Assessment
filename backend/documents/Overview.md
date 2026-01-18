# Environmental and Social Assessment System - Project Documentation

## نظرة عامة على المشروع (Project Overview)

### الهدف الأساسي

نظام تقييم بيئي واجتماعي شامل لمؤسسة الآغا خان – سوريا (AKF Syria) لتقييم المخاطر والتأثيرات البيئية والاجتماعية المحتملة لأي مشروع قبل الموافقة عليه أو تنفيذه.

### الأهداف الرئيسية

- التأكد أن المشروع لا يسبب أضرارًا بيئية
- أو أن الأضرار مفهومة ويمكن التحكم بها
- أو أن المشروع له أثر بيئي إيجابي
- ضمان الامتثال للقوانين البيئية السورية
- إشراك المجتمع في عملية التقييم
- إدارة المخاطر المناخية

---

## البنية التقنية الحالية (Current Technical Architecture)

### Backend Stack

- **Framework**: Express.js v4.18.2
- **Database**: MongoDB with Mongoose v8.0.3
- **Validation**: Joi v17.11.0
- **Security**: Helmet v7.1.0, CORS v2.8.5
- **Authentication**: JWT (jsonwebtoken v9.0.2), bcryptjs v2.4.3
- **File Upload**: Multer v1.4.5-lts.1
- **Reporting**: ExcelJS v4.4.0, PDFKit v0.13.0
- **Logging**: Morgan v1.10.0
- **Environment**: dotenv v16.3.1

### Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/             # Request handlers (12 controllers)
│   │   ├── assessment.controller.js
│   │   ├── attachment.controller.js
│   │   ├── auth.controller.js
│   │   ├── lookup.controller.js
│   │   ├── managementActivity.controller.js
│   │   ├── mitigationPlan.controller.js
│   │   ├── monitoring.controller.js
│   │   ├── project.controller.js
│   │   ├── report.controller.js
│   │   ├── screening.controller.js
│   │   ├── semp.controller.js
│   │   └── user.controller.js
│   ├── db/
│   │   └── seed.js              # Database seeding script
│   ├── middlewares/
│   │   ├── auth.js              # JWT authentication & authorization
│   │   ├── errorHandler.js      # Centralized error handling
│   │   ├── upload.js            # Multer file upload configuration
│   │   └── validate.js          # Joi validation middleware
│   ├── models/                  # Mongoose schemas (19 models)
│   │   ├── annexItem.model.js
│   │   ├── assessment.model.js
│   │   ├── assessmentImpactScore.model.js
│   │   ├── assessmentMethod.model.js
│   │   ├── attachment.model.js
│   │   ├── communityConsultation.model.js
│   │   ├── impactCategory.model.js
│   │   ├── impactQuestion.model.js
│   │   ├── indicator.model.js
│   │   ├── jobTitle.model.js
│   │   ├── managementActivity.model.js
│   │   ├── mitigationPlan.model.js
│   │   ├── monitoringRecord.model.js
│   │   ├── project.model.js
│   │   ├── screening.model.js
│   │   ├── sempAction.model.js
│   │   ├── sempObjective.model.js
│   │   ├── sempTarget.model.js
│   │   └── user.model.js
│   ├── routes/                  # API route definitions (12 route files)
│   │   ├── assessments.routes.js
│   │   ├── attachments.routes.js
│   │   ├── auth.routes.js
│   │   ├── index.js             # Main router (aggregates all routes)
│   │   ├── lookups.routes.js
│   │   ├── management.routes.js
│   │   ├── mitigation.routes.js
│   │   ├── monitoring.routes.js
│   │   ├── projects.routes.js
│   │   ├── reports.routes.js
│   │   ├── screenings.routes.js
│   │   ├── semp.routes.js
│   │   └── users.routes.js
│   ├── services/                # Business logic layer (12 services)
│   │   ├── assessment.service.js
│   │   ├── attachment.service.js
│   │   ├── auth.service.js
│   │   ├── lookup.service.js
│   │   ├── managementActivity.service.js
│   │   ├── mitigationPlan.service.js
│   │   ├── monitoring.service.js
│   │   ├── project.service.js
│   │   ├── report.service.js
│   │   ├── screening.service.js
│   │   ├── semp.service.js
│   │   └── user.service.js
│   ├── utils/
│   │   ├── ApiError.js          # Custom error class
│   │   └── asyncHandler.js      # Async wrapper for error handling
│   ├── validators/              # Joi validation schemas (9 validators)
│   │   ├── assessment.validator.js
│   │   ├── attachment.validator.js
│   │   ├── auth.validator.js
│   │   ├── managementActivity.validator.js
│   │   ├── mitigationPlan.validator.js
│   │   ├── monitoring.validator.js
│   │   ├── project.validator.js
│   │   ├── screening.validator.js
│   │   └── semp.validator.js
│   ├── app.js                   # Express app configuration
│   └── server.js                # Server entry point
├── uploads/                     # File upload directory (Multer; يُنشأ عند التشغيل). التقارير: إرسال في الاستجابة HTTP فقط
├── documents/                   # Project documentation
├── scripts/                     # Utility scripts
└── package.json
```

### ما تم إعداده

✅ **البنية الأساسية**: Express.js مع MongoDB/Mongoose  
✅ **معالجة الأخطاء**: Error handler middleware مركزي  
✅ **التحقق من البيانات**: Joi validation middleware لجميع المسارات  
✅ **الأمان**: Helmet (security headers) + CORS configuration  
✅ **قاعدة البيانات**: اتصال MongoDB مع Mongoose  
✅ **النماذج**: 19 Mongoose model (الأدوات الخمس + الكيانات المساعدة)  
✅ **Database Seeding**: سكربت Seed (`npm run seed`) للـ Lookups  
✅ **البيانات الأولية**: ImpactCategory, ImpactQuestion, Indicator, JobTitle  
✅ **Architecture Pattern**: Controllers → Services → Models (12 controllers, 12 services)  
✅ **API Routes**: 12 route files مع تجميع في `routes/index.js`  
✅ **Validators**: 9 Joi validator files للتحقق من المدخلات  
✅ **Authentication**: JWT-based authentication مع bcryptjs للتشفير  
✅ **Authorization**: Role-based access control (5 roles)  
✅ **File Upload**: Multer middleware مع تخزين محلي في `uploads/`  
✅ **Reporting**: Dashboard stats + Export (CSV/Excel/PDF) باستخدام ExcelJS و PDFKit

---

## مخطط قاعدة البيانات (Database ERD)

### الرسم البياني للعلاقات

```
┌─────────────────┐              ┌─────────────────┐
│    JobTitle     │ 1:N          │     AnnexItem   │
├─────────────────┤              ├─────────────────┤
│ _id PK          │              │ _id PK          │
│ title_name      │              │ title           │
│ created_at/updated_at│         │ description     │
└────────┬────────┘              │ created_at/updated_at│
         │                       └─────────────────┘
         │
         ▼
┌─────────────────┐
│      User       │
├─────────────────┤
│ _id PK          │
│ name            │
│ email (unique)  │
│ password (hash) │
│ job_title FK    │
│ role (enum)     │
│ is_active       │
│ created_at/updated_at│
└────────┬────────┘
         │ (approvals/responsibility/uploads)
         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                                PROJECT                                 │
├────────────────────────────────────────────────────────────────────────┤
│ _id PK (ObjectId) │ title │ location │ start_date │ end_date │ project_component │
└───────┬───────────────────────┬───────────────┬───────────┬──────────┘
        │1:1                    │1:1            │1:N        │1:N
        ▼                       ▼               ▼           ▼
┌───────────────┐      ┌────────────────┐   ┌────────────────────┐   ┌────────────────────┐
│   Screening   │      │   Assessment   │   │ MonitoringRecord   │   │ ManagementActivity │
│   (Tool 1)    │      │   (Tool 2)     │   │     (Tool 5)       │   │      (Tool 3)      │
├───────────────┤      ├────────────────┤   ├────────────────────┤   ├────────────────────┤
│ _id PK        │      │ _id PK         │   │ _id PK             │   │ _id PK             │
│ project FK    │      │ project FK     │   │ project FK         │   │ project FK         │
│ category_code │      │ officer FK     │   │ indicator FK       │   │ serial_number      │
│ category_reason│     │ project_activity│  │ scores (object)    │   │ activity_description│
│ potential_negative│   │ description   │   │   baseline, Q1-Q4  │   │ potential_impact   │
│ potential_positive│   │ environmental_setting│ total (String) │   │ recommended_actions│
│ approved_by FK│      │ legal_requirements│ final_assessment   │   │ monitoring_requirements│
│ recommendations│     │ total_project_score│ ranking (enum)    │   │ responsible FK     │
│ screening_date│      │ total_project_impact│ responsible FK    │   │ notes              │
│ status (enum) │      │ is_complete    │   │ note               │   │                    │
│               │      │ potential_negative_impact│ created_at/updated_at│                    │
│               │      │ potential_positive_impact│                    │                    │
│               │      │ approved_by FK │   │                    │   │                    │
│               │      │ recommendations│   │                    │   │                    │
│               │      │ status (enum)  │   │                    │   │                    │
│               │      │ created_at/updated_at│                │   │                    │
└───────┬───────┘      └───────┬────────┘   └──────────┬─────────┘   └────────────────────┘
        │1:1                   │1:N                   │
        ▼                      ▼                      │
┌─────────────────────┐   ┌─────────────────────────┐ │
│   MitigationPlan    │   │ AssessmentMethod        │ │
│     (Tool 4)        │   ├─────────────────────────┤ │
├─────────────────────┤   │ _id PK                  │ │
│ _id PK              │   │ assessment FK           │ │
│ project FK          │   │ method_type             │ │
│ serial_number       │   │ details                 │ │
│ output_description  │   │ created_at/updated_at   │ │
│ potential_impact_and_significance│                 │   └─────────────────────────┘ │
│ mitigation_and_enhancement_measures│                │
│ monitoring          │   ┌─────────────────────────┐ │
│ schedule            │   │ CommunityConsultation   │ │
│ responsible FK      │   ├─────────────────────────┤ │
│ notes               │   │ _id PK                  │ │
│ created_at/updated_at│   │ assessment FK           │ │
│                     │   │ type                    │ │
│                     │   │ participants            │ │
│                     │   │ notes                   │ │
│                     │   │ created_at/updated_at   │ │
└──────────┬──────────┘   └─────────────────────────┘ │
           │                                          │
           │                                          ▼1:N
           │                             ┌─────────────────────────┐
           │                             │ AssessmentImpactScore   │
           │                             ├─────────────────────────┤
           │                             │ _id PK                  │
           │                             │ assessment FK           │
           │                             │ question FK              │
           │                             │ level (enum)            │
           │                             │ note                    │
           │                             │ created_at/updated_at    │
           │                             └─────────────────────────┘
           │
           │1:N (hierarchical alternative for Tool 4)
           ▼
┌─────────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  SEMP_Objective     │1:N   │   SEMP_Target   │1:N   │   SEMP_Action   │
├─────────────────────┤      ├─────────────────┤      ├─────────────────┤
│ _id PK              │      │ _id PK          │      │ _id PK          │
│ project FK           │      │ objective FK    │      │ target FK        │
│ objective_text       │      │ target_text     │      │ action_text      │
│ created_at/updated_at│      │ created_at/updated_at│ │ responsible FK   │
└────────┬────────────┘      └────────┬────────┘      │ resources        │
         │1:N                         │1:N            │ due_date         │
         │                            │               │ created_at/updated_at│
         │                            │              └─────────────────────
         ▼                            ▼
┌─────────────────┐        ┌─────────────────┐
│   Attachment    │        │   Indicator     │
├─────────────────┤        ├─────────────────┤
│ _id PK          │        │ _id PK          │
│ entity_type     │        │ category FK     │
│ entity_id       │        │ name            │
│ file_name       │        │ definition      │
│ file_path       │        │ measurement     │
│ file_type       │        │ created_at/updated_at│
│ file_size       │        └─────────────────┘
│ uploaded_by FK  │
│ created_at/updated_at│
└─────────────────┘

LOOKUPS: ImpactCategory (A,B,C,D,E,F,J,H) 1:N ImpactQuestion; Indicator links to
ImpactCategory; JobTitle for User; AnnexItem (lookup).

ملاحظات:
- جميع الـ Primary Keys (PK) هي ObjectId في MongoDB (تلقائياً)
- جميع الـ Foreign Keys (FK) هي ObjectId references
- جميع الجداول تحتوي على created_at و updated_at (timestamps)
- جميع الجداول لا تحتوي على versionKey (versionKey: false)
```

### ملخص الكيانات (Entity Summary)

| Entity                    | الوصف                           | Tool      |
| ------------------------- | ------------------------------- | --------- |
| **Project**               | الكيان الرئيسي للمشروع          | -         |
| **User**                  | المستخدمون والأدوار             | Global    |
| **JobTitle**              | المسميات الوظيفية               | Lookup    |
| **AnnexItem**             | الملحقات والمراجع               | Reference |
| **Attachment**            | إدارة الملفات المرفقة           | Global    |
| **Screening**             | الفرز الأولي                    | Tool 1    |
| **Assessment**            | التقييم البيئي التفصيلي         | Tool 2    |
| **AssessmentMethod**      | طرق التقييم المستخدمة           | Tool 2    |
| **CommunityConsultation** | المشاورات المجتمعية             | Tool 2    |
| **AssessmentImpactScore** | نتائج تقييم الأسئلة             | Tool 2    |
| **ImpactCategory**        | فئات التأثير (A-H)              | Lookup    |
| **ImpactQuestion**        | أسئلة التقييم لكل فئة           | Lookup    |
| **Indicator**             | مؤشرات المراقبة                 | Lookup    |
| **MonitoringRecord**      | سجلات المراقبة الربع سنوية      | Tool 5    |
| **ManagementActivity**    | إجراءات الإدارة التشغيلية       | Tool 3    |
| **MitigationPlan**        | خطة التخفيف الاستراتيجية        | Tool 4    |
| **SEMP_Objective**        | أهداف خطة الإدارة (بديل Tool 4) | Tool 3/4  |
| **SEMP_Target**           | الأهداف الفرعية                 | Tool 3/4  |
| **SEMP_Action**           | الإجراءات التنفيذية             | Tool 3/4  |

---

## الربط بين الـ ERD والأدوات (ERD to Tools Mapping)

### Tool 1: Screening (الفرز الأولي)

```
Entities: Project + Screening
Lookups: User (for approved_by)
```

### Tool 2: Assessment (التقييم التفصيلي)

```
Entities: Assessment + AssessmentMethod + CommunityConsultation + AssessmentImpactScore
Lookups: ImpactCategory + ImpactQuestion + User (for officer, approved_by)
```

### Tool 3: Management Activities (إجراءات الإدارة)

```
Entities: ManagementActivity
Lookups: User (for responsible)
```

### Tool 4: Mitigation Plan (خطة التخفيف)

```
Entities: MitigationPlan
  أو (كبديل هرمي) SEMP_Objective + SEMP_Target + SEMP_Action
Lookups: User (for responsible)
```

### Tool 5: Monitoring (المراقبة)

```
Entities: MonitoringRecord
Lookups: Indicator + ImpactCategory (via Indicator) + User (for responsible)
```

### Management Plan (خطة الإدارة)

```
Entities: SEMP_Objective + SEMP_Target + SEMP_Action
Lookups: User (for responsible in SEMP_Action)
```

---

## الأدوات الخمس الرئيسية (The Five Core Tools)

### Tool 1: Environmental Integration Screening Tool – Summary Table

**الاسم العربي**: أداة الفرز الأولي لدمج الاعتبارات البيئية – جدول ملخّص

#### الوظيفة

أداة القرار الأولية لتحديد مستوى الخطورة البيئية للمشروع قبل البدء في التقييم التفصيلي.

#### الربط مع ERD

- **Primary Entity**: `Screening`
- **Parent**: `Project` (FK: project)
- **References**: `User` (FK: approved_by)

#### الحقول المطلوبة (من ERD + الإضافات)

| Field              | Type                  | Source    |
| ------------------ | --------------------- | --------- |
| \_id               | ObjectId (PK)         | MongoDB   |
| project            | ObjectId (FK)         | ERD       |
| category_code      | string (A-F)          | ERD       |
| category_reason    | string                | ERD       |
| potential_negative | string                | ERD       |
| potential_positive | string                | ERD       |
| approved_by        | ObjectId (FK -> User) | ERD       |
| recommendations    | string                | ERD       |
| screening_date     | date                  | **إضافة** |
| status             | enum                  | **إضافة** |
| created_at         | date                  | **إضافة** |
| updated_at         | date                  | **إضافة** |

#### تصنيفات الفئة (Category Codes)

| Code  | Name              | Description                        |
| ----- | ----------------- | ---------------------------------- |
| **A** | High Risk         | مخاطر بيئية عالية، يحتاج EIA كامل  |
| **B** | Low-Moderate Risk | مخاطر منخفضة-متوسطة، قابلة للتخفيف |
| **C** | Negligible Risk   | مخاطر شبه معدومة                   |
| **D** | Emergency         | حالات الطوارئ                      |
| **E** | Insufficient Info | معلومات غير كافية ❌               |
| **F** | Positive Impact   | أثر بيئي إيجابي ✅                 |

---

### Tool 2: Project Environmental Assessment Form

**الاسم العربي**: نموذج التقييم البيئي التفصيلي للمشروع

#### الوظيفة

تحليل تفصيلي لكل نوع تأثير بيئي محتمل عبر 8 محاور.

#### الربط مع ERD

- **Primary Entity**: `Assessment`
- **Child Entities**:
  - `AssessmentMethod` (1:N)
  - `CommunityConsultation` (1:N)
  - `AssessmentImpactScore` (1:N)
- **Lookups**:
  - `ImpactCategory` (للمحاور A-H)
  - `ImpactQuestion` (الأسئلة لكل محور)
  - `User` (officer, approved_by)

#### المحاور الثمانية (ImpactCategory)

| ID  | Code | Name AR                 | Name EN           |
| --- | ---- | ----------------------- | ----------------- |
| 1   | A    | جودة الهواء             | Air Quality       |
| 2   | B    | جودة المياه             | Water Quality     |
| 3   | C    | الضجيج                  | Noise             |
| 4   | D    | النفايات الصلبة         | Solid Waste       |
| 5   | E    | الإشعاع                 | Radiation         |
| 6   | F    | المواد الخطرة           | Toxic Materials   |
| 7   | J    | النباتات والحياة البرية | Plants/Wildlife   |
| 8   | H    | استخدام الأرض والمجتمع  | Land Use & Social |

#### مستويات التأثير (Impact Levels)

```javascript
enum: ["negligible", "low", "medium", "high", "not_applicable"];
```

#### حساب Total Project Score

```javascript
// حساب عدد كل مستوى من AssessmentImpactScore
const scoreCount = {
  negligible: 0,
  low: 0,
  medium: 0,
  high: 0,
  not_applicable: 0,
};

scores.forEach((score) => {
  if (scoreCount.hasOwnProperty(score.level)) {
    scoreCount[score.level]++;
  }
});

// تحديد total_project_impact بناءً على أعلى عدد
// أولوية: high > medium > low > negligible
// not_applicable لا يُؤخذ بالحسبان إلا إذا كانت كل المستويات الأخرى = 0
let maxLevel = null;
let maxCount = -1;

const levelsToCheck = ["negligible", "low", "medium", "high"];
levelsToCheck.forEach((level) => {
  if (scoreCount[level] > maxCount) {
    maxCount = scoreCount[level];
    maxLevel = level;
  }
});

// إذا كانت كل المستويات = 0، استخدم not_applicable
if (maxCount === 0 && scoreCount.not_applicable > 0) {
  maxLevel = "not_applicable";
} else if (maxCount === 0) {
  // إذا كانت كل المستويات = 0 و not_applicable = 0، استخدم negligible كقيمة افتراضية
  maxLevel = "negligible";
}

// في حالة التعادل، اختر الأعلى حسب الأولوية
if (maxCount > 0) {
  const priority = { high: 4, medium: 3, low: 2, negligible: 1 };
  let highestPriority = null;
  let highestPriorityValue = -1;

  levelsToCheck.forEach((level) => {
    if (
      scoreCount[level] === maxCount &&
      priority[level] > highestPriorityValue
    ) {
      highestPriorityValue = priority[level];
      highestPriority = level;
    }
  });

  if (highestPriority) {
    maxLevel = highestPriority;
  }
}
```

---

### Tool 3: Template for Environmental and Social Management Activities

**الاسم العربي**: قالب لخطة أنشطة الإدارة البيئية والاجتماعية (ESMP)

#### الوظيفة

تحويل نتائج Tool 2 إلى إجراءات تنفيذ + مراقبة + مسؤوليات.

#### الربط مع ERD

- **Primary Entity**: `ManagementActivity`
- **Alternative**: استخدام `SEMP_Objective -> SEMP_Target -> SEMP_Action`
- **Parent**: `Project`
- **References**: `User` (responsible)

#### الهيكل المقترح

```javascript
ManagementActivity {
  _id: ObjectId (PK),
  project: ObjectId (FK -> Project),
  serial_number: Number,
  activity_description: String,      // وصف الإجراء
  potential_impact: String,          // نص حر (free text)
  recommended_actions: Mixed,        // string or array
  monitoring_requirements: String,   // متطلبات المراقبة
  responsible: ObjectId (FK -> User), // المسؤول
  notes: String,
  created_at: Date,
  updated_at: Date
}
```

---

### Tool 4: Environmental and Social Impact Assessment, Management, and Mitigation Plan

**الاسم العربي**: خطة تقييم وإدارة وتخفيف الآثار البيئية والاجتماعية

#### الوظيفة

الخطة الأكثر شمولًا والأقرب للتنفيذ طويل الأمد، تشمل المخاطر المناخية.

#### الربط مع ERD

- **Primary Entity**: `MitigationPlan` (مُدمج في ERD المحدث)
- **Alternative**: `SEMP_Objective -> SEMP_Target -> SEMP_Action` (موجود)
- **Parent**: `Project`
- **References**: `User`

#### الفرق بين Tool 3 و Tool 4

| العنصر        | Tool 3 (ManagementActivity) | Tool 4 (MitigationPlan / SEMP) |
| ------------- | --------------------------- | ------------------------------ |
| المستوى       | تشغيلي                      | استراتيجي                      |
| النطاق        | إجراء واحد                  | مخرج/نشاط كامل                 |
| المناخ        | غير مذكور                   | ✅ مذكور صراحة                 |
| الجدول الزمني | ❌                          | ✅ (schedule fields)           |
| الهرمية       | مسطح                        | Objective → Target → Action    |

#### استخدام SEMP Hierarchy لـ Tool 4

```
SEMP_Objective (الهدف الاستراتيجي)
    └── SEMP_Target (الهدف الفرعي القابل للقياس)
            └── SEMP_Action (الإجراء التنفيذي مع المسؤول والموارد والموعد)
```

---

### Tool 5: Project Environmental Checklist and Evaluation Tool

**الاسم العربي**: قائمة تدقيق + أداة تقييم لمراقبة الأثر البيئي والاجتماعي

#### الوظيفة

متابعة المؤشرات البيئية والاجتماعية على مدى المشروع (Baseline + ربع سنوي).

#### الربط مع ERD

- **Primary Entity**: `MonitoringRecord`
- **Parent**: `Project`
- **Lookups**:
  - `Indicator` (المؤشرات)
  - `ImpactCategory` (فئات التأثير)
  - `User` (responsible)

#### هيكل Scores Object

```javascript
scores: {
  baseline: string,  // قبل البدء (نص يدوي)
  Q1: string,        // الربع الأول (نص يدوي)
  Q2: string,        // الربع الثاني (نص يدوي)
  Q3: string,        // الربع الثالث (نص يدوي)
  Q4: string         // الربع الرابع (نص يدوي)
}
```

#### إدخال القيم يدوياً

```javascript
// جميع القيم يتم إدخالها يدوياً من الفرونت
// لا يوجد حساب تلقائي في الـ Backend

// total: نص يدوي يتم إرساله من الفرونت
record.total = "قيمة يدوية";

// final_assessment: نص حر (لا enum)
record.final_assessment = "أي نص يريده المستخدم";

// ranking: enum محدد لكن يتم إرساله يدوياً من الفرونت
record.ranking = "medium"; // من enum: negligible, low, medium, high, not_applicable
```

---

## Lookup Tables (الجداول المرجعية)

### ImpactCategory

```javascript
// Pre-populated data (from seed.js)
[
  { code: "A", name: "Air Quality", name_ar: "جودة الهواء" },
  { code: "B", name: "Water Quality", name_ar: "جودة المياه" },
  { code: "C", name: "Noise", name_ar: "الضجيج" },
  { code: "D", name: "Solid Waste", name_ar: "النفايات الصلبة" },
  { code: "E", name: "Radiation", name_ar: "الإشعاع" },
  { code: "F", name: "Toxic & Dangerous Materials", name_ar: "المواد الخطرة" },
  {
    code: "J",
    name: "Plants, Forests & Wildlife",
    name_ar: "النباتات والحياة البرية",
  },
  {
    code: "H",
    name: "Land Use & Social Impacts",
    name_ar: "استخدام الأرض والمجتمع",
  },
];
// Note: MongoDB automatically generates _id (ObjectId) for each document
```

### Indicator (أمثلة)

```javascript
// Example data structure (from seed.js)
// Note: category is stored as ObjectId reference to ImpactCategory
[
  // Air Quality (code: "A")
  {
    category: ObjectId("..."), // Reference to ImpactCategory with code "A"
    name: "Visible Air Pollution",
    definition: "Presence of visible dust/smoke around the site",
    measurement: "Observation",
  },
  {
    category: ObjectId("..."), // Reference to ImpactCategory with code "A"
    name: "Community Complaints about Air",
    definition: "Logged air-quality complaints from community",
    measurement: "Review complaints",
  },
  // Water Quality (code: "B")
  {
    category: ObjectId("..."), // Reference to ImpactCategory with code "B"
    name: "Water Quality Complaints",
    definition: "Number of complaints related to water contamination",
    measurement: "Review complaints",
  },
];
// Note: MongoDB automatically generates _id (ObjectId) for each document.
// seed.js يعيّن category من catByCode[code] عند الإدراج. (3 مؤشرات في seed الحالي)
```

### ImpactQuestion (أمثلة)

```javascript
// Example data structure (from seed.js)
// Note: category is stored as ObjectId reference to ImpactCategory
[
  // Air Quality (code: "A")
  {
    category: ObjectId("..."), // Reference to ImpactCategory with code "A"
    question_text: "Will the project generate dust or smoke?",
    question_text_ar: null, // Optional Arabic translation
  },
  {
    category: ObjectId("..."), // Reference to ImpactCategory with code "A"
    question_text: "Will there be vehicle emissions?",
    question_text_ar: null,
  },
  // Water Quality (code: "B")
  {
    category: ObjectId("..."), // Reference to ImpactCategory with code "B"
    question_text: "Will the project discharge wastewater?",
    question_text_ar: null,
  },
  // Noise (code: "C")
  {
    category: ObjectId("..."), // Reference to ImpactCategory with code "C"
    question_text: "Will the project create sustained noise?",
    question_text_ar: null,
  },
  // ... more questions
];
// Note: MongoDB automatically generates _id (ObjectId) for each document.
// The seed uses: category (من catByCode[code]), question_text (من text).
// question_text_ar اختياري في الموديل ولا يُعبَّأ في seed.js.
```

### JobTitle

```javascript
// Pre-populated data (from seed.js)
[
  { title_name: "Environmental Specialist" },
  { title_name: "Program Manager" },
  { title_name: "Project Manager" },
  { title_name: "Environmental focal point" },
  { title_name: "Viewer" },
];
// Note: MongoDB automatically generates _id (ObjectId) for each document
// The seed script converts the array of strings to objects with title_name field
```

---

## Mongoose Models (النماذج النهائية)

### 1. Project Model

```javascript
const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    project_component: { type: String, trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
```

### 2. User Model

```javascript
const roles = [
  "environmental_specialist",
  "program_manager",
  "project_manager",
  "environmental_focal_point",
  "viewer",
];

const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    job_title: { type: mongoose.Schema.Types.ObjectId, ref: "JobTitle" },
    role: { type: String, enum: roles, default: "viewer" },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};
```

### 3. Screening Model (Tool 1)

```javascript
const screeningSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    category_code: {
      type: String,
      enum: ["A", "B", "C", "D", "E", "F"],
      required: true,
    },
    category_reason: { type: String, required: true },
    potential_negative: { type: String },
    potential_positive: { type: String },
    approved_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    recommendations: { type: String },
    screening_date: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["draft", "submitted", "approved", "rejected"],
      default: "draft",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
```

### 4. Assessment Model (Tool 2)

```javascript
const scoreCountSchema = new mongoose.Schema(
  {
    negligible: { type: Number, default: 0 },
    low: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    high: { type: Number, default: 0 },
    not_applicable: { type: Number, default: 0 },
  },
  { _id: false, versionKey: false }
);

const assessmentSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    officer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    project_activity: { type: String, required: true },
    description: { type: String, required: true },
    environmental_setting: { type: String },
    legal_requirements: { type: String },

    // Calculated fields
    total_project_score: scoreCountSchema,
    total_project_impact: {
      type: String,
      enum: ["negligible", "low", "medium", "high", "not_applicable"],
    },
    is_complete: { type: Boolean, default: false },

    potential_negative_impact: { type: String },
    potential_positive_impact: { type: String },

    approved_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    recommendations: { type: String },
    status: {
      type: String,
      enum: ["draft", "submitted", "approved", "rejected"],
      default: "draft",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
```

### 5. AssessmentMethod Model

```javascript
const assessmentMethodSchema = new mongoose.Schema(
  {
    assessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: true,
    },
    method_type: { type: String, required: true },
    details: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
```

### 6. CommunityConsultation Model

```javascript
const communityConsultationSchema = new mongoose.Schema(
  {
    assessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: true,
    },
    type: { type: String, required: true },
    participants: { type: String },
    notes: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
```

### 7. ImpactCategory Model (Lookup)

```javascript
const impactCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true }, // A, B, C, etc.
    name_ar: { type: String, trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
```

### 8. ImpactQuestion Model (Lookup)

```javascript
const impactQuestionSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ImpactCategory",
      required: true,
    },
    question_text: { type: String, required: true },
    question_text_ar: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
```

### 9. Indicator Model (Lookup)

```javascript
const indicatorSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ImpactCategory",
      required: true,
    },
    name: { type: String, required: true },
    definition: { type: String, required: true },
    measurement: { type: String, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
```

### 10. AssessmentImpactScore Model

```javascript
const assessmentImpactScoreSchema = new mongoose.Schema(
  {
    assessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: true,
    },
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ImpactQuestion",
      required: true,
    },
    level: {
      type: String,
      enum: ["negligible", "low", "medium", "high", "not_applicable"],
      required: true,
    },
    note: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
```

### 11. MonitoringRecord Model (Tool 5)

```javascript
const scoreSchema = new mongoose.Schema(
  {
    baseline: { type: String },
    Q1: { type: String },
    Q2: { type: String },
    Q3: { type: String },
    Q4: { type: String },
  },
  { _id: false, versionKey: false }
);

const monitoringRecordSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    indicator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Indicator",
      required: true,
    },
    scores: scoreSchema,
    total: { type: String },
    final_assessment: { type: String },
    ranking: {
      type: String,
      enum: ["negligible", "low", "medium", "high", "not_applicable"],
    },
    responsible: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    note: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
```

### 12. SEMP_Objective Model (Tool 3/4)

```javascript
const sempObjectiveSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    objective_text: { type: String, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
```

### 13. SEMP_Target Model

```javascript
const sempTargetSchema = new mongoose.Schema(
  {
    objective: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SempObjective",
      required: true,
    },
    target_text: { type: String, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
```

### 14. SEMP_Action Model

```javascript
const sempActionSchema = new mongoose.Schema(
  {
    target: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SempTarget",
      required: true,
    },
    action_text: { type: String, required: true },
    responsible: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resources: { type: String },
    due_date: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
```

### 15. JobTitle Model (Lookup)

```javascript
const jobTitleSchema = new mongoose.Schema(
  {
    title_name: { type: String, required: true, unique: true, trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
```

### 16. AnnexItem Model (Reference)

```javascript
const annexItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
```

### 17. Attachment Model

```javascript
const attachmentSchema = new mongoose.Schema(
  {
    entity_type: {
      type: String,
      enum: ["project", "screening", "assessment", "monitoring"],
      required: true,
    },
    entity_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    file_name: { type: String, required: true },
    file_path: { type: String, required: true },
    file_type: { type: String },
    file_size: { type: Number },
    uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
```

### 18. ManagementActivity Model

```javascript
const managementActivitySchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    serial_number: { type: Number },
    activity_description: { type: String, required: true },
    potential_impact: { type: String },
    recommended_actions: { type: mongoose.Schema.Types.Mixed }, // string or array
    monitoring_requirements: { type: String },
    responsible: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    notes: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
```

### 19. MitigationPlan Model

```javascript
const mitigationPlanSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    serial_number: { type: Number },
    output_description: { type: String, required: true },
    potential_impact_and_significance: { type: String },
    mitigation_and_enhancement_measures: { type: String },
    monitoring: { type: String },
    schedule: { type: String },
    responsible: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    notes: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
```

---

## API Endpoints

### Projects

| Method | Endpoint               | Description    |
| ------ | ---------------------- | -------------- |
| GET    | `/api/v1/projects`     | قائمة المشاريع |
| GET    | `/api/v1/projects/:id` | تفاصيل مشروع   |
| POST   | `/api/v1/projects`     | إنشاء مشروع    |
| PUT    | `/api/v1/projects/:id` | تحديث مشروع    |
| DELETE | `/api/v1/projects/:id` | حذف مشروع      |

### Tool 1: Screening

| Method | Endpoint                               | Description    |
| ------ | -------------------------------------- | -------------- |
| GET    | `/api/v1/screenings`                   | قائمة الفرز    |
| GET    | `/api/v1/screenings/:id`               | تفاصيل فرز     |
| GET    | `/api/v1/screenings/project/:projectId` | فرز مشروع معين |
| POST   | `/api/v1/screenings`                   | إنشاء فرز      |
| PUT    | `/api/v1/screenings/:id`               | تحديث فرز      |
| PATCH  | `/api/v1/screenings/:id/approve`       | الموافقة       |
| PATCH  | `/api/v1/screenings/:id/reject`        | الرفض          |

### Tool 2: Assessment

| Method | Endpoint                                | Description          |
| ------ | --------------------------------------- | -------------------- |
| GET    | `/api/v1/assessments`                   | قائمة التقييمات      |
| GET    | `/api/v1/assessments/:id`               | تفاصيل تقييم         |
| GET    | `/api/v1/assessments/project/:projectId` | تقييم مشروع معين     |
| POST   | `/api/v1/assessments`                   | إنشاء تقييم          |
| PUT    | `/api/v1/assessments/:id`               | تحديث تقييم          |
| POST   | `/api/v1/assessments/:id/methods`       | إضافة طريقة تقييم    |
| POST   | `/api/v1/assessments/:id/consultations` | إضافة مشاورة         |
| POST   | `/api/v1/assessments/:id/scores`        | إضافة/تحديث النتائج  |
| PATCH  | `/api/v1/assessments/:id/calculate`     | حساب المجموع         |
| PATCH  | `/api/v1/assessments/:id/approve`       | الموافقة على التقييم |
| PATCH  | `/api/v1/assessments/:id/reject`        | رفض التقييم          |

### Tool 5: Monitoring

| Method                                                                        | Endpoint                                | Description    |
| ----------------------------------------------------------------------------- | --------------------------------------- | -------------- |
| GET                                                                           | `/api/v1/monitoring`                    | قائمة السجلات  |
| GET                                                                           | `/api/v1/monitoring/project/:projectId` | سجلات مشروع    |
| GET                                                                           | `/api/v1/monitoring/:id`                | تفاصيل سجل واحد |
| POST                                                                          | `/api/v1/monitoring`                    | إنشاء سجل      |
| PUT                                                                           | `/api/v1/monitoring/:id`                | تحديث سجل      |
| PATCH                                                                         | `/api/v1/monitoring/:id/quarter/:q`     | تحديث ربع سنوي |

### Tool 3: Management Activities

| Method | Endpoint                                | Description         |
| ------ | --------------------------------------- | ------------------- |
| GET    | `/api/v1/management/project/:projectId` | قائمة إجراءات مشروع |
| POST   | `/api/v1/management`                    | إنشاء إجراء         |
| PUT    | `/api/v1/management/:id`                | تحديث إجراء         |
| DELETE | `/api/v1/management/:id`                | حذف إجراء           |

### Tool 4: Mitigation Plan

| Method | Endpoint                                | Description        |
| ------ | --------------------------------------- | ------------------ |
| GET    | `/api/v1/mitigation/project/:projectId` | خطة التخفيف لمشروع |
| POST   | `/api/v1/mitigation`                    | إنشاء بند تخفيف    |
| PUT    | `/api/v1/mitigation/:id`                | تحديث بند تخفيف    |
| DELETE | `/api/v1/mitigation/:id`                | حذف بند تخفيف      |

### SEMP (Tool 3/4)

| Method | Endpoint                          | Description    |
| ------ | --------------------------------- | -------------- |
| GET    | `/api/v1/semp/project/:projectId` | خطة مشروع      |
| POST   | `/api/v1/semp/objectives`         | إنشاء هدف      |
| POST   | `/api/v1/semp/targets`            | إنشاء هدف فرعي |
| POST   | `/api/v1/semp/actions`            | إنشاء إجراء    |
| PUT    | `/api/v1/semp/objectives/:id`     | تحديث هدف      |
| PUT    | `/api/v1/semp/targets/:id`        | تحديث هدف فرعي |
| PUT    | `/api/v1/semp/actions/:id`        | تحديث إجراء    |

### Lookups

| Method | Endpoint                            | Description       |
| ------ | ----------------------------------- | ----------------- |
| GET    | `/api/v1/lookups/impact-categories` | فئات التأثير      |
| GET    | `/api/v1/lookups/impact-questions`  | الأسئلة           |
| GET    | `/api/v1/lookups/indicators`        | المؤشرات          |
| GET    | `/api/v1/lookups/job-titles`        | المسميات الوظيفية |
| POST   | `/api/v1/attachments`               | إنشاء سجل مرفق    |
| POST   | `/api/v1/attachments/upload`        | رفع ملف فعلي      |
| GET    | `/api/v1/attachments/:id`           | تفاصيل مرفق       |

### Reports

| Method | Endpoint                    | Description                                                                                                          |
| ------ | --------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/v1/reports/dashboard` | إحصاءات عامة (dashboard)                                                                                             |
| GET    | `/api/v1/reports/export`    | تصدير CSV/Excel/PDF (مع type=projects أو monitoring، format=csv أو excel أو pdf، و projectId اختياري للـ monitoring) |

### Users

| Method | Endpoint        | Description                                       |
| ------ | --------------- | ------------------------------------------------- |
| GET    | `/api/v1/users` | قائمة المستخدمين (مسموح لجميع الأدوار عدا viewer) |

### Auth

| Method | Endpoint                | Description       |
| ------ | ----------------------- | ----------------- |
| POST   | `/api/v1/auth/register` | تسجيل مستخدم جديد |
| POST   | `/api/v1/auth/login`    | تسجيل الدخول      |

---

## تسلسل استخدام الأدوات (Tool Workflow)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PHASE 1: SCREENING                          │
├─────────────────────────────────────────────────────────────────────┤
│  1. إنشاء Project                                                    │
│  2. إنشاء Screening (Tool 1)                                        │
│  3. تحديد Category (A-F)                                            │
│     ├── Category E → ❌ لا يمكن المتابعة                            │
│     ├── Category C/D/F → ✅ قد لا يحتاج Tool 2                      │
│     └── Category A/B → ⚠️ يحتاج Tool 2                              │
│  4. موافقة Program Manager                                          │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       PHASE 2: ASSESSMENT                            │
├─────────────────────────────────────────────────────────────────────┤
│  5. إنشاء Assessment (Tool 2)                                       │
│  6. إضافة AssessmentMethods                                         │
│  7. إضافة CommunityConsultations                                    │
│  8. إضافة AssessmentImpactScores لكل سؤال                          │
│  9. حساب Total Project Impact                                       │
│     ├── Low                                           │
│     ├── Medium                             │
│     └── High                               │
│ 10. موافقة Program Manager + Environmental Officer                  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       PHASE 3: PLANNING                              │
├─────────────────────────────────────────────────────────────────────┤
│ 11. إنشاء إجراءات الإدارة التشغيلية (Tool 3 – ManagementActivity)   │
│     • وصف النشاط، الأثر المحتمل، الإجراءات الموصى بها              │
│     • متطلبات المراقبة، تعيين المسؤول (responsible)                 │
│ 12. إنشاء بنود خطة التخفيف (Tool 4 – MitigationPlan)                │
│     • وصف المخرج، الأثر والأهمية، إجراءات التخفيف والتعزيز          │
│     • المراقبة، الجدول الزمني (schedule)، تعيين المسؤول             │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      PHASE 4: MONITORING                             │
├─────────────────────────────────────────────────────────────────────┤
│ 13. إنشاء MonitoringRecords لكل Indicator (Tool 5)                  │
│ 14. تسجيل Baseline قبل البدء                                        │
│ 15. تحديث Q1, Q2, Q3, Q4 كل 3 أشهر                                  │
│ 16. حساب Total و Ranking                                            │
│ 17. إضافة Final Assessment                                          │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       PHASE 5: REVIEW                                │
├─────────────────────────────────────────────────────────────────────┤
│ 18. مراجعة دورية للأهداف (كل 30 يوم)                                │
│ 19. تحديث الخطة عند ظهور مخاطر جديدة                                │
│ 20. إعداد التقارير النهائية                                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## قواعد العمل (Business Rules)

### 1. تسلسل الأدوات

- **Tool 1** يجب أن يُكمل قبل Tool 2
- **Tool 2** يجب أن يُكمل قبل Tool 3 و Tool 4

### 2. Data Integrity

- Screening.status = 'approved' قبل إنشاء Assessment

---

## مراجع مفيدة (References)

### مصطلحات

| English    | Arabic                          |
| ---------- | ------------------------------- |
| EIA        | تقييم الأثر البيئي              |
| ESIA       | تقييم الأثر البيئي والاجتماعي   |
| ESMP       | خطة الإدارة البيئية والاجتماعية |
| SEMP       | خطة الإدارة الاجتماعية والبيئية |
| Screening  | الفرز الأولي                    |
| Assessment | التقييم                         |
| Monitoring | المراقبة                        |
| Mitigation | التخفيف                         |
| Baseline   | خط الأساس                       |

---

**آخر تحديث**: 15 يناير 2026
**الإصدار**: 2.2.0
**الحالة**: مُحدَّث ومصحح - متوافق مع الكود الفعلي
