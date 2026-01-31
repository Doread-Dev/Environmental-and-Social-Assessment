# خطة التعديل 3: أولوية مستوى التأثير في `total_project_impact` (Assessment)

**التاريخ**: 2026-01-15  
**الهدف**: الإبقاء على تخزين عدد كل مستوى في `total_project_score`، مع تعديل منطق حساب `total_project_impact` بحيث يعتمد على أولوية الفئة (High > Medium > Low > Negligible > N/A) بغضّ النظر عن عدد النقاط في كل فئة، مع تحديث التوثيق.

---

## 📋 ملخص التعديل

### المطلوب منطقياً:
- **تخزين النقاط**:
  - لكل `AssessmentImpactScore` يتم زيادة عدّاد المستوى المحدد في `total_project_score` داخل `Assessment`.
  - مثال:  
    - 40 من المستوى `low`  
    - 5 من المستوى `high`  
    - 20 من المستوى `medium`  
    - 50 من المستوى `negligible`  
    - 70 من المستوى `not_applicable`  
  - يتم تخزينها في `Assessment.total_project_score` ككائن:
    - `{ negligible: 50, low: 40, medium: 20, high: 5, not_applicable: 70 }`

- **حساب `total_project_impact`**:
  - لا تهم قيمة العدّادات للمقارنة بين المستويات.
  - المنطق:  
    - إذا كان هناك أي `score` (عدد > 0) للمستوى `high` → `total_project_impact = "high"`.  
    - وإلا إذا كان هناك أي `medium` → `total_project_impact = "medium"`.  
    - وإلا إذا كان هناك أي `low` → `total_project_impact = "low"`.  
    - وإلا إذا كان هناك أي `negligible` → `total_project_impact = "negligible"`.  
    - وإلا إذا كان هناك أي `not_applicable` → `total_project_impact = "not_applicable"`.  
    - وإلا (لا توجد بيانات إطلاقاً) يمكن استخدام قيمة افتراضية (مثلاً `not_applicable` أو تركها فارغة حسب قرار نهائي).
  - النتيجة في المثال السابق يجب أن تكون: **`high`** (لأن وجود 5 high يكفي لتغليب هذا المستوى حتى لو كان أقل عدداً من غيره).

---

## 🔍 تحليل الوضع الحالي (قبل التعديل)

### 1. Model: `backend/src/models/assessment.model.js`
```startLine:endLine:backend/src/models/assessment.model.js
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
    // ...
    total_project_score: scoreCountSchema,
    total_project_impact: {
      type: String,
      enum: ["negligible", "low", "medium", "high", "not_applicable"],
    },
    is_complete: { type: Boolean, default: false },
    // ...
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
```

- ✅ النموذج جاهز بالفعل لتخزين عدّاد لكل مستوى في `total_project_score`.
- ✅ `total_project_impact` يدعم كل المستويات المطلوبة.
- ✅ لا حاجة لتعديل الـ Schema في هذه الخطة، فقط المنطق في الـ Service والتوثيق.

### 2. Service: `backend/src/services/assessment.service.js`
```startLine:endLine:backend/src/services/assessment.service.js
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

- ✅ الكود الحالي يحسب `scoreCount` كما نريد (عدد لكل مستوى).
- ❌ منطق اختيار `total_project_impact` يعتمد حالياً على:
  - أعلى **عدد** (maxCount).
  - ثم في حالة التعادل فقط يستخدم أولوية المستويات.
  - يأخذ `not_applicable` فقط في حال كانت المستويات الأخرى = 0.
- المطلوب: **تجاهل المقارنة بعدد النقاط بالكامل**، والاكتفاء بأولوية الفئة (وجود أي نقطة يكفي).

### 3. التوثيق: `backend/documents/Overview.md`
```startLine:endLine:backend/documents/Overview.md
// المقتطف الحالي يشرح منطق "أعلى عدد" + التعادل:
// حساب عدد كل مستوى من AssessmentImpactScore
const scoreCount = {
  negligible: 0,
  low: 0,
  medium: 0,
  high: 0,
  not_applicable: 0,
};

