import { useRef, useState, useEffect } from 'react'
import { useAnalyzer, STEPS } from './hooks/useAnalyzer'
import DropZone       from './components/DropZone'
import ResultsPanel   from './components/ResultsPanel'
import AnalyzingState from './components/AnalyzingState'
import EmptyState     from './components/EmptyState'
import DebugErrorModal from './components/DebugErrorModal'
import HistoryPanel from './components/HistoryPanel'
import { useHistory } from './hooks/useHistory'

// ── Header ───────────────────────────────────────────────────
const Header = () => (
  <header className="border-b border-surface-700 px-6 py-4">
    <div className="max-w-6xl mx-auto flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-amber-400 flex items-center justify-center">
          <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>
        <div>
          <span className="font-mono text-sm font-medium text-zinc-100">ResumeIQ</span>
          <span className="ml-2 text-[10px] font-mono text-zinc-600 bg-surface-700 border border-surface-600 px-1.5 py-0.5 rounded">
            local AI
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span className="text-xs font-mono text-zinc-500">RAG · FAISS · Gemini</span>
      </div>
    </div>
  </header>
)

// ── ErrorBanner ───────────────────────────────────────────────
const ErrorBanner = ({ error, onDismiss }) => (
  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-400/5 border border-rose-400/20 animate-fade-in">
    <svg className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
    <p className="text-xs text-rose-300 flex-1 leading-relaxed">{error}</p>
    <button onClick={onDismiss} className="text-rose-500 hover:text-rose-300 transition-colors">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
)

// ── App ───────────────────────────────────────────────────────
export default function App() {
  const {
    step, file, sessionId, uploadProgress,
    jobDescription, results, error,
    errorRaw,
    errorStatus,
    isRetrying,
    retryMessage,
    pageCount, chunkCount,
    handleFile, handleAnalyze, handleReset,
    setJobDescription, setClientError, canAnalyze, loadHistoryResult,
  } = useAnalyzer()

  const [debugOpen, setDebugOpen] = useState(false)
  const { history, addToHistory, clearHistory, removeEntry } = useHistory()
  const savedResultRef = useRef(null)

  const isUploading  = step === STEPS.UPLOADING
  const isAnalyzing  = step === STEPS.ANALYZING
  const hasResults   = step === STEPS.DONE
  const isReady      = step === STEPS.READY
  const hasError     = step === STEPS.ERROR

  useEffect(() => {
    if (!import.meta.env.DEV) return
    if (!hasError) return
    if (!errorRaw && !errorStatus) return

    const status = Number(errorStatus) || (errorRaw && errorRaw.status) || null
    if (status && status >= 400 && status < 500) {
      setDebugOpen(true)
    }
  }, [hasError, errorRaw, errorStatus])

  const textareaRef = useRef(null)

  useEffect(() => {
    if (step !== STEPS.DONE || !results) return

    const marker = `${results?.meta?.sessionId || 'no-session'}:${results?.meta?.processingTimeMs || Date.now()}`
    if (savedResultRef.current === marker) return

    addToHistory(file?.name || 'resume.pdf', results)
    savedResultRef.current = marker
  }, [step, results, file, addToHistory])

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-xl font-medium text-zinc-100 tracking-tight">
            Resume Analyzer
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Upload your resume and analyze it against any job description.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT */}
          <div className="space-y-4">

            {/* Upload */}
            <div className="card noise">
              <div className="card-inner p-5 space-y-4">
                <h2 className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
                  01 / Upload Resume
                </h2>

                <DropZone
                  onFile={handleFile}
                  onError={setClientError}
                  file={file}
                  uploading={isUploading}
                  progress={uploadProgress}
                />

                {sessionId && (
                  <div className="flex gap-3">
                    <div className="flex-1 text-xs">Pages: {pageCount}</div>
                    <div className="flex-1 text-xs">Chunks: {chunkCount}</div>
                  </div>
                )}
              </div>
            </div>

            {/* JD */}
            <div className="card noise">
              <div className="card-inner p-5 space-y-3">
                <h2 className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
                  02 / Job Description
                </h2>

                <textarea
                  ref={textareaRef}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  disabled={!sessionId || isAnalyzing}
                  placeholder="Paste job description..."
                  className="input-base p-3"
                  rows={8}
                />

                <button
                  onClick={handleAnalyze}
                  disabled={
                    !sessionId ||
                    !canAnalyze ||
                    isAnalyzing ||
                    isUploading ||
                    jobDescription.trim().length < 20
                  }
                  className="btn-primary bg-amber-400 text-black"
                >
                  {isAnalyzing ? 'Analyzing with AI...' : 'Analyze Resume'}
                </button>
                {isRetrying && (
                  <p className="text-xs text-amber-300 font-mono">{retryMessage}</p>
                )}
              </div>
            </div>

            {/* Error */}
            {hasError && error && (
              <div className="space-y-2">
                <ErrorBanner error={error} onDismiss={handleReset} />

                {import.meta.env.DEV && (
                  <div>
                    <button
                      onClick={() => setDebugOpen(true)}
                      className="text-xs text-zinc-400 hover:text-zinc-200"
                    >
                      Show debug details
                    </button>
                  </div>
                )}
              </div>
            )}

            {(hasResults || hasError) && (
              <div className="flex items-center gap-2">
                {hasError && sessionId && jobDescription.trim().length >= 20 && (
                  <button
                    onClick={handleAnalyze}
                    className="px-3 py-1.5 text-xs rounded-md border border-amber-400/30 text-amber-300 hover:text-amber-200"
                  >
                    Try Again
                  </button>
                )}
                <button onClick={handleReset}>
                  Reset
                </button>
              </div>
            )}

          </div>

          {/* RIGHT */}
          <div>
            {isAnalyzing && <AnalyzingState />}
            {hasResults && <ResultsPanel results={results} />}
            {!isAnalyzing && !hasResults && (
              <EmptyState ready={isReady || hasError} />
            )}
          </div>

        </div>
        <HistoryPanel
          history={history}
          onView={loadHistoryResult}
          onDelete={removeEntry}
          onClear={clearHistory}
        />
      </main>
      <DebugErrorModal
        open={debugOpen}
        onClose={() => setDebugOpen(false)}
        message={error}
        raw={errorRaw}
      />
    </div>
  )
}