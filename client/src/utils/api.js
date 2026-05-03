import axios from 'axios'

const apiBaseURL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'

const api = axios.create({
  baseURL: apiBaseURL,
  timeout: 300000, // 5 min — timeout for API requests
})

const normalizeApiError = (error, fallback = 'Request failed') => {
  const status = error?.response?.status
  const dataError = error?.response?.data?.error
  const raw = error?.response?.data || null

  // Vite dev proxy returns 502 when backend is unavailable.
  if (status === 502 || error?.code === 'ERR_NETWORK') {
    return {
      error:
        'Backend API is unreachable. Start the server on http://localhost:5001 and try again.',
      status,
    }
  }

  return {
    error: dataError || error?.message || fallback,
    status,
    raw,
  }
}

// ── Global error interceptor (optional but recommended) ─────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', normalizeApiError(error))
    return Promise.reject(error)
  }
)

// ── uploadResume ─────────────────────────────────────────────
// POST /api/upload — sends PDF as multipart/form-data
// Returns { sessionId, pageCount, chunkCount }
export const uploadResume = async (file, onProgress) => {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const { data } = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      },
    })

    return data
  } catch (err) {
    const normalized = normalizeApiError(err, 'Upload failed')
    // Log a concise string so devtools shows the message clearly
    console.error('Upload error:', normalized.error)
    const e = new Error(normalized.error)
    e.raw = normalized.raw
    e.status = normalized.status
    throw e
  }
}

// ── analyzeResume ────────────────────────────────────────────
// POST /api/analyze — sends sessionId + jobDescription
// Returns { ats_score, match_percentage, missing_skills, present_skills, suggestions, meta }
export const analyzeResume = async (sessionId, jobDescription) => {
  try {
    const { data } = await api.post('/analyze', { sessionId, jobDescription })
    return data
  } catch (err) {
    const normalized = normalizeApiError(err, 'Analysis failed')
    console.error('Analyze error:', normalized.error)
    const e = new Error(normalized.error)
    e.raw = normalized.raw
    e.status = normalized.status
    throw e
  }
}

// ── deleteSession ────────────────────────────────────────────
// DELETE /api/session/:sessionId — cleans up FAISS index
export const deleteSession = async (sessionId) => {
  try {
    await api.delete(`/session/${sessionId}`)
  } catch (err) {
    const normalized = normalizeApiError(err, 'Delete failed')
    console.error('Delete error:', normalized.error)
  }
}

export const exportToPDF = async (sessionId, results) => {
  try {
    const response = await api.post(
      '/export',
      { sessionId, results },
      { responseType: 'blob' }
    )

    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'resume-analysis.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (err) {
    const normalized = normalizeApiError(err, 'Export failed')
    const e = new Error(normalized.error)
    e.raw = normalized.raw
    e.status = normalized.status
    throw e
  }
}