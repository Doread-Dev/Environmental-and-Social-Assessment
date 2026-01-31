# خطة التعديل: تحديث طريقة حساب total_project_impact في Assessment

**التاريخ**: 2026-01-15  
**الهدف**: تعديل طريقة حساب `total_project_impact` لتخزين عدد كل مستوى بدلاً من رقم واحد، وتحديث منطق الحساب

---

## 📋 ملخص التعديل

### التغييرات المطلوبة:

1. **Model**: تحويل `total_project_score` من `Number` إلى `Object` يحتوي على عدد كل مستوى
2. **Model**: إضافة `negligible` و `not_applicable` إلى enum في `total_project_impact`
3. **Service**: تعديل دالة `calculateImpact` لحساب عدد كل مستوى وتحديد `total_project_impact` بناءً على أعلى عدد
4. **Validator**: تحديث validation schemas إذا لزم الأمر
5. **Documentation**: تحديث ملفات التوثيق

---

## 🔍 تحليل الملفات المتأثرة

### الملفات التي تحتاج تعديل:

1. ✅ `backend/src/models/assessment.model.js` - تعديل Schema
2. ✅ `backend/src/services/assessment.service.js` - تعديل منطق الحساب
3. ⚠️ `backend/src/validators/assessment.validator.js` - مراجعة (قد لا يحتاج تعديل)
4. ✅ `backend/documents/Overview.md` - تحديث التوثيق
5. ⚠️ `backend/documents/Endpoints.md` - مراجعة (قد لا يحتاج تعديل)

### الملفات التي لن تتأثر:

- ✅ `backend/src/controllers/assessment.controller.js` - لا يحتاج تعديل
- ✅ `backend/src/routes/assessments.routes.js` - لا يحتاج تعديل
- ✅ `backend/src/models/assessmentImpactScore.model.js` - لا يحتاج تعديل

---

## 📝 الخطوات التفصيلية

### الخطوة 1: تعديل Assessment Model

**الملف**: `backend/src/models/assessment.model.js`

**التغييرات**:

1. تحويل `total_project_score` من `Number` إلى `Object` مع Schema منفصل
2. تحديث enum في `total_project_impact` ليشمل `negligible` و `not_applicable`

**الكود الجديد**:

```javascript
// إضافة scoreSchema قبل assessmentSchema
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

// في assessmentSchema:
total_project_score: scoreCountSchema,
total_project_impact: {
  type: String,
  enum: ["negligible", "low", "medium", "high", "not_applicable"]
},
```

**التحقق**:

- ✅ Schema صحيح
- ✅ Default values = 0 لكل مستوى
- ✅ Enum محدث

---

### الخطوة 2: تعديل Assessment Service - دالة calculateImpact

**الملف**: `backend/src/services/assessment.service.js`

**التغييرات**:

1. إزالة `levelScore` object (لم يعد مطلوباً)
2. تعديل `calculateImpact` لحساب عدد كل مستوى
3. تحديث منطق تحديد `total_project_impact`:
   - حساب عدد كل مستوى من AssessmentImpactScore
   - تحديد أعلى عدد بين (negligible, low, medium, high)
   - في حالة التعادل: high > medium > low > negligible
   - not_applicable لا يُؤخذ بالحسبان إلا إذا كانت كل المستويات الأخرى = 0

**الكود الجديد**:

```javascript
const calculateImpact = async (assessmentId) => {
  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) throw new ApiError(404, "Assessment not found");

  const scores = await AssessmentImpactScore.find({ assessment: assessmentId });
  if (!scores.length) throw new ApiError(400, "No scores to calculate");

  // حساب عدد كل مستوى
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

  // فحص المستويات (بدون not_applicable)
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

  assessment.total_project_score = scoreCount;
  assessment.total_project_impact = maxLevel;
  assessment.is_complete = true;
  await assessment.save();

  return assessment;
};
```

**التحقق**:

- ✅ حساب عدد كل مستوى صحيح
- ✅ منطق تحديد الأعلى صحيح
- ✅ التعامل مع التعادل صحيح
- ✅ التعامل مع not_applicable صحيح

---

### الخطوة 3: مراجعة Validator

**الملف**: `backend/src/validators/assessment.validator.js`

**التحقق**:

- ✅ `createAssessmentSchema` و `updateAssessmentSchema` لا يحتويان على `total_project_score` أو `total_project_impact` (يتم حسابهما تلقائياً)
- ✅ لا حاجة لتعديل Validator

**ملاحظة**: إذا كان هناك أي endpoint يسمح بتحديث `total_project_score` أو `total_project_impact` يدوياً، يجب إضافة validation schema للـ object.

---

### الخطوة 4: تحديث التوثيق - Overview.md

**الملف**: `backend/documents/Overview.md`

