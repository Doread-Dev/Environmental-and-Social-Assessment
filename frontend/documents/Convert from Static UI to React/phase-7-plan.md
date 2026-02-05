# Phase 7: Project Workspace — SEMP (Tools 3 & 4)
## خطة تنفيذ تفصيلية
## تاريخ الإنشاء: 31 يناير 2026

---

## 📋 نظرة عامة

### الأهداف الرئيسية
- إنشاء صفحة نظرة عامة على SEMP (SEMP Overview)
- إنشاء صفحة جدول أنشطة الإدارة (Management Activities Table - Tool 3)
- إنشاء صفحة خطة التخفيف والتعزيز (Mitigation Plan - Tool 4)
- بناء مكونات الجداول القابلة للتعديل (Excel-like Tables)

### المتطلبات المُسبقة
- ✅ Phase 1: Project Setup & Build Pipeline (مكتمل)
- ✅ Phase 2: Component Library - UI Kit (مكتمل)
- ✅ Phase 3: Layout Components & Routing (مكتمل)
- ✅ Phase 4: Auth & Dashboard Domain (مكتمل)
- ✅ Phase 5: Project Workspace — Overview & Screening (مكتمل)
- ✅ Phase 6: Project Workspace — Assessment (مكتمل)

### الملفات المرجعية (Static HTML)
| الملف | الصفحة المقابلة |
|-------|-----------------|
| `16.ESM Plan Overview.html` | `SempOverviewPage.jsx` |
| `17.Management Activities Table.html` | `ManagementActivitiesPage.jsx` |
| `18.Impact Mitigation and Enhancement Plan.html` | `MitigationPlanPage.jsx` |

### Backend Model References

#### ManagementActivity Model (`backend/src/models/managementActivity.model.js`)
```javascript
{
  project: ObjectId (ref: 'Project'),           // المشروع
  serial_number: Number,                         // الرقم التسلسلي
  activity_description: String (required),       // وصف النشاط
  potential_impact: String,                      // التأثير المحتمل (نص حر)
  recommended_actions: Mixed,                    // الإجراءات الموصى بها (string أو array)
  monitoring_requirements: String,               // متطلبات المراقبة
  responsible: ObjectId (ref: 'User'),          // المسؤول
  notes: String                                  // ملاحظات
}
```

#### MitigationPlan Model (`backend/src/models/mitigationPlan.model.js`)
```javascript
{
  project: ObjectId (ref: 'Project'),           // المشروع
  serial_number: Number,                         // الرقم التسلسلي
  output_description: String (required),         // وصف النشاط/المخرج
  potential_impact_and_significance: String,     // التأثير المحتمل والأهمية
  mitigation_and_enhancement_measures: String,   // إجراءات التخفيف والتعزيز
  monitoring: String,                            // المراقبة
  schedule: String,                              // الجدول الزمني
  responsible: ObjectId (ref: 'User'),          // المسؤول
  notes: String                                  // ملاحظات
}
```

---

## 📁 هيكل الملفات المطلوب إنشاؤها

```
src/
├── pages/
│   └── project-workspace/
│       └── semp/
│           ├── SempOverviewPage.jsx            ← جديد
│           ├── ManagementActivitiesPage.jsx    ← جديد
│           ├── MitigationPlanPage.jsx          ← جديد
│           ├── SempRouter.jsx                  ← جديد (توجيه ذكي - اختياري)
│           └── index.js                        ← جديد (barrel export)
│
├── components/
│   └── semp/                                   ← مجلد جديد
│       ├── SempToolCard.jsx                    ← جديد
│       ├── SempStatusBadge.jsx                 ← جديد
│       ├── SempCTABanner.jsx                   ← جديد
│       ├── EditableTable.jsx                   ← جديد (مكون جدول قابل للتعديل)
│       ├── EditableCell.jsx                    ← جديد (خلية قابلة للتعديل)
│       ├── TableRowActions.jsx                 ← جديد (أزرار الصف)
│       ├── ResponsibleSelect.jsx               ← جديد (محدد المسؤول)
│       ├── ManagementActivitiesTable.jsx       ← جديد
│       ├── MitigationPlanTable.jsx             ← جديد
│       └── index.js                            ← جديد
│
├── data/
│   ├── mockManagementActivities.js             ← جديد
│   └── mockMitigationPlans.js                  ← جديد
│
└── hooks/
    └── useSemp.js                              ← جديد (إدارة حالة SEMP)
```

---

## 🔢 ترتيب التنفيذ

| المرحلة | الوصف | عدد الملفات |
|---------|-------|-------------|
| 7.1 | Mock Data للـ SEMP | 2 |
| 7.2 | Hook لإدارة حالة SEMP | 1 |
| 7.3 | مكونات SEMP الأساسية | 4 |
| 7.4 | مكونات الجداول القابلة للتعديل | 5 |
| 7.5 | صفحة نظرة عامة على SEMP | 2 |
| 7.6 | صفحة أنشطة الإدارة (Tool 3) | 1 |
| 7.7 | صفحة خطة التخفيف (Tool 4) | 1 |
| 7.8 | التكامل وتحديث الـ Routes | 2 |

