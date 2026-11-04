/**
 * useProjectFiles Hook
 * Files of one project area (Annex A–H, D47): list, upload (several files, one after the other,
 * one refresh at the end), download (authenticated) and delete.
 *
 * Files don't change the workflow state, so writes refresh only this list (not the workspace).
 */
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fileService } from '@/services/fileService'
import { extractErrorMessage } from '@/services/api'
import { queryKeys } from '@/services/queryKeys'
import { useAuth } from '@/contexts'
import { checkFile } from '@/utils/fileRules'

/** Save a Blob under the given name through a temporary link. */
function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

/**
 * @param {string} projectId
 * @param {'annex'} [area]
 */
export function useProjectFiles(projectId, area = 'annex') {
  const queryClient = useQueryClient()
  const { uploadRules } = useAuth()
  const queryKey = queryKeys.files(projectId, area)
  const [uploadingCategory, setUploadingCategory] = useState(null)

  const query = useQuery({
    queryKey,
    queryFn: () => fileService.list(projectId, area),
    enabled: !!projectId,
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey })

  const removeMutation = useMutation({
    mutationFn: (fileId) => fileService.remove(fileId),
    onSuccess: refresh,
  })

  /**
   * Upload the given files to one category, sequentially. Never throws.
   * @param {string} category
   * @param {File[]} files
   * @returns {Promise<{uploaded: number, failed: {name: string, error: string}[]}>}
   */
  const uploadFiles = async (category, files) => {
    const result = { uploaded: 0, failed: [] }
    setUploadingCategory(category)
    try {
      for (const file of files) {
        const refused = checkFile(file, uploadRules)
        if (refused) {
          result.failed.push({ name: file.name, error: refused })
          continue
        }
        try {
          await fileService.upload(projectId, { file, area, category })
          result.uploaded += 1
        } catch (err) {
          result.failed.push({ name: file.name, error: extractErrorMessage(err) })
        }
      }
      if (result.uploaded > 0) await refresh()
    } finally {
      setUploadingCategory(null)
    }
    return result
  }

  /** @param {{_id: string, original_name: string}} file */
  const downloadFile = async (file) => {
    const blob = await fileService.download(file._id)
    saveBlob(blob, file.original_name)
  }

  const files = query.data ?? []

  return {
    files,
    /** @param {string} category */
    filesIn: (category) => files.filter((file) => file.category === category),
    isLoading: query.isPending && !!projectId,
    error: query.error ? extractErrorMessage(query.error) : null,
    retry: query.refetch,
    uploadFiles,
    uploadingCategory,
    downloadFile,
    removeFile: (fileId) => removeMutation.mutateAsync(fileId),
    isRemoving: removeMutation.isPending,
  }
}

export default useProjectFiles
