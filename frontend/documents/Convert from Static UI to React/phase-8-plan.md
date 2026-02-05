# Phase 8: Project Workspace — Monitoring & Files (Tool 5 + Annex)
## خطة تنفيذ تفصيلية
## تاريخ الإنشاء: 3 فبراير 2026

---

## 📋 نظرة عامة

### الأهداف الرئيسية
- إنشاء صفحة نظرة عامة للمراقبة (Monitoring Overview)
- إنشاء صفحة إدخال بيانات المراقبة (Monitoring Data Entry)
- إنشاء صفحة ملفات المشروع والمرفقات (Project Files)
- إنشاء صفحة الملحقات (Annex Overview)
- بناء مكونات المراقبة والملفات القابلة لإعادة الاستخدام
- استخدام `impactIndicators.js` كمصدر بيانات أساسي لمؤشرات المراقبة

### المتطلبات المُسبقة
- ✅ Phase 1: Project Setup & Build Pipeline (مكتمل)
- ✅ Phase 2: Component Library - UI Kit (مكتمل)
- ✅ Phase 3: Layout Components & Routing (مكتمل)
- ✅ Phase 4: Auth & Dashboard Domain (مكتمل)
- ✅ Phase 5: Project Workspace — Overview & Screening (مكتمل)
- ✅ Phase 6: Project Workspace — Assessment (مكتمل)
- ✅ Phase 7: Project Workspace — SEMP (مكتمل)

### الالتزام بدستور الستايلات (إلزامي)
- يجب الالتزام الكامل بـ `frontend/documents/STYLE_GUIDE.md` أثناء التنفيذ.
- أي كلاس/لون غير مطابق للدستور يعتبر خطأ ويجب تصحيحه قبل اعتماد المرحلة.

### الملفات المرجعية (Static HTML)
| الملف | الصفحة المقابلة |
|-------|-----------------|
| `20.Monitoring Overview.html` | `MonitoringOverviewPage.jsx` |
| `21.Monitoring Data Entry.html` | `MonitoringDataEntryPage.jsx` |
| `22.Project Files and Records.html` | `ProjectFilesPage.jsx` |
| `23.Annex and Attachments Overview.html` | `AnnexOverviewPage.jsx` |

### Backend Model References

#### MonitoringRecord Model (`backend/src/models/monitoringRecord.model.js`)
```javascript
{
  project: ObjectId (ref: 'Project'),           // المشروع
  indicator: ObjectId (ref: 'Indicator'),       // مؤشر المراقبة
  scores: { baseline, Q1, Q2, Q3, Q4 },          // القيم لكل ربع
  total: String,                                // إجمالي (محسوب/مدخل)
  final_assessment: String,                     // تقييم نهائي
  ranking: enum ['negligible','low','medium','high','not_applicable'],
  responsible: ObjectId (ref: 'User'),
  note: String
}
```

#### Indicator Model (`backend/src/models/indicator.model.js`)
```javascript
{
  category: ObjectId (ref: 'ImpactCategory'),
  name: String,
  definition: String,
  measurement: String
}
```

#### Attachment Model (`backend/src/models/attachment.model.js`)
```javascript
{
  entity_type: enum ['project','screening','assessment','monitoring'],
  entity_id: ObjectId,
  file_name: String,
  file_path: String,
  file_type: String,
  file_size: Number,
  uploaded_by: ObjectId
}
```

#### AnnexItem Model (`backend/src/models/annexItem.model.js`)
```javascript
{
  title: String (required),
  description: String
}
```

---

## 📁 هيكل الملفات المطلوب إنشاؤها

```
src/
├── pages/
│   └── project-workspace/
│       ├── monitoring/
│       │   ├── MonitoringOverviewPage.jsx     ← جديد
│       │   ├── MonitoringDataEntryPage.jsx   ← جديد
│       │   └── index.js                       ← جديد
│       │
│       └── annex/
│           ├── ProjectFilesPage.jsx           ← جديد
│           ├── AnnexOverviewPage.jsx          ← جديد
│           └── index.js                       ← جديد
│
├── components/
│   ├── monitoring/                            ← مجلد جديد
│   │   ├── MonitoringCategoryCard.jsx         ← جديد
│   │   ├── MonitoringProgressTimeline.jsx     ← جديد
│   │   ├── IndicatorDataRow.jsx               ← جديد
│   │   ├── RankingSelect.jsx                  ← جديد
│   │   └── index.js                           ← جديد
│   │
│   ├── tables/
│   │   ├── MonitoringDataTable.jsx            ← جديد (حسب MASTER_PLAN)
│   │   └── index.js                           ← تحديث
│   │
│   └── files/                                 ← مجلد جديد
│       ├── FileCategoryAccordion.jsx          ← جديد
│       ├── FileListTable.jsx                  ← جديد
│       ├── FileRowActions.jsx                 ← جديد
│       └── index.js                           ← جديد
│
├── data/
│   ├── mockMonitoringRecords.js               ← جديد
│   ├── mockAttachments.js                     ← جديد
│   └── mockAnnexItems.js                      ← جديد
│
└── hooks/
    ├── useMonitoring.js                       ← جديد
    └── useFiles.js                            ← جديد
```

