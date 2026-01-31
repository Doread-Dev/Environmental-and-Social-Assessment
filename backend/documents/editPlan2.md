# خطة التعديل 2: تحويل MonitoringRecord إلى إدخال يدوي كامل

**التاريخ**: 2026-01-15  
**الهدف**: إزالة جميع منطق الحساب التلقائي من MonitoringRecord وتحويل جميع القيم الرقمية إلى نصية يدوية

---

## 📋 ملخص التعديل

### التغييرات المطلوبة:
1. **Model**: تحويل `scores` (baseline, Q1-Q4) من `Number` إلى `String`
2. **Model**: تحويل `total` من `Number` إلى `String`
3. **Model**: تحويل `final_assessment` من `enum` إلى `String` (نص حر)
4. **Model**: `ranking` يبقى `enum` لكن بدون حساب تلقائي
5. **Service**: حذف جميع منطق الحساب التلقائي من `updateQuarter`
6. **Validator**: تحديث schemas لقبول String بدلاً من Number
7. **Controller**: التأكد من استقبال البيانات يدوياً
8. **Documentation**: تحديث جميع التوثيق

---

## 🔍 تحليل الملفات المتأثرة

### الملفات التي تحتاج تعديل:
1. ✅ `backend/src/models/monitoringRecord.model.js` - تعديل Schema
2. ✅ `backend/src/services/monitoring.service.js` - حذف منطق الحساب
3. ✅ `backend/src/validators/monitoring.validator.js` - تحديث validation
4. ✅ `backend/src/controllers/monitoring.controller.js` - مراجعة (قد لا يحتاج تعديل)
5. ✅ `backend/src/routes/monitoring.routes.js` - مراجعة (قد لا يحتاج تعديل)
6. ✅ `backend/documents/Overview.md` - تحديث التوثيق
7. ✅ `backend/documents/Endpoints.md` - تحديث أمثلة API

### الملفات التي لن تتأثر:
- ✅ `backend/src/middlewares/*` - لا يحتاج تعديل
- ✅ `backend/src/utils/*` - لا يحتاج تعديل
- ✅ باقي Models/Services/Controllers - لا يحتاج تعديل

---

## 📝 الخطوات التفصيلية

### الخطوة 1: تعديل MonitoringRecord Model

**الملف**: `backend/src/models/monitoringRecord.model.js`

**التغييرات المطلوبة**:

1. **scoreSchema (السطر 3-12)**:
   - تحويل جميع الحقول من `Number` إلى `String`
   - إزالة أي قيود رقمية

2. **total (السطر 27)**:
   - تحويل من `Number` إلى `String`

3. **final_assessment (السطر 28-30)**:
   - إزالة `enum` constraint
   - تحويل إلى `String` عادي (نص حر)

4. **ranking (السطر 32-34)**:
   - يبقى `enum` كما هو (لا تغيير)
   - لكن لن يتم حسابه تلقائياً

**الكود الجديد**:
```javascript
const mongoose = require("mongoose");

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

module.exports = mongoose.model("MonitoringRecord", monitoringRecordSchema);
```

**التحقق**:
- ✅ جميع scores أصبحت String
- ✅ total أصبح String
- ✅ final_assessment أصبح String بدون enum
- ✅ ranking يبقى enum (لا تغيير)

---

### الخطوة 2: تعديل Monitoring Service - حذف منطق الحساب

**الملف**: `backend/src/services/monitoring.service.js`

**التغييرات المطلوبة**:

1. **دالة `updateQuarter` (السطر 25-45)**:
   - **حذف**: منطق حساب `total` التلقائي (السطر 36-41)
   - **الاحتفاظ**: التحقق من quarterKey validity
   - **الاحتفاظ**: تحديث قيمة quarter في scores
   - **التعديل**: قبول `value` كـ String بدلاً من Number

**الكود الجديد**:
```javascript
const updateQuarter = async (id, quarterKey, value) => {
  const record = await MonitoringRecord.findById(id);
  if (!record) throw new ApiError(404, "Monitoring record not found");

  if (!["baseline", "Q1", "Q2", "Q3", "Q4"].includes(quarterKey)) {
    throw new ApiError(400, "Invalid quarter key");
  }

  record.scores = record.scores || {};
  record.scores[quarterKey] = value; // value الآن String

  // ❌ حذف منطق حساب total التلقائي
  // لا يتم حساب total تلقائياً - سيتم إرساله من الفرونت

  await record.save();
  return record;
};
```

