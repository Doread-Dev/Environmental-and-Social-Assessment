# Phase 8: Monitoring & Files
## خطة تنفيذ تفصيلية
## تاريخ الإنشاء: 31 يناير 2026

---

## 📋 نظرة عامة

### الأهداف الرئيسية
- إنشاء صفحة نظرة عامة على المراقبة (Monitoring Overview)
- إنشاء صفحة إدخال بيانات المراقبة (Monitoring Data Entry)
- إنشاء صفحة ملفات المشروع (Project Files & Records)
- إنشاء صفحة المرفقات والملاحق (Annex Overview)
- بناء مكونات المراقبة والملفات

### المتطلبات المُسبقة
- ✅ Phase 1: Project Setup & Build Pipeline (مكتمل)
- ✅ Phase 2: Component Library - UI Kit (مكتمل)
- ✅ Phase 3: Layout Components & Routing (مكتمل)
- ✅ Phase 4: Auth & Dashboard Domain (مكتمل)
- ✅ Phase 5: Project Workspace — Overview & Screening (مكتمل)
- ✅ Phase 6: Project Workspace — Assessment (مكتمل)
- ✅ Phase 7: Project Workspace — SEMP (مكتمل)

### الملفات المرجعية (Static HTML)
| الملف | الصفحة المقابلة |
|-------|-----------------|
| `20.Monitoring Overview.html` | `MonitoringOverviewPage.jsx` |
| `21.Monitoring Data Entry.html` | `MonitoringDataEntryPage.jsx` |
| `22.Project Files and Records.html` | `ProjectFilesPage.jsx` |
| `23.Annex and Attachments Overview.html` | `AnnexOverviewPage.jsx` |

---

## 📁 هيكل الملفات المطلوب إنشاؤها

```
src/
├── pages/
│   └── project-workspace/
│       ├── monitoring/
│       │   ├── MonitoringOverviewPage.jsx    ← جديد
│       │   ├── MonitoringDataEntryPage.jsx   ← جديد
│       │   └── index.js                      ← جديد (barrel export)
│       │
│       └── annex/
│           ├── ProjectFilesPage.jsx          ← جديد
│           ├── AnnexOverviewPage.jsx         ← جديد
│           └── index.js                      ← جديد
│
├── components/
│   ├── monitoring/                           ← مجلد جديد
│   │   ├── MonitoringStatusCard.jsx          ← جديد
│   │   ├── MonitoringTimeline.jsx            ← جديد
│   │   ├── MonitoringCategoryCard.jsx        ← جديد
│   │   ├── MonitoringAccordion.jsx           ← جديد
│   │   ├── MonitoringDataTable.jsx           ← جديد
│   │   ├── QuarterInput.jsx                  ← جديد
│   │   ├── RankingSelect.jsx                 ← جديد
│   │   └── index.js                          ← جديد
│   │
│   └── files/                                ← مجلد جديد
│       ├── FileCategoryAccordion.jsx         ← جديد
│       ├── FileListTable.jsx                 ← جديد
│       ├── FileUploadButton.jsx              ← جديد
│       ├── FileStatusBadge.jsx               ← جديد
│       ├── AnnexReferenceTable.jsx           ← جديد
│       └── index.js                          ← جديد
│
├── data/
│   ├── mockMonitoringRecords.js              ← جديد
│   ├── mockProjectFiles.js                   ← جديد
│   ├── monitoringCategories.js               ← جديد
│   └── fileCategories.js                     ← جديد
│
└── hooks/
    ├── useMonitoring.js                      ← جديد
    └── useProjectFiles.js                    ← جديد
```

---

## 🔢 ترتيب التنفيذ

| المرحلة | الوصف | عدد الملفات |
|---------|-------|-------------|
| 8.1 | Mock Data للمراقبة والملفات | 4 |
| 8.2 | Hooks لإدارة الحالة | 2 |
| 8.3 | مكونات المراقبة | 8 |
| 8.4 | مكونات الملفات | 6 |
| 8.5 | صفحة MonitoringOverviewPage | 2 |
| 8.6 | صفحة MonitoringDataEntryPage | 1 |
| 8.7 | صفحة ProjectFilesPage | 2 |
| 8.8 | صفحة AnnexOverviewPage | 1 |
| 8.9 | التكامل وتحديث Routes | 2 |

---

## 📝 المرحلة 8.1: Mock Data

