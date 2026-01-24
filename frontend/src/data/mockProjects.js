/**
 * Mock Projects Data
 * متوافق مع backend/src/models/project.model.js
 *
 * الحقول الإضافية (icon, screening, workflow) هي للعرض في Frontend فقط
 * وستُحسب من العلاقات مع الجداول الأخرى عند التكامل مع API
 */
export const mockProjects = [
  {
    // === الحقول الأساسية (من Backend) ===
    _id: '507f1f77bcf86cd799439011',
    title: 'Water Sanitation Phase II',
    location: 'Kisumu, Kenya',
    start_date: '2024-01-15',
    end_date: '2025-12-31',
    project_component:
      'Construction of water treatment facility and distribution network for rural communities',
    createdAt: '2024-01-10T10:00:00.000Z',
    updatedAt: '2024-06-15T14:30:00.000Z',

    // === الحقول المحسوبة للعرض (Frontend Only) ===
    icon: 'water_drop', // أيقونة Material Symbols

    // بيانات الفرز (من Screening model)
    screening: {
      _id: '507f1f77bcf86cd799439021',
      category_code: 'B', // A, B, C, D, E, F (من Backend)
      status: 'approved', // draft, submitted, approved, rejected
      screening_date: '2024-01-20',
    },

    // === تقدم سير العمل (محسوب) ===
    // ملاحظة: SEMP يجمع Tools 3 & 4 في صفحة واحدة
    workflow: {
      screening: { status: 'approved', tool: 1 }, // من screening.status
      assessment: { status: 'approved', tool: 2 }, // من assessment.status
      semp: { status: 'in_progress', tools: [3, 4] }, // محسوب: management + mitigation
      monitoring: { status: 'pending', tool: 5 }, // محسوب: Q4 filled?
    },

    // === بيانات إضافية لحساب الحالة (Mock) ===
    _computed: {
      hasManagementActivities: true, // توجد سجلات ManagementActivity
      hasMitigationPlans: false, // لا توجد سجلات MitigationPlan بعد
      monitoringQuarters: {
        // حالة كل Quarter
        Q1: true,
        Q2: true,
        Q3: false,
        Q4: false,
      },
    },
  },
  {
    _id: '507f1f77bcf86cd799439012',
    title: 'Community Solar Grid',
    location: 'Arusha, Tanzania',
    start_date: '2024-03-01',
    end_date: '2026-03-01',
    project_component:
      'Installation of solar panels and grid infrastructure for community power supply',
    createdAt: '2024-02-20T08:00:00.000Z',
    updatedAt: '2024-02-20T08:00:00.000Z',
    icon: 'solar_power',
    screening: {
      _id: '507f1f77bcf86cd799439022',
      category_code: 'C',
      status: 'draft',
      screening_date: null,
    },
    workflow: {
      screening: { status: 'draft', tool: 1 },
      assessment: { status: 'pending', tool: 2 },
      semp: { status: 'pending', tools: [3, 4] },
      monitoring: { status: 'pending', tool: 5 },
    },
    _computed: {
      hasManagementActivities: false,
      hasMitigationPlans: false,
      monitoringQuarters: { Q1: false, Q2: false, Q3: false, Q4: false },
    },
  },
  {
    _id: '507f1f77bcf86cd799439013',
    title: 'Reforestation Initiative',
    location: 'Amazonas, Brazil',
    start_date: '2023-01-01',
    end_date: '2028-01-01',
    project_component:
      'Large-scale tree planting and ecosystem restoration in degraded forest areas',
    createdAt: '2022-12-15T09:00:00.000Z',
    updatedAt: '2024-06-01T16:00:00.000Z',
    icon: 'forest',
    screening: {
      _id: '507f1f77bcf86cd799439023',
      category_code: 'A',
      status: 'approved',
      screening_date: '2023-01-10',
    },
    workflow: {
      screening: { status: 'approved', tool: 1 },
      assessment: { status: 'approved', tool: 2 },
      semp: { status: 'completed', tools: [3, 4] }, // MitigationPlan exists
      monitoring: { status: 'in_progress', tool: 5 }, // Q4 not filled yet
    },
    _computed: {
      hasManagementActivities: true,
      hasMitigationPlans: true, // ← SEMP completed
      monitoringQuarters: { Q1: true, Q2: true, Q3: true, Q4: false }, // Q4 missing
    },
  },
  {
    _id: '507f1f77bcf86cd799439014',
    title: 'Urban Waste Management',
    location: 'Mumbai, India',
    start_date: '2024-06-01',
    end_date: '2024-12-31',
    project_component: 'Implementation of waste collection and recycling program in urban areas',
    createdAt: '2024-05-15T11:00:00.000Z',
    updatedAt: '2024-06-20T10:00:00.000Z',
    icon: 'delete',
    screening: {
      _id: '507f1f77bcf86cd799439024',
      category_code: 'B',
      status: 'rejected',
      screening_date: '2024-06-10',
    },
    workflow: {
      screening: { status: 'needs_action', tool: 1 }, // rejected = needs_action
      assessment: { status: 'pending', tool: 2 },
      semp: { status: 'pending', tools: [3, 4] },
      monitoring: { status: 'pending', tool: 5 },
    },
    _computed: {
      hasManagementActivities: false,
      hasMitigationPlans: false,
      monitoringQuarters: { Q1: false, Q2: false, Q3: false, Q4: false },
    },
  },
  {
    _id: '507f1f77bcf86cd799439015',
    title: 'Clean Water Initiative',
    location: 'Nairobi, Kenya',
    start_date: '2024-02-01',
    end_date: '2025-08-01',
    project_component: 'Water purification and distribution system for peri-urban settlements',
    createdAt: '2024-01-20T07:00:00.000Z',
    updatedAt: '2024-04-10T12:00:00.000Z',
    icon: 'water_drop',
    screening: {
      _id: '507f1f77bcf86cd799439025',
      category_code: 'C',
      status: 'approved',
      screening_date: '2024-02-05',
    },
    workflow: {
      screening: { status: 'approved', tool: 1 },
      assessment: { status: 'in_progress', tool: 2 },
      semp: { status: 'pending', tools: [3, 4] },
      monitoring: { status: 'pending', tool: 5 },
    },
    _computed: {
      hasManagementActivities: false,
      hasMitigationPlans: false,
      monitoringQuarters: { Q1: false, Q2: false, Q3: false, Q4: false },
    },
  },
  {
    _id: '507f1f77bcf86cd799439016',
    title: 'Solar Grid Expansion',
    location: 'Rajasthan, India',
    start_date: '2024-04-01',
    end_date: '2026-04-01',
    project_component: 'Expansion of existing solar power grid to additional villages',
    createdAt: '2024-03-10T06:00:00.000Z',
    updatedAt: '2024-03-10T06:00:00.000Z',
    icon: 'solar_power',
    screening: {
      _id: '507f1f77bcf86cd799439026',
      category_code: 'B',
      status: 'draft',
      screening_date: null,
    },
    workflow: {
      screening: { status: 'draft', tool: 1 },
      assessment: { status: 'pending', tool: 2 },
      semp: { status: 'pending', tools: [3, 4] },
      monitoring: { status: 'pending', tool: 5 },
    },
    _computed: {
      hasManagementActivities: false,
      hasMitigationPlans: false,
      monitoringQuarters: { Q1: false, Q2: false, Q3: false, Q4: false },
    },
  },
  {
    _id: '507f1f77bcf86cd799439017',
    title: 'Reforestation Zone B',
    location: 'Amazonas, Brazil',
    start_date: '2023-06-01',
    end_date: '2027-06-01',
    project_component: 'Secondary reforestation zone with indigenous species restoration',
    createdAt: '2023-05-20T08:00:00.000Z',
    updatedAt: '2024-05-15T09:00:00.000Z',
    icon: 'forest',
    screening: {
      _id: '507f1f77bcf86cd799439027',
      category_code: 'A',
      status: 'approved',
      screening_date: '2023-06-10',
    },
    workflow: {
      screening: { status: 'approved', tool: 1 },
      assessment: { status: 'approved', tool: 2 },
      semp: { status: 'completed', tools: [3, 4] },
      monitoring: { status: 'in_progress', tool: 5 },
    },
    _computed: {
      hasManagementActivities: true,
      hasMitigationPlans: true,
      monitoringQuarters: { Q1: true, Q2: true, Q3: false, Q4: false },
    },
  },
  {
    _id: '507f1f77bcf86cd799439018',
    title: 'Community School #4',
    location: 'Jakarta, Indonesia',
    start_date: '2023-01-15',
    end_date: '2024-01-15',
    project_component: 'Construction of eco-friendly school building with sustainable design',
    createdAt: '2022-12-01T10:00:00.000Z',
    updatedAt: '2024-01-20T11:00:00.000Z',
    icon: 'school',
    screening: {
      _id: '507f1f77bcf86cd799439028',
      category_code: 'C',
      status: 'approved',
      screening_date: '2023-01-20',
    },
    workflow: {
      screening: { status: 'approved', tool: 1 },
      assessment: { status: 'approved', tool: 2 },
      semp: { status: 'completed', tools: [3, 4] },
      monitoring: { status: 'completed', tool: 5 }, // Q4 filled = completed
    },
    _computed: {
      hasManagementActivities: true,
      hasMitigationPlans: true,
      monitoringQuarters: { Q1: true, Q2: true, Q3: true, Q4: true }, // All quarters filled
    },
  },
  {
    _id: '507f1f77bcf86cd799439019',
    title: 'Sustainable Farming',
    location: 'Mekong Delta, Vietnam',
    start_date: '2024-03-01',
    end_date: '2025-09-01',
    project_component: 'Training and infrastructure for sustainable agricultural practices',
    createdAt: '2024-02-15T09:00:00.000Z',
    updatedAt: '2024-05-20T14:00:00.000Z',
    icon: 'agriculture',
    screening: {
      _id: '507f1f77bcf86cd799439029',
      category_code: 'C',
      status: 'approved',
      screening_date: '2024-03-10',
    },
    workflow: {
      screening: { status: 'approved', tool: 1 },
      assessment: { status: 'approved', tool: 2 },
      semp: { status: 'in_progress', tools: [3, 4] }, // Has management but no mitigation
      monitoring: { status: 'pending', tool: 5 },
    },
    _computed: {
      hasManagementActivities: true,
      hasMitigationPlans: false, // ← No mitigation yet, so SEMP is in_progress
      monitoringQuarters: { Q1: false, Q2: false, Q3: false, Q4: false },
    },
  },
]

