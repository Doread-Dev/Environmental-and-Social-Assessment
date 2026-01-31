/**
 * Mock Assessment Data
 * متوافق مع backend/src/models/assessment.model.js
 */

import { IMPACT_LEVELS } from './impactQuestions'
import { ASSESSMENT_METHOD_TYPES, CONSULTATION_METHOD_TYPES } from './assessmentMethods'

/**
 * بيانات التقييم الوهمية لكل مشروع
 */
export const mockAssessments = [
  {
    _id: '507f1f77bcf86cd799439031',
    project: '507f1f77bcf86cd799439011', // Water Sanitation Phase II
    officer: '507f1f77bcf86cd799439001', // Sarah Jenkins
    project_activity: 'Borehole Drilling and Pump Installation Phase 1',
    description: 'The project involves the mechanical drilling of a 50-meter deep borehole to access the aquifer. Following drilling, a solar-powered submersible pump will be installed. A 5000L raised storage tank will be constructed on a concrete plinth. The site will be fenced (10m x 10m perimeter) to prevent animal access.',
    environmental_setting: 'Semi-arid region characterized by flat terrain with sandy-loam soil. Vegetation is sparse, consisting mainly of Acacia shrubs and seasonal grasses. No protected wildlife areas or water bodies are within 5km radius. The site is 500m from the nearest household cluster.',
    legal_requirements: 'Adherence to National Water Resources Authority guidelines for groundwater abstraction. Compliance with the NGO\'s Environmental Social Management Framework (ESMF). Local government permits for construction activities.',
    // المجموع = 50 سؤال
    // أعلى عدد = 20 (low) → total_project_impact = 'low'
    total_project_score: {
      negligible: 12,
      low: 20,
      medium: 10,
      high: 3,
      not_applicable: 5
    },
    // أعلى عدد = 20 (low) → total_project_impact = 'low'
    total_project_impact: 'low',
    potential_negative_impact: 'Minor temporary dust and noise pollution during drilling. Minimal risk of localized oil spills from machinery. Potential for social friction if water access rules are not clear.',
    potential_positive_impact: 'Provision of clean drinking water to 500+ residents. Reduction in water-borne diseases. Reduced time for women/children collecting water. Creation of local jobs during construction.',
    approved_by: '507f1f77bcf86cd799439002', // Ahmed Hassan
    recommendations: 'Proceed with management plan. Ensure dust suppression during drilling. Establish clear water management committee with community participation.',
    status: 'submitted',
    createdAt: '2024-01-25T10:00:00.000Z',
    updatedAt: '2024-02-05T14:30:00.000Z'
  },
  {
    _id: '507f1f77bcf86cd799439032',
    project: '507f1f77bcf86cd799439013', // Reforestation Initiative
    officer: '507f1f77bcf86cd799439001',
    project_activity: 'Large-scale Tree Planting and Forest Restoration',
    description: 'Comprehensive reforestation project covering 5,000 hectares of degraded forest land. Activities include site preparation, seedling planting (500,000 native trees), nursery establishment, and community training programs.',
    environmental_setting: 'Tropical montane forest region with significant biodiversity. Adjacent to protected national park. Existing degradation from previous logging activities. High rainfall area with seasonal flooding.',
    legal_requirements: 'Forest Conservation Act compliance. National park buffer zone regulations. Environmental Impact Assessment required under national law. Community land use agreements.',
    // المجموع = 50 سؤال (مشروع عالي المخاطر)
    // تعادل: medium=15, high=15 → الأولوية للـ high
    total_project_score: {
      negligible: 5,
      low: 10,
      medium: 15,
      high: 15,
      not_applicable: 5
    },
    // تعادل: medium=15, high=15 → الأولوية للـ high
    total_project_impact: 'high',
    potential_negative_impact: 'Risk of introducing non-native species if not properly managed. Temporary habitat disruption during site preparation. Potential impact on existing vegetation. Water table changes from large-scale planting.',
    potential_positive_impact: 'Restoration of 5,000 hectares of degraded forest. Carbon sequestration and climate mitigation. Habitat creation for endangered wildlife. Watershed protection. Community employment.',
    approved_by: '507f1f77bcf86cd799439002',
    recommendations: 'Full Environmental Management Plan required. Use only native species from certified nurseries. Engage local communities in planning. Establish fire management protocols.',
    status: 'approved',
    createdAt: '2023-01-15T09:00:00.000Z',
    updatedAt: '2023-02-01T16:00:00.000Z'
  },
  {
    _id: '507f1f77bcf86cd799439033',
    project: '507f1f77bcf86cd799439012', // Community Solar Grid
    officer: '507f1f77bcf86cd799439003',
    project_activity: 'Solar Panel Installation on Community Buildings',
    description: '',
    environmental_setting: '',
    legal_requirements: '',
    total_project_score: null,
    total_project_impact: null,
    potential_negative_impact: '',
    potential_positive_impact: '',
    approved_by: null,
    recommendations: null,
    status: 'draft',
    createdAt: '2024-02-25T08:00:00.000Z',
    updatedAt: '2024-02-25T08:00:00.000Z'
  },
  {
    _id: '507f1f77bcf86cd799439034',
    project: '507f1f77bcf86cd799439015', // Clean Water Initiative
    officer: '507f1f77bcf86cd799439001',
    project_activity: 'Water Purification System Installation',
    description: 'Installation of water purification and distribution system using existing infrastructure. Includes installation of filtration units, UV treatment systems, and pipe network upgrades.',
    environmental_setting: 'Peri-urban settlement with mixed land use. Existing water infrastructure in need of upgrade. No protected areas nearby.',
    legal_requirements: 'Water quality standards compliance. Health department approval for potable water systems.',
    // المجموع = 50 سؤال (مشروع منخفض المخاطر جداً)
    total_project_score: {
      negligible: 28,
      low: 12,
      medium: 5,
      high: 0,
      not_applicable: 5
    },
    // أعلى عدد = 28 (negligible) → total_project_impact = 'negligible'
    total_project_impact: 'negligible',
    potential_negative_impact: 'Brief service interruption during installation. Minor excavation for pipe connections. Temporary traffic disruption.',
    potential_positive_impact: 'Safe drinking water for 2,500 residents. Reduced waterborne diseases. Lower healthcare costs. Improved quality of life.',
    approved_by: null,
    recommendations: null,
    reject_reason: 'Insufficient detail on water quality testing procedures and monitoring plan. Please provide comprehensive water quality baseline data and post-installation monitoring protocols before resubmission.',
    reject_by: '507f1f77bcf86cd799439002', // Ahmed Hassan
    status: 'rejected',
    createdAt: '2024-02-10T07:00:00.000Z',
    updatedAt: '2024-02-20T10:00:00.000Z'
  }
]

