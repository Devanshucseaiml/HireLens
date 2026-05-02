// components/AnalyzingState.jsx
export default function AnalyzingState() {
  const steps = [
    { label: 'Loading vector index',       done: true  },
    { label: 'Retrieving relevant chunks', done: true  },
    { label: 'Running LLM analysis',       done: false },
    { label: 'Structuring results',        done: false },
  ]

  return (
    <div className="card noise h-full min-h-[320px] flex items-center justify-center">
      <div className="card-inner flex flex-col items-center gap-6 p-8 text-center">

        {/* Spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-surface-600" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-400 animate-spin" />
          <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-amber-400/40 animate-spin-slow" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse-slow" />
          </div>
        </div>

        <div>
          <p className="text-sm font-mono text-amber-400 tracking-wide">Analyzing resume...</p>
          <p className="text-xs text-zinc-600 mt-1.5">Local LLM inference in progress</p>
        </div>

        {/* Pipeline steps */}
        <div className="space-y-2 w-full max-w-[220px]">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2.5">
              {step.done ? (
                <div className="w-4 h-4 rounded-full bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center shrink-0">
                  <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="w-4 h-4 rounded-full border border-surface-500 flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-surface-500 animate-pulse" />
                </div>
              )}
              <span className={`text-xs font-mono ${step.done ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