**التغييرات المطلوبة**:

1. **قسم "4. Assessment Model (Tool 2)"** (السطر ~794):

   - تحديث Schema ليشمل `scoreCountSchema`
   - تحديث enum في `total_project_impact`

2. **قسم "حساب Total Project Score"** (السطر ~438):
   - تحديث الشرح ليعكس الطريقة الجديدة
   - تحديث مثال الكود

**التعديلات المقترحة**:

````markdown
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
    // ... باقي الحقول
    total_project_score: scoreCountSchema,
    total_project_impact: {
      type: String,
      enum: ["negligible", "low", "medium", "high", "not_applicable"],
    },
    // ... باقي الحقول
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
```
````

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

// في حالة التعادل، اختر الأعلى حسب الأولوية
const priority = { high: 4, medium: 3, low: 2, negligible: 1 };
// ... باقي المنطق
```

````

---

### الخطوة 5: مراجعة Endpoints.md

**الملف**: `backend/documents/Endpoints.md`

**التحقق**:
- ✅ لا يوجد تغيير في API endpoints
- ✅ Response format قد يتغير (سيحتوي على object بدلاً من number)
- ⚠️ قد نحتاج إضافة ملاحظة عن التغيير في Response

**إضافة مقترحة** (إذا لزم الأمر):
```markdown
### PATCH `/api/v1/assessments/:id/calculate`

- الناتج: `total_project_score` هو object يحتوي على عدد كل مستوى:
  ```json
  {
    "total_project_score": {
      "negligible": 0,
      "low": 4,
      "medium": 2,
      "high": 5,
      "not_applicable": 0
    },
    "total_project_impact": "high"
  }
````

```

---

## ✅ قائمة التحقق النهائية

### قبل التنفيذ:
- [x] فهم المتطلبات بشكل كامل
- [x] فحص جميع الملفات المتأثرة
- [x] فهم العلاقات بين الكيانات
- [x] فهم منطق الحساب الحالي

### أثناء التنفيذ:
- [x] تعديل `assessment.model.js`
- [x] تعديل `assessment.service.js`
- [x] مراجعة `assessment.validator.js`
- [x] تحديث `Overview.md`
- [x] مراجعة `Endpoints.md`

### بعد التنفيذ:
- [ ] اختبار إنشاء Assessment جديد
- [ ] اختبار إضافة Scores
- [ ] اختبار حساب Impact
- [ ] التحقق من Response format
- [ ] التحقق من التعامل مع التعادل
- [ ] التحقق من التعامل مع not_applicable
- [ ] مراجعة التوثيق

---

## 🧪 سيناريوهات الاختبار

### السيناريو 1: حساب عادي
- **Input**: 4 low, 5 high, 2 medium
- **Expected**:
  - `total_project_score`: `{ negligible: 0, low: 4, medium: 2, high: 5, not_applicable: 0 }`
  - `total_project_impact`: `"high"`

### السيناريو 2: تعادل
- **Input**: 3 medium, 3 high
- **Expected**:
  - `total_project_score`: `{ negligible: 0, low: 0, medium: 3, high: 3, not_applicable: 0 }`
  - `total_project_impact`: `"high"` (لأن high له أولوية أعلى)

### السيناريو 3: كل المستويات صفر + not_applicable
- **Input**: 5 not_applicable فقط
- **Expected**:
  - `total_project_score`: `{ negligible: 0, low: 0, medium: 0, high: 0, not_applicable: 5 }`
  - `total_project_impact`: `"not_applicable"`

### السيناريو 4: كل المستويات صفر بدون not_applicable
- **Input**: لا scores
- **Expected**:
  - `total_project_score`: `{ negligible: 0, low: 0, medium: 0, high: 0, not_applicable: 0 }`
  - `total_project_impact`: `"negligible"` (قيمة افتراضية)

---

## 📌 ملاحظات مهمة

1. **Backward Compatibility**: البيانات الموجودة في قاعدة البيانات قد تحتوي على `total_project_score` كـ Number. يجب التعامل مع هذا في migration script أو في الكود.

2. **Validation**: التأكد من أن `total_project_score` object يحتوي على جميع المفاتيح المطلوبة.

3. **Error Handling**: التأكد من معالجة جميع الحالات الطرفية (edge cases).

4. **Testing**: اختبار جميع السيناريوهات المذكورة أعلاه.

---

## 🚀 خطة التنفيذ

1. **المرحلة 1**: تعديل Model
2. **المرحلة 2**: تعديل Service
3. **المرحلة 3**: مراجعة Validator
4. **المرحلة 4**: تحديث التوثيق
5. **المرحلة 5**: الاختبار والتحقق

---

**آخر تحديث**: 2026-01-15
**الحالة**: جاهز للتنفيذ ✅
```
