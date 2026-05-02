# Resume Analyzer Migration

This project analyzes a resume against a job description and returns a structured ATS-style report.

## Setup Instructions

### 1. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Get a free Gemini API key

Create an API key in Google AI Studio: https://aistudio.google.com/apikey

### 3. Configure the server

Copy `server/.env.example` to `server/.env` and set `GEMINI_API_KEY`.

### 4. Start the server

```bash
cd server
npm run dev
```

### 5. Test the API

```bash
curl -X POST http://localhost:5001/api/resume/upload \
  -F "file=@./resume.pdf"

curl -X POST http://localhost:5001/api/resume/analyze \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"YOUR_SESSION_ID","jobDescription":"Your job description here..."}'

curl -X DELETE http://localhost:5001/api/resume/session/YOUR_SESSION_ID
```

## Free Tier Limits

| Limit         | Value              |
|---------------|--------------------|
| Requests/day  | 1,500              |
| Requests/min  | 15                 |
| Tokens/min    | 1,000,000          |
| Cost          | ₹0 (free forever)  |

## Gemini Notes

The backend uses `GEMINI_MODEL=gemini-2.5-flash` by default. The resume API also exposes `/api/resume/*` routes with rate limiting applied only to that alias, while the legacy `/api/*` paths remain available for the current client.

## 🚀 Deployment

The application is **already deployed**:

- **Frontend**: https://resume-analyzer-beta-rose.vercel.app (on Vercel)
- **Backend**: Ready to deploy to Railway, Render, or Heroku

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

### Quick Deploy (Backend to Railway)
1. Go to https://railway.app
2. Connect GitHub repo
3. Add env variables (`GEMINI_API_KEY`, `JWT_SECRET`)
4. Done! Copy the URL and update Vercel `VITE_API_URL`

## 🔐 Authentication

The app includes JWT-based authentication:
- **Sign Up**: Create account with email/password
- **Login**: Access protected routes after authentication
- **Protected Routes**: `/analyze`, `/how-it-works`, `/about`
- **API**: All backend API routes require JWT token

## Tech Stack

- **Frontend**: React 19 + Vite + Tailwind CSS + React Router
- **Backend**: Express.js + Node.js
- **AI**: Google Gemini API (free tier)
- **Search**: FAISS vector database + Xenova embeddings
- **Auth**: JWT tokens + bcryptjs password hashing
- **Deployment**: Vercel (frontend) + Railway/Render/Heroku (backend)
