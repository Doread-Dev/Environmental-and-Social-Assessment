/**
 * Impact Categories and Questions
 * فئات وأسئلة تقييم التأثير البيئي
 * ⚠️ هذه البيانات مطابقة لـ backend/src/db/seed.js
 */

export const IMPACT_LEVELS = {
  NEGLIGIBLE: 'negligible',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  NOT_APPLICABLE: 'not_applicable',
}

export const IMPACT_LEVEL_CONFIG = {
  [IMPACT_LEVELS.NEGLIGIBLE]: {
    label: 'Negligible',
    color: 'gray',
    bgClass: 'bg-gray-50/50 dark:bg-white/5',
    textClass: 'text-gray-600 dark:text-gray-400',
    dotClass: 'bg-gray-400',
  },
  [IMPACT_LEVELS.LOW]: {
    label: 'Low',
    color: 'green',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    textClass: 'text-green-700 dark:text-green-400',
    dotClass: 'bg-primary',
  },
  [IMPACT_LEVELS.MEDIUM]: {
    label: 'Medium',
    color: 'amber',
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    textClass: 'text-amber-700 dark:text-amber-400',
    dotClass: 'bg-amber-500',
  },
  [IMPACT_LEVELS.HIGH]: {
    label: 'High',
    color: 'red',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    textClass: 'text-red-700 dark:text-red-400',
    dotClass: 'bg-red-500',
  },
  [IMPACT_LEVELS.NOT_APPLICABLE]: {
    label: 'N/A',
    color: 'gray',
    bgClass: 'bg-gray-50/50 dark:bg-white/5',
    textClass: 'text-gray-500 dark:text-gray-500',
    dotClass: 'bg-gray-300',
  },
}

/**
 * فئات التأثير البيئي - من seed.js
 * 8 فئات: A, B, C, D, E, F, J, H
 */