/**
 * بيانات طرق التقييم المرتبطة بالتقييمات
 */
export const mockAssessmentMethods = [
  // Assessment 1 (Water Sanitation)
  {
    _id: 'm001',
    assessment: '507f1f77bcf86cd799439031',
    method_type: ASSESSMENT_METHOD_TYPES.FIELD_VISITS,
    details: 'Initial site inspection conducted on Oct 10, 2023. Follow-up visit on Oct 25, 2023.'
  },
  {
    _id: 'm002',
    assessment: '507f1f77bcf86cd799439031',
    method_type: ASSESSMENT_METHOD_TYPES.SPECIALIST_CONSULTATION,
    details: 'Dr. Sarah Chen (Hydrologist), Mr. Mark Davis (Ecologist)'
  },
  {
    _id: 'm003',
    assessment: '507f1f77bcf86cd799439031',
    method_type: ASSESSMENT_METHOD_TYPES.AKFS_GUIDELINES,
    details: 'Section 4: Biodiversity Management, Section 7: Water Resources'
  },
  // Assessment 2 (Reforestation)
  {
    _id: 'm004',
    assessment: '507f1f77bcf86cd799439032',
    method_type: ASSESSMENT_METHOD_TYPES.FIELD_VISITS,
    details: 'Multiple site visits from Dec 2022 to Jan 2023'
  },
  {
    _id: 'm005',
    assessment: '507f1f77bcf86cd799439032',
    method_type: ASSESSMENT_METHOD_TYPES.PREVIOUS_ASSESSMENTS,
    details: '2019 Baseline Forest Assessment Report'
  },
  {
    _id: 'm006',
    assessment: '507f1f77bcf86cd799439032',
    method_type: ASSESSMENT_METHOD_TYPES.TECHNICAL_REPORTS,
    details: 'Forest Inventory Report 2022, Biodiversity Survey Results'
  }
]

/**
 * بيانات الاستشارات المجتمعية
 * متوافق مع backend/src/models/communityConsultation.model.js
 */
