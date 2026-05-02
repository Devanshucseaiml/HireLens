import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function Navbar() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path) => location.pathname === path

  const navLinks = [
    { path: '/analyze', label: 'Analyze' },
    { path: '/how-it-works', label: 'How It Works' },
    { path: '/about', label: 'About' },
  ]

  return (
    <header className="border-b border-surface-700 px-6 py-4 sticky top-0 bg-surface-900 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
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
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm transition-colors ${
                isActive(link.path)
                  ? 'text-amber-400 font-medium'
                  : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-400">{user.email}</span>
              <button
                onClick={logout}
                className="text-sm px-3 py-1.5 rounded border border-zinc-600 text-zinc-300 hover:text-zinc-100 hover:border-zinc-400"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-sm px-3 py-1.5 text-zinc-400 hover:text-zinc-100">
                Sign in
              </Link>
              <Link to="/signup" className="text-sm px-3 py-1.5 rounded bg-amber-400 text-black hover:bg-amber-300">
                Sign up
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-zinc-400 hover:text-zinc-100"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <nav className="md:hidden mt-4 pb-4 border-t border-surface-700 pt-4 flex flex-col gap-3">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`text-sm transition-colors ${
                isActive(link.path)
                  ? 'text-amber-400 font-medium'
                  : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              <div className="text-sm text-zinc-400 py-2">{user.email}</div>
              <button
                onClick={() => {
                  logout()
                  setMobileMenuOpen(false)
                }}
                className="text-sm px-3 py-1.5 text-left rounded border border-zinc-600 text-zinc-300 hover:text-zinc-100"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm px-3 py-1.5 text-zinc-400 hover:text-zinc-100">
                Sign in
              </Link>
              <Link to="/signup" className="text-sm px-3 py-1.5 rounded bg-amber-400 text-black hover:bg-amber-300 text-center">
                Sign up
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  )
}