---

## 📝 المرحلة 7.1: Mock Data للـ SEMP

### 7.1.1 إنشاء ملف `src/data/mockManagementActivities.js`

**الوصف:** بيانات أنشطة الإدارة الوهمية

```javascript
/**
 * Mock Management Activities Data
 * متوافق مع backend/src/models/managementActivity.model.js
 */

export const mockManagementActivities = [
  // Project: Water Sanitation Phase II (507f1f77bcf86cd799439011)
  {
    _id: 'ma_001',
    project: '507f1f77bcf86cd799439011',
    serial_number: 1,
    activity_description: 'Construction site clearing near wetlands',
    potential_impact: 'Wetlands Disturbance (High)',
    recommended_actions: 'Install silt fences and sedimentation ponds immediately.',
    monitoring_requirements: 'Daily visual inspection',
    responsible: '507f1f77bcf86cd799439001', // Sarah Jenkins
    notes: 'Pending permit',
    createdAt: '2024-01-25T10:00:00.000Z',
    updatedAt: '2024-01-25T10:00:00.000Z'
  },
  {
    _id: 'ma_002',
    project: '507f1f77bcf86cd799439011',
    serial_number: 2,
    activity_description: 'Excavation for water pipeline installation',
    potential_impact: 'Soil Erosion (Medium)',
    recommended_actions: '1. Use erosion control blankets\n2. Restore topsoil after installation',
    monitoring_requirements: 'Weekly site inspection',
    responsible: '507f1f77bcf86cd799439003', // Maria Santos
    notes: '',
    createdAt: '2024-01-26T10:00:00.000Z',
    updatedAt: '2024-01-26T10:00:00.000Z'
  },
  // Project: Reforestation Initiative (507f1f77bcf86cd799439013)
  {
    _id: 'ma_003',
    project: '507f1f77bcf86cd799439013',
    serial_number: 1,
    activity_description: 'Site preparation and vegetation clearing',
    potential_impact: 'Temporary habitat disruption (High)',
    recommended_actions: '1. Mark boundaries clearly\n2. Schedule clearing during dry season\n3. Preserve mature trees where possible',
    monitoring_requirements: 'Daily supervision by environmental officer',
    responsible: '507f1f77bcf86cd799439001',
    notes: 'Phase 1 area only',
    createdAt: '2023-02-01T10:00:00.000Z',
    updatedAt: '2023-02-01T10:00:00.000Z'
  },
  {
    _id: 'ma_004',
    project: '507f1f77bcf86cd799439013',
    serial_number: 2,
    activity_description: 'Seedling transport and planting operations',
    potential_impact: 'Soil compaction from vehicles (Medium)',
    recommended_actions: 'Use designated access routes only. Limit vehicle weight.',
    monitoring_requirements: 'Track vehicle movements. Soil condition checks.',
    responsible: '507f1f77bcf86cd799439002',
    notes: '',
    createdAt: '2023-02-05T10:00:00.000Z',
    updatedAt: '2023-02-05T10:00:00.000Z'
  },
  {
    _id: 'ma_005',
    project: '507f1f77bcf86cd799439013',
    serial_number: 3,
    activity_description: 'Fire break establishment',
    potential_impact: 'Vegetation removal (Low)',
    recommended_actions: 'Maintain minimum width standards. Re-vegetate with fire-resistant species.',
    monitoring_requirements: 'Quarterly inspection of fire break condition',
    responsible: '507f1f77bcf86cd799439001',
    notes: 'Critical for dry season',
    createdAt: '2023-02-10T10:00:00.000Z',
    updatedAt: '2023-02-10T10:00:00.000Z'
  }
]

/**
 * الحصول على أنشطة الإدارة لمشروع معين
 * @param {string} projectId - معرف المشروع
 * @returns {Array}
 */
export function getManagementActivitiesByProjectId(projectId) {
  return mockManagementActivities
    .filter(a => a.project === projectId)
    .sort((a, b) => a.serial_number - b.serial_number)
}

/**
 * الحصول على آخر رقم تسلسلي لمشروع
 * @param {string} projectId - معرف المشروع
 * @returns {number}
 */
export function getNextSerialNumber(projectId) {
  const activities = getManagementActivitiesByProjectId(projectId)
  if (activities.length === 0) return 1
  return Math.max(...activities.map(a => a.serial_number)) + 1
}

/**
 * إنشاء صف جديد فارغ
 * @param {string} projectId - معرف المشروع
 * @returns {Object}
 */
export function createEmptyManagementActivity(projectId) {
  return {
    _id: `ma_temp_${Date.now()}`,
    project: projectId,
    serial_number: getNextSerialNumber(projectId),
    activity_description: '',
    potential_impact: '',
    recommended_actions: '',
    monitoring_requirements: '',
    responsible: null,
    notes: '',
    isNew: true // علامة للصفوف الجديدة
  }
}
```

### 7.1.2 إنشاء ملف `src/data/mockMitigationPlans.js`