export const mockConsultations = [
  {
    _id: 'c001',
    assessment: '507f1f77bcf86cd799439031',
    type: CONSULTATION_METHOD_TYPES.VILLAGE_MEETINGS,
    participants: 'Village Chief, 3 Council members, and approx. 15 residents',
    notes: 'Meeting held at the North Village Community Center. Discussed water access and project timeline.'
  },
  {
    _id: 'c002',
    assessment: '507f1f77bcf86cd799439032',
    type: CONSULTATION_METHOD_TYPES.COMMUNITY_INTERVIEWS,
    participants: '50 households representatives from 5 villages',
    notes: 'Interviews conducted over 2 weeks. Key concerns: land use, employment opportunities.'
  },
  {
    _id: 'c003',
    assessment: '507f1f77bcf86cd799439032',
    type: CONSULTATION_METHOD_TYPES.COMMITTEE_CONSULTATION,
    participants: 'Forest Management Committee (8 members), Environmental Protection Council (5 members)',
    notes: 'Both committees approved the reforestation approach. Requested native species prioritization.'
  }
]

/**
 * بيانات نتائج تقييم التأثير
 * ⚠️ الـ question IDs متوافقة مع impactQuestions.js (من seed.js)
 */
export const mockImpactScores = [
  // Assessment 1 - Category A: Air Quality (5 أسئلة)
  { assessment: '507f1f77bcf86cd799439031', question: 'A_q1', level: IMPACT_LEVELS.LOW, note: 'Minimal dust during drilling phase' },
  { assessment: '507f1f77bcf86cd799439031', question: 'A_q2', level: IMPACT_LEVELS.MEDIUM, note: 'Heavy machinery will be used for 2 weeks' },
  { assessment: '507f1f77bcf86cd799439031', question: 'A_q3', level: IMPACT_LEVELS.NEGLIGIBLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'A_q4', level: IMPACT_LEVELS.LOW, note: 'Nearest homes are 500m away' },
  { assessment: '507f1f77bcf86cd799439031', question: 'A_q5', level: IMPACT_LEVELS.NOT_APPLICABLE, note: '' },
  
  // Assessment 1 - Category B: Water Quality (5 أسئلة)
  { assessment: '507f1f77bcf86cd799439031', question: 'B_q1', level: IMPACT_LEVELS.LOW, note: 'Oil spill kits will be onsite' },
  { assessment: '507f1f77bcf86cd799439031', question: 'B_q2', level: IMPACT_LEVELS.MEDIUM, note: 'Abstraction rate calculated to be safe, but monitoring required' },
  { assessment: '507f1f77bcf86cd799439031', question: 'B_q3', level: IMPACT_LEVELS.LOW, note: 'Water will be used for construction only' },
  { assessment: '507f1f77bcf86cd799439031', question: 'B_q4', level: IMPACT_LEVELS.NEGLIGIBLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'B_q5', level: IMPACT_LEVELS.NEGLIGIBLE, note: '' },
  
  // Assessment 1 - Category C: Noise (5 أسئلة)
  { assessment: '507f1f77bcf86cd799439031', question: 'C_q1', level: IMPACT_LEVELS.MEDIUM, note: 'Drilling noise for 2-3 days' },
  { assessment: '507f1f77bcf86cd799439031', question: 'C_q2', level: IMPACT_LEVELS.MEDIUM, note: 'Louder than ambient environment' },
  { assessment: '507f1f77bcf86cd799439031', question: 'C_q3', level: IMPACT_LEVELS.LOW, note: 'Limited to 500m radius' },
  { assessment: '507f1f77bcf86cd799439031', question: 'C_q4', level: IMPACT_LEVELS.LOW, note: 'Site is 500m from nearest homes' },
  { assessment: '507f1f77bcf86cd799439031', question: 'C_q5', level: IMPACT_LEVELS.LOW, note: 'Work limited to daytime hours' },
  
  // Assessment 1 - Category D: Solid Waste (5 أسئلة)
  { assessment: '507f1f77bcf86cd799439031', question: 'D_q1', level: IMPACT_LEVELS.NEGLIGIBLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'D_q2', level: IMPACT_LEVELS.LOW, note: 'Minimal construction waste expected' },
  { assessment: '507f1f77bcf86cd799439031', question: 'D_q3', level: IMPACT_LEVELS.LOW, note: 'Metal parts can be recycled' },
  { assessment: '507f1f77bcf86cd799439031', question: 'D_q4', level: IMPACT_LEVELS.NEGLIGIBLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'D_q5', level: IMPACT_LEVELS.NEGLIGIBLE, note: '' },
  
  // Assessment 1 - Category E: Radiation (5 أسئلة)
  { assessment: '507f1f77bcf86cd799439031', question: 'E_q1', level: IMPACT_LEVELS.NOT_APPLICABLE, note: 'No radiation sources' },
  { assessment: '507f1f77bcf86cd799439031', question: 'E_q2', level: IMPACT_LEVELS.NOT_APPLICABLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'E_q3', level: IMPACT_LEVELS.NOT_APPLICABLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'E_q4', level: IMPACT_LEVELS.NOT_APPLICABLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'E_q5', level: IMPACT_LEVELS.NOT_APPLICABLE, note: '' },
  
  // Assessment 1 - Category F: Toxic Materials (5 أسئلة)
  { assessment: '507f1f77bcf86cd799439031', question: 'F_q1', level: IMPACT_LEVELS.LOW, note: 'Fuel and oil on site' },
  { assessment: '507f1f77bcf86cd799439031', question: 'F_q2', level: IMPACT_LEVELS.LOW, note: 'Proper storage procedures in place' },
  { assessment: '507f1f77bcf86cd799439031', question: 'F_q3', level: IMPACT_LEVELS.NEGLIGIBLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'F_q4', level: IMPACT_LEVELS.LOW, note: 'Spill containment measures in place' },
  { assessment: '507f1f77bcf86cd799439031', question: 'F_q5', level: IMPACT_LEVELS.NEGLIGIBLE, note: '' },
  
  // Assessment 1 - Category J: Plants & Wildlife (10 أسئلة)
  { assessment: '507f1f77bcf86cd799439031', question: 'J_q1', level: IMPACT_LEVELS.NEGLIGIBLE, note: 'No significant vegetation on site' },
  { assessment: '507f1f77bcf86cd799439031', question: 'J_q2', level: IMPACT_LEVELS.NEGLIGIBLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'J_q3', level: IMPACT_LEVELS.NOT_APPLICABLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'J_q4', level: IMPACT_LEVELS.NEGLIGIBLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'J_q5', level: IMPACT_LEVELS.NOT_APPLICABLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'J_q6', level: IMPACT_LEVELS.NEGLIGIBLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'J_q7', level: IMPACT_LEVELS.LOW, note: 'Minor soil disturbance during drilling' },
  { assessment: '507f1f77bcf86cd799439031', question: 'J_q8', level: IMPACT_LEVELS.LOW, note: 'Groundwater monitoring required' },
  { assessment: '507f1f77bcf86cd799439031', question: 'J_q9', level: IMPACT_LEVELS.NOT_APPLICABLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'J_q10', level: IMPACT_LEVELS.NEGLIGIBLE, note: '' },
  
  // Assessment 1 - Category H: Land Use & Community (10 أسئلة)
  { assessment: '507f1f77bcf86cd799439031', question: 'H_q1', level: IMPACT_LEVELS.NOT_APPLICABLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'H_q2', level: IMPACT_LEVELS.NEGLIGIBLE, note: 'No heritage sites in area' },
  { assessment: '507f1f77bcf86cd799439031', question: 'H_q3', level: IMPACT_LEVELS.NEGLIGIBLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'H_q4', level: IMPACT_LEVELS.NEGLIGIBLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'H_q5', level: IMPACT_LEVELS.NEGLIGIBLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'H_q6', level: IMPACT_LEVELS.LOW, note: 'Positive impact - job creation' },
  { assessment: '507f1f77bcf86cd799439031', question: 'H_q7', level: IMPACT_LEVELS.NEGLIGIBLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'H_q8', level: IMPACT_LEVELS.NOT_APPLICABLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'H_q9', level: IMPACT_LEVELS.NEGLIGIBLE, note: '' },
  { assessment: '507f1f77bcf86cd799439031', question: 'H_q10', level: IMPACT_LEVELS.LOW, note: 'Minor road use during construction' }
]

