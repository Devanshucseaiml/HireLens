// components/EmptyState.jsx
export default function EmptyState({ ready }) {
  return (
    <div className="card noise h-full min-h-[320px] flex items-center justify-center">
      <div className="card-inner flex flex-col items-center gap-4 p-8 text-center">

        {/* Grid icon decoration */}
        <div className="w-16 h-16 rounded-2xl bg-surface-700 border border-surface-600 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-px p-2">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className="rounded-sm"
                style={{
                  background: i % 3 === 0 ? '#2e2e2e' : i % 5 === 0 ? '#383838' : '#1a1a1a',
                  opacity: ready ? 1 : 0.4,
                  transition: `opacity ${0.1 * i}s ease`,
                }}
              />
            ))}
          </div>
          <svg className="w-6 h-6 text-zinc-500 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>

        <div className="space-y-1.5">
          <p className="text-sm text-zinc-400 font-medium">
            {ready ? 'Ready to analyze' : 'Results will appear here'}
          </p>
          <p className="text-xs text-zinc-600 leading-relaxed max-w-[200px]">
            {ready
              ? 'Enter a job description and click Analyze'
              : 'Upload your resume and paste a job description to begin'
            }
          </p>
        </div>

        {ready && (
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-emerald-400">Resume indexed</span>
          </div>
        )}

      </div>
    </div>
  )
}