**الوصف:** بيانات خطط التخفيف الوهمية

```javascript
/**
 * Mock Mitigation Plans Data
 * متوافق مع backend/src/models/mitigationPlan.model.js
 */

export const mockMitigationPlans = [
  // Project: Reforestation Initiative (507f1f77bcf86cd799439013)
  {
    _id: 'mp_001',
    project: '507f1f77bcf86cd799439013',
    serial_number: 1,
    output_description: 'Site preparation and vegetation clearing for new community center.',
    potential_impact_and_significance: 'Loss of habitat (Medium). Soil erosion risk (High).',
    mitigation_and_enhancement_measures: '1. Mark boundaries clearly.\n2. Schedule clearing during dry season.',
    monitoring: 'Weekly site inspection photos.',
    schedule: 'Q1 2024 (Jan-Mar)',
    responsible: '507f1f77bcf86cd799439001',
    notes: 'Contractor briefed.',
    createdAt: '2023-02-15T10:00:00.000Z',
    updatedAt: '2023-02-15T10:00:00.000Z'
  },
  {
    _id: 'mp_002',
    project: '507f1f77bcf86cd799439013',
    serial_number: 2,
    output_description: 'Water sourcing for concrete mixing.',
    potential_impact_and_significance: 'Depletion of local well water (High climate risk).',
    mitigation_and_enhancement_measures: 'Source water from municipal supply truck.',
    monitoring: 'Water purchase receipts log.',
    schedule: 'Continuous',
    responsible: '507f1f77bcf86cd799439002',
    notes: 'Budget approved.',
    createdAt: '2023-02-16T10:00:00.000Z',
    updatedAt: '2023-02-16T10:00:00.000Z'
  },
  // Project: Water Sanitation Phase II (507f1f77bcf86cd799439011)
  {
    _id: 'mp_003',
    project: '507f1f77bcf86cd799439011',
    serial_number: 1,
    output_description: 'Borehole drilling operations',
    potential_impact_and_significance: 'Groundwater contamination risk (Medium). Noise pollution (Low).',
    mitigation_and_enhancement_measures: '1. Use sealed drilling fluids\n2. Install proper casing\n3. Limit drilling hours',
    monitoring: 'Water quality testing before and after',
    schedule: 'Q2 2024',
    responsible: '507f1f77bcf86cd799439001',
    notes: 'Permits obtained',
    createdAt: '2024-02-01T10:00:00.000Z',
    updatedAt: '2024-02-01T10:00:00.000Z'
  }
]

/**
 * الحصول على خطط التخفيف لمشروع معين
 * @param {string} projectId - معرف المشروع
 * @returns {Array}
 */
export function getMitigationPlansByProjectId(projectId) {
  return mockMitigationPlans
    .filter(p => p.project === projectId)
    .sort((a, b) => a.serial_number - b.serial_number)
}

/**
 * الحصول على آخر رقم تسلسلي لمشروع
 * @param {string} projectId - معرف المشروع
 * @returns {number}
 */
export function getNextMitigationSerialNumber(projectId) {
  const plans = getMitigationPlansByProjectId(projectId)
  if (plans.length === 0) return 1
  return Math.max(...plans.map(p => p.serial_number)) + 1
}

/**
 * إنشاء صف جديد فارغ
 * @param {string} projectId - معرف المشروع
 * @returns {Object}
 */
export function createEmptyMitigationPlan(projectId) {
  return {
    _id: `mp_temp_${Date.now()}`,
    project: projectId,
    serial_number: getNextMitigationSerialNumber(projectId),
    output_description: '',
    potential_impact_and_significance: '',
    mitigation_and_enhancement_measures: '',
    monitoring: '',
    schedule: '',
    responsible: null,
    notes: '',
    isNew: true
  }
}
```

### 7.1.3 تحديث ملف `src/data/index.js`

**إضافة التصديرات الجديدة:**

```javascript
// ... التصديرات الموجودة ...

// SEMP Data
export {
  mockManagementActivities,
  getManagementActivitiesByProjectId,
  getNextSerialNumber,
  createEmptyManagementActivity
} from './mockManagementActivities'

export {
  mockMitigationPlans,
  getMitigationPlansByProjectId,
  getNextMitigationSerialNumber,
  createEmptyMitigationPlan
} from './mockMitigationPlans'
```

---

## 📝 المرحلة 7.2: Hook لإدارة حالة SEMP

### 7.2.1 إنشاء ملف `src/hooks/useSemp.js`

**الوصف:** Hook لإدارة حالة SEMP (Tools 3 & 4)

