# خطة التعديل #5: إضافة reject_reason و reject_by لـ Assessment Model

**التاريخ**: 28 يناير 2026  
**المطور المسؤول**: Senior Backend Developer  
**الأولوية**: متوسطة  
**التعقيد**: منخفض  
**الوقت المتوقع**: 30-45 دقيقة

---

## 📋 نظرة عامة على التعديل

### الهدف
إضافة حقلين جديدين لـ `Assessment Model` لتسجيل معلومات الرفض:
- `reject_reason`: نص يوضح سبب الرفض
- `reject_by`: معرف المستخدم الذي قام بالرفض

### السبب
- **التوحيد**: جعل سلوك Assessment مطابقاً تماماً لـ Screening
- **الوضوح**: الفصل بين `approved_by` (للموافقة) و `reject_by` (للرفض)
- **التتبع**: معرفة من قام بالرفض ولماذا

### المرجع
- نفس النمط المستخدم في `Screening Model` (lines 12-13 في screening.model.js)
- نفس النمط المستخدم في `screening.service.js` (lines 34-62)

---

## 🔍 تحليل الوضع الحالي

### ❌ المشكلة الحالية

```javascript
// assessment.service.js - Line 132-134
const rejectAssessment = async (id, approvedBy) => {
  return setStatus(id, "rejected", approvedBy, null);
};

// assessment.service.js - Line 108-126
const setStatus = async (id, status, approvedBy, recommendations = null) => {
  const updateData = {
    status,
    approved_by: approvedBy,  // ❌ يتم تسجيل approved_by حتى في حالة الرفض!
  };

  if (status === "approved" && recommendations) {
    updateData.recommendations = recommendations;
  }
  // ❌ لا يوجد معالجة لحالة الرفض
  // ❌ لا يوجد reject_reason
  // ❌ لا يوجد reject_by
};
```

### ✅ السلوك المطلوب (كما في Screening)

```javascript
// screening.service.js - Line 34-62
const setStatus = async (id, status, approvedBy, recommendations = null, rejectReason = null) => {
  const updateData = { status };

  // في حالة الموافقة
  if (status === "approved") {
    updateData.approved_by = approvedBy;
    if (recommendations) {
      updateData.recommendations = recommendations;
    }
  }

  // في حالة الرفض
  if (status === "rejected") {
    updateData.reject_by = approvedBy;  // ✅ reject_by وليس approved_by
    if (rejectReason) {
      updateData.reject_reason = rejectReason;
    }
  }
};
```

---

## 📊 الملفات المتأثرة

### ملفات يجب تعديلها (5 ملفات)

| # | الملف | السبب | التعقيد |
|---|-------|-------|---------|
| 1 | `src/models/assessment.model.js` | إضافة الحقول الجديدة | منخفض |
| 2 | `src/services/assessment.service.js` | تعديل منطق setStatus و rejectAssessment | متوسط |
| 3 | `src/controllers/assessment.controller.js` | استخراج reject_reason من req.body | منخفض |
| 4 | `src/validators/assessment.validator.js` | إضافة rejectAssessmentSchema | منخفض |
| 5 | `src/routes/assessments.routes.js` | إضافة validation للـ reject endpoint | منخفض |

### ملفات للمراجعة فقط (لا تحتاج تعديل)

- `src/models/screening.model.js` - للمقارنة والتأكد من التطابق
- `src/services/screening.service.js` - للمقارنة والتأكد من التطابق
- `backend/documents/Overview.md` - قد يحتاج تحديث في المستقبل

---

## 🎯 خطة التنفيذ التفصيلية

### المرحلة 1️⃣: تعديل Model (assessment.model.js)

#### الخطوة 1.1: إضافة الحقول الجديدة

**الموقع**: `src/models/assessment.model.js` - بعد السطر 42

**التعديل**:
```javascript
// BEFORE (Lines 41-42)
approved_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
recommendations: { type: String },

// AFTER
approved_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
recommendations: { type: String },
reject_reason: { type: String },
reject_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
```

**الأسباب**:
- ✅ نفس النمط المستخدم في Screening Model
- ✅ كلاهما optional (ليس required) لأنهما يُستخدمان فقط عند الرفض
- ✅ reject_by هو reference لـ User Model

