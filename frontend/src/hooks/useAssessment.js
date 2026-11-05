/**
 * useAssessment Hook
 * إدارة حالة التقييم البيئي
 *
 * Tool 2 of a project: the assessment with its methods, consultations and impact scores in one
 * cached query, and its writes (mutations). Each write refreshes the project's workflow state.
 *
 * Every content write carries the version the page shows (D62): the assessment's `updatedAt` in
 * the cache when the request starts. Methods, consultations and scores answer the whole
 * assessment, so the next write (e.g. consultations after methods, submit after scores) sends the
 * version the previous one left.
 */

import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { assessmentService } from '@/services'
import { extractErrorMessage } from '@/services/api'
import { queryKeys } from '@/services/queryKeys'
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

// The backend embeds methods, consultations and scores in the project read and in the create
// response (D63 c): one request for Tool 2.
function splitAssessment(data) {
  if (!data) return NOT_STARTED
  const { methods, consultations, scores, ...assessment } = data
  return {
    assessment,
    methods: methods ?? [],
    consultations: consultations ?? [],
    impactScores: normalizeImpactScores(scores),
  }
}

async function loadAssessment(projectId) {
  return splitAssessment(await assessmentService.getByProject(projectId))
}

/**
 * Query options of a project's assessment, for loading it outside the hook (e.g. on export)
 * @param {string} projectId
 */
export const assessmentQuery = (projectId) => ({
  queryKey: queryKeys.assessment(projectId),
  queryFn: () => loadAssessment(projectId),
  // Not behind an open form: a change by someone else is caught at save (409, D62)
  refetchOnReconnect: false,
})

/**
 * Hook لإدارة حالة التقييم
 * @param {string} projectId - معرف المشروع
 */
export function useAssessment(projectId) {
  const query = useQuery({ ...assessmentQuery(projectId), enabled: !!projectId })
  const { assessment, methods, consultations, impactScores } = query.data ?? NOT_STARTED
  const assessmentId = assessment?._id
  const { save, fail, isSaving, error, queryClient } = useProjectSave(
    projectId,
    queryKeys.assessment(projectId)
  )

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
  // A write that answers the whole assessment (methods, consultations, scores)
  const storeAll = useCallback((data) => store(splitAssessment(data)), [store])

  // Every content write needs the record (the gateway creates it first). `request` gets the id
  // and the version the page shows, read when the request starts (D62).
  const withAssessment = useCallback(
    (request, onSaved) =>
      assessmentId
        ? save(
            () =>
              request(
                assessmentId,
                queryClient.getQueryData(queryKeys.assessment(projectId))?.assessment?.updatedAt
              ),
            onSaved
          )
        : Promise.resolve(fail('Assessment record not found.')),
    [assessmentId, save, fail, queryClient, projectId]
  )

  /**
   * بدء تقييم جديد
   * ينشئ assessment حقيقي في الباك إند
   */
  const startAssessment = useCallback(() => {
    if (assessment) return Promise.resolve({ success: true, data: assessment })
    // Every input starts empty: nothing is prefilled and no placeholder is saved (D69). The
    // backend sets the officer and creates all scores as Negligible (D54); project activity
    // and description are required at submit.
    return save(
      () => assessmentService.create({ project: projectId }),
      (created) => store(splitAssessment(created))
    ).then((result) =>
      result.success ? { ...result, data: splitAssessment(result.data).assessment } : result
    )
  }, [assessment, projectId, save, store])

  /**
   * حفظ البيانات الوصفية (Metadata)
   */
  const saveMetadata = useCallback(
    (data) => {
      if (!projectId) return Promise.resolve(fail('Missing project id.'))
      if (!assessmentId) {
        return save(
          () => assessmentService.create({ project: projectId, ...data }),
          (created) => store(splitAssessment(created))
        )
      }
      return withAssessment(
        (id, version) => assessmentService.update(id, { ...data, version }),
        storeAssessment
      )
    },
    [projectId, assessmentId, save, fail, store, withAssessment, storeAssessment]
  )

  /**
   * حفظ طرق التقييم (AssessmentMethod)
   * @param {Array} newMethods - طرق التقييم البيئي
   * Structure: [{ method_type, details }]
   */
  const saveMethods = useCallback(
    (newMethods) =>
      withAssessment(
        (id, version) => assessmentService.setMethods(id, newMethods, version),
        storeAll
      ),
    [withAssessment, storeAll]
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
        (id, version) => assessmentService.setConsultations(id, newConsultations, version),
        storeAll
      ),
    [withAssessment, storeAll]
  )

  /**
   * حفظ نتائج التأثير (draft and before submit)
   * The backend recalculates the totals on every score change, so the assessment returned by
   * the update below already carries them. The update sends the version the scores left (D62).
   */
  const saveImpactScores = useCallback(
    (scores, negativeImpact, positiveImpact) =>
      withAssessment(
        async (id, version) => {
          const scored = await assessmentService.addScores(id, scores, version)
          storeAll(scored)
          const updated = await assessmentService.update(id, {
            potential_negative_impact: negativeImpact,
            potential_positive_impact: positiveImpact,
            version: scored.updatedAt,
          })
          return { scored, updated }
        },
        ({ updated }) => storeAssessment(updated)
      ).then((result) => (result.success ? { ...result, data: result.data.updated } : result)),
    [withAssessment, storeAll, storeAssessment]
  )

  /**
   * إرسال التقييم للموافقة
   */
  const submitAssessment = useCallback(
    () => withAssessment((id, version) => assessmentService.submit(id, version), storeAssessment),
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
    isLoading: !!projectId && query.isPending,
    isSaving,
    error: error ?? (query.error ? extractErrorMessage(query.error) : null),
    // The assessment could not be read at all (not a failed save, not a failed background refresh)
    loadError: query.error && query.data === undefined ? extractErrorMessage(query.error) : null,
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