---

## 🔢 ترتيب التنفيذ

| المرحلة | الوصف | عدد الملفات |
|---------|-------|-------------|
| 8.1 | Mock Data + Mapping للمؤشرات | 3 |
| 8.2 | Hooks لإدارة المراقبة والملفات | 2 |
| 8.3 | مكونات المراقبة | 6 |
| 8.4 | صفحة Monitoring Overview | 1 |
| 8.5 | صفحة Monitoring Data Entry | 1 |
| 8.6 | مكونات الملفات والملحقات | 4 |
| 8.7 | صفحة Project Files | 1 |
| 8.8 | صفحة Annex Overview | 1 |
| 8.9 | التكامل وتحديث الـ Routes والـ Barrels | 4 |
| 8.10 | CSS/Styles للجداول | 1 |

---

## 📝 المرحلة 8.1: Mock Data + Mapping للمؤشرات

### 8.1.1 إنشاء ملف `src/data/mockMonitoringRecords.js`

**الوصف:** بيانات المراقبة الوهمية لكل مشروع، مع ربط مؤشرات `impactIndicators.js`.

**ملاحظات مهمة:**
- `impactIndicators.js` يحتوي على `code` فقط، لذلك نُنشئ IDs محلية للمؤشرات.
- نستخدم `impactCategories.js` لمطابقة `code` مع اسم الفئة.

```javascript
/**
 * Mock Monitoring Records Data
 * متوافق مع backend/src/models/monitoringRecord.model.js
 */

import { impactIndicators, getIndicatorsByCategory } from './impactIndicators'
import { impactCategories, impactLevels } from './impactCategories'

export const monitoringIndicators = impactIndicators.map((indicator, index) => ({
  _id: `indicator_${indicator.code}_${index + 1}`,
  categoryCode: indicator.code,
  name: indicator.name,
  definition: indicator.definition,
  measurement: indicator.measurement
}))

export function getMonitoringIndicatorsByCategory(code) {
  return monitoringIndicators.filter((i) => i.categoryCode === code)
}

export const mockMonitoringRecords = [
  {
    _id: 'mr_001',
    project: '507f1f77bcf86cd799439011',
    indicator: 'indicator_A_1',
    scores: { baseline: 'Low', Q1: 'Low', Q2: 'Medium', Q3: 'Medium', Q4: 'Low' },
    total: 'Medium',
    final_assessment: 'Air quality remained stable',
    ranking: 'medium',
    responsible: '507f1f77bcf86cd799439001',
    note: 'Monitoring during construction phase'
  }
]

export function getMonitoringRecordsByProjectId(projectId) {
  return mockMonitoringRecords.filter((r) => r.project === projectId)
}

export function createEmptyMonitoringRecord(projectId, indicatorId) {
  return {
    _id: `mr_temp_${Date.now()}`,
    project: projectId,
    indicator: indicatorId,
    scores: { baseline: '', Q1: '', Q2: '', Q3: '', Q4: '' },
    total: '',
    final_assessment: '',
    ranking: 'not_applicable',
    responsible: null,
    note: '',
    isNew: true
  }
}
```

### 8.1.2 إنشاء ملف `src/data/mockAttachments.js`

**الوصف:** ملفات ومرفقات المشروع حسب `entity_type`.

```javascript
/**
 * Mock Attachments Data
 * متوافق مع backend/src/models/attachment.model.js
 */

export const mockAttachments = [
  {
    _id: 'att_001',
    entity_type: 'project',
    entity_id: '507f1f77bcf86cd799439011',
    file_name: 'Project Charter.pdf',
    file_path: '/uploads/project/charter.pdf',
    file_type: 'pdf',
    file_size: 234000,
    uploaded_by: '507f1f77bcf86cd799439001',
    createdAt: '2024-01-10T10:00:00.000Z'
  }
]

export function getAttachmentsByEntity(projectId, entityType) {
  return mockAttachments.filter(
    (a) => a.entity_id === projectId && a.entity_type === entityType
  )
}
```