```javascript
/**
 * useSemp Hook
 * إدارة حالة SEMP (أنشطة الإدارة وخطط التخفيف)
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getManagementActivitiesByProjectId,
  getMitigationPlansByProjectId,
  createEmptyManagementActivity,
  createEmptyMitigationPlan
} from '@/data'

/**
 * Hook لإدارة حالة SEMP
 * @param {string} projectId - معرف المشروع
 */
export function useSemp(projectId) {
  const [managementActivities, setManagementActivities] = useState([])
  const [mitigationPlans, setMitigationPlans] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  // تحميل البيانات
  useEffect(() => {
    if (!projectId) return

    setIsLoading(true)
    setError(null)

    // Simulate API call
    setTimeout(() => {
      setManagementActivities(getManagementActivitiesByProjectId(projectId))
      setMitigationPlans(getMitigationPlansByProjectId(projectId))
      setIsLoading(false)
    }, 300)
  }, [projectId])

  // ==========================================
  // Management Activities (Tool 3)
  // ==========================================

  /**
   * إضافة صف جديد لأنشطة الإدارة
   */
  const addManagementActivity = useCallback(() => {
    const newRow = createEmptyManagementActivity(projectId)
    setManagementActivities(prev => [...prev, newRow])
    return newRow
  }, [projectId])

  /**
   * تحديث صف في أنشطة الإدارة
   * @param {string} rowId - معرف الصف
   * @param {string} field - اسم الحقل
   * @param {any} value - القيمة الجديدة
   */
  const updateManagementActivity = useCallback((rowId, field, value) => {
    setManagementActivities(prev =>
      prev.map(row =>
        row._id === rowId
          ? { ...row, [field]: value, updatedAt: new Date().toISOString() }
          : row
      )
    )
  }, [])

  /**
   * حذف صف من أنشطة الإدارة
   * @param {string} rowId - معرف الصف
   */
  const deleteManagementActivity = useCallback((rowId) => {
    setManagementActivities(prev => {
      const filtered = prev.filter(row => row._id !== rowId)
      // إعادة ترقيم الصفوف
      return filtered.map((row, index) => ({
        ...row,
        serial_number: index + 1
      }))
    })
  }, [])

  /**
   * حفظ جميع أنشطة الإدارة
   */
  const saveManagementActivities = useCallback(async () => {
    setIsSaving(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      // في الواقع، سيتم إرسال البيانات للـ API
      console.log('Saving management activities:', managementActivities)
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsSaving(false)
    }
  }, [managementActivities])

  // ==========================================
  // Mitigation Plans (Tool 4)
  // ==========================================

  /**
   * إضافة صف جديد لخطط التخفيف
   */
  const addMitigationPlan = useCallback(() => {
    const newRow = createEmptyMitigationPlan(projectId)
    setMitigationPlans(prev => [...prev, newRow])
    return newRow
  }, [projectId])

  /**
   * تحديث صف في خطط التخفيف
   * @param {string} rowId - معرف الصف
   * @param {string} field - اسم الحقل
   * @param {any} value - القيمة الجديدة
   */
  const updateMitigationPlan = useCallback((rowId, field, value) => {
    setMitigationPlans(prev =>
      prev.map(row =>
        row._id === rowId
          ? { ...row, [field]: value, updatedAt: new Date().toISOString() }
          : row
      )
    )
  }, [])

  /**
   * حذف صف من خطط التخفيف
   * @param {string} rowId - معرف الصف
   */
  const deleteMitigationPlan = useCallback((rowId) => {
    setMitigationPlans(prev => {
      const filtered = prev.filter(row => row._id !== rowId)
      return filtered.map((row, index) => ({
        ...row,
        serial_number: index + 1
      }))
    })
  }, [])

  /**
   * حفظ جميع خطط التخفيف
   */
  const saveMitigationPlans = useCallback(async () => {
    setIsSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      console.log('Saving mitigation plans:', mitigationPlans)
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsSaving(false)
    }
  }, [mitigationPlans])

  // ==========================================
  // حساب حالة SEMP
  // ==========================================

  /**
   * الحصول على حالة Tool 3 (Management Activities)
   */
  const getTool3Status = useCallback(() => {
    if (managementActivities.length === 0) return 'not_started'
    const hasEmptyRows = managementActivities.some(
      row => !row.activity_description?.trim()
    )
    if (hasEmptyRows) return 'in_progress'
    return 'completed'
  }, [managementActivities])

  /**
   * الحصول على حالة Tool 4 (Mitigation Plans)
   */
  const getTool4Status = useCallback(() => {
    if (mitigationPlans.length === 0) return 'not_started'
    const hasEmptyRows = mitigationPlans.some(
      row => !row.output_description?.trim()
    )
    if (hasEmptyRows) return 'in_progress'
    return 'completed'
  }, [mitigationPlans])

  /**
   * الحصول على حالة SEMP الإجمالية
   */
  const getSempStatus = useCallback(() => {
    const tool3 = getTool3Status()
    const tool4 = getTool4Status()

    if (tool3 === 'not_started' && tool4 === 'not_started') return 'pending'
    if (tool3 === 'completed' && tool4 === 'completed') return 'completed'
    return 'in_progress'
  }, [getTool3Status, getTool4Status])

  return {
    // Data
    managementActivities,
    mitigationPlans,
    isLoading,
    isSaving,
    error,

    // Management Activities Actions
    addManagementActivity,
    updateManagementActivity,
    deleteManagementActivity,
    saveManagementActivities,

    // Mitigation Plans Actions
    addMitigationPlan,
    updateMitigationPlan,
    deleteMitigationPlan,
    saveMitigationPlans,

    // Status
    getTool3Status,
    getTool4Status,
    getSempStatus
  }
}
```