// ...
// تحديد total_project_impact بناءً على أعلى عدد
// أولوية: high > medium > low > negligible
// not_applicable لا يُؤخذ بالحسبان إلا إذا كانت كل المستويات الأخرى = 0
// ... مع منطق maxCount والتعادل ...
```

- ❌ التوثيق ما زال يصف منطق «أعلى عدد + حل التعادل»، وليس منطق «أولوية الفئة بغض النظر عن العدد».

---

## 📝 الخطوات التفصيلية للتعديل

### الخطوة 1: تثبيت شكل `total_project_score` في الـ Model (تحقق فقط)

**الملف**: `backend/src/models/assessment.model.js`

- **التحقق** (بدون تعديل):
  - `total_project_score` هو `scoreCountSchema` يحتوي الحقول:
    - `negligible, low, medium, high, not_applicable` كـ `Number` مع `default: 0`.
  - هذا يتوافق تماماً مع المثال المطلوب (`"negligible:50", "low:40", ...`).

**النتيجة**: لا حاجة لتعديل الـ Model في هذه الخطة ✅  
(فقط نحرص في الخدمة على ملء هذا الأوبجكت بالقيم الصحيحة).

---

### الخطوة 2: تعديل منطق `calculateImpact` في `assessment.service.js`

**الملف**: `backend/src/services/assessment.service.js`

#### 2.1 الإبقاء على جزء حساب `scoreCount` كما هو
- نحتفظ بالجزء الذي:
  - يجلب كل `AssessmentImpactScore` لهذا الـ Assessment.
  - يملأ `scoreCount` بعدّاد لكل مستوى.

#### 2.2 استبدال منطق اختيار `total_project_impact`

**المنطق الجديد المطلوب:**
```javascript
// بعد ملء scoreCount
const priorityLevels = ["high", "medium", "low", "negligible", "not_applicable"];

let impactLevel = null;

for (const level of priorityLevels) {
  if (scoreCount[level] > 0) {
    impactLevel = level;
    break;
  }
}

// إذا لم يوجد أي مستوى له قيمة > 0 (حالة نادرة جداً)
if (!impactLevel) {
  impactLevel = "negligible"; // أو قرار آخر كقيمة افتراضية
}

assessment.total_project_score = scoreCount;
assessment.total_project_impact = impactLevel;
assessment.is_complete = true;
await assessment.save();
```

**نقاط يجب التأكد منها في التعديل:**
- ❌ إزالة الاعتماد على `maxCount` تماماً (لا نريد مقارنة عدد النقاط).
- ❌ إزالة منطق التعادل والـ `priority` object القائم على الأعداد.
- ✅ استخدام ترتيب ثابت للمستويات:
  - `["high", "medium", "low", "negligible", "not_applicable"]`
- ✅ أول مستوى يجد له عدّاد > 0 هو الفائز، بغض النظر عن الأعداد في المستويات الأخرى.
- ✅ التعامل مع حالة عدم وجود أي score:
  - إما رمي خطأ (مثل الكود الحالي عندما لا توجد أي Scores)،
  - أو إعطاء قيمة افتراضية؛ الكود الحالي أصلاً يرمي ApiError عندما لا توجد Scores، لذلك الحالة الفعلية دائماً فيها بيانات على الأقل.

#### 2.3 الحفاظ على التوافق مع قواعد العمل (Business Rules)
- **قواعد العمل** في `Overview.md` لا تفرض حالياً منطقاً معيناً على طريقة اختيار المستوى، فقط وجود `total_project_impact`.
- التعديل لا يغيّر الـ API contract:
  - حقل `total_project_score` ما زال object.
  - حقل `total_project_impact` ما زال String بـ enum ثابت.
- يجب التأكد أن أي كود في الـ frontend يستخدم قيمة `total_project_score` كـ object وليس رقم (وهو ما تم أخذه بالحسبان في خطة سابقة).

---

### الخطوة 3: تحديث التوثيق في `Overview.md`

**الملف**: `backend/documents/Overview.md`

#### 3.1 قسم «حساب Total Project Score» (Tool 2)

- استبدال المقتطف الحالي الذي يتحدث عن:
  - «تحديد total_project_impact بناءً على أعلى عدد»
  - منطق `maxCount` + حل التعادل

- **المقتطف الجديد المقترح:**

```markdown
#### حساب Total Project Score و Total Project Impact

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

