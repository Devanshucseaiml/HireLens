import { useState, useCallback, useRef } from 'react'
import { uploadResume, analyzeResume, deleteSession } from '../utils/api'

export const STEPS = {
  IDLE:       'idle',
  UPLOADING:  'uploading',
  READY:      'ready',
  ANALYZING:  'analyzing',
  DONE:       'done',
  ERROR:      'error',
}

const initialState = {
  step:           STEPS.IDLE,
  file:           null,
  sessionId:      null,
  uploadProgress: 0,
  jobDescription: '',
  results:        null,
  error:          null,
  errorRaw:       null,
  errorStatus:    null,
  pageCount:      null,
  chunkCount:     null,
  isRetrying:     false,
  retryMessage:   null,
}

export const useAnalyzer = () => {
  const [state, setState] = useState(initialState)
  const sessionRef = useRef(null)

  const set = (patch) => setState((s) => ({ ...s, ...patch }))

  // ── handleFile ──────────────────────────────────────────────
  const handleFile = useCallback(async (file) => {
    if (!file || file.type !== 'application/pdf') {
      set({ error: 'Please upload a PDF file.', step: STEPS.ERROR })
      return
    }

    // cleanup previous session
    if (sessionRef.current) {
      try { await deleteSession(sessionRef.current) } catch (_) {}
      sessionRef.current = null
    }

    set({
      file,
      step: STEPS.UPLOADING,
      error: null,
      results: null,
      uploadProgress: 0,
    })

    try {
      const { sessionId, pageCount, chunkCount } = await uploadResume(
        file,
        (pct) => set({ uploadProgress: pct })
      )

      sessionRef.current = sessionId

      set({
        sessionId,
        pageCount,
        chunkCount,
        step: STEPS.READY,
        uploadProgress: 100,
      })
    } catch (err) {
      const message =
        err?.error ||
        err?.message ||
        err?.response?.data?.error ||
        'Upload failed'

      set({
        step: STEPS.ERROR,
        error: `Upload failed: ${message}`,
        errorRaw: err?.raw || err?.response?.data || null,
        errorStatus: err?.status || err?.response?.status || null,
      })
    }
  }, [])

  // ── handleAnalyze ───────────────────────────────────────────
  const handleAnalyze = useCallback(async () => {
    const sessionId = state.sessionId
    const jobDescription = state.jobDescription?.trim()

    if (!sessionId) {
      set({ error: 'Please upload a resume first.', step: STEPS.ERROR })
      return
    }

    if (!jobDescription || jobDescription.length < 20) {
      set({
        error: 'Please enter a job description (at least 20 characters).',
        step: STEPS.ERROR,
      })
      return
    }

    set({
      step: STEPS.ANALYZING,
      error: null,
      results: null,
      isRetrying: false,
      retryMessage: null,
    })

    try {
      const results = await analyzeResume(sessionId, jobDescription)

      set({
        results,
        step: STEPS.DONE,
        isRetrying: false,
        retryMessage: null,
      })
    } catch (err) {
      const MAX_RETRIES = 3
      let attempt = 0
      let lastError = null

      set({ isRetrying: true })

      while (attempt < MAX_RETRIES) {
        attempt += 1
        const delayMs = 1000 * Math.pow(2, attempt - 1) // exponential backoff
        set({ retryMessage: `Retrying... attempt ${attempt} of ${MAX_RETRIES}` })
        try {
          await new Promise((resolve) => setTimeout(resolve, delayMs))
          const retryResults = await analyzeResume(sessionId, jobDescription)
          set({
            results: retryResults,
            step: STEPS.DONE,
            isRetrying: false,
            retryMessage: null,
          })
          lastError = null
          break
        } catch (retryErr) {
          lastError = retryErr
        }
      }

      if (lastError) {
        const message =
          lastError?.error ||
          lastError?.message ||
          lastError?.response?.data?.error ||
          'Analysis failed'
        set({
          step: STEPS.ERROR,
          error: message.includes('Analysis')
            ? message
            : `Analysis failed: ${message}`,
          errorRaw: lastError?.raw || lastError?.response?.data || null,
          errorStatus: lastError?.status || lastError?.response?.status || null,
          isRetrying: false,
          retryMessage: null,
        })
      }
    }
  }, [state.sessionId, state.jobDescription])

  // ── handleReset ─────────────────────────────────────────────
  const handleReset = useCallback(async () => {
    if (sessionRef.current) {
      try { await deleteSession(sessionRef.current) } catch (_) {}
      sessionRef.current = null
    }
    setState(initialState)
  }, [])

  // ── setJobDescription ───────────────────────────────────────
  const setJobDescription = useCallback((val) => {
    set({ jobDescription: val })
  }, [])

  const setClientError = useCallback((message) => {
    set({
      step: STEPS.ERROR,
      error: message,
      isRetrying: false,
      retryMessage: null,
    })
  }, [])

  const loadHistoryResult = useCallback((result) => {
    if (!result) return
    set({
      results: result,
      step: STEPS.DONE,
      error: null,
      errorRaw: null,
      errorStatus: null,
      isRetrying: false,
      retryMessage: null,
    })
  }, [])

  return {
    ...state,
    handleFile,
    handleAnalyze,
    handleReset,
    setJobDescription,
    setClientError,
    loadHistoryResult,
    canAnalyze:
      state.step === STEPS.READY ||
      state.step === STEPS.DONE ||
      state.step === STEPS.ERROR,
  }
}