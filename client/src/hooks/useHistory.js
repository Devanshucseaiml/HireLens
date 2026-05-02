import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'resumeiq_history'
const MAX_ENTRIES = 10

const readHistory = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const useHistory = () => {
  const [history, setHistory] = useState([])

  useEffect(() => {
    setHistory(readHistory())
  }, [])

  const persist = useCallback((nextHistory) => {
    setHistory(nextHistory)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextHistory))
  }, [])

  const addToHistory = useCallback((fileName, results) => {
    const entry = {
      id: createId(),
      timestamp: new Date().toISOString(),
      fileName: fileName || 'resume.pdf',
      ats_score: results?.ats_score ?? 0,
      match_percentage: results?.match_percentage ?? 0,
      results,
    }

    const current = readHistory()
    const next = [entry, ...current].slice(0, MAX_ENTRIES)
    persist(next)
  }, [persist])

  const clearHistory = useCallback(() => {
    persist([])
  }, [persist])

  const removeEntry = useCallback((id) => {
    const current = readHistory()
    const next = current.filter((entry) => entry.id !== id)
    persist(next)
  }, [persist])

  return {
    history,
    addToHistory,
    clearHistory,
    removeEntry,
  }
}

export default useHistory;