### 8.1.1 إنشاء `src/data/monitoringCategories.js`

**الوصف:** تعريف فئات المراقبة (8 فئات)

```javascript
/**
 * Monitoring Categories
 * فئات المراقبة البيئية والاجتماعية
 * متوافق مع impactIndicators.js
 */

export const monitoringCategories = [
  {
    code: 'A',
    name: 'Air Quality',
    icon: 'air',
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-600 dark:text-blue-400'
  },
  {
    code: 'B',
    name: 'Water Quality',
    icon: 'water_drop',
    iconBg: 'bg-cyan-50 dark:bg-cyan-900/20',
    iconColor: 'text-cyan-600 dark:text-cyan-400'
  },
  {
    code: 'C',
    name: 'Noise Levels',
    icon: 'graphic_eq',
    iconBg: 'bg-purple-50 dark:bg-purple-900/20',
    iconColor: 'text-purple-600 dark:text-purple-400'
  },
  {
    code: 'D',
    name: 'Solid Waste',
    icon: 'recycling',
    iconBg: 'bg-orange-50 dark:bg-orange-900/20',
    iconColor: 'text-orange-600 dark:text-orange-400'
  },
  {
    code: 'E',
    name: 'Radiation',
    icon: 'speed',
    iconBg: 'bg-red-50 dark:bg-red-900/20',
    iconColor: 'text-red-600 dark:text-red-400'
  },
  {
    code: 'F',
    name: 'Toxic Materials',
    icon: 'science',
    iconBg: 'bg-amber-50 dark:bg-amber-900/20',
    iconColor: 'text-amber-600 dark:text-amber-400'
  },
  {
    code: 'J',
    name: 'Plants & Wildlife',
    icon: 'forest',
    iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400'
  },
  {
    code: 'H',
    name: 'Land Use & Community',
    icon: 'landscape',
    iconBg: 'bg-teal-50 dark:bg-teal-900/20',
    iconColor: 'text-teal-600 dark:text-teal-400'
  }
]

export function getCategoryByCode(code) {
  return monitoringCategories.find(c => c.code === code)
}
```

### 8.1.2 إنشاء `src/data/mockMonitoringRecords.js`

**الوصف:** بيانات سجلات المراقبة الوهمية

**الهيكل المتوافق مع Backend:**
```javascript
/**
 * Mock Monitoring Records
 * متوافق مع backend/src/models/monitoringRecord.model.js
 */

// بنية السجل:
// {
//   _id: string,
//   project: ObjectId,
//   indicator: { name, definition, measurement, category_code },
//   scores: { baseline, Q1, Q2, Q3, Q4 },
//   total: string,
//   final_assessment: string,
//   ranking: 'negligible' | 'low' | 'medium' | 'high' | 'not_applicable',
//   responsible: ObjectId,
//   note: string
// }
```

**المحتوى:**
- بيانات مراقبة لـ 3-4 مشاريع
- 24 مؤشر (3 لكل فئة)
- قيم baseline و Q1/Q2/Q3/Q4 لبعض السجلات
- حساب Total و Ranking

### 8.1.3 إنشاء `src/data/fileCategories.js`

**الوصف:** تعريف فئات الملفات

```javascript
/**
 * File Categories for Project Files
 */

export const fileCategories = [
  {
    id: 'legal',
    name: 'Project Legal Register',
    description: 'Permits, licenses, and legal compliance docs',
    icon: 'gavel',
    required: true
  },
  {
    id: 'semp',
    name: 'Project Social & Environmental Management Plan',
    description: 'SEMP + Annexes',
    icon: 'eco',
    required: true
  },
  {
    id: 'waste',
    name: 'Waste management plan & records',
    description: 'Waste disposal and management documentation',
    icon: 'recycling',
    required: false
  },
  {
    id: 'hse',
    name: 'Quarterly HSE Reports',
    description: 'Health, Safety, and Environment reports',
    icon: 'health_and_safety',
    required: true
  },
  {
    id: 'incident',
    name: 'Incident & near-miss investigation reports',
    description: 'Incident documentation and investigations',
    icon: 'warning',
    required: false
  },
  {
    id: 'training',
    name: 'Training & toolbox talks records',
    description: 'Training documentation and records',
    icon: 'school',
    required: false
  }
]
```

### 8.1.4 إنشاء `src/data/mockProjectFiles.js`

**الوصف:** بيانات ملفات المشروع الوهمية

