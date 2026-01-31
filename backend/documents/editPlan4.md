# خطة التعديل 4: إضافة حقول reject_reason و reject_by للـ Screening

**التاريخ**: 2026-01-15  
**الهدف**: إضافة حقول `reject_reason` (نص) و `reject_by` (User ID) في نموذج Screening لتسجيل سبب الرفض والمسؤول عن الرفض عند استخدام endpoint `/api/v1/screenings/:id/reject`

---

## 📋 ملخص التعديل

### التغييرات المطلوبة:
1. **Model**: إضافة حقل `reject_reason` (String) و `reject_by` (ObjectId ref User) في `screening.model.js`
2. **Service**: تعديل دالة `rejectScreening` لقبول `reject_reason` وحفظه مع `reject_by`
3. **Controller**: تعديل `reject` controller لاستقبال `reject_reason` من `req.body`
4. **Validator**: إضافة `rejectScreeningSchema` للتحقق من `reject_reason`
5. **Routes**: إضافة validation middleware لـ reject endpoint
6. **Documentation**: تحديث التوثيق في `Overview.md` و `Endpoints.md`

---

## 🔍 تحليل الملفات المتأثرة

### الملفات التي تحتاج تعديل:
1. ✅ `backend/src/models/screening.model.js` - إضافة الحقول الجديدة
2. ✅ `backend/src/services/screening.service.js` - تعديل `rejectScreening`
3. ✅ `backend/src/controllers/screening.controller.js` - تعديل `reject`
4. ✅ `backend/src/validators/screening.validator.js` - إضافة schema للرفض
5. ✅ `backend/src/routes/screenings.routes.js` - إضافة validation
6. ✅ `backend/documents/Overview.md` - تحديث التوثيق
7. ✅ `backend/documents/Endpoints.md` - تحديث أمثلة API

### الملفات التي لن تتأثر:
- ✅ باقي Models/Services/Controllers - لا يحتاج تعديل
- ✅ Middlewares - لا يحتاج تعديل

---

## 📝 الخطوات التفصيلية

### الخطوة 1: تعديل Screening Model

**الملف**: `backend/src/models/screening.model.js`

**التغييرات المطلوبة**:

1. **إضافة `reject_reason`**:
   - نوع: `String`
   - غير مطلوب (optional)
   - يمكن أن يكون `null` أو `""`

2. **إضافة `reject_by`**:
   - نوع: `mongoose.Schema.Types.ObjectId`
   - مرجع: `ref: "User"`

**الكود الجديد**:
```javascript
const mongoose = require("mongoose");

const screeningSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    category_code: { type: String, enum: ["A", "B", "C", "D", "E", "F"], required: true },
    category_reason: { type: String, required: true },
    potential_negative: { type: String },
    potential_positive: { type: String },
    approved_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    recommendations: { type: String },
    reject_reason: { type: String },
    reject_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
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

module.exports = mongoose.model("Screening", screeningSchema);
```

**التحقق**:
- ✅ `reject_reason` أضيف كـ String
- ✅ `reject_by` أضيف كـ ObjectId مع ref إلى User
- ✅ كلا الحقلين optional (لا required)

---

### الخطوة 2: تعديل Screening Service

**الملف**: `backend/src/services/screening.service.js`

**التغييرات المطلوبة**:

1. **تعديل دالة `rejectScreening`**:
   - إضافة معامل `reject_reason` (اختياري)
   - حفظ `reject_reason` و `reject_by` في `updateData`
   - التأكد من populate `reject_by` في النتيجة

2. **تعديل دالة `setStatus`** (اختياري):
   - يمكن تعديلها لدعم `reject_reason` و `reject_by` بشكل عام
   - أو إبقاءها كما هي وتعديل `rejectScreening` فقط

