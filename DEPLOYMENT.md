# 🚀 Backend Deployment Guide

This guide walks you through deploying the Resume Analyzer backend to a cloud platform.

---

## **Option 1: Railway.app (Recommended ⭐)**

**Why Railway?** - Simplest setup, generous free tier, auto-deploys from GitHub

### Step 1: Sign Up
1. Go to https://railway.app
2. Click "Login with GitHub" and authorize
3. Create a new project

### Step 2: Connect Repository
1. Click **"Deploy from GitHub repo"**
2. Select **Devanshucseaiml/HireLens**
3. Choose the `server` directory (if asked)
4. Railway auto-detects Node.js + Express

### Step 3: Set Environment Variables
In Railway dashboard, click your project → Variables

Add these environment variables:
```
GEMINI_API_KEY=your_actual_gemini_api_key_here
JWT_SECRET=your-secure-random-secret-key-change-this
PORT=5001
NODE_ENV=production
```

To get your Gemini API key:
- Visit https://aistudio.google.com/apikey
- Create a new key
- Copy and paste it

### Step 4: Deploy
1. Railway auto-deploys on every GitHub push
2. Wait for build to complete (2-3 minutes)
3. Copy your Railway URL (e.g., `https://hirelens-production.up.railway.app`)

✅ **Backend is now live!**

---

## **Option 2: Render.com (Free Tier)**

**Why Render?** - Generous free tier, simple interface

### Step 1: Sign Up
1. Go to https://render.com
2. Sign up with GitHub
3. Authorize the app

### Step 2: Create Web Service
1. Click **New +** → Select **Web Service**
2. Select **Devanshucseaiml/HireLens** repository
3. Fill in details:
   - **Name**: `hirelens-api` (or your choice)
   - **Root Directory**: `server`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### Step 3: Environment Variables
1. Scroll down to **Environment**
2. Add variables:
   ```
   GEMINI_API_KEY=your_key_here
   JWT_SECRET=your-secret-key
   PORT=5001
   NODE_ENV=production
   ```

### Step 4: Deploy
1. Click **Create Web Service**
2. Render builds and deploys (3-5 minutes)
3. Copy your Render URL (e.g., `https://hirelens-api.onrender.com`)

✅ **Backend is live on Render!**

---

## **Option 3: Heroku (Classic - May Require Credit Card)**

**Note**: Heroku removed free tier in late 2022. Requires verified credit card.

### Step 1: Install Heroku CLI
```bash
brew install heroku
heroku login
```

### Step 2: Create Heroku App
```bash
cd /Users/devanshusharma/Desktop/projects/resume-analyzer
heroku create hirelens-api
```

### Step 3: Set Environment Variables
```bash
heroku config:set GEMINI_API_KEY=your_key
heroku config:set JWT_SECRET=your-secret
heroku config:set NODE_ENV=production
```

### Step 4: Deploy
```bash
git push heroku main
```

The app will build and deploy. View logs with:
```bash
heroku logs --tail
```

✅ **Backend deployed! URL: https://hirelens-api.herokuapp.com**

---

## **Option 4: Local Backend (For Development)**

Keep backend running locally for testing:

```bash
cd /Users/devanshusharma/Desktop/projects/resume-analyzer/server
npm run dev
```

Backend runs on `http://localhost:5001`

---

# **Step 2: Update Vercel with Backend URL**

Once you have your deployed backend URL:

### In Vercel Dashboard:
1. Go to https://vercel.com/dashboard
2. Click **resume-analyzer** project
3. Navigate to **Settings** → **Environment Variables**
4. Click **Add New** and fill in:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://your-backend-url.com` (e.g., `https://hirelens-production.up.railway.app`)
   - **Environments**: Select `Production`
5. Click **Save**

### Redeploy Frontend:
1. Go to **Deployments** tab
2. Click **Redeploy** on the latest commit
3. Wait for redeployment to finish (2 minutes)

✅ **Frontend now connects to your deployed backend!**

---

# **Testing the Full Stack**

Once both frontend and backend are deployed:

1. **Visit your frontend**: https://resume-analyzer-beta-rose.vercel.app
2. **Sign up** with email and password
3. **Upload a PDF resume** and enter a job description
4. **Analyze** and get results
5. **Export PDF** to download the report

---

# **Troubleshooting**

### "Connection refused" error
- Check backend URL is correct in Vercel env variables
- Verify backend is running/deployed
- Check CORS is enabled in backend

### Backend build fails
- Check Node version matches (use Node 18+)
- Verify all environment variables are set
- Check `npm start` works locally: `cd server && npm start`

### Uploads not working
- Ensure backend has write permissions for uploads directory
- Check `UPLOAD_DIR` environment variable
- File size must be < 5MB (or adjust `MAX_FILE_SIZE_MB`)

---

# **Quick Reference**

```
LOCAL DEVELOPMENT:
✓ Frontend: http://localhost:3002
✓ Backend: http://localhost:5001

PRODUCTION (with Railway):
✓ Frontend: https://resume-analyzer-beta-rose.vercel.app
✓ Backend: https://hirelens-production.up.railway.app
```

---

**Need help?** Check the main [README.md](./README.md) or create an issue on GitHub.
