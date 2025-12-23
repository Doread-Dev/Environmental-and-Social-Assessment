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
- **Logging**: Morgan v1.10.0
- **Environment**: dotenv v16.3.1

### Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── middlewares/
│   │   ├── errorHandler.js      # Centralized error handling
│   │   └── validate.js          # Joi validation middleware
│   ├── routes/
│   │   └── index.js             # API routes (empty)
│   ├── utils/
│   │   ├── ApiError.js          # Custom error class
│   │   └── asyncHandler.js      # Async wrapper
│   ├── app.js                   # Express app configuration
│   └── server.js                # Server entry point
```

### ما تم إعداده

✅ البنية الأساسية للباك إند  
✅ معالجة الأخطاء المركزية  
✅ نظام التحقق من البيانات  
✅ الأمان الأساسي (Helmet, CORS)  
✅ اتصال MongoDB  
✅ جميع نماذج Mongoose للأدوات الخمس + الكيانات المساعدة  
✅ سكربت Seed للـ Lookups (`npm run seed`)
✅ تشغيل Seed فعليًا (ImpactCategory, ImpactQuestion, Indicator, JobTitle)  
✅ Controllers/Routes/Services/Validators لكل الأدوات الأساسية  
✅ Authentication/Authorization  
✅ File upload handling (للمستندات المرفقة)  
✅ Reporting system

---

## مخطط قاعدة البيانات (Database ERD)

### الرسم البياني للعلاقات

```
┌─────────────────┐              ┌─────────────────┐
│    JobTitle     │ 1:N          │     AnnexItem   │
├─────────────────┤              ├─────────────────┤
│ job_title_id PK │              │ annex_id PK     │
│ title_name      │              │ title           │
└────────┬────────┘              │ description     │
         │                       └─────────────────┘
         │
         ▼
┌─────────────────┐
│      User       │
├─────────────────┤
│ user_id PK      │
│ name            │
│ email           │
│ password (hash) │
│ job_title_id FK │
│ role (enum)     │
│ is_active       │
└────────┬────────┘
         │ (approvals/responsibility/uploads)
         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                                PROJECT                                 │
├────────────────────────────────────────────────────────────────────────┤
│ project_id PK │ title │ location │ start_date │ end_date │ component  │
└───────┬───────────────────────┬───────────────┬───────────┬──────────┘
        │1:1                    │1:1            │1:N        │1:N
        ▼                       ▼               ▼           ▼
┌───────────────┐      ┌────────────────┐   ┌────────────────────┐   ┌────────────────────┐
│   Screening   │      │   Assessment   │   │ MonitoringRecord   │   │ ManagementActivity │
│   (Tool 1)    │      │   (Tool 2)     │   │     (Tool 5)       │   │      (Tool 3)      │
├───────────────┤      ├────────────────┤   ├────────────────────┤   ├────────────────────┤
│ screening_id  │      │ assessment_id  │   │ monitoring_id      │   │ activity_id         │
│ project_id FK │      │ project_id FK  │   │ project_id FK      │   │ project_id FK       │
│ category_code │      │ officer_id FK  │   │ indicator_id FK    │   │ serial_number       │
│ category_reason│     │ project_activity│  │ scores object      │   │ activity_description│
│ potential_neg │      │ description    │   │ total / final_ass. │   │ potential_impact    │
│ potential_pos │      │ legal_req      │   │ ranking            │   │ recommended_actions │
│ approved_by FK│      │ approved_by FK │   │ responsible_id FK  │   │ monitoring_requirem.│
│ status/date   │      │ status         │   │ created_at / upd.  │   │ responsible_id FK   │
└───────┬───────┘      └───────┬────────┘   └──────────┬─────────┘   │ notes              │
        │1:1                   │1:N                   │             └────────────────────┘
        ▼                      ▼                      │