**التحذيرات**:
- ⚠️ تأكد من إضافة الحقول بعد `recommendations` وقبل `status`
- ⚠️ لا تنسَ الفاصلة (comma) بعد كل سطر

---

### المرحلة 2️⃣: تعديل Service (assessment.service.js)

#### الخطوة 2.1: تعديل دالة setStatus

**الموقع**: `src/services/assessment.service.js` - Lines 108-126

**التعديل الكامل**:
```javascript
// BEFORE
const setStatus = async (id, status, approvedBy, recommendations = null) => {
  const updateData = {
    status,
    approved_by: approvedBy,
  };

  // إضافة recommendations فقط في حالة الموافقة
  if (status === "approved" && recommendations) {
    updateData.recommendations = recommendations;
  }

  const updated = await Assessment.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).populate("project officer approved_by");

  if (!updated) throw new ApiError(404, "Assessment not found");
  return updated;
};

// AFTER
const setStatus = async (id, status, approvedBy, recommendations = null, rejectReason = null) => {
  const updateData = {
    status,
  };

  // في حالة الموافقة: تسجيل approved_by و recommendations
  if (status === "approved") {
    updateData.approved_by = approvedBy;
    if (recommendations) {
      updateData.recommendations = recommendations;
    }
  }

  // في حالة الرفض: تسجيل reject_by و reject_reason فقط
  if (status === "rejected") {
    updateData.reject_by = approvedBy;
    if (rejectReason) {
      updateData.reject_reason = rejectReason;
    }
  }

  const updated = await Assessment.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).populate("project officer approved_by reject_by");

  if (!updated) throw new ApiError(404, "Assessment not found");
  return updated;
};
```

**التغييرات الرئيسية**:
1. ✅ إضافة parameter جديد: `rejectReason = null`
2. ✅ تغيير `updateData` من `{ status, approved_by: approvedBy }` إلى `{ status }` فقط
3. ✅ إضافة شرط `if (status === "approved")` لتسجيل approved_by
4. ✅ إضافة شرط `if (status === "rejected")` لتسجيل reject_by و reject_reason
5. ✅ إضافة `reject_by` إلى `.populate()`

**الأسباب**:
- ✅ الآن لن يتم تسجيل `approved_by` في حالة الرفض
- ✅ سيتم تسجيل `reject_by` فقط في حالة الرفض
- ✅ مطابق تماماً لـ screening.service.js

#### الخطوة 2.2: تعديل دالة rejectAssessment

**الموقع**: `src/services/assessment.service.js` - Lines 132-134

**التعديل**:
```javascript
// BEFORE
const rejectAssessment = async (id, approvedBy) => {
  return setStatus(id, "rejected", approvedBy, null);
};

// AFTER
const rejectAssessment = async (id, rejectBy, rejectReason = null) => {
  return setStatus(id, "rejected", rejectBy, null, rejectReason);
};
```

**التغييرات الرئيسية**:
1. ✅ تغيير اسم parameter من `approvedBy` إلى `rejectBy` (للوضوح)
2. ✅ إضافة parameter جديد: `rejectReason = null`
3. ✅ تمرير `rejectReason` كـ parameter خامس لـ setStatus

**الأسباب**:
- ✅ الوضوح: `rejectBy` أوضح من `approvedBy` في سياق الرفض
- ✅ مطابق تماماً لـ screening.service.js (line 68-70)

#### الخطوة 2.3: تحديث populate في الدوال الأخرى

**الموقع**: `src/services/assessment.service.js`

**التعديلات**:

1. **listAssessments** (Lines 7-10):
```javascript
// BEFORE
const listAssessments = async () =>
  Assessment.find()
    .populate("project officer approved_by")
    .sort({ createdAt: -1 });

// AFTER
const listAssessments = async () =>
  Assessment.find()
    .populate("project officer approved_by reject_by")
    .sort({ createdAt: -1 });
```