**الكود الجديد**:
```javascript
const setStatus = async (id, status, approvedBy, recommendations = null, rejectReason = null) => {
  const updateData = {
    status,
    approved_by: approvedBy,
  };

  // إضافة recommendations فقط في حالة الموافقة
  if (status === "approved" && recommendations) {
    updateData.recommendations = recommendations;
  }

  // إضافة reject_reason و reject_by فقط في حالة الرفض
  if (status === "rejected") {
    updateData.reject_by = approvedBy; // في حالة الرفض، approvedBy هو reject_by
    if (rejectReason) {
      updateData.reject_reason = rejectReason;
    }
  }

  const updated = await Screening.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).populate("project approved_by reject_by");

  if (!updated) throw new ApiError(404, "Screening not found");
  return updated;
};

const approveScreening = async (id, approvedBy, recommendations) => {
  return setStatus(id, "approved", approvedBy, recommendations, null);
};

const rejectScreening = async (id, rejectBy, rejectReason = null) => {
  return setStatus(id, "rejected", rejectBy, null, rejectReason);
};
```

**أو بديل أبسط (بدون تعديل setStatus)**:
```javascript
const rejectScreening = async (id, rejectBy, rejectReason = null) => {
  const updateData = {
    status: "rejected",
    reject_by: rejectBy,
  };

  if (rejectReason) {
    updateData.reject_reason = rejectReason;
  }

  const updated = await Screening.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).populate("project approved_by reject_by");

  if (!updated) throw new ApiError(404, "Screening not found");
  return updated;
};
```

**التحقق**:
- ✅ `rejectScreening` يقبل `rejectReason`
- ✅ يتم حفظ `reject_by` و `reject_reason`
- ✅ يتم populate `reject_by` في النتيجة

---

### الخطوة 3: تعديل Screening Controller

**الملف**: `backend/src/controllers/screening.controller.js`

**التغييرات المطلوبة**:

1. **تعديل دالة `reject`**:
   - استقبال `reject_reason` من `req.body`
   - تمرير `reject_reason` إلى `service.rejectScreening`

**الكود الجديد**:
```javascript
exports.reject = asyncHandler(async (req, res) => {
  const { reject_reason } = req.body || {};
  const rejectBy = req.user._id;
  const data = await service.rejectScreening(
    req.params.id,
    rejectBy,
    reject_reason
  );
  res.json({ success: true, data });
});
```

**التحقق**:
- ✅ يستقبل `reject_reason` من body
- ✅ يمرر `reject_reason` إلى service
- ✅ يستخدم `req.user._id` كـ `reject_by`

---

### الخطوة 4: تعديل Screening Validator

**الملف**: `backend/src/validators/screening.validator.js`

**التغييرات المطلوبة**:

1. **إضافة `rejectScreeningSchema`**:
   - `reject_reason`: String (اختياري، يمكن أن يكون `""` أو `null`)

**الكود الجديد**:
```javascript
const Joi = require("joi");

const createScreeningSchema = Joi.object({
  project: Joi.string().required(),
  category_code: Joi.string().valid("A", "B", "C", "D", "E", "F").required(),
  category_reason: Joi.string().required(),
  potential_negative: Joi.string().allow("", null),
  potential_positive: Joi.string().allow("", null),
  approved_by: Joi.string().optional(),
  recommendations: Joi.string().allow("", null),
  screening_date: Joi.date().optional(),
  status: Joi.string().valid("draft", "submitted", "approved", "rejected").optional(),
});

const updateScreeningSchema = createScreeningSchema.fork(
  ["project", "category_code", "category_reason"],
  (schema) => schema.optional()
);

const approveScreeningSchema = Joi.object({
  recommendations: Joi.string().allow("", null).optional(),
});

const rejectScreeningSchema = Joi.object({
  reject_reason: Joi.string().allow("", null).optional(),
});

module.exports = {
  createScreeningSchema,
  updateScreeningSchema,
  approveScreeningSchema,
  rejectScreeningSchema,
};
```

**التحقق**:
- ✅ `rejectScreeningSchema` أضيف
- ✅ `reject_reason` اختياري ويمكن أن يكون `""` أو `null`

