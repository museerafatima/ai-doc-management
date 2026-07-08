'use client'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

export default function UploadDropzone({
  workspaceId,
  onUploaded,
}: {
  workspaceId: string
  onUploaded: () => void
}) {
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('file', file)

      // fetch() can't report upload progress, so we use XMLHttpRequest here
      const xhr = new XMLHttpRequest()
      xhr.open(
        'POST',
        `http://localhost:8000/workspaces/${workspaceId}/documents/`
      )
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100))
        }
      }

      xhr.onloadstart = () => {
        setUploading(true)
        setError('')
      }

      xhr.onload = () => {
        setUploading(false)
        setProgress(0)
        if (xhr.status >= 200 && xhr.status < 300) {
          onUploaded()
        } else {
          setError(JSON.parse(xhr.responseText)?.detail || 'Upload failed')
        }
      }

      xhr.send(formData)
    },
    [workspaceId, onUploaded]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  })

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-brand bg-brand/5'
            : 'border-line bg-surface hover:border-brand/40'
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-2xl mb-2">{isDragActive ? '📥' : '📤'}</div>
        <p className="text-sm font-medium text-foreground">
          {isDragActive
            ? 'Drop the file here'
            : 'Drag a file here, or click to browse'}
        </p>
        <p className="text-xs text-muted mt-1">
          PDF, DOCX, images, Excel — up to 50MB
        </p>
      </div>

      {uploading && (
        <div className="mt-3">
          <div className="bg-line rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-accent h-1.5 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted font-mono mt-1">{progress}%</p>
        </div>
      )}
      {error && <p className="text-xs text-danger mt-2">{error}</p>}
    </div>
  )
}