/**
 * === دوال حساب حالة Workflow ===
 */

/**
 * حساب حالة SEMP (Tools 3 & 4)
 * @param {boolean} hasManagement - هل توجد سجلات ManagementActivity
 * @param {boolean} hasMitigation - هل توجد سجلات MitigationPlan
 * @returns {string} - pending | in_progress | completed
 */
export function calculateSempStatus(hasManagement, hasMitigation) {
  if (hasMitigation) return 'completed'
  if (hasManagement) return 'in_progress'
  return 'pending'
}

/**
 * حساب حالة Monitoring (Tool 5)
 * @param {Object} quarters - { Q1: bool, Q2: bool, Q3: bool, Q4: bool }
 * @returns {string} - pending | in_progress | completed
 */
export function calculateMonitoringStatus(quarters) {
  if (!quarters) return 'pending'

  // إذا تم ملء Q4 = مكتمل
  if (quarters.Q4) return 'completed'

  // إذا تم ملء أي quarter آخر = قيد التنفيذ
  if (quarters.Q1 || quarters.Q2 || quarters.Q3) return 'in_progress'

  return 'pending'
}

/**
 * حساب حالة المشروع العامة من workflow
 * @param {Object} workflow - كائن workflow من المشروع
 * @returns {string} - حالة المشروع
 */
export function calculateProjectStatus(workflow) {
  // إذا كان هناك أي tool يحتاج إجراء
  const hasNeedsAction = Object.values(workflow).some((w) => w.status === 'needs_action')
  if (hasNeedsAction) return 'needs_action'

  // إذا اكتملت جميع الأدوات
  const allCompleted = Object.values(workflow).every(
    (w) => w.status === 'approved' || w.status === 'completed'
  )
  if (allCompleted) return 'completed'

  // إذا كان Monitoring قيد التنفيذ
  if (workflow.monitoring.status === 'in_progress') return 'monitoring'

  // إذا لم يبدأ Screening بعد
  if (workflow.screening.status === 'draft' || workflow.screening.status === 'pending')
    return 'draft'

  // أي حالة أخرى = قيد التنفيذ
  return 'in_progress'
}
