# 🎯 Complete Setup Guide - YOLO Video Detection

## Quick Fix for Excel Download Issue

The issue is that the frontend is using **mock data** and not connected to the actual backend API.

### ✅ Solution: Connect Frontend to Backend

## 🚀 Step-by-Step Setup

### 1. Setup Backend

```bash
# Navigate to project root
cd yolo-video-detection

# Create virtual environment (if not already done)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install additional backend dependencies
pip install python-multipart aiofiles

# Start backend server
python backend_api.py
```

Backend will run on: **http://localhost:8000**

### 2. Setup Frontend

```bash
# Open NEW terminal
cd yolo-video-detection/frontend

# Install dependencies
npm install

# Update to use real API
# Copy App_REAL.jsx to App.jsx
cp src/App_REAL.jsx src/App.jsx

# Start frontend
npm run dev
```

Frontend will run on: **http://localhost:3000** or **http://localhost:5173**

---

## 🔧 File Changes Needed

### Replace `src/App.jsx`

Use the `App_REAL.jsx` file which includes:
- Real API integration
- Proper file downloads
- Job status polling
- Error handling

```bash
cd frontend/src
cp App_REAL.jsx App.jsx
```

---

## 📡 API Endpoints

The backend provides these endpoints:

### Detection
- `POST /api/detect` - Upload video and start detection
- `GET /api/status/{job_id}` - Get job status

### Downloads
- `GET /api/download/{job_id}/excel` - Download Excel
- `GET /api/download/{job_id}/csv` - Download CSV  
- `GET /api/download/{job_id}/video` - Download video

### Utility
- `GET /api/classes` - Get available classes
- `GET /api/models` - Get YOLO models
- `GET /api/jobs` - List all jobs

---

## 🎯 Testing the System

### 1. Start Backend

Terminal 1:
```bash
cd yolo-video-detection
venv\Scripts\activate  # Windows
python backend_api.py
```

You should see:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 2. Start Frontend

Terminal 2:
```bash
cd yolo-video-detection/frontend
npm run dev
```

You should see:
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### 3. Test Upload

1. Open http://localhost:3000
2. Upload a video file
3. Select objects (e.g., person, car)
4. Click "Start Detection"
5. Wait for processing
6. Click "Download Excel" - **File will actually download!**  

---

## 🐛 Troubleshooting

### Issue: Excel download doesn't work

**Cause:** Frontend is using mock data instead of real API

**Solution:**
```bash
cd frontend/src
cp App_REAL.jsx App.jsx
# Restart frontend
```

### Issue: CORS errors

**Solution:** Backend already has CORS configured for `localhost:3000` and `localhost:5173`

If you need different port:
```python
# In backend_api.py
allow_origins=["http://localhost:YOUR_PORT"]
```

### Issue: Backend not found

**Check:**
1. Backend is running: http://localhost:8000
2. Frontend proxy is configured in `vite.config.js`
3. API calls go to `/api/*`

### Issue: Video upload fails

**Check:**
1. File size < 500MB
2. File format: mp4, avi, mov, mkv
3. Backend logs for errors

---

## 📊 How It Works

### Flow:

1. **Upload Video**
   ```
   Frontend → POST /api/detect → Backend
   ```
   - Creates job ID
   - Saves video to disk
   - Returns job ID

2. **Processing**
   ```
   Backend (Background Task):
   - Initialize YOLO detector
   - Process video frame-by-frame
   - Update job status
   - Export to Excel
   ```

3. **Status Polling**
   ```
   Frontend → GET /api/status/{job_id} (every 1 second)
   - Gets progress %
   - Checks if complete
   ```

4. **Download Results**
   ```
   Frontend → GET /api/download/{job_id}/excel
   Backend → Returns file
   Browser → Downloads file
   ```

---

## 🎨 File Structure

```
yolo-video-detection/
├── backend_api.py              # ✅ FastAPI server
├── src/
│   ├── yolo_detector.py        # YOLO engine
│   ├── video_processor.py      # Video processing
│   └── excel_exporter.py       # Excel export
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # ❌ Mock version
│   │   ├── App_REAL.jsx       # ✅ Real API version
│   │   ├── components/
│   │   └── utils/
│   │       └── api.js         # ✅ Updated API calls
│   └── package.json
└── jobs/                       # Created automatically
    └── {job-id}/
        ├── input_video.mp4
        ├── output_video.mp4
        └── results.xlsx
```

---

## 🚀 Production Deployment

### Backend (Railway / Render / Heroku)

```bash
# Install gunicorn
pip install gunicorn

# Run with gunicorn
gunicorn backend_api:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Frontend (Vercel / Netlify)

```bash
# Build
npm run build

# Deploy
vercel --prod
# or
netlify deploy --prod --dir=dist
```

### Environment Variables

Backend `.env`:
```env
CORS_ORIGINS=https://your-frontend-domain.com
MAX_UPLOAD_SIZE=500
```

Frontend `.env`:
```env
VITE_API_URL=https://your-backend-domain.com
```

---

## ✅ Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000/5173
- [ ] `App_REAL.jsx` copied to `App.jsx`
- [ ] YOLO model downloaded (happens automatically)
- [ ] Test video upload works
- [ ] Test Excel download works
- [ ] Test video download works

---

## 📝 Summary

**The fix:**
1. Use `backend_api.py` for real backend
2. Replace `App.jsx` with `App_REAL.jsx`
3. Frontend now actually downloads files

**Before:** Mock data, simulated downloads
**After:** Real processing, actual file downloads

---

Need help? Check:
1. Backend logs in terminal 1
2. Frontend console (F12) in browser
3. Network tab (F12) for API calls

**Now Excel downloads will actually work! 🎉**