┌─────────────────────┐   ┌─────────────────────────┐ │
│   MitigationPlan    │   │ AssessmentMethod        │ │
│     (Tool 4)        │   ├─────────────────────────┤ │
├─────────────────────┤   │ method_id PK            │ │
│ plan_id PK          │   │ assessment_id FK        │ │
│ project_id FK       │   │ method_type             │ │
│ serial_number       │   │ details                 │ │
│ output_description  │   └─────────────────────────┘ │
│ env/social/climate  │                              │
│ impact_level        │   ┌─────────────────────────┐ │
│ mitigation measures │   │ CommunityConsultation   │ │
│ enhancement measures│   ├─────────────────────────┤ │
│ monitoring          │   │ consultation_id PK      │ │
│ schedule before/during/after│ assessment_id FK     │ │
│ is_continuous       │   │ type, participants      │ │
│ responsible_id FK   │   │ notes                   │ │
└──────────┬──────────┘   └─────────────────────────┘ │
           │                                          │
           │                                          ▼1:N
           │                             ┌─────────────────────────┐
           │                             │ AssessmentImpactScore   │
           │                             ├─────────────────────────┤
           │                             │ score_id PK             │
           │                             │ assessment_id FK        │
           │                             │ question_id FK          │
           │                             │ level (enum)            │
           │                             │ note                    │
           │                             └─────────────────────────┘
           │
           │1:N (hierarchical alternative for Tool 4)
           ▼
┌─────────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  SEMP_Objective     │1:N   │   SEMP_Target   │1:N   │   SEMP_Action   │
├─────────────────────┤      ├─────────────────┤      ├─────────────────┤
│ objective_id PK     │      │ target_id PK    │      │ action_id PK    │
│ project_id FK       │      │ objective_id FK │      │ target_id FK    │
│ objective_text      │      │ target_text     │      │ action_text     │
└────────┬────────────┘      └────────┬────────┘      │ responsible_id FK
         │1:N                         │1:N            │ resources, due_date
         │                            │              └─────────────────────
         ▼                            ▼
┌─────────────────┐        ┌─────────────────┐
│   Attachment    │        │   Indicator     │
├─────────────────┤        ├─────────────────┤
│ attachment_id PK│        │ indicator_id PK │
│ entity_type     │        │ category_id FK  │
│ entity_id       │        │ name/definition │
│ file meta       │        └─────────────────┘
│ uploaded_by FK  │
└─────────────────┘

LOOKUPS: ImpactCategory (A-H) 1:N ImpactQuestion; Indicator links to
ImpactCategory; JobTitle for User; AnnexItem referenced by plans/reports.
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
Lookups: JobTitle (for approved_by)
```

### Tool 2: Assessment (التقييم التفصيلي)

```
Entities: Assessment + AssessmentMethod + CommunityConsultation + AssessmentImpactScore
Lookups: ImpactCategory + ImpactQuestion + JobTitle
```

### Tool 3: Management Activities (إجراءات الإدارة)

```
Entities: ManagementActivity
Lookups: JobTitle + User (responsible_id)
```

### Tool 4: Mitigation Plan (خطة التخفيف)

```
Entities: MitigationPlan
  أو (كبديل هرمي) SEMP_Objective + SEMP_Target + SEMP_Action
Lookups: JobTitle + User
```

### Tool 5: Monitoring (المراقبة)

```
Entities: MonitoringRecord
Lookups: Indicator + ImpactCategory + JobTitle
```

### Management Plan (خطة الإدارة)

```
Entities: SEMP_Objective + SEMP_Target + SEMP_Action
Lookups: JobTitle + AnnexItem
```

---

## الأدوات الخمس الرئيسية (The Five Core Tools)

### Tool 1: Environmental Integration Screening Tool – Summary Table

**الاسم العربي**: أداة الفرز الأولي لدمج الاعتبارات البيئية – جدول ملخّص

#### الوظيفة

أداة القرار الأولية لتحديد مستوى الخطورة البيئية للمشروع قبل البدء في التقييم التفصيلي.

#### الربط مع ERD

- **Primary Entity**: `Screening`
- **Parent**: `Project` (FK: project_id)
- **References**: `User` (FK: approved_by)

#### الحقول المطلوبة (من ERD + الإضافات)

| Field              | Type             | Source    |
| ------------------ | ---------------- | --------- |
| screening_id       | int (PK)         | ERD       |
| project_id         | int (FK)         | ERD       |
| category_code      | string (A-F)     | ERD       |
| category_reason    | string           | ERD       |
| potential_negative | string           | ERD       |
| potential_positive | string           | ERD       |
| approved_by        | int (FK -> User) | ERD       |
| recommendations    | string           | ERD       |
| screening_date     | date             | **إضافة** |
| status             | enum             | **إضافة** |
| created_at         | date             | **إضافة** |
| updated_at         | date             | **إضافة** |

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
  - `User` (officer_id, approved_by)

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
const scoreMap = { negligible: 0, low: 1, medium: 2, high: 3 };
const scores = assessmentImpactScores.map((s) => scoreMap[s.level] || 0);
const totalScore = scores.reduce((a, b) => a + b, 0);
const avgScore = totalScore / scores.length;

// Determine Impact Level
if (avgScore <= 1) return "Low";
if (avgScore <= 2) return "Medium";
return "High";
```