2. **getAssessment** (Lines 12-18):
```javascript
// BEFORE
const getAssessment = async (id) => {
  const assessment = await Assessment.findById(id).populate(
    "project officer approved_by"
  );
  if (!assessment) throw new ApiError(404, "Assessment not found");
  return assessment;
};

// AFTER
const getAssessment = async (id) => {
  const assessment = await Assessment.findById(id).populate(
    "project officer approved_by reject_by"
  );
  if (!assessment) throw new ApiError(404, "Assessment not found");
  return assessment;
};
```

3. **getByProject** (Lines 20-26):
```javascript
// BEFORE
const getByProject = async (projectId) => {
  const assessment = await Assessment.findOne({ project: projectId }).populate(
    "project officer approved_by"
  );
  if (!assessment) throw new ApiError(404, "Assessment not found for project");
  return assessment;
};

// AFTER
const getByProject = async (projectId) => {
  const assessment = await Assessment.findOne({ project: projectId }).populate(
    "project officer approved_by reject_by"
  );
  if (!assessment) throw new ApiError(404, "Assessment not found for project");
  return assessment;
};
```

**السبب**:
- ✅ عند جلب Assessment، نريد أن نحصل على بيانات `reject_by` أيضاً (إذا كان موجوداً)

---

### المرحلة 3️⃣: تعديل Controller (assessment.controller.js)

#### الخطوة 3.1: تعديل دالة reject

**الموقع**: `src/controllers/assessment.controller.js` - Lines 60-64

**التعديل**:
```javascript
// BEFORE
exports.reject = asyncHandler(async (req, res) => {
  const approvedBy = req.user._id;
  const data = await service.rejectAssessment(req.params.id, approvedBy);
  res.json({ success: true, data });
});

// AFTER
exports.reject = asyncHandler(async (req, res) => {
  const { reject_reason } = req.body || {};
  const rejectBy = req.user._id;
  const data = await service.rejectAssessment(
    req.params.id,
    rejectBy,
    reject_reason
  );
  res.json({ success: true, data });
});
```

**التغييرات الرئيسية**:
1. ✅ استخراج `reject_reason` من `req.body`
2. ✅ تغيير اسم المتغير من `approvedBy` إلى `rejectBy`
3. ✅ تمرير `reject_reason` كـ parameter ثالث

**الأسباب**:
- ✅ مطابق تماماً لـ screening.controller.js (lines 40-49)
- ✅ الآن يمكن للمستخدم إرسال `reject_reason` في الـ request body

---

### المرحلة 4️⃣: تعديل Validator (assessment.validator.js)

#### الخطوة 4.1: إضافة rejectAssessmentSchema

**الموقع**: `src/validators/assessment.validator.js` - بعد Line 49

**التعديل**:
```javascript
// BEFORE (Line 47-49)
const approveAssessmentSchema = Joi.object({
  recommendations: Joi.string().allow("", null).optional(),
});

module.exports = {
  createAssessmentSchema,
  updateAssessmentSchema,
  addMethodSchema,
  addConsultationSchema,
  addScoresSchema,
  approveAssessmentSchema,
};

// AFTER
const approveAssessmentSchema = Joi.object({
  recommendations: Joi.string().allow("", null).optional(),
});

const rejectAssessmentSchema = Joi.object({
  reject_reason: Joi.string().allow("", null).optional(),
});

module.exports = {
  createAssessmentSchema,
  updateAssessmentSchema,
  addMethodSchema,
  addConsultationSchema,
  addScoresSchema,
  approveAssessmentSchema,
  rejectAssessmentSchema,
};
```

**التغييرات الرئيسية**:
1. ✅ إضافة `rejectAssessmentSchema` جديد
2. ✅ إضافة `rejectAssessmentSchema` إلى module.exports

**الأسباب**:
- ✅ مطابق تماماً لـ screening.validator.js (lines 24-26)
- ✅ التحقق من أن `reject_reason` (إذا أُرسل) هو string

---

### المرحلة 5️⃣: تعديل Routes (assessments.routes.js)

#### الخطوة 5.1: إضافة validation للـ reject endpoint

**الموقع**: `src/routes/assessments.routes.js` - Lines 4-11 و 67-72

**التعديل**:

