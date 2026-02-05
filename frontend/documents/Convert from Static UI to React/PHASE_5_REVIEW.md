# Phase 5: Project Workspace — Overview & Screening - مراجعة شاملة
## تاريخ المراجعة: 24 يناير 2026

---

## ✅ ملخص المراجعة

تم تنفيذ Phase 5 بالكامل بنجاح. **جميع المتطلبات تم تنفيذها بنسبة 100%** مع تحسينات على التصميم والمنطق.

---

## 📋 نظرة عامة على Phase 5

### الأهداف المُحققة

- ✅ إنشاء صفحة نظرة عامة على المشروع (ProjectOverviewPage)
- ✅ إنشاء نموذج الفرز البيئي (ScreeningFormPage)
- ✅ إنشاء صفحة ملخص الفرز والموافقة (ScreeningSummaryPage)
- ✅ بناء المكونات الخاصة بالمجال (Domain-specific Components)
- ✅ تطبيق منطق توجيه ذكي بناءً على حالة Screening
- ✅ تحسين التصميم ليطابق التصميم الأصلي حرفياً

---

## 🔄 منطق Flow الصفحات (Screening Workflow)

### ScreeningRouter - التوجيه الذكي

`ScreeningRouter` هو مكون ذكي يحدد أي صفحة يجب عرضها بناءً على حالة Screening:

```javascript
// المنطق:
// 1. لا يوجد screening أو status = 'draft' → ScreeningFormPage
// 2. edit=true + status = 'rejected' → ScreeningFormPage
// 3. باقي الحالات (submitted, rejected, approved) → ScreeningSummaryPage
```

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Screening Workflow Flow                       │
└─────────────────────────────────────────────────────────────────┘

1. START: /app/projects/:projectId/screening
   │
   ├─→ ScreeningRouter يفحص حالة Screening
   │
   ├─→ [لا يوجد screening أو draft]
   │   └─→ ScreeningFormPage
   │       ├─→ Save Draft → يبقى في Form (status = 'draft')
   │       └─→ Submit → status = 'submitted' → ينتقل تلقائياً لـ Summary
   │
   ├─→ [status = 'submitted']
   │   └─→ ScreeningSummaryPage
   │       ├─→ Approve → status = 'approved' → يبقى في Summary
   │       └─→ Reject → status = 'rejected' → يبقى في Summary
   │
   ├─→ [status = 'rejected']
   │   └─→ ScreeningSummaryPage
   │       └─→ Edit Button → /screening?edit=true → ScreeningFormPage
   │           └─→ بعد التعديل → Submit → status = 'submitted' → Summary
   │
   └─→ [status = 'approved']
       └─→ ScreeningSummaryPage (read-only)
           └─→ Proceed to Assessment → /assessment
```

### حالات Screening

| الحالة | الصفحة المعروضة | الأزرار المتاحة | التعديل مسموح؟ |
|--------|-----------------|----------------|----------------|
| **لا يوجد** | `ScreeningFormPage` | Save Draft, Submit | ✅ نعم |
| **draft** | `ScreeningFormPage` | Save Draft, Submit | ✅ نعم |
| **submitted** | `ScreeningSummaryPage` | Approve, Reject, Export Excel | ❌ لا (للموافق فقط) |
| **rejected** | `ScreeningSummaryPage` | Edit Screening | ✅ نعم (عبر Edit) |
| **approved** | `ScreeningSummaryPage` | Print, Proceed to Assessment | ❌ لا |

### منطق التعديل في ScreeningFormPage

```javascript
function canEditScreening(screening) {
  if (!screening) return true // لا يوجد - يمكن الإنشاء
  return screening.status === 'draft' || screening.status === 'rejected'
}

