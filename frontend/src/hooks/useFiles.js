/**
 * useFiles Hook
 * إدارة ملفات المشروع والملحقات
 */

import { useState, useEffect, useCallback } from 'react'
import { groupAttachmentsByType } from '@/utils/attachmentsHelpers'

/**
 * Hook لإدارة الملفات والمرفقات
 */
export function useFiles(projectId) {
  const [attachments, setAttachments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState(null)

  const loadFiles = useCallback(async () => {
    if (!projectId) return
    try {
      setIsLoading(true)
      setError(null)
      await new Promise((resolve) => setTimeout(resolve, 500))
      // TODO: replace with attachmentService.getByProject(projectId) when API is available
      setAttachments([])
    } catch (err) {
      setError('Failed to load project files')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  const refetch = useCallback(() => {
    loadFiles()
  }, [loadFiles])

  useEffect(() => {
    if (projectId) {
      loadFiles()
    }
  }, [projectId, loadFiles])

  /**
   * رفع ملف جديد (محاكاة)
   */
  const uploadFile = useCallback(
    async (file, entityType) => {
      try {
        setIsUploading(true)
        setError(null)

        // محاكاة رفع الملف
        await new Promise((resolve) => setTimeout(resolve, 1500))

        const newAttachment = {
          _id: `att_temp_${Date.now()}`,
          entity_type: entityType,
          entity_id: projectId,
          file_name: file.name,
          file_path: `/uploads/${entityType}/${file.name}`,
          file_type: file.name.split('.').pop().toLowerCase(),
          file_size: file.size,
          uploaded_by: '507f1f77bcf86cd799439001', // Current user (mock)
          createdAt: new Date().toISOString(),
        }

        setAttachments((prev) => [...prev, newAttachment])

        return { success: true, attachment: newAttachment }
      } catch (err) {
        setError('Failed to upload file')
        console.error(err)
        return { success: false, error: err.message }
      } finally {
        setIsUploading(false)
      }
    },
    [projectId]
  )

  /**
   * حذف ملف (محاكاة)
   */
  const deleteFile = useCallback(async (attachmentId) => {
    try {
      setError(null)

      // محاكاة حذف الملف
      await new Promise((resolve) => setTimeout(resolve, 500))

      setAttachments((prev) => prev.filter((a) => a._id !== attachmentId))

      return { success: true }
    } catch (err) {
      setError('Failed to delete file')
      console.error(err)
      return { success: false, error: err.message }
    }
  }, [])

  /**
   * الحصول على ملفات حسب النوع
   */
  const getFilesByType = useCallback(
    (entityType) => {
      return attachments.filter((a) => a.entity_type === entityType)
    },
    [attachments]
  )

  /**
   * الحصول على ملفات مجمعة حسب النوع
   */
  const getGroupedFiles = useCallback(() => {
    return groupAttachmentsByType(attachments)
  }, [attachments])

  /**
   * تحميل ملف (محاكاة)
   */
  const downloadFile = useCallback(async (attachment) => {
    try {
      // محاكاة تحميل الملف — في الإنتاج: window.open(attachment.file_path, '_blank')
      return { success: true }
    } catch (err) {
      setError('Failed to download file')
      console.error(err)
      return { success: false, error: err.message }
    }
  }, [])

  return {
    attachments,
    isLoading,
    isUploading,
    error,
    refetch,
    uploadFile,
    deleteFile,
    getFilesByType,
    getGroupedFiles,
    downloadFile,
  }
}