---

### الخطوة 5: تعديل Screening Routes

**الملف**: `backend/src/routes/screenings.routes.js`

**التغييرات المطلوبة**:

1. **إضافة validation middleware لـ reject endpoint**:
   - استيراد `rejectScreeningSchema`
   - إضافة `validate(rejectScreeningSchema)` قبل `controller.reject`

**الكود الجديد**:
```javascript
const express = require("express");
const controller = require("../controllers/screening.controller");
const validate = require("../middlewares/validate");
const {
  createScreeningSchema,
  updateScreeningSchema,
  approveScreeningSchema,
  rejectScreeningSchema,
} = require("../validators/screening.validator");
const { auth, requireRole } = require("../middlewares/auth");

const router = express.Router();

router.get("/", controller.getAll);
router.get("/:id", controller.getOne);
router.get("/project/:projectId", controller.getByProject);
router.post(
  "/",
  auth,
  requireRole("environmental_specialist", "program_manager", "project_manager"),
  validate(createScreeningSchema),
  controller.create
);
router.put(
  "/:id",
  auth,
  requireRole("environmental_specialist", "program_manager", "project_manager"),
  validate(updateScreeningSchema),
  controller.update
);
router.patch(
  "/:id/approve",
  auth,
  requireRole("environmental_specialist", "program_manager"),
  validate(approveScreeningSchema),
  controller.approve
);
router.patch(
  "/:id/reject",
  auth,
  requireRole("environmental_specialist", "program_manager"),
  validate(rejectScreeningSchema),
  controller.reject
);

module.exports = router;
```

**التحقق**:
- ✅ تم استيراد `rejectScreeningSchema`
- ✅ تم إضافة `validate(rejectScreeningSchema)` لـ reject route

---

### الخطوة 6: تحديث التوثيق - Overview.md

**الملف**: `backend/documents/Overview.md`

**التغييرات المطلوبة**:

1. **قسم "3. Screening Model (Tool 1)"** (السطر ~790):
   - إضافة `reject_reason` و `reject_by` في Schema

2. **قسم "Tool 1: Screening"** (السطر ~1229):
   - التأكد من أن التوثيق يشمل الحقول الجديدة

**التعديلات المقترحة**:

```markdown
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
    reject_reason: { type: String },
    reject_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
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
```

**ملاحظة في التوثيق**:
- `reject_reason`: سبب الرفض (نص حر، اختياري)
- `reject_by`: المستخدم الذي قام بالرفض (مرجع إلى User، يتم تعبئته تلقائياً من `req.user._id`)

---

### الخطوة 7: تحديث التوثيق - Endpoints.md

**الملف**: `backend/documents/Endpoints.md`

**التغييرات المطلوبة**:

1. **قسم "4) Tool 1: Screening"** (السطر ~131):
   - تحديث قسم `PATCH /api/v1/screenings/:id/reject` ليشمل `reject_reason` في body

**التعديلات المقترحة**:

```markdown
## 4) Tool 1: Screening

### POST `/api/v1/screenings`

- هيدر: Authorization (environmental_specialist / program_manager / project_manager)
- جسم مثال:

```json
{
  "project": "<PROJECT_ID>",
  "category_code": "A",
  "category_reason": "High environmental sensitivity",
  "potential_negative": "Dust",
  "potential_positive": "Job creation"
}
```

### GET `/api/v1/screenings` | `/api/v1/screenings/:id` | `/api/v1/screenings/project/:projectId`

- قراءة (مفتوحة).

### PUT `/api/v1/screenings/:id`

- نفس أدوار POST.

### PATCH `/api/v1/screenings/:id/approve`

- هيدر: Authorization (environmental_specialist / program_manager).
- جسم (اختياري):

```json
{
  "recommendations": "نص التوصيات"
}
```

### PATCH `/api/v1/screenings/:id/reject`

- هيدر: Authorization (environmental_specialist / program_manager).
- جسم (اختياري):

```json
{
  "reject_reason": "سبب الرفض - معلومات غير كافية"
}
```

**ملاحظات**:
- `reject_reason` اختياري (يمكن إرسال body فارغ)
- `reject_by` يتم تعبئته تلقائياً من المستخدم الحالي (`req.user._id`)
- في حالة الرفض، يتم حفظ `status = "rejected"` مع `reject_by` و `reject_reason` (إن وُجد)
```