1. **إضافة import** (Lines 4-11):
```javascript
// BEFORE
const {
  createAssessmentSchema,
  updateAssessmentSchema,
  addMethodSchema,
  addConsultationSchema,
  addScoresSchema,
  approveAssessmentSchema,
} = require("../validators/assessment.validator");

// AFTER
const {
  createAssessmentSchema,
  updateAssessmentSchema,
  addMethodSchema,
  addConsultationSchema,
  addScoresSchema,
  approveAssessmentSchema,
  rejectAssessmentSchema,
} = require("../validators/assessment.validator");
```

2. **إضافة validation للـ route** (Lines 67-72):
```javascript
// BEFORE
router.patch(
  "/:id/reject",
  auth,
  requireRole("environmental_specialist", "program_manager"),
  controller.reject
);

// AFTER
router.patch(
  "/:id/reject",
  auth,
  requireRole("environmental_specialist", "program_manager"),
  validate(rejectAssessmentSchema),
  controller.reject
);
```

**التغييرات الرئيسية**:
1. ✅ إضافة `rejectAssessmentSchema` إلى الـ imports
2. ✅ إضافة `validate(rejectAssessmentSchema)` middleware قبل `controller.reject`

**الأسباب**:
- ✅ مطابق تماماً لـ screenings.routes.js (lines 38-44)
- ✅ التحقق من البيانات قبل الوصول للـ Controller

---

## ✅ قائمة التحقق النهائية (Checklist)

### قبل التنفيذ
- [ ] قراءة الخطة كاملة
- [ ] فهم التغييرات المطلوبة
- [ ] التأكد من عدم وجود تعديلات أخرى قيد التنفيذ

### أثناء التنفيذ
- [ ] تعديل `assessment.model.js` - إضافة reject_reason و reject_by
- [ ] تعديل `assessment.service.js` - setStatus
- [ ] تعديل `assessment.service.js` - rejectAssessment
- [ ] تعديل `assessment.service.js` - populate في جميع الدوال
- [ ] تعديل `assessment.controller.js` - reject
- [ ] تعديل `assessment.validator.js` - إضافة rejectAssessmentSchema
- [ ] تعديل `assessments.routes.js` - import و validation

### بعد التنفيذ
- [ ] مراجعة الكود للتأكد من عدم وجود أخطاء syntax
- [ ] التأكد من أن Server يعمل بدون أخطاء
- [ ] اختبار الـ endpoint باستخدام Postman أو curl

---

## 🧪 خطة الاختبار

### الاختبار 1: رفض Assessment مع reject_reason

**Request**:
```http
PATCH /api/v1/assessments/:id/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "reject_reason": "البيانات غير كافية للتقييم"
}
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "status": "rejected",
    "reject_by": {
      "_id": "...",
      "name": "...",
      "email": "..."
    },
    "reject_reason": "البيانات غير كافية للتقييم",
    "approved_by": null,
    "recommendations": null
  }
}
```

**التحقق**:
- ✅ `status` = "rejected"
- ✅ `reject_by` موجود ويحتوي على بيانات المستخدم
- ✅ `reject_reason` موجود ويحتوي على النص المُرسل
- ✅ `approved_by` = null (لم يتم تسجيله)
- ✅ `recommendations` = null

### الاختبار 2: رفض Assessment بدون reject_reason

**Request**:
```http
PATCH /api/v1/assessments/:id/reject
Authorization: Bearer <token>
Content-Type: application/json

{}
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "status": "rejected",
    "reject_by": {
      "_id": "...",
      "name": "...",
      "email": "..."
    },
    "reject_reason": null,
    "approved_by": null
  }
}
```

**التحقق**:
- ✅ يعمل بدون أخطاء حتى بدون `reject_reason`
- ✅ `reject_by` موجود
- ✅ `reject_reason` = null

### الاختبار 3: الموافقة على Assessment (للتأكد من عدم التأثير)

**Request**:
```http
PATCH /api/v1/assessments/:id/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "recommendations": "موافق مع بعض التوصيات"
}
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "status": "approved",
    "approved_by": {
      "_id": "...",
      "name": "...",
      "email": "..."
    },
    "recommendations": "موافق مع بعض التوصيات",
    "reject_by": null,
    "reject_reason": null
  }
}
```