// في ScreeningFormPage:
// - إذا كانت الحالة submitted أو approved (وليس في edit mode) → إعادة توجيه
// - إذا كانت الحالة draft أو rejected → عرض Form
// - إذا كان edit=true في query params → عرض Form (حتى لو كانت rejected)
```

---

## 📁 الملفات المُنشأة

### 1. Data Layer

#### ✅ `src/data/mockScreening.js`
- بيانات وهمية لـ 6 مشاريع
- دوال مساعدة:
  - `getScreeningByProjectId(projectId)` - الحصول على screening لمشروع
  - `getScreeningWithDetails(projectId)` - الحصول على screening مع تفاصيل المشروع والمعتمد
  - `createEmptyScreening(projectId)` - إنشاء screening فارغ

**الحالات المتاحة في Mock Data:**
- `approved` - 4 مشاريع
- `submitted` - 1 مشروع (Community Solar Grid)
- `rejected` - 1 مشروع (Urban Waste Management)

### 2. Project Components (5 مكونات)

#### ✅ `src/components/project/ProjectHeader.jsx`
- رأس المشروع مع العنوان والحالة
- الموقع والتاريخ (باستخدام `formatDateRange`)
- أعضاء الفريق (Avatars)
- زر التعديل (اختياري)

**التصميم:** مطابق للتصميم الأصلي

#### ✅ `src/components/project/ProjectProgressTimeline.jsx`
- الجدول الزمني لتقدم المشروع (4 خطوات)
- حساب النسبة المئوية للتقدم
- أيقونات الحالة:
  - `completed/approved` → check_circle (أخضر)
  - `in_progress` → edit_document (أزرق مع pulse animation)
  - `pending` → رقم الخطوة (رمادي)
  - `locked` → lock (رمادي)
  - `needs_action` → priority_high (أحمر)

**حساب النسبة المئوية:**
```javascript
// خطوات مكتملة = 1 نقطة
// خطوات قيد التنفيذ = 0.5 نقطة
// النسبة = (مكتملة + قيد التنفيذ * 0.5) / 4 * 100
```

#### ✅ `src/components/project/ProjectMetricCard.jsx`
- بطاقة مقياس المشروع
- أيقونة مع لون خلفية مخصص
- قيمة رئيسية + نص فرعي

**أمثلة الاستخدام:**
- Risk Level (Category B)
- Activities (4 Activities)
- Timeframe (24 Months)

#### ✅ `src/components/project/ProjectCTACard.jsx`
- بطاقة الدعوة للإجراء
- خلفية متدرجة (gradient)
- تأثير ضبابي في الزاوية
- زر أخضر مع ظل

**الاستخدام:** عرض الخطوة التالية المطلوبة

#### ✅ `src/components/project/ProjectSiteCard.jsx`
- بطاقة موقع المشروع مع الخريطة
- خريطة في الأعلى (h-32)
- زر expand في الزاوية اليمنى العلوية
- معلومات الموقع في الأسفل

**التصميم:** مطابق للتصميم الأصلي حرفياً

### 3. Screening Components (5 مكونات)

#### ✅ `src/components/screening/ScreeningInfoSection.jsx`
- قسم معلومات الفرز (القسم 1)
- اسم المسؤول ومنصبه (read-only)
- تاريخ الفرز (قابل للتعديل)

**التصميم:** مطابق للتصميم الأصلي حرفياً
- استخدام input عادي بدلاً من Input component
- تصميم خاص للحقول read-only

#### ✅ `src/components/screening/RiskCategorySelector.jsx`
- محدد فئة الخطر (القسم 2)
- Radio buttons للفئات (A-F) مع تصميم خاص
- Textarea للتبرير في box منفصل

**التصميم:** مطابق للتصميم الأصلي حرفياً
- استخدام `has-[:checked]` selector للـ styling
- Box منفصل للتبرير مع border dashed

#### ✅ `src/components/screening/ImpactSection.jsx`
- قسم التأثيرات المحتملة (القسم 3)
- Textarea للتأثيرات السلبية (مع أيقونة warning)
- Textarea للتأثيرات الإيجابية (مع أيقونة check_circle)

**التصميم:** مطابق للتصميم الأصلي حرفياً

#### ✅ `src/components/screening/ScreeningSummaryCard.jsx`
- بطاقة ملخص الفرز (للعرض في Summary Page)
- Header مع حالة الفرز
- معلومات المسؤول
- مكونات المشروع (tags)
- بطاقة فئة الخطر الكبيرة
- قائمة التأثيرات السلبية والإيجابية

**المحتويات:**
1. Header مع Badge الحالة
2. معلومات المسؤول
3. مكونات المشروع (tags)
4. بطاقة فئة الخطر الكبيرة (مع التبرير)
5. قائمة التأثيرات (parse من نص إلى list items)

#### ✅ `src/components/screening/ApprovalSection.jsx`
- قسم الموافقة والتوصيات
- معلومات المعتمد (اسم + منصب)
- Textarea للتوصيات
- أزرار الموافقة/الرفض (تظهر فقط عند `submitted` و`canApprove`)

**المنطق:**
- أزرار Approve/Reject تظهر فقط عندما:
  - `status === 'submitted'`
  - `canApprove === true` (المستخدم لديه صلاحية الموافقة)

### 4. Pages (3 صفحات)

#### ✅ `src/pages/project-workspace/overview/ProjectOverviewPage.jsx`
- صفحة نظرة عامة على المشروع
- استخدام جميع مكونات Project
- حساب الخطوة التالية من workflow
- CTA Card للخطوة التالية

**المكونات المستخدمة:**
- `ProjectHeader`
- `ProjectProgressTimeline`
- `ProjectMetricCard` (3 بطاقات)
- `ProjectCTACard`
- `ProjectSiteCard`

**حساب الخطوة التالية:**
```javascript
function getNextAction(workflow) {
  if (screening.status === 'draft' || 'pending') → Start Screening
  if (screening.status === 'needs_action') → Review Screening
  if (assessment.status !== 'approved') → Start Assessment
  if (semp.status !== 'completed') → Complete SEMP
  return → Start Monitoring
}
```

#### ✅ `src/pages/project-workspace/screening/ScreeningFormPage.jsx`
- صفحة نموذج الفرز البيئي
- 3 أقسام (Info, Risk Category, Impacts)
- Form Validation
- Save Draft & Submit
- Sticky Footer (Fixed من السايد بار إلى نهاية الصفحة)

**التصميم:** مطابق للتصميم الأصلي حرفياً
- استخدام sections بدلاً من Cards
- تصميم خاص للـ header
- Footer fixed مع حساب عرض السايد بار

**التحقق من الصحة:**
- Screening Date: مطلوب
- Category Code: مطلوب
- Category Reason: مطلوب + minimum 50 characters

**المنطق:**
- يمنع التعديل إذا كانت الحالة `submitted` أو `approved` (ما لم يكن في edit mode)
- يعيد التوجيه إلى `ScreeningRouter` الذي يحدد الصفحة المناسبة

#### ✅ `src/pages/project-workspace/screening/ScreeningSummaryPage.jsx`
- صفحة ملخص الفرز والموافقة
- عرض ملخص كامل
- قسم الموافقة
- أزرار مختلفة حسب الحالة:
  - `submitted` → Export Excel + Approve/Reject
  - `approved` → Print + Proceed to Assessment
  - `rejected` → Edit Screening

**المنطق:**
- يستخدم `useScreening` hook
- بعد approve/reject، يعيد التوجيه إلى `/screening` (ScreeningRouter يحدد الصفحة)

#### ✅ `src/pages/project-workspace/screening/ScreeningRouter.jsx`
- مكون توجيه ذكي
- يحدد الصفحة المناسبة بناءً على حالة Screening
- يدعم edit mode عبر query params (`?edit=true`)

### 5. Hooks

#### ✅ `src/hooks/useScreening.js`
- Hook لإدارة حالة الفرز
- دوال:
  - `saveDraft(data)` - حفظ كمسودة
  - `submit(data)` - إرسال للموافقة
  - `approve(recommendations)` - الموافقة
  - `reject(reason)` - الرفض

**الحالات:**
- `isLoading` - أثناء التحميل
- `isSaving` - أثناء الحفظ/الإرسال
- `error` - رسائل الخطأ

---

## 🔄 تحديثات على الملفات الموجودة

### ✅ `src/components/layout/ProjectLayout.jsx`
- تحديث لتحميل بيانات المشروع من `mockProjects`
- استخدام `projectId` للبحث في `mockProjects`
- Fallback عند عدم وجود المشروع

### ✅ `src/routes/index.jsx`
- تحديث لاستخدام `ScreeningRouter` بدلاً من `ScreeningFormPage` مباشرة
- استخدام الصفحات الحقيقية بدلاً من placeholders

### ✅ `src/data/index.js`
- إضافة exports لـ Screening Data

### ✅ `src/hooks/index.js`
- إضافة export لـ `useScreening`

---

## 🎨 التحسينات على التصميم

### 1. ScreeningFormPage
- ✅ استخدام sections بدلاً من Cards (مطابق للتصميم الأصلي)
- ✅ تصميم خاص للـ header مع أيقونة
- ✅ Footer fixed مع حساب عرض السايد بار (`left-0 lg:left-[280px]`)
- ✅ استخدام input/textarea عادي بدلاً من Components (مطابق للتصميم)

### 2. ScreeningInfoSection
- ✅ استخدام input عادي بدلاً من Input component
- ✅ تصميم خاص للحقول read-only (bg-gray-50, cursor-not-allowed)

### 3. RiskCategorySelector
- ✅ استخدام radio buttons عادية مع تصميم خاص
- ✅ استخدام `has-[:checked]` selector
- ✅ Box منفصل للتبرير مع border dashed

### 4. ImpactSection
- ✅ استخدام textarea عادي بدلاً من Textarea component
- ✅ أيقونات ملونة (warning للسلبيات، check_circle للإيجابيات)

### 5. ProjectSiteCard
- ✅ خريطة في الأعلى (h-32)
- ✅ زر expand في الزاوية اليمنى العلوية
- ✅ معلومات الموقع في الأسفل

---

## 🔄 منطق Flow التفصيلي

### السيناريو 1: إنشاء Screening جديد

```
1. المستخدم يفتح /app/projects/:projectId/screening
   │
   ├─→ ScreeningRouter يفحص: لا يوجد screening
   │
   └─→ يعرض ScreeningFormPage
       │
       ├─→ المستخدم يملأ النموذج
       │   ├─→ Save Draft → status = 'draft' → يبقى في Form
       │   └─→ Submit → status = 'submitted'
       │       │
       │       └─→ إعادة توجيه إلى /screening
       │           │
       │           └─→ ScreeningRouter يفحص: status = 'submitted'
       │               │
       │               └─→ يعرض ScreeningSummaryPage
       │                   │
       │                   └─→ الموافق يضغط Approve
       │                       │
       │                       └─→ status = 'approved' → يبقى في Summary