---

### Tool 3: Template for Environmental and Social Management Activities

**الاسم العربي**: قالب لخطة أنشطة الإدارة البيئية والاجتماعية (ESMP)

#### الوظيفة

تحويل نتائج Tool 2 إلى إجراءات تنفيذ + مراقبة + مسؤوليات.

#### الربط مع ERD

- **Primary Entity**: `ManagementActivity` (مُدمج في ERD المحدث)
- **Alternative**: استخدام `SEMP_Objective -> SEMP_Target -> SEMP_Action`
- **Parent**: `Project`
- **References**: `User` (responsible_id)

#### الهيكل المقترح

```javascript
ManagementActivity {
  activity_id: int (PK),
  project_id: int (FK -> Project),
  serial_number: int,
  activity_description: string,      // وصف الإجراء
  potential_impact: enum ['low','medium','high'],
  recommended_actions: string | string[], // الإجراءات المطلوبة
  monitoring_requirements: string,   // متطلبات المراقبة
  responsible_id: int (FK -> User),  // المسؤول
  notes: string,
  created_at: date
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
  - `User` (responsible_id)

#### هيكل Scores Object

```javascript
scores: {
  baseline: number,  // قبل البدء
  Q1: number,        // الربع الأول
  Q2: number,        // الربع الثاني
  Q3: number,        // الربع الثالث
  Q4: number         // الربع الرابع
}
```

#### حساب Ranking

```javascript
const rankingMap = {
  negligible: 0,
  low: 1,
  medium: 2,
  high: 3,
};

