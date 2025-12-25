# FreshLogic - Google Cloud Deployment Guide

**Platform:** Google Cloud  
**Services:** Cloud Run, Firestore, Firebase Hosting  
**Cost:** Free tier eligible

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GOOGLE CLOUD                              │
│                                                              │
│  ┌──────────────┐      ┌──────────────┐    ┌─────────────┐  │
│  │   Firebase   │      │  Cloud Run   │    │  Firestore  │  │
│  │   Hosting    │─────▶│   Backend    │───▶│  Database   │  │
│  │  (React App) │ API  │   (FastAPI)  │    │ (Persistence)│  │
│  └──────────────┘      └──────────────┘    └─────────────┘  │
│                               │                              │
│                        ┌──────┴──────┐                       │
│                        │   Secret    │                       │
│                        │   Manager   │                       │
│                        └─────────────┘                       │
└─────────────────────────────────────────────────────────────┘

Stored in Firestore:
• Analysis reports history
• Chat conversation history  
• User sessions
```

---

## Prerequisites

- Google Cloud account with billing enabled
- Google Cloud CLI installed
- Node.js 18+ (for frontend)
- Python 3.10+ (for backend)

---

## Step 1: Setup Google Cloud Project

```bash
# Install gcloud CLI: https://cloud.google.com/sdk/docs/install

# Login and create project
gcloud auth login
gcloud projects create freshlogic-app --name="FreshLogic"
gcloud config set project freshlogic-app

# Enable required APIs
gcloud services enable \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    secretmanager.googleapis.com \
    firestore.googleapis.com \
    translate.googleapis.com \
    routes.googleapis.com \
    geocoding-backend.googleapis.com
```

---

## Step 2: Setup Firestore (Persistence)

```bash
# Create Firestore database in Native mode
gcloud firestore databases create --location=us-central1
```

### Collections Structure

| Collection | Document Fields | Purpose |
|------------|-----------------|---------|
| `analyses` | session_id, origin, destination, crop, risk, agent_insight, timestamp | Analysis history |
| `chats` | session_id, messages[], timestamp | Chat history per session |
| `sessions` | session_id, context, created_at, expires_at | Session cache |

---

## Step 3: Store API Keys in Secret Manager

```bash
# Create secrets (replace with your actual keys)
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create gemini-api-key --data-file=-
echo -n "YOUR_GOOGLE_API_KEY" | gcloud secrets create google-api-key --data-file=-

# Get project number
PROJECT_NUMBER=$(gcloud projects describe freshlogic-app --format='value(projectNumber)')

# Grant Cloud Run access to secrets
gcloud secrets add-iam-policy-binding gemini-api-key \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding google-api-key \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

---

## Step 4: Create Backend Dockerfile

Create `backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

Create `backend/.dockerignore`:

```
__pycache__
*.pyc
.env
.git
*.md
.venv
```

---

## Step 5: Deploy Backend to Cloud Run

```bash
cd backend

gcloud run deploy freshlogic-api \
    --source . \
    --region us-central1 \
    --allow-unauthenticated \
    --set-secrets="GEMINI_API_KEY=gemini-api-key:latest,GOOGLE_API_KEY=google-api-key:latest" \
    --memory 1Gi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 5

# Save the URL output (e.g., https://freshlogic-api-xxx-uc.a.run.app)
```

---

## Step 6: Deploy Frontend (React/Vite)

### Option A: Firebase Hosting via Console UI

**1. Go to Firebase Console:**
- Open https://console.firebase.google.com
- Click **"Add project"** → Select your GCP project `freshlogic-app`

**2. Enable Hosting:**
- In left sidebar, click **Hosting**
- Click **"Get started"**
- Follow the setup wizard (can skip CLI steps for now)

**3. Deploy via UI:**
- Build your frontend locally:
  ```bash
  cd frontend
  echo "VITE_API_URL=https://your-backend-url.run.app" > .env.production
  npm install && npm run build
  ```
- In Firebase Console → Hosting → Click **"Upload files"** (drag & drop the `dist` folder contents)
- Or use the CLI: `firebase deploy --only hosting`

---

### Option B: Cloud Run via Console UI (Recommended)

**Step 1: Open Cloud Run**
- Go to https://console.cloud.google.com/run
- Click **"CREATE SERVICE"**

**Step 2: Choose Source**
- Select **"Continuously deploy from a repository"** OR
- Select **"Upload container"** if you have a Docker image

**For Source Repository:**
1. Click **"Set up with Cloud Build"**
2. Connect your GitHub/GitLab repo
3. Select branch: `main`
4. Build type: **Dockerfile** → Path: `/frontend/Dockerfile`

**For Direct Upload (Easiest):**
1. Select **"Deploy one revision from an existing container image"**
2. First, build and push your image:
   ```bash
   cd frontend
   gcloud builds submit --tag gcr.io/freshlogic-app/freshlogic-ui
   ```
3. Enter image URL: `gcr.io/freshlogic-app/freshlogic-ui`

**Step 3: Configure Service**
| Setting | Value |
|---------|-------|
| Service name | `freshlogic-ui` |
| Region | `us-central1` |
| CPU allocation | "CPU only during request processing" |
| Autoscaling min | `0` |
| Autoscaling max | `3` |
| Authentication | **"Allow unauthenticated invocations"** ✅ |

**Step 4: Container Settings**
- Click **"Container, Networking, Security"** to expand
- Container port: `8080`
- Memory: `256 MiB`
- CPU: `1`

**Step 5: Environment Variables (Build Args)**
- Under **"Variables & Secrets"** tab
- Add: `VITE_API_URL` = `https://freshlogic-api-xxx.run.app`