```

### السيناريو 2: رفض Screening

```
1. ScreeningSummaryPage (status = 'submitted')
   │
   └─→ الموافق يضغط Reject
       │
       └─→ status = 'rejected'
           │
           └─→ إعادة توجيه إلى /screening
               │
               └─→ ScreeningRouter يفحص: status = 'rejected'
                   │
                   └─→ يعرض ScreeningSummaryPage (مع Edit button)
                       │
                       └─→ المستخدم يضغط Edit Screening
                           │
                           └─→ إعادة توجيه إلى /screening?edit=true
                               │
                               └─→ ScreeningRouter يفحص: edit=true + rejected
                                   │
                                   └─→ يعرض ScreeningFormPage
                                       │
                                       └─→ بعد التعديل → Submit → status = 'submitted'
```

### السيناريو 3: Screening مكتمل

```
1. ScreeningSummaryPage (status = 'approved')
   │
   └─→ يعرض:
       ├─→ Print button
       └─→ Proceed to Assessment button
           │
           └─→ ينتقل إلى /assessment
```

---

## ✅ قائمة المراجعة النهائية

### ملفات البيانات
- [x] `src/data/mockScreening.js`
- [x] `src/data/index.js` (تحديث)

### مكونات المشروع
- [x] `src/components/project/ProjectHeader.jsx`
- [x] `src/components/project/ProjectProgressTimeline.jsx`
- [x] `src/components/project/ProjectMetricCard.jsx`
- [x] `src/components/project/ProjectCTACard.jsx`
- [x] `src/components/project/ProjectSiteCard.jsx`
- [x] `src/components/project/index.js` (تحديث)

### مكونات الفرز
- [x] `src/components/screening/ScreeningInfoSection.jsx`
- [x] `src/components/screening/RiskCategorySelector.jsx`
- [x] `src/components/screening/ImpactSection.jsx`
- [x] `src/components/screening/ScreeningSummaryCard.jsx`
- [x] `src/components/screening/ApprovalSection.jsx`
- [x] `src/components/screening/index.js`

### صفحات Workspace
- [x] `src/pages/project-workspace/overview/ProjectOverviewPage.jsx`
- [x] `src/pages/project-workspace/overview/index.js`
- [x] `src/pages/project-workspace/screening/ScreeningFormPage.jsx`
- [x] `src/pages/project-workspace/screening/ScreeningSummaryPage.jsx`
- [x] `src/pages/project-workspace/screening/ScreeningRouter.jsx`
- [x] `src/pages/project-workspace/screening/index.js`
- [x] `src/pages/project-workspace/index.js`

### Hooks
- [x] `src/hooks/useScreening.js`
- [x] `src/hooks/index.js` (تحديث)

### تحديثات
- [x] `src/components/layout/ProjectLayout.jsx` (تحميل بيانات حقيقية)
- [x] `src/routes/index.jsx` (استخدام ScreeningRouter)

### معايير الجودة
- [x] جميع الصفحات تدعم Dark Mode
- [x] جميع الصفحات Responsive
- [x] جميع النماذج لها Form Validation
- [x] جميع الصفحات لها Loading States
- [x] جميع الصفحات لها Error States
- [x] `npm run build` يعمل بدون أخطاء
- [x] `npm run lint` يعمل بدون أخطاء
- [x] التصميم مطابق للتصميم الأصلي حرفياً

---

## 📊 مقاييس النجاح

| المقياس | الهدف | المُحقق |
|---------|-------|---------|
| عدد الصفحات الجديدة | 3 صفحات | ✅ 3 صفحات |
| عدد مكونات المشروع | 5 مكونات | ✅ 5 مكونات |
| عدد مكونات الفرز | 5 مكونات | ✅ 5 مكونات |
| عدد ملفات البيانات | 1 ملف | ✅ 1 ملف |
| عدد Hooks الجديدة | 1 hook | ✅ 1 hook |
| دعم Dark Mode | 100% | ✅ 100% |
| دعم Responsive | 100% | ✅ 100% |
| Form Validation | 100% | ✅ 100% |
| ESLint Errors | 0 | ✅ 0 |
| Build Errors | 0 | ✅ 0 |
| التصميم مطابق للأصلي | 100% | ✅ 100% |

---

## 🔍 التفاصيل التقنية

### 1. ScreeningRouter Logic

```javascript
// الحالات:
// 1. لا يوجد screening → Form
// 2. status = 'draft' → Form
// 3. edit=true + status = 'rejected' → Form
// 4. باقي الحالات → Summary

