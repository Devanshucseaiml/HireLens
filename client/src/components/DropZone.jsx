// components/DropZone.jsx
import { useCallback, useState } from 'react'

const formatFileSize = (bytes) => {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DropZone({ onFile, onError, file, uploading, progress }) {
  const [dragging, setDragging] = useState(false)
  const [sizeWarning, setSizeWarning] = useState('')
  const maxSizeMb = Number(import.meta.env.VITE_MAX_FILE_SIZE_MB || 10)
  const maxBytes = maxSizeMb * 1024 * 1024

  const validateAndSubmit = useCallback((selectedFile) => {
    if (selectedFile.size > maxBytes) {
      const warning = `File exceeds ${maxSizeMb}MB limit.`
      setSizeWarning(warning)
      if (onError) onError(warning)
      return
    }

    setSizeWarning('')
    onFile(selectedFile)
  }, [maxBytes, maxSizeMb, onError, onFile])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) validateAndSubmit(dropped)
  }, [validateAndSubmit])

  const handleChange = (e) => {
    const selected = e.target.files[0]
    if (selected) validateAndSubmit(selected)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`
        relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer
        ${dragging
          ? 'border-amber-400/70 bg-amber-400/5 scale-[1.01]'
          : file
            ? 'border-emerald-400/40 bg-emerald-400/5'
            : 'border-surface-500 bg-surface-700/50 hover:border-surface-400 hover:bg-surface-700'
        }
      `}
    >
      <label className="flex flex-col items-center justify-center gap-3 py-10 px-6 cursor-pointer">
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleChange}
          disabled={uploading}
        />

        {/* Icon */}
        {uploading ? (
          <div className="w-10 h-10 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
        ) : file ? (
          <div className="w-10 h-10 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-surface-600 border border-surface-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
        )}

        {/* Label */}
        <div className="text-center">
          {uploading ? (
            <>
              <p className="text-sm text-amber-400 font-mono">Uploading & indexing...</p>
              <p className="text-xs text-zinc-500 mt-1">Building vector embeddings</p>
            </>
          ) : file ? (
            <>
              <p className="text-sm text-emerald-400 font-mono truncate max-w-[250px]">
                {file.name} · {formatFileSize(file.size)}
              </p>
              {sizeWarning && <p className="text-xs text-rose-400 mt-1">{sizeWarning}</p>}
              <p className="text-xs text-zinc-500 mt-1">Click to replace</p>
            </>
          ) : (
            <>
              <p className="text-sm text-zinc-300">Drop your resume here</p>
              <p className="text-xs text-zinc-500 mt-1">PDF · max {maxSizeMb}MB</p>
              {sizeWarning && <p className="text-xs text-rose-400 mt-2">{sizeWarning}</p>}
            </>
          )}
        </div>

        {/* Progress bar */}
        {uploading && (
          <div className="w-full bg-surface-600 rounded-full h-1 mt-1">
            <div
              className="h-1 rounded-full bg-amber-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </label>
    </div>
  )
}