---

## 📝 المرحلة 7.3: مكونات SEMP الأساسية

### 7.3.1 إنشاء `src/components/semp/SempToolCard.jsx`

**الوصف:** بطاقة أداة SEMP (Tool 3 أو Tool 4)

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `toolNumber` | number | ✅ | رقم الأداة (3 أو 4) |
| `title` | string | ✅ | عنوان الأداة |
| `description` | string | ✅ | وصف الأداة |
| `status` | string | ✅ | حالة الأداة |
| `itemCount` | number | ❌ | عدد العناصر |
| `onAction` | function | ✅ | callback عند النقر |
| `actionLabel` | string | ❌ | نص زر الإجراء |

**البنية:**

```jsx
/**
 * SempToolCard Component
 * بطاقة أداة SEMP
 *
 * Features:
 * - أيقونة ملونة (أزرق لـ Tool 3، بنفسجي لـ Tool 4)
 * - شارة الحالة
 * - وصف الأداة
 * - زر إجراء ديناميكي
 */

// التصميم من: 16.ESM Plan Overview.html (السطور 204-256)
```

**أيقونات وألوان:**
```javascript
const toolConfig = {
  3: {
    icon: 'construction',
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    label: 'Tool 3'
  },
  4: {
    icon: 'shield',
    iconBg: 'bg-purple-50 dark:bg-purple-900/20',
    iconColor: 'text-purple-600 dark:text-purple-400',
    label: 'Tool 4'
  }
}
```

---

### 7.3.2 إنشاء `src/components/semp/SempStatusBadge.jsx`

**الوصف:** شارة حالة SEMP

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `status` | 'not_started' \| 'in_progress' \| 'completed' | ✅ | الحالة |
| `size` | 'sm' \| 'md' | ❌ | الحجم |

**التصميم:**

```javascript
const statusConfig = {
  not_started: {
    label: 'Not Started',
    bgClass: 'bg-gray-100 dark:bg-gray-700',
    textClass: 'text-gray-600 dark:text-gray-300'
  },
  in_progress: {
    label: 'In Progress',
    bgClass: 'bg-green-50 dark:bg-green-900/30',
    textClass: 'text-green-700 dark:text-green-400',
    hasIndicator: true // النقطة النابضة
  },
  completed: {
    label: 'Completed',
    bgClass: 'bg-primary/10',
    textClass: 'text-primary'
  }
}
```

---

### 7.3.3 إنشاء `src/components/semp/SempCTABanner.jsx`

**الوصف:** بانر الدعوة للإجراء في صفحة SEMP Overview

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | string | ✅ | عنوان البانر |
| `description` | string | ✅ | وصف البانر |
| `buttonText` | string | ✅ | نص الزر |
| `onClick` | function | ✅ | callback عند النقر |
| `disabled` | boolean | ❌ | تعطيل الزر |

**التصميم من:** 16.ESM Plan Overview.html (السطور 259-275)

**الميزات:**
- خلفية متدرجة داكنة
- أيقونة bolt في دائرة خضراء
- زر فاتح

---

### 7.3.4 إنشاء `src/components/semp/index.js`

```javascript
// SEMP Components Barrel Export

export { default as SempToolCard } from './SempToolCard'
export { default as SempStatusBadge } from './SempStatusBadge'
export { default as SempCTABanner } from './SempCTABanner'
export { default as EditableTable } from './EditableTable'
export { default as EditableCell } from './EditableCell'
export { default as TableRowActions } from './TableRowActions'
export { default as ResponsibleSelect } from './ResponsibleSelect'
export { default as ManagementActivitiesTable } from './ManagementActivitiesTable'
export { default as MitigationPlanTable } from './MitigationPlanTable'
```

---

## 📝 المرحلة 7.4: مكونات الجداول القابلة للتعديل

### 7.4.1 إنشاء `src/components/semp/EditableCell.jsx`

**الوصف:** خلية قابلة للتعديل (contenteditable)

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `value` | string | ❌ | القيمة الحالية |
| `onChange` | function | ✅ | callback عند التغيير |
| `placeholder` | string | ❌ | نص العنصر النائب |
| `readOnly` | boolean | ❌ | وضع القراءة فقط |
| `multiline` | boolean | ❌ | دعم أسطر متعددة |
| `className` | string | ❌ | classes إضافية |

**التصميم من:** 17.Management Activities Table.html (السطور 58-78)

**ميزات CSS المطلوبة:**

```css
.excel-cell {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: start;
  text-align: left;
  padding: 8px;
  outline: none;
  word-break: break-word;
  white-space: pre-wrap;
  background: transparent;
}

.excel-cell:focus {
  box-shadow: inset 0 0 0 2px #11d452;
  background-color: rgba(17, 212, 82, 0.05);
  z-index: 10;
  position: relative;
}

.excel-cell[data-placeholder]:empty:before {
  content: attr(data-placeholder);
  color: #9ca3af;
  pointer-events: none;
}
```