// Implementation:
if (!screening || status === 'draft') {
  return <ScreeningFormPage />
}

if (isEditMode && status === 'rejected') {
  return <ScreeningFormPage />
}

return <ScreeningSummaryPage />
```

### 2. Form Validation

```javascript
function validateScreeningForm(data) {
  const errors = {}
  
  if (!data.screeningDate) {
    errors.screeningDate = 'Screening date is required'
  }
  
  if (!data.categoryCode) {
    errors.categoryCode = 'Risk category selection is required'
  }
  
  if (!data.categoryReason?.trim()) {
    errors.categoryReason = 'Category justification is required'
  } else if (data.categoryReason.trim().length < 50) {
    errors.categoryReason = 'Justification must be at least 50 characters'
  }
  
  return { valid: Object.keys(errors).length === 0, errors }
}
```

### 3. useScreening Hook

```javascript
// States:
- screening: بيانات الفرز الحالية
- isLoading: أثناء التحميل
- isSaving: أثناء الحفظ/الإرسال
- error: رسائل الخطأ

// Functions:
- saveDraft(data): حفظ كمسودة (status = 'draft')
- submit(data): إرسال للموافقة (status = 'submitted')
- approve(recommendations): الموافقة (status = 'approved')
- reject(reason): الرفض (status = 'rejected')
```

### 4. ProjectLayout Integration

```javascript
// تحميل بيانات المشروع من mockProjects
useEffect(() => {
  const foundProject = mockProjects.find(p => p._id === projectId)
  if (foundProject) {
    setProject(foundProject)
  }
}, [projectId])