### 8.1.3 إنشاء ملف `src/data/mockAnnexItems.js`

```javascript
/**
 * Mock Annex Items
 * متوافق مع backend/src/models/annexItem.model.js
 */

export const mockAnnexItems = [
  {
    _id: 'annex_001',
    title: 'Annex A — Environmental Policy',
    description: 'Official environmental policy document for the project.'
  },
  {
    _id: 'annex_002',
    title: 'Annex B — Stakeholder Engagement Logs',
    description: 'Meeting notes and consultation logs.'
  }
]
```

### 8.1.4 تحديث ملف `src/data/index.js`

```javascript
// Monitoring Data
export {
  monitoringIndicators,
  getMonitoringIndicatorsByCategory,
  getMonitoringRecordsByProjectId,
  createEmptyMonitoringRecord
} from './mockMonitoringRecords'

// Files & Annex
export { mockAttachments, getAttachmentsByEntity } from './mockAttachments'
export { mockAnnexItems } from './mockAnnexItems'
```

---

## 📝 المرحلة 8.2: Hooks لإدارة المراقبة والملفات

### 8.2.1 إنشاء `src/hooks/useMonitoring.js`

**الوصف:** إدارة بيانات Tool 5 (المؤشرات + القيم ربع السنوية).

**المسؤوليات:**
- تحميل السجلات للمشروع
- مزج `monitoringIndicators` مع `monitoringRecords`
- تحديث القيم ربع السنوية (Baseline/Q1-Q4)
- حساب `total` و `ranking` تلقائياً (اختياري)
- حفظ البيانات (محاكاة API)

```javascript
/**
 * useMonitoring Hook
 * إدارة بيانات المراقبة السنوية
 */

import { useState, useEffect, useCallback } from 'react'
import {
  monitoringIndicators,
  getMonitoringIndicatorsByCategory,
  getMonitoringRecordsByProjectId,
  createEmptyMonitoringRecord
} from '@/data'
import { impactCategories, impactLevels } from '@/data/impactCategories'
```

### 8.2.2 إنشاء `src/hooks/useFiles.js`

**الوصف:** Hook لإدارة ملفات المشروع والملحقات.

**المسؤوليات:**
- تحميل ملفات المشروع حسب `entity_type`
- إضافة ملف جديد (محاكاة Upload)
- حذف ملف (محاكاة Delete)

---

## 📝 المرحلة 8.3: مكونات المراقبة

### 8.3.1 إنشاء `src/components/monitoring/MonitoringCategoryCard.jsx`

**الوصف:** بطاقة تلخيص فئة المراقبة (لكل Category).

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `code` | string | ✅ | كود الفئة (A,B,...) |
| `name` | string | ✅ | اسم الفئة |
| `indicatorCount` | number | ✅ | عدد المؤشرات |
| `lastUpdated` | string | ❌ | آخر تحديث |
| `status` | string | ❌ | الحالة (Not Started / In Progress / Complete) |

### 8.3.2 إنشاء `src/components/monitoring/MonitoringProgressTimeline.jsx`

**الوصف:** شريط زمني للأرباع السنوية (Baseline → Q1 → Q2 → Q3 → Q4).

### 8.3.3 إنشاء `src/components/tables/MonitoringDataTable.jsx`

**الوصف:** جدول بيانات المراقبة لكل فئة (مطابق لـ MASTER_PLAN).

**الأعمدة الأساسية:**
| العمود | الحقل |
|--------|-------|
| Indicator | indicator.name |
| Baseline | scores.baseline |
| Q1 | scores.Q1 |
| Q2 | scores.Q2 |
| Q3 | scores.Q3 |
| Q4 | scores.Q4 |
| Total | total |
| Final Assessment | final_assessment |
| Ranking | ranking |
| Note | note |

### 8.3.4 إنشاء `src/components/monitoring/IndicatorDataRow.jsx`

**الوصف:** صف واحد للمؤشر مع حقول قابلة للتعديل.

### 8.3.5 إنشاء `src/components/monitoring/RankingSelect.jsx`

**الوصف:** قائمة اختيار Ranking تعتمد على `impactLevels`.