**التحقق**:
- ✅ `status` = "approved"
- ✅ `approved_by` موجود
- ✅ `recommendations` موجود
- ✅ `reject_by` = null (لم يتم تسجيله)
- ✅ `reject_reason` = null

### الاختبار 4: جلب Assessment بعد الرفض

**Request**:
```http
GET /api/v1/assessments/:id
Authorization: Bearer <token>
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "status": "rejected",
    "reject_by": {
      "_id": "...",
      "name": "...",
      "email": "..."
    },
    "reject_reason": "...",
    "approved_by": null
  }
}
```

**التحقق**:
- ✅ `reject_by` تم populate بشكل صحيح
- ✅ جميع البيانات موجودة

---

## ⚠️ التحذيرات والاحتياطات

### 1. Database Migration
- ⚠️ **لا يوجد migration مطلوب** لأن الحقول الجديدة optional
- ✅ الـ Documents الموجودة ستعمل بشكل طبيعي
- ✅ الحقول الجديدة ستكون `null` أو `undefined` للـ Documents القديمة

### 2. Backward Compatibility
- ✅ **متوافق تماماً** مع الكود الموجود
- ✅ الـ Frontend الحالي سيعمل بدون تعديلات
- ✅ يمكن تحديث الـ Frontend لاحقاً لعرض `reject_by` و `reject_reason`

### 3. التأثير على الأدوار (Roles)
- ✅ **لا يوجد تأثير** على الصلاحيات
- ✅ نفس الأدوار التي تستطيع الرفض الآن ستستطيع الرفض بعد التعديل

### 4. التأثير على الـ Reports
- ⚠️ قد تحتاج الـ Reports لتحديث لعرض `reject_by` و `reject_reason`
- ℹ️ هذا تحديث اختياري ويمكن تأجيله

### 5. الأخطاء المحتملة
- ❌ **نسيان الفاصلة (comma)** بعد إضافة الحقول في Model
- ❌ **نسيان إضافة reject_by إلى populate** في جميع الدوال
- ❌ **استخدام approved_by بدلاً من reject_by** في حالة الرفض
- ❌ **نسيان إضافة rejectAssessmentSchema إلى module.exports**

---

## 📝 ملاحظات إضافية

### 1. التوافق مع Screening
بعد هذا التعديل، سيكون Assessment مطابقاً تماماً لـ Screening في:
- ✅ وجود `reject_reason` و `reject_by`
- ✅ الفصل بين `approved_by` (للموافقة) و `reject_by` (للرفض)
- ✅ نفس منطق `setStatus` في Service
- ✅ نفس بنية Controller و Validator و Routes

### 2. الفوائد
- ✅ **الوضوح**: معرفة من رفض ولماذا
- ✅ **التتبع**: Audit trail كامل
- ✅ **التوحيد**: نفس النمط في جميع الأدوات
- ✅ **المرونة**: يمكن إضافة `reject_reason` أو تركه فارغاً


---

## 🎯 الخلاصة

### ما سيتم تعديله
1. ✅ إضافة حقلين جديدين في Model
2. ✅ تعديل منطق setStatus في Service
3. ✅ تعديل rejectAssessment في Service
4. ✅ تحديث populate في جميع دوال Service
5. ✅ تعديل reject في Controller
6. ✅ إضافة rejectAssessmentSchema في Validator
7. ✅ إضافة validation في Routes

### ما لن يتأثر
- ✅ الـ Database الموجودة
- ✅ الـ Frontend الحالي
- ✅ الصلاحيات والأدوار
- ✅ باقي الـ Endpoints

### النتيجة النهائية
بعد هذا التعديل، عند رفض Assessment:
- ✅ سيتم تسجيل `reject_by` (وليس `approved_by`)
- ✅ سيتم تسجيل `reject_reason` (إذا أُرسل)
- ✅ سيكون السلوك مطابقاً تماماً لـ Screening

---

**تاريخ الإنشاء**: 28 يناير 2026  
**الحالة**: جاهز للتنفيذ ✅  
**المراجع**: Senior Backend Developer (20 سنة خبرة)
