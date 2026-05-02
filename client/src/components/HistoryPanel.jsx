import { useMemo, useState } from 'react'

const scoreBadgeClass = (score) => {
  if (score >= 75) return 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30'
  if (score >= 55) return 'bg-amber-400/10 text-amber-300 border-amber-400/30'
  return 'bg-rose-400/10 text-rose-300 border-rose-400/30'
}

export default function HistoryPanel({ history, onView, onDelete, onClear }) {
  const [open, setOpen] = useState(false)
  const hasHistory = history.length > 0
  const sortedHistory = useMemo(() => [...history], [history])

  return (
    <section className="mt-8 card noise">
      <div className="card-inner p-5">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-2 text-sm font-mono text-zinc-200 hover:text-white"
          >
            <span>{open ? '▾' : '▸'}</span>
            Analysis History ({history.length})
          </button>
          {hasHistory && (
            <button
              onClick={onClear}
              className="text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        <div
          className={`transition-all duration-300 overflow-hidden ${
            open ? 'max-h-[900px] opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}
        >
          {!hasHistory ? (
            <p className="text-sm text-zinc-500 italic">No history yet</p>
          ) : (
            <div className="space-y-3">
              {sortedHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-surface-600 bg-surface-700/50 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-zinc-200">{entry.fileName}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {new Date(entry.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-md border text-xs font-mono ${scoreBadgeClass(entry.ats_score)}`}
                    >
                      ATS {entry.ats_score}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => onView(entry.results)}
                      className="px-2.5 py-1.5 text-xs rounded-md border border-surface-500 text-zinc-300 hover:text-zinc-100 hover:border-zinc-400"
                    >
                      View
                    </button>
                    <button
                      onClick={() => onDelete(entry.id)}
                      className="px-2.5 py-1.5 text-xs rounded-md border border-rose-400/30 text-rose-300 hover:text-rose-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