### 8.3.6 إنشاء `src/components/monitoring/index.js`

```javascript
export { default as MonitoringCategoryCard } from './MonitoringCategoryCard'
export { default as MonitoringProgressTimeline } from './MonitoringProgressTimeline'
export { default as IndicatorDataRow } from './IndicatorDataRow'
export { default as RankingSelect } from './RankingSelect'
```

---

## 📝 المرحلة 8.4: صفحة Monitoring Overview

### 8.4.1 إنشاء `src/pages/project-workspace/monitoring/MonitoringOverviewPage.jsx`

**الوصف:** صفحة نظرة عامة للمراقبة (Tool 5).

**المكونات المستخدمة:**
- `MonitoringCategoryCard`
- `MonitoringProgressTimeline`
- `Card` (UI)

**الميزات المطلوبة:**
- عرض ملخص لكل فئة (A–H)
- إظهار عدد المؤشرات وحالة الإدخال
- زر الانتقال لصفحة Data Entry
- دعم الوضع المظلم والتجاوب

---

## 📝 المرحلة 8.5: صفحة Monitoring Data Entry

### 8.5.1 إنشاء `src/pages/project-workspace/monitoring/MonitoringDataEntryPage.jsx`

**الوصف:** صفحة إدخال بيانات المراقبة لكل المؤشرات.

**المكونات المستخدمة:**
- `MonitoringDataTable`
**المكونات المستخدمة:**
- `MonitoringDataTable`
- `RankingSelect`
- `Button`, `Card`, `Alert`

**الميزات المطلوبة:**
- أقسام قابلة للطي لكل فئة (Accordion اختياري)
- تحديث القيم ربع السنوية مباشرة
- حفظ التغييرات (Save)
- زر Export (Placeholder)
- دعم التمرير الأفقي للجداول

---

## 📝 المرحلة 8.6: مكونات الملفات والملحقات

### 8.6.1 إنشاء `src/components/files/FileCategoryAccordion.jsx`

**الوصف:** أكورديون لتجميع الملفات حسب `entity_type`.

### 8.6.2 إنشاء `src/components/files/FileListTable.jsx`

**الوصف:** جدول عرض الملفات.

**الأعمدة:**
- File Name
- Type
- Size
- Uploaded By
- Date
- Actions

### 8.6.3 إنشاء `src/components/files/FileRowActions.jsx`

**الوصف:** أزرار تحميل/حذف ملف.

### 8.6.4 إنشاء `src/components/files/index.js`

```javascript
export { default as FileCategoryAccordion } from './FileCategoryAccordion'
export { default as FileListTable } from './FileListTable'
export { default as FileRowActions } from './FileRowActions'
```

---

## 📝 المرحلة 8.7: صفحة Project Files

### 8.7.1 إنشاء `src/pages/project-workspace/annex/ProjectFilesPage.jsx`

**الوصف:** صفحة ملفات المشروع (حسب النوع).

**المكونات المستخدمة:**
- `FileCategoryAccordion`
- `FileListTable`
- `FileUpload` (UI)

**الميزات المطلوبة:**
- تصنيف الملفات حسب النوع (Project/Screening/Assessment/Monitoring)
- رفع ملف جديد (Mock)
- عرض تفاصيل الملف
- دعم الوضع المظلم والتجاوب

---

## 📝 المرحلة 8.8: صفحة Annex Overview

### 8.8.1 إنشاء `src/pages/project-workspace/annex/AnnexOverviewPage.jsx`

**الوصف:** صفحة ملحقات المشروع (Annex Items).

**المكونات المستخدمة:**
- `Card`
- `Table` (UI)

**الميزات المطلوبة:**
- عرض قائمة الملحقات مع الوصف
- دعم التصفح والبحث البسيط (اختياري)

---

## 📝 المرحلة 8.9: التكامل وتحديث الـ Routes والـ Barrels

### 8.9.1 تحديث `src/routes/index.jsx`
**التغييرات المطلوبة:**
- استبدال placeholders الخاصة بالـ Monitoring/Files بصفحات فعلية
- استيراد صفحات monitoring و annex من مساراتها الجديدة

### 8.9.2 تحديث `src/pages/project-workspace/index.js`

```javascript
// Monitoring
export { MonitoringOverviewPage, MonitoringDataEntryPage } from './monitoring'

// Annex & Files
export { ProjectFilesPage, AnnexOverviewPage } from './annex'
```

### 8.9.3 تحديث `src/hooks/index.js`