**التحقق**:
- ✅ تم حذف منطق حساب total
- ✅ value يقبل String
- ✅ لا يوجد أي حساب تلقائي

---

### الخطوة 3: تعديل Monitoring Validator

**الملف**: `backend/src/validators/monitoring.validator.js`

**التغييرات المطلوبة**:

1. **createMonitoringSchema**:
   - `scores.baseline`: من `Joi.number()` إلى `Joi.string()`
   - `scores.Q1-Q4`: من `Joi.number()` إلى `Joi.string()`
   - `total`: من `Joi.number()` إلى `Joi.string()`
   - `final_assessment`: إزالة `.valid()` constraint (نص حر)

2. **updateMonitoringSchema**:
   - نفس التغييرات (يستخدم نفس schema)

3. **updateQuarterSchema**:
   - `value`: من `Joi.number()` إلى `Joi.string()`

**الكود الجديد**:
```javascript
const Joi = require("joi");

const createMonitoringSchema = Joi.object({
  project: Joi.string().required(),
  indicator: Joi.string().required(),
  scores: Joi.object({
    baseline: Joi.string().allow("", null).optional(),
    Q1: Joi.string().allow("", null).optional(),
    Q2: Joi.string().allow("", null).optional(),
    Q3: Joi.string().allow("", null).optional(),
    Q4: Joi.string().allow("", null).optional(),
  }).optional(),
  total: Joi.string().allow("", null).optional(),
  final_assessment: Joi.string().allow("", null).optional(),
  ranking: Joi.string()
    .valid("negligible", "low", "medium", "high", "not_applicable")
    .optional(),
  responsible: Joi.string().optional(),
  note: Joi.string().allow("", null),
});

const updateMonitoringSchema = createMonitoringSchema;

const updateQuarterSchema = Joi.object({
  value: Joi.string().allow("", null).required(),
});

module.exports = {
  createMonitoringSchema,
  updateMonitoringSchema,
  updateQuarterSchema,
};
```

**التحقق**:
- ✅ جميع scores تقبل String
- ✅ total يقبل String
- ✅ final_assessment نص حر (لا enum)
- ✅ ranking يبقى enum
- ✅ updateQuarter يقبل String

---

### الخطوة 4: مراجعة Monitoring Controller

**الملف**: `backend/src/controllers/monitoring.controller.js`

**التحقق**:
- ✅ `create`: يستقبل البيانات من `req.body` مباشرة - لا يحتاج تعديل
- ✅ `update`: يستقبل البيانات من `req.body` مباشرة - لا يحتاج تعديل
- ✅ `updateQuarter`: يستقبل `value` من `req.body.value` - لا يحتاج تعديل (سيصبح String)

**النتيجة**: لا يحتاج تعديل ✅

---

### الخطوة 5: مراجعة Monitoring Routes

**الملف**: `backend/src/routes/monitoring.routes.js`

**التحقق**:
- ✅ جميع routes تستخدم validation middleware - سيتم تحديثها تلقائياً عبر validator
- ✅ لا يوجد منطق حساب في routes - لا يحتاج تعديل

**النتيجة**: لا يحتاج تعديل ✅

---

### الخطوة 6: تحديث التوثيق - Overview.md

**الملف**: `backend/documents/Overview.md`

**التغييرات المطلوبة**:

1. **قسم "11. MonitoringRecord Model (Tool 5)"** (السطر ~1025):
   - تحديث `scoreSchema` ليكون String
   - تحديث `total` ليكون String
   - تحديث `final_assessment` ليكون String بدون enum

2. **قسم "هيكل Scores Object"** (السطر ~589):
   - تحديث الشرح ليعكس أن القيم نصية

3. **قسم "حساب Total و Ranking"** (السطر ~601):
   - **حذف** أو **تحديث** الشرح ليعكس أن الحساب يدوي من الفرونت

**التعديلات المقترحة**:

