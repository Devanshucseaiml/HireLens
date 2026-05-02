// components/ResultsPanel.jsx
import { useState } from 'react'
import ScoreRing from './ScoreRing'
import { exportToPDF } from '../utils/api'

// ── SkillTag ─────────────────────────────────────────────────
const SkillTag = ({ label, variant }) => {
  const styles = {
    missing: 'bg-rose-400/10 text-rose-300 border border-rose-400/20',
    present: 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/20',
  }
  return (
    <span className={`tag ${styles[variant]}`}>
      {variant === 'missing' ? '✕' : '✓'} {label}
    </span>
  )
}

// ── SuggestionItem ───────────────────────────────────────────
const SuggestionItem = ({ text, index }) => (
  <div className="flex gap-3 py-3 border-b border-surface-600 last:border-0">
    <span className="font-mono text-xs text-amber-400/60 mt-0.5 shrink-0 w-5">
      {String(index + 1).padStart(2, '0')}
    </span>
    <p className="text-sm text-zinc-300 leading-relaxed">{text}</p>
  </div>
)

// ── MatchBar ─────────────────────────────────────────────────
const MatchBar = ({ value }) => {
  const color = value >= 75 ? 'bg-emerald-400' : value >= 55 ? 'bg-amber-400' : 'bg-rose-400'
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Match %</span>
        <span className="font-mono text-sm text-zinc-200">{value}%</span>
      </div>
      <div className="h-1.5 bg-surface-600 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

// ── MetaChip ─────────────────────────────────────────────────
const MetaChip = ({ label, value }) => (
  <div className="flex flex-col items-center px-4 py-2 bg-surface-700 rounded-lg border border-surface-600">
    <span className="font-mono text-xs text-amber-400">{value}</span>
    <span className="text-[10px] text-zinc-500 mt-0.5">{label}</span>
  </div>
)

// ── ResultsPanel ─────────────────────────────────────────────
export default function ResultsPanel({ results }) {
  const { ats_score, match_percentage, missing_skills, present_skills, suggestions, meta } = results
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  const handleExport = async () => {
    if (!meta?.sessionId) {
      setExportError('Cannot export: session is missing.')
      return
    }

    try {
      setIsExporting(true)
      setExportError('')
      await exportToPDF(meta.sessionId, results)
    } catch (err) {
      setExportError(err.message || 'Failed to export PDF.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-4">

      {/* Row 1 — Scores */}
      <div className="card noise result-card animate-fade-up opacity-0">
        <div className="card-inner p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Analysis Score</h3>
            <div className="flex items-center gap-2">
              {meta && (
                <span className="text-[10px] font-mono text-zinc-600 bg-surface-700 px-2 py-1 rounded-md border border-surface-600">
                  {meta.model} · {(meta.processingTimeMs / 1000).toFixed(1)}s
                </span>
              )}
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono text-zinc-300 border border-surface-500 rounded-md hover:border-zinc-400 hover:text-zinc-100 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5v-9m0 9l3.75-3.75M12 16.5l-3.75-3.75M4.5 19.5h15" />
                </svg>
                {isExporting ? 'Exporting...' : 'Export PDF'}
              </button>
            </div>
          </div>
          {exportError && (
            <div className="mb-4 rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-300">
              {exportError}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Score ring */}
            <ScoreRing score={ats_score} />

            {/* Right side */}
            <div className="flex-1 w-full space-y-5">
              <MatchBar value={match_percentage} />

              {/* Meta chips */}
              {meta && (
                <div className="flex gap-2 flex-wrap">
                  <MetaChip label="Chunks" value={meta.chunksRetrieved} />
                  <MetaChip label="Present" value={present_skills.length} />
                  <MetaChip label="Missing" value={missing_skills.length} />
                  <MetaChip label="Tips" value={suggestions.length} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 — Skills side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Present skills */}
        <div className="card noise result-card animate-fade-up opacity-0">
          <div className="card-inner p-5">
            <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              Present Skills
            </h3>
            {present_skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {present_skills.map((s, i) => (
                  <SkillTag key={i} label={s} variant="present" />
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-600 italic">No matching skills detected</p>
            )}
          </div>
        </div>

        {/* Missing skills */}
        <div className="card noise result-card animate-fade-up opacity-0">
          <div className="card-inner p-5">
            <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />
              Missing Skills
            </h3>
            {missing_skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {missing_skills.map((s, i) => (
                  <SkillTag key={i} label={s} variant="missing" />
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-600 italic">No critical gaps found</p>
            )}
          </div>
        </div>
      </div>

      {/* Row 3 — Suggestions */}
      <div className="card noise result-card animate-fade-up opacity-0">
        <div className="card-inner p-5">
          <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            Improvement Suggestions
          </h3>
          <div className="mt-3">
            {suggestions.length > 0 ? (
              suggestions.map((s, i) => <SuggestionItem key={i} text={s} index={i} />)
            ) : (
              <p className="text-xs text-zinc-600 italic">No suggestions generated</p>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