**الهيكل المتوافق مع Backend (attachment.model.js):**
```javascript
// {
//   _id: string,
//   entity_type: 'project' | 'screening' | 'assessment' | 'monitoring',
//   entity_id: ObjectId,
//   category: string (من fileCategories),
//   file_name: string,
//   file_path: string,
//   file_type: string (pdf, docx, xlsx),
//   file_size: number (bytes),
//   uploaded_by: ObjectId,
//   createdAt: Date
// }
```

### 8.1.5 تحديث `src/data/index.js`

إضافة التصديرات الجديدة:
```javascript
// Monitoring Data
export * from './monitoringCategories'
export * from './mockMonitoringRecords'

// Files Data
export * from './fileCategories'
export * from './mockProjectFiles'
```

---

## 📝 المرحلة 8.2: Hooks لإدارة الحالة

### 8.2.1 إنشاء `src/hooks/useMonitoring.js`

**الوصف:** Hook لإدارة بيانات المراقبة

**الدوال المطلوبة:**
```javascript
export function useMonitoring(projectId) {
  return {
    // Data
    records,              // سجلات المراقبة
    categories,           // الفئات مع الإحصائيات
    isLoading,
    isSaving,
    error,
    
    // Status
    baselineStatus,       // 'entered' | 'not_entered'
    quartersRecorded,     // عدد الأرباع المسجلة
    currentQuarter,       // الربع الحالي للإدخال
    
    // Actions
    updateRecord,         // تحديث سجل واحد
    saveRecords,          // حفظ جميع السجلات
    addQuarter,           // إضافة ربع جديد
    
    // Calculations
    getCategoryScore,     // الحصول على مجموع الفئة
    getCategoryRanking,   // الحصول على ترتيب الفئة
    getTotalScore,        // المجموع الكلي
  }
}
```

**Logic خاص بالـ Ranking:**
```javascript
const rankingConfig = {
  negligible: { label: 'Negligible', color: 'gray', threshold: 0 },
  low: { label: 'Low', color: 'green', threshold: 20 },
  medium: { label: 'Medium', color: 'amber', threshold: 50 },
  high: { label: 'High', color: 'red', threshold: 80 }
}
```

### 8.2.2 إنشاء `src/hooks/useProjectFiles.js`

**الوصف:** Hook لإدارة ملفات المشروع

**الدوال المطلوبة:**
```javascript
export function useProjectFiles(projectId) {
  return {
    // Data
    files,                // جميع الملفات
    categories,           // الفئات مع عدد الملفات
    isLoading,
    isUploading,
    error,
    
    // Actions
    uploadFile,           // رفع ملف جديد
    deleteFile,           // حذف ملف
    replaceFile,          // استبدال ملف
    downloadFile,         // تحميل ملف
    
    // Filters
    filterByCategory,     // تصفية حسب الفئة
    searchFiles,          // البحث في الملفات
    
    // Status
    getFilesByCategory,   // الحصول على ملفات فئة
    getCategoryStatus,    // 'available' | 'missing'
  }
}
```

### 8.2.3 تحديث `src/hooks/index.js`

```javascript
export { useMonitoring } from './useMonitoring'
export { useProjectFiles } from './useProjectFiles'
```

---

## 📝 المرحلة 8.3: مكونات المراقبة

### 8.3.1 إنشاء `src/components/monitoring/MonitoringStatusCard.jsx`

**الوصف:** بطاقة حالة المراقبة (Baseline + Quarters)

**من HTML المرجعي:** 20.Monitoring Overview.html (السطور 179-263)

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `baselineStatus` | 'entered' \| 'not_entered' | ✅ | حالة الـ Baseline |
| `quartersRecorded` | number | ✅ | عدد الأرباع المسجلة |
| `currentQuarter` | number | ❌ | الربع الحالي |

**الميزات:**
- عرض حالة Baseline (✓ أو ⏳)
- عرض تقدم الأرباع (Q1-Q4)
- خط زمني مع ألوان الحالة

### 8.3.2 إنشاء `src/components/monitoring/MonitoringTimeline.jsx`

**الوصف:** الخط الزمني للأرباع (Baseline → Q1 → Q2 → Q3 → Q4)

**التصميم:**
```jsx
// الحالات الممكنة لكل خطوة:
// 1. completed: دائرة خضراء مع ✓
// 2. current: دائرة زرقاء مع !
// 3. pending: دائرة رمادية مع النص
```