// Total = sum of quarterly scores
// Ranking = based on final_assessment enum
```

---

## Lookup Tables (الجداول المرجعية)

### ImpactCategory

```javascript
// Pre-populated data
[
  { category_id: 1, name: "Air Quality" },
  { category_id: 2, name: "Water Quality" },
  { category_id: 3, name: "Noise" },
  { category_id: 4, name: "Solid Waste" },
  { category_id: 5, name: "Radiation" },
  { category_id: 6, name: "Toxic & Dangerous Materials" },
  { category_id: 7, name: "Plants, Forests & Wildlife" },
  { category_id: 8, name: "Land Use & Social Impacts" },
];
```

### Indicator (أمثلة)

```javascript
// Each category has 3 indicators (24 total)
[
  // Air Quality
  {
    indicator_id: 1,
    category_id: 1,
    name: "Visible Air Pollution",
    definition: "...",
    measurement: "Observation",
  },
  {
    indicator_id: 2,
    category_id: 1,
    name: "Community Complaints about Air",
    definition: "...",
    measurement: "Review complaints",
  },
  {
    indicator_id: 3,
    category_id: 1,
    name: "Impact on Soil/Plants",
    definition: "...",
    measurement: "Observation",
  },
  // ... more indicators
];
```

### ImpactQuestion (أمثلة)

```javascript
// Each category has multiple questions
[
  {
    question_id: 1,
    category_id: 1,
    question_text: "Will the project generate dust or smoke?",
  },
  {
    question_id: 2,
    category_id: 1,
    question_text: "Will there be vehicle emissions?",
  },
  // ... more questions
];
```

### JobTitle

```javascript
// Pre-populated data
[
  { job_title_id: 1, title_name: "Environmental Specialist" },
  { job_title_id: 2, title_name: "Program Manager" },
  { job_title_id: 3, title_name: "Project Manager" },
  { job_title_id: 4, title_name: "Environmental Focal point" },
  { job_title_id: 5, title_name: "Viewer" },
];
```

---

## Mongoose Models (النماذج النهائية)

### 1. Project Model

```javascript
const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    location: { type: String, required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    project_component: { type: String },
  },
  { timestamps: true }
);
```

### 2. User Model

```javascript
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    job_title: { type: mongoose.Schema.Types.ObjectId, ref: "JobTitle" },
    role: {
      type: String,
      enum: [
        "environmental_specialist",
        "program_manager",
        "project_manager",
        "environmental_focal_point",
        "viewer",
      ],
      default: "viewer",
    },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);
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
  { timestamps: true }
);
```

### 4. Assessment Model (Tool 2)

```javascript
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
    total_project_score: { type: Number },
    total_project_impact: {
      type: String,
      enum: ["Low", "Medium", "High"],
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
  { timestamps: true }
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
  { timestamps: true }
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
  { timestamps: true }
);
```

### 7. ImpactCategory Model (Lookup)

```javascript
const impactCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true }, // A, B, C, etc.
  name_ar: { type: String },
});
```

### 8. ImpactQuestion Model (Lookup)

```javascript
const impactQuestionSchema = new mongoose.Schema({
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ImpactCategory",
    required: true,
  },
  question_text: { type: String, required: true },
  question_text_ar: { type: String },
});
```

### 9. Indicator Model (Lookup)

```javascript
const indicatorSchema = new mongoose.Schema({
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ImpactCategory",
    required: true,
  },
  name: { type: String, required: true },
  definition: { type: String, required: true },
  measurement: { type: String, required: true },
});
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
  { timestamps: true }
);
```

### 11. MonitoringRecord Model (Tool 5)

```javascript
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
    scores: {
      baseline: { type: Number },
      Q1: { type: Number },
      Q2: { type: Number },
      Q3: { type: Number },
      Q4: { type: Number },
    },
    total: { type: Number },
    final_assessment: {
      type: String,
      enum: ["negligible", "low", "medium", "high", "not_applicable"],
    },
    ranking: { type: Number, min: 0, max: 3 },
    responsible: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    note: { type: String },
  },
  { timestamps: true }
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
  { timestamps: true }
);
```

### 13. SEMP_Target Model

```javascript
const sempTargetSchema = new mongoose.Schema(
  {
    objective: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SEMP_Objective",
      required: true,
    },
    target_text: { type: String, required: true },
  },
  { timestamps: true }
);
```

### 14. SEMP_Action Model

```javascript
const sempActionSchema = new mongoose.Schema(
  {
    target: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SEMP_Target",
      required: true,
    },
    action_text: { type: String, required: true },
    responsible: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resources: { type: String },
    due_date: { type: Date },
  },
  { timestamps: true }
);
```

### 15. JobTitle Model (Lookup)

```javascript
const jobTitleSchema = new mongoose.Schema({
  title_name: { type: String, required: true, unique: true },
});
```

### 16. AnnexItem Model (Reference)

```javascript
const annexItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
});
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
  { timestamps: true }
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
    potential_impact: { type: String, enum: ["low", "medium", "high"] },
    recommended_actions: { type: mongoose.Schema.Types.Mixed }, // string or array
    monitoring_requirements: { type: String },
    responsible: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    notes: { type: String },
  },
  { timestamps: true }
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
    environmental_impact: { type: String },
    social_impact: { type: String },
    climate_impact: { type: String },
    impact_level: { type: String, enum: ["low", "medium", "high"] },
    mitigation_measures: { type: String },
    enhancement_measures: { type: String },
    monitoring: { type: String },
    schedule_before: { type: String },
    schedule_during: { type: String },
    schedule_after: { type: String },
    is_continuous: { type: Boolean, default: false },
    responsible: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    notes: { type: String },
  },
  { timestamps: true }
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

| Method | Endpoint                                | Description    |
| ------ | --------------------------------------- | -------------- |
| GET    | `/api/v1/screenings`                    | قائمة الفرز    |
| GET    | `/api/v1/screenings/:id`                | تفاصيل فرز     |
| GET    | `/api/v1/projects/:projectId/screening` | فرز مشروع معين |
| POST   | `/api/v1/screenings`                    | إنشاء فرز      |
| PUT    | `/api/v1/screenings/:id`                | تحديث فرز      |
| PATCH  | `/api/v1/screenings/:id/approve`        | الموافقة       |
| PATCH  | `/api/v1/screenings/:id/reject`         | الرفض          |

