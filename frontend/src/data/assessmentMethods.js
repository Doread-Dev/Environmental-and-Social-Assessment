/**
 * Assessment Methods Types
 * أنواع طرق التقييم البيئي
 */

export const ASSESSMENT_METHOD_TYPES = {
  FIELD_VISITS: 'field_visits',
  PREVIOUS_ASSESSMENTS: 'previous_assessments',
  TECHNICAL_REPORTS: 'technical_reports',
  SPECIALIST_CONSULTATION: 'specialist_consultation',
  PROJECT_MEETINGS: 'project_meetings',
  AKFS_GUIDELINES: 'akfs_guidelines',
  OTHER: 'other'
}

export const assessmentMethods = [
  {
    id: ASSESSMENT_METHOD_TYPES.FIELD_VISITS,
    label: 'Field visits',
    description: 'Physical inspection of the site and surrounding area',
    placeholder: 'Enter dates and locations visited',
    inputType: 'textarea',
    rows: 2
  },
  {
    id: ASSESSMENT_METHOD_TYPES.PREVIOUS_ASSESSMENTS,
    label: 'Previous environmental assessments',
    description: null,
    placeholder: 'E.g., 2019 EIA Report for Phase 1',
    inputType: 'input'
  },
  {
    id: ASSESSMENT_METHOD_TYPES.TECHNICAL_REPORTS,
    label: 'Available technical reports',
    description: null,
    placeholder: 'Enter report titles and authors',
    inputType: 'textarea',
    rows: 2
  },
  {
    id: ASSESSMENT_METHOD_TYPES.SPECIALIST_CONSULTATION,
    label: 'Consultation with specialists',
    description: null,
    placeholder: 'Enter names and specialties',
    inputType: 'input'
  },
  {
    id: ASSESSMENT_METHOD_TYPES.PROJECT_MEETINGS,
    label: 'Project team meetings',
    description: null,
    placeholder: 'Dates and key outcomes',
    inputType: 'input'
  },
  {
    id: ASSESSMENT_METHOD_TYPES.AKFS_GUIDELINES,
    label: 'AKFS Environmental Guidelines',
    description: null,
    placeholder: 'Specific sections or guidelines used',
    inputType: 'input'
  },
  {
    id: ASSESSMENT_METHOD_TYPES.OTHER,
    label: 'Other methods',
    description: null,
    placeholder: 'Describe other methods',
    inputType: 'input'
  }
]

export const CONSULTATION_METHOD_TYPES = {
  COMMUNITY_INTERVIEWS: 'community_interviews',
  VILLAGE_MEETINGS: 'village_meetings',
  COMMITTEE_CONSULTATION: 'committee_consultation',
  OTHER: 'other_consultation'
}

export const consultationMethods = [
  {
    id: CONSULTATION_METHOD_TYPES.COMMUNITY_INTERVIEWS,
    label: 'Interviews with community members',
    description: null,
    placeholder: 'Names or groups interviewed',
    inputType: 'textarea',
    rows: 2
  },
  {
    id: CONSULTATION_METHOD_TYPES.VILLAGE_MEETINGS,
    label: 'Village or site meetings',
    description: 'Formal or informal gatherings with local stakeholders',
    placeholder: 'E.g., Village Chief and 20 elders at the Community Hall',
    inputType: 'textarea',
    rows: 2
  },
  {
    id: CONSULTATION_METHOD_TYPES.COMMITTEE_CONSULTATION,
    label: 'Consultation with village/site committees',
    description: null,
    placeholder: 'Name of committee and outcomes',
    inputType: 'input'
  },
  {
    id: CONSULTATION_METHOD_TYPES.OTHER,
    label: 'Other community consultation',
    description: null,
    placeholder: 'Describe other consultation methods',
    inputType: 'textarea',
    rows: 2
  }
]