### 8.3.3 إنشاء `src/components/monitoring/MonitoringCategoryCard.jsx`

**الوصف:** بطاقة فئة المراقبة (مثل Air Quality, Water Quality...)

**من HTML المرجعي:** 20.Monitoring Overview.html (السطور 268-428)

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `category` | object | ✅ | بيانات الفئة |
| `totalScore` | number \| null | ✅ | المجموع الكلي |
| `ranking` | string | ✅ | الترتيب |
| `onClick` | function | ❌ | callback عند النقر |

**الميزات:**
- أيقونة ملونة حسب الفئة
- عرض Total Score كبير
- شارة Ranking (Low/Medium/High/N/A)
- تأثير hover

### 8.3.4 إنشاء `src/components/monitoring/MonitoringAccordion.jsx`

**الوصف:** أكورديون قسم المراقبة (قابل للطي)

**من HTML المرجعي:** 21.Monitoring Data Entry.html (السطور 192-329)

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `category` | object | ✅ | بيانات الفئة |
| `currentRanking` | string | ✅ | الترتيب الحالي |
| `isExpanded` | boolean | ✅ | هل مفتوح |
| `onToggle` | function | ✅ | callback للتبديل |
| `children` | ReactNode | ✅ | المحتوى |

**الميزات:**
- Header مع أيقونة وعنوان وترتيب
- زر توسيع/طي
- انيميشن سلس

### 8.3.5 إنشاء `src/components/monitoring/MonitoringDataTable.jsx`

**الوصف:** جدول بيانات المراقبة

**من HTML المرجعي:** 21.Monitoring Data Entry.html (السطور 210-322)

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `records` | array | ✅ | سجلات المؤشرات |
| `quarters` | array | ✅ | الأرباع المتاحة |
| `currentQuarter` | string | ❌ | الربع الحالي للإدخال |
| `onUpdateRecord` | function | ✅ | callback للتحديث |
| `readOnly` | boolean | ❌ | وضع القراءة فقط |

**الأعمدة:**
1. Indicator Definition (sticky)
2. Measurement Method
3. Baseline
4. Q1, Q2, Q3, Q4 (حسب المتاح)
5. Total
6. Score/Variance
7. Ranking (Select)
8. Responsibility (Select)
9. Notes

**الميزات:**
- Sticky column للـ Indicator
- تمييز عمود الربع الحالي
- Horizontal scroll
- صفوف متناوبة الألوان

### 8.3.6 إنشاء `src/components/monitoring/QuarterInput.jsx`

**الوصف:** Input لقيمة الربع

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `value` | string | ❌ | القيمة |
| `onChange` | function | ✅ | callback للتغيير |
| `isCurrent` | boolean | ❌ | هل هذا الربع الحالي |
| `disabled` | boolean | ❌ | معطل |

**الميزات:**
- تصميم خاص للربع الحالي (حدود خضراء)
- محاذاة للوسط
- رقمي فقط

### 8.3.7 إنشاء `src/components/monitoring/RankingSelect.jsx`

**الوصف:** Select للترتيب (Low/Medium/High/N/A)

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `value` | string | ❌ | القيمة المختارة |
| `onChange` | function | ✅ | callback للتغيير |
| `disabled` | boolean | ❌ | معطل |

**الخيارات:**
- `negligible` → Negligible
- `low` → Low
- `medium` → Medium
- `high` → High
- `not_applicable` → N/A

### 8.3.8 إنشاء `src/components/monitoring/index.js`

```javascript
export { default as MonitoringStatusCard } from './MonitoringStatusCard'
export { default as MonitoringTimeline } from './MonitoringTimeline'
export { default as MonitoringCategoryCard } from './MonitoringCategoryCard'
export { default as MonitoringAccordion } from './MonitoringAccordion'
export { default as MonitoringDataTable } from './MonitoringDataTable'
export { default as QuarterInput } from './QuarterInput'
export { default as RankingSelect } from './RankingSelect'
```

---

## 📝 المرحلة 8.4: مكونات الملفات

### 8.4.1 إنشاء `src/components/files/FileCategoryAccordion.jsx`

**الوصف:** أكورديون فئة الملفات

**من HTML المرجعي:** 22.Project Files and Records.html (السطور 221-316)

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `category` | object | ✅ | بيانات الفئة |
| `files` | array | ✅ | قائمة الملفات |
| `status` | 'available' \| 'missing' | ✅ | الحالة |
| `isExpanded` | boolean | ✅ | هل مفتوح |
| `onToggle` | function | ✅ | callback للتبديل |

