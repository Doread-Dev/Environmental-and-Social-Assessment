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
 * التحقق من صحة كلمة المرور
 * @param {string} password
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validatePassword(password) {
  if (!password) {
    return { valid: false, error: 'Password is required' }
  }

  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' }
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

  if (title.trim().length < 3) {
    return { valid: false, error: 'Project title must be at least 3 characters' }
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

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}
