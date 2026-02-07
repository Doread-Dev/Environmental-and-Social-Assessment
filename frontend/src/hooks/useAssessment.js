/**
 * useAssessment Hook
 * إدارة حالة التقييم البيئي
 */

import { useState, useEffect, useCallback } from 'react'
import { useLookups, useAuth } from '@/contexts'
import { assessmentService } from '@/services'
import { extractErrorMessage } from '@/services/api'

/**
 * Hook لإدارة حالة التقييم
 * @param {string} projectId - معرف المشروع
 */
export function useAssessment(projectId) {
  const { categoriesWithQuestions, isLoading: lookupsLoading } = useLookups()
  const { user } = useAuth()
  const [assessment, setAssessment] = useState(null)
  const [methods, setMethods] = useState([])
  const [consultations, setConsultations] = useState([])
  const [impactScores, setImpactScores] = useState([])
  const normalizeImpactScores = useCallback((scores) => {
    if (!Array.isArray(scores)) return []
    return scores.map((score) => ({
      ...score,
      question:
        score?.question && typeof score.question === 'object'
          ? score.question._id
          : score.question,
    }))
  }, [])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  // تحميل بيانات التقييم
  useEffect(() => {
    if (!projectId) return

    let isMounted = true
    setIsLoading(true)
    setError(null)

    assessmentService
      .getByProject(projectId)
      .then(async (data) => {
        if (!isMounted) return
        
        if (!data) {
          // No assessment exists yet
          setAssessment(null)
          setMethods([])
          setConsultations([])
          setImpactScores([])
          return
        }

        setAssessment(data)

        // Load sub-entities in parallel
        const [methodsResult, consultationsResult, scoresResult] = await Promise.allSettled([
          assessmentService.getMethods(data._id),
          assessmentService.getConsultations(data._id),
          assessmentService.getScores(data._id),
        ])

        if (!isMounted) return
        setMethods(methodsResult.status === 'fulfilled' ? methodsResult.value : [])
        setConsultations(
          consultationsResult.status === 'fulfilled' ? consultationsResult.value : []
        )
        setImpactScores(
          scoresResult.status === 'fulfilled' ? normalizeImpactScores(scoresResult.value) : []
        )
      })
      .catch((err) => {
        if (!isMounted) return
        // getByProject already handles 404 and returns null
        // Only set error for other errors
        setError(extractErrorMessage(err))
      })
      .finally(() => {
        if (!isMounted) return
        setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [projectId, user?._id])

  /**
   * بدء تقييم جديد
   * ينشئ assessment حقيقي في الباك إند
   */
  const startAssessment = useCallback(async () => {
    setIsSaving(true)
    setError(null)
    try {
      if (assessment?._id) {
        return { success: true, data: assessment }
      }

      if (!user?._id) {
        const message = 'User ID is required to start assessment.'
        setError(message)
        return { success: false, error: message }
      }

      // Create assessment in backend
      // Note: officer is set automatically by backend from req.user._id
      // project_activity and description are required, so we use placeholders
      const newAssessment = await assessmentService.create({
        project: projectId,
        project_activity: '(To be filled)',
        description: '(To be filled)',
        status: 'draft',
      })

      setAssessment(newAssessment)
      setMethods([])
      setConsultations([])
      setImpactScores([])
      return { success: true, data: newAssessment }
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsSaving(false)
    }
  }, [assessment?._id, projectId, user?._id])

  /**
   * حفظ البيانات الوصفية (Metadata)
   */
  const saveMetadata = useCallback(async (data) => {
    setIsSaving(true)
    try {
      if (!projectId) {
        const message = 'Missing project id.'
        setError(message)
        return { success: false, error: message }
      }

      if (!assessment?._id) {
        const created = await assessmentService.create({
          project: projectId,
          status: 'draft',
          ...data,
        })
        setAssessment(created)
        return { success: true, data: created }
      }

      const updated = await assessmentService.update(assessment._id, data)
      setAssessment(updated)
      return { success: true, data: updated }
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsSaving(false)
    }
  }, [assessment?._id, projectId])

  /**
   * حفظ طرق التقييم (AssessmentMethod)
   * @param {Array} newMethods - طرق التقييم البيئي
   * Structure: [{ method_type, details }]
   */
  const saveMethods = useCallback(async (newMethods) => {
    setIsSaving(true)
    try {
      if (!assessment?._id) {
        const message = 'Assessment record not found.'
        setError(message)
        return { success: false, error: message }
      }
      const updatedMethods = await assessmentService.setMethods(assessment._id, newMethods)
      setMethods(updatedMethods)
      return { success: true, data: updatedMethods }
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsSaving(false)
    }
  }, [assessment?._id])

  /**
   * حفظ الاستشارات المجتمعية (CommunityConsultation)
   * @param {Array} newConsultations - الاستشارات المجتمعية
   * Structure متوافق مع communityConsultation.model.js:
   * [{ type, participants, notes }]
   */
  const saveConsultations = useCallback(async (newConsultations) => {
    setIsSaving(true)
    try {
      if (!assessment?._id) {
        const message = 'Assessment record not found.'
        setError(message)
        return { success: false, error: message }
      }
      const updatedConsultations = await assessmentService.setConsultations(
        assessment._id,
        newConsultations
      )
      setConsultations(updatedConsultations)
      return { success: true, data: updatedConsultations }
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsSaving(false)
    }
  }, [assessment?._id])

  /**
   * دالة داخلية مشتركة لحفظ النتائج
   * @private
   */
  const saveScoresInternal = useCallback(async (scores, negativeImpact, positiveImpact) => {
    if (!assessment?._id) {
      const message = 'Assessment record not found.'
      setError(message)
      return { success: false, error: message }
    }

    const savedScores = await assessmentService.addScores(assessment._id, scores)
    setImpactScores(normalizeImpactScores(savedScores))

    const updated = await assessmentService.update(assessment._id, {
      potential_negative_impact: negativeImpact,
      potential_positive_impact: positiveImpact,
    })

    setAssessment(updated)

    // Try to calculate, but don't fail if calculation fails
    try {
      const calculated = await assessmentService.calculate(assessment._id)
      setAssessment(calculated)
      return { success: true, data: calculated }
    } catch {
      return { success: true, data: updated }
    }
  }, [assessment?._id, normalizeImpactScores])

  /**
   * حفظ نتائج التأثير كمسودة (Draft)
   * يحفظ النتائج بدون تغيير الحالة
   */
  const saveImpactScoresDraft = useCallback(async (scores, negativeImpact, positiveImpact) => {
    setIsSaving(true)
    setError(null)
    try {
      return await saveScoresInternal(scores, negativeImpact, positiveImpact)
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsSaving(false)
    }
  }, [saveScoresInternal])

  /**
   * حفظ نتائج التأثير
   * للاستخدام عند Submit
   */
  const saveImpactScores = useCallback(async (scores, negativeImpact, positiveImpact) => {
    setIsSaving(true)
    setError(null)
    try {
      return await saveScoresInternal(scores, negativeImpact, positiveImpact)
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsSaving(false)
    }
  }, [saveScoresInternal])

  /**
   * إرسال التقييم للموافقة
   */
  const submitAssessment = useCallback(async () => {
    setIsSaving(true)
    try {
      if (!assessment?._id) {
        const message = 'Assessment record not found.'
        setError(message)
        return { success: false, error: message }
      }
      const updated = await assessmentService.update(assessment._id, { status: 'submitted' })
      setAssessment(updated)
      return { success: true, data: updated }
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsSaving(false)
    }
  }, [assessment?._id])

  /**
   * الموافقة على التقييم
   */
  const approveAssessment = useCallback(async (recommendations) => {
    setIsSaving(true)
    try {
      if (!assessment?._id) {
        const message = 'Assessment record not found.'
        setError(message)
        return { success: false, error: message }
      }
      const updated = await assessmentService.approve(assessment._id, recommendations)
      setAssessment(updated)
      return { success: true, data: updated }
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsSaving(false)
    }
  }, [assessment?._id])

  /**
   * رفض التقييم
   */
  const rejectAssessment = useCallback(async (rejectReason) => {
    setIsSaving(true)
    try {
      if (!assessment?._id) {
        const message = 'Assessment record not found.'
        setError(message)
        return { success: false, error: message }
      }
      const updated = await assessmentService.reject(
        assessment._id,
        rejectReason === undefined ? '' : rejectReason
      )
      setAssessment(updated)
      return { success: true, data: updated }
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsSaving(false)
    }
  }, [assessment?._id])

  return {
    assessment,
    methods,
    consultations,
    impactScores,
    categoriesWithQuestions,
    lookupsLoading,
    isLoading,
    isSaving,
    error,
    startAssessment,
    saveMetadata,
    saveMethods,
    saveConsultations,
    saveImpactScores,
    saveImpactScoresDraft,
    submitAssessment,
    approveAssessment,
    rejectAssessment,
  }
}