**الميزات:**
- Header مع أيقونة ووصف
- شارة Available/Missing
- عدد الملفات
- جدول الملفات عند الفتح

### 8.4.2 إنشاء `src/components/files/FileListTable.jsx`

**الوصف:** جدول قائمة الملفات

**من HTML المرجعي:** 22.Project Files and Records.html (السطور 240-315)

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `files` | array | ✅ | قائمة الملفات |
| `onDownload` | function | ✅ | callback للتحميل |
| `onReplace` | function | ❌ | callback للاستبدال |
| `onDelete` | function | ❌ | callback للحذف |

**الأعمدة:**
1. File Name (مع أيقونة حسب النوع + الحجم)
2. Date Uploaded
3. Uploaded By
4. Actions (Download, Replace, Delete)

**أيقونات أنواع الملفات:**
- PDF → `picture_as_pdf` (أحمر)
- DOCX → `description` (أزرق)
- XLSX → `table_chart` (أخضر)
- أخرى → `insert_drive_file` (رمادي)

### 8.4.3 إنشاء `src/components/files/FileUploadButton.jsx`

**الوصف:** زر رفع الملفات

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onUpload` | function | ✅ | callback عند الرفع |
| `accept` | string | ❌ | أنواع الملفات المقبولة |
| `disabled` | boolean | ❌ | معطل |

### 8.4.4 إنشاء `src/components/files/FileStatusBadge.jsx`

**الوصف:** شارة حالة الملفات

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `status` | 'available' \| 'missing' | ✅ | الحالة |
| `count` | number | ❌ | عدد الملفات |

### 8.4.5 إنشاء `src/components/files/AnnexReferenceTable.jsx`

**الوصف:** جدول المراجع في صفحة Annex

**من HTML المرجعي:** 23.Annex and Attachments Overview.html (السطور 192-284)

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | string | ✅ | عنوان الجدول |
| `source` | string | ✅ | المصدر |
| `items` | array | ✅ | عناصر الجدول |

**هيكل العنصر:**
```javascript
{
  title: string,
  description: string,
  examples: string[] | { columns: string[][] }
}
```

### 8.4.6 إنشاء `src/components/files/index.js`

```javascript
export { default as FileCategoryAccordion } from './FileCategoryAccordion'
export { default as FileListTable } from './FileListTable'
export { default as FileUploadButton } from './FileUploadButton'
export { default as FileStatusBadge } from './FileStatusBadge'
export { default as AnnexReferenceTable } from './AnnexReferenceTable'
```

---

## 📝 المرحلة 8.5: صفحة MonitoringOverviewPage

### 8.5.1 إنشاء `src/pages/project-workspace/monitoring/MonitoringOverviewPage.jsx`

**الوصف:** صفحة نظرة عامة على المراقبة (Tool 5)

**من HTML المرجعي:** 20.Monitoring Overview.html

**الهيكل:**
```jsx
<>
  {/* Header */}
  <div className="flex justify-between items-center">
    <div>
      <h1>Environmental & Social Monitoring</h1>
      <p>Tool 5 – Monitoring and Evaluation</p>
    </div>
    <div className="flex gap-3">
      <Button>Enter / Edit Monitoring Data</Button>
      <Button variant="outline">Export Excel</Button>
    </div>
  </div>

  {/* Status Card */}
  <MonitoringStatusCard
    baselineStatus={baselineStatus}
    quartersRecorded={quartersRecorded}
  />

  {/* Category Grid */}
  <section>
    <h3>Monitoring Scope Summary</h3>
    <div className="grid grid-cols-4">
      {categories.map(cat => (
        <MonitoringCategoryCard key={cat.code} {...cat} />
      ))}
    </div>
  </section>
