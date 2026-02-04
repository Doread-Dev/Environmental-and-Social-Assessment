/**
 * Mock Screening Data
 * متوافق مع backend/src/models/screening.model.js
 */

import { mockProjects } from './mockProjects'
import { mockUsers } from './mockUsers'

/**
 * بيانات الفرز الوهمية لكل مشروع
 * كل مشروع لديه سجل فرز واحد
 */
export const mockScreenings = [
  {
    _id: '507f1f77bcf86cd799439021',
    project: '507f1f77bcf86cd799439011', // Water Sanitation Phase II
    category_code: 'B',
    category_reason:
      'The project involves moderate construction activities for water treatment facilities. The environmental footprint is limited to the designated construction site. No protected areas or endangered species are affected. Standard mitigation measures will be applied during construction phase.',
    potential_negative:
      '- Temporary noise pollution during construction affecting nearby residential areas\n- Dust generation from excavation work\n- Potential soil erosion if proper drainage not maintained\n- Minor disturbance to local wildlife during construction',
    potential_positive:
      '- Improved access to clean water for 500+ households\n- Reduction in waterborne diseases\n- Enhanced sanitation infrastructure\n- Job creation for local community during construction\n- Long-term health benefits for the community',
    approved_by: '507f1f77bcf86cd799439001', // Sarah Jenkins
    recommendations:
      'Proceed with environmental assessment (Tool 2). Implement dust suppression measures during dry season. Schedule noisy activities during appropriate hours.',
    screening_date: '2024-01-20T00:00:00.000Z',
    status: 'approved',
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-20T14:30:00.000Z',
  },
  {
    _id: '507f1f77bcf86cd799439022',
    project: '507f1f77bcf86cd799439012', // Community Solar Grid
    category_code: 'C',
    category_reason:
      'Solar panel installation on existing structures with minimal ground disturbance. No land clearing required. Grid infrastructure follows existing utility corridors.',
    potential_negative:
      '- Minor visual impact on landscape\n- Temporary traffic disruption during installation',
    potential_positive:
      '- Clean renewable energy for 200 households\n- Reduction in carbon emissions\n- Lower electricity costs for community\n- Educational opportunities about renewable energy',
    approved_by: null,
    recommendations: null,
    screening_date: null,
    status: 'submitted',
    createdAt: '2024-02-20T08:00:00.000Z',
    updatedAt: '2024-02-20T08:00:00.000Z',
  },
  {
    _id: '507f1f77bcf86cd799439023',
    project: '507f1f77bcf86cd799439013', // Reforestation Initiative
    category_code: 'A',
    category_reason:
      'Large-scale reforestation project in degraded forest areas adjacent to protected national park. Project involves significant land modification, introduction of tree species, and long-term ecosystem changes. Requires comprehensive environmental impact assessment due to proximity to protected areas.',
    potential_negative:
      '- Risk of introducing non-native species if not properly managed\n- Temporary habitat disruption during site preparation\n- Potential impact on existing vegetation\n- Water table changes from large-scale planting\n- Risk of fire during dry season',
    potential_positive:
      '- Restoration of 5,000 hectares of degraded forest\n- Carbon sequestration and climate mitigation\n- Habitat creation for endangered wildlife\n- Watershed protection\n- Community employment and sustainable livelihood\n- Biodiversity enhancement\n- Soil erosion prevention',
    approved_by: '507f1f77bcf86cd799439002', // Ahmed Hassan
    recommendations:
      'Full Environmental Impact Assessment (EIA) required before implementation. Engage local communities in planning. Establish fire management protocols. Use only native species from certified nurseries.',
    screening_date: '2023-01-10T00:00:00.000Z',
    status: 'approved',
    createdAt: '2022-12-15T09:00:00.000Z',
    updatedAt: '2023-01-10T16:00:00.000Z',
  },
  {
    _id: '507f1f77bcf86cd799439024',
    project: '507f1f77bcf86cd799439014', // Urban Waste Management
    category_code: 'B',
    category_reason:
      'Waste collection and recycling program in urban areas. Limited infrastructure development. Main activities involve equipment deployment and community engagement.',
    potential_negative:
      '- Odor issues if waste collection is delayed\n- Traffic congestion during collection hours\n- Risk of improper waste handling',
    potential_positive:
      '- Cleaner urban environment\n- Reduction in landfill waste\n- Revenue from recyclables\n- Health improvements from proper waste management',
    approved_by: null,
    recommendations: null,
    reject_reason:
      'Additional information required on waste processing facility location and community consultation results. Please provide detailed site plans and evidence of stakeholder engagement.',
    reject_by: '507f1f77bcf86cd799439002', // Ahmed Hassan
    screening_date: '2024-06-10T00:00:00.000Z',
    status: 'rejected',
    createdAt: '2024-05-15T11:00:00.000Z',
    updatedAt: '2024-06-10T10:00:00.000Z',
  },
  {
    _id: '507f1f77bcf86cd799439025',
    project: '507f1f77bcf86cd799439015', // Clean Water Initiative
    category_code: 'C',
    category_reason:
      'Water purification and distribution system using existing infrastructure. Minimal new construction required. Technology installation in designated areas only.',
    potential_negative:
      '- Brief service interruption during system installation\n- Minor excavation for pipe connections',
    potential_positive:
      '- Safe drinking water for peri-urban settlements\n- Reduced waterborne diseases\n- Lower healthcare costs for families\n- Improved quality of life',
    approved_by: '507f1f77bcf86cd799439003', // Maria Santos
    recommendations:
      'Proceed with simplified assessment. Coordinate installation schedule with local authorities.',
    screening_date: '2024-02-05T00:00:00.000Z',
    status: 'approved',
    createdAt: '2024-01-20T07:00:00.000Z',
    updatedAt: '2024-02-05T12:00:00.000Z',
  },
  {
    _id: '507f1f77bcf86cd799439029',
    project: '507f1f77bcf86cd799439019', // Sustainable Farming
    category_code: 'C',
    category_reason:
      'Training and infrastructure for sustainable agricultural practices. Uses existing farmland with no expansion into new areas. Promotes organic farming methods.',
    potential_negative:
      '- Transition period may temporarily reduce yields\n- Learning curve for new techniques',
    potential_positive:
      '- Improved soil health\n- Reduced chemical inputs\n- Higher quality produce\n- Sustainable livelihoods for farmers\n- Market access for organic products',
    approved_by: '507f1f77bcf86cd799439001',
    recommendations:
      'Proceed to assessment. Document baseline conditions. Establish farmer field schools.',
    screening_date: '2024-03-10T00:00:00.000Z',
    status: 'approved',
    createdAt: '2024-02-15T09:00:00.000Z',
    updatedAt: '2024-03-10T14:00:00.000Z',
  },
]