### Tool 2: Assessment

| Method | Endpoint                                 | Description         |
| ------ | ---------------------------------------- | ------------------- |
| GET    | `/api/v1/assessments`                    | قائمة التقييمات     |
| GET    | `/api/v1/assessments/:id`                | تفاصيل تقييم        |
| GET    | `/api/v1/projects/:projectId/assessment` | تقييم مشروع معين    |
| POST   | `/api/v1/assessments`                    | إنشاء تقييم         |
| PUT    | `/api/v1/assessments/:id`                | تحديث تقييم         |
| POST   | `/api/v1/assessments/:id/methods`        | إضافة طريقة تقييم   |
| POST   | `/api/v1/assessments/:id/consultations`  | إضافة مشاورة        |
| POST   | `/api/v1/assessments/:id/scores`         | إضافة/تحديث النتائج |
| PATCH  | `/api/v1/assessments/:id/calculate`      | حساب المجموع        |

### Tool 5: Monitoring

| Method | Endpoint                                 | Description    |
| ------ | ---------------------------------------- | -------------- |
| GET    | `/api/v1/monitoring`                     | قائمة السجلات  |
| GET    | `/api/v1/projects/:projectId/monitoring` | سجلات مشروع    |
| POST   | `/api/v1/monitoring`                     | إنشاء سجل      |
| PUT    | `/api/v1/monitoring/:id`                 | تحديث سجل      |
| PATCH  | `/api/v1/monitoring/:id/quarter/:q`      | تحديث ربع سنوي |

### Tool 3: Management Activities

| Method | Endpoint                                 | Description         |
| ------ | ---------------------------------------- | ------------------- |
| GET    | `/api/v1/projects/:projectId/management` | قائمة إجراءات مشروع |
| POST   | `/api/v1/management`                     | إنشاء إجراء         |
| PUT    | `/api/v1/management/:id`                 | تحديث إجراء         |
| DELETE | `/api/v1/management/:id`                 | حذف إجراء           |

### Tool 4: Mitigation Plan

| Method | Endpoint                                 | Description        |
| ------ | ---------------------------------------- | ------------------ |
| GET    | `/api/v1/projects/:projectId/mitigation` | خطة التخفيف لمشروع |
| POST   | `/api/v1/mitigation`                     | إنشاء بند تخفيف    |
| PUT    | `/api/v1/mitigation/:id`                 | تحديث بند تخفيف    |
| DELETE | `/api/v1/mitigation/:id`                 | حذف بند تخفيف      |

### SEMP (Tool 3/4)

| Method | Endpoint                           | Description    |
| ------ | ---------------------------------- | -------------- |
| GET    | `/api/v1/projects/:projectId/semp` | خطة مشروع      |
| POST   | `/api/v1/semp/objectives`          | إنشاء هدف      |
| POST   | `/api/v1/semp/targets`             | إنشاء هدف فرعي |
| POST   | `/api/v1/semp/actions`             | إنشاء إجراء    |
| PUT    | `/api/v1/semp/objectives/:id`      | تحديث هدف      |
| PUT    | `/api/v1/semp/targets/:id`         | تحديث هدف فرعي |
| PUT    | `/api/v1/semp/actions/:id`         | تحديث إجراء    |

### Lookups

| Method | Endpoint                     | Description       |
| ------ | ---------------------------- | ----------------- |
| GET    | `/api/v1/impact-categories`  | فئات التأثير      |
| GET    | `/api/v1/impact-questions`   | الأسئلة           |
| GET    | `/api/v1/indicators`         | المؤشرات          |
| GET    | `/api/v1/job-titles`         | المسميات الوظيفية |
| POST   | `/api/v1/attachments`        | إنشاء سجل مرفق    |
| POST   | `/api/v1/attachments/upload` | رفع ملف فعلي      |
| GET    | `/api/v1/attachments/:id`    | تفاصيل مرفق       |

### Reports

