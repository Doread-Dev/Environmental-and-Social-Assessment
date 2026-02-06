# خطة فهم المشروع - المرحلة الأولى
## Environmental and Social Assessment System - Backend

**تاريخ الإنشاء**: 2026-01-15  
**الهدف**: فهم شامل للمشروع من جميع الجوانب قبل البدء بأي تعديلات  
**المستوى**: Senior Backend Developer - 20 Years Experience

---

## 📋 جدول المحتويات

1. [البنية المعمارية (Architecture Overview)](#1-البنية-المعمارية)
2. [التدفق الكامل من المودل إلى الإند بوينت](#2-التدفق-الكامل-من-المودل-إلى-الإند-بوينت)
3. [الطبقات المعمارية (Layers)](#3-الطبقات-المعمارية)
4. [قاعدة البيانات والعلاقات](#4-قاعدة-البيانات-والعلاقات)
5. [الأدوات الخمسة (The Five Tools)](#5-الأدوات-الخمسة)
6. [نظام الأذونات والأدوار](#6-نظام-الأذونات-والأدوار)
7. [معالجة الأخطاء](#7-معالجة-الأخطاء)
8. [الملفات المهمة والتبعيات](#8-الملفات-المهمة-والتبعيات)
9. [قواعد العمل (Business Rules)](#9-قواعد-العمل)
10. [نقاط الانتباه للتعديلات المستقبلية](#10-نقاط-الانتباه-للتعديلات-المستقبلية)

---

## 1. البنية المعمارية (Architecture Overview)

### 1.1 Stack التقني

```
Backend Stack:
├── Framework: Express.js v4.18.2
├── Database: MongoDB with Mongoose v8.0.3
├── Validation: Joi v17.11.0
├── Security: Helmet v7.1.0, CORS v2.8.5
├── Authentication: JWT (jsonwebtoken v9.0.2), bcryptjs v2.4.3
├── File Upload: Multer v1.4.5-lts.1
├── Reporting: ExcelJS v4.4.0, PDFKit v0.13.0
├── Logging: Morgan v1.10.0
└── Environment: dotenv v16.3.1
```

### 1.2 هيكل المشروع

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection configuration
│   ├── controllers/             # Request handlers (12 controllers)
│   ├── db/
│   │   └── seed.js              # Database seeding script
│   ├── middlewares/
│   │   ├── auth.js              # JWT authentication & authorization
│   │   ├── errorHandler.js      # Centralized error handling
│   │   ├── upload.js            # Multer file upload configuration
│   │   └── validate.js          # Joi validation middleware
│   ├── models/                  # Mongoose schemas (19 models)
│   ├── routes/                  # API route definitions (12 route files)
│   │   └── index.js             # Main router (aggregates all routes)
│   ├── services/                # Business logic layer (12 services)
│   ├── utils/
│   │   ├── ApiError.js          # Custom error class
│   │   └── asyncHandler.js      # Async wrapper for error handling
│   ├── validators/              # Joi validation schemas (9 validators)
│   ├── app.js                   # Express app configuration
│   └── server.js                # Server entry point
├── uploads/                     # File upload directory
├── documents/                   # Project documentation
└── package.json
```

### 1.3 نمط التصميم (Design Pattern)

**Layered Architecture Pattern**:
```
Request → Router → Middleware (Auth + Validation) → Controller → Service → Model → Database
                                                                              ↓
Response ← Router ← Middleware (Error Handler) ← Controller ← Service ← Model ← Database
```

---

## 2. التدفق الكامل من المودل إلى الإند بوينت

### 2.1 مثال كامل: Screening (Tool 1)

#### الخطوة 1: Model (Schema Definition)
**الملف**: `src/models/screening.model.js`

```javascript
// تعريف Schema مع:
// - Fields (project, category_code, status, etc.)
// - References (project → Project, approved_by → User)
// - Enums (category_code: ["A","B","C","D","E","F"])
// - Defaults (status: "draft", screening_date: Date.now)
// - Timestamps (created_at, updated_at)
// - versionKey: false
```

**المخرجات**: Mongoose Model (`Screening`)

---

#### الخطوة 2: Validator (Input Validation)
**الملف**: `src/validators/screening.validator.js`

```javascript
// Joi Schemas:
// - createScreeningSchema: للتحقق من بيانات الإنشاء
// - updateScreeningSchema: للتحقق من بيانات التحديث
// - approveScreeningSchema: للتحقق من بيانات الموافقة
// - rejectScreeningSchema: للتحقق من بيانات الرفض
```

**المخرجات**: Joi Schema Objects

---

#### الخطوة 3: Service (Business Logic)
**الملف**: `src/services/screening.service.js`

```javascript
// Functions:
// - listScreenings(): جلب جميع السجلات مع populate
// - getScreening(id): جلب سجل واحد
// - getByProject(projectId): جلب سجل لمشروع معين
// - createScreening(payload): إنشاء سجل جديد
// - updateScreening(id, payload): تحديث سجل
// - approveScreening(id, approvedBy, recommendations): الموافقة
// - rejectScreening(id, rejectBy, rejectReason): الرفض
```

**المخرجات**: Business Logic Functions

**ملاحظات مهمة**:
- جميع العمليات تستخدم `ApiError` للأخطاء
- استخدام `populate()` لربط المراجع
- منطق الموافقة/الرفض منفصل في `setStatus()`

---

#### الخطوة 4: Controller (Request Handler)
**الملف**: `src/controllers/screening.controller.js`

```javascript
// Exports:
// - getAll: asyncHandler(service.listScreenings)
// - getOne: asyncHandler(service.getScreening)
// - getByProject: asyncHandler(service.getByProject)
// - create: asyncHandler(service.createScreening)
// - update: asyncHandler(service.updateScreening)
// - approve: asyncHandler(service.approveScreening)
// - reject: asyncHandler(service.rejectScreening)
```

**المخرجات**: HTTP Response (`{ success: true, data: ... }`)

**ملاحظات مهمة**:
- جميع الـ handlers مغلفة بـ `asyncHandler` لمعالجة الأخطاء
- استخدام `req.user._id` من middleware `auth` للموافقة/الرفض
- Status codes: 201 للإنشاء، 200 للتحديث/الجلب

---

#### الخطوة 5: Middleware (Auth + Validation)
**الملفات**: 
- `src/middlewares/auth.js`
- `src/middlewares/validate.js`

```javascript
// Auth Middleware:
// - auth: التحقق من JWT token
// - requireRole(...roles): التحقق من صلاحيات المستخدم

// Validation Middleware:
// - validate(schema): التحقق من req.body باستخدام Joi
```

**المخرجات**: `next()` أو Error

---

#### الخطوة 6: Router (Route Definition)
**الملف**: `src/routes/screenings.routes.js`

```javascript
// Routes:
// GET    /                    → controller.getAll
// GET    /:id                 → controller.getOne
// GET    /project/:projectId  → controller.getByProject
// POST   /                    → auth + requireRole + validate + controller.create
// PUT    /:id                 → auth + requireRole + validate + controller.update
// PATCH  /:id/approve         → auth + requireRole + validate + controller.approve
// PATCH  /:id/reject          → auth + requireRole + validate + controller.reject
```

**المخرجات**: Express Router

---

#### الخطوة 7: Main Router (Route Aggregation)
**الملف**: `src/routes/index.js`

```javascript
// Aggregates all routes:
router.use("/screenings", screeningsRoutes);
// ... other routes
```

**المخرجات**: Main Router

---

#### الخطوة 8: App Configuration
**الملف**: `src/app.js`

```javascript
// Middleware Stack:
// 1. helmet() - Security headers
// 2. cors() - CORS configuration
// 3. express.json() - Body parser
// 4. express.urlencoded() - URL encoded parser
// 5. morgan() - Logging
// 6. /health - Health check route
// 7. /api/v1 - API routes (from routes/index.js)
// 8. 404 handler
// 9. errorHandler - Error handling (must be last)
```

**المخرجات**: Express App

---

#### الخطوة 9: Server Entry Point
**الملف**: `src/server.js`

```javascript
// Flow:
// 1. Load environment variables (dotenv)
// 2. Require app
// 3. Connect to database (connectDB())
// 4. Start server (app.listen)
// 5. Handle unhandled rejections
// 6. Handle SIGTERM
```

**المخرجات**: Running Server

---

#### الخطوة 10: Error Handling
**الملف**: `src/middlewares/errorHandler.js`

```javascript
// Handles:
// - CastError (Mongoose bad ObjectId) → 404
// - 11000 (Mongoose duplicate key) → 400
// - ValidationError (Mongoose) → 400
// - isJoi (Joi validation) → 400
// - ApiError (Custom) → statusCode
// - Generic errors → 500
```

**المخرجات**: Error Response

---

### 2.2 التدفق الكامل (Complete Flow Diagram)

```
HTTP Request
    ↓
server.js (Entry Point)
    ↓
app.js (Express App)
    ↓
routes/index.js (Main Router)
    ↓
routes/screenings.routes.js (Specific Router)
    ↓
middlewares/auth.js (Authentication)
    ↓
middlewares/validate.js (Validation)
    ↓
controllers/screening.controller.js (Request Handler)
    ↓
services/screening.service.js (Business Logic)
    ↓
models/screening.model.js (Database Model)
    ↓
MongoDB Database
    ↓
Response (Success/Error)
    ↓
middlewares/errorHandler.js (Error Handling if needed)
    ↓
HTTP Response
```

---

## 3. الطبقات المعمارية (Layers)

### 3.1 Data Layer (Models)

**الموقع**: `src/models/`

**المسؤوليات**:
- تعريف Mongoose Schemas
- تحديد العلاقات (References)
- تحديد Constraints (required, enum, default)
- تحديد Timestamps

**عدد الملفات**: 19 model

**أمثلة**:
- `screening.model.js` - Tool 1
- `assessment.model.js` - Tool 2
- `monitoringRecord.model.js` - Tool 5
- `project.model.js` - Core Entity
- `user.model.js` - Authentication

**ملاحظات مهمة**:
- جميع الـ models تستخدم `versionKey: false`
- جميع الـ models تستخدم `timestamps: true`
- References تستخدم `mongoose.Schema.Types.ObjectId` مع `ref`

---

### 3.2 Validation Layer (Validators)

**الموقع**: `src/validators/`

**المسؤوليات**:
- تعريف Joi Schemas للتحقق من المدخلات
- تحديد القواعد (required, optional, enum, etc.)
- تنظيف البيانات (stripUnknown)

**عدد الملفات**: 9 validators

**أمثلة**:
- `screening.validator.js`
- `assessment.validator.js`
- `project.validator.js`

**ملاحظات مهمة**:
- كل validator يحتوي على schemas متعددة (create, update, approve, reject)
- استخدام `allow("", null)` للحقول الاختيارية
- استخدام `fork()` لإنشاء update schema من create schema

---

### 3.3 Business Logic Layer (Services)

**الموقع**: `src/services/`

**المسؤوليات**:
- تنفيذ منطق العمل
- التفاعل مع Models
- معالجة الأخطاء (ApiError)
- Populate المراجع

**عدد الملفات**: 12 services

**أمثلة**:
- `screening.service.js`
- `assessment.service.js` (معقد - يحتوي على calculateImpact)
- `monitoring.service.js`

**ملاحظات مهمة**:
- جميع الـ functions async
- استخدام `ApiError` للأخطاء (404, 400, etc.)
- استخدام `populate()` لربط المراجع
- بعض الـ services تحتوي على منطق معقد (مثل calculateImpact)

---

### 3.4 Controller Layer (Controllers)

**الموقع**: `src/controllers/`

**المسؤوليات**:
- استقبال HTTP Requests
- استدعاء Services
- إرسال HTTP Responses
- استخدام asyncHandler لمعالجة الأخطاء

**عدد الملفات**: 12 controllers

**أمثلة**:
- `screening.controller.js`
- `assessment.controller.js`
- `project.controller.js`

**ملاحظات مهمة**:
- جميع الـ handlers مغلفة بـ `asyncHandler`
- Response format: `{ success: true, data: ... }`
- Status codes: 201 للإنشاء، 200 للباقي
- استخدام `req.user` من auth middleware

---

### 3.5 Middleware Layer

**الموقع**: `src/middlewares/`

**الملفات**:
1. **auth.js**: Authentication & Authorization
   - `auth`: التحقق من JWT token
   - `requireRole(...roles)`: التحقق من الصلاحيات

2. **validate.js**: Input Validation
   - `validate(schema)`: التحقق من req.body

3. **errorHandler.js**: Error Handling
   - معالجة جميع أنواع الأخطاء
   - إرجاع response مناسب

4. **upload.js**: File Upload
   - Multer configuration
   - تخزين الملفات في `uploads/`

---

### 3.6 Route Layer

**الموقع**: `src/routes/`

**المسؤوليات**:
- تعريف API Endpoints
- ربط Middlewares بالControllers
- تحديد HTTP Methods

**عدد الملفات**: 12 route files + index.js

**أمثلة**:
- `screenings.routes.js`
- `assessments.routes.js`
- `projects.routes.js`

**ملاحظات مهمة**:
- ترتيب Middlewares مهم: auth → requireRole → validate → controller
- بعض الـ routes تحتوي على nested routes (مثل `/assessments/:id/methods`)

---

## 4. قاعدة البيانات والعلاقات

### 4.1 Core Entities

#### Project (الكيان الرئيسي)
- **Model**: `project.model.js`
- **Fields**: title, location, start_date, end_date, project_component
- **Relationships**: 
  - 1:1 → Screening
  - 1:1 → Assessment
  - 1:N → MonitoringRecord
  - 1:N → ManagementActivity
  - 1:N → MitigationPlan

#### User (المستخدمون)
- **Model**: `user.model.js`
- **Fields**: name, email, password (hashed), job_title, role, is_active
- **Relationships**:
  - N:1 → JobTitle
  - Referenced in: approved_by, reject_by, officer, responsible

---

### 4.2 Tool Entities

#### Tool 1: Screening
- **Model**: `screening.model.js`
- **Relationships**:
  - N:1 → Project
  - N:1 → User (approved_by, reject_by)
- **Status Flow**: draft → submitted → approved/rejected

#### Tool 2: Assessment
- **Model**: `assessment.model.js`
- **Child Entities**:
  - AssessmentMethod (1:N)
  - CommunityConsultation (1:N)
  - AssessmentImpactScore (1:N)
- **Relationships**:
  - N:1 → Project
  - N:1 → User (officer, approved_by, reject_by)
- **Calculated Fields**: total_project_score, total_project_impact

#### Tool 3: ManagementActivity
- **Model**: `managementActivity.model.js`
- **Relationships**:
  - N:1 → Project
  - N:1 → User (responsible)

#### Tool 4: MitigationPlan
- **Model**: `mitigationPlan.model.js`
- **Relationships**:
  - N:1 → Project
  - N:1 → User (responsible)
- **Alternative**: SEMP Hierarchy (SEMP_Objective → SEMP_Target → SEMP_Action)

#### Tool 5: MonitoringRecord
- **Model**: `monitoringRecord.model.js`
- **Relationships**:
  - N:1 → Project
  - N:1 → Indicator
  - N:1 → User (responsible)
- **Scores Object**: { baseline, Q1, Q2, Q3, Q4 }

---

### 4.3 Lookup Entities

#### ImpactCategory
- **Codes**: A, B, C, D, E, F, J, H
- **Relationships**: 1:N → ImpactQuestion, 1:N → Indicator

#### ImpactQuestion
- **Relationships**: N:1 → ImpactCategory

#### Indicator
- **Relationships**: N:1 → ImpactCategory

#### JobTitle
- **Relationships**: 1:N → User

---

## 5. الأدوات الخمسة (The Five Tools)

### 5.1 Tool 1: Screening (الفرز الأولي)

**الهدف**: تحديد مستوى الخطورة البيئية للمشروع

**Category Codes**:
- **A**: High Risk (يحتاج EIA كامل)
- **B**: Low-Moderate Risk (قابلة للتخفيف)
- **C**: Negligible Risk (مخاطر شبه معدومة)
- **D**: Emergency (حالات الطوارئ)
- **E**: Insufficient Info ❌ (لا يمكن المتابعة)
- **F**: Positive Impact ✅ (أثر بيئي إيجابي)

**Status Flow**: draft → submitted → approved/rejected

**Endpoints**:
- `GET /api/v1/screenings`
- `GET /api/v1/screenings/:id`
- `GET /api/v1/screenings/project/:projectId`
- `POST /api/v1/screenings`
- `PUT /api/v1/screenings/:id`
- `PATCH /api/v1/screenings/:id/approve`
- `PATCH /api/v1/screenings/:id/reject`

---

### 5.2 Tool 2: Assessment (التقييم التفصيلي)

**الهدف**: تحليل تفصيلي لكل نوع تأثير بيئي عبر 8 محاور

**Impact Categories (8 محاور)**:
- A: Air Quality (جودة الهواء)
- B: Water Quality (جودة المياه)
- C: Noise (الضجيج)
- D: Solid Waste (النفايات الصلبة)
- E: Radiation (الإشعاع)
- F: Toxic Materials (المواد الخطرة)
- J: Plants/Wildlife (النباتات والحياة البرية)
- H: Land Use & Social (استخدام الأرض والمجتمع)

**Impact Levels**: negligible, low, medium, high, not_applicable

**Calculated Fields**:
- `total_project_score`: عدد كل مستوى
- `total_project_impact`: المستوى الأعلى (high > medium > low > negligible)

**Child Entities**:
- AssessmentMethod: طرق التقييم المستخدمة
- CommunityConsultation: المشاورات المجتمعية
- AssessmentImpactScore: نتائج تقييم الأسئلة

**Endpoints**:
- `GET /api/v1/assessments`
- `GET /api/v1/assessments/:id`
- `GET /api/v1/assessments/project/:projectId`
- `POST /api/v1/assessments`
- `PUT /api/v1/assessments/:id`
- `POST /api/v1/assessments/:id/methods`
- `POST /api/v1/assessments/:id/consultations`
- `POST /api/v1/assessments/:id/scores`
- `PATCH /api/v1/assessments/:id/calculate`
- `PATCH /api/v1/assessments/:id/approve`
- `PATCH /api/v1/assessments/:id/reject`

---

### 5.3 Tool 3: Management Activities (إجراءات الإدارة)

**الهدف**: تحويل نتائج Tool 2 إلى إجراءات تنفيذ + مراقبة + مسؤوليات

**Fields**:
- serial_number
- activity_description
- potential_impact
- recommended_actions
- monitoring_requirements
- responsible (User FK)
- notes

**Endpoints**:
- `GET /api/v1/management/project/:projectId`
- `POST /api/v1/management`
- `PUT /api/v1/management/:id`
- `DELETE /api/v1/management/:id`

---

### 5.4 Tool 4: Mitigation Plan (خطة التخفيف)

**الهدف**: الخطة الأكثر شمولًا والأقرب للتنفيذ طويل الأمد، تشمل المخاطر المناخية

**Fields**:
- serial_number
- output_description
- potential_impact_and_significance
- mitigation_and_enhancement_measures
- monitoring
- schedule
- responsible (User FK)
- notes

**Alternative**: SEMP Hierarchy
- SEMP_Objective → SEMP_Target → SEMP_Action

**Endpoints**:
- `GET /api/v1/mitigation/project/:projectId`
- `POST /api/v1/mitigation`
- `PUT /api/v1/mitigation/:id`
- `DELETE /api/v1/mitigation/:id`

**SEMP Endpoints**:
- `GET /api/v1/semp/project/:projectId`
- `POST /api/v1/semp/objectives`
- `POST /api/v1/semp/targets`
- `POST /api/v1/semp/actions`
- `PUT /api/v1/semp/objectives/:id`
- `PUT /api/v1/semp/targets/:id`
- `PUT /api/v1/semp/actions/:id`

---

### 5.5 Tool 5: Monitoring (المراقبة)

**الهدف**: متابعة المؤشرات البيئية والاجتماعية على مدى المشروع

**Scores Object**:
```javascript
{
  baseline: string,  // قبل البدء
  Q1: string,       // الربع الأول
  Q2: string,      // الربع الثاني
  Q3: string,      // الربع الثالث
  Q4: string       // الربع الرابع
}
```

**Fields**:
- indicator (Indicator FK)
- scores (object)
- total (string - يدوي)
- final_assessment (string - يدوي)
- ranking (enum: negligible, low, medium, high, not_applicable)
- responsible (User FK)
- note

**ملاحظات مهمة**:
- جميع القيم يدوية (لا يوجد حساب تلقائي)
- total و final_assessment نص حر

**Endpoints**:
- `GET /api/v1/monitoring`
- `GET /api/v1/monitoring/project/:projectId`
- `GET /api/v1/monitoring/:id`
- `POST /api/v1/monitoring`
- `PUT /api/v1/monitoring/:id`
- `PATCH /api/v1/monitoring/:id/quarter/:q`

---

## 6. نظام الأذونات والأدوار

### 6.1 الأدوار (Roles)

```javascript
const roles = [
  "environmental_specialist",    // أخصائي بيئي
  "program_manager",              // مدير البرنامج
  "project_manager",              // مدير المشروع
  "environmental_focal_point",    // نقطة الاتصال البيئية
  "viewer"                        // مشاهد (أقل صلاحيات)
];
```

### 6.2 صلاحيات الأدوار

#### environmental_specialist
- ✅ إنشاء/تحديث جميع الأدوات
- ✅ الموافقة/الرفض على Screening و Assessment
- ✅ حساب Total Project Impact
- ✅ الوصول لجميع البيانات

#### program_manager
- ✅ إنشاء/تحديث جميع الأدوات
- ✅ الموافقة/الرفض على Screening و Assessment
- ✅ حساب Total Project Impact
- ✅ الوصول لجميع البيانات

#### project_manager
- ✅ إنشاء/تحديث جميع الأدوات
- ❌ لا يمكن الموافقة/الرفض
- ❌ لا يمكن حساب Total Project Impact

#### environmental_focal_point
- ⚠️ صلاحيات محدودة (يجب التحقق من الكود)

#### viewer
- ✅ قراءة فقط (GET requests)
- ❌ لا يمكن إنشاء/تحديث/حذف

### 6.3 Authentication Flow

```
1. User Login → POST /api/v1/auth/login
   ↓
2. Generate JWT Token (payload: { sub: user._id })
   ↓
3. Client stores token
   ↓
4. Client sends token in Authorization header: "Bearer <token>"
   ↓
5. auth middleware verifies token
   ↓
6. requireRole middleware checks user.role
   ↓
7. Controller receives req.user
```

---

## 7. معالجة الأخطاء

### 7.1 Error Types

#### ApiError (Custom Error)
- **Location**: `src/utils/ApiError.js`
- **Usage**: في Services
- **Properties**: statusCode, message, isOperational

#### Mongoose Errors
- **CastError**: Bad ObjectId → 404
- **11000**: Duplicate key → 400
- **ValidationError**: Schema validation → 400

#### Joi Errors
- **isJoi**: Validation error → 400

### 7.2 Error Handling Flow

```
Service throws ApiError
    ↓
Controller catches (via asyncHandler)
    ↓
Express error handler
    ↓
errorHandler middleware
    ↓
HTTP Response with error
```

### 7.3 Response Format

**Success**:
```json
{
  "success": true,
  "data": { ... }
}
```

**Error**:
```json
{
  "success": false,
  "error": "Error message",
  "stack": "..." // فقط في development
}
```

---

## 8. الملفات المهمة والتبعيات

### 8.1 Entry Points

1. **server.js**: نقطة البداية
   - Loads dotenv
   - Connects to database
   - Starts server

2. **app.js**: Express configuration
   - Middleware stack
   - Routes
   - Error handling

### 8.2 Configuration Files

1. **config/database.js**: MongoDB connection
2. **middlewares/upload.js**: Multer configuration
3. **.env**: Environment variables (يجب أن يحتوي على):
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `PORT`
   - `NODE_ENV`

### 8.3 Utility Files

1. **utils/asyncHandler.js**: Wrapper for async functions
2. **utils/ApiError.js**: Custom error class

### 8.4 Dependencies Order

```
server.js
  ↓
app.js
  ↓
routes/index.js
  ↓
routes/[specific].routes.js
  ↓
middlewares (auth, validate)
  ↓
controllers
  ↓
services
  ↓
models
  ↓
MongoDB
```

---

## 9. قواعد العمل (Business Rules)

### 9.1 تسلسل الأدوات

1. **Tool 1 (Screening)** يجب أن يُكمل قبل Tool 2
2. **Tool 2 (Assessment)** يجب أن يُكمل قبل Tool 3 و Tool 4
3. **Screening.status = 'approved'** قبل إنشاء Assessment

### 9.2 Status Flow

#### Screening & Assessment
```
draft → submitted → approved/rejected
```

### 9.3 Category Codes Logic

- **Category E**: لا يمكن المتابعة
- **Category C/D/F**: قد لا يحتاج Tool 2
- **Category A/B**: يحتاج Tool 2

### 9.4 Total Project Impact Calculation

**Logic**:
1. حساب عدد كل مستوى من AssessmentImpactScore
2. اختيار المستوى الأعلى حسب الأولوية:
   - high > medium > low > negligible > not_applicable
3. **ملاحظة مهمة**: يتم تحديد المستوى بناءً على **وجود** نقاط في مستوى معيّن، وليس على عدد النقاط

**Example**:
- إذا وُجد أي سؤال بمستوى `high`، يعتبر المشروع High impact
- حتى لو كانت بقية الأسئلة `low` أو `negligible` بعدد أكبر

---

## 10. نقاط الانتباه للتعديلات المستقبلية

### 10.1 عند إضافة Model جديد

1. ✅ إنشاء Schema في `src/models/`
2. ✅ إنشاء Validator في `src/validators/`
3. ✅ إنشاء Service في `src/services/`
4. ✅ إنشاء Controller في `src/controllers/`
5. ✅ إنشاء Router في `src/routes/`
6. ✅ إضافة Router إلى `src/routes/index.js`
7. ✅ تحديث `Overview.md` إذا لزم الأمر

### 10.2 عند إضافة Field جديد

1. ✅ تحديث Model Schema
2. ✅ تحديث Validator Schema
3. ✅ التحقق من Service (إذا كان يحتاج منطق خاص)
4. ✅ التحقق من Controller (إذا كان يحتاج معالجة خاصة)
5. ✅ تحديث Documentation

### 10.3 عند إضافة Endpoint جديد

1. ✅ إضافة Route في Router
2. ✅ إضافة Controller handler
3. ✅ إضافة Service function (إذا لزم)
4. ✅ إضافة Validator schema (إذا لزم)
5. ✅ تحديد Middlewares المطلوبة (auth, requireRole, validate)
6. ✅ تحديث Documentation

### 10.4 عند تعديل Business Logic

1. ✅ تحديث Service فقط (لا Controller)
2. ✅ اختبار جميع الحالات
3. ✅ التحقق من Error Handling
4. ✅ تحديث Documentation

### 10.5 عند إضافة Role جديد

1. ✅ تحديث `user.model.js` (enum roles)
2. ✅ تحديث جميع `requireRole()` في Routes
3. ✅ تحديث Documentation
4. ✅ تحديث Seed script (إذا لزم)

### 10.6 نقاط حساسة

⚠️ **لا تعدل**:
- `asyncHandler` wrapper
- `errorHandler` middleware (إلا إذا كان ضرورياً)
- `auth` middleware (إلا إذا كان ضرورياً)
- Database connection logic

⚠️ **احذر عند تعديل**:
- `calculateImpact` في assessment.service.js (منطق معقد)
- Status flow logic
- Populate queries (قد يؤثر على الأداء)

---

## 11. Checklist قبل أي تعديل

- [ ] قراءة Model Schema
- [ ] قراءة Validator Schema
- [ ] قراءة Service Logic
- [ ] قراءة Controller Handler
- [ ] قراءة Route Definition
- [ ] التحقق من Middlewares المطلوبة
- [ ] التحقق من Error Handling
- [ ] التحقق من Business Rules
- [ ] التحقق من Relationships
- [ ] تحديث Documentation

---

## 12. مصادر إضافية

### 12.1 Documentation Files

- `backend/documents/Overview.md` - الوثائق الرئيسية
- `backend/documents/Endpoints.md` - قائمة الإند بوينتات
- `backend/documents/Roles.md` - تفاصيل الأدوار

### 12.2 Seed Script

- `backend/src/db/seed.js` - لملء البيانات الأولية
- **Run**: `npm run seed`

### 12.3 Logs

- `backend/server-dev.log` - سجلات الخادم

---

## الخلاصة

هذا المشروع يستخدم **Layered Architecture Pattern** مع فصل واضح للطبقات:

1. **Models**: تعريف البيانات والعلاقات
2. **Validators**: التحقق من المدخلات
3. **Services**: منطق العمل
4. **Controllers**: معالجة الطلبات
5. **Routes**: تعريف الإند بوينتات
6. **Middlewares**: الأمان والتحقق ومعالجة الأخطاء

**التدفق**: Request → Router → Middleware → Controller → Service → Model → Database

**الأدوات الخمسة**: Screening → Assessment → Management/Mitigation → Monitoring

**نظام الأذونات**: JWT-based authentication مع Role-based authorization

**معالجة الأخطاء**: Centralized error handling مع ApiError class

---

**آخر تحديث**: 2026-01-15  
**الحالة**: ✅ جاهز للبدء بالتعديلات