---

### 7.4.2 إنشاء `src/components/semp/ResponsibleSelect.jsx`

**الوصف:** محدد المسؤول (Select في خلية الجدول)

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `value` | string | ❌ | ID المستخدم المختار |
| `onChange` | function | ✅ | callback عند التغيير |
| `users` | array | ❌ | قائمة المستخدمين |
| `readOnly` | boolean | ❌ | وضع القراءة فقط |

**التصميم من:** 17.Management Activities Table.html (السطور 232-238)

---

### 7.4.3 إنشاء `src/components/semp/TableRowActions.jsx`

**الوصف:** زر حذف الصف العائم

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onDelete` | function | ✅ | callback عند الحذف |
| `isVisible` | boolean | ✅ | إظهار/إخفاء الزر |
| `position` | object | ❌ | موقع الزر (top) |

**التصميم من:** 17.Management Activities Table.html (السطور 196-198)

---

### 7.4.4 إنشاء `src/components/semp/ManagementActivitiesTable.jsx`

**الوصف:** جدول أنشطة الإدارة (Tool 3)

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `activities` | array | ✅ | قائمة الأنشطة |
| `onUpdate` | function | ✅ | callback عند تحديث صف |
| `onDelete` | function | ✅ | callback عند حذف صف |
| `onAddRow` | function | ✅ | callback عند إضافة صف |
| `users` | array | ❌ | قائمة المستخدمين للـ responsible |
| `readOnly` | boolean | ❌ | وضع القراءة فقط |

**أعمدة الجدول (من Backend Model):**

| العمود | الحقل | العرض | نوع الخلية |
|--------|-------|-------|-----------|
| # | serial_number | 48px | نص (read-only) |
| Activity Description | activity_description | 300px | نص قابل للتعديل |
| Potential Impact | potential_impact | 200px | نص قابل للتعديل |
| Recommended Actions | recommended_actions | 250px | نص قابل للتعديل |
| Monitoring Requirements | monitoring_requirements | 200px | نص قابل للتعديل |
| Responsibility | responsible | 150px | Select |
| Notes | notes | 150px | نص قابل للتعديل |

**التصميم من:** 17.Management Activities Table.html

---

### 7.4.5 إنشاء `src/components/semp/MitigationPlanTable.jsx`

**الوصف:** جدول خطط التخفيف (Tool 4)

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `plans` | array | ✅ | قائمة الخطط |
| `onUpdate` | function | ✅ | callback عند تحديث صف |
| `onDelete` | function | ✅ | callback عند حذف صف |
| `onAddRow` | function | ✅ | callback عند إضافة صف |
| `users` | array | ❌ | قائمة المستخدمين |
| `readOnly` | boolean | ❌ | وضع القراءة فقط |

**أعمدة الجدول (من Backend Model):**

| العمود | الحقل | العرض | نوع الخلية |
|--------|-------|-------|-----------|
| # | serial_number | 48px | نص (read-only) |
| Output/Activity Description | output_description | 280px | نص قابل للتعديل |
| Potential Impact & Significance | potential_impact_and_significance | 250px | نص قابل للتعديل |
| Mitigation & Enhancement | mitigation_and_enhancement_measures | 280px | نص قابل للتعديل |
| Monitoring | monitoring | 200px | نص قابل للتعديل |
| Responsibility | responsible | 150px | Select |
| Schedule | schedule | 150px | نص قابل للتعديل |
| Notes | notes | 150px | نص قابل للتعديل |

**التصميم من:** 18.Impact Mitigation and Enhancement Plan.html

---

## 📝 المرحلة 7.5: صفحة نظرة عامة على SEMP

### 7.5.1 إنشاء `src/pages/project-workspace/semp/SempOverviewPage.jsx`

**الوصف:** صفحة نظرة عامة على SEMP (Tools 3 & 4)

**المكونات المستخدمة:**
- `SempToolCard`
- `SempCTABanner`
- `SempStatusBadge`
- `Card` (من UI Kit)

**الميزات المطلوبة:**

| الميزة | الوصف | الحالة |
|--------|-------|--------|
| Page Header | عنوان الصفحة ووصفها | [ ] |
| Tool 3 Card | بطاقة Management Activities | [ ] |
| Tool 4 Card | بطاقة Mitigation Plan | [ ] |
| Status Badges | شارات الحالة لكل أداة | [ ] |
| CTA Banner | بانر الإجراء التالي | [ ] |
| Navigation | التنقل لصفحات الأدوات | [ ] |
| Dark Mode | دعم الوضع المظلم | [ ] |
| Responsive | تصميم متجاوب | [ ] |

**البنية:**

```jsx
/**
 * SempOverviewPage
 * صفحة نظرة عامة على SEMP
 *
 * Layout: ProjectLayout (موجود)
 * Route: /app/projects/:projectId/semp
 */

// الحالة:
// - استخدام useSemp للحصول على بيانات SEMP
// - تحديد الإجراء التالي بناءً على الحالة

