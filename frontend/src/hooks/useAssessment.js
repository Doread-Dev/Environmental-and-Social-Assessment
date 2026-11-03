/**
 * useAssessment Hook
 * إدارة حالة التقييم البيئي
 *
 * Tool 2 of a project: the assessment with its methods, consultations and impact scores in one
 * cached query, and its writes (mutations). Each write refreshes the project's workflow state.
 */

import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { assessmentService } from '@/services'
import { extractErrorMessage } from '@/services/api'
import { queryKeys } from '@/services/queryKeys'
import { useLookups } from './useLookups'
import { useProjectSave } from './useProjectSave'

const NOT_STARTED = { assessment: null, methods: [], consultations: [], impactScores: [] }

// Scores reference their question by id in the UI
function normalizeImpactScores(scores) {
  if (!Array.isArray(scores)) return []
  return scores.map((score) => ({
    ...score,
    question:
      score?.question && typeof score.question === 'object' ? score.question._id : score.question,
  }))
}

async function loadAssessment(projectId) {
  const assessment = await assessmentService.getByProject(projectId)
  if (!assessment) return NOT_STARTED
  const [methods, consultations, scores] = await Promise.all([
    assessmentService.getMethods(assessment._id),
    assessmentService.getConsultations(assessment._id),
    assessmentService.getScores(assessment._id),
  ])
  return { assessment, methods, consultations, impactScores: normalizeImpactScores(scores) }
}

/**
 * Query options of a project's assessment, for loading it outside the hook (e.g. on export)
 * @param {string} projectId
 */
export const assessmentQuery = (projectId) => ({
  queryKey: queryKeys.assessment(projectId),
  queryFn: () => loadAssessment(projectId),
})

/**
 * Hook لإدارة حالة التقييم
 * @param {string} projectId - معرف المشروع
 */
export function useAssessment(projectId) {
  const { categoriesWithQuestions, isLoading: lookupsLoading } = useLookups()
  const query = useQuery({ ...assessmentQuery(projectId), enabled: !!projectId })
  const { assessment, methods, consultations, impactScores } = query.data ?? NOT_STARTED
  const assessmentId = assessment?._id
  const { save, fail, isSaving, error, queryClient } = useProjectSave(projectId)

  // Merge a write's result into the cached query
  const store = useCallback(
    (changes) =>
      queryClient.setQueryData(queryKeys.assessment(projectId), (prev) => ({
        ...(prev ?? NOT_STARTED),
        ...changes,
      })),
    [queryClient, projectId]
  )
  const storeAssessment = useCallback((data) => store({ assessment: data }), [store])

  // Every content write needs the record (the gateway creates it first)
  const withAssessment = useCallback(
    (request, onSaved) =>
      assessmentId
        ? save(() => request(assessmentId), onSaved)
        : Promise.resolve(fail('Assessment record not found.')),
    [assessmentId, save, fail]
  )

  /**
   * بدء تقييم جديد
   * ينشئ assessment حقيقي في الباك إند
   */
  const startAssessment = useCallback(
    (project) => {
      if (assessment) return Promise.resolve({ success: true, data: assessment })
      // The backend sets officer, prefills project activity (from the project component) and
      // the potential impacts (from the screening), and creates all scores as Negligible
      // (D53, D54). Description is required, so it starts as a placeholder; so does project
      // activity when the project has no component to prefill it from.
      return save(
        async () => {
          const created = await assessmentService.create({
            project: projectId,
            description: '(To be filled)',
            ...(!project?.project_component?.trim() && { project_activity: '(To be filled)' }),
          })
          const scores = await assessmentService.getScores(created._id)
          return { created, scores }
        },
        ({ created, scores }) =>
          store({
            assessment: created,
            methods: [],
            consultations: [],
            impactScores: normalizeImpactScores(scores),
          })
      ).then((result) => (result.success ? { ...result, data: result.data.created } : result))
    },
    [assessment, projectId, save, store]
  )

  /**
   * حفظ البيانات الوصفية (Metadata)
   */
  const saveMetadata = useCallback(
    (data) => {
      if (!projectId) return Promise.resolve(fail('Missing project id.'))
      return save(
        () =>
          assessmentId
            ? assessmentService.update(assessmentId, data)
            : assessmentService.create({ project: projectId, ...data }),
        storeAssessment
      )
    },
    [projectId, assessmentId, save, fail, storeAssessment]
  )

  /**
   * حفظ طرق التقييم (AssessmentMethod)
   * @param {Array} newMethods - طرق التقييم البيئي
   * Structure: [{ method_type, details }]
   */
  const saveMethods = useCallback(
    (newMethods) =>
      withAssessment(
        (id) => assessmentService.setMethods(id, newMethods),
        (saved) => store({ methods: saved })
      ),
    [withAssessment, store]
  )

  /**
   * حفظ الاستشارات المجتمعية (CommunityConsultation)
   * @param {Array} newConsultations - الاستشارات المجتمعية
   * Structure متوافق مع communityConsultation.model.js:
   * [{ type, participants, notes }]
   */
  const saveConsultations = useCallback(
    (newConsultations) =>
      withAssessment(
        (id) => assessmentService.setConsultations(id, newConsultations),
        (saved) => store({ consultations: saved })
      ),
    [withAssessment, store]
  )

  /**
   * حفظ نتائج التأثير (draft and before submit)
   * The backend recalculates the totals on every score change, so the assessment returned by
   * the update below already carries them.
   */
  const saveImpactScores = useCallback(
    (scores, negativeImpact, positiveImpact) =>
      withAssessment(
        async (id) => {
          const savedScores = await assessmentService.addScores(id, scores)
          const updated = await assessmentService.update(id, {
            potential_negative_impact: negativeImpact,
            potential_positive_impact: positiveImpact,
          })
          return { savedScores, updated }
        },
        ({ savedScores, updated }) =>
          store({ assessment: updated, impactScores: normalizeImpactScores(savedScores) })
      ).then((result) => (result.success ? { ...result, data: result.data.updated } : result)),
    [withAssessment, store]
  )

  /**
   * إرسال التقييم للموافقة
   */
  const submitAssessment = useCallback(
    () => withAssessment((id) => assessmentService.submit(id), storeAssessment),
    [withAssessment, storeAssessment]
  )

  /**
   * الموافقة على التقييم
   */
  const approveAssessment = useCallback(
    (recommendations) =>
      withAssessment((id) => assessmentService.approve(id, recommendations), storeAssessment),
    [withAssessment, storeAssessment]
  )

  /**
   * رفض التقييم
   */
  const rejectAssessment = useCallback(
    (rejectReason) =>
      withAssessment(
        (id) => assessmentService.reject(id, rejectReason === undefined ? '' : rejectReason),
        storeAssessment
      ),
    [withAssessment, storeAssessment]
  )

  return {
    assessment,
    methods,
    consultations,
    impactScores,
    categoriesWithQuestions,
    lookupsLoading,
    isLoading: !!projectId && query.isPending,
    isSaving,
    error: error ?? (query.error ? extractErrorMessage(query.error) : null),
    refetch: query.refetch,
    startAssessment,
    saveMetadata,
    saveMethods,
    saveConsultations,
    saveImpactScores,
    saveImpactScoresDraft: saveImpactScores,
    submitAssessment,
    approveAssessment,
    rejectAssessment,
  }
}