---

## ✅ قائمة التحقق النهائية

### قبل التنفيذ:
- [x] فهم المتطلبات بشكل كامل
- [x] فحص جميع الملفات المتأثرة
- [x] فهم البنية الحالية للـ Screening

### أثناء التنفيذ:
- [ ] تعديل `screening.model.js` (إضافة الحقول)
- [ ] تعديل `screening.service.js` (تعديل `rejectScreening`)
- [ ] تعديل `screening.controller.js` (استقبال `reject_reason`)
- [ ] تعديل `screening.validator.js` (إضافة schema)
- [ ] تعديل `screenings.routes.js` (إضافة validation)
- [ ] تحديث `Overview.md`
- [ ] تحديث `Endpoints.md`

### بعد التنفيذ:
- [ ] اختبار رفض Screening مع `reject_reason`
- [ ] اختبار رفض Screening بدون `reject_reason`
- [ ] التحقق من حفظ `reject_by` تلقائياً
- [ ] التحقق من populate `reject_by` في Response
- [ ] التحقق من Response format
- [ ] مراجعة التوثيق

---

## 🧪 سيناريوهات الاختبار

### السيناريو 1: رفض مع سبب
- **Request**: `PATCH /api/v1/screenings/:id/reject`
  ```json
  {
    "reject_reason": "المعلومات المقدمة غير كافية لإجراء التقييم"
  }
  ```
- **Expected**: 
  - ✅ `status = "rejected"`
  - ✅ `reject_by` = User ID الحالي
  - ✅ `reject_reason` = النص المرسل
  - ✅ Response يحتوي على Screening مع `reject_by` populated

### السيناريو 2: رفض بدون سبب
- **Request**: `PATCH /api/v1/screenings/:id/reject`
  ```json
  {}
  ```
  أو بدون body
- **Expected**: 
  - ✅ `status = "rejected"`
  - ✅ `reject_by` = User ID الحالي
  - ✅ `reject_reason` = `null` أو غير موجود
  - ✅ لا يوجد خطأ validation

### السيناريو 3: رفض مع سبب فارغ
- **Request**: `PATCH /api/v1/screenings/:id/reject`
  ```json
  {
    "reject_reason": ""
  }
  ```
- **Expected**: 
  - ✅ `status = "rejected"`
  - ✅ `reject_by` = User ID الحالي
  - ✅ `reject_reason` = `""` أو `null`
  - ✅ لا يوجد خطأ validation

### السيناريو 4: التحقق من populate
- **Request**: `GET /api/v1/screenings/:id`
- **Expected**: 
  - ✅ Response يحتوي على `reject_by` كـ object مع بيانات User
  - ✅ Response يحتوي على `reject_reason` (إن وُجد)

---

## 📌 ملاحظات مهمة

### 1. التوافق مع البيانات الموجودة
- البيانات القديمة لن تحتوي على `reject_reason` و `reject_by`
- هذا لا يسبب مشاكل لأن الحقول optional
- عند الرفض الجديد، سيتم ملء الحقول

### 2. العلاقة مع `approved_by`
- `approved_by` يستخدم عند الموافقة
- `reject_by` يستخدم عند الرفض
- يمكن أن يكونا مختلفين أو نفس المستخدم (حسب الحالة)

### 3. Validation
- `reject_reason` اختياري تماماً
- يمكن أن يكون `null` أو `""` أو نص
- لا يوجد قيود على طول النص (يمكن إضافة لاحقاً إذا لزم الأمر)