// حساب الإجراء التالي:
function getNextAction(tool3Status, tool4Status) {
  if (tool3Status !== 'completed') {
    return { tool: 3, path: 'semp/activities', title: 'Complete Management Activities' }
  }
  if (tool4Status !== 'completed') {
    return { tool: 4, path: 'semp/mitigation', title: 'Start Mitigation Plan' }
  }
  return null // مكتمل
}
```

**التصميم:**

```
┌─────────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ PAGE HEADER                                                      │ │
│ │ Environmental & Social Management Plan                           │ │
│ │ Management, mitigation, and monitoring actions                   │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ SECTION: Management Tools                                        │ │
│ │ 🔧 Management Tools                                              │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌────────────────────────────┐ ┌────────────────────────────┐       │
│ │ TOOL 3 CARD                │ │ TOOL 4 CARD                │       │
│ │ 🔵 Management Activities   │ │ 🟣 Mitigation Plan         │       │
│ │ [In Progress]              │ │ [Not Started] ●            │       │
│ │                            │ │                            │       │
│ │ Plan general environmental │ │ Develop specific mitigation│       │
│ │ and social management...   │ │ measures for identified... │       │
│ │                            │ │                            │       │
│ │         [Continue Editing] │ │         [Start Plan →]     │       │
│ └────────────────────────────┘ └────────────────────────────┘       │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ CTA BANNER                                                       │ │
│ │ ⚡ Develop the Social and Environmental Management Plan (SEMP)   │ │
│ │ Outline management activities and mitigation measures...         │ │
│ │                                         [Continue to Tool 3 →]   │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 7.5.2 إنشاء `src/pages/project-workspace/semp/index.js`

```javascript
// SEMP Pages Barrel Export

export { default as SempOverviewPage } from './SempOverviewPage'
export { default as ManagementActivitiesPage } from './ManagementActivitiesPage'
export { default as MitigationPlanPage } from './MitigationPlanPage'
```

---

## 📝 المرحلة 7.6: صفحة أنشطة الإدارة (Tool 3)

### 7.6.1 إنشاء `src/pages/project-workspace/semp/ManagementActivitiesPage.jsx`

**الوصف:** صفحة جدول أنشطة الإدارة البيئية

**المكونات المستخدمة:**
- `ManagementActivitiesTable`
- `Button`
- `Card`

**الميزات المطلوبة:**

| الميزة | الوصف | الحالة |
|--------|-------|--------|
| Page Header | عنوان Tool 3 ووصفه | [ ] |
| Back Button | زر العودة لـ SEMP Overview | [ ] |
| Save Button | زر الحفظ | [ ] |
| Export Button | زر تصدير Excel | [ ] |
| Editable Table | الجدول القابل للتعديل | [ ] |
| Add Row Button | زر إضافة صف | [ ] |
| Delete Row | حذف الصفوف | [ ] |
| Auto-save | الحفظ التلقائي (اختياري) | [ ] |
| Loading State | حالة التحميل | [ ] |
| Dark Mode | دعم الوضع المظلم | [ ] |
| Responsive | تصميم متجاوب (تمرير أفقي) | [ ] |

**التصميم من:** 17.Management Activities Table.html

**Layout:**

```
┌─────────────────────────────────────────────────────────────────────┐
│ HEADER (sticky)                                                      │
│ 🌿 ESMS System                              [Export Excel]           │
├─────────────────────────────────────────────────────────────────────┤
│ PAGE HEADER                                                          │
│ 🔧 Tool 3                                                            │
│ Environmental & Social Management                      [Back] [Save] │
│ Operational planning and risk mitigation tracking.                   │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ TABLE CONTAINER (scrollable)                                     │ │
│ │ ┌───────────────────────────────────────────────────────────────┐│ │
│ │ │ # │ Activity │ Impact │ Actions │ Monitoring │ Resp │ Notes  ││ │
│ │ ├───────────────────────────────────────────────────────────────┤│ │
│ │ │ 1 │ ........ │ ...... │ ....... │ .......... │ .... │ .....  ││ │
│ │ │ 2 │ ........ │ ...... │ ....... │ .......... │ .... │ .....  ││ │
│ │ └───────────────────────────────────────────────────────────────┘│ │
│ │ ┌───────────────────────────────────────────────────────────────┐│ │
│ │ │                    [+ Add another row]                        ││ │
│ │ └───────────────────────────────────────────────────────────────┘│ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📝 المرحلة 7.7: صفحة خطة التخفيف (Tool 4)

### 7.7.1 إنشاء `src/pages/project-workspace/semp/MitigationPlanPage.jsx`

**الوصف:** صفحة جدول خطة التخفيف والتعزيز

**المكونات المستخدمة:**
- `MitigationPlanTable`
- `Button`
- `Card`

**الميزات المطلوبة:**

| الميزة | الوصف | الحالة |
|--------|-------|--------|
| Page Header | عنوان Tool 4 ووصفه | [ ] |
| Back Button | زر العودة لـ SEMP Overview | [ ] |
| Save Button | زر الحفظ | [ ] |
| Export Button | زر تصدير Excel | [ ] |
| Editable Table | الجدول القابل للتعديل | [ ] |
| Add Row Button | زر إضافة صف | [ ] |
| Delete Row | حذف الصفوف | [ ] |
| Loading State | حالة التحميل | [ ] |
| Dark Mode | دعم الوضع المظلم | [ ] |
| Responsive | تصميم متجاوب | [ ] |

**التصميم من:** 18.Impact Mitigation and Enhancement Plan.html

**ملاحظة:** Layout مشابه لـ ManagementActivitiesPage مع أعمدة مختلفة

---

## 📝 المرحلة 7.8: التكامل وتحديث الـ Routes

### 7.8.1 تحديث `src/routes/index.jsx`

**التغييرات المطلوبة:**

```javascript
// إزالة placeholders واستبدالها بالصفحات الفعلية

