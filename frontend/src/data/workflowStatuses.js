/**
 * Workflow Tools
 * الأدوات الخمس الرئيسية في النظام
 *
 * ملاحظة: Tools 3 & 4 مدمجة في صفحة SEMP واحدة في Frontend
 */
export const WORKFLOW_TOOLS = {
  SCREENING: {
    key: 'screening',
    number: 1,
    label: 'Screening',
    labelAr: 'الفرز',
    hasBackendStatus: true, // لديه حقل status في Backend
  },
  ASSESSMENT: {
    key: 'assessment',
    number: 2,
    label: 'Assessment',
    labelAr: 'التقييم',
    hasBackendStatus: true, // لديه حقل status في Backend
  },
  SEMP: {
    key: 'semp',
    numbers: [3, 4], // يجمع Tool 3 & 4
    label: 'SEMP',
    labelAr: 'خطة الإدارة',
    hasBackendStatus: false, // ❌ لا يوجد حقل status - محسوب
    description: 'Management Activities (Tool 3) + Mitigation Plan (Tool 4)',
  },
  MONITORING: {
    key: 'monitoring',
    number: 5,
    label: 'Monitoring',
    labelAr: 'المراقبة',
    hasBackendStatus: false, // ❌ لا يوجد حقل status - محسوب من Q1-Q4
  },
}

/**
 * === منطق حساب الحالة لكل أداة ===
 *
 * SCREENING & ASSESSMENT:
 *   - يستخدمان حقل `status` من Backend مباشرة
 *   - القيم: draft, submitted, approved, rejected
 *   - rejected يُعرض كـ needs_action في UI
 *
 * SEMP (Tools 3 & 4):
 *   - pending: لا توجد سجلات ManagementActivity للمشروع
 *   - in_progress: توجد ManagementActivity ولكن لا توجد MitigationPlan
 *   - completed: توجد سجلات MitigationPlan للمشروع
 *
 * MONITORING (Tool 5):
 *   - pending: لا توجد سجلات MonitoringRecord للمشروع
 *   - in_progress: توجد سجلات ولكن Q4 غير معبأ
 *   - completed: Q4 معبأ (تم ملء آخر quarter)
 */

/**
 * Workflow Step Statuses
 * حالات كل خطوة في سير العمل
 */
export const workflowStepStatuses = {
  // === حالات عامة ===
  pending: {
    key: 'pending',
    label: 'Pending',
    labelAr: 'قيد الانتظار',
    color: 'bg-gray-200 dark:bg-gray-700',
    textColor: 'text-gray-500 dark:text-gray-400',
    isComplete: false,
  },
  draft: {
    key: 'draft',
    label: 'Draft',
    labelAr: 'مسودة',
    color: 'bg-gray-400 dark:bg-gray-400',
    textColor: 'text-gray-600 dark:text-gray-300',
    isComplete: false,
  },
  in_progress: {
    key: 'in_progress',
    label: 'In Progress',
    labelAr: 'قيد التنفيذ',
    color: 'bg-blue-500',
    textColor: 'text-blue-600 dark:text-blue-400',
    isComplete: false,
  },

  // === حالات Screening & Assessment (من Backend) ===
  submitted: {
    key: 'submitted',
    label: 'Submitted',
    labelAr: 'تم الإرسال',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-600 dark:text-yellow-400',
    isComplete: false,
  },
  approved: {
    key: 'approved',
    label: 'Approved',
    labelAr: 'تمت الموافقة',
    color: 'bg-primary',
    textColor: 'text-primary',
    isComplete: true, // ← يُعتبر مكتمل
  },
  rejected: {
    key: 'rejected',
    label: 'Rejected',
    labelAr: 'مرفوض',
    color: 'bg-red-500',
    textColor: 'text-red-600 dark:text-red-400',
    isComplete: false,
  },

  // === حالات SEMP & Monitoring (محسوبة) ===
  completed: {
    key: 'completed',
    label: 'Completed',
    labelAr: 'مكتمل',
    color: 'bg-primary',
    textColor: 'text-primary',
    isComplete: true, // ← يُعتبر مكتمل
  },

  // === حالة خاصة ===
  needs_action: {
    key: 'needs_action',
    label: 'Needs Action',
    labelAr: 'يحتاج إجراء',
    color: 'bg-red-500',
    textColor: 'text-red-600 dark:text-red-400',
    isComplete: false,
  },
}

/**
 * تحويل حالة Backend إلى حالة العرض
 * @param {string} backendStatus - الحالة من Backend
 * @param {string} toolKey - مفتاح الأداة
 * @returns {string} - حالة العرض
 */
export function mapBackendStatusToDisplay(backendStatus, toolKey) {
  // Screening & Assessment: rejected = needs_action
  if (['screening', 'assessment'].includes(toolKey) && backendStatus === 'rejected') {
    return 'needs_action'
  }
  return backendStatus
}

/**
 * Project Overall Statuses
 * حالات المشروع العامة (محسوبة من workflow)
 */
export const projectStatuses = {
  draft: {
    key: 'draft',
    label: 'Draft',
    labelAr: 'مسودة',
    bgColor: 'bg-gray-50/50 dark:bg-white/5',
    textColor: 'text-gray-600 dark:text-gray-300',
    borderColor: 'border-border-default dark:border-border-dark',
    dotColor: 'bg-gray-500',
  },
  in_progress: {
    key: 'in_progress',
    label: 'In Progress',
    labelAr: 'قيد التنفيذ',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-700 dark:text-blue-300',
    borderColor: 'border-blue-100 dark:border-blue-800',
    dotColor: 'bg-blue-500',
  },
  monitoring: {
    key: 'monitoring',
    label: 'Active Monitoring',
    labelAr: 'مراقبة نشطة',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    textColor: 'text-purple-700 dark:text-purple-300',
    borderColor: 'border-purple-100 dark:border-purple-800',
    dotColor: 'bg-purple-500',
  },
  needs_action: {
    key: 'needs_action',
    label: 'Needs Action',
    labelAr: 'يحتاج إجراء',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    textColor: 'text-red-700 dark:text-red-300',
    borderColor: 'border-red-100 dark:border-red-800',
    icon: 'priority_high',
  },
  completed: {
    key: 'completed',
    label: 'Completed',
    labelAr: 'مكتمل',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    textColor: 'text-green-700 dark:text-green-300',
    borderColor: 'border-green-100 dark:border-green-800',
    dotColor: 'bg-green-500',
  },
}