### 4. Security
- `reject_by` يتم تعبئته تلقائياً من `req.user._id`
- لا يمكن للمستخدم تغيير `reject_by` يدوياً
- فقط المستخدمون المصرح لهم (`environmental_specialist`, `program_manager`) يمكنهم الرفض

### 5. API Response
- Response format سيتغير:
  - إضافة `reject_reason` (String أو null)
  - إضافة `reject_by` (ObjectId أو Object إذا تم populate)

---

## 🚨 نقاط حرجة يجب التحقق منها

### 1. Model Schema
- ✅ التأكد من إضافة الحقول بشكل صحيح
- ✅ التأكد من أن الحقول optional
- ✅ التأكد من `reject_by` ref إلى User

### 2. Service Logic
- ✅ التأكد من حفظ `reject_by` تلقائياً
- ✅ التأكد من حفظ `reject_reason` (إن وُجد)
- ✅ التأكد من populate `reject_by` في النتيجة

### 3. Controller
- ✅ التأكد من استقبال `reject_reason` من body
- ✅ التأكد من استخدام `req.user._id` كـ `reject_by`

### 4. Validator
- ✅ التأكد من أن `reject_reason` اختياري
- ✅ التأكد من قبول `""` و `null`

### 5. Routes
- ✅ التأكد من إضافة validation middleware
- ✅ التأكد من استيراد `rejectScreeningSchema`

### 6. Documentation
- ✅ تحديث Model Schema في Overview.md
- ✅ تحديث Endpoint documentation في Endpoints.md
- ✅ إضافة أمثلة واضحة

---

## 🚀 خطة التنفيذ

1. **المرحلة 1**: تعديل Model
   - إضافة `reject_reason` و `reject_by`

2. **المرحلة 2**: تعديل Service
   - تعديل `rejectScreening` لقبول `reject_reason`

3. **المرحلة 3**: تعديل Controller
   - استقبال `reject_reason` من body

4. **المرحلة 4**: تعديل Validator
   - إضافة `rejectScreeningSchema`

5. **المرحلة 5**: تعديل Routes
   - إضافة validation middleware

6. **المرحلة 6**: تحديث التوثيق
   - تحديث Overview.md
   - تحديث Endpoints.md

7. **المرحلة 7**: الاختبار والتحقق
   - اختبار جميع السيناريوهات
   - التحقق من Response format

---

## 📊 مقارنة قبل وبعد

### قبل التعديل:
```javascript
// Model
screeningSchema: {
  // ... باقي الحقول
  approved_by: ObjectId (ref User),
  recommendations: String,
  // لا يوجد reject_reason أو reject_by
}

// Service
rejectScreening: (id, approvedBy) => {
  // يحفظ status = "rejected" فقط
  // لا يحفظ reject_reason أو reject_by
}

// Controller
reject: (req, res) => {
  // لا يستقبل reject_reason من body
}

// Routes
PATCH /:id/reject: {
  // لا يوجد validation
}
```

### بعد التعديل:
```javascript
// Model
screeningSchema: {
  // ... باقي الحقول
  approved_by: ObjectId (ref User),
  recommendations: String,
  reject_reason: String,        // ✅ جديد
  reject_by: ObjectId (ref User), // ✅ جديد
}

// Service
rejectScreening: (id, rejectBy, rejectReason) => {
  // يحفظ status = "rejected"
  // يحفظ reject_by = rejectBy
  // يحفظ reject_reason = rejectReason (إن وُجد)
}

// Controller
reject: (req, res) => {
  // يستقبل reject_reason من body
  // يمرر reject_reason إلى service
}

// Routes
PATCH /:id/reject: {
  validate(rejectScreeningSchema), // ✅ جديد
  controller.reject
}
```

---

**آخر تحديث**: 2026-01-15  
**الحالة**: جاهز للتنفيذ ✅  
**ملاحظة**: هذا التعديل يضيف إمكانية تسجيل سبب الرفض والمسؤول عن الرفض في Screening
