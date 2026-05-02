// components/ScoreRing.jsx
import { useEffect, useState } from 'react'

const getColor = (score) => {
  if (score >= 75) return { stroke: '#34d399', text: 'text-emerald-400', label: 'Strong Match' }
  if (score >= 55) return { stroke: '#fbbf24', text: 'text-amber-400',   label: 'Moderate Match' }
  return             { stroke: '#fb7185', text: 'text-rose-400',    label: 'Weak Match' }
}

export default function ScoreRing({ score, size = 160, label = 'ATS Score' }) {
  const [animated, setAnimated] = useState(false)
  const radius      = 42
  const circumf     = 2 * Math.PI * radius  // ~264
  const dashOffset  = circumf - (circumf * score) / 100
  const color       = getColor(score)

  useEffect(() => {
    // Tiny delay so CSS transition fires after mount
    const t = setTimeout(() => setAnimated(true), 50)
    return () => clearTimeout(t)
  }, [score])

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className="rotate-[-90deg]"
        >
          {/* Track */}
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="#242424"
            strokeWidth="7"
          />
          {/* Progress */}
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumf}
            strokeDashoffset={animated ? dashOffset : circumf}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)' }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-mono text-3xl font-semibold ${color.text}`}>
            {score}
          </span>
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">
            / 100
          </span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">{label}</p>
        <p className={`text-xs font-medium mt-0.5 ${color.text}`}>{color.label}</p>
      </div>
    </div>
  )
}
