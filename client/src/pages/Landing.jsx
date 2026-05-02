import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-16">
      {/* Hero Section */}
      <section className="mb-20 text-center">
        <h1 className="text-5xl font-bold text-zinc-100 mb-4 leading-tight">
          Analyze Your Resume with AI
        </h1>
        <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
          Compare your resume against job descriptions using a local, privacy-first RAG pipeline. Get instant ATS scores and improvement suggestions.
        </p>
        <Link
          to="/analyze"
          className="inline-block px-6 py-3 bg-amber-400 text-black font-medium rounded-lg hover:bg-amber-300 transition-colors"
        >
          Start Analyzing
        </Link>
      </section>

      {/* Features Grid */}
      <section className="mb-20">
        <h2 className="text-2xl font-bold text-zinc-100 mb-12 text-center">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6 border border-surface-600">
            <div className="w-10 h-10 bg-amber-400/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-zinc-100 mb-2">100% Local & Private</h3>
            <p className="text-sm text-zinc-400">All processing happens locally. Your data never leaves your machine.</p>
          </div>

          <div className="card p-6 border border-surface-600">
            <div className="w-10 h-10 bg-emerald-400/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-zinc-100 mb-2">AI-Powered Analysis</h3>
            <p className="text-sm text-zinc-400">Uses RAG (Retrieval-Augmented Generation) for accurate skill matching.</p>
          </div>

          <div className="card p-6 border border-surface-600">
            <div className="w-10 h-10 bg-rose-400/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-zinc-100 mb-2">Instant Results</h3>
            <p className="text-sm text-zinc-400">Get ATS scores, missing skills, and actionable improvement suggestions in seconds.</p>
          </div>
        </div>
      </section>

      {/* How It Works Preview */}
      <section className="mb-20 bg-surface-800/50 rounded-xl border border-surface-700 p-8">
        <h2 className="text-2xl font-bold text-zinc-100 mb-6">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { num: '1', label: 'Upload', desc: 'Upload your PDF resume' },
            { num: '2', label: 'Embed', desc: 'Build vector embeddings' },
            { num: '3', label: 'Compare', desc: 'Match against job description' },
            { num: '4', label: 'Score', desc: 'Get AI-powered analysis' },
          ].map((step) => (
            <div key={step.num} className="text-center">
              <div className="w-12 h-12 bg-amber-400/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-amber-400/30">
                <span className="text-amber-400 font-bold">{step.num}</span>
              </div>
              <h3 className="font-semibold text-zinc-100 text-sm mb-1">{step.label}</h3>
              <p className="text-xs text-zinc-500">{step.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            to="/how-it-works"
            className="text-amber-400 hover:text-amber-300 text-sm font-medium"
          >
            Learn more →
          </Link>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="mb-20 text-center">
        <h2 className="text-2xl font-bold text-zinc-100 mb-8">Tech Stack</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {[
            'React',
            'Vite',
            'Express.js',
            'FAISS',
            'Xenova Embeddings',
            'Tailwind CSS',
            'Node-cron',
            'PDFKit',
          ].map((tech) => (
            <span
              key={tech}
              className="px-3 py-1.5 bg-surface-700 border border-surface-600 rounded-full text-xs text-zinc-300 font-mono"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-12 border-t border-surface-700">
        <h2 className="text-2xl font-bold text-zinc-100 mb-4">Ready to optimize your resume?</h2>
        <Link
          to="/analyze"
          className="inline-block px-6 py-3 bg-amber-400 text-black font-medium rounded-lg hover:bg-amber-300 transition-colors"
        >
          Start Now
        </Link>
      </section>
    </main>
  )
}