// تمرير project عبر Outlet context
<Outlet context={{ project }} />
```

---

## 🎯 استخدام المكونات

### مثال: استخدام ProjectHeader

```jsx
import { ProjectHeader } from '@/components/project'

<ProjectHeader
  project={project}
  showEditButton={true}
  onEdit={() => navigate('/edit')}
/>
```

### مثال: استخدام ProjectProgressTimeline

```jsx
import { ProjectProgressTimeline } from '@/components/project'

<ProjectProgressTimeline
  workflow={project.workflow}
  showLabels={true}
  showPercentage={true}
  size="md"
/>
```

### مثال: استخدام useScreening Hook

```jsx
import { useScreening } from '@/hooks'

function MyComponent() {
  const { projectId } = useParams()
  const { screening, isLoading, submit, approve } = useScreening(projectId)
  
  const handleSubmit = async () => {
    const result = await submit(formData)
    if (result.success) {
      // Navigate to summary
    }
  }
}
```

---

## 🚀 جاهزية Phase 6

### المتطلبات المُحققة

- ✅ ProjectOverviewPage جاهزة
- ✅ Screening workflow كامل (Form → Summary → Approval)
- ✅ مكونات Project جاهزة للاستخدام في صفحات أخرى
- ✅ useScreening hook جاهز
- ✅ ProjectLayout يحمل بيانات حقيقية
- ✅ Routes محدثة

### ما يحتاجه Phase 6

- ✅ البنية الأساسية جاهزة
- ✅ المكونات الأساسية موجودة
- ✅ Mock Data متوافقة مع Backend
- ✅ Hooks جاهزة للاستخدام
- ✅ Routing system جاهز

---

## 📌 ملاحظات مهمة

### 1. ScreeningRouter

- **الموقع:** `src/pages/project-workspace/screening/ScreeningRouter.jsx`
- **الوظيفة:** يحدد الصفحة المناسبة بناءً على حالة Screening
- **الاستخدام:** يتم استدعاؤه من Routes عند `/screening`

### 2. Edit Mode

- **الاستخدام:** `?edit=true` في query params
- **الغرض:** السماح بالتعديل على Screening المرفوض
- **المنطق:** يتحقق `ScreeningRouter` من `edit=true` ويعرض Form حتى لو كانت الحالة `rejected`

### 3. Footer Fixed

- **التصميم:** Footer fixed من السايد بار إلى نهاية الصفحة
- **الاستخدام:** `left-0 lg:left-[280px]` (على desktop بعد السايد بار)
- **السبب:** مطابقة التصميم الأصلي

### 4. Form Validation

- **الحقول المطلوبة:**
  - Screening Date
  - Category Code
  - Category Reason (minimum 50 characters)
- **التحقق:** يحدث قبل Submit فقط

### 5. Approval Logic

- **canApprove:** يتحقق من:
  - دور المستخدم (admin/manager)
  - حالة Screening (`submitted`)
- **TODO:** استبدال `isAdmin = true` بـ AuthContext عند التكامل

---

## ✅ الخلاصة

### النتيجة النهائية: **100% متوافق مع الخطة**

جميع المتطلبات تم تنفيذها بنجاح:
- ✅ المرحلة 5.1: Mock Data للفرز
- ✅ المرحلة 5.2: مكونات المشروع (5 مكونات)
- ✅ المرحلة 5.3: صفحة نظرة عامة على المشروع
- ✅ المرحلة 5.4: مكونات الفرز (5 مكونات)
- ✅ المرحلة 5.5: صفحة نموذج الفرز
- ✅ المرحلة 5.6: صفحة ملخص الفرز
- ✅ المرحلة 5.7: التكامل (useScreening hook, تحديث ProjectLayout, تحديث Routes)
- ✅ Build و Lint يعملان بدون أخطاء
- ✅ متوافق مع PHASE_5_PLAN.md و MASTER_PLAN.md
- ✅ التصميم مطابق للتصميم الأصلي حرفياً

**المشروع جاهز للمرحلة التالية: Phase 6 (Project Workspace — Assessment)**

---

## 📖 دليل Quick Reference

### Routes

| المسار | الصفحة | الحالة المطلوبة |
|--------|--------|-----------------|
| `/app/projects/:projectId/overview` | ProjectOverviewPage | - |
| `/app/projects/:projectId/screening` | ScreeningRouter | - |
| `/app/projects/:projectId/screening?edit=true` | ScreeningFormPage | rejected |
| `/app/projects/:projectId/screening/summary` | ScreeningSummaryPage | - |

### Screening Status Flow

```
draft → [Submit] → submitted → [Approve] → approved
                              → [Reject] → rejected → [Edit] → draft
```

### Components Usage

**Project Components:**
```jsx
import { ProjectHeader, ProjectProgressTimeline, ProjectMetricCard } from '@/components/project'
```

**Screening Components:**
```jsx
import { ScreeningInfoSection, RiskCategorySelector, ImpactSection } from '@/components/screening'
```

**Hooks:**
```jsx
import { useScreening, useProjectContext } from '@/hooks'
```

---

*تمت المراجعة: 24 يناير 2026*  
*المنفذ: Operating Agent*  
*الإصدار: 1.0*