```markdown
#### هيكل Scores Object

```javascript
scores: {
  baseline: string,  // قبل البدء (نص يدوي)
  Q1: string,        // الربع الأول (نص يدوي)
  Q2: string,        // الربع الثاني (نص يدوي)
  Q3: string,        // الربع الثالث (نص يدوي)
  Q4: string        // الربع الرابع (نص يدوي)
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
```

**تحديث Model Schema في التوثيق**:

```markdown
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
```

---

### الخطوة 7: تحديث التوثيق - Endpoints.md

**الملف**: `backend/documents/Endpoints.md`

**التغييرات المطلوبة**:

1. **قسم "6) Tool 5: Monitoring"** (السطر ~241):
   - تحديث أمثلة Request body لتعكس String values
   - إضافة ملاحظة أن جميع القيم يدوية

**التعديلات المقترحة**:

```markdown
## 6) Tool 5: Monitoring

### POST `/api/v1/monitoring`

- هيدر: Authorization (env_specialist / program_manager / project_manager)
- جسم مثال:

```json
{
  "project": "<PROJECT_ID>",
  "indicator": "<INDICATOR_ID>",
  "scores": { 
    "baseline": "قيمة يدوية", 
    "Q1": "قيمة يدوية",
    "Q2": "قيمة يدوية",
    "Q3": "قيمة يدوية",
    "Q4": "قيمة يدوية"
  },
  "total": "قيمة يدوية",
  "final_assessment": "تقييم نهائي نص حر",
  "ranking": "medium"
}
```

**ملاحظات**:
- جميع القيم في `scores` هي نصية (String) ويدوية
- `total` هو نص يدوي (لا يتم حسابه تلقائياً)
- `final_assessment` هو نص حر (لا enum)
- `ranking` هو enum محدد لكن يتم إرساله يدوياً

### PATCH `/api/v1/monitoring/:id/quarter/:q`

- أدوار: env_specialist / program_manager / project_manager / environmental_focal_point
- جسم:

```json
{ "value": "قيمة نصية يدوية" }
```

**ملاحظات**:
- `value` الآن نص (String) وليس رقم
- لا يتم حساب `total` تلقائياً بعد تحديث quarter
- يجب تحديث `total` يدوياً عبر PUT endpoint إذا لزم الأمر
```

---

## ✅ قائمة التحقق النهائية

### قبل التنفيذ:
- [ ] فهم المتطلبات بشكل كامل
- [ ] فحص جميع الملفات المتأثرة
- [ ] فهم منطق الحساب الحالي
- [ ] تحديد جميع المناطق التي تحتاج تعديل

### أثناء التنفيذ:
- [ ] تعديل `monitoringRecord.model.js`
- [ ] تعديل `monitoring.service.js` (حذف منطق الحساب)
- [ ] تعديل `monitoring.validator.js`
- [ ] مراجعة `monitoring.controller.js` (لا يحتاج تعديل)
- [ ] مراجعة `monitoring.routes.js` (لا يحتاج تعديل)
- [ ] تحديث `Overview.md`
- [ ] تحديث `Endpoints.md`

### بعد التنفيذ:
- [ ] اختبار إنشاء MonitoringRecord جديد بقيم نصية
- [ ] اختبار تحديث quarter بقيمة نصية
- [ ] اختبار إرسال final_assessment كنص حر
- [ ] اختبار إرسال ranking يدوياً
- [ ] التحقق من عدم وجود حساب تلقائي
- [ ] التحقق من Response format
- [ ] مراجعة التوثيق

---

## 🧪 سيناريوهات الاختبار

### السيناريو 1: إنشاء MonitoringRecord جديد
- **Request**:
  ```json
  {
    "project": "...",
    "indicator": "...",
    "scores": {
      "baseline": "قيمة أولية",
      "Q1": "ربع أول"
    },
    "total": "المجموع الكلي",
    "final_assessment": "تقييم نهائي مخصص",
    "ranking": "medium"
  }
  ```
- **Expected**: 
  - ✅ يتم حفظ جميع القيم كما هي (نصية)
  - ✅ لا يوجد حساب تلقائي
  - ✅ final_assessment يقبل أي نص

### السيناريو 2: تحديث Quarter
- **Request**: `PATCH /api/v1/monitoring/:id/quarter/Q2`
  ```json
  { "value": "قيمة جديدة للربع الثاني" }
  ```
- **Expected**: 
  - ✅ يتم تحديث Q2 بالقيمة النصية
  - ✅ لا يتم حساب total تلقائياً
  - ✅ total يبقى كما هو (أو يجب تحديثه يدوياً)

### السيناريو 3: final_assessment كنص حر
- **Request**: `PUT /api/v1/monitoring/:id`
  ```json
  {
    "final_assessment": "هذا تقييم مخصص طويل جداً يمكن أن يحتوي على أي نص يريده المستخدم"
  }
  ```
- **Expected**: 
  - ✅ يتم حفظ النص كما هو
  - ✅ لا يوجد validation على enum

### السيناريو 4: ranking يدوي
- **Request**: `PUT /api/v1/monitoring/:id`
  ```json
  {
    "ranking": "high"
  }
  ```
- **Expected**: 
  - ✅ يتم التحقق من enum (يجب أن يكون من القيم المحددة)
  - ✅ لا يتم حسابه تلقائياً

---

## 📌 ملاحظات مهمة

### 1. Backward Compatibility
- البيانات الموجودة في قاعدة البيانات قد تحتوي على `scores` و `total` كـ Number
- يجب التعامل مع هذا في migration script أو في الكود
- **خيار 1**: Migration script لتحويل Number إلى String
- **خيار 2**: التعامل مع كلا النوعين في الكود (Number و String) مؤقتاً

### 2. Validation
- التأكد من أن `scores` object يقبل String values
- التأكد من أن `total` يقبل String
- التأكد من أن `final_assessment` يقبل أي نص (لا validation)
- التأكد من أن `ranking` يبقى enum validation

### 3. API Response
- Response format سيتغير:
  - `scores.baseline`: String بدلاً من Number
  - `total`: String بدلاً من Number
  - `final_assessment`: String (بدون قيود enum)

### 4. Frontend Integration
- يجب تحديث Frontend ليرسل:
  - جميع scores كـ String
  - total كـ String
  - final_assessment كنص حر
  - ranking يدوياً (من enum)

### 5. Endpoint `/quarter/:q`
- **قبل**: كان يقبل Number ويحسب total تلقائياً
- **بعد**: يقبل String ولا يحسب total
- **ملاحظة**: قد نحتاج إضافة endpoint منفصل لتحديث `total` يدوياً، أو يمكن استخدام PUT endpoint

---

## 🚨 نقاط حرجة يجب التحقق منها

### 1. حذف منطق الحساب
- ✅ التأكد من حذف جميع منطق حساب `total` من `updateQuarter`
- ✅ التأكد من عدم وجود أي حساب تلقائي في أي مكان آخر

### 2. Validator Updates
- ✅ التأكد من تحديث جميع schemas
- ✅ التأكد من أن `updateQuarterSchema` يقبل String

### 3. Model Schema
- ✅ التأكد من تحويل جميع Number إلى String
- ✅ التأكد من إزالة enum من `final_assessment`
- ✅ التأكد من بقاء enum في `ranking`

### 4. Documentation
- ✅ تحديث جميع الأمثلة في التوثيق
- ✅ إضافة ملاحظات عن التغييرات
- ✅ توضيح أن الحساب يدوي من الفرونت

---

## 🚀 خطة التنفيذ

1. **المرحلة 1**: تعديل Model
   - تحويل scores إلى String
   - تحويل total إلى String
   - تحويل final_assessment إلى String بدون enum
   - التأكد من بقاء ranking enum

2. **المرحلة 2**: تعديل Service
   - حذف منطق حساب total من updateQuarter
   - تحديث updateQuarter لقبول String

3. **المرحلة 3**: تعديل Validator
   - تحديث createMonitoringSchema
   - تحديث updateMonitoringSchema
   - تحديث updateQuarterSchema

4. **المرحلة 4**: مراجعة Controller و Routes
   - التحقق من عدم الحاجة لتعديلات

5. **المرحلة 5**: تحديث التوثيق
   - تحديث Overview.md
   - تحديث Endpoints.md

6. **المرحلة 6**: الاختبار والتحقق
   - اختبار جميع السيناريوهات
   - التحقق من عدم وجود حساب تلقائي

---

## 📊 مقارنة قبل وبعد

### قبل التعديل:
```javascript
// Model
scores: { baseline: Number, Q1: Number, ... }
total: Number
final_assessment: enum
ranking: enum (محسوب تلقائياً في بعض الحالات)

// Service
updateQuarter: يحسب total تلقائياً

// Validator
scores: Joi.number()
total: Joi.number()
final_assessment: Joi.string().valid(...)
```

### بعد التعديل:
```javascript
// Model
scores: { baseline: String, Q1: String, ... }
total: String
final_assessment: String (نص حر)
ranking: enum (يدوي فقط)

// Service
updateQuarter: لا يحسب total (يدوي فقط)

// Validator
scores: Joi.string()
total: Joi.string()
final_assessment: Joi.string() (لا enum)
```

---

**آخر تحديث**: 2026-01-15  
**الحالة**: جاهز للتنفيذ ✅  
**ملاحظة**: هذا التعديل يجعل MonitoringRecord يعتمد كلياً على الإدخال اليدوي من الفرونت
