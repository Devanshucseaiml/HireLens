import React, { useState } from 'react'

const pretty = (obj) => {
  try {
    return JSON.stringify(obj, null, 2)
  } catch (e) {
    return String(obj)
  }
}

export default function DebugErrorModal({ open, onClose, message, raw }) {
  if (!open) return null

  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const text = pretty(raw)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch (e) {
      try {
        const ta = document.createElement('textarea')
        ta.value = text
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        setCopied(true)
        setTimeout(() => setCopied(false), 1800)
      } catch (err) {
        // ignore
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative max-w-3xl w-full mx-4 bg-surface-800 border border-surface-700 rounded-lg p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-medium text-zinc-100">Debug Error</h3>
            <p className="text-xs text-zinc-400 mt-1">{message}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="text-sm text-zinc-400 hover:text-zinc-200"
            >
              {copied ? 'Copied' : 'Copy JSON'}
            </button>
            <button
              onClick={onClose}
              className="text-sm text-zinc-400 hover:text-zinc-200"
            >
              Close
            </button>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="text-xs text-zinc-500 mb-2">Raw backend JSON</h4>
          <pre className="bg-surface-700 p-3 rounded text-xs overflow-auto max-h-80">{pretty(raw)}</pre>
        </div>

        <div className="mt-3 text-xs text-zinc-500">Dev only: visible in development mode.</div>
      </div>
    </div>
  )
}