| Method | Endpoint                    | Description                           |
| ------ | --------------------------- | ------------------------------------- | ---------------------- | ----- | ---------------------------------------- |
| GET    | `/api/v1/reports/dashboard` | إحصاءات عامة (dashboard)              |
| GET    | `/api/v1/reports/export`    | تصدير CSV/Excel/PDF (مع type=projects | monitoring، format=csv | excel | pdf، و projectId اختياري للـ monitoring) |

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
│     ├── Low → Tool 3 كافٍ                                           │
│     ├── Medium → Tool 3 + يُفضل Tool 4                              │
│     └── High → Tool 3 + Tool 4 إلزامي                               │
│ 10. موافقة Program Manager + Environmental Officer                  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       PHASE 3: PLANNING                              │
├─────────────────────────────────────────────────────────────────────┤
│ 11. إنشاء SEMP_Objectives (Tool 3/4)                                │
│ 12. إضافة SEMP_Targets لكل هدف                                      │
│ 13. إضافة SEMP_Actions لكل هدف فرعي                                 │
│ 14. تحديد المسؤوليات والمواعيد                                      │
│ 15. موافقة Project Manager                                          │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      PHASE 4: MONITORING                             │
├─────────────────────────────────────────────────────────────────────┤
│ 16. إنشاء MonitoringRecords لكل Indicator (Tool 5)                  │
│ 17. تسجيل Baseline قبل البدء                                        │
│ 18. تحديث Q1, Q2, Q3, Q4 كل 3 أشهر                                  │
│ 19. حساب Total و Ranking                                            │
│ 20. إضافة Final Assessment                                          │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       PHASE 5: REVIEW                                │
├─────────────────────────────────────────────────────────────────────┤
│ 21. مراجعة دورية للأهداف (كل 30 يوم)                                │
│ 22. تحديث الخطة عند ظهور مخاطر جديدة                                │
│ 23. إعداد التقارير النهائية                                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## قواعد العمل (Business Rules)

### 1. تسلسل الأدوات

- **Tool 1** يجب أن يُكمل قبل Tool 2
- **Tool 2** يجب أن يُكمل قبل Tool 3 و Tool 4
- **Tool 5** يمكن أن يبدأ بعد Tool 2

### 2. Category Rules

| Category | Tool 2     | Tool 3    | Tool 4    |
| -------- | ---------- | --------- | --------- |
| A        | ✅ إلزامي  | ✅ إلزامي | ✅ إلزامي |
| B        | ✅ إلزامي  | ✅ إلزامي | يُفضل     |
| C        | اختياري    | اختياري   | ❌        |
| D        | مختصر      | اختياري   | ❌        |
| E        | ❌ لا يمكن | ❌        | ❌        |
| F        | اختياري    | اختياري   | ❌        |

### 3. Impact Level Rules

| Impact | Tool 3    | Tool 4    |
| ------ | --------- | --------- |
| Low    | ✅ كافٍ   | ❌        |
| Medium | ✅ إلزامي | يُفضل     |
| High   | ✅ إلزامي | ✅ إلزامي |

### 4. Data Integrity

- لا يمكن حذف Project مرتبط بـ Screening
- لا يمكن تعديل Category بعد الموافقة
- Screening.status = 'approved' قبل إنشاء Assessment

---

## الخطوات التالية (Next Steps)

### Phase 1: إعداد قاعدة البيانات

1. ✅ تحليل ERD
2. ✅ إنشاء Mongoose Models
3. ✅ تشغيل Seed للـ Lookups (`npm run seed`)

### Phase 2: إنشاء الـ API

4. ✅ Routes & Controllers
5. ✅ Services (Business Logic)
6. ✅ Validators (Joi)

### Phase 3: الميزات الإضافية

7. ✅ Authentication (JWT) + Authorization middleware
8. ✅ File Upload (مرفقات مع التخزين المحلي uploads/)
9. ✅ تفعيل حماية المسارات بحسب الأدوار (auth + requireRole) مع حارس تسجيل أول مستخدم فقط

### Phase 4: التقارير

10. ✅ Dashboard Stats (API: /reports/dashboard)
11. ✅ PDF/Excel/CSV Export (API: /reports/export?type=projects|monitoring&format=csv|excel|pdf)

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

**آخر تحديث**: 21 ديسمبر 2024
**الإصدار**: 2.0.0
**الحالة**: مُحدَّث مع ERD