// تخزين النتيجة في Assessment.total_project_score
assessment.total_project_score = scoreCount;

// اختيار total_project_impact حسب أولوية الفئة (وليس عدد النقاط)
// أولوية: high > medium > low > negligible > not_applicable
const priorityLevels = ["high", "medium", "low", "negligible", "not_applicable"];

let impactLevel = null;

for (const level of priorityLevels) {
  if (scoreCount[level] > 0) {
    impactLevel = level;
    break;
  }
}

// إذا لم يوجد أي مستوى له قيمة > 0 (حالة استثنائية)
if (!impactLevel) {
  impactLevel = "negligible"; // قيمة افتراضية
}

assessment.total_project_impact = impactLevel;
assessment.is_complete = true;
```

**توضيح نصي في التوثيق:**
- يتم تحديد `total_project_impact` بناءً على **وجود** نقاط في مستوى معيّن، وليس على عدد النقاط:
  - إذا وُجد أي سؤال بمستوى `high`، يعتبر المشروع High impact، حتى لو كانت بقية الأسئلة `low` أو `negligible` بعدد أكبر.
  - إذا لم يوجد High لكن يوجد Medium، تكون النتيجة Medium، وهكذا.
  - `not_applicable` لا يُستخدم لتقليل مستوى التأثير، بل يُستخدم فقط إذا لم تُسجّل أي مستويات أخرى.

---

### الخطوة 4: مراجعة Validators و Endpoints (تحقق فقط)

#### 4.1 Validator: `backend/src/validators/assessment.validator.js`
- **التحقق**:
  - `addScoresSchema` يستخدم `level` من enum:
    - `["negligible", "low", "medium", "high", "not_applicable"]` ✅
  - لا يوجد في الـ validator حقل `total_project_score` أو `total_project_impact` ضمن الـ body (يتم حسابهما من الـ backend) ✅
- **النتيجة**: لا حاجة لتعديل الـ validator في هذه الخطة.

#### 4.2 Endpoints: `backend/documents/Endpoints.md`

- **قسم Tool 2: Assessment**:
  - Endpoint: `PATCH /api/v1/assessments/:id/calculate`
    - حالياً موثّق أنه «يحسب المجموع» فقط.
  - يفضَّل إضافة توضيح أن:
    - `total_project_score` سيكون object يحتوي على عدّاد لكل مستوى.
    - `total_project_impact` يتم تحديده حسب أولوية الفئة (High > Medium > Low > Negligible > N/A).

**مقتطف توثيق مقترح:**

```markdown
### PATCH `/api/v1/assessments/:id/calculate`

- الاستخدام: حساب عدد النتائج لكل مستوى (`total_project_score`) وتحديد مستوى التأثير الكلي (`total_project_impact`).
- المنطق:
  - يتم عدّ عدد الإجابات في كل مستوى (negligible, low, medium, high, not_applicable).
  - يتم اختيار `total_project_impact` حسب أولوية المستويات:
    - إذا وُجد أي سؤال بمستوى high → النتيجة = high
    - وإلا إذا وُجد medium → النتيجة = medium
    - وإلا إذا وُجد low → النتيجة = low
    - وإلا إذا وُجد negligible → النتيجة = negligible
    - وإلا إذا وُجد فقط not_applicable → النتيجة = not_applicable
- مثال ناتج مختصر:

```json
{
  "total_project_score": {
    "negligible": 50,
    "low": 40,
    "medium": 20,
    "high": 5,
    "not_applicable": 70
  },
  "total_project_impact": "high"
}
```
```

---

## ✅ قائمة التحقق (Checklist)

### قبل التنفيذ
- [ ] تأكيد أن `total_project_score` في الـ Model هو object بالحقول الخمسة (تم ✅).
- [ ] مراجعة استخدام `total_project_score` و `total_project_impact` في الـ frontend لضمان التوافق.

### أثناء تنفيذ الكود
- [ ] تعديل `calculateImpact` في `assessment.service.js`:
  - [ ] الإبقاء على حساب `scoreCount`.
  - [ ] إزالة منطق `maxCount` والتعادل.
  - [ ] إضافة منطق أولوية الفئة (high → medium → low → negligible → not_applicable).
  - [ ] تخزين `scoreCount` في `assessment.total_project_score`.
  - [ ] تخزين `impactLevel` في `assessment.total_project_impact`.
- [ ] تحديث قسم الحساب في `Overview.md` كما في المقتطف المقترح.
- [ ] تحديث وصف Endpoint `PATCH /api/v1/assessments/:id/calculate` في `Endpoints.md`.

### بعد التنفيذ (اختبارات مطلوبة)

#### سيناريو 1: مثال المستخدم (High موجود بأقل عدد)
- **المدخلات (Scores)**:
  - 40 × `low`
  - 5 × `high`
  - 20 × `medium`
  - 50 × `negligible`
  - 70 × `not_applicable`
- **المتوقع**:
  - `total_project_score` كما هو مذكور في المثال.
  - `total_project_impact = "high"` (لأن وجود high يكفي لتغليب الفئة).

#### سيناريو 2: لا يوجد High لكن يوجد Medium
- **المدخلات**:
  - 10 × `medium`
  - 5 × `low`
  - 0 × `high`
  - ... إلخ
- **المتوقع**:
  - `total_project_impact = "medium"`.

#### سيناريو 3: فقط Low و Negligible
- **المدخلات**:
  - 3 × `low`
  - 100 × `negligible`
- **المتوقع**:
  - `total_project_impact = "low"` (حتى لو كان `negligible` بعدد أكبر).

#### سيناريو 4: فقط Not Applicable
- **المدخلات**:
  - 0 لكل المستويات الأخرى
  - 10 × `not_applicable`
- **المتوقع**:
  - `total_project_impact = "not_applicable"`.

#### سيناريو 5: حالة بدون Scores (حماية)
- **المدخلات**:
  - لا توجد `AssessmentImpactScore` لهذا التقييم.
- **المتوقع**:
  - يبقى السلوك كما هو الآن: رمي `ApiError(400, "No scores to calculate")`.

---

## 📌 ملاحظات تنفيذية مهمة

1. **توافق البيانات (Backward Compatibility)**  
   - التعديل لا يغير شكل الحقول في الـ DB (ما زالت نفس الحقول والأنواع)، إنما يغيّر فقط المنطق الذي يملؤها.
   - لا حاجة لمهام Migration على مستوى الـ Schema، لكن النتائج المحسوبة القديمة قد لا تتبع المنطق الجديد حتى يتم إعادة حسابها عبر Endpoint `calculate`.

2. **تحديث النتائج القديمة** (اختياري لكن موصى به)
   - يمكن كتابة Script داخلي (مثلاً في `scripts/`) يقوم بـ:
     - جلب كل Assessments التي تحتوي على `AssessmentImpactScore`.
     - استدعاء `calculateImpact` لكل واحدة لتحديث `total_project_score` و `total_project_impact` وفق المنطق الجديد.

3. **Frontend**  
   - يجب التأكد من أن أي منطق في الواجهة كان يفترض أن `total_project_impact` يعتمد على كثافة المستويات وليس وجودها فقط، ويتم تحديث أي رسائل توضيحية للمستخدم النهائي (إن وجدت).

---

**الحالة**: خطة جاهزة للتنفيذ ✅ (بدون تنفيذ فعلي في الكود حسب طلبك)