```javascript
export { useMonitoring } from './useMonitoring'
export { useFiles } from './useFiles'
```

---

## 📝 المرحلة 8.10: CSS/Styles للجداول

**إضافة Styles داعمة في `src/styles/index.css`:**
- Sticky header للجدول
- Scroll أفقي داخل الجداول
- تظليل صفوف عند hover

```css
.monitoring-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}
.monitoring-table thead th {
  position: sticky;
  top: 0;
  background: var(--surface);
  z-index: 10;
}
```

---

## 🧪 اختبارات التكامل

### قائمة الاختبارات
| # | الاختبار | الصفحة | الوصف |
|---|----------|--------|-------|
| 1 | Navigation | Monitoring Overview | الانتقال من Project Overview إلى Monitoring Overview |
| 2 | Category Summary | Monitoring Overview | عرض جميع الفئات A–H وعدد المؤشرات الصحيح |
| 3 | Data Entry Load | Monitoring Data Entry | تحميل الجداول حسب الفئات وربط المؤشرات |
| 4 | Update Quarter | Monitoring Data Entry | تحديث قيم Baseline/Q1-Q4 وحفظها |
| 5 | Ranking Select | Monitoring Data Entry | تغيير الـ Ranking وربطه بالصف |
| 6 | Files List | Project Files | تحميل ملفات حسب النوع (project/screening/assessment/monitoring) |
| 7 | Upload Placeholder | Project Files | زر رفع ملف يعمل (Mock) بدون أخطاء |
| 8 | Annex Load | Annex Overview | عرض قائمة الملحقات بشكل صحيح |
| 9 | Dark Mode | All | الوضع المظلم يعمل في الصفحات الأربع |
| 10 | Responsive | All | الجداول قابلة للتمرير أفقيًا على الشاشات الصغيرة |

---

## ✅ قائمة المراجعة النهائية

### ملفات البيانات
- [ ] `src/data/mockMonitoringRecords.js`
- [ ] `src/data/mockAttachments.js`
- [ ] `src/data/mockAnnexItems.js`
- [ ] تحديث `src/data/index.js`

### Hooks
- [ ] `src/hooks/useMonitoring.js`
- [ ] `src/hooks/useFiles.js`
- [ ] تحديث `src/hooks/index.js`

### Components
- [ ] `src/components/monitoring/*`
- [ ] `src/components/files/*`

### Pages
- [ ] `src/pages/project-workspace/monitoring/MonitoringOverviewPage.jsx`
- [ ] `src/pages/project-workspace/monitoring/MonitoringDataEntryPage.jsx`
- [ ] `src/pages/project-workspace/annex/ProjectFilesPage.jsx`
- [ ] `src/pages/project-workspace/annex/AnnexOverviewPage.jsx`
- [ ] تحديث `src/pages/project-workspace/index.js`

### Routes
- [ ] تحديث `src/routes/index.jsx`
- [ ] التحقق من الالتزام بـ `frontend/documents/STYLE_GUIDE.md`

---
## معايير الجودة
- [ ] جميع الصفحات تدعم Dark Mode
- [ ] جميع الصفحات Responsive
- [ ] جميع النماذج لها Form Validation
- [ ] جميع الصفحات لها Loading States
- [ ] جميع الصفحات لها Error States
- [ ] `npm run build` يعمل بدون أخطاء
- [ ] `npm run lint` يعمل بدون أخطاء
---

## 📊 ملخص المخرجات

| المقياس | العدد |
|---------|-------|
| **صفحات جديدة** | 4 |
| **مكونات جديدة** | 9 |
| **ملفات بيانات** | 3 |
| **Hooks** | 2 |
| **ملفات تحديث** | 4 |
| **إجمالي الملفات** | 22 |

---

## 📝 ملاحظات مهمة

### 1. استخدام impactIndicators
- `impactIndicators.js` هو المصدر الأساسي لمؤشرات المراقبة
- يتم تجميع المؤشرات حسب `code` وربطها بـ `impactCategories`

### 2. Ranking Logic
- يتم استخدام نفس قيم `impactLevels` (negligible/low/medium/high/not_applicable)
- يمكن ترك الحساب Manual في البداية ثم إضافة Auto-calc لاحقاً

### 3. Export 
- التصدير يمكن تنفيذهما لاحقاً، مع إبقاء زر Placeholder

---

*Document created: February 3, 2026*  
*Author: Architect Agent*  
*Version: 1.0*