/**
 * الحصول على بيانات الفرز لمشروع معين
 * @param {string} projectId - معرف المشروع
 * @returns {Object|null}
 */
export function getScreeningByProjectId(projectId) {
  return mockScreenings.find((s) => s.project === projectId) || null
}

/**
 * الحصول على بيانات الفرز مع بيانات المشروع والمستخدم
 * @param {string} projectId - معرف المشروع
 * @returns {Object|null}
 */
export function getScreeningWithDetails(projectId) {
  const screening = getScreeningByProjectId(projectId)
  if (!screening) return null

  const project = mockProjects.find((p) => p._id === screening.project)
  const approver = screening.approved_by
    ? mockUsers.find((u) => u._id === screening.approved_by)
    : null
  const rejector = screening.reject_by ? mockUsers.find((u) => u._id === screening.reject_by) : null

  return {
    ...screening,
    projectDetails: project,
    approverDetails: approver,
    rejectorDetails: rejector,
  }
}

/**
 * بيانات فرز فارغة لمشروع جديد
 * @param {string} projectId - معرف المشروع
 * @returns {Object}
 */
export function createEmptyScreening(projectId) {
  return {
    _id: null,
    project: projectId,
    category_code: null,
    category_reason: '',
    potential_negative: '',
    potential_positive: '',
    approved_by: null,
    recommendations: '',
    screening_date: null,
    status: 'draft',
  }
}
