export default function About() {
  return (
    <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-zinc-100 mb-4">About ResumeIQ</h1>
        <p className="text-zinc-400 text-lg">
          An open-source, privacy-first resume analyzer powered by local AI and RAG.
        </p>
      </div>

      {/* Project Overview */}
      <section className="mb-12 p-6 card">
        <h2 className="text-xl font-bold text-zinc-100 mb-4">Project Overview</h2>
        <p className="text-zinc-400 mb-4">
          ResumeIQ demonstrates how modern AI techniques like Retrieval-Augmented Generation (RAG) can be applied to real-world problems while keeping user data private.
        </p>
        <p className="text-zinc-400">
          Instead of uploading your resume to a cloud service, all processing happens locally on your machine. Your resume is never sent anywhere—only analyzed and compared to your job description.
        </p>
      </section>

      {/* Tech Stack */}
      <section className="mb-12 p-6 card">
        <h2 className="text-xl font-bold text-zinc-100 mb-6">Tech Stack</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-amber-400 mb-3">Frontend</h3>
            <ul className="text-sm text-zinc-400 space-y-2">
              <li>• React 19.2 — UI framework</li>
              <li>• Vite 8 — Build tool</li>
              <li>• React Router 6 — SPA routing</li>
              <li>• Tailwind CSS 3 — Styling</li>
              <li>• Axios — HTTP client</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-emerald-400 mb-3">Backend</h3>
            <ul className="text-sm text-zinc-400 space-y-2">
              <li>• Express.js — REST API</li>
              <li>• FAISS — Vector search</li>
              <li>• Xenova Transformers — Local embeddings</li>
              <li>• node-cron — Task scheduling</li>
              <li>• PDFKit — PDF generation</li>
              <li>• Gemini API — LLM scoring</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="mb-12 p-6 card">
        <h2 className="text-xl font-bold text-zinc-100 mb-6">Key Features</h2>
        <div className="space-y-4">
          <div className="flex gap-3">
            <span className="text-emerald-400 font-bold">✓</span>
            <div>
              <h3 className="font-semibold text-zinc-100">Privacy-First</h3>
              <p className="text-sm text-zinc-400">All processing is local. No resume data uploaded to external services.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-emerald-400 font-bold">✓</span>
            <div>
              <h3 className="font-semibold text-zinc-100">Fast & Responsive</h3>
              <p className="text-sm text-zinc-400">Vite dev server with hot reloading and optimized production builds.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-emerald-400 font-bold">✓</span>
            <div>
              <h3 className="font-semibold text-zinc-100">Rate Limited</h3>
              <p className="text-sm text-zinc-400">Built-in request throttling to prevent abuse and manage API costs.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-emerald-400 font-bold">✓</span>
            <div>
              <h3 className="font-semibold text-zinc-100">Export Results</h3>
              <p className="text-sm text-zinc-400">Download analysis reports as PDF files for record-keeping.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-emerald-400 font-bold">✓</span>
            <div>
              <h3 className="font-semibold text-zinc-100">Analysis History</h3>
              <p className="text-sm text-zinc-400">Local history of past analyses, viewable and searchable in the app.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Highlights */}
      <section className="mb-12 p-6 bg-surface-800/50 rounded-xl border border-surface-700">
        <h2 className="text-xl font-bold text-zinc-100 mb-4">Architecture Highlights</h2>
        <ul className="text-sm text-zinc-400 space-y-2">
          <li>• <strong>RAG Pipeline:</strong> Retrieval + LLM generation for context-aware scoring</li>
          <li>• <strong>FAISS Indexing:</strong> Semantic search on resume content</li>
          <li>• <strong>Local Embeddings:</strong> Xenova transformers run in the browser</li>
          <li>• <strong>Serverless Compatibility:</strong> Express backend can run locally or on any Node.js host</li>
          <li>• <strong>Auto-Cleanup:</strong> Scheduled cron jobs remove old FAISS indexes</li>
          <li>• <strong>Input Validation:</strong> Sanitization and UUID validation for security</li>
        </ul>
      </section>

      {/* Getting Started */}
      <section className="p-6 card">
        <h2 className="text-xl font-bold text-zinc-100 mb-4">Getting Started</h2>
        <div className="bg-surface-900 rounded border border-surface-600 p-4 mb-4">
          <p className="font-mono text-sm text-zinc-300 mb-2">
            # Start the development servers
          </p>
          <p className="font-mono text-sm text-zinc-400">npm run dev  # Both server and client</p>
        </div>
        <p className="text-sm text-zinc-400">
          The app will be available at <span className="font-mono text-amber-400">http://localhost:3001</span>.
        </p>
      </section>
    </main>
  )
}