// استيراد صفحات SEMP
import {
  SempOverviewPage,
  ManagementActivitiesPage,
  MitigationPlanPage
} from '@/pages/project-workspace/semp'

// تحديث routes (استبدال placeholders)
// SEMP (Tools 3 & 4)
{
  path: 'semp',
  element: <SempOverviewPage />,
},
{
  path: 'semp/activities',
  element: <ManagementActivitiesPage />,
},
{
  path: 'semp/mitigation',
  element: <MitigationPlanPage />,
},
```

### 7.8.2 تحديث `src/pages/project-workspace/index.js`

```javascript
// Project Workspace Pages Barrel Export

// ... التصديرات الموجودة ...

// SEMP
export {
  SempOverviewPage,
  ManagementActivitiesPage,
  MitigationPlanPage
} from './semp'
```

### 7.8.3 تحديث `src/hooks/index.js`

```javascript
// Hooks Barrel Export

export { useLocalStorage } from './useLocalStorage'
export { useScreening } from './useScreening'
export { useAssessment } from './useAssessment'
export { useSemp } from './useSemp' // جديد
```

---

## ✅ قائمة التحقق النهائية

### الملفات المطلوب إنشاؤها (21 ملف)

#### Data Files (2)
- [x] `src/data/mockManagementActivities.js`
- [x] `src/data/mockMitigationPlans.js`

#### Hooks (1)
- [x] `src/hooks/useSemp.js`

#### Components (10)
- [x] `src/components/semp/SempToolCard.jsx`
- [x] `src/components/semp/SempStatusBadge.jsx`
- [x] `src/components/semp/SempCTABanner.jsx`
- [x] `src/components/semp/EditableCell.jsx`
- [x] `src/components/semp/ResponsibleSelect.jsx`
- [x] `src/components/semp/TableRowActions.jsx`
- [x] `src/components/semp/ManagementActivitiesTable.jsx`
- [x] `src/components/semp/MitigationPlanTable.jsx`
- [x] `src/components/semp/index.js`

#### Pages (4)
- [x] `src/pages/project-workspace/semp/SempOverviewPage.jsx`
- [x] `src/pages/project-workspace/semp/ManagementActivitiesPage.jsx`
- [x] `src/pages/project-workspace/semp/MitigationPlanPage.jsx`
- [x] `src/pages/project-workspace/semp/index.js`

#### Updates (4)
- [x] تحديث `src/data/index.js`
- [x] تحديث `src/routes/index.jsx`
- [x] تحديث `src/pages/project-workspace/index.js`
- [x] تحديث `src/hooks/index.js`

---

## 📊 ملخص المخرجات

| المقياس | العدد |
|---------|-------|
| **صفحات جديدة** | 3 |
| **مكونات جديدة** | 9 |
| **ملفات بيانات** | 2 |
| **Hooks** | 1 |
| **ملفات تحديث** | 4 |
| **إجمالي الملفات** | 19 |

---

## 📝 ملاحظات مهمة

### 1. CSS للجداول
يجب إضافة CSS للجداول القابلة للتعديل في `src/styles/index.css` أو كـ module CSS:

```css
/* Excel-like Table Styles */
.excel-scroll::-webkit-scrollbar { /* ... */ }
.excel-cell { /* ... */ }
.excel-cell:focus { /* ... */ }
.resizer-col { /* ... */ }
.resizer-row { /* ... */ }
```

### 2. التوافق مع Backend
- `managementActivity.model.js`: 7 حقول
- `mitigationPlan.model.js`: 8 حقول
- الحقول متوافقة مع أعمدة الجداول

### 3. حالة SEMP
```
SEMP Status (محسوب):
- pending: لا توجد سجلات ManagementActivity للمشروع
- in_progress: توجد ManagementActivity ولكن لا توجد MitigationPlan مكتملة
- completed: توجد سجلات MitigationPlan للمشروع
```

### 4. Export Excel
سيتم تنفيذ وظيفة التصدير في مرحلة لاحقة (يمكن استخدام نفس Pattern من Assessment)

---

*Document created: January 31, 2026*
*Author: Architect Agent*
*Version: 1.0*