**Step 6: Deploy**
- Click **"CREATE"**
- Wait 2-3 minutes for build & deployment
- Copy your URL: `https://freshlogic-ui-xxx-uc.a.run.app`

---

### Option C: Cloud Storage Static Hosting via Console UI

**Step 1: Create Bucket**
- Go to https://console.cloud.google.com/storage
- Click **"CREATE BUCKET"**
- Name: `freshlogic-ui` (must be globally unique)
- Region: `us-central1`
- Click **"CREATE"**

**Step 2: Upload Files**
- Build locally: `npm run build`
- Click **"UPLOAD FILES"** or **"UPLOAD FOLDER"**
- Upload entire contents of `dist/` folder

**Step 3: Make Public**
- Go to **Permissions** tab
- Click **"GRANT ACCESS"**
- New principal: `allUsers`
- Role: **"Storage Object Viewer"**
- Click **"SAVE"**

**Step 4: Enable Website**
- Click bucket name → **"Edit website configuration"**
- Index page: `index.html`
- Error page: `index.html` (for SPA routing)
- Click **"SAVE"**

**Step 5: Access Your Site**
- URL: `https://storage.googleapis.com/freshlogic-ui/index.html`

---

### Console UI Comparison

| Method | Console Location | Setup Time | Difficulty |
|--------|------------------|------------|------------|
| Firebase Hosting | console.firebase.google.com | 5 min | ⭐ Easy |
| Cloud Run | console.cloud.google.com/run | 10 min | ⭐⭐ Medium |
| Cloud Storage | console.cloud.google.com/storage | 15 min | ⭐ Easy |

**Quick Links:**
- 🔥 Firebase Console: https://console.firebase.google.com
- ☁️ Cloud Run: https://console.cloud.google.com/run
- 🪣 Cloud Storage: https://console.cloud.google.com/storage

---

## Step 7: Add Persistence to Backend

Add to `backend/requirements.txt`:

```
google-cloud-firestore
```

Create `backend/services/persistence_service.py`:

```python
"""
Firestore Persistence Service
Stores analysis history, chat history, and sessions
"""
import os
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from google.cloud import firestore

# Initialize Firestore client
db = firestore.Client()

class PersistenceService:
    def __init__(self):
        self.analyses_ref = db.collection('analyses')
        self.chats_ref = db.collection('chats')
        self.sessions_ref = db.collection('sessions')
    
    # ========== ANALYSIS HISTORY ==========
    
    def save_analysis(self, session_id: str, data: dict) -> str:
        """Save an analysis report to history"""
        doc_ref = self.analyses_ref.document(session_id)
        doc_ref.set({
            'session_id': session_id,
            'origin': data.get('origin'),
            'destination': data.get('destination'),
            'crop_type': data.get('crop_type'),
            'distance_km': data.get('distance_km'),
            'duration_hours': data.get('duration_hours'),
            'spoilage_risk': data.get('risk_analysis', {}).get('spoilage_risk'),
            'status': data.get('risk_analysis', {}).get('status'),
            'agent_insight': data.get('agent_insight'),
            'timestamp': firestore.SERVER_TIMESTAMP
        })
        return session_id
    
    def get_analysis_history(self, limit: int = 20) -> List[Dict]:
        """Get recent analysis history"""
        docs = self.analyses_ref.order_by(
            'timestamp', direction=firestore.Query.DESCENDING
        ).limit(limit).stream()
        
        return [doc.to_dict() for doc in docs]
    
    def get_analysis(self, session_id: str) -> Optional[Dict]:
        """Get a specific analysis by session ID"""
        doc = self.analyses_ref.document(session_id).get()
        return doc.to_dict() if doc.exists else None
    
    # ========== CHAT HISTORY ==========
    
    def save_chat_message(self, session_id: str, role: str, message: str):
        """Append a chat message to history"""
        doc_ref = self.chats_ref.document(session_id)
        doc = doc_ref.get()
        
        if doc.exists:
            doc_ref.update({
                'messages': firestore.ArrayUnion([{
                    'role': role,
                    'message': message,
                    'timestamp': datetime.utcnow().isoformat()
                }]),
                'updated_at': firestore.SERVER_TIMESTAMP
            })
        else:
            doc_ref.set({
                'session_id': session_id,
                'messages': [{
                    'role': role,
                    'message': message,
                    'timestamp': datetime.utcnow().isoformat()
                }],
                'created_at': firestore.SERVER_TIMESTAMP,
                'updated_at': firestore.SERVER_TIMESTAMP
            })
    
    def get_chat_history(self, session_id: str) -> List[Dict]:
        """Get chat history for a session"""
        doc = self.chats_ref.document(session_id).get()
        if doc.exists:
            return doc.to_dict().get('messages', [])
        return []
    
    # ========== SESSION CACHE ==========
    
    def save_session(self, session_id: str, context: dict, ttl_hours: int = 24):
        """Save session context with TTL"""
        doc_ref = self.sessions_ref.document(session_id)
        doc_ref.set({
            'session_id': session_id,
            'context': context,
            'created_at': firestore.SERVER_TIMESTAMP,
            'expires_at': datetime.utcnow() + timedelta(hours=ttl_hours)
        })
    
    def get_session(self, session_id: str) -> Optional[Dict]:
        """Get session context if not expired"""
        doc = self.sessions_ref.document(session_id).get()
        if doc.exists:
            data = doc.to_dict()
            if data.get('expires_at') and data['expires_at'] > datetime.utcnow():
                return data.get('context')
        return None
    
    def delete_expired_sessions(self):
        """Cleanup expired sessions (run periodically)"""
        expired = self.sessions_ref.where(
            'expires_at', '<', datetime.utcnow()
        ).stream()
        
        for doc in expired:
            doc.reference.delete()


# Singleton instance
persistence_service = PersistenceService()
```

---

## Step 8: Update main.py to Use Persistence

Add these imports and update endpoints:

```python
from services.persistence_service import persistence_service

# In /analyze endpoint, after generating response:
persistence_service.save_analysis(session_id, {
    'origin': request.origin,
    'destination': request.destination,
    'crop_type': request.crop_type,
    'distance_km': route_data['distance_km'],
    'duration_hours': duration_hours,
    'risk_analysis': risk_analysis,
    'agent_insight': agent_response
})

# In /chat endpoint:
persistence_service.save_chat_message(session_id, 'user', request.message)
persistence_service.save_chat_message(session_id, 'assistant', response)

# Add new endpoint for history:
@app.get("/history")
def get_history(limit: int = 20):
    """Get analysis history"""
    return {"analyses": persistence_service.get_analysis_history(limit)}

@app.get("/history/{session_id}")
def get_analysis_detail(session_id: str):
    """Get specific analysis with chat history"""
    analysis = persistence_service.get_analysis(session_id)
    chats = persistence_service.get_chat_history(session_id)
    return {"analysis": analysis, "chat_history": chats}
```

---

## Verification Checklist

- [ ] Cloud Run service deployed and responding at `/health`
- [ ] Firebase Hosting live at `https://your-app.web.app`
- [ ] Firestore collections created (analyses, chats, sessions)
- [ ] API keys working (test with `/analyze` endpoint)
- [ ] History endpoint returning saved analyses
- [ ] Chat messages being persisted

---

## Cost Estimate (Free Tier)

| Service | Free Tier | Your Usage |
|---------|-----------|------------|
| Cloud Run | 2M requests/month | ✅ Under limit |
| Firestore | 1GB storage, 50K reads/day | ✅ Under limit |
| Firebase Hosting | 10GB/month | ✅ Under limit |
| Secret Manager | 6 active versions | ✅ Under limit |
| **Total** | | **$0/month** |

---

## Quick Deploy Script

Save as `deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Deploying FreshLogic..."

# Deploy Backend
cd backend
gcloud run deploy freshlogic-api --source . --region us-central1 --allow-unauthenticated
API_URL=$(gcloud run services describe freshlogic-api --region us-central1 --format='value(status.url)')
echo "✅ Backend: $API_URL"

# Deploy Frontend
cd ../frontend
echo "VITE_API_URL=$API_URL" > .env.production
npm run build
firebase deploy --only hosting
echo "✅ Frontend: https://freshlogic.web.app"

echo "🎉 Deployment complete!"
```

---

*Last updated: December 2025*
