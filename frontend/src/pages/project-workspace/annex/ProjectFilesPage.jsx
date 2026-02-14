/**
 * ProjectFilesPage
 * صفحة ملفات المشروع والمرفقات
 */

import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useFiles } from '@/hooks'
import { FileCategoryAccordion } from '@/components/files'
import { FileUpload, Alert, Card, useToast } from '@/components/ui'

export default function ProjectFilesPage() {
  const { projectId } = useParams()
  const toast = useToast()
  const { getFilesByType, uploadFile, deleteFile, downloadFile, isLoading, isUploading, error } =
    useFiles(projectId)

  const [showUploadSection, setShowUploadSection] = useState(false)
  const [selectedEntityType, setSelectedEntityType] = useState('project')

  const fileCategories = [
    {
      entityType: 'project',
      title: 'Project Files',
      description: 'General project documentation and charter files',
      icon: 'folder',
    },
    {
      entityType: 'screening',
      title: 'Screening Files',
      description: 'Environmental screening checklists and reports',
      icon: 'fact_check',
    },
    {
      entityType: 'assessment',
      title: 'Assessment Files',
      description: 'Environmental impact assessment documents and data',
      icon: 'assessment',
    },
    {
      entityType: 'monitoring',
      title: 'Monitoring Files',
      description: 'Quarterly monitoring reports and data',
      icon: 'monitoring',
    },
  ]

  const handleUpload = async (files) => {
    if (files.length > 0) {
      for (const file of files) {
        await uploadFile(file, selectedEntityType)
      }
      setShowUploadSection(false)
      toast.success('Files uploaded successfully!')
    }
  }

  const handleDelete = async (fileId) => {
    const result = await deleteFile(fileId)
    if (result.success) {
      toast.success('File deleted successfully!')
    }
  }

  const handleDownload = async (file) => {
    await downloadFile(file)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-text-secondary dark:text-gray-400 text-sm">Loading project files...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background dark:bg-background-dark p-6 md:p-10 lg:p-12">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-8 pb-20">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 border-b border-border-default dark:border-border-dark pb-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-text-main dark:text-white text-3xl md:text-4xl font-black tracking-tight font-display">
              Project Files & Records
            </h1>
            <p className="text-text-secondary dark:text-gray-400 text-lg font-normal">
              Manage all project documentation and attachments
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowUploadSection(!showUploadSection)}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-md transition-colors"
          >
            <span className="material-symbols-outlined">
              {showUploadSection ? 'close' : 'upload_file'}
            </span>
            {showUploadSection ? 'Cancel Upload' : 'Upload File'}
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="error" title="Error">
            {error}
          </Alert>
        )}

        {/* Upload Section */}
        {showUploadSection && (
          <Card>
            <Card.Header>
              <Card.Title>Upload New File</Card.Title>
              <Card.Description>Select a category and upload files</Card.Description>
            </Card.Header>
            <Card.Body>
              <div className="flex flex-col gap-4">
                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-text-main dark:text-gray-200 mb-2">
                    File Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedEntityType}
                    onChange={(e) => setSelectedEntityType(e.target.value)}
                    className="w-full rounded-lg border border-border-default dark:border-border-dark bg-white dark:bg-[#102216] text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary px-3 py-2.5 text-sm"
                  >
                    {fileCategories.map((cat) => (
                      <option key={cat.entityType} value={cat.entityType}>
                        {cat.title}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-text-secondary dark:text-gray-400 mt-1">
                    {fileCategories.find((c) => c.entityType === selectedEntityType)?.description}
                  </p>
                </div>

                {/* File Upload */}
                <FileUpload
                  accept="*/*"
                  multiple={true}
                  maxSize={10 * 1024 * 1024}
                  onUpload={handleUpload}
                  onError={(errors) => toast.error(errors.join('\n'))}
                  label="Upload Files"
                  hint="Drag and drop files here or click to browse"
                  disabled={isUploading}
                />

                {isUploading && (
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <div className="size-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <span>Uploading files...</span>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Info Alert */}
        <Alert variant="info" title="File Management">
          Organize and manage all project-related files by category. Upload documents, reports,
          photos, and other attachments to support your environmental assessment workflow.
        </Alert>

        {/* File Categories */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-text-main dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">folder_open</span>
            File Categories
          </h2>

          {fileCategories.map((category) => {
            const files = getFilesByType(category.entityType)
            return (
              <FileCategoryAccordion
                key={category.entityType}
                title={category.title}
                entityType={category.entityType}
                files={files}
                onDownload={handleDownload}
                onDelete={handleDelete}
                defaultOpen={category.entityType === 'project'}
                icon={category.icon}
              />
            )
          })}
        </section>

        {/* Statistics Card */}
        <Card>
          <Card.Body>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {fileCategories.map((category) => {
                const count = getFilesByType(category.entityType).length
                return (
                  <div key={category.entityType} className="flex items-center gap-3">
                    <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10">
                      <span className="material-symbols-outlined text-xl text-primary">
                        {category.icon}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-text-secondary dark:text-gray-400">
                        {category.title}
                      </p>
                      <p className="text-2xl font-bold text-text-main dark:text-white">{count}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  )
}