export const impactCategories = [
  {
    id: 'A',
    code: 'A',
    name: 'Air Quality',
    name_ar: 'جودة الهواء',
    icon: 'air',
    iconColor: 'text-sky-500',
    iconBg: 'bg-sky-500/10',
    questions: [
      {
        id: 'A_q1',
        question:
          'Will the project generate air pollution (e.g., fuel use, industry, construction dust)?',
      },
      {
        id: 'A_q2',
        question:
          'Will the project increase vehicle or machinery use (e.g., transport, heavy equipment, generators)?',
      },
      {
        id: 'A_q3',
        question: 'Will the project release chemicals, gases, or fine particles into the air?',
      },
      {
        id: 'A_q4',
        question:
          'Will air pollution from the project affect nearby homes, schools, or nature areas (within 1 km)?',
      },
      {
        id: 'A_q5',
        question:
          'Is the local climate or geography likely to trap pollution instead of dispersing it?',
      },
    ],
  },
  {
    id: 'B',
    code: 'B',
    name: 'Water Quality',
    name_ar: 'جودة المياه',
    icon: 'water_drop',
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-500/10',
    questions: [
      {
        id: 'B_q1',
        question:
          'Will the project pollute nearby water sources (e.g., rivers, lakes, groundwater)?',
      },
      {
        id: 'B_q2',
        question: 'Will the project affect surface or groundwater quality or availability?',
      },
      {
        id: 'B_q3',
        question: 'Will the project impact water used for drinking, irrigation, or ecosystems?',
      },
      {
        id: 'B_q4',
        question:
          'Will the project change water temperature (e.g., due to industrial discharge or deforestation)?',
      },
      {
        id: 'B_q5',
        question:
          'Will the project release toxic substances (e.g., chemicals, heavy metals) into water?',
      },
    ],
  },
  {
    id: 'C',
    code: 'C',
    name: 'The quality and effect of noise',
    name_ar: 'الضجيج',
    icon: 'volume_up',
    iconColor: 'text-purple-500',
    iconBg: 'bg-purple-500/10',
    questions: [
      {
        id: 'C_q1',
        question:
          'Will the project create noise levels that exceed recognized safety limits for human exposure?',
      },
      {
        id: 'C_q2',
        question:
          'Will the project introduce new or significantly louder noise compared to the current environment?',
      },
      {
        id: 'C_q3',
        question: 'How far will the noise from the project travel and impact surrounding areas?',
      },
      {
        id: 'C_q4',
        question:
          'Will the noise affect sensitive places like schools, hospitals, or residential areas?',
      },
      {
        id: 'C_q5',
        question:
          'Will the noise be more disruptive due to its timing (e.g., nighttime) or duration (e.g., long-term exposure)?',
      },
    ],
  },
  {
    id: 'D',
    code: 'D',
    name: 'Solid waste effect',
    name_ar: 'النفايات الصلبة',
    icon: 'delete',
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-500/10',
    questions: [
      {
        id: 'D_q1',
        question: 'Will the project negatively affect the existing solid waste management system?',
      },
      {
        id: 'D_q2',
        question: 'How much solid waste will the project generate?',
      },
      {
        id: 'D_q3',
        question: 'Can the waste from the project be recycled or reused?',
      },
      {
        id: 'D_q4',
        question: 'Will the waste cause harm to the environment (e.g., land, water, wildlife)?',
      },
      {
        id: 'D_q5',
        question:
          'Does the waste pose safety risks due to how it is stored, handled, or disposed of?',
      },
    ],
  },
  {
    id: 'E',
    code: 'E',
    name: 'Radiation effect',
    name_ar: 'الإشعاع',
    icon: 'radio_button_checked',
    iconColor: 'text-yellow-500',
    iconBg: 'bg-yellow-500/10',
    questions: [
      {
        id: 'E_q1',
        question:
          'Will the project cause radiation exposure above safe limits for people and the environment?',
      },
      {
        id: 'E_q2',
        question:
          'What is the impact of the type of radiation emitted by the project (e.g., alpha, beta, gamma, neutron)?',
      },
      {
        id: 'E_q3',
        question:
          'Will sensitive groups (e.g., children, pregnant women, endangered species) be affected by radiation from the project?',
      },
      {
        id: 'E_q4',
        question:
          'What is the risk of radioactive contamination of soil, water, or air due to the project?',
      },
      {
        id: 'E_q5',
        question:
          'How significant is the impact of radiation exposure based on how often and how long it occurs?',
      },
    ],
  },
  {
    id: 'F',
    code: 'F',
    name: 'Toxic and Dangerous Materials effect',
    name_ar: 'المواد الخطرة',
    icon: 'warning',
    iconColor: 'text-red-600',
    iconBg: 'bg-red-600/10',
    questions: [
      {
        id: 'F_q1',
        question:
          'Will the project release toxic or hazardous materials that could harm the ecosystem?',
      },
      {
        id: 'F_q2',
        question:
          'What is the risk from storing, handling, or transporting toxic or dangerous materials?',
      },
      {
        id: 'F_q3',
        question:
          'Will the project pose health risks to people due to exposure to toxic materials?',
      },
      {
        id: 'F_q4',
        question: 'What is the risk of toxic materials contaminating water, soil, or air?',
      },
      {
        id: 'F_q5',
        question: 'How risky is the disposal of waste containing toxic or dangerous materials?',
      },
    ],
  },
  {
    id: 'J',
    code: 'J',
    name: 'The Environmental impacts on natural plants, forests, and wildlife',
    name_ar: 'النباتات والحياة البرية',
    icon: 'forest',
    iconColor: 'text-green-600',
    iconBg: 'bg-green-600/10',
    questions: [
      {
        id: 'J_q1',
        question: 'Will the project lead to loss of natural plants, wildlife, or biodiversity?',
      },
      {
        id: 'J_q2',
        question:
          'Will the project affect animal behavior, migration, or increase the risk of species loss?',
      },
      {
        id: 'J_q3',
        question: 'Will the project harm tree growth or reduce vegetation cover?',
      },
      {
        id: 'J_q4',
        question:
          'Will the project negatively impact aquatic wildlife and habitats (e.g., lakes, rivers, seas)?',
      },
      {
        id: 'J_q5',
        question:
          'Will the project increase the risk of forest fires or cause habitat fragmentation?',
      },
      {
        id: 'J_q6',
        question: 'Will the project introduce or spread invasive species?',
      },
      {
        id: 'J_q7',
        question: 'Will the project affect soil health and fertility?',
      },
      {
        id: 'J_q8',
        question: 'Will the project impact water resources needed for natural ecosystems?',
      },
      {
        id: 'J_q9',
        question: 'Will the project disrupt ecological connectivity and wildlife corridors?',
      },
      {
        id: 'J_q10',
        question:
          'Will the project harm pollinators (e.g., bees, butterflies) or endangered species and their habitats?',
      },
    ],
  },
  {
    id: 'H',
    code: 'H',
    name: 'Environmental impacts of land use and management',
    name_ar: 'استخدام الأرض والمجتمع',
    icon: 'landscape',
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-600/10',
    questions: [
      {
        id: 'H_q1',
        question:
          'Will the project negatively impact national parks, scenic areas, recreation, or tourism?',
      },
      {
        id: 'H_q2',
        question:
          'Will the project affect archaeological sites, cultural heritage, or traditional practices?',
      },
      {
        id: 'H_q3',
        question:
          'Will the project change the aesthetic appearance of the area (e.g., landscapes, views)?',
      },
      {
        id: 'H_q4',
        question:
          'Will the project negatively affect land use diversity or conflict with existing land use plans?',
      },
      {
        id: 'H_q5',
        question:
          'Will the project cause significant changes in population density or settlement patterns?',
      },
      {
        id: 'H_q6',
        question:
          'Will the project negatively impact local economic growth, economic diversity, or resilience?',
      },
      {
        id: 'H_q7',
        question: "Will the project alter the region's social structure or way of life?",
      },
      {
        id: 'H_q8',
        question: 'Will the project reduce available agricultural land or lower productivity?',
      },
      {
        id: 'H_q9',
        question:
          'Will the project negatively affect residential areas, community cohesion, or social equity?',
      },
      {
        id: 'H_q10',
        question:
          'Will the project put pressure on existing infrastructure (e.g., roads, utilities, schools, healthcare)?',
      },
    ],
  },
]

/**
 * الحصول على جميع أسئلة فئة معينة
 */
export function getQuestionsByCategory(categoryId) {
  const category = impactCategories.find((c) => c.id === categoryId || c.code === categoryId)
  return category?.questions || []
}

/**
 * الحصول على إجمالي عدد الأسئلة
 * المجموع: 50 سؤال (5+5+5+5+5+5+10+10)
 */
export function getTotalQuestionCount() {
  return impactCategories.reduce((total, cat) => total + cat.questions.length, 0)
}

/**
 * الحصول على فئة بالكود
 */
export function getCategoryByCode(code) {
  return impactCategories.find((c) => c.code === code)
}