/**
 * الحصول على بيانات التقييم لمشروع معين
 */
export function getAssessmentByProjectId(projectId) {
  return mockAssessments.find(a => a.project === projectId) || null
}

/**
 * الحصول على طرق التقييم لتقييم معين
 */
export function getMethodsByAssessmentId(assessmentId) {
  return mockAssessmentMethods.filter(m => m.assessment === assessmentId)
}

/**
 * الحصول على الاستشارات لتقييم معين
 */
export function getConsultationsByAssessmentId(assessmentId) {
  return mockConsultations.filter(c => c.assessment === assessmentId)
}

/**
 * الحصول على نتائج التأثير لتقييم معين
 */
export function getImpactScoresByAssessmentId(assessmentId) {
  return mockImpactScores.filter(s => s.assessment === assessmentId)
}

/**
 * إنشاء تقييم فارغ لمشروع جديد
 */
export function createEmptyAssessment(projectId, officerId) {
  return {
    _id: null,
    project: projectId,
    officer: officerId,
    project_activity: '',
    description: '',
    environmental_setting: '',
    legal_requirements: '',
    total_project_score: null,
    total_project_impact: null,
    potential_negative_impact: '',
    potential_positive_impact: '',
    approved_by: null,
    recommendations: null,
    status: 'draft'
  }
}