</>
```

**الميزات:**
- زر الانتقال لصفحة إدخال البيانات
- زر تصدير Excel
- عرض حالة الـ Baseline والأرباع
- شبكة 4 أعمدة لبطاقات الفئات (8 فئات)

### 8.5.2 إنشاء `src/pages/project-workspace/monitoring/index.js`

```javascript
export { default as MonitoringOverviewPage } from './MonitoringOverviewPage'
export { default as MonitoringDataEntryPage } from './MonitoringDataEntryPage'
```

---

## 📝 المرحلة 8.6: صفحة MonitoringDataEntryPage

### 8.6.1 إنشاء `src/pages/project-workspace/monitoring/MonitoringDataEntryPage.jsx`

**الوصف:** صفحة إدخال بيانات المراقبة

**من HTML المرجعي:** 21.Monitoring Data Entry.html

**الهيكل:**
```jsx
<>
  {/* Header */}
  <div className="flex justify-between">
    <div>
      <h1>Monitoring Data Entry</h1>
      <p>Enter and review cumulative environmental and social monitoring data</p>
    </div>
    <div className="flex gap-3">
      <Button variant="outline">Cancel</Button>
      <Button>Save</Button>
      <Divider />
      <Button variant="outline">Add New Quarter</Button>
    </div>
  </div>

  {/* Categories Accordions */}
  {categories.map(cat => (
    <MonitoringAccordion
      key={cat.code}
      category={cat}
      isExpanded={expandedCategories.includes(cat.code)}
      onToggle={() => toggleCategory(cat.code)}
    >
      <MonitoringDataTable
        records={getRecordsByCategory(cat.code)}
        quarters={availableQuarters}
        currentQuarter={currentQuarter}
        onUpdateRecord={handleUpdateRecord}
      />
    </MonitoringAccordion>
  ))}
</>
```

**الميزات:**
- أزرار Save وCancel وAdd New Quarter
- 8 أقسام قابلة للطي (فئة لكل قسم)
- جدول بيانات لكل فئة مع 3 مؤشرات
- إدخال قيم الأرباع
- اختيار Ranking والمسؤول
- ملاحظات

---

## 📝 المرحلة 8.7: صفحة ProjectFilesPage

### 8.7.1 إنشاء `src/pages/project-workspace/annex/ProjectFilesPage.jsx`

**الوصف:** صفحة ملفات وسجلات المشروع

**من HTML المرجعي:** 22.Project Files and Records.html

**الهيكل:**
```jsx
<>
  {/* Header */}
  <div className="flex justify-between">
    <div>
      <h1>Project Files & Records</h1>
      <p>Central repository for all project documents</p>
    </div>
  </div>

  {/* Info Banner */}
  <Alert variant="info">
    <h3>Audit Readiness</h3>
    <p>This repository supports environmental and social assessments...</p>
  </Alert>

  {/* Search & Filter Bar */}
  <div className="flex gap-3">
    <Input placeholder="Search by file name..." icon="search" />
    <Select options={categoryOptions} />
    <FileUploadButton onUpload={handleUpload} />
  </div>

  {/* File Categories */}
  {categories.map(cat => (
    <FileCategoryAccordion
      key={cat.id}
      category={cat}
      files={getFilesByCategory(cat.id)}
      status={getCategoryStatus(cat.id)}
      isExpanded={expandedCategories.includes(cat.id)}
      onToggle={() => toggleCategory(cat.id)}
    />
  ))}
</>
```

**الميزات:**
- البحث في الملفات
- تصفية حسب الفئة
- زر رفع الملفات
- 6 فئات ملفات
- عرض Available/Missing
- جدول الملفات مع Actions

### 8.7.2 إنشاء `src/pages/project-workspace/annex/index.js`

```javascript
export { default as ProjectFilesPage } from './ProjectFilesPage'
export { default as AnnexOverviewPage } from './AnnexOverviewPage'
```

---

## 📝 المرحلة 8.8: صفحة AnnexOverviewPage

### 8.8.1 إنشاء `src/pages/project-workspace/annex/AnnexOverviewPage.jsx`

**الوصف:** صفحة نظرة عامة على الملاحق والمرفقات

**من HTML المرجعي:** 23.Annex and Attachments Overview.html

**الهيكل:**
```jsx
<>
  {/* Reference Table */}
  <AnnexReferenceTable
    title="Reference: Climate Change Resilience Examples"
    source="AGA KHAN FOUNDATION - SYRIA"
    items={annexItems}
  />
</>
```

**البيانات الثابتة (من HTML):**
1. High quality Infrastructure
2. Modified infrastructure
3. Nature-based solutions
4. Climate-smart agriculture / Regenerative farming

**ملاحظة:** هذه الصفحة تعرض محتوى مرجعي ثابت (Reference Material)

---

## 📝 المرحلة 8.9: التكامل وتحديث Routes

### 8.9.1 تحديث `src/routes/index.jsx`

**الخطوات:**
1. استيراد الصفحات الجديدة بدلاً من Placeholders
2. تحديث المسارات لاستخدام المكونات الفعلية

```jsx
// إزالة placeholders
// const MonitoringOverviewPage = () => ...
// const MonitoringDataEntryPage = () => ...
// const ProjectFilesPage = () => ...
// const AnnexOverviewPage = () => ...

