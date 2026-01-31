/**
 * useAssessment Hook
 * إدارة حالة التقييم البيئي
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getAssessmentByProjectId,
  getMethodsByAssessmentId,
  getConsultationsByAssessmentId,
  getImpactScoresByAssessmentId,
  createEmptyAssessment
} from '@/data'
import { calculateTotalScore, calculateTotalImpact } from '@/utils/impactCalculations'

/**
 * Hook لإدارة حالة التقييم
 * @param {string} projectId - معرف المشروع
 */
export function useAssessment(projectId) {
  const [assessment, setAssessment] = useState(null)
  const [methods, setMethods] = useState([])
  const [consultations, setConsultations] = useState([])
  const [impactScores, setImpactScores] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  // تحميل بيانات التقييم
  useEffect(() => {
    if (!projectId) return

    setIsLoading(true)
    setError(null)

    // Simulate API call
    setTimeout(() => {
      const existingAssessment = getAssessmentByProjectId(projectId)
      
      if (existingAssessment) {
        setAssessment(existingAssessment)
        setMethods(getMethodsByAssessmentId(existingAssessment._id))
        setConsultations(getConsultationsByAssessmentId(existingAssessment._id))
        setImpactScores(getImpactScoresByAssessmentId(existingAssessment._id))
      } else {
        // إنشاء تقييم جديد فارغ
        setAssessment(createEmptyAssessment(projectId, 'current_user_id'))
        setMethods([])
        setConsultations([])
        setImpactScores([])
      }
      
      setIsLoading(false)
    }, 300)
  }, [projectId])

  /**
   * بدء تقييم جديد
   */
  const startAssessment = useCallback(async () => {
    setIsSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setAssessment(prev => ({
        ...prev,
        _id: `assessment_${Date.now()}`,
        status: 'draft',
        createdAt: new Date().toISOString()
      }))
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsSaving(false)
    }
  }, [])

  /**
   * حفظ البيانات الوصفية (Metadata)
   */
  const saveMetadata = useCallback(async (data) => {
    setIsSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setAssessment(prev => ({
        ...prev,
        ...data,
        updatedAt: new Date().toISOString()
      }))
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsSaving(false)
    }
  }, [])

  /**
   * حفظ طرق التقييم (AssessmentMethod)
   * @param {Array} newMethods - طرق التقييم البيئي
   * Structure: [{ method_type, details }]
   */
  const saveMethods = useCallback(async (newMethods) => {
    setIsSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setMethods(newMethods)
      setAssessment(prev => ({
        ...prev,
        updatedAt: new Date().toISOString()
      }))
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsSaving(false)
    }
  }, [])

  /**
   * حفظ الاستشارات المجتمعية (CommunityConsultation)
   * @param {Array} newConsultations - الاستشارات المجتمعية
   * Structure متوافق مع communityConsultation.model.js:
   * [{ type, participants, notes }]
   */
  const saveConsultations = useCallback(async (newConsultations) => {
    setIsSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setConsultations(newConsultations)
      setAssessment(prev => ({
        ...prev,
        updatedAt: new Date().toISOString()
      }))
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsSaving(false)
    }
  }, [])


  /**
   * حفظ نتائج التأثير كمسودة (Draft)
   * يحفظ النتائج بدون تغيير الحالة
   */
  const saveImpactScoresDraft = useCallback(async (scores, negativeImpact, positiveImpact) => {
    setIsSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setImpactScores(scores)
      
      // حساب النتيجة الإجمالية
      const totalScore = calculateTotalScore(scores)
      const totalImpact = calculateTotalImpact(totalScore)
      
      setAssessment(prev => ({
        ...prev,
        total_project_score: totalScore,
        total_project_impact: totalImpact,
        potential_negative_impact: negativeImpact,
        potential_positive_impact: positiveImpact,
        updatedAt: new Date().toISOString()
      }))
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsSaving(false)
    }
  }, [])

  /**
   * حفظ نتائج التأثير
   * للاستخدام عند Submit
   */
  const saveImpactScores = useCallback(async (scores, negativeImpact, positiveImpact) => {
    setIsSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setImpactScores(scores)
      
      // حساب النتيجة الإجمالية
      const totalScore = calculateTotalScore(scores)
      const totalImpact = calculateTotalImpact(totalScore)
      
      setAssessment(prev => ({
        ...prev,
        total_project_score: totalScore,
        total_project_impact: totalImpact,
        potential_negative_impact: negativeImpact,
        potential_positive_impact: positiveImpact,
        updatedAt: new Date().toISOString()
      }))
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsSaving(false)
    }
  }, [])

  /**
   * إرسال التقييم للموافقة
   */
  const submitAssessment = useCallback(async () => {
    setIsSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setAssessment(prev => ({
        ...prev,
        status: 'submitted',
        updatedAt: new Date().toISOString()
      }))
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsSaving(false)
    }
  }, [])

  /**
   * الموافقة على التقييم
   */
  const approveAssessment = useCallback(async (recommendations) => {
    setIsSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setAssessment(prev => ({
        ...prev,
        status: 'approved',
        recommendations,
        approved_by: 'current_user_id',
        updatedAt: new Date().toISOString()
      }))
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsSaving(false)
    }
  }, [])

  /**
   * رفض التقييم
   */
  const rejectAssessment = useCallback(async (rejectReason) => {
    setIsSaving(true)
    try {
      // Simulate API call
      // في الواقع، سيتم إرسال: { reject_reason: rejectReason }
      // والباك اند سيحفظ reject_by تلقائياً من req.user._id
      await new Promise(resolve => setTimeout(resolve, 500))
      setAssessment(prev => ({
        ...prev,
        status: 'rejected',
        reject_reason: rejectReason || null,
        reject_by: 'current_user_id', // سيتم استبداله بـ AuthContext
        updatedAt: new Date().toISOString()
      }))
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsSaving(false)
    }
  }, [])

  return {
    assessment,
    methods,
    consultations,
    impactScores,
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
    rejectAssessment
  }
}

