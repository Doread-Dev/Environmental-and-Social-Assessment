/**
 * التحقق من صحة البريد الإلكتروني
 * @param {string} email
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateEmail(email) {
  if (!email || !email.trim()) {
    return { valid: false, error: 'Email is required' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Please enter a valid email address' }
  }

  return { valid: true, error: null }
}

/**
 * Login password: required only. The password policy lives on the backend (GET /auth/me
 * password_rules) and applies when a password is set, not when signing in.
 * @param {string} password
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validatePassword(password) {
  if (!password) {
    return { valid: false, error: 'Password is required' }
  }

  return { valid: true, error: null }
}

/**
 * التحقق من صحة عنوان المشروع
 * @param {string} title
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateProjectTitle(title) {
  if (!title || !title.trim()) {
    return { valid: false, error: 'Project title is required' }
  }

  if (title.trim().length > 100) {
    return { valid: false, error: 'Project title must be less than 100 characters' }
  }

  return { valid: true, error: null }
}

/**
 * التحقق من صحة الموقع
 * @param {string} location
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateLocation(location) {
  if (!location || !location.trim()) {
    return { valid: false, error: 'Location is required' }
  }

  return { valid: true, error: null }
}

/**
 * التحقق من صحة وصف المشروع
 * @param {string} description
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateProjectDescription(description) {
  if (!description || !description.trim()) {
    return { valid: false, error: 'Project description is required' }
  }

  return { valid: true, error: null }
}

/**
 * التحقق من صحة التواريخ
 * @param {string} startDate
 * @param {string} endDate
 * @returns {{ valid: boolean, errors: { startDate?: string, endDate?: string } }}
 */
export function validateDates(startDate, endDate) {
  const errors = {}

  if (!startDate) {
    errors.startDate = 'Start date is required'
  }

  if (!endDate) {
    errors.endDate = 'End date is required'
  }

  if (startDate && endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (end <= start) {
      errors.endDate = 'End date must be after start date'
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * التحقق من نموذج إنشاء المشروع
 * @param {Object} formData
 * @returns {{ valid: boolean, errors: Object }}
 */
export function validateProjectForm(formData) {
  const errors = {}

  const titleValidation = validateProjectTitle(formData.title)
  if (!titleValidation.valid) {
    errors.title = titleValidation.error
  }

  const locationValidation = validateLocation(formData.location)
  if (!locationValidation.valid) {
    errors.location = locationValidation.error
  }

  const datesValidation = validateDates(formData.startDate, formData.endDate)
  if (!datesValidation.valid) {
    Object.assign(errors, datesValidation.errors)
  }

  const descriptionValidation = validateProjectDescription(formData.description)
  if (!descriptionValidation.valid) {
    errors.description = descriptionValidation.error
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * التحقق من صحة النموذج
 */
export function validateScreeningForm(data) {
  const errors = {}

  if (!data.screeningDate) {
    errors.screeningDate = 'Screening date is required'
  }

  if (!data.categoryCode) {
    errors.categoryCode = 'Risk category selection is required'
  }

  if (!data.categoryReason?.trim()) {
    errors.categoryReason = 'Category justification is required'
  }

  if (!data.potentialNegative?.trim()) {
    errors.potentialNegative = 'Potential negative impacts are required'
  }

  if (!data.potentialPositive?.trim()) {
    errors.potentialPositive = 'Potential positive impacts are required'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * التحقق من صحة البيانات الوصفية
 */
export function validateAssessmentMetadata(data) {
  const errors = {}

  if (!data.project_activity?.trim()) {
    errors.project_activity = 'Project activity is required'
  }

  if (!data.description?.trim()) {
    errors.description = 'Description is required'
  }

  if (!data.environmental_setting?.trim()) {
    errors.environmental_setting = 'Environmental setting is required'
  }

  if (!data.legal_requirements?.trim()) {
    errors.legal_requirements = 'Legal requirements are required'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}