// إضافة imports
import {
  MonitoringOverviewPage,
  MonitoringDataEntryPage
} from '@/pages/project-workspace/monitoring'

import {
  ProjectFilesPage,
  AnnexOverviewPage
} from '@/pages/project-workspace/annex'
```

### 8.9.2 تحديث `src/pages/project-workspace/index.js`

إضافة التصديرات الجديدة:
```javascript
// Monitoring
export * from './monitoring'

// Annex
export * from './annex'
```

---

## 📊 ملخص الملفات

| الفئة | عدد الملفات | الملفات |
|-------|-------------|---------|
| **Data** | 4 | monitoringCategories, mockMonitoringRecords, fileCategories, mockProjectFiles |
| **Hooks** | 2 | useMonitoring, useProjectFiles |
| **Monitoring Components** | 8 | MonitoringStatusCard, MonitoringTimeline, MonitoringCategoryCard, MonitoringAccordion, MonitoringDataTable, QuarterInput, RankingSelect, index |
| **Files Components** | 6 | FileCategoryAccordion, FileListTable, FileUploadButton, FileStatusBadge, AnnexReferenceTable, index |
| **Pages** | 4 | MonitoringOverviewPage, MonitoringDataEntryPage, ProjectFilesPage, AnnexOverviewPage |
| **Barrels** | 2 | monitoring/index, annex/index |
| **المجموع** | **26** | |

---

## ✅ معايير القبول

### الوظيفية
- [ ] MonitoringOverviewPage يعرض حالة الـ Baseline والأرباع
- [ ] MonitoringOverviewPage يعرض 8 بطاقات فئات
- [ ] MonitoringDataEntryPage يعرض 8 أقسام قابلة للطي
- [ ] MonitoringDataEntryPage يسمح بإدخال البيانات للربع الحالي
- [ ] MonitoringDataEntryPage يحفظ البيانات
- [ ] ProjectFilesPage يعرض 6 فئات ملفات
- [ ] ProjectFilesPage يسمح بالبحث والتصفية
- [ ] ProjectFilesPage يعرض ملفات كل فئة
- [ ] AnnexOverviewPage يعرض جدول المراجع

### التصميم
- [ ] متوافق مع STYLE_GUIDE.md
- [ ] Dark Mode يعمل صحيحاً
- [ ] Responsive للموبايل والتابلت
- [ ] الأيقونات من Material Symbols
- [ ] الألوان من Design Tokens

### التقنية
- [ ] لا أخطاء في Console
- [ ] ESLint نظيف
- [ ] البيانات متوافقة مع Backend Models
- [ ] استخدام cn() لدمج Classes

---

## 📝 ملاحظات تنفيذية

### 1. جدول المراقبة (MonitoringDataTable)
- استخدم `sticky left-0` للعمود الأول
- أضف `overflow-x-auto` للحاوية
- استخدم `custom-scrollbar` CSS

### 2. حساب Ranking
```javascript
const calculateRanking = (total) => {
  if (total >= 80) return 'high'
  if (total >= 50) return 'medium'
  if (total >= 20) return 'low'
  if (total > 0) return 'negligible'
  return 'not_applicable'
}
```

### 3. أنواع الملفات
```javascript
const getFileIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'pdf': return { icon: 'picture_as_pdf', color: 'text-red-500' }
    case 'docx':
    case 'doc': return { icon: 'description', color: 'text-blue-500' }
    case 'xlsx':
    case 'xls': return { icon: 'table_chart', color: 'text-green-500' }
    default: return { icon: 'insert_drive_file', color: 'text-gray-500' }
  }
}
```

### 4. تنسيق حجم الملف
```javascript
const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}
```

---

## 🔄 بعد إكمال Phase 8

1. تحديث MASTER_PLAN.md:
   - تغيير Phase 8 من `[ ]` إلى `[x]`
   - تحديث Final Output Metrics

2. إنشاء PHASE_8_REVIEW.md للمراجعة

3. الانتقال إلى Phase 9: QA & Consistency

---

*Document created: January 31, 2026*
*Author: Architect Agent*
