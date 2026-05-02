export default function HowItWorks() {
  return (
    <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-zinc-100 mb-4">How It Works</h1>
        <p className="text-zinc-400">
          ResumeIQ uses a Retrieval-Augmented Generation (RAG) pipeline to analyze resumes with precision.
        </p>
      </div>

      {/* Stage 1: Upload */}
      <section className="mb-12 p-6 card">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-amber-400/10 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-amber-400 font-bold">1</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-zinc-100 mb-2">Upload & Extract</h2>
            <p className="text-zinc-400 mb-3">
              You upload your resume in PDF format. The system extracts text content page by page using a PDF parser.
            </p>
            <ul className="text-sm text-zinc-500 space-y-1">
              <li>• PDF parsing with page extraction</li>
              <li>• Text cleaning and normalization</li>
              <li>• Metadata preservation (page count, file size)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Stage 2: Chunk & Embed */}
      <section className="mb-12 p-6 card">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-emerald-400/10 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-emerald-400 font-bold">2</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-zinc-100 mb-2">Split into Chunks</h2>
            <p className="text-zinc-400 mb-3">
              The extracted text is split into semantic chunks using recursive character splitting. This preserves context while making content searchable.
            </p>
            <ul className="text-sm text-zinc-500 space-y-1">
              <li>• Chunk size: 250 tokens</li>
              <li>• Overlap: 30 tokens (for context continuity)</li>
              <li>• Semantic preservation via recursive splitting</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Stage 3: Embedding & Indexing */}
      <section className="mb-12 p-6 card">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-rose-400/10 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-rose-400 font-bold">3</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-zinc-100 mb-2">Generate Embeddings & Index</h2>
            <p className="text-zinc-400 mb-3">
              Each chunk is converted into a dense vector (embedding) using a local transformer model. These vectors are indexed in FAISS for fast similarity search.
            </p>
            <ul className="text-sm text-zinc-500 space-y-1">
              <li>• Model: Xenova/all-MiniLM-L6-v2 (local, 384-dim)</li>
              <li>• Index: FAISS flat index (exact search)</li>
              <li>• Storage: Persistent JSON docstore</li>
              <li>• TTL: 24 hours (auto-cleanup)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Stage 4: Analysis */}
      <section className="mb-12 p-6 card">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-400/10 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-blue-400 font-bold">4</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-zinc-100 mb-2">Query & Retrieve Context</h2>
            <p className="text-zinc-400 mb-3">
              When you analyze against a job description, the system embeds that JD and searches the FAISS index for the most relevant resume sections.
            </p>
            <ul className="text-sm text-zinc-500 space-y-1">
              <li>• Top-K retrieval: 2 most relevant chunks</li>
              <li>• Cosine similarity-based ranking</li>
              <li>• Context augmentation for RAG</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Stage 5: LLM Scoring */}
      <section className="mb-12 p-6 card">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-purple-400/10 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-purple-400 font-bold">5</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-zinc-100 mb-2">LLM Analysis & Scoring</h2>
            <p className="text-zinc-400 mb-3">
              The retrieved resume context, job description, and a detailed rubric are sent to a Large Language Model (Gemini 2.5 Flash). The model returns structured JSON with ATS scores and recommendations.
            </p>
            <ul className="text-sm text-zinc-500 space-y-1">
              <li>• Prompt: System role + rubric + context + JD</li>
              <li>• Response format: JSON (structured output)</li>
              <li>• Scoring: ATS score (0–100), match %, skills</li>
              <li>• Suggestions: Actionable improvement tips</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="p-6 bg-surface-800/50 rounded-xl border border-surface-700">
        <h2 className="text-xl font-bold text-zinc-100 mb-4">Why RAG?</h2>
        <p className="text-zinc-400 mb-4">
          RAG (Retrieval-Augmented Generation) combines the strengths of both:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-emerald-400 mb-2">Retrieval</h3>
            <p className="text-sm text-zinc-500">
              Fast, semantic search of your resume finds the most relevant sections for the job.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-amber-400 mb-2">Generation</h3>
            <p className="text-sm text-zinc-500">
              LLM synthesizes insights and scores based on context, not just keyword matching.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
